import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Payments')
@Controller('payments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @ApiOperation({ summary: 'Evidentiranje uplate' })
  create(@CurrentUser() user: any, @Body() createPaymentDto: CreatePaymentDto) {
    return this.paymentsService.create(user.companyId, createPaymentDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista uplata za fakturu' })
  @ApiQuery({ name: 'invoiceId', required: true })
  findAll(@CurrentUser() user: any, @Query('invoiceId') invoiceId: string) {
    return this.paymentsService.findAll(invoiceId, user.companyId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Brisanje uplate' })
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.paymentsService.remove(id, user.companyId);
  }
}
