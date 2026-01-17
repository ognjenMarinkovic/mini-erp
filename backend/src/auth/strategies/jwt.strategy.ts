import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    // Debug logovanje - proveri šta je u tokenu
    console.log('=== JWT STRATEGY VALIDATE ===');
    console.log('Token payload:', JSON.stringify(payload, null, 2));
    console.log('Role from token:', payload.role);
    console.log('Role type:', typeof payload.role);
    console.log('================================');
    
    return {
      id: payload.sub,  // Controller koristi user.id
      sub: payload.sub,
      email: payload.email,
      role: payload.role,
      companyId: payload.companyId,
    };
  }
}
