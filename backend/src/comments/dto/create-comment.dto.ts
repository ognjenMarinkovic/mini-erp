import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCommentDto {
  @ApiProperty({ description: 'ID taska na koji se dodaje komentar' })
  @IsString()
  @IsNotEmpty()
  taskId: string;

  @ApiPropertyOptional({ description: 'Tekst komentara' })
  @IsString()
  @IsOptional()
  content?: string;

  @ApiPropertyOptional({ description: 'ID parent komentara (za reply)' })
  @IsString()
  @IsOptional()
  parentId?: string;
}
