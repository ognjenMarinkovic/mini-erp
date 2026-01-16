import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { ClientLoginDto } from './dto/client-login.dto';
import { CreateClientUserDto } from './dto/create-client-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class ClientAuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  // Login za klijentske korisnike
  async login(loginDto: ClientLoginDto) {
    const clientUser = await this.prisma.clientUser.findUnique({
      where: { email: loginDto.email },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            companyId: true,
          },
        },
      },
    });

    if (!clientUser) {
      throw new UnauthorizedException('Pogrešan email ili lozinka');
    }

    if (!clientUser.isActive) {
      throw new UnauthorizedException('Vaš nalog je deaktiviran');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, clientUser.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Pogrešan email ili lozinka');
    }

    // Ažuriraj lastLogin
    await this.prisma.clientUser.update({
      where: { id: clientUser.id },
      data: { lastLogin: new Date() },
    });

    const token = this.generateToken(clientUser);

    return {
      user: {
        id: clientUser.id,
        email: clientUser.email,
        firstName: clientUser.firstName,
        lastName: clientUser.lastName,
        role: clientUser.role,
        clientId: clientUser.clientId,
        client: clientUser.client,
        userType: 'CLIENT',
      },
      token,
      message: 'Uspešna prijava!',
    };
  }

  // Kreiranje klijentskog korisnika (samo Admin može)
  async createClientUser(dto: CreateClientUserDto, companyId: string) {
    // Proveri da li klijent pripada kompaniji admina
    const client = await this.prisma.client.findFirst({
      where: { id: dto.clientId, companyId },
    });

    if (!client) {
      throw new ForbiddenException('Klijent ne pripada vašoj kompaniji');
    }

    // Proveri da li email već postoji
    const existingUser = await this.prisma.clientUser.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email već postoji u sistemu');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const clientUser = await this.prisma.clientUser.create({
      data: {
        clientId: dto.clientId,
        email: dto.email,
        password: hashedPassword,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: dto.role || 'MEMBER',
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        clientId: true,
        isActive: true,
        createdAt: true,
      },
    });

    return {
      ...clientUser,
      message: 'Klijentski korisnik uspešno kreiran',
    };
  }

  // Lista klijentskih korisnika za klijenta
  async getClientUsers(clientId: string, companyId: string) {
    // Proveri pristup
    const client = await this.prisma.client.findFirst({
      where: { id: clientId, companyId },
    });

    if (!client) {
      throw new ForbiddenException('Nemate pristup ovom klijentu');
    }

    return this.prisma.clientUser.findMany({
      where: { clientId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Deaktivacija/aktivacija klijentskog korisnika
  async toggleActive(clientUserId: string, companyId: string) {
    const clientUser = await this.prisma.clientUser.findUnique({
      where: { id: clientUserId },
      include: { client: true },
    });

    if (!clientUser) {
      throw new NotFoundException('Klijentski korisnik nije pronađen');
    }

    if (clientUser.client.companyId !== companyId) {
      throw new ForbiddenException('Nemate pristup ovom korisniku');
    }

    const updated = await this.prisma.clientUser.update({
      where: { id: clientUserId },
      data: { isActive: !clientUser.isActive },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true,
      },
    });

    return {
      ...updated,
      message: updated.isActive ? 'Korisnik aktiviran' : 'Korisnik deaktiviran',
    };
  }

  // Brisanje klijentskog korisnika
  async deleteClientUser(clientUserId: string, companyId: string) {
    const clientUser = await this.prisma.clientUser.findUnique({
      where: { id: clientUserId },
      include: { client: true },
    });

    if (!clientUser) {
      throw new NotFoundException('Klijentski korisnik nije pronađen');
    }

    if (clientUser.client.companyId !== companyId) {
      throw new ForbiddenException('Nemate pristup ovom korisniku');
    }

    await this.prisma.clientUser.delete({
      where: { id: clientUserId },
    });

    return { message: 'Klijentski korisnik uspešno obrisan' };
  }

  // Dobavi trenutnog client usera
  async getMe(clientUserId: string) {
    const clientUser = await this.prisma.clientUser.findUnique({
      where: { id: clientUserId },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            companyId: true,
          },
        },
      },
    });

    if (!clientUser) {
      throw new UnauthorizedException('Korisnik nije pronađen');
    }

    return {
      id: clientUser.id,
      email: clientUser.email,
      firstName: clientUser.firstName,
      lastName: clientUser.lastName,
      role: clientUser.role,
      clientId: clientUser.clientId,
      client: clientUser.client,
      userType: 'CLIENT',
    };
  }

  private generateToken(clientUser: any) {
    const payload = {
      sub: clientUser.id,
      email: clientUser.email,
      role: clientUser.role,
      clientId: clientUser.clientId,
      userType: 'CLIENT',
    };

    return this.jwtService.sign(payload);
  }
}
