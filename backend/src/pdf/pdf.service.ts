import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PdfService {
  constructor(private prisma: PrismaService) {}

  async generateInvoicePdf(invoiceId: string, companyId: string): Promise<Buffer> {
    const PdfPrinter = require('pdfmake');
    
    // Dobavljanje fakture sa svim podacima
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        client: true,
        company: true,
        items: true,
      },
    });

    if (!invoice || invoice.companyId !== companyId) {
      throw new Error('Faktura nije pronađena');
    }

    // Fontovi - koristi standardne fontove
    const fonts = {
      Courier: {
        normal: 'Courier',
        bold: 'Courier-Bold',
        italics: 'Courier-Oblique',
        bolditalics: 'Courier-BoldOblique',
      },
      Helvetica: {
        normal: 'Helvetica',
        bold: 'Helvetica-Bold',
        italics: 'Helvetica-Oblique',
        bolditalics: 'Helvetica-BoldOblique',
      },
      Times: {
        normal: 'Times-Roman',
        bold: 'Times-Bold',
        italics: 'Times-Italic',
        bolditalics: 'Times-BoldItalic',
      },
    };

    // PDF definicija
    const docDefinition = {
      defaultStyle: {
        font: 'Helvetica',
        fontSize: 10,
      },
      content: [
        // Header
        {
          columns: [
            {
              width: '*',
              stack: [
                { text: invoice.company.name, fontSize: 16, bold: true },
                { text: `PIB: ${invoice.company.pib}`, fontSize: 10, margin: [0, 2, 0, 0] },
                { text: invoice.company.address, fontSize: 10, margin: [0, 2, 0, 0] },
                { text: invoice.company.city, fontSize: 10, margin: [0, 2, 0, 0] },
                { text: invoice.company.email, fontSize: 10, margin: [0, 2, 0, 0] },
              ],
            },
            {
              width: 'auto',
              stack: [
                { text: 'FAKTURA', fontSize: 28, bold: true, alignment: 'right' },
                { text: `Broj: ${invoice.number}`, fontSize: 14, alignment: 'right', margin: [0, 5, 0, 0] },
              ],
            },
          ],
          margin: [0, 0, 0, 20],
        },

        // Klijent info
        {
          text: 'KUPAC:',
          fontSize: 12,
          bold: true,
          margin: [0, 0, 0, 5],
        },
        {
          stack: [
            { text: invoice.client.name, bold: true },
            invoice.client.pib ? { text: `PIB: ${invoice.client.pib}` } : {},
            { text: invoice.client.address },
            { text: invoice.client.city },
          ],
          margin: [0, 0, 0, 20],
        },

        // Datumi
        {
          columns: [
            { width: '*', text: `Datum izdavanja: ${new Date(invoice.date).toLocaleDateString('sr-RS')}` },
            { width: '*', text: `Rok placanja: ${new Date(invoice.dueDate).toLocaleDateString('sr-RS')}` },
          ],
          margin: [0, 0, 0, 20],
        },

        // Tabela stavki
        {
          table: {
            headerRows: 1,
            widths: ['*', 60, 80, 100],
            body: [
              [
                { text: 'Opis', bold: true, fontSize: 11 },
                { text: 'Kol.', bold: true, fontSize: 11, alignment: 'center' },
                { text: 'Cena', bold: true, fontSize: 11, alignment: 'right' },
                { text: 'Ukupno', bold: true, fontSize: 11, alignment: 'right' },
              ],
              ...invoice.items.map((item) => [
                item.description,
                { text: item.quantity.toString(), alignment: 'center' },
                { text: `${Number(item.price).toFixed(2)} RSD`, alignment: 'right' },
                { text: `${Number(item.total).toFixed(2)} RSD`, alignment: 'right' },
              ]),
            ],
          },
          layout: {
            fillColor: (rowIndex: number) => (rowIndex === 0 ? '#f3f4f6' : null),
          },
          margin: [0, 0, 0, 20],
        },

        // Ukupno
        {
          columns: [
            { width: '*', text: '' },
            {
              width: 200,
              stack: [
                {
                  columns: [
                    { text: 'UKUPNO:', bold: true },
                    { text: `${Number(invoice.totalAmount).toFixed(2)} RSD`, bold: true, alignment: 'right' },
                  ],
                },
                Number(invoice.paidAmount) > 0 ? {
                  columns: [
                    { text: 'Placeno:' },
                    { text: `${Number(invoice.paidAmount).toFixed(2)} RSD`, alignment: 'right' },
                  ],
                  margin: [0, 5, 0, 0],
                } : {},
                Number(invoice.paidAmount) > 0 && Number(invoice.paidAmount) < Number(invoice.totalAmount) ? {
                  columns: [
                    { text: 'Za uplatu:', bold: true },
                    { text: `${(Number(invoice.totalAmount) - Number(invoice.paidAmount)).toFixed(2)} RSD`, bold: true, alignment: 'right' },
                  ],
                  margin: [0, 5, 0, 0],
                } : {},
              ],
            },
          ],
        },

        // Napomena
        invoice.notes ? {
          text: `Napomena: ${invoice.notes}`,
          margin: [0, 20, 0, 0],
          italics: true,
        } : {},

        // Footer
        {
          text: 'Hvala na poverenju!',
          alignment: 'center',
          margin: [0, 40, 0, 0],
          italics: true,
        },
      ],
    };

    // Kreiranje PDF-a
    const printer = new PdfPrinter(fonts);
    const pdfDoc = printer.createPdfKitDocument(docDefinition);

    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      pdfDoc.on('data', (chunk: Buffer) => chunks.push(chunk));
      pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
      pdfDoc.on('error', reject);
      pdfDoc.end();
    });
  }
}
