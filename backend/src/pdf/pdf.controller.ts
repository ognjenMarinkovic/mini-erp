import { Controller, Get, Param, UseGuards, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { PdfService } from './pdf.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('PDF')
@Controller('pdf')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PdfController {
  constructor(private readonly pdfService: PdfService) {}

  @Get('invoice/:id')
  @ApiOperation({ summary: 'Generisanje PDF fakture' })
  async getInvoicePdf(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const pdfBuffer = await this.pdfService.generateInvoicePdf(id, user.companyId);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=faktura-${id}.pdf`,
      'Content-Length': pdfBuffer.length,
    });

    res.send(pdfBuffer);
  }
}
