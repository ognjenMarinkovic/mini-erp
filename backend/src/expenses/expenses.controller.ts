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
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ExpenseCategory } from '@prisma/client';

@ApiTags('Expenses')
@Controller('expenses')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Post()
  @ApiOperation({ summary: 'Kreiranje novog troška' })
  create(@CurrentUser() user: any, @Body() createExpenseDto: CreateExpenseDto) {
    return this.expensesService.create(user.companyId, createExpenseDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista troškova sa filterima' })
  @ApiQuery({ name: 'category', required: false, enum: ExpenseCategory })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'fromDate', required: false })
  @ApiQuery({ name: 'toDate', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  findAll(
    @CurrentUser() user: any,
    @Query('category') category?: ExpenseCategory,
    @Query('search') search?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.expensesService.findAll(user.companyId, {
      category,
      search,
      fromDate,
      toDate,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalji troška' })
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.expensesService.findOne(id, user.companyId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Ažuriranje troška' })
  update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() updateExpenseDto: UpdateExpenseDto,
  ) {
    return this.expensesService.update(id, user.companyId, updateExpenseDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Brisanje troška' })
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.expensesService.remove(id, user.companyId);
  }
}
