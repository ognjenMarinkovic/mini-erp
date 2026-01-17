import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { ClientTasksController } from './client-tasks.controller';
import { NotificationsModule } from '../notifications/notifications.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [NotificationsModule, PrismaModule],
  providers: [TasksService],
  controllers: [TasksController, ClientTasksController],
  exports: [TasksService],
})
export class TasksModule {}
