import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class FilesService {
  constructor(private prisma: PrismaService) {}

  // Upload fajla (Admin ili Client)
  async uploadFile(
    clientId: string,
    file: Express.Multer.File,
    uploaderId: string,
    uploaderType: 'ADMIN' | 'CLIENT',
    companyId?: string,
  ) {
    // Proveri pristup klijentu
    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      throw new NotFoundException('Klijent nije pronađen');
    }

    // Admin mora da bude iz iste kompanije
    if (uploaderType === 'ADMIN' && companyId && client.companyId !== companyId) {
      throw new ForbiddenException('Nemate pristup ovom klijentu');
    }

    // Client mora da bude za istog klijenta
    if (uploaderType === 'CLIENT') {
      const clientUser = await this.prisma.clientUser.findUnique({
        where: { id: uploaderId },
      });
      if (!clientUser || clientUser.clientId !== clientId) {
        throw new ForbiddenException('Nemate pristup ovom klijentu');
      }
    }

    return this.prisma.clientFile.create({
      data: {
        clientId,
        uploaderId,
        uploaderType,
        fileName: file.originalname,
        filePath: file.path,
        mimeType: file.mimetype,
        fileSize: file.size,
      },
    });
  }

  // Lista fajlova za klijenta
  async getClientFiles(clientId: string, companyId?: string) {
    // Proveri pristup
    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      throw new NotFoundException('Klijent nije pronađen');
    }

    if (companyId && client.companyId !== companyId) {
      throw new ForbiddenException('Nemate pristup ovom klijentu');
    }

    return this.prisma.clientFile.findMany({
      where: { clientId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Brisanje fajla
  async deleteFile(
    fileId: string,
    userId: string,
    userType: 'ADMIN' | 'CLIENT',
    companyId?: string,
  ) {
    const file = await this.prisma.clientFile.findUnique({
      where: { id: fileId },
      include: {
        client: true,
      },
    });

    if (!file) {
      throw new NotFoundException('Fajl nije pronađen');
    }

    // Admin može obrisati bilo koji fajl za svoju kompaniju
    const isAdmin = userType === 'ADMIN' && companyId === file.client.companyId;
    // Uploader može obrisati svoj fajl
    const isUploader = file.uploaderId === userId && file.uploaderType === userType;

    if (!isAdmin && !isUploader) {
      throw new ForbiddenException('Nemate pravo da obrišete ovaj fajl');
    }

    // Obriši fajl sa diska
    try {
      if (fs.existsSync(file.filePath)) {
        fs.unlinkSync(file.filePath);
      }
    } catch (error) {
      console.error(`Greška pri brisanju fajla: ${file.filePath}`, error);
    }

    await this.prisma.clientFile.delete({
      where: { id: fileId },
    });

    return { message: 'Fajl uspešno obrisan' };
  }

  // Dobavi fajl po ID-u (za download)
  async getFile(fileId: string, userId: string, userType: 'ADMIN' | 'CLIENT', companyId?: string) {
    const file = await this.prisma.clientFile.findUnique({
      where: { id: fileId },
      include: {
        client: true,
      },
    });

    if (!file) {
      throw new NotFoundException('Fajl nije pronađen');
    }

    // Proveri pristup
    if (userType === 'ADMIN' && companyId && file.client.companyId !== companyId) {
      throw new ForbiddenException('Nemate pristup ovom fajlu');
    }

    if (userType === 'CLIENT') {
      const clientUser = await this.prisma.clientUser.findUnique({
        where: { id: userId },
      });
      if (!clientUser || clientUser.clientId !== file.clientId) {
        throw new ForbiddenException('Nemate pristup ovom fajlu');
      }
    }

    return file;
  }
}
