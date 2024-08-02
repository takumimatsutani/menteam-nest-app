import { Test, TestingModule } from '@nestjs/testing';
import { SlackService } from './slack.service';
import { UserService } from '../user/user.service';
import { WebClient } from '@slack/web-api';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserSlack } from '../user/entities/user-slack.entity';
import { User } from '../user/entities/user.entity';
import { UserRole } from '../user/entities/user-role.entity';
import { Repository } from 'typeorm';
import { UserProfile } from '../user/entities/user-profile.entity';

jest.mock('@slack/web-api');

describe('SlackService', () => {
  let service: SlackService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot()],
      providers: [
        SlackService,
        ConfigModule,
        UserService,
        {
          provide: WebClient,
          useValue: {
            oauth: {
              v2: {
                access: jest
                  .fn()
                  .mockResolvedValue({ ok: true, authed_user: { id: 'U123' } }),
              },
            },
            users: {
              info: jest.fn().mockResolvedValue({
                ok: true,
                user: { id: 'U123', profile: { email: 'user@example.com' } },
              }),
            },
            conversations: {
              open: jest
                .fn()
                .mockResolvedValue({ ok: true, channel: { id: 'C123' } }),
            },
            chat: {
              postMessage: jest.fn().mockResolvedValue({ ok: true }),
            },
          },
        },
        ConfigService,
        {
          provide: getRepositoryToken(UserSlack),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(User),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(UserRole),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(UserProfile),
          useClass: Repository,
        },
      ],
    }).compile();

    service = module.get<SlackService>(SlackService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // 追加のテストケースをここに書く
});
