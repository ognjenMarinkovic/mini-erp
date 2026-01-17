import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ClientsModule } from './clients/clients.module';
import { InvoicesModule } from './invoices/invoices.module';
import { PaymentsModule } from './payments/payments.module';
import { ExpensesModule } from './expenses/expenses.module';
import { ReportsModule } from './reports/reports.module';
import { PdfModule } from './pdf/pdf.module';
import { NotificationsModule } from './notifications/notifications.module';
// Agency Management moduli
import { TasksModule } from './tasks/tasks.module';
import { CommentsModule } from './comments/comments.module';
import { ClientAuthModule } from './client-auth/client-auth.module';
import { FilesModule } from './files/files.module';
import { TaskDependenciesModule } from './task-dependencies/task-dependencies.module';
import { TimeTrackingModule } from './time-tracking/time-tracking.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    ClientsModule,
    InvoicesModule,
    PaymentsModule,
    ExpensesModule,
    ReportsModule,
    PdfModule,
    NotificationsModule,
    // Agency Management
    TasksModule,
    CommentsModule,
    ClientAuthModule,
    FilesModule,
    TaskDependenciesModule,
    TimeTrackingModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
