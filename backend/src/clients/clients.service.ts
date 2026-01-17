import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { EmailService } from '../notifications/email.service';
import { ClientAuthService } from '../client-auth/client-auth.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class ClientsService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private clientAuthService: ClientAuthService,
  ) {}

  async create(companyId: string, createClientDto: CreateClientDto, userRole: string) {
    const { createUserAccount, userEmail, userFirstName, userLastName, ...clientData } = createClientDto;

    // Definiši trim-ovane vrednosti van blokova da bi bile dostupne u transakciji
    let trimmedEmail = '';
    let trimmedFirstName = '';
    let trimmedLastName = '';

    // Ako se traži kreiranje user account-a, proveri da je korisnik SUPERADMIN
    if (createUserAccount) {
      // Debug logovanje
      console.log('=== VALIDATING USER ACCOUNT CREATION ===');
      console.log('User role received:', userRole);
      console.log('Role type:', typeof userRole);
      console.log('createUserAccount:', createUserAccount);
      
      // Proveri da li je role string i da li je SUPERADMIN
      const normalizedRole = String(userRole || '').trim().toUpperCase();
      console.log('Normalized role:', normalizedRole);
      console.log('Is SUPERADMIN?', normalizedRole === 'SUPERADMIN');
      console.log('==========================================');
      
      if (normalizedRole !== 'SUPERADMIN') {
        throw new ForbiddenException(
          `Samo superadmin može kreirati klijentske naloge. Vaša uloga: "${userRole}" (normalizovano: "${normalizedRole}"). Molimo vas da se izlogujete i ulogujete ponovo da biste dobili novi token.`
        );
      }

      // Debug logovanje
      console.log('Validating user account fields:', {
        userEmail,
        userFirstName,
        userLastName,
        userEmailType: typeof userEmail,
        userFirstNameType: typeof userFirstName,
        userLastNameType: typeof userLastName,
      });
      
      // Proveri da li su polja popunjena (ne prazni stringovi)
      trimmedEmail = userEmail?.trim() || '';
      trimmedFirstName = userFirstName?.trim() || '';
      trimmedLastName = userLastName?.trim() || '';
      
      console.log('Trimmed values:', {
        trimmedEmail,
        trimmedFirstName,
        trimmedLastName,
        emailEmpty: !trimmedEmail,
        firstNameEmpty: !trimmedFirstName,
        lastNameEmpty: !trimmedLastName,
      });
      
      if (!trimmedEmail || !trimmedFirstName || !trimmedLastName) {
        throw new ForbiddenException(
          `Sva polja su obavezna za kreiranje user account-a. Email: "${trimmedEmail}", Ime: "${trimmedFirstName}", Prezime: "${trimmedLastName}"`
        );
      }

      // Proveri da li email već postoji
      const existingUser = await this.prisma.clientUser.findUnique({
        where: { email: trimmedEmail },
      });

      if (existingUser) {
        throw new ConflictException('Email već postoji u sistemu');
      }
    }

    // Dohvati kompaniju za email
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: { name: true },
    });

    // Kreiraj klijenta i opciono prvi user account u transakciji
    return this.prisma.$transaction(async (prisma) => {
      const client = await prisma.client.create({
        data: {
          ...clientData,
          companyId,
        },
      });

      // Ako se traži kreiranje user account-a
      if (createUserAccount) {
        // Kreiraj ClientUser sa placeholder šifrom (ne može se koristiti za login)
        // Koristimo jedinstveni placeholder koji se ne može pogoditi
        const placeholderPassword = `PLACEHOLDER_SETUP_REQUIRED_${client.id}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        const hashedPassword = await bcrypt.hash(placeholderPassword, 10);
        
        const clientUser = await prisma.clientUser.create({
          data: {
            clientId: client.id,
            email: trimmedEmail,
            password: hashedPassword, // Placeholder šifra - korisnik mora postaviti svoju
            firstName: trimmedFirstName,
            lastName: trimmedLastName,
            role: 'OWNER', // Prvi korisnik je uvek OWNER
          },
        });

        // Generiši token za postavljanje šifre
        const setupToken = this.clientAuthService.generatePasswordSetupToken(clientUser.id, clientUser.email);

        // Pošalji email sa linkom
        console.log('=== SENDING PASSWORD SETUP EMAIL ===');
        console.log('Client user email:', clientUser.email);
        console.log('Company name:', company?.name || 'Agencija');
        console.log('Setup token generated:', setupToken ? 'Yes' : 'No');
        
        try {
          const emailSent = await this.emailService.sendPasswordSetupEmail(
            clientUser,
            setupToken,
            company?.name || 'Agencija',
          );
          
          if (emailSent) {
            console.log('✅ Password setup email sent successfully to:', clientUser.email);
          } else {
            console.error('❌ Failed to send password setup email. Check SMTP configuration.');
            console.error('   Make sure SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS are set in .env file');
            console.error('   Client user was created, but email was not sent. Use resend endpoint to send it again.');
          }
        } catch (error: any) {
          console.error('❌ Error sending password setup email:', error?.message || error);
          console.error('   Full error:', error);
          // Ne baci grešku - klijent je kreiran, samo email nije poslat
          // Superadmin može ponovo poslati email preko resend endpoint-a
        }
        console.log('=====================================');
      }

      return client;
    });
  }

  async findAll(companyId: string, search?: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const where = {
      companyId,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { city: { contains: search, mode: 'insensitive' as const } },
          { email: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const [clients, total] = await Promise.all([
      this.prisma.client.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { invoices: true },
          },
        },
      }),
      this.prisma.client.count({ where }),
    ]);

    return {
      data: clients,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, companyId: string) {
    const client = await this.prisma.client.findUnique({
      where: { id },
      include: {
        invoices: {
          orderBy: { date: 'desc' },
          take: 10,
        },
        _count: {
          select: { invoices: true },
        },
      },
    });

    if (!client) {
      throw new NotFoundException('Klijent nije pronađen');
    }

    if (client.companyId !== companyId) {
      throw new ForbiddenException('Nemate pristup ovom klijentu');
    }

    return client;
  }

  async update(id: string, companyId: string, updateClientDto: UpdateClientDto) {
    // Provera da li klijent postoji i pripada kompaniji
    await this.findOne(id, companyId);

    return this.prisma.client.update({
      where: { id },
      data: updateClientDto,
    });
  }

  async remove(id: string, companyId: string) {
    // Provera da li klijent postoji i pripada kompaniji
    const client = await this.findOne(id, companyId);

    // Provera da li klijent ima fakture
    const invoiceCount = await this.prisma.invoice.count({
      where: { clientId: id },
    });

    if (invoiceCount > 0) {
      throw new ForbiddenException(
        `Ne možete obrisati klijenta koji ima ${invoiceCount} faktura. Prvo obrišite fakture.`,
      );
    }

    await this.prisma.client.delete({
      where: { id },
    });

    return { message: 'Klijent uspešno obrisan' };
  }
}
