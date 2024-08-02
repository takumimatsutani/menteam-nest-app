import { Module } from '@nestjs/common';
import { RecruitingController } from './recruiting.controller';
import { RecruitingService } from './recruiting.service';

@Module({
  controllers: [RecruitingController],
  providers: [RecruitingService],
})
export class RecruitingModule {}
