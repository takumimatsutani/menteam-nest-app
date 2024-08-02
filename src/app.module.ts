import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_FILTER } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { IndexModule } from './index/index.module';
import { ProtectModule } from './protect/protect.module';
import { MemberModule } from './member/member.module';
import { SlackModule } from './slack/slack.module';
import { SystemManageModule } from './system_manage/system_manage.module';
import { RecruitingModule } from './recruiting/recruiting.module';
import { CustomLogger, accessLogger } from './core/logger';
import { AllExceptionsFilter } from './core/status_response';
import { JwtStrategy } from './auth/strategies/jwt.strategy';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: `.env.${process.env.NODE_ENV || 'development'}.local`,
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: configService.get<'mysql' | 'postgres'>('DB_TYPE'),
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_DATABASE'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: true,
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    UserModule,
    IndexModule,
    ProtectModule,
    MemberModule,
    SlackModule,
    SystemManageModule,
    RecruitingModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    JwtStrategy,
    CustomLogger,
  ],
})
export class AppModule implements NestModule {
  constructor(private configService: ConfigService) {
    console.log('NODE_ENV:', this.configService.get<string>('NODE_ENV'));
  }

  configure(consumer: MiddlewareConsumer) {
    consumer.apply(accessLogger).forRoutes('*');
  }
}
