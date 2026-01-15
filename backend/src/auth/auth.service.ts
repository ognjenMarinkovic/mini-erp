import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
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
    // Provera da li email već postoji
    const existingUser = await this.prisma.user.findUnique({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email već postoji u sistemu');
    }

    // Provera da li PIB već postoji
    const existingCompany = await this.prisma.company.findUnique({
      where: { pib: registerDto.pib },
    });

    if (existingCompany) {
      throw new ConflictException('Kompanija sa ovim PIB-om već postoji');
    }

    // Hash lozinke
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    // Kreiranje kompanije i prvog admin korisnika (transakcija)
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

      // Kreiranje prvog admin korisnika
      const user = await prisma.user.create({
        data: {
          email: registerDto.email,
          password: hashedPassword,
          firstName: registerDto.firstName,
          lastName: registerDto.lastName,
          role: 'ADMIN',
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

    // Generisanje JWT tokena
    const token = this.generateToken(user);

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

  private generateToken(user: any) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
    };

    return this.jwtService.sign(payload);
  }
}
