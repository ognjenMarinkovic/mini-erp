import { IsNotEmpty, IsString, IsEmail, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateClientDto {
  @ApiProperty({ example: 'ABC Company DOO' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: '87654321', required: false })
  @IsString()
  @IsOptional()
  pib?: string;

  @ApiProperty({ example: 'Kralja Petra 15' })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty({ example: 'Novi Sad' })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({ example: '+381641234567', required: false })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ example: 'contact@abc.com', required: false })
  @IsEmail()
  @IsOptional()
  email?: string;
}
