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
import { SetupPasswordDto } from './dto/setup-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateNotificationPreferencesDto } from './dto/update-notification-preferences.dto';
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

  @Post('setup-password')
  @ApiOperation({ summary: 'Postavljanje šifre preko tokena (javni endpoint)' })
  setupPassword(@Body() setupPasswordDto: SetupPasswordDto) {
    return this.clientAuthService.setupPassword(setupPasswordDto.token, setupPasswordDto.password);
  }

  // ==================== ADMIN ENDPOINTI ====================

  @Post('users')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Kreiranje novog klijentskog korisnika (samo SUPERADMIN)' })
  createClientUser(@CurrentUser() user: any, @Body() dto: CreateClientUserDto) {
    return this.clientAuthService.createClientUser(dto, user.companyId, user.role);
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

  @Patch('change-password')
  @UseGuards(ClientJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Promena šifre (Client)' })
  changePassword(@CurrentUser() user: any, @Body() changePasswordDto: ChangePasswordDto) {
    return this.clientAuthService.changePassword(
      user.sub,
      changePasswordDto.currentPassword,
      changePasswordDto.newPassword,
    );
  }

  @Patch('profile')
  @UseGuards(ClientJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Ažuriranje profila (Client)' })
  updateProfile(@CurrentUser() user: any, @Body() updateProfileDto: UpdateProfileDto) {
    return this.clientAuthService.updateProfile(user.sub, updateProfileDto);
  }

  @Patch('notification-preferences')
  @UseGuards(ClientJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Ažuriranje notification preferences (Client)' })
  updateNotificationPreferences(
    @CurrentUser() user: any,
    @Body() updateDto: UpdateNotificationPreferencesDto,
  ) {
    return this.clientAuthService.updateNotificationPreferences(user.sub, updateDto);
  }

  // ==================== RESEND EMAIL ENDPOINT ====================

  @Post('resend-setup-email/:clientUserId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Ponovno slanje email-a za postavljanje šifre (samo SUPERADMIN)' })
  resendSetupEmail(@CurrentUser() user: any, @Param('clientUserId') clientUserId: string) {
    return this.clientAuthService.resendPasswordSetupEmail(clientUserId, user.companyId);
  }
}
