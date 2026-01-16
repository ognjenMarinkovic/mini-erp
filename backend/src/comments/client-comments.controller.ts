import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { ClientJwtAuthGuard } from '../client-auth/guards/client-jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { ForbiddenException } from '@nestjs/common';

@ApiTags('Client Comments')
@Controller('client/comments')
@UseGuards(ClientJwtAuthGuard)
@ApiBearerAuth()
export class ClientCommentsController {
  constructor(
    private readonly commentsService: CommentsService,
    private readonly prisma: PrismaService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Kreiranje komentara (Client)' })
  async create(@CurrentUser() user: any, @Body() createCommentDto: CreateCommentDto) {
    // Dohvati ime klijenta
    const clientUser = await this.prisma.clientUser.findUnique({
      where: { id: user.sub },
    });

    if (!clientUser) {
      throw new ForbiddenException('Klijentski korisnik nije pronađen');
    }

    // Proveri da li task pripada klijentu
    const task = await this.prisma.task.findUnique({
      where: { id: createCommentDto.taskId },
    });

    if (!task || task.clientId !== user.clientId) {
      throw new ForbiddenException('Nemate pristup ovom tasku');
    }

    const authorName = `${clientUser.firstName} ${clientUser.lastName}`;
    return this.commentsService.create(
      createCommentDto,
      user.sub,
      'CLIENT',
      authorName,
    );
  }

  @Get('task/:taskId')
  @ApiOperation({ summary: 'Svi komentari za task (Client)' })
  async findByTask(@CurrentUser() user: any, @Param('taskId') taskId: string) {
    // Proveri da li task pripada klijentu
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task || task.clientId !== user.clientId) {
      throw new ForbiddenException('Nemate pristup ovom tasku');
    }

    return this.commentsService.findByTask(taskId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Ažuriranje komentara (Client)' })
  update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() updateCommentDto: UpdateCommentDto,
  ) {
    return this.commentsService.update(id, updateCommentDto, user.sub, 'CLIENT');
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Brisanje komentara (Client)' })
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.commentsService.remove(id, user.sub, 'CLIENT');
  }
}
