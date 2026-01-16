import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { FilesService } from './files.service';
import { FilesController } from './files.controller';
import { ClientFilesController } from './client-files.controller';

@Module({
  imports: [
    MulterModule.register({
      dest: './uploads/clients',
    }),
  ],
  providers: [FilesService],
  controllers: [FilesController, ClientFilesController],
  exports: [FilesService],
})
export class FilesModule {}
