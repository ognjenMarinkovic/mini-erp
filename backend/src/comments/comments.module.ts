import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { CommentsService } from './comments.service';
import { CommentsController } from './comments.controller';

@Module({
  imports: [
    MulterModule.register({
      dest: './uploads/comments',
    }),
  ],
  providers: [CommentsService],
  controllers: [CommentsController],
  exports: [CommentsService],
})
export class CommentsModule {}
