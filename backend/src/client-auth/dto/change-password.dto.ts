import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({ description: 'Trenutna šifra' })
  @IsString()
  @IsNotEmpty({ message: 'Trenutna šifra je obavezna' })
  currentPassword: string;

  @ApiProperty({ description: 'Nova šifra', example: 'newPassword123' })
  @IsString()
  @IsNotEmpty({ message: 'Nova šifra je obavezna' })
  @MinLength(6, { message: 'Nova šifra mora imati najmanje 6 karaktera' })
  newPassword: string;
}
