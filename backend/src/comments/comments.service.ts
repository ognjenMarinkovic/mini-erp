import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class CommentsService {
  constructor(private prisma: PrismaService) {}

  // Kreiranje komentara (Admin ili Client)
  async create(
    createCommentDto: CreateCommentDto,
    authorId: string,
    authorType: 'ADMIN' | 'CLIENT',
    authorName: string,
    companyId?: string,
  ) {
    // Proveri da li task postoji i da li korisnik ima pristup
    const task = await this.prisma.task.findUnique({
      where: { id: createCommentDto.taskId },
      include: {
        client: { select: { companyId: true } },
      },
    });

    if (!task) {
      throw new NotFoundException('Task nije pronađen');
    }

    // Admin pristup - proveri kompaniju
    if (authorType === 'ADMIN' && companyId && task.client.companyId !== companyId) {
      throw new ForbiddenException('Nemate pristup ovom tasku');
    }

    // Proveri parent komentar ako postoji
    if (createCommentDto.parentId) {
      const parentComment = await this.prisma.comment.findUnique({
        where: { id: createCommentDto.parentId },
      });
      if (!parentComment || parentComment.taskId !== createCommentDto.taskId) {
        throw new NotFoundException('Parent komentar nije pronađen');
      }
    }

    return this.prisma.comment.create({
      data: {
        taskId: createCommentDto.taskId,
        content: createCommentDto.content,
        parentId: createCommentDto.parentId,
        authorId,
        authorType,
        authorName,
      },
      include: {
        attachments: true,
        replies: {
          include: { attachments: true },
        },
      },
    });
  }

  // Svi komentari za task
  async findByTask(taskId: string, companyId?: string) {
    // Proveri pristup
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        client: { select: { companyId: true } },
      },
    });

    if (!task) {
      throw new NotFoundException('Task nije pronađen');
    }

    if (companyId && task.client.companyId !== companyId) {
      throw new ForbiddenException('Nemate pristup ovom tasku');
    }

    // Vrati samo root komentare (bez parenta), replies su uključeni
    return this.prisma.comment.findMany({
      where: {
        taskId,
        parentId: null, // Samo root komentari
      },
      orderBy: { createdAt: 'asc' },
      include: {
        attachments: true,
        replies: {
          orderBy: { createdAt: 'asc' },
          include: { attachments: true },
        },
      },
    });
  }

  // Ažuriranje komentara (samo autor)
  async update(
    id: string,
    updateCommentDto: UpdateCommentDto,
    authorId: string,
    authorType: 'ADMIN' | 'CLIENT',
  ) {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
    });

    if (!comment) {
      throw new NotFoundException('Komentar nije pronađen');
    }

    // Proveri da li je autor
    if (comment.authorId !== authorId || comment.authorType !== authorType) {
      throw new ForbiddenException('Možete menjati samo svoje komentare');
    }

    return this.prisma.comment.update({
      where: { id },
      data: updateCommentDto,
      include: {
        attachments: true,
      },
    });
  }

  // Brisanje komentara (autor ili Admin)
  async remove(
    id: string,
    authorId: string,
    authorType: 'ADMIN' | 'CLIENT',
    companyId?: string,
  ) {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
      include: {
        attachments: true,
        task: {
          include: {
            client: { select: { companyId: true } },
          },
        },
      },
    });

    if (!comment) {
      throw new NotFoundException('Komentar nije pronađen');
    }

    // Admin može obrisati bilo koji komentar u svojoj kompaniji
    const isAdmin = authorType === 'ADMIN' && companyId === comment.task.client.companyId;
    const isAuthor = comment.authorId === authorId && comment.authorType === authorType;

    if (!isAdmin && !isAuthor) {
      throw new ForbiddenException('Nemate pravo da obrišete ovaj komentar');
    }

    // Obriši attachment fajlove sa diska
    for (const attachment of comment.attachments) {
      try {
        if (fs.existsSync(attachment.filePath)) {
          fs.unlinkSync(attachment.filePath);
        }
      } catch (error) {
        console.error(`Greška pri brisanju fajla: ${attachment.filePath}`, error);
      }
    }

    await this.prisma.comment.delete({
      where: { id },
    });

    return { message: 'Komentar uspešno obrisan' };
  }

  // Dodaj attachment na komentar
  async addAttachment(
    commentId: string,
    file: Express.Multer.File,
    authorId: string,
    authorType: 'ADMIN' | 'CLIENT',
  ) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('Komentar nije pronađen');
    }

    // Proveri da li je autor komentara
    if (comment.authorId !== authorId || comment.authorType !== authorType) {
      throw new ForbiddenException('Možete dodavati attachmente samo na svoje komentare');
    }

    return this.prisma.commentAttachment.create({
      data: {
        commentId,
        fileName: file.originalname,
        filePath: file.path,
        fileType: file.mimetype,
        fileSize: file.size,
      },
    });
  }

  // Obriši attachment
  async removeAttachment(
    attachmentId: string,
    authorId: string,
    authorType: 'ADMIN' | 'CLIENT',
  ) {
    const attachment = await this.prisma.commentAttachment.findUnique({
      where: { id: attachmentId },
      include: {
        comment: true,
      },
    });

    if (!attachment) {
      throw new NotFoundException('Attachment nije pronađen');
    }

    // Proveri da li je autor komentara
    if (
      attachment.comment.authorId !== authorId ||
      attachment.comment.authorType !== authorType
    ) {
      throw new ForbiddenException('Nemate pravo da obrišete ovaj attachment');
    }

    // Obriši fajl sa diska
    try {
      if (fs.existsSync(attachment.filePath)) {
        fs.unlinkSync(attachment.filePath);
      }
    } catch (error) {
      console.error(`Greška pri brisanju fajla: ${attachment.filePath}`, error);
    }

    await this.prisma.commentAttachment.delete({
      where: { id: attachmentId },
    });

    return { message: 'Attachment uspešno obrisan' };
  }
}
