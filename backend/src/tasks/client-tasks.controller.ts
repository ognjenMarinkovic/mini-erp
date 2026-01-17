import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { MoveTaskDto } from './dto/move-task.dto';
import { ClientJwtAuthGuard } from '../client-auth/guards/client-jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('Client Tasks')
@Controller('client/tasks')
@UseGuards(ClientJwtAuthGuard)
@ApiBearerAuth()
export class ClientTasksController {
  constructor(
    private readonly tasksService: TasksService,
    private readonly prisma: PrismaService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Kreiranje novog taska (Client)' })
  async create(@CurrentUser() user: any, @Body() createTaskDto: CreateTaskDto) {
    // Proveri da li task pripada klijentu
    const clientUser = await this.prisma.clientUser.findUnique({
      where: { id: user.sub },
    });

    if (!clientUser) {
      throw new ForbiddenException('Klijentski korisnik nije pronađen');
    }

    // Proveri da li je clientId isti kao kod klijenta
    if (createTaskDto.clientId !== user.clientId) {
      throw new ForbiddenException('Nemate pristup ovom klijentu');
    }

    return this.tasksService.create(
      createTaskDto,
      user.sub,
      'CLIENT',
    );
  }

  @Get('kanban')
  @ApiOperation({ summary: 'Kanban prikaz taskova za klijenta (Client)' })
  getKanban(@CurrentUser() user: any) {
    return this.tasksService.findByClient(user.clientId);
  }

  @Get('gantt')
  @ApiOperation({ summary: 'Gantt Chart prikaz taskova za klijenta (Client)' })
  getGantt(@CurrentUser() user: any) {
    return this.tasksService.getGantt(user.clientId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalji taska (Client)' })
  async findOne(@CurrentUser() user: any, @Param('id') id: string) {
    // Proveri da li task pripada klijentu
    const task = await this.prisma.task.findUnique({
      where: { id },
    });

    if (!task || task.clientId !== user.clientId) {
      throw new ForbiddenException('Nemate pristup ovom tasku');
    }

    return this.tasksService.findOne(id, undefined);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Ažuriranje taska (Client - samo određena polja)' })
  async update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() updateTaskDto: UpdateTaskDto,
  ) {
    // Proveri da li task pripada klijentu
    const task = await this.prisma.task.findUnique({
      where: { id },
    });

    if (!task || task.clientId !== user.clientId) {
      throw new ForbiddenException('Nemate pristup ovom tasku');
    }

    // Klijenti mogu da ažuriraju samo određena polja (ne status)
    const { status, ...allowedFields } = updateTaskDto;
    // Koristi update metodu bez companyId provere (klijent već proveren)
    return this.tasksService.updateForClient(id, allowedFields);
  }

  @Patch(':id/move')
  @ApiOperation({ summary: 'Premesti task u drugu kolonu (Client - ograničeno)' })
  async moveTask(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() moveTaskDto: MoveTaskDto,
  ) {
    // Proveri da li task pripada klijentu
    const task = await this.prisma.task.findUnique({
      where: { id },
    });

    if (!task || task.clientId !== user.clientId) {
      throw new ForbiddenException('Nemate pristup ovom tasku');
    }

    // Klijenti mogu da premeste task samo u određene statuse (ne u IN_PROGRESS ili DONE)
    if (moveTaskDto.status === 'IN_PROGRESS' || moveTaskDto.status === 'DONE') {
      throw new ForbiddenException('Nemate dozvolu da premestite task u ovaj status');
    }

    return this.tasksService.moveTask(id, moveTaskDto, undefined);
  }
}
