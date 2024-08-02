import { Module } from '@nestjs/common';
import { SystemManageController } from './system_manage.controller';
import { SystemManageService } from './system_manage.service';

@Module({
  controllers: [SystemManageController],
  providers: [SystemManageService],
})
export class SystemManageModule {}
