import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TaskDependenciesService } from './task-dependencies.service';
import { CreateDependencyDto } from './dto/create-dependency.dto';

@ApiTags('task-dependencies')
@ApiBearerAuth()
@Controller('task-dependencies')
@UseGuards(JwtAuthGuard)
export class TaskDependenciesController {
  constructor(private readonly dependenciesService: TaskDependenciesService) {}

  @Post()
  @ApiOperation({ summary: 'Kreiraj novu zavisnost između taskova' })
  create(@Body() createDto: CreateDependencyDto, @Request() req) {
    return this.dependenciesService.create(createDto, req.user.companyId);
  }

  @Get('task/:taskId')
  @ApiOperation({ summary: 'Dohvati sve zavisnosti za task' })
  findByTask(@Param('taskId') taskId: string) {
    return this.dependenciesService.findByTask(taskId);
  }

  @Get('client/:clientId')
  @ApiOperation({ summary: 'Dohvati sve zavisnosti za klijenta' })
  findByClient(@Param('clientId') clientId: string) {
    return this.dependenciesService.findByClient(clientId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Obriši zavisnost' })
  remove(@Param('id') id: string, @Request() req) {
    return this.dependenciesService.remove(id, req.user.companyId);
  }
}
