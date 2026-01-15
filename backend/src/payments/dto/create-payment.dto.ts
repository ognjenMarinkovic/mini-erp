import { IsNotEmpty, IsString, IsNumber, IsDateString, IsEnum, IsOptional, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PaymentMethod } from '@prisma/client';

export class CreatePaymentDto {
  @ApiProperty({ example: 'invoice-uuid-here' })
  @IsString()
  @IsNotEmpty()
  invoiceId: string;

  @ApiProperty({ example: 50000 })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({ example: '2026-01-15' })
  @IsDateString()
  @IsNotEmpty()
  paymentDate: string;

  @ApiProperty({ enum: PaymentMethod, example: 'BANK_TRANSFER' })
  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @ApiProperty({ example: 'Uplata na račun', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}
