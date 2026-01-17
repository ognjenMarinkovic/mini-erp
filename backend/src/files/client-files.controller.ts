import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import { FilesService } from './files.service';
import { ClientJwtAuthGuard } from '../client-auth/guards/client-jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

// Multer storage konfiguracija
const storage = diskStorage({
  destination: (req, file, callback) => {
    const uploadPath = './uploads/clients';
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    callback(null, uploadPath);
  },
  filename: (req, file, callback) => {
    const uniqueName = `${uuidv4()}${extname(file.originalname)}`;
    callback(null, uniqueName);
  },
});

@ApiTags('Client Files')
@Controller('client/files')
@UseGuards(ClientJwtAuthGuard)
@ApiBearerAuth()
export class ClientFilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('upload')
  @ApiOperation({ summary: 'Upload fajla (Client)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file', { storage }))
  uploadFile(
    @CurrentUser() user: any,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 50 * 1024 * 1024 }), // 50MB
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.filesService.uploadFile(
      user.clientId,
      file,
      user.sub,
      'CLIENT',
    );
  }

  @Get()
  @ApiOperation({ summary: 'Lista mojih fajlova (Client)' })
  getMyFiles(@CurrentUser() user: any) {
    return this.filesService.getClientFiles(user.clientId);
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Download fajla (Client)' })
  async downloadFile(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const file = await this.filesService.getFile(id, user.sub, 'CLIENT');

    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${file.fileName}"`);

    const fileStream = fs.createReadStream(file.filePath);
    fileStream.pipe(res);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Brisanje fajla (Client)' })
  deleteFile(@CurrentUser() user: any, @Param('id') id: string) {
    return this.filesService.deleteFile(id, user.sub, 'CLIENT');
  }
}
