import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'admin@minierp.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'admin123', minLength: 6 })
  @IsString()
  @MinLength(6)
  @IsNotEmpty()
  password: string;

  @ApiProperty({ example: 'Marko' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Marković' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ example: 'Moja Firma DOO' })
  @IsString()
  @IsNotEmpty()
  companyName: string;

  @ApiProperty({ example: '12345678' })
  @IsString()
  @IsNotEmpty()
  pib: string;

  @ApiProperty({ example: 'Kneza Miloša 10' })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty({ example: 'Beograd' })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({ example: '+381641234567', required: false })
  @IsString()
  phone?: string;
}
