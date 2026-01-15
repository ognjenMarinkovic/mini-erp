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
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { InvoiceStatus } from '@prisma/client';

@ApiTags('Invoices')
@Controller('invoices')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post()
  @ApiOperation({ summary: 'Kreiranje nove fakture' })
  create(@CurrentUser() user: any, @Body() createInvoiceDto: CreateInvoiceDto) {
    return this.invoicesService.create(user.companyId, createInvoiceDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista faktura sa filterima' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'status', required: false, enum: InvoiceStatus })
  @ApiQuery({ name: 'clientId', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  findAll(
    @CurrentUser() user: any,
    @Query('search') search?: string,
    @Query('status') status?: InvoiceStatus,
    @Query('clientId') clientId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.invoicesService.findAll(user.companyId, {
      search,
      status,
      clientId,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalji fakture' })
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.invoicesService.findOne(id, user.companyId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Ažuriranje fakture' })
  update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() updateInvoiceDto: UpdateInvoiceDto,
  ) {
    return this.invoicesService.update(id, user.companyId, updateInvoiceDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Brisanje fakture' })
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.invoicesService.remove(id, user.companyId);
  }
}
