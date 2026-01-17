import { IsNotEmpty, IsString, IsEmail, IsOptional, ValidateIf } from 'class-validator';
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

  // Opciono kreiranje prvog ClientUser account-a
  @ApiProperty({ description: 'Da li da se kreira prvi ClientUser account', required: false })
  @IsOptional()
  createUserAccount?: boolean;

  @ApiProperty({ description: 'Email za prvi ClientUser account', required: false })
  @ValidateIf((o) => o.createUserAccount === true)
  @IsEmail({}, { message: 'Email mora biti validan' })
  @IsOptional()
  userEmail?: string;

  @ApiProperty({ description: 'Ime za prvi ClientUser account', required: false })
  @ValidateIf((o) => o.createUserAccount === true)
  @IsString()
  @IsOptional()
  userFirstName?: string;

  @ApiProperty({ description: 'Prezime za prvi ClientUser account', required: false })
  @ValidateIf((o) => o.createUserAccount === true)
  @IsString()
  @IsOptional()
  userLastName?: string;
}
