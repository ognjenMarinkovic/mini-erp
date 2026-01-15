import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@Injectable()
export class ClientsService {
  constructor(private prisma: PrismaService) {}

  async create(companyId: string, createClientDto: CreateClientDto) {
    return this.prisma.client.create({
      data: {
        ...createClientDto,
        companyId,
      },
    });
  }

  async findAll(companyId: string, search?: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const where = {
      companyId,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { city: { contains: search, mode: 'insensitive' as const } },
          { email: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const [clients, total] = await Promise.all([
      this.prisma.client.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { invoices: true },
          },
        },
      }),
      this.prisma.client.count({ where }),
    ]);

    return {
      data: clients,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, companyId: string) {
    const client = await this.prisma.client.findUnique({
      where: { id },
      include: {
        invoices: {
          orderBy: { date: 'desc' },
          take: 10,
        },
        _count: {
          select: { invoices: true },
        },
      },
    });

    if (!client) {
      throw new NotFoundException('Klijent nije pronađen');
    }

    if (client.companyId !== companyId) {
      throw new ForbiddenException('Nemate pristup ovom klijentu');
    }

    return client;
  }

  async update(id: string, companyId: string, updateClientDto: UpdateClientDto) {
    // Provera da li klijent postoji i pripada kompaniji
    await this.findOne(id, companyId);

    return this.prisma.client.update({
      where: { id },
      data: updateClientDto,
    });
  }

  async remove(id: string, companyId: string) {
    // Provera da li klijent postoji i pripada kompaniji
    const client = await this.findOne(id, companyId);

    // Provera da li klijent ima fakture
    const invoiceCount = await this.prisma.invoice.count({
      where: { clientId: id },
    });

    if (invoiceCount > 0) {
      throw new ForbiddenException(
        `Ne možete obrisati klijenta koji ima ${invoiceCount} faktura. Prvo obrišite fakture.`,
      );
    }

    await this.prisma.client.delete({
      where: { id },
    });

    return { message: 'Klijent uspešno obrisan' };
  }
}
