import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTimeEntryDto, UpdateTimeEntryDto, StopTimerDto } from './dto/create-time-entry.dto';

@Injectable()
export class TimeTrackingService {
  constructor(private prisma: PrismaService) {}

  // Kreiraj novi time entry (start timer)
  async create(dto: CreateTimeEntryDto, userId: string, companyId: string) {
    // Proveri da klijent pripada kompaniji
    const client = await this.prisma.client.findFirst({
      where: { id: dto.clientId, companyId },
    });

    if (!client) {
      throw new ForbiddenException('Klijent ne pripada vašoj kompaniji');
    }

    // Proveri task ako je prosleđen
    if (dto.taskId) {
      const task = await this.prisma.task.findFirst({
        where: { id: dto.taskId, clientId: dto.clientId },
      });
      if (!task) {
        throw new NotFoundException('Task nije pronađen ili ne pripada ovom klijentu');
      }
    }

    // Izračunaj duration ako je endTime prosleđen
    let duration: number | null = null;
    if (dto.endTime) {
      const start = new Date(dto.startTime);
      const end = new Date(dto.endTime);
      duration = Math.round((end.getTime() - start.getTime()) / (1000 * 60)); // u minutima
    }

    return this.prisma.timeEntry.create({
      data: {
        clientId: dto.clientId,
        taskId: dto.taskId,
        userId,
        description: dto.description,
        startTime: new Date(dto.startTime),
        endTime: dto.endTime ? new Date(dto.endTime) : null,
        duration,
        billable: dto.billable ?? true,
        hourlyRate: dto.hourlyRate,
      },
      include: {
        client: { select: { id: true, name: true } },
        task: { select: { id: true, title: true } },
        user: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  // Zaustavi timer (stop)
  async stopTimer(id: string, dto: StopTimerDto, userId: string, companyId: string) {
    const entry = await this.findOne(id, companyId);

    if (entry.userId !== userId) {
      throw new ForbiddenException('Možete zaustaviti samo svoj timer');
    }

    if (entry.endTime) {
      throw new BadRequestException('Timer je već zaustavljen');
    }

    const endTime = new Date(dto.endTime);
    const duration = Math.round((endTime.getTime() - entry.startTime.getTime()) / (1000 * 60));

    return this.prisma.timeEntry.update({
      where: { id },
      data: {
        endTime,
        duration,
      },
      include: {
        client: { select: { id: true, name: true } },
        task: { select: { id: true, title: true } },
        user: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  // Dohvati sve time entries za kompaniju
  async findAll(
    companyId: string,
    filters?: {
      clientId?: string;
      taskId?: string;
      userId?: string;
      startDate?: string;
      endDate?: string;
      billable?: boolean;
    },
  ) {
    const where: any = {
      client: { companyId },
    };

    if (filters?.clientId) where.clientId = filters.clientId;
    if (filters?.taskId) where.taskId = filters.taskId;
    if (filters?.userId) where.userId = filters.userId;
    if (filters?.billable !== undefined) where.billable = filters.billable;

    if (filters?.startDate || filters?.endDate) {
      where.startTime = {};
      if (filters.startDate) where.startTime.gte = new Date(filters.startDate);
      if (filters.endDate) where.startTime.lte = new Date(filters.endDate);
    }

    const entries = await this.prisma.timeEntry.findMany({
      where,
      orderBy: { startTime: 'desc' },
      include: {
        client: { select: { id: true, name: true } },
        task: { select: { id: true, title: true } },
        user: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    // Izračunaj ukupno vreme
    const totalMinutes = entries.reduce((sum, e) => sum + (e.duration || 0), 0);
    const totalHours = Math.floor(totalMinutes / 60);
    const remainingMinutes = totalMinutes % 60;

    return {
      entries,
      summary: {
        totalEntries: entries.length,
        totalMinutes,
        totalFormatted: `${totalHours}h ${remainingMinutes}m`,
        billableMinutes: entries.filter((e) => e.billable).reduce((sum, e) => sum + (e.duration || 0), 0),
      },
    };
  }

  // Dohvati aktivne timere (bez endTime)
  async getActiveTimers(userId: string, companyId: string) {
    return this.prisma.timeEntry.findMany({
      where: {
        userId,
        endTime: null,
        client: { companyId },
      },
      include: {
        client: { select: { id: true, name: true } },
        task: { select: { id: true, title: true } },
      },
    });
  }

  // Dohvati jedan time entry
  async findOne(id: string, companyId: string) {
    const entry = await this.prisma.timeEntry.findUnique({
      where: { id },
      include: {
        client: { select: { id: true, name: true, companyId: true } },
        task: { select: { id: true, title: true } },
        user: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    if (!entry) {
      throw new NotFoundException('Time entry nije pronađen');
    }

    if (entry.client.companyId !== companyId) {
      throw new ForbiddenException('Nemate pristup ovom time entry-u');
    }

    return entry;
  }

  // Ažuriraj time entry
  async update(id: string, dto: UpdateTimeEntryDto, companyId: string) {
    await this.findOne(id, companyId);

    // Izračunaj duration ako su oba vremena prisutna
    let duration: number | undefined;
    if (dto.startTime && dto.endTime) {
      const start = new Date(dto.startTime);
      const end = new Date(dto.endTime);
      duration = Math.round((end.getTime() - start.getTime()) / (1000 * 60));
    } else if (dto.endTime) {
      // Samo endTime se menja - dohvati startTime iz baze
      const existing = await this.prisma.timeEntry.findUnique({ where: { id } });
      if (existing) {
        const end = new Date(dto.endTime);
        duration = Math.round((end.getTime() - existing.startTime.getTime()) / (1000 * 60));
      }
    }

    return this.prisma.timeEntry.update({
      where: { id },
      data: {
        taskId: dto.taskId,
        description: dto.description,
        startTime: dto.startTime ? new Date(dto.startTime) : undefined,
        endTime: dto.endTime ? new Date(dto.endTime) : undefined,
        duration,
        billable: dto.billable,
        hourlyRate: dto.hourlyRate,
      },
      include: {
        client: { select: { id: true, name: true } },
        task: { select: { id: true, title: true } },
        user: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  // Obriši time entry
  async remove(id: string, companyId: string) {
    await this.findOne(id, companyId);

    await this.prisma.timeEntry.delete({ where: { id } });

    return { message: 'Time entry uspešno obrisan' };
  }

  // Statistika za dashboard
  async getStats(companyId: string, period: 'day' | 'week' | 'month' = 'week') {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'day':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        const dayOfWeek = now.getDay();
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
    }

    const entries = await this.prisma.timeEntry.findMany({
      where: {
        client: { companyId },
        startTime: { gte: startDate },
      },
      include: {
        client: { select: { name: true } },
      },
    });

    const totalMinutes = entries.reduce((sum, e) => sum + (e.duration || 0), 0);
    const billableMinutes = entries.filter((e) => e.billable).reduce((sum, e) => sum + (e.duration || 0), 0);

    // Grupiši po klijentu
    const byClient: Record<string, number> = {};
    entries.forEach((e) => {
      const clientName = e.client.name;
      byClient[clientName] = (byClient[clientName] || 0) + (e.duration || 0);
    });

    return {
      period,
      totalMinutes,
      totalHours: Math.round(totalMinutes / 60 * 10) / 10,
      billableMinutes,
      billableHours: Math.round(billableMinutes / 60 * 10) / 10,
      entriesCount: entries.length,
      byClient,
    };
  }
}
