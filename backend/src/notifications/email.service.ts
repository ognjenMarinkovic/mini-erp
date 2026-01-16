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

  // ============================================
  // TASK NOTIFIKACIJE ZA CLIENT HUB
  // ============================================

  // Task kreiran (Admin kreira task za klijenta)
  async sendTaskCreatedEmail(
    clientEmails: string[],
    task: any,
    companyName: string,
  ): Promise<boolean> {
    if (!this.transporter || clientEmails.length === 0) {
      return false;
    }

    try {
      const mailOptions = {
        from: `"${companyName}" <${this.configService.get('SMTP_USER')}>`,
        to: clientEmails.join(', '),
        subject: `📋 Novi task: ${task.title}`,
        html: this.generateTaskCreatedTemplate(task, companyName),
      };

      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Task created email sent. Message ID: ${info.messageId}`);
      return true;
    } catch (error) {
      this.logger.error('Failed to send task created email:', error.message);
      return false;
    }
  }

  // Task spreman za review - GLAVNI EMAIL za klijenta
  async sendTaskReadyForReviewEmail(
    clientEmails: string[],
    task: any,
    companyName: string,
  ): Promise<boolean> {
    if (!this.transporter || clientEmails.length === 0) {
      return false;
    }

    try {
      const mailOptions = {
        from: `"${companyName}" <${this.configService.get('SMTP_USER')}>`,
        to: clientEmails.join(', '),
        subject: `👀 Čeka vaš pregled: ${task.title}`,
        html: this.generateTaskReadyForReviewTemplate(task, companyName),
      };

      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Task moved email sent. Message ID: ${info.messageId}`);
      return true;
    } catch (error) {
      this.logger.error('Failed to send task moved email:', error.message);
      return false;
    }
  }

  // Novi komentar na task (Admin komentariše)
  async sendNewCommentEmail(
    clientEmails: string[],
    task: any,
    comment: any,
    companyName: string,
  ): Promise<boolean> {
    if (!this.transporter || clientEmails.length === 0) {
      return false;
    }

    try {
      const mailOptions = {
        from: `"${companyName}" <${this.configService.get('SMTP_USER')}>`,
        to: clientEmails.join(', '),
        subject: `💬 Novi komentar na task "${task.title}"`,
        html: this.generateNewCommentTemplate(task, comment, companyName),
      };

      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`New comment email sent. Message ID: ${info.messageId}`);
      return true;
    } catch (error) {
      this.logger.error('Failed to send new comment email:', error.message);
      return false;
    }
  }

  // Task završen
  async sendTaskCompletedEmail(
    clientEmails: string[],
    task: any,
    companyName: string,
  ): Promise<boolean> {
    if (!this.transporter || clientEmails.length === 0) {
      return false;
    }

    try {
      const mailOptions = {
        from: `"${companyName}" <${this.configService.get('SMTP_USER')}>`,
        to: clientEmails.join(', '),
        subject: `✅ Task završen: ${task.title}`,
        html: this.generateTaskCompletedTemplate(task, companyName),
      };

      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Task completed email sent. Message ID: ${info.messageId}`);
      return true;
    } catch (error) {
      this.logger.error('Failed to send task completed email:', error.message);
      return false;
    }
  }

  // --- TASK EMAIL TEMPLATES ---

  private generateTaskCreatedTemplate(task: any, companyName: string): string {
    const formatDate = (date: Date | null) => {
      if (!date) return 'Nije definisan';
      return new Date(date).toLocaleDateString('sr-RS');
    };

    const serviceTypeLabels: Record<string, string> = {
      BRANDING: 'Branding',
      LOGO_DESIGN: 'Logo Dizajn',
      WEB_DESIGN: 'Web Dizajn',
      UI_UX: 'UI/UX Dizajn',
      WEBFLOW_DEV: 'Webflow Development',
      SOCIAL_MEDIA: 'Social Media',
      PITCH_DECK: 'Pitch Deck',
      MOTION_GRAPHICS: 'Motion Graphics',
      ILLUSTRATIONS: 'Ilustracije',
      PRINT_DESIGN: 'Print Dizajn',
      OTHER: 'Ostalo',
    };

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
          .task-box { background-color: white; padding: 25px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #8b5cf6; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .badge { display: inline-block; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; }
          .badge-purple { background-color: #ede9fe; color: #7c3aed; }
          .footer { background-color: #374151; color: white; padding: 25px; text-align: center; border-radius: 0 0 8px 8px; }
          table { width: 100%; }
          td { padding: 8px 0; }
          .label { color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">📋 Novi Task Kreiran</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Imate novi task za pregled</p>
          </div>
          
          <div class="content">
            <p>Zdravo,</p>
            <p>Kreiran je novi task za vas:</p>
            
            <div class="task-box">
              <span class="badge badge-purple">${serviceTypeLabels[task.serviceType] || task.serviceType}</span>
              <h2 style="margin: 15px 0 10px 0; color: #111827;">${task.title}</h2>
              ${task.description ? `<p style="color: #6b7280; margin: 0;">${task.description}</p>` : ''}
              
              <table style="margin-top: 20px;">
                <tr>
                  <td class="label">📅 Deadline:</td>
                  <td style="font-weight: 600;">${formatDate(task.deadline)}</td>
                </tr>
                <tr>
                  <td class="label">📊 Status:</td>
                  <td><span class="badge badge-purple">Backlog</span></td>
                </tr>
              </table>
            </div>
            
            <p style="text-align: center; margin-top: 25px;">
              <a href="${this.configService.get('FRONTEND_URL') || 'http://localhost:5173'}/client" 
                 style="display: inline-block; background-color: #8b5cf6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                Pogledaj u Client Hub-u
              </a>
            </p>
          </div>
          
          <div class="footer">
            <p style="margin: 0; font-size: 14px;">${companyName}</p>
            <p style="margin: 10px 0 0 0; font-size: 12px; opacity: 0.8;">
              Ovo je automatska poruka. Molimo ne odgovarajte direktno na ovaj email.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generateTaskReadyForReviewTemplate(task: any, companyName: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white; padding: 40px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
          .review-box { background-color: #ede9fe; border: 2px solid #8b5cf6; padding: 25px; border-radius: 12px; text-align: center; margin: 25px 0; }
          .footer { background-color: #374151; color: white; padding: 25px; text-align: center; border-radius: 0 0 8px 8px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div style="font-size: 50px; margin-bottom: 15px;">👀</div>
            <h1 style="margin: 0;">Čeka Vaš Pregled</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9; font-size: 18px;">${task.title}</p>
          </div>
          
          <div class="content">
            <p>Zdravo,</p>
            <p>Završili smo rad na vašem tasku i spreman je za pregled!</p>
            
            <div class="review-box">
              <h2 style="margin: 0 0 15px 0; color: #5b21b6;">📋 ${task.title}</h2>
              <p style="margin: 0; color: #6b7280;">
                Molimo vas da pregledate urađeno i ostavite povratne informacije ili odobrite.
              </p>
            </div>
            
            <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 4px; margin: 20px 0;">
              <p style="margin: 0; color: #92400e;">
                <strong>💡 Šta dalje?</strong><br>
                Pregledajte rezultate u Client Hub-u i ostavite komentar ako imate izmene ili pitanja.
              </p>
            </div>
            
            <p style="text-align: center; margin-top: 30px;">
              <a href="${this.configService.get('FRONTEND_URL') || 'http://localhost:5173'}/client/tasks" 
                 style="display: inline-block; background-color: #8b5cf6; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                Pregledaj Sada
              </a>
            </p>
          </div>
          
          <div class="footer">
            <p style="margin: 0; font-size: 14px;">${companyName}</p>
            <p style="margin: 10px 0 0 0; font-size: 12px; opacity: 0.8;">
              Ovo je automatska poruka. Molimo ne odgovarajte direktno na ovaj email.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generateNewCommentTemplate(task: any, comment: any, companyName: string): string {
    const formatDate = (date: Date) => {
      return new Date(date).toLocaleDateString('sr-RS', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    };

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
          .comment-box { background-color: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #f59e0b; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .comment-author { display: flex; align-items: center; margin-bottom: 10px; }
          .avatar { width: 40px; height: 40px; border-radius: 50%; background-color: #8b5cf6; color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 10px; }
          .footer { background-color: #374151; color: white; padding: 25px; text-align: center; border-radius: 0 0 8px 8px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">💬 Novi Komentar</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Na task: ${task.title}</p>
          </div>
          
          <div class="content">
            <p>Zdravo,</p>
            <p>Imate novi komentar na vašem tasku:</p>
            
            <div class="comment-box">
              <div class="comment-author">
                <div class="avatar">${comment.authorName.charAt(0).toUpperCase()}</div>
                <div>
                  <strong>${comment.authorName}</strong>
                  <div style="font-size: 12px; color: #6b7280;">${formatDate(comment.createdAt)}</div>
                </div>
              </div>
              <p style="margin: 15px 0 0 0; white-space: pre-wrap;">${comment.content || '(Attachment)'}</p>
            </div>
            
            <p style="text-align: center; margin-top: 25px;">
              <a href="${this.configService.get('FRONTEND_URL') || 'http://localhost:5173'}/client/tasks" 
                 style="display: inline-block; background-color: #8b5cf6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                Odgovori na komentar
              </a>
            </p>
          </div>
          
          <div class="footer">
            <p style="margin: 0; font-size: 14px;">${companyName}</p>
            <p style="margin: 10px 0 0 0; font-size: 12px; opacity: 0.8;">
              Ovo je automatska poruka. Molimo ne odgovarajte direktno na ovaj email.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generateTaskCompletedTemplate(task: any, companyName: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 40px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
          .success-icon { font-size: 60px; margin-bottom: 15px; }
          .footer { background-color: #374151; color: white; padding: 25px; text-align: center; border-radius: 0 0 8px 8px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="success-icon">✅</div>
            <h1 style="margin: 0;">Task Završen!</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9; font-size: 18px;">${task.title}</p>
          </div>
          
          <div class="content">
            <p>Zdravo,</p>
            <p>Sa zadovoljstvom vas obaveštavamo da je vaš task uspešno završen!</p>
            
            <div style="background-color: #d1fae5; border: 1px solid #6ee7b7; padding: 25px; border-radius: 8px; text-align: center; margin: 25px 0;">
              <h2 style="margin: 0 0 10px 0; color: #065f46;">🎉 Čestitamo!</h2>
              <p style="margin: 0; color: #047857;">
                Task "${task.title}" je uspešno kompletiran.
              </p>
            </div>
            
            <p style="text-align: center; margin-top: 25px;">
              <a href="${this.configService.get('FRONTEND_URL') || 'http://localhost:5173'}/client" 
                 style="display: inline-block; background-color: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                Pogledaj u Client Hub-u
              </a>
            </p>
            
            <p style="text-align: center; margin-top: 20px; color: #6b7280;">
              Hvala na saradnji! 🙏
            </p>
          </div>
          
          <div class="footer">
            <p style="margin: 0; font-size: 14px;">${companyName}</p>
            <p style="margin: 10px 0 0 0; font-size: 12px; opacity: 0.8;">
              Ovo je automatska poruka. Molimo ne odgovarajte direktno na ovaj email.
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
