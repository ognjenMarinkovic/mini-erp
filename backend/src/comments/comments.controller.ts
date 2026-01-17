import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
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
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

// Multer storage konfiguracija
const storage = diskStorage({
  destination: './uploads/comments',
  filename: (req, file, callback) => {
    const uniqueName = `${uuidv4()}${extname(file.originalname)}`;
    callback(null, uniqueName);
  },
});

@ApiTags('Comments')
@Controller('comments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  @ApiOperation({ summary: 'Kreiranje novog komentara' })
  create(@CurrentUser() user: any, @Body() createCommentDto: CreateCommentDto) {
    const authorName = `${user.firstName} ${user.lastName}`;
    return this.commentsService.create(
      createCommentDto,
      user.id,
      'ADMIN',
      authorName,
      user.companyId,
    );
  }

  @Get('task/:taskId')
  @ApiOperation({ summary: 'Svi komentari za task' })
  findByTask(@CurrentUser() user: any, @Param('taskId') taskId: string) {
    return this.commentsService.findByTask(taskId, user.companyId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Ažuriranje komentara' })
  update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() updateCommentDto: UpdateCommentDto,
  ) {
    return this.commentsService.update(id, updateCommentDto, user.id, 'ADMIN');
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Brisanje komentara' })
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.commentsService.remove(id, user.id, 'ADMIN', user.companyId);
  }

  @Post(':id/attachment')
  @ApiOperation({ summary: 'Upload attachment na komentar' })
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
  addAttachment(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 50 * 1024 * 1024 }), // 50MB
          new FileTypeValidator({
            fileType: /(jpg|jpeg|png|gif|webp|pdf|doc|docx|xls|xlsx|zip|rar|svg|ai|psd|fig)$/,
          }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.commentsService.addAttachment(id, file, user.id, 'ADMIN');
  }

  @Delete('attachment/:attachmentId')
  @ApiOperation({ summary: 'Brisanje attachment-a' })
  removeAttachment(
    @CurrentUser() user: any,
    @Param('attachmentId') attachmentId: string,
  ) {
    return this.commentsService.removeAttachment(attachmentId, user.id, 'ADMIN');
  }
}
