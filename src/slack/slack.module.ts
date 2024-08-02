import { Module } from '@nestjs/common';
import { SlackController } from './slack.controller';
import { SlackService } from './slack.service';
import { UserModule } from '../user/user.module';

@Module({
  imports: [UserModule],
  controllers: [SlackController],
  providers: [SlackService],
})
export class SlackModule {}
