import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter;

  constructor(private configService: ConfigService) {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    const host = this.configService.get<string>('SMTP_HOST');
    const port = this.configService.get<number>('SMTP_PORT');
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');

    if (!host || !port || !user || !pass) {
      this.logger.warn('SMTP credentials not configured. Email sending will be disabled.');
      return;
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // true for 465, false for other ports
      auth: {
        user,
        pass,
      },
    });

    this.logger.log('Email transporter initialized');
  }

  async sendOverdueInvoiceEmail(invoice: any): Promise<boolean> {
    if (!this.transporter) {
      this.logger.warn('Email transporter not initialized. Skipping email.');
      return false;
    }

    if (!invoice.client.email) {
      this.logger.warn(`Client ${invoice.client.name} has no email. Skipping.`);
      return false;
    }

    try {
      const mailOptions = {
        from: `"${invoice.company.name}" <${this.configService.get('SMTP_USER')}>`,
        to: invoice.client.email,
        subject: `⚠️ Podsetnik: Faktura ${invoice.number} je prekoračena`,
        html: this.generateOverdueEmailTemplate(invoice),
      };

      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email sent to ${invoice.client.email} for invoice ${invoice.number}. Message ID: ${info.messageId}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send email to ${invoice.client.email}:`, error.message);
      return false;
    }
  }

  async sendNewInvoiceEmail(invoice: any): Promise<boolean> {
    if (!this.transporter) {
      this.logger.warn('Email transporter not initialized. Skipping email.');
      return false;
    }

    if (!invoice.client.email) {
      this.logger.warn(`Client ${invoice.client.name} has no email. Skipping.`);
      return false;
    }

    try {
      const mailOptions = {
        from: `"${invoice.company.name}" <${this.configService.get('SMTP_USER')}>`,
        to: invoice.client.email,
        subject: `📄 Nova faktura ${invoice.number} - ${invoice.company.name}`,
        html: this.generateNewInvoiceTemplate(invoice),
      };

      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`New invoice email sent to ${invoice.client.email} for invoice ${invoice.number}. Message ID: ${info.messageId}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send new invoice email to ${invoice.client.email}:`, error.message);
      return false;
    }
  }

  async sendPaymentConfirmationEmail(payment: any, invoice: any): Promise<boolean> {
    if (!this.transporter || !invoice.client.email) {
      return false;
    }

    try {
      const mailOptions = {
        from: `"${invoice.company.name}" <${this.configService.get('SMTP_USER')}>`,
        to: invoice.client.email,
        subject: `✅ Potvrda uplate - Faktura ${invoice.number}`,
        html: this.generatePaymentConfirmationTemplate(payment, invoice),
      };

      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Payment confirmation sent to ${invoice.client.email}. Message ID: ${info.messageId}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send payment confirmation:`, error.message);
      return false;
    }
  }

  private generateNewInvoiceTemplate(invoice: any): string {
    const formatCurrency = (amount: number) => {
      return amount.toLocaleString('sr-RS', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const formatDate = (date: Date) => {
      return new Date(date).toLocaleDateString('sr-RS');
    };

    const itemsHtml = invoice.items
      .map(
        (item: any) => `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${item.description}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">${formatCurrency(Number(item.price))} RSD</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: bold;">${formatCurrency(Number(item.total))} RSD</td>
        </tr>
      `,
      )
      .join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 650px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
          .invoice-box { background-color: white; padding: 25px; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .info-badge { background-color: #dbeafe; color: #1e40af; padding: 12px 20px; border-radius: 6px; display: inline-block; font-weight: bold; margin: 15px 0; }
          .footer { background-color: #374151; color: white; padding: 25px; text-align: center; border-radius: 0 0 8px 8px; }
          .amount-box { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
          .amount { font-size: 32px; font-weight: bold; margin: 10px 0; }
          table.items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          .items-table th { background-color: #f3f4f6; padding: 12px; text-align: left; font-weight: 600; border-bottom: 2px solid #e5e7eb; }
          .cta-button { display: inline-block; background-color: #3b82f6; color: white; padding: 15px 40px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
          .highlight { color: #dc2626; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">📄 Nova Faktura</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Faktura je kreirana i čeka uplatu</p>
          </div>
          
          <div class="content">
            <p>Poštovani <strong>${invoice.client.name}</strong>,</p>
            
            <p>Šaljemo Vam novu fakturu za izvršene usluge/proizvode.</p>
            
            <div class="info-badge">
              📋 Broj fakture: <strong>${invoice.number}</strong>
            </div>
            
            <div class="invoice-box">
              <h3 style="margin-top: 0; color: #111827; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">📊 Detalji fakture</h3>
              
              <table style="width: 100%; margin: 15px 0;">
                <tr>
                  <td style="color: #6b7280; padding: 8px 0;">Datum izdavanja:</td>
                  <td style="text-align: right; font-weight: 600;">${formatDate(invoice.date)}</td>
                </tr>
                <tr>
                  <td style="color: #6b7280; padding: 8px 0;">Rok plaćanja:</td>
                  <td style="text-align: right; font-weight: 600;" class="highlight">${formatDate(invoice.dueDate)}</td>
                </tr>
              </table>

              <h4 style="color: #111827; margin: 25px 0 15px 0;">Stavke fakture:</h4>
              <table class="items-table">
                <thead>
                  <tr>
                    <th>Opis</th>
                    <th style="text-align: center;">Količina</th>
                    <th style="text-align: right;">Cena</th>
                    <th style="text-align: right;">Ukupno</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
              </table>
            </div>
            
            <div class="amount-box">
              <div style="font-size: 16px; opacity: 0.9;">UKUPAN IZNOS ZA UPLATU</div>
              <div class="amount">${formatCurrency(Number(invoice.totalAmount))} RSD</div>
            </div>

            ${invoice.notes ? `<div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;"><strong>📝 Napomena:</strong><br>${invoice.notes}</div>` : ''}
            
            <p style="margin-top: 30px;"><strong>Molimo Vas da izvršite uplatu do datuma: <span class="highlight">${formatDate(invoice.dueDate)}</span></strong></p>
            
            <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; padding: 20px; border-radius: 8px; margin: 25px 0;">
              <h4 style="margin-top: 0; color: #1e40af;">💳 Podaci za uplatu:</h4>
              <table style="width: 100%;">
                <tr>
                  <td style="color: #6b7280; padding: 5px 0;">Primalac:</td>
                  <td style="text-align: right; font-weight: 600;">${invoice.company.name}</td>
                </tr>
                <tr>
                  <td style="color: #6b7280; padding: 5px 0;">PIB:</td>
                  <td style="text-align: right; font-weight: 600;">${invoice.company.pib}</td>
                </tr>
                <tr>
                  <td style="color: #6b7280; padding: 5px 0;">Poziv na broj:</td>
                  <td style="text-align: right; font-weight: 600;">${invoice.number}</td>
                </tr>
              </table>
            </div>
            
            <p style="margin-top: 25px; text-align: center;">
              <strong>Hvala što poslujete sa nama! 🙏</strong>
            </p>
            
            <p style="text-align: center; color: #6b7280; font-size: 13px;">
              Za sva pitanja kontaktirajte nas:<br>
              📧 ${invoice.company.email} | 📞 ${invoice.company.phone || 'N/A'}
            </p>
          </div>
          
          <div class="footer">
            <p style="margin: 0; font-size: 14px;">
              <strong>${invoice.company.name}</strong><br>
              ${invoice.company.address}, ${invoice.company.city}<br>
              PIB: ${invoice.company.pib}
            </p>
            <p style="margin: 15px 0 0 0; font-size: 12px; opacity: 0.8;">
              Ovo je automatska poruka. Molimo ne odgovarajte direktno na ovaj email.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generateOverdueEmailTemplate(invoice: any): string {
    const formatCurrency = (amount: number) => {
      return amount.toLocaleString('sr-RS', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const formatDate = (date: Date) => {
      return new Date(date).toLocaleDateString('sr-RS');
    };

    const daysOverdue = Math.floor(
      (new Date().getTime() - new Date(invoice.dueDate).getTime()) / (1000 * 60 * 60 * 24)
    );

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
          .invoice-details { background-color: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #dc2626; }
          .warning-badge { background-color: #fef2f2; color: #dc2626; padding: 10px 15px; border-radius: 6px; display: inline-block; font-weight: bold; margin: 10px 0; }
          .footer { background-color: #374151; color: white; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; }
          .amount { font-size: 24px; font-weight: bold; color: #dc2626; }
          table { width: 100%; margin: 15px 0; }
          td { padding: 8px 0; }
          .label { color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚠️ PODSETNIK O PREKORAČENOJ FAKTURI</h1>
          </div>
          
          <div class="content">
            <p>Poštovani <strong>${invoice.client.name}</strong>,</p>
            
            <p>Obaveštavamo Vas da je faktura prekoračila rok plaćanja.</p>
            
            <div class="warning-badge">
              Prekoračenje: ${daysOverdue} ${daysOverdue === 1 ? 'dan' : 'dana'}
            </div>
            
            <div class="invoice-details">
              <h3 style="margin-top: 0; color: #111827;">Detalji fakture</h3>
              <table>
                <tr>
                  <td class="label">Broj fakture:</td>
                  <td style="font-weight: bold;">${invoice.number}</td>
                </tr>
                <tr>
                  <td class="label">Datum izdavanja:</td>
                  <td>${formatDate(invoice.date)}</td>
                </tr>
                <tr>
                  <td class="label">Rok plaćanja:</td>
                  <td style="color: #dc2626; font-weight: bold;">${formatDate(invoice.dueDate)}</td>
                </tr>
                <tr>
                  <td class="label">Iznos za uplatu:</td>
                  <td class="amount">${formatCurrency(Number(invoice.totalAmount))} RSD</td>
                </tr>
              </table>
            </div>
            
            <p><strong>Molimo Vas da izvršite uplatu u najkraćem mogućem roku.</strong></p>
            
            <p>Ukoliko ste već izvršili uplatu, molimo Vas da zanemarite ovaj email.</p>
            
            <p style="margin-top: 30px;">
              Za dodatne informacije, kontaktirajte nas na:<br>
              📧 ${invoice.company.email}<br>
              📞 ${invoice.company.phone || 'N/A'}
            </p>
          </div>
          
          <div class="footer">
            <p style="margin: 0;">
              ${invoice.company.name}<br>
              ${invoice.company.address}, ${invoice.company.city}<br>
              PIB: ${invoice.company.pib}
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generatePaymentConfirmationTemplate(payment: any, invoice: any): string {
    const formatCurrency = (amount: number) => {
      return amount.toLocaleString('sr-RS', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const formatDate = (date: Date) => {
      return new Date(date).toLocaleDateString('sr-RS');
    };

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #059669; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
          .payment-details { background-color: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #059669; }
          .success-badge { background-color: #d1fae5; color: #059669; padding: 10px 15px; border-radius: 6px; display: inline-block; font-weight: bold; margin: 10px 0; }
          .footer { background-color: #374151; color: white; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; }
          .amount { font-size: 24px; font-weight: bold; color: #059669; }
          table { width: 100%; margin: 15px 0; }
          td { padding: 8px 0; }
          .label { color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ POTVRDA UPLATE</h1>
          </div>
          
          <div class="content">
            <p>Poštovani <strong>${invoice.client.name}</strong>,</p>
            
            <p>Zahvaljujemo se na izvršenoj uplati!</p>
            
            <div class="success-badge">
              ✓ Uplata evidentirana
            </div>
            
            <div class="payment-details">
              <h3 style="margin-top: 0; color: #111827;">Detalji uplate</h3>
              <table>
                <tr>
                  <td class="label">Faktura:</td>
                  <td style="font-weight: bold;">${invoice.number}</td>
                </tr>
                <tr>
                  <td class="label">Iznos uplate:</td>
                  <td class="amount">${formatCurrency(Number(payment.amount))} RSD</td>
                </tr>
                <tr>
                  <td class="label">Datum uplate:</td>
                  <td>${formatDate(payment.paymentDate)}</td>
                </tr>
                <tr>
                  <td class="label">Status fakture:</td>
                  <td style="color: #059669; font-weight: bold;">
                    ${invoice.status === 'PAID' ? 'Plaćeno u potpunosti' : 'Delimično plaćeno'}
                  </td>
                </tr>
              </table>
            </div>
            
            <p>Hvala na poverenju!</p>
          </div>
          
          <div class="footer">
            <p style="margin: 0;">
              ${invoice.company.name}<br>
              ${invoice.company.address}, ${invoice.company.city}
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Test metoda
  async sendTestEmail(to: string): Promise<boolean> {
    if (!this.transporter) {
      this.logger.error('Email transporter not configured');
      return false;
    }

    try {
      const info = await this.transporter.sendMail({
        from: this.configService.get('SMTP_USER'),
        to,
        subject: '🧪 Test Email - Mini ERP',
        html: '<h1>Email radi! 🎉</h1><p>Tvoj Mini ERP sistem je uspešno konfigurisan za slanje email-ova.</p>',
      });

      this.logger.log(`Test email sent to ${to}. Message ID: ${info.messageId}`);
      return true;
    } catch (error) {
      this.logger.error('Failed to send test email:', error.message);
      return false;
    }
  }
}
