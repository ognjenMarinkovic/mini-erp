import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto, TaskStatus } from './dto/update-task.dto';
import { MoveTaskDto } from './dto/move-task.dto';

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  // Kreiranje novog taska (Admin ili Client)
  async create(
    createTaskDto: CreateTaskDto,
    createdById: string,
    createdByType: 'ADMIN' | 'CLIENT',
    companyId?: string,
  ) {
    // Ako je ADMIN, proveri da li klijent pripada njegovoj kompaniji
    if (createdByType === 'ADMIN' && companyId) {
      const client = await this.prisma.client.findFirst({
        where: { id: createTaskDto.clientId, companyId },
      });
      if (!client) {
        throw new ForbiddenException('Klijent ne pripada vašoj kompaniji');
      }
    }

    // Pronađi najveću poziciju u BACKLOG koloni za ovog klijenta
    const maxPosition = await this.prisma.task.aggregate({
      where: {
        clientId: createTaskDto.clientId,
        status: 'BACKLOG',
      },
      _max: { position: true },
    });

    const newPosition = (maxPosition._max.position ?? -1) + 1;

    return this.prisma.task.create({
      data: {
        ...createTaskDto,
        deadline: createTaskDto.deadline
          ? new Date(createTaskDto.deadline)
          : null,
        createdById,
        createdByType,
        status: 'BACKLOG', // Novi taskovi uvek idu u BACKLOG
        position: newPosition,
      },
      include: {
        client: {
          select: { id: true, name: true },
        },
        _count: { select: { comments: true } },
      },
    });
  }

  // Svi taskovi za klijenta (grupisani po statusu za Kanban)
  async findByClient(clientId: string, companyId?: string) {
    // Proveri pristup ako je companyId prosleđen
    if (companyId) {
      const client = await this.prisma.client.findFirst({
        where: { id: clientId, companyId },
      });
      if (!client) {
        throw new ForbiddenException('Nemate pristup ovom klijentu');
      }
    }

    const tasks = await this.prisma.task.findMany({
      where: { clientId },
      orderBy: [{ status: 'asc' }, { position: 'asc' }],
      include: {
        client: {
          select: { id: true, name: true },
        },
        _count: { select: { comments: true } },
      },
    });

    // Grupiši taskove po statusu za Kanban prikaz
    const kanbanColumns: Record<string, typeof tasks> = {
      ONBOARDING: [],
      BACKLOG: [],
      IN_PROGRESS: [],
      REVIEW: [],
      DONE: [],
      ARCHIVE: [],
    };

    tasks.forEach((task) => {
      if (kanbanColumns[task.status]) {
        kanbanColumns[task.status].push(task);
      }
    });

    return {
      columns: kanbanColumns,
      totalTasks: tasks.length,
    };
  }

  // Svi taskovi za kompaniju (Admin pregled)
  async findAllForCompany(companyId: string, clientId?: string) {
    const where: any = {
      client: { companyId },
    };

    if (clientId) {
      where.clientId = clientId;
    }

    const tasks = await this.prisma.task.findMany({
      where,
      orderBy: [{ status: 'asc' }, { position: 'asc' }],
      include: {
        client: {
          select: { id: true, name: true },
        },
        _count: { select: { comments: true } },
      },
    });

    return tasks;
  }

  // Jedan task sa detaljima
  async findOne(id: string, companyId?: string) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: {
        client: {
          select: { id: true, name: true, companyId: true },
        },
        comments: {
          orderBy: { createdAt: 'asc' },
          include: {
            attachments: true,
          },
        },
        _count: { select: { comments: true } },
      },
    });

    if (!task) {
      throw new NotFoundException('Task nije pronađen');
    }

    // Provera pristupa za admina
    if (companyId && task.client.companyId !== companyId) {
      throw new ForbiddenException('Nemate pristup ovom tasku');
    }

    return task;
  }

  // Ažuriranje taska (samo Admin)
  async update(id: string, updateTaskDto: UpdateTaskDto, companyId: string) {
    await this.findOne(id, companyId);

    return this.prisma.task.update({
      where: { id },
      data: {
        ...updateTaskDto,
        deadline: updateTaskDto.deadline
          ? new Date(updateTaskDto.deadline)
          : undefined,
      },
      include: {
        client: {
          select: { id: true, name: true },
        },
        _count: { select: { comments: true } },
      },
    });
  }

  // Premesti task u drugu kolonu (Kanban drag & drop) - samo Admin
  async moveTask(id: string, moveTaskDto: MoveTaskDto, companyId: string) {
    const task = await this.findOne(id, companyId);

    const { status: newStatus, position: newPosition } = moveTaskDto;
    const oldStatus = task.status;
    const oldPosition = task.position;

    // Ako se menja kolona
    if (oldStatus !== newStatus) {
      // Smanji pozicije taskova u staroj koloni
      await this.prisma.task.updateMany({
        where: {
          clientId: task.clientId,
          status: oldStatus,
          position: { gt: oldPosition },
        },
        data: {
          position: { decrement: 1 },
        },
      });

      // Povećaj pozicije taskova u novoj koloni
      await this.prisma.task.updateMany({
        where: {
          clientId: task.clientId,
          status: newStatus,
          position: { gte: newPosition },
        },
        data: {
          position: { increment: 1 },
        },
      });
    } else {
      // Promena pozicije unutar iste kolone
      if (newPosition > oldPosition) {
        // Pomeranje nadole
        await this.prisma.task.updateMany({
          where: {
            clientId: task.clientId,
            status: oldStatus,
            position: { gt: oldPosition, lte: newPosition },
          },
          data: {
            position: { decrement: 1 },
          },
        });
      } else if (newPosition < oldPosition) {
        // Pomeranje nagore
        await this.prisma.task.updateMany({
          where: {
            clientId: task.clientId,
            status: oldStatus,
            position: { gte: newPosition, lt: oldPosition },
          },
          data: {
            position: { increment: 1 },
          },
        });
      }
    }

    // Ažuriraj sam task
    return this.prisma.task.update({
      where: { id },
      data: {
        status: newStatus,
        position: newPosition,
      },
      include: {
        client: {
          select: { id: true, name: true },
        },
        _count: { select: { comments: true } },
      },
    });
  }

  // Brisanje taska (samo Admin)
  async remove(id: string, companyId: string) {
    const task = await this.findOne(id, companyId);

    // Smanji pozicije taskova posle obrisanog
    await this.prisma.task.updateMany({
      where: {
        clientId: task.clientId,
        status: task.status,
        position: { gt: task.position },
      },
      data: {
        position: { decrement: 1 },
      },
    });

    await this.prisma.task.delete({
      where: { id },
    });

    return { message: 'Task uspešno obrisan' };
  }

  // Statistika taskova za dashboard
  async getStats(companyId: string) {
    const stats = await this.prisma.task.groupBy({
      by: ['status'],
      where: {
        client: { companyId },
      },
      _count: true,
    });

    const totalTasks = stats.reduce((sum, s) => sum + s._count, 0);
    const statusCounts: Record<string, number> = {};
    stats.forEach((s) => {
      statusCounts[s.status] = s._count;
    });

    return {
      total: totalTasks,
      byStatus: statusCounts,
    };
  }
}
