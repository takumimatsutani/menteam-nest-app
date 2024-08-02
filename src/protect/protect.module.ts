import { Module } from '@nestjs/common';
import { ProtectController } from './protect.controller';
import { ProtectService } from './protect.service';

@Module({
  controllers: [ProtectController],
  providers: [ProtectService],
})
export class ProtectModule {}
