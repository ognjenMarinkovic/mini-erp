import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { CommentsService } from './comments.service';
import { CommentsController } from './comments.controller';
import { ClientCommentsController } from './client-comments.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    MulterModule.register({
      dest: './uploads/comments',
    }),
    NotificationsModule,
  ],
  providers: [CommentsService],
  controllers: [CommentsController, ClientCommentsController],
  exports: [CommentsService],
})
export class CommentsModule {}
