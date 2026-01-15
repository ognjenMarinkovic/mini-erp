import { IsString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCommentDto {
  @ApiPropertyOptional({ description: 'Tekst komentara' })
  @IsString()
  @IsOptional()
  content?: string;
}
