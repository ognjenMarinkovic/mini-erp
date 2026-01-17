import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../notifications/email.service';
import { ClientLoginDto } from './dto/client-login.dto';
import { CreateClientUserDto } from './dto/create-client-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class ClientAuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private emailService: EmailService,
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

    // Proveri da li korisnik ima postavljenu šifru (ne placeholder)
    // Placeholder šifre imaju specifičan pattern - pokušaj da proveriš
    // Pokušaj da proveriš da li je ovo placeholder šifra
    // Placeholder šifre se kreiraju sa pattern-om: PLACEHOLDER_SETUP_REQUIRED_${client.id}_${timestamp}_${random}
    // Pokušaj da proveriš da li se može logovati sa nekim od placeholder pattern-a
    try {
      // Proveri da li je ovo placeholder šifra - pokušaj sa različitim pattern-ima
      const placeholderPatterns = [
        `PLACEHOLDER_SETUP_REQUIRED_${clientUser.clientId}`,
        'PLACEHOLDER_SETUP_REQUIRED',
      ];

      let isPlaceholder = false;
      for (const pattern of placeholderPatterns) {
        try {
          const matches = await bcrypt.compare(pattern, clientUser.password);
          if (matches) {
            isPlaceholder = true;
            break;
          }
        } catch (e) {
          // Ignoriši greške pri proveri
        }
      }

      if (isPlaceholder) {
        throw new UnauthorizedException('Morate prvo postaviti šifru. Proverite vaš email za link.');
      }
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      // Ako dođe do greške pri proveri, nastavi sa normalnom proverom
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
        notifyTaskInProgress: clientUser.notifyTaskInProgress ?? true,
        notifyTaskReview: clientUser.notifyTaskReview ?? true,
        notifyTaskCompleted: clientUser.notifyTaskCompleted ?? true,
        notifyNewComment: clientUser.notifyNewComment ?? true,
      },
      token,
      message: 'Uspešna prijava!',
    };
  }

  // Kreiranje klijentskog korisnika (samo SUPERADMIN može)
  async createClientUser(dto: CreateClientUserDto, companyId: string, userRole: string) {
    // Proveri da li je korisnik SUPERADMIN
    if (userRole !== 'SUPERADMIN') {
      throw new ForbiddenException('Samo superadmin može kreirati klijentske naloge');
    }

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
      notifyTaskInProgress: clientUser.notifyTaskInProgress ?? true,
      notifyTaskReview: clientUser.notifyTaskReview ?? true,
      notifyTaskCompleted: clientUser.notifyTaskCompleted ?? true,
      notifyNewComment: clientUser.notifyNewComment ?? true,
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

  // Generisanje JWT tokena za postavljanje šifre (traje 7 dana)
  generatePasswordSetupToken(clientUserId: string, email: string): string {
    const payload = {
      sub: clientUserId,
      email: email,
      type: 'password-setup',
    };

    return this.jwtService.sign(payload, { expiresIn: '7d' });
  }

  // Postavljanje šifre preko tokena
  async setupPassword(token: string, password: string) {
    try {
      // Dekodiraj token
      const payload = this.jwtService.verify(token);

      // Proveri da li je token tipa password-setup
      if (payload.type !== 'password-setup') {
        throw new ForbiddenException('Nevažeći token');
      }

      // Pronađi ClientUser
      const clientUser = await this.prisma.clientUser.findUnique({
        where: { id: payload.sub },
      });

      if (!clientUser) {
        throw new NotFoundException('Korisnik nije pronađen');
      }

      // Proveri da li email odgovara
      if (clientUser.email !== payload.email) {
        throw new ForbiddenException('Nevažeći token');
      }

      // Hash-uj novu šifru
      const hashedPassword = await bcrypt.hash(password, 10);

      // Ažuriraj šifru
      await this.prisma.clientUser.update({
        where: { id: clientUser.id },
        data: { password: hashedPassword },
      });

      return {
        message: 'Šifra je uspešno postavljena. Možete se prijaviti.',
      };
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new ForbiddenException('Token je istekao. Molimo zatražite novi link.');
      }
      if (error.name === 'JsonWebTokenError') {
        throw new ForbiddenException('Nevažeći token');
      }
      throw error;
    }
  }

  // Promena šifre (za autentifikovane korisnike)
  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const clientUser = await this.prisma.clientUser.findUnique({
      where: { id: userId },
    });

    if (!clientUser) {
      throw new NotFoundException('Korisnik nije pronađen');
    }

    // Proveri trenutnu šifru
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, clientUser.password);

    if (!isCurrentPasswordValid) {
      throw new ForbiddenException('Trenutna šifra nije tačna');
    }

    // Hash-uj novu šifru
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Ažuriraj šifru
    await this.prisma.clientUser.update({
      where: { id: userId },
      data: { password: hashedNewPassword },
    });

    return {
      message: 'Šifra je uspešno promenjena',
    };
  }

  // Ažuriranje profila
  async updateProfile(userId: string, updateData: { firstName?: string; lastName?: string }) {
    const clientUser = await this.prisma.clientUser.findUnique({
      where: { id: userId },
    });

    if (!clientUser) {
      throw new NotFoundException('Korisnik nije pronađen');
    }

    const updatePayload: any = {};
    if (updateData.firstName !== undefined) {
      updatePayload.firstName = updateData.firstName;
    }
    if (updateData.lastName !== undefined) {
      updatePayload.lastName = updateData.lastName;
    }

    const updated = await this.prisma.clientUser.update({
      where: { id: userId },
      data: updatePayload,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        clientId: true,
      },
    });

    return {
      ...updated,
      message: 'Profil je uspešno ažuriran',
    };
  }

  // Ažuriranje notification preferences
  async updateNotificationPreferences(
    userId: string,
    updateData: {
      notifyTaskInProgress?: boolean;
      notifyTaskReview?: boolean;
      notifyTaskCompleted?: boolean;
      notifyNewComment?: boolean;
    },
  ) {
    const clientUser = await this.prisma.clientUser.findUnique({
      where: { id: userId },
    });

    if (!clientUser) {
      throw new NotFoundException('Korisnik nije pronađen');
    }

    const updatePayload: any = {};
    if (updateData.notifyTaskInProgress !== undefined) {
      updatePayload.notifyTaskInProgress = updateData.notifyTaskInProgress;
    }
    if (updateData.notifyTaskReview !== undefined) {
      updatePayload.notifyTaskReview = updateData.notifyTaskReview;
    }
    if (updateData.notifyTaskCompleted !== undefined) {
      updatePayload.notifyTaskCompleted = updateData.notifyTaskCompleted;
    }
    if (updateData.notifyNewComment !== undefined) {
      updatePayload.notifyNewComment = updateData.notifyNewComment;
    }

    const updated = await this.prisma.clientUser.update({
      where: { id: userId },
      data: updatePayload,
      select: {
        id: true,
        notifyTaskInProgress: true,
        notifyTaskReview: true,
        notifyTaskCompleted: true,
        notifyNewComment: true,
      },
    });

    return {
      ...updated,
      message: 'Notification preferences su uspešno ažurirane',
    };
  }

  // Ponovno slanje email-a za postavljanje šifre
  async resendPasswordSetupEmail(clientUserId: string, companyId: string) {
    const clientUser = await this.prisma.clientUser.findUnique({
      where: { id: clientUserId },
      include: {
        client: {
          select: {
            id: true,
            companyId: true,
          },
        },
      },
    });

    if (!clientUser) {
      throw new NotFoundException('Klijentski korisnik nije pronađen');
    }

    // Proveri da li klijent pripada kompaniji
    if (clientUser.client.companyId !== companyId) {
      throw new ForbiddenException('Nemate pristup ovom korisniku');
    }

    // Dohvati kompaniju
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: { name: true },
    });

    // Generiši novi token
    const setupToken = this.generatePasswordSetupToken(clientUser.id, clientUser.email);

    // Pošalji email
    const emailSent = await this.emailService.sendPasswordSetupEmail(
      clientUser,
      setupToken,
      company?.name || 'Agencija',
    );

    if (!emailSent) {
      throw new Error('Greška pri slanju email-a');
    }

    return {
      message: 'Email sa linkom za postavljanje šifre je ponovo poslat',
    };
  }
}
