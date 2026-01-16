import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { TimeTrackingService } from './time-tracking.service';
import { CreateTimeEntryDto, UpdateTimeEntryDto, StopTimerDto } from './dto/create-time-entry.dto';

@ApiTags('time-tracking')
@ApiBearerAuth()
@Controller('time-tracking')
@UseGuards(JwtAuthGuard)
export class TimeTrackingController {
  constructor(private readonly timeTrackingService: TimeTrackingService) {}

  @Post()
  @ApiOperation({ summary: 'Kreiraj time entry (start timer)' })
  create(@Body() dto: CreateTimeEntryDto, @CurrentUser() user: any) {
    return this.timeTrackingService.create(dto, user.id, user.companyId);
  }

  @Post(':id/stop')
  @ApiOperation({ summary: 'Zaustavi timer' })
  stopTimer(
    @Param('id') id: string,
    @Body() dto: StopTimerDto,
    @CurrentUser() user: any,
  ) {
    return this.timeTrackingService.stopTimer(id, dto, user.id, user.companyId);
  }

  @Get()
  @ApiOperation({ summary: 'Lista svih time entries' })
  @ApiQuery({ name: 'clientId', required: false })
  @ApiQuery({ name: 'taskId', required: false })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'billable', required: false })
  findAll(
    @CurrentUser() user: any,
    @Query('clientId') clientId?: string,
    @Query('taskId') taskId?: string,
    @Query('userId') userId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('billable') billable?: string,
  ) {
    return this.timeTrackingService.findAll(user.companyId, {
      clientId,
      taskId,
      userId,
      startDate,
      endDate,
      billable: billable ? billable === 'true' : undefined,
    });
  }

  @Get('active')
  @ApiOperation({ summary: 'Dohvati aktivne timere' })
  getActiveTimers(@CurrentUser() user: any) {
    return this.timeTrackingService.getActiveTimers(user.id, user.companyId);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Statistika vremena' })
  @ApiQuery({ name: 'period', required: false, enum: ['day', 'week', 'month'] })
  getStats(
    @CurrentUser() user: any,
    @Query('period') period: 'day' | 'week' | 'month' = 'week',
  ) {
    return this.timeTrackingService.getStats(user.companyId, period);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Dohvati time entry' })
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.timeTrackingService.findOne(id, user.companyId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Ažuriraj time entry' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateTimeEntryDto,
    @CurrentUser() user: any,
  ) {
    return this.timeTrackingService.update(id, dto, user.companyId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Obriši time entry' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.timeTrackingService.remove(id, user.companyId);
  }
}
