import { IsString, IsNotEmpty, IsEnum, IsOptional, IsDateString, IsBoolean, IsInt, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ServiceType {
  BRANDING = 'BRANDING',
  LOGO_DESIGN = 'LOGO_DESIGN',
  WEB_DESIGN = 'WEB_DESIGN',
  UI_UX = 'UI_UX',
  WEBFLOW_DEV = 'WEBFLOW_DEV',
  SOCIAL_MEDIA = 'SOCIAL_MEDIA',
  PITCH_DECK = 'PITCH_DECK',
  MOTION_GRAPHICS = 'MOTION_GRAPHICS',
  ILLUSTRATIONS = 'ILLUSTRATIONS',
  PRINT_DESIGN = 'PRINT_DESIGN',
  OTHER = 'OTHER',
}

export class CreateTaskDto {
  @ApiProperty({ description: 'ID klijenta za koga se kreira task' })
  @IsString()
  @IsNotEmpty()
  clientId: string;

  @ApiProperty({ description: 'Naziv taska' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ description: 'Opis taska' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ enum: ServiceType, description: 'Vrsta servisa' })
  @IsEnum(ServiceType)
  serviceType: ServiceType;

  @ApiPropertyOptional({ description: 'Deadline (ISO date string)' })
  @IsDateString()
  @IsOptional()
  deadline?: string;

  // Gantt Chart polja
  @ApiPropertyOptional({ description: 'Datum početka taska (Gantt)' })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Datum završetka taska (Gantt)' })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Da li je task milestone' })
  @IsBoolean()
  @IsOptional()
  isMilestone?: boolean;

  @ApiPropertyOptional({ description: 'Procenat završenosti (0-100)' })
  @IsInt()
  @Min(0)
  @Max(100)
  @IsOptional()
  progress?: number;
}
