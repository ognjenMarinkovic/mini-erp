import { Injectable, UnauthorizedException, ConflictException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const SUPERADMIN_EMAIL = 'ognjenmarinkovic369@gmail.com';
    const isSuperAdmin = registerDto.email === SUPERADMIN_EMAIL;

    // Provera da li email već postoji (proveri i User i ClientUser)
    const existingUser = await this.prisma.user.findUnique({
      where: { email: registerDto.email },
    });

    const existingClientUser = await this.prisma.clientUser.findUnique({
      where: { email: registerDto.email },
    });

    if (existingUser || existingClientUser) {
      throw new ConflictException('Email već postoji u sistemu');
    }

    // Hash lozinke
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    if (isSuperAdmin) {
      // SUPERADMIN - kreira Company i User sa SUPERADMIN role
    // Provera da li PIB već postoji
    const existingCompany = await this.prisma.company.findUnique({
      where: { pib: registerDto.pib },
    });

    if (existingCompany) {
      throw new ConflictException('Kompanija sa ovim PIB-om već postoji');
    }

      // Kreiranje kompanije i superadmin korisnika (transakcija)
    const result = await this.prisma.$transaction(async (prisma) => {
      // Kreiranje kompanije
      const company = await prisma.company.create({
        data: {
          name: registerDto.companyName,
          pib: registerDto.pib,
          address: registerDto.address,
          city: registerDto.city,
          phone: registerDto.phone,
          email: registerDto.email,
        },
      });

        // Kreiranje superadmin korisnika
      const user = await prisma.user.create({
        data: {
          email: registerDto.email,
          password: hashedPassword,
          firstName: registerDto.firstName,
          lastName: registerDto.lastName,
            role: 'SUPERADMIN',
          companyId: company.id,
        },
      });

      return { user, company };
    });

    // Generisanje JWT tokena
    const token = this.generateToken(result.user);

    return {
      user: {
        id: result.user.id,
        email: result.user.email,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        role: result.user.role,
        companyId: result.user.companyId,
      },
      token,
      message: 'Registracija uspešna!',
    };
    } else {
      // Samo superadmin može da se registruje
      throw new ForbiddenException('Registracija je dozvoljena samo za superadmin nalog. Kontaktirajte administratora za kreiranje naloga.');
    }
  }

  async login(loginDto: LoginDto) {
    // Pronađi korisnika
    const user = await this.prisma.user.findUnique({
      where: { email: loginDto.email },
      include: { company: true },
    });

    if (!user) {
      throw new UnauthorizedException('Pogrešan email ili lozinka');
    }

    // Provera lozinke
    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Pogrešan email ili lozinka');
    }

    // Debug logovanje - proveri role pre generisanja tokena
    console.log('=== LOGIN ===');
    console.log('User from database:', {
      id: user.id,
      email: user.email,
      role: user.role,
      roleType: typeof user.role,
    });

    // Generisanje JWT tokena
    const token = this.generateToken(user);
    
    // Dekodiraj token da proverimo šta je u njemu
    const decoded = this.jwtService.decode(token) as any;
    console.log('Token payload:', decoded);
    console.log('=============');

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        companyId: user.companyId,
        company: {
          id: user.company.id,
          name: user.company.name,
          pib: user.company.pib,
        },
      },
      token,
      message: 'Uspešna prijava!',
    };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { company: true },
    });

    if (!user) {
      throw new UnauthorizedException('Korisnik nije pronađen');
    }
    
    // Debug logovanje - proveri role iz baze
    console.log('=== GET ME ===');
    console.log('User from database:', {
      id: user.id,
      email: user.email,
      role: user.role,
      roleType: typeof user.role,
    });
    console.log('==============');

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      companyId: user.companyId,
      company: {
        id: user.company.id,
        name: user.company.name,
        pib: user.company.pib,
      },
    };
  }

  // Kreiranje novog admin korisnika (samo SUPERADMIN)
  async createAdmin(createAdminDto: any, currentUserRole: string, companyId: string) {
    // Provera da li je trenutni korisnik SUPERADMIN
    if (currentUserRole !== 'SUPERADMIN') {
      throw new UnauthorizedException('Samo superadmin može kreirati admin korisnike');
    }

    // Provera da li email već postoji
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createAdminDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email već postoji u sistemu');
    }

    // Hash lozinke
    const hashedPassword = await bcrypt.hash(createAdminDto.password, 10);

    // Kreiranje admin korisnika
    const user = await this.prisma.user.create({
      data: {
        email: createAdminDto.email,
        password: hashedPassword,
        firstName: createAdminDto.firstName,
        lastName: createAdminDto.lastName,
        role: createAdminDto.role,
        companyId: companyId,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        companyId: true,
        createdAt: true,
      },
    });

    return {
      ...user,
      message: 'Admin korisnik uspešno kreiran',
    };
  }

  // Dodeljivanje role korisniku (samo SUPERADMIN)
  async assignRole(userId: string, newRole: string, currentUserRole: string, currentUserId: string) {
    // Provera da li je trenutni korisnik SUPERADMIN
    if (currentUserRole !== 'SUPERADMIN') {
      throw new UnauthorizedException('Samo superadmin može dodeljivati role');
    }

    // Provera da li korisnik postoji
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Korisnik nije pronađen');
    }

    // Ne dozvoli da se superadmin role dodeljuje drugim korisnicima
    if (newRole === 'SUPERADMIN' && userId !== currentUserId) {
      throw new ForbiddenException('Ne možete dodeliti SUPERADMIN role drugim korisnicima');
    }

    // Validacija role
    const validRoles = ['ADMIN', 'USER', 'ACCOUNTANT'];
    if (!validRoles.includes(newRole)) {
      throw new ConflictException('Nevažeća role');
    }

    // Ažuriraj role
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { role: newRole as any },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
      },
    });

    return {
      ...updatedUser,
      message: 'Role uspešno dodeljena',
    };
  }

  // Lista svih korisnika (samo SUPERADMIN)
  async getAllUsers(currentUserRole: string) {
    if (currentUserRole !== 'SUPERADMIN') {
      throw new UnauthorizedException('Samo superadmin može videti sve korisnike');
    }

    return this.prisma.user.findMany({
      include: {
        company: {
          select: {
            id: true,
            name: true,
            pib: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  private generateToken(user: any) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
    };

    return this.jwtService.sign(payload);
  }

  private generateClientUserToken(clientUser: any) {
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
