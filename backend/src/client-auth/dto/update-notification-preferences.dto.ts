import { IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateNotificationPreferencesDto {
  @ApiPropertyOptional({ description: 'Notifikacije kada task pređe u "U toku"', default: true })
  @IsBoolean()
  @IsOptional()
  notifyTaskInProgress?: boolean;

  @ApiPropertyOptional({ description: 'Notifikacije kada task pređe u "Na pregledu"', default: true })
  @IsBoolean()
  @IsOptional()
  notifyTaskReview?: boolean;

  @ApiPropertyOptional({ description: 'Notifikacije kada task pređe u "Završeno"', default: true })
  @IsBoolean()
  @IsOptional()
  notifyTaskCompleted?: boolean;

  @ApiPropertyOptional({ description: 'Notifikacije za nove komentare', default: true })
  @IsBoolean()
  @IsOptional()
  notifyNewComment?: boolean;
}
