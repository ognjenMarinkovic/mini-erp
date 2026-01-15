import { Injectable, NotFoundException, ForbiddenException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { InvoiceStatus } from '@prisma/client';
import { EmailService } from '../notifications/email.service';

@Injectable()
export class InvoicesService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => EmailService))
    private emailService: EmailService,
  ) {}

  async create(companyId: string, createInvoiceDto: CreateInvoiceDto) {
    // Provera da li klijent postoji i pripada kompaniji
    const client = await this.prisma.client.findUnique({
      where: { id: createInvoiceDto.clientId },
    });

    if (!client || client.companyId !== companyId) {
      throw new ForbiddenException('Klijent nije pronađen ili ne pripada vašoj kompaniji');
    }

    // Generisanje broja fakture
    const invoiceNumber = await this.generateInvoiceNumber(companyId);

    // Kalkulacija ukupnog iznosa
    const totalAmount = createInvoiceDto.items.reduce(
      (sum, item) => sum + item.quantity * item.price,
      0,
    );

    // Kreiranje fakture sa stavkama (transakcija)
    const invoice = await this.prisma.invoice.create({
      data: {
        number: invoiceNumber,
        companyId,
        clientId: createInvoiceDto.clientId,
        date: new Date(createInvoiceDto.date),
        dueDate: new Date(createInvoiceDto.dueDate),
        totalAmount,
        notes: createInvoiceDto.notes,
        items: {
          create: createInvoiceDto.items.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            price: item.price,
            total: item.quantity * item.price,
          })),
        },
      },
      include: {
        client: true,
        items: true,
      },
    });

    // Slanje email notifikacije klijentu
    try {
      const invoiceWithCompany = await this.prisma.invoice.findUnique({
        where: { id: invoice.id },
        include: {
          client: true,
          company: true,
          items: true,
        },
      });

      if (invoiceWithCompany) {
        await this.emailService.sendNewInvoiceEmail(invoiceWithCompany);
      }
    } catch (error) {
      // Email greška ne treba da blokira kreiranje fakture
      console.error('Failed to send new invoice email:', error.message);
    }

    return invoice;
  }

  async findAll(
    companyId: string,
    filters?: {
      search?: string;
      status?: InvoiceStatus;
      clientId?: string;
      page?: number;
      limit?: number;
    },
  ) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = { companyId };

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.clientId) {
      where.clientId = filters.clientId;
    }

    if (filters?.search) {
      where.OR = [
        { number: { contains: filters.search, mode: 'insensitive' as const } },
        { client: { name: { contains: filters.search, mode: 'insensitive' as const } } },
      ];
    }

    const [invoices, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: 'desc' },
        include: {
          client: {
            select: {
              id: true,
              name: true,
              city: true,
            },
          },
          _count: {
            select: { payments: true },
          },
        },
      }),
      this.prisma.invoice.count({ where }),
    ]);

    return {
      data: invoices,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, companyId: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: {
        client: true,
        items: true,
        payments: {
          orderBy: { paymentDate: 'desc' },
        },
      },
    });

    if (!invoice) {
      throw new NotFoundException('Faktura nije pronađena');
    }

    if (invoice.companyId !== companyId) {
      throw new ForbiddenException('Nemate pristup ovoj fakturi');
    }

    return invoice;
  }

  async update(id: string, companyId: string, updateInvoiceDto: UpdateInvoiceDto) {
    // Provera da li faktura postoji
    const invoice = await this.findOne(id, companyId);

    // Ne dozvoli izmenu ako je faktura plaćena
    if (invoice.status === 'PAID') {
      throw new ForbiddenException('Ne možete izmeniti plaćenu fakturu');
    }

    // Ako se menjaju stavke, obriši stare i kreiraj nove
    if (updateInvoiceDto.items) {
      const totalAmount = updateInvoiceDto.items.reduce(
        (sum, item) => sum + item.quantity * item.price,
        0,
      );

      return this.prisma.invoice.update({
        where: { id },
        data: {
          date: updateInvoiceDto.date ? new Date(updateInvoiceDto.date) : undefined,
          dueDate: updateInvoiceDto.dueDate ? new Date(updateInvoiceDto.dueDate) : undefined,
          notes: updateInvoiceDto.notes,
          totalAmount,
          items: {
            deleteMany: {},
            create: updateInvoiceDto.items.map((item) => ({
              description: item.description,
              quantity: item.quantity,
              price: item.price,
              total: item.quantity * item.price,
            })),
          },
        },
        include: {
          client: true,
          items: true,
        },
      });
    }

    return this.prisma.invoice.update({
      where: { id },
      data: {
        date: updateInvoiceDto.date ? new Date(updateInvoiceDto.date) : undefined,
        dueDate: updateInvoiceDto.dueDate ? new Date(updateInvoiceDto.dueDate) : undefined,
        notes: updateInvoiceDto.notes,
      },
      include: {
        client: true,
        items: true,
      },
    });
  }

  async remove(id: string, companyId: string) {
    const invoice = await this.findOne(id, companyId);

    // Ne dozvoli brisanje ako ima uplate
    if (invoice.payments.length > 0) {
      throw new ForbiddenException('Ne možete obrisati fakturu koja ima evidentirane uplate');
    }

    await this.prisma.invoice.delete({
      where: { id },
    });

    return { message: 'Faktura uspešno obrisana' };
  }

  async updateStatus(id: string, companyId: string) {
    const invoice = await this.findOne(id, companyId);

    let status: InvoiceStatus;

    if (Number(invoice.paidAmount) >= Number(invoice.totalAmount)) {
      status = 'PAID';
    } else if (Number(invoice.paidAmount) > 0) {
      status = 'PARTIAL';
    } else if (new Date() > invoice.dueDate) {
      status = 'OVERDUE';
    } else {
      status = 'PENDING';
    }

    return this.prisma.invoice.update({
      where: { id },
      data: { status },
    });
  }

  private async generateInvoiceNumber(companyId: string): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.invoice.count({
      where: {
        companyId,
        date: {
          gte: new Date(`${year}-01-01`),
          lte: new Date(`${year}-12-31`),
        },
      },
    });

    const invoiceNumber = count + 1;
    return `${year}-${invoiceNumber.toString().padStart(4, '0')}`;
  }
}
