import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ClientJwtStrategy extends PassportStrategy(Strategy, 'client-jwt') {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    // Provera da li je client user (ima clientId umesto companyId)
    if (!payload.clientId || payload.userType !== 'CLIENT') {
      return null;
    }

    return {
      sub: payload.sub,
      email: payload.email,
      role: payload.role,
      clientId: payload.clientId,
      userType: payload.userType,
    };
  }
}
