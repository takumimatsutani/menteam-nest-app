import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../user/entities/user.entity';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken'; // jwtをインポート

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;

  beforeEach(async () => {
    const mockAuthService = {
      validateUser: jest.fn(),
      login: jest.fn(),
      register: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot()],
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        JwtService,
        ConfigService,
        {
          provide: getRepositoryToken(User),
          useValue: {}, // Mock repository token
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('should return a JWT token if registration is successful', async () => {
      const registerDto = {
        userId: 'newuser@example.com',
        password: 'password',
      };
      const token = jwt.sign({ userId: registerDto.userId }, 'test-secret'); // トークンを文字列として生成

      jest.spyOn(service, 'register').mockResolvedValue({ accessToken: token });
      jest.spyOn(service, 'login').mockResolvedValue({ accessToken: token }); // トークンを文字列として渡す

      const result = await controller.register(registerDto);

      expect(service.register).toHaveBeenCalledWith(registerDto);
      expect(service.login).toHaveBeenCalledWith(expect.any(User)); // ユーザーオブジェクトを期待

      const decoded = jwt.verify(
        result.accessToken,
        'test-secret',
      ) as jwt.JwtPayload; // トークンを検証
      expect(decoded.userId).toEqual(registerDto.userId); // デコードされたペイロードのuserIdを確認
    });

    it('should throw an UnauthorizedException if registration fails', async () => {
      const registerDto = {
        userId: 'existinguser@example.com',
        password: 'password',
      };

      jest.spyOn(service, 'register').mockImplementation(() => {
        throw new UnauthorizedException('User already exists with this userId');
      });

      await expect(controller.register(registerDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
