import { Controller, Post, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { EmailService } from './email.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly emailService: EmailService,
  ) {}

  @Post('check-overdue')
  @ApiOperation({ summary: 'Manualna provera prekoračenih faktura i slanje email-ova' })
  async checkOverdue() {
    return this.notificationsService.manualCheckOverdue();
  }

  @Post('test-email')
  @ApiOperation({ summary: 'Test email konfiguracije' })
  @ApiQuery({ name: 'email', required: true, example: 'test@example.com' })
  async testEmail(@Query('email') email: string) {
    const sent = await this.emailService.sendTestEmail(email);
    return {
      success: sent,
      message: sent
        ? `Test email poslat na ${email}`
        : 'Greška pri slanju test email-a. Proveri SMTP konfiguraciju.',
    };
  }
}
