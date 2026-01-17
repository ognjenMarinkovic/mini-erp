import { Module } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { ClientsController } from './clients.controller';
import { NotificationsModule } from '../notifications/notifications.module';
import { ClientAuthModule } from '../client-auth/client-auth.module';

@Module({
  imports: [NotificationsModule, ClientAuthModule],
  providers: [ClientsService],
  controllers: [ClientsController],
})
export class ClientsModule {}
