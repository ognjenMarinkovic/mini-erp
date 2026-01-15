import { PartialType } from '@nestjs/swagger';
import { CreateTaskDto } from './create-task.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum TaskStatus {
  ONBOARDING = 'ONBOARDING',
  BACKLOG = 'BACKLOG',
  IN_PROGRESS = 'IN_PROGRESS',
  REVIEW = 'REVIEW',
  DONE = 'DONE',
  ARCHIVE = 'ARCHIVE',
}

export class UpdateTaskDto extends PartialType(CreateTaskDto) {
  @ApiPropertyOptional({ enum: TaskStatus, description: 'Status taska (Kanban kolona)' })
  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;
}
