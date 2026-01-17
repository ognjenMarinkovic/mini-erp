import { IsEnum, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TaskStatus } from './update-task.dto';

export class MoveTaskDto {
  @ApiProperty({ enum: TaskStatus, description: 'Nova kolona za task' })
  @IsEnum(TaskStatus)
  status: TaskStatus;

  @ApiProperty({ description: 'Nova pozicija u koloni (0-based)' })
  @IsInt()
  @Min(0)
  position: number;
}
