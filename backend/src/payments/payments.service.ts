import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { InvoicesService } from '../invoices/invoices.service';
import { EmailService } from '../notifications/email.service';

@Injectable()
export class PaymentsService {
  constructor(
    private prisma: PrismaService,
    private invoicesService: InvoicesService,
    private emailService: EmailService,
  ) {}

  async create(companyId: string, createPaymentDto: CreatePaymentDto) {
    // Provera da li faktura postoji i pripada kompaniji
    const invoice = await this.invoicesService.findOne(
      createPaymentDto.invoiceId,
      companyId,
    );

    // Provera da li je iznos validan
    const remainingAmount = Number(invoice.totalAmount) - Number(invoice.paidAmount);
    if (createPaymentDto.amount > remainingAmount) {
      throw new BadRequestException(
        `Iznos uplate (${createPaymentDto.amount}) je veći od preostalog duga (${remainingAmount})`,
      );
    }

    // Kreiranje uplate i ažuriranje fakture (transakcija)
    const payment = await this.prisma.$transaction(async (prisma) => {
      // Kreiranje uplate
      const newPayment = await prisma.payment.create({
        data: {
          invoiceId: createPaymentDto.invoiceId,
          amount: createPaymentDto.amount,
          paymentDate: new Date(createPaymentDto.paymentDate),
          method: createPaymentDto.method,
          notes: createPaymentDto.notes,
        },
      });

      // Ažuriranje paidAmount fakture
      const updatedInvoice = await prisma.invoice.update({
        where: { id: createPaymentDto.invoiceId },
        data: {
          paidAmount: {
            increment: createPaymentDto.amount,
          },
        },
      });

      // Ažuriranje statusa fakture
      let status = 'PENDING';
      if (Number(updatedInvoice.paidAmount) >= Number(updatedInvoice.totalAmount)) {
        status = 'PAID';
      } else if (Number(updatedInvoice.paidAmount) > 0) {
        status = 'PARTIAL';
      }

      await prisma.invoice.update({
        where: { id: createPaymentDto.invoiceId },
        data: { status: status as any },
      });

      return newPayment;
    });

    // Fetch invoice sa client i company podacima za email
    const invoiceWithDetails = await this.prisma.invoice.findUnique({
      where: { id: createPaymentDto.invoiceId },
      include: {
        client: true,
        company: true,
      },
    });

    // Pošalji email potvrdu o uplati klijentu
    if (invoiceWithDetails) {
      await this.emailService.sendPaymentConfirmationEmail(payment, invoiceWithDetails);
    }

    return payment;
  }

  async findAll(invoiceId: string, companyId: string) {
    // Provera da li faktura pripada kompaniji
    await this.invoicesService.findOne(invoiceId, companyId);

    return this.prisma.payment.findMany({
      where: { invoiceId },
      orderBy: { paymentDate: 'desc' },
    });
  }

  async remove(id: string, companyId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: { invoice: true },
    });

    if (!payment) {
      throw new NotFoundException('Uplata nije pronađena');
    }

    // Provera da li faktura pripada kompaniji
    if (payment.invoice.companyId !== companyId) {
      throw new ForbiddenException('Nemate pristup ovoj uplati');
    }

    // Brisanje uplate i ažuriranje fakture (transakcija)
    await this.prisma.$transaction(async (prisma) => {
      // Brisanje uplate
      await prisma.payment.delete({
        where: { id },
      });

      // Ažuriranje paidAmount fakture
      const updatedInvoice = await prisma.invoice.update({
        where: { id: payment.invoiceId },
        data: {
          paidAmount: {
            decrement: payment.amount,
          },
        },
      });

      // Ažuriranje statusa fakture
      let status = 'PENDING';
      if (Number(updatedInvoice.paidAmount) >= Number(updatedInvoice.totalAmount)) {
        status = 'PAID';
      } else if (Number(updatedInvoice.paidAmount) > 0) {
        status = 'PARTIAL';
      } else if (new Date() > updatedInvoice.dueDate) {
        status = 'OVERDUE';
      }

      await prisma.invoice.update({
        where: { id: payment.invoiceId },
        data: { status: status as any },
      });
    });

    return { message: 'Uplata uspešno obrisana' };
  }
}
