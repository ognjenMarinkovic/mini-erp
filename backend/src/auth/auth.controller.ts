import { Controller, Post, Get, Body, Patch, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { CreateAdminDto } from './dto/create-admin.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Registracija novog korisnika' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Prijava korisnika' })
  async login(@Body() loginDto: LoginDto) {
    // Koristi i process.stdout.write i console.log
    process.stdout.write('\n=== LOGIN ENDPOINT CALLED ===\n');
    process.stdout.write(`Login request for email: ${loginDto.email}\n`);
    console.log('=== LOGIN ENDPOINT CALLED ===');
    console.log('Login request for email:', loginDto.email);
    
    const result = await this.authService.login(loginDto);
    
    process.stdout.write('Login successful, returning result\n\n');
    console.log('Login successful, returning result');
    return result;
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Dobavljanje podataka trenutnog korisnika' })
  async getMe(@CurrentUser() user: any) {
    return this.authService.getMe(user.sub);
  }

  @Get('users')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lista svih korisnika (samo SUPERADMIN)' })
  async getAllUsers(@CurrentUser() user: any) {
    return this.authService.getAllUsers(user.role);
  }

  @Post('users')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Kreiranje novog admin korisnika (samo SUPERADMIN)' })
  async createAdmin(@Body() createAdminDto: CreateAdminDto, @CurrentUser() user: any) {
    return this.authService.createAdmin(createAdminDto, user.role, user.companyId);
  }

  @Patch('users/:id/role')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Dodeljivanje role korisniku (samo SUPERADMIN)' })
  async assignRole(
    @Param('id') userId: string,
    @Body() body: { role: string },
    @CurrentUser() user: any,
  ) {
    return this.authService.assignRole(userId, body.role, user.role, user.sub);
  }
}
