import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth() {
    return {
      status: 'ok',
      message: 'Mini ERP API je aktivan',
      timestamp: new Date().toISOString(),
    };
  }
}
