import { IsNotEmpty, IsString, IsNumber, IsDateString, IsEnum, IsOptional, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ExpenseCategory } from '@prisma/client';

export class CreateExpenseDto {
  @ApiProperty({ enum: ExpenseCategory, example: 'SALARIES' })
  @IsEnum(ExpenseCategory)
  category: ExpenseCategory;

  @ApiProperty({ example: 'Plata za januar 2026' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 100000 })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({ example: '2026-01-15' })
  @IsDateString()
  @IsNotEmpty()
  date: string;

  @ApiProperty({ example: 'Dodatne napomene...', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}
