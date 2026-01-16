import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsDateString, IsNumber, IsUUID } from 'class-validator';

export class CreateTimeEntryDto {
  @ApiProperty({ description: 'ID klijenta' })
  @IsUUID()
  clientId: string;

  @ApiPropertyOptional({ description: 'ID taska (opciono)' })
  @IsOptional()
  @IsUUID()
  taskId?: string;

  @ApiPropertyOptional({ description: 'Opis rada' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Vreme početka' })
  @IsDateString()
  startTime: string;

  @ApiPropertyOptional({ description: 'Vreme završetka' })
  @IsOptional()
  @IsDateString()
  endTime?: string;

  @ApiPropertyOptional({ description: 'Da li je naplativo', default: true })
  @IsOptional()
  @IsBoolean()
  billable?: boolean;

  @ApiPropertyOptional({ description: 'Satnica (opciono)' })
  @IsOptional()
  @IsNumber()
  hourlyRate?: number;
}

export class UpdateTimeEntryDto {
  @ApiPropertyOptional({ description: 'ID taska' })
  @IsOptional()
  @IsUUID()
  taskId?: string;

  @ApiPropertyOptional({ description: 'Opis rada' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Vreme početka' })
  @IsOptional()
  @IsDateString()
  startTime?: string;

  @ApiPropertyOptional({ description: 'Vreme završetka' })
  @IsOptional()
  @IsDateString()
  endTime?: string;

  @ApiPropertyOptional({ description: 'Da li je naplativo' })
  @IsOptional()
  @IsBoolean()
  billable?: boolean;

  @ApiPropertyOptional({ description: 'Satnica' })
  @IsOptional()
  @IsNumber()
  hourlyRate?: number;
}

export class StopTimerDto {
  @ApiProperty({ description: 'Vreme završetka' })
  @IsDateString()
  endTime: string;
}
