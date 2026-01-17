import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Clients')
@Controller('clients')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Post()
  @ApiOperation({ summary: 'Kreiranje novog klijenta' })
  create(@CurrentUser() user: any, @Body() createClientDto: CreateClientDto) {
    // Debug logovanje - koristi process.stdout.write za sigurno ispisivanje
    process.stdout.write('\n=== CLIENT CREATION REQUEST ===\n');
    process.stdout.write(`User from token: ${JSON.stringify({
      id: user?.id,
      email: user?.email,
      role: user?.role,
      roleType: typeof user?.role,
      companyId: user?.companyId,
    }, null, 2)}\n`);
    process.stdout.write(`Full user object: ${JSON.stringify(user, null, 2)}\n`);
    process.stdout.write(`Request body: ${JSON.stringify(createClientDto, null, 2)}\n`);
    process.stdout.write('==============================\n\n');
    
    // Takođe koristi console.log za slučaj da neko gleda konzolu
    console.log('=== CLIENT CREATION REQUEST ===');
    console.log('User from token:', {
      id: user?.id,
      email: user?.email,
      role: user?.role,
      roleType: typeof user?.role,
      companyId: user?.companyId,
    });
    console.log('Full user object:', JSON.stringify(user, null, 2));
    console.log('Request body:', JSON.stringify(createClientDto, null, 2));
    console.log('==============================');
    
    if (!user || !user.role) {
      throw new ForbiddenException('Korisnik nije autentifikovan ili nema ulogu');
    }
    
    return this.clientsService.create(user.companyId, createClientDto, user.role);
  }

  @Get()
  @ApiOperation({ summary: 'Lista svih klijenata sa pretraživanjem i paginacijom' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  findAll(
    @CurrentUser() user: any,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.clientsService.findAll(
      user.companyId,
      search,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalji klijenta sa istorijom faktura' })
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.clientsService.findOne(id, user.companyId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Ažuriranje klijenta' })
  update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() updateClientDto: UpdateClientDto,
  ) {
    return this.clientsService.update(id, user.companyId, updateClientDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Brisanje klijenta' })
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.clientsService.remove(id, user.companyId);
  }
}
