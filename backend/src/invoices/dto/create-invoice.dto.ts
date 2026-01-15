import { IsNotEmpty, IsString, IsDateString, IsArray, ValidateNested, IsNumber, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class InvoiceItemDto {
  @ApiProperty({ example: 'Web Development Services' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 10 })
  @IsNumber()
  @Min(0.01)
  quantity: number;

  @ApiProperty({ example: 5000 })
  @IsNumber()
  @Min(0.01)
  price: number;
}

export class CreateInvoiceDto {
  @ApiProperty({ example: 'client-uuid-here' })
  @IsString()
  @IsNotEmpty()
  clientId: string;

  @ApiProperty({ example: '2026-01-15' })
  @IsDateString()
  @IsNotEmpty()
  date: string;

  @ApiProperty({ example: '2026-02-15' })
  @IsDateString()
  @IsNotEmpty()
  dueDate: string;

  @ApiProperty({ type: [InvoiceItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvoiceItemDto)
  items: InvoiceItemDto[];

  @ApiProperty({ example: 'Napomena...', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}
