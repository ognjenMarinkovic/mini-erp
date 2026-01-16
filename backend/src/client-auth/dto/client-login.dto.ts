import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ClientLoginDto {
  @ApiProperty({ description: 'Email klijentskog korisnika', example: 'klijent@firma.rs' })
  @IsEmail({}, { message: 'Unesite validan email' })
  @IsNotEmpty({ message: 'Email je obavezan' })
  email: string;

  @ApiProperty({ description: 'Lozinka', example: 'password123' })
  @IsString()
  @IsNotEmpty({ message: 'Lozinka je obavezna' })
  @MinLength(6, { message: 'Lozinka mora imati najmanje 6 karaktera' })
  password: string;
}
