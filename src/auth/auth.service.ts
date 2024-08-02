import * as bcrypt from 'bcrypt';
import {
  Injectable,
  Logger,
  InternalServerErrorException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../user/entities/user.entity';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  private readonly logger: Logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async validateUser(userId: string, password: string): Promise<User | null> {
    this.logger.log(`Validating user with userId: ${userId}`);
    try {
      const user: User | undefined = await this.userRepository.findOne({
        where: { userId },
      });
      if (!user) {
        this.logger.warn(`User not found with userId: ${userId}`);
        return null;
      }
      const isMatch: boolean = await bcrypt.compare(password, user.password);
      if (isMatch) {
        this.logger.log(`Password match for user with userId: ${userId}`);
        return user;
      }
      this.logger.warn(`Invalid password for user with userId: ${userId}`);
      return null;
    } catch (error) {
      this.logger.error(
        `Error validating user with userId: ${userId}`,
        error.stack,
      );
      throw new InternalServerErrorException('Error validating user');
    }
  }

  async hashPassword(password: string): Promise<string> {
    this.logger.log('Hashing password');
    try {
      const salt: string = await bcrypt.genSalt();
      const hashedPassword: string = await bcrypt.hash(password, salt);
      this.logger.log('Password hashed successfully');
      return hashedPassword;
    } catch (error) {
      this.logger.error('Error hashing password', error.stack);
      throw new InternalServerErrorException('Error hashing password');
    }
  }

  async login(user: User): Promise<{ accessToken: string }> {
    this.logger.log(`Generating JWT for user with userId: ${user.userId}`);
    try {
      const payload: { userId: string } = {
        userId: user.userId,
      };
      const secret: string = this.configService.get<string>('JWT_SECRET');
      const expiresIn: string =
        this.configService.get<string>('JWT_EXPIRES_IN');
      const accessToken: string = this.jwtService.sign(payload, {
        secret,
        expiresIn,
      });
      this.logger.log(
        `JWT generated successfully for user with userId: ${user.userId}`,
      );
      return { accessToken };
    } catch (error) {
      this.logger.error(
        `Error generating JWT for user with userId: ${user.userId}`,
        error.stack,
      );
      throw new InternalServerErrorException('Error generating JWT');
    }
  }

  async register(registerDto: {
    userId: string;
    password: string;
  }): Promise<{ accessToken: string }> {
    const { userId, password } = registerDto;
    this.logger.log(`Registering user with userId: ${userId}`);
    try {
      const existingUser: User | undefined = await this.userRepository.findOne({
        where: { userId },
      });

      if (existingUser) {
        this.logger.warn(`User already exists with userId: ${userId}`);
        throw new ConflictException('User already exists with this userId');
      }

      const hashedPassword: string = await this.hashPassword(password);
      const newUser: User = this.userRepository.create({
        userId,
        password: hashedPassword,
      });
      await this.userRepository.save(newUser);
      this.logger.log(`User registered successfully with userId: ${userId}`);

      const jwt = await this.login(newUser);
      return jwt;
    } catch (error) {
      this.logger.error(
        `Error registering user with userId: ${userId}`,
        error.stack,
      );
      throw new InternalServerErrorException('Error registering user');
    }
  }
}
