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
  Query,
} from '@nestjs/common';
import { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import { FilesService } from './files.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

// Multer storage konfiguracija
const storage = diskStorage({
  destination: (req, file, callback) => {
    const uploadPath = './uploads/clients';
    // Kreiraj folder ako ne postoji
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

@ApiTags('Files')
@Controller('files')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('upload/:clientId')
  @ApiOperation({ summary: 'Upload fajla za klijenta (Admin)' })
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
    @Param('clientId') clientId: string,
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
      clientId,
      file,
      user.id,
      'ADMIN',
      user.companyId,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Lista fajlova za klijenta (Admin)' })
  @ApiQuery({ name: 'clientId', required: true })
  getClientFiles(@CurrentUser() user: any, @Query('clientId') clientId: string) {
    return this.filesService.getClientFiles(clientId, user.companyId);
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Download fajla (Admin)' })
  async downloadFile(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const file = await this.filesService.getFile(id, user.id, 'ADMIN', user.companyId);

    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${file.fileName}"`);

    const fileStream = fs.createReadStream(file.filePath);
    fileStream.pipe(res);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Brisanje fajla (Admin)' })
  deleteFile(@CurrentUser() user: any, @Param('id') id: string) {
    return this.filesService.deleteFile(id, user.id, 'ADMIN', user.companyId);
  }
}
