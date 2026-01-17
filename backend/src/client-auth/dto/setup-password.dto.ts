import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SetupPasswordDto {
  @ApiProperty({ description: 'JWT token za postavljanje šifre' })
  @IsString()
  @IsNotEmpty({ message: 'Token je obavezan' })
  token: string;

  @ApiProperty({ description: 'Nova šifra', example: 'password123' })
  @IsString()
  @IsNotEmpty({ message: 'Šifra je obavezna' })
  @MinLength(6, { message: 'Šifra mora imati najmanje 6 karaktera' })
  password: string;
}
