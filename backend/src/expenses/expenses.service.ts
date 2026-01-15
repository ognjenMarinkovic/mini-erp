import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { ExpenseCategory } from '@prisma/client';

@Injectable()
export class ExpensesService {
  constructor(private prisma: PrismaService) {}

  async create(companyId: string, createExpenseDto: CreateExpenseDto) {
    return this.prisma.expense.create({
      data: {
        ...createExpenseDto,
        date: new Date(createExpenseDto.date),
        companyId,
      },
    });
  }

  async findAll(
    companyId: string,
    filters?: {
      category?: ExpenseCategory;
      search?: string;
      fromDate?: string;
      toDate?: string;
      page?: number;
      limit?: number;
    },
  ) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = { companyId };

    if (filters?.category) {
      where.category = filters.category;
    }

    if (filters?.search) {
      where.description = {
        contains: filters.search,
        mode: 'insensitive' as const,
      };
    }

    if (filters?.fromDate || filters?.toDate) {
      where.date = {};
      if (filters.fromDate) {
        where.date.gte = new Date(filters.fromDate);
      }
      if (filters.toDate) {
        where.date.lte = new Date(filters.toDate);
      }
    }

    const [expenses, total] = await Promise.all([
      this.prisma.expense.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: 'desc' },
      }),
      this.prisma.expense.count({ where }),
    ]);

    return {
      data: expenses,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, companyId: string) {
    const expense = await this.prisma.expense.findUnique({
      where: { id },
    });

    if (!expense) {
      throw new NotFoundException('Trošak nije pronađen');
    }

    if (expense.companyId !== companyId) {
      throw new ForbiddenException('Nemate pristup ovom trošku');
    }

    return expense;
  }

  async update(id: string, companyId: string, updateExpenseDto: UpdateExpenseDto) {
    await this.findOne(id, companyId);

    return this.prisma.expense.update({
      where: { id },
      data: {
        ...updateExpenseDto,
        date: updateExpenseDto.date ? new Date(updateExpenseDto.date) : undefined,
      },
    });
  }

  async remove(id: string, companyId: string) {
    await this.findOne(id, companyId);

    await this.prisma.expense.delete({
      where: { id },
    });

    return { message: 'Trošak uspešno obrisan' };
  }
}
