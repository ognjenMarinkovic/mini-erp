import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { MoveTaskDto } from './dto/move-task.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Tasks')
@Controller('tasks')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @ApiOperation({ summary: 'Kreiranje novog taska' })
  create(@CurrentUser() user: any, @Body() createTaskDto: CreateTaskDto) {
    return this.tasksService.create(
      createTaskDto,
      user.id,
      'ADMIN',
      user.companyId,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Svi taskovi za kompaniju (opciono filtrirano po klijentu)' })
  @ApiQuery({ name: 'clientId', required: false, description: 'Filter po klijentu' })
  findAll(@CurrentUser() user: any, @Query('clientId') clientId?: string) {
    return this.tasksService.findAllForCompany(user.companyId, clientId);
  }

  @Get('kanban/:clientId')
  @ApiOperation({ summary: 'Kanban prikaz taskova za klijenta' })
  getKanban(@CurrentUser() user: any, @Param('clientId') clientId: string) {
    return this.tasksService.findByClient(clientId, user.companyId);
  }

  @Get('gantt/:clientId')
  @ApiOperation({ summary: 'Gantt Chart prikaz taskova za klijenta' })
  getGantt(@CurrentUser() user: any, @Param('clientId') clientId: string) {
    return this.tasksService.getGantt(clientId, user.companyId);
  }

  @Patch(':id/dates')
  @ApiOperation({ summary: 'Ažuriraj datume taska (Gantt drag)' })
  updateDates(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() body: { startDate: string | null; endDate: string | null },
  ) {
    return this.tasksService.updateDates(id, body.startDate, body.endDate, user.companyId);
  }

  @Patch(':id/progress')
  @ApiOperation({ summary: 'Ažuriraj progress taska' })
  updateProgress(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() body: { progress: number },
  ) {
    return this.tasksService.updateProgress(id, body.progress, user.companyId);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Statistika taskova za dashboard' })
  getStats(@CurrentUser() user: any) {
    return this.tasksService.getStats(user.companyId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalji taska sa komentarima' })
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.tasksService.findOne(id, user.companyId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Ažuriranje taska' })
  update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() updateTaskDto: UpdateTaskDto,
  ) {
    return this.tasksService.update(id, updateTaskDto, user.companyId);
  }

  @Patch(':id/move')
  @ApiOperation({ summary: 'Premesti task u drugu kolonu (Kanban drag & drop)' })
  moveTask(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() moveTaskDto: MoveTaskDto,
  ) {
    return this.tasksService.moveTask(id, moveTaskDto, user.companyId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Brisanje taska' })
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.tasksService.remove(id, user.companyId);
  }
}
