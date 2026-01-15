import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getDashboard(companyId: string) {
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Paralelno izvršavanje svih query-ja
    const [
      totalRevenue,
      totalExpenses,
      totalOutstanding,
      clientsCount,
      invoicesCount,
      overdueInvoices,
      monthlyRevenue,
      monthlyExpenses,
    ] = await Promise.all([
      // Ukupan prihod (plaćene fakture)
      this.prisma.invoice.aggregate({
        where: { companyId, status: 'PAID' },
        _sum: { totalAmount: true },
      }),

      // Ukupni troškovi
      this.prisma.expense.aggregate({
        where: { companyId },
        _sum: { amount: true },
      }),

      // Dugovanja (neplaćene fakture)
      this.prisma.invoice.aggregate({
        where: { companyId, status: { in: ['PENDING', 'PARTIAL', 'OVERDUE'] } },
        _sum: { totalAmount: true, paidAmount: true },
      }),

      // Broj klijenata
      this.prisma.client.count({
        where: { companyId },
      }),

      // Broj faktura ovog meseca
      this.prisma.invoice.count({
        where: {
          companyId,
          date: {
            gte: currentMonthStart,
            lte: currentMonthEnd,
          },
        },
      }),

      // Fakture sa prekoračenim rokom
      this.prisma.invoice.findMany({
        where: {
          companyId,
          status: 'OVERDUE',
        },
        take: 5,
        orderBy: { dueDate: 'asc' },
        include: {
          client: {
            select: { id: true, name: true },
          },
        },
      }),

      // Prihodi ovog meseca
      this.prisma.payment.aggregate({
        where: {
          invoice: { companyId },
          paymentDate: {
            gte: currentMonthStart,
            lte: currentMonthEnd,
          },
        },
        _sum: { amount: true },
      }),

      // Troškovi ovog meseca
      this.prisma.expense.aggregate({
        where: {
          companyId,
          date: {
            gte: currentMonthStart,
            lte: currentMonthEnd,
          },
        },
        _sum: { amount: true },
      }),
    ]);

    const outstanding =
      Number(totalOutstanding._sum.totalAmount || 0) - Number(totalOutstanding._sum.paidAmount || 0);

    return {
      summary: {
        totalRevenue: totalRevenue._sum.totalAmount || 0,
        totalExpenses: totalExpenses._sum.amount || 0,
        outstanding,
        clientsCount,
        invoicesThisMonth: invoicesCount,
        monthlyRevenue: monthlyRevenue._sum.amount || 0,
        monthlyExpenses: monthlyExpenses._sum.amount || 0,
        monthlyProfit: Number(monthlyRevenue._sum.amount || 0) - Number(monthlyExpenses._sum.amount || 0),
      },
      overdueInvoices,
    };
  }

  async getRevenueReport(
    companyId: string,
    fromDate: string,
    toDate: string,
  ) {
    const payments = await this.prisma.payment.groupBy({
      by: ['paymentDate'],
      where: {
        invoice: { companyId },
        paymentDate: {
          gte: new Date(fromDate),
          lte: new Date(toDate),
        },
      },
      _sum: {
        amount: true,
      },
      orderBy: {
        paymentDate: 'asc',
      },
    });

    return payments.map((p) => ({
      date: p.paymentDate,
      amount: p._sum.amount || 0,
    }));
  }

  async getExpensesReport(
    companyId: string,
    fromDate: string,
    toDate: string,
  ) {
    const expenses = await this.prisma.expense.groupBy({
      by: ['category', 'date'],
      where: {
        companyId,
        date: {
          gte: new Date(fromDate),
          lte: new Date(toDate),
        },
      },
      _sum: {
        amount: true,
      },
    });

    const byCategory = await this.prisma.expense.groupBy({
      by: ['category'],
      where: {
        companyId,
        date: {
          gte: new Date(fromDate),
          lte: new Date(toDate),
        },
      },
      _sum: {
        amount: true,
      },
    });

    return {
      byCategory: byCategory.map((e) => ({
        category: e.category,
        amount: e._sum.amount || 0,
      })),
      timeline: expenses.map((e) => ({
        date: e.date,
        category: e.category,
        amount: e._sum.amount || 0,
      })),
    };
  }

  async getTopClients(companyId: string, limit = 10) {
    const clients = await this.prisma.client.findMany({
      where: { companyId },
      include: {
        invoices: {
          where: { status: 'PAID' },
        },
      },
    });

    const clientsWithRevenue = clients
      .map((client) => ({
        id: client.id,
        name: client.name,
        city: client.city,
        invoicesCount: client.invoices.length,
        totalRevenue: client.invoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0),
      }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, limit);

    return clientsWithRevenue;
  }
}
