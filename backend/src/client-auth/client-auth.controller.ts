import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Delete,
  Patch,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ClientAuthService } from './client-auth.service';
import { ClientLoginDto } from './dto/client-login.dto';
import { CreateClientUserDto } from './dto/create-client-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ClientJwtAuthGuard } from './guards/client-jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Client Auth')
@Controller('client-auth')
export class ClientAuthController {
  constructor(private readonly clientAuthService: ClientAuthService) {}

  // ==================== JAVNI ENDPOINTI ====================

  @Post('login')
  @ApiOperation({ summary: 'Login za klijentske korisnike (Client Hub)' })
  login(@Body() loginDto: ClientLoginDto) {
    return this.clientAuthService.login(loginDto);
  }

  // ==================== ADMIN ENDPOINTI ====================

  @Post('users')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Kreiranje novog klijentskog korisnika (Admin)' })
  createClientUser(@CurrentUser() user: any, @Body() dto: CreateClientUserDto) {
    return this.clientAuthService.createClientUser(dto, user.companyId);
  }

  @Get('users')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lista klijentskih korisnika za klijenta (Admin)' })
  getClientUsers(@CurrentUser() user: any, @Query('clientId') clientId: string) {
    return this.clientAuthService.getClientUsers(clientId, user.companyId);
  }

  @Patch('users/:id/toggle-active')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Aktivacija/deaktivacija klijentskog korisnika (Admin)' })
  toggleActive(@CurrentUser() user: any, @Param('id') id: string) {
    return this.clientAuthService.toggleActive(id, user.companyId);
  }

  @Delete('users/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Brisanje klijentskog korisnika (Admin)' })
  deleteClientUser(@CurrentUser() user: any, @Param('id') id: string) {
    return this.clientAuthService.deleteClientUser(id, user.companyId);
  }

  // ==================== CLIENT USER ENDPOINTI ====================

  @Get('me')
  @UseGuards(ClientJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Dobavi podatke o trenutnom klijentskom korisniku' })
  getMe(@CurrentUser() user: any) {
    return this.clientAuthService.getMe(user.sub);
  }
}
