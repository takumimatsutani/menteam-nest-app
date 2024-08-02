import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User } from '../user/entities/user.entity';
import { UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';

describe('AuthService', () => {
  let service: AuthService;
  let userService: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot()],
      providers: [
        AuthService,
        JwtService,
        ConfigService,
        {
          provide: getRepositoryToken(User),
          useClass: Repository,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should register a user and return a JWT token', async () => {
      const registerDto = {
        userId: 'newuser@example.com',
        password: 'password',
      };
      const user: User = {
        userId: 'newuser@example.com',
        password: 'hashedpassword',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };
      const token = jwt.sign({ userId: user.userId }, 'test-secret');

      jest.spyOn(userService, 'createUser').mockResolvedValue(user);
      jest.spyOn(service, 'login').mockResolvedValue({ accessToken: token });

      const result = await service.register(registerDto);

      expect(userService.createUser).toHaveBeenCalledWith(registerDto);
      expect(service.login).toHaveBeenCalledWith(user);

      expect(result).toHaveProperty('accessToken');
      expect(result.accessToken).toBe(token);

      const decoded = jwt.verify(
        result.accessToken,
        'test-secret',
      ) as jwt.JwtPayload;
      expect(decoded.userId).toEqual(user.userId);
    });

    it('should throw an UnauthorizedException if user already exists', async () => {
      const registerDto = {
        userId: 'existinguser@example.com',
        password: 'password',
      };

      jest.spyOn(userService, 'createUser').mockImplementation(() => {
        throw new UnauthorizedException('User already exists with this userId');
      });

      await expect(service.register(registerDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
