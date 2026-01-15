import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from './email.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  // Provera prekoračenih faktura svaki dan u 9:00
  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async checkOverdueInvoices() {
    this.logger.log('Checking for overdue invoices...');

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Pronađi sve fakture sa prekoračenim rokom koje nisu plaćene
      const overdueInvoices = await this.prisma.invoice.findMany({
        where: {
          dueDate: {
            lt: today,
          },
          status: {
            in: ['PENDING', 'PARTIAL'],
          },
        },
        include: {
          client: true,
          company: true,
        },
      });

      this.logger.log(`Found ${overdueInvoices.length} overdue invoices`);

      // Ažuriraj status na OVERDUE
      const invoiceIds = overdueInvoices.map((inv) => inv.id);
      if (invoiceIds.length > 0) {
        await this.prisma.invoice.updateMany({
          where: {
            id: { in: invoiceIds },
          },
          data: {
            status: 'OVERDUE',
          },
        });

        this.logger.log(`Updated ${invoiceIds.length} invoices to OVERDUE status`);

        // Slanje email notifikacija
        await this.sendOverdueNotifications(overdueInvoices);
      }

      return {
        success: true,
        overdueCount: overdueInvoices.length,
      };
    } catch (error) {
      this.logger.error('Error checking overdue invoices:', error);
      throw error;
    }
  }

  // Manualna provera prekoračenih faktura (za test)
  async manualCheckOverdue() {
    return this.checkOverdueInvoices();
  }

  // Email notifikacija
  async sendOverdueNotifications(invoices: any[]) {
    this.logger.log(`Sending ${invoices.length} overdue notifications...`);
    
    let successCount = 0;
    let failedCount = 0;

    for (const invoice of invoices) {
      const sent = await this.emailService.sendOverdueInvoiceEmail(invoice);
      if (sent) {
        successCount++;
      } else {
        failedCount++;
      }
    }

    this.logger.log(`Email notifications sent: ${successCount} successful, ${failedCount} failed`);

    return {
      total: invoices.length,
      successful: successCount,
      failed: failedCount,
    };
  }

  // Test cron job (svakih 30 sekundi - za test)
  @Cron(CronExpression.EVERY_30_SECONDS)
  async testCronJob() {
    // Ovaj cron job je samo za testiranje - može se obrisati
    // this.logger.debug('Test cron job running every 30 seconds');
  }
}
