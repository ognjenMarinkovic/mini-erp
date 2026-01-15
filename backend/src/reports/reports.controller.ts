import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Reports')
@Controller('reports')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Dashboard statistika' })
  getDashboard(@CurrentUser() user: any) {
    return this.reportsService.getDashboard(user.companyId);
  }

  @Get('revenue')
  @ApiOperation({ summary: 'Izveštaj prihoda po periodu' })
  @ApiQuery({ name: 'fromDate', required: true, example: '2026-01-01' })
  @ApiQuery({ name: 'toDate', required: true, example: '2026-12-31' })
  getRevenueReport(
    @CurrentUser() user: any,
    @Query('fromDate') fromDate: string,
    @Query('toDate') toDate: string,
  ) {
    return this.reportsService.getRevenueReport(user.companyId, fromDate, toDate);
  }

  @Get('expenses')
  @ApiOperation({ summary: 'Izveštaj troškova po periodu i kategorijama' })
  @ApiQuery({ name: 'fromDate', required: true, example: '2026-01-01' })
  @ApiQuery({ name: 'toDate', required: true, example: '2026-12-31' })
  getExpensesReport(
    @CurrentUser() user: any,
    @Query('fromDate') fromDate: string,
    @Query('toDate') toDate: string,
  ) {
    return this.reportsService.getExpensesReport(user.companyId, fromDate, toDate);
  }

  @Get('top-clients')
  @ApiOperation({ summary: 'Top klijenti po prihodu' })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  getTopClients(@CurrentUser() user: any, @Query('limit') limit?: string) {
    return this.reportsService.getTopClients(
      user.companyId,
      limit ? parseInt(limit) : 10,
    );
  }
}
