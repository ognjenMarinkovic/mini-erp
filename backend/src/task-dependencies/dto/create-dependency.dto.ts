import { IsString, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum DependencyType {
  FINISH_TO_START = 'FINISH_TO_START',
  START_TO_START = 'START_TO_START',
  FINISH_TO_FINISH = 'FINISH_TO_FINISH',
  START_TO_FINISH = 'START_TO_FINISH',
}

export class CreateDependencyDto {
  @ApiProperty({ description: 'ID taska koji zavisi od drugog' })
  @IsUUID()
  dependentTaskId: string;

  @ApiProperty({ description: 'ID taska od kojeg zavisi' })
  @IsUUID()
  dependsOnTaskId: string;

  @ApiProperty({ enum: DependencyType, default: DependencyType.FINISH_TO_START })
  @IsOptional()
  @IsEnum(DependencyType)
  type?: DependencyType;
}
