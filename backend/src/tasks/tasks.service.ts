import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../notifications/email.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto, TaskStatus } from './dto/update-task.dto';
import { MoveTaskDto } from './dto/move-task.dto';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

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

    const task = await this.prisma.task.create({
      data: {
        clientId: createTaskDto.clientId,
        title: createTaskDto.title,
        description: createTaskDto.description,
        serviceType: createTaskDto.serviceType,
        deadline: createTaskDto.deadline
          ? new Date(createTaskDto.deadline)
          : null,
        startDate: createTaskDto.startDate
          ? new Date(createTaskDto.startDate)
          : null,
        endDate: createTaskDto.endDate
          ? new Date(createTaskDto.endDate)
          : null,
        isMilestone: createTaskDto.isMilestone ?? false,
        progress: createTaskDto.progress ?? 0,
        createdById,
        createdByType,
        status: 'BACKLOG', // Novi taskovi uvek idu u BACKLOG
        position: newPosition,
      },
      include: {
        client: {
          select: { id: true, name: true, companyId: true },
        },
        _count: { select: { comments: true } },
      },
    });

    // Pošalji email notifikaciju klijentima ako je Admin kreirao task
    if (createdByType === 'ADMIN') {
      this.sendTaskCreatedNotification(task);
    }

    return task;
  }

  // Helper metoda za slanje notifikacije o kreiranom tasku
  private async sendTaskCreatedNotification(task: any) {
    try {
      // Dohvati sve ClientUser emailove za ovog klijenta
      const clientUsers = await this.prisma.clientUser.findMany({
        where: { clientId: task.clientId, isActive: true },
        select: { email: true },
      });

      const emails = clientUsers.map((u) => u.email);
      if (emails.length === 0) return;

      // Dohvati ime kompanije
      const company = await this.prisma.company.findFirst({
        where: { id: task.client.companyId },
        select: { name: true },
      });

      await this.emailService.sendTaskCreatedEmail(
        emails,
        task,
        company?.name || 'Agencija',
      );
    } catch (error) {
      this.logger.error('Failed to send task created notification:', error);
    }
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

    const updateData: any = {
      title: updateTaskDto.title,
      description: updateTaskDto.description,
      serviceType: updateTaskDto.serviceType,
      status: updateTaskDto.status,
      isMilestone: updateTaskDto.isMilestone,
      progress: updateTaskDto.progress,
    };

    // Ukloni undefined vrednosti
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) delete updateData[key];
    });

    // Datum polja
    if (updateTaskDto.deadline !== undefined) {
      updateData.deadline = updateTaskDto.deadline ? new Date(updateTaskDto.deadline) : null;
    }
    if (updateTaskDto.startDate !== undefined) {
      updateData.startDate = updateTaskDto.startDate ? new Date(updateTaskDto.startDate) : null;
    }
    if (updateTaskDto.endDate !== undefined) {
      updateData.endDate = updateTaskDto.endDate ? new Date(updateTaskDto.endDate) : null;
    }

    return this.prisma.task.update({
      where: { id },
      data: updateData,
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

    // Pripremi dodatne podatke za Gantt (automatsko postavljanje datuma)
    const now = new Date();
    const additionalData: any = {};

    // Kada task uđe u IN_PROGRESS, postavi startDate (početak rada)
    if (newStatus === 'IN_PROGRESS' && oldStatus !== 'IN_PROGRESS' && !task.startDate) {
      additionalData.startDate = now;
    }

    // Kada task uđe u DONE, postavi endDate (završetak rada)
    if (newStatus === 'DONE' && oldStatus !== 'DONE') {
      additionalData.endDate = now;
      // Ako nije bio startDate (preskočen IN_PROGRESS), postavi i njega
      if (!task.startDate) {
        additionalData.startDate = now;
      }
    }

    // Ažuriraj sam task
    const updatedTask = await this.prisma.task.update({
      where: { id },
      data: {
        status: newStatus,
        position: newPosition,
        ...additionalData,
      },
      include: {
        client: {
          select: { id: true, name: true, companyId: true },
        },
        _count: { select: { comments: true } },
      },
    });

    // Pošalji email notifikaciju SAMO kada task uđe u REVIEW ili DONE
    if (oldStatus !== newStatus && (newStatus === 'REVIEW' || newStatus === 'DONE')) {
      this.sendTaskMovedNotification(updatedTask, oldStatus, newStatus);
    }

    return updatedTask;
  }

  // Helper metoda za slanje notifikacije o premještenom tasku
  private async sendTaskMovedNotification(
    task: any,
    oldStatus: string,
    newStatus: string,
  ) {
    try {
      // Dohvati sve ClientUser emailove za ovog klijenta
      const clientUsers = await this.prisma.clientUser.findMany({
        where: { clientId: task.clientId, isActive: true },
        select: { email: true },
      });

      const emails = clientUsers.map((u) => u.email);
      if (emails.length === 0) return;

      // Dohvati ime kompanije
      const company = await this.prisma.company.findFirst({
        where: { id: task.client.companyId },
        select: { name: true },
      });

      const companyName = company?.name || 'Agencija';

      // Pošalji odgovarajući email baziran na novom statusu
      if (newStatus === 'REVIEW') {
        // Task spreman za pregled - glavni email za klijenta
        await this.emailService.sendTaskReadyForReviewEmail(emails, task, companyName);
      } else if (newStatus === 'DONE') {
        // Task završen
        await this.emailService.sendTaskCompletedEmail(emails, task, companyName);
      }
    } catch (error) {
      this.logger.error('Failed to send task moved notification:', error);
    }
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

  // Gantt Chart - svi taskovi sa dependencies
  async getGantt(clientId: string, companyId: string) {
    // Proveri pristup
    const client = await this.prisma.client.findFirst({
      where: { id: clientId, companyId },
    });
    if (!client) {
      throw new ForbiddenException('Nemate pristup ovom klijentu');
    }

    // Dohvati sve taskove koji imaju startDate i endDate
    const tasks = await this.prisma.task.findMany({
      where: { clientId },
      orderBy: [{ startDate: 'asc' }, { createdAt: 'asc' }],
      include: {
        client: {
          select: { id: true, name: true },
        },
        dependentOn: {
          include: {
            dependsOnTask: {
              select: { id: true, title: true },
            },
          },
        },
        dependsOn: {
          include: {
            dependentTask: {
              select: { id: true, title: true },
            },
          },
        },
      },
    });

    // Dohvati sve dependencies za ovog klijenta
    const dependencies = await this.prisma.taskDependency.findMany({
      where: {
        dependentTask: { clientId },
      },
    });

    return {
      tasks,
      dependencies,
      client: {
        id: client.id,
        name: client.name,
      },
    };
  }

  // Ažuriraj datume taska (za Gantt drag)
  async updateDates(
    id: string,
    startDate: string | null,
    endDate: string | null,
    companyId: string,
  ) {
    await this.findOne(id, companyId);

    return this.prisma.task.update({
      where: { id },
      data: {
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
      },
      include: {
        client: {
          select: { id: true, name: true },
        },
      },
    });
  }

  // Ažuriraj progress taska
  async updateProgress(id: string, progress: number, companyId: string) {
    await this.findOne(id, companyId);

    return this.prisma.task.update({
      where: { id },
      data: { progress },
      include: {
        client: {
          select: { id: true, name: true },
        },
      },
    });
  }
}
