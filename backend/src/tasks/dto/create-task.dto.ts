import { IsString, IsNotEmpty, IsEnum, IsOptional, IsDateString } from 'class-validator';
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
}
