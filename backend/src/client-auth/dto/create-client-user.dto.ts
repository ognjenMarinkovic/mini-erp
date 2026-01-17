import { IsEmail, IsNotEmpty, IsString, MinLength, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ClientUserRole {
  OWNER = 'OWNER',
  MEMBER = 'MEMBER',
  VIEWER = 'VIEWER',
}

export class CreateClientUserDto {
  @ApiProperty({ description: 'ID klijenta' })
  @IsString()
  @IsNotEmpty()
  clientId: string;

  @ApiProperty({ description: 'Email klijentskog korisnika', example: 'user@klijent.rs' })
  @IsEmail({}, { message: 'Unesite validan email' })
  @IsNotEmpty({ message: 'Email je obavezan' })
  email: string;

  @ApiProperty({ description: 'Lozinka', example: 'password123' })
  @IsString()
  @IsNotEmpty({ message: 'Lozinka je obavezna' })
  @MinLength(6, { message: 'Lozinka mora imati najmanje 6 karaktera' })
  password: string;

  @ApiProperty({ description: 'Ime' })
  @IsString()
  @IsNotEmpty({ message: 'Ime je obavezno' })
  firstName: string;

  @ApiProperty({ description: 'Prezime' })
  @IsString()
  @IsNotEmpty({ message: 'Prezime je obavezno' })
  lastName: string;

  @ApiPropertyOptional({ enum: ClientUserRole, description: 'Rola korisnika' })
  @IsEnum(ClientUserRole)
  @IsOptional()
  role?: ClientUserRole;
}
