import {
  Body,
  Controller,
  Post,
  UnauthorizedException,
  Logger,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/auth.dto';
import { RegisterDto } from './dto/register.dto';

@Controller('auth')
export class AuthController {
  private readonly logger: Logger = new Logger(AuthController.name);

  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto): Promise<{ accessToken: string }> {
    this.logger.log(`Login attempt with email: ${loginDto.email}`);
    try {
      const user = await this.authService.validateUser(
        loginDto.email,
        loginDto.password,
      );
      if (!user) {
        this.logger.warn(`Invalid credentials for email: ${loginDto.email}`);
        throw new UnauthorizedException('Invalid credentials');
      }
      const jwt = await this.authService.login(user);
      this.logger.log(`User logged in successfully: ${loginDto.email}`);
      return jwt;
    } catch (error) {
      this.logger.error(
        `Login failed for email: ${loginDto.email} - ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Login failed');
    }
  }

  @Post('register')
  async register(
    @Body() registerDto: RegisterDto,
  ): Promise<{ accessToken: string }> {
    this.logger.log('Registration attempt', { registerDto });
    try {
      const user = await this.authService.register(registerDto);
      if (!user) {
        this.logger.warn(`Registration failed for email: ${registerDto.email}`);
        throw new BadRequestException('Registration failed');
      }
      const jwt = await this.authService.login(user);
      this.logger.log(
        `User registered and logged in successfully: ${registerDto.email}`,
      );
      return { accessToken: jwt.accessToken };
    } catch (error) {
      if (error.message === 'User already exists with this email') {
        this.logger.warn(
          `User already exists with email: ${registerDto.email}`,
        );
        throw new UnauthorizedException(error.message);
      } else {
        this.logger.error(
          `Registration failed for email: ${registerDto.email} - ${error.message}`,
          error.stack,
        );
        throw new InternalServerErrorException('Registration failed');
      }
    }
  }
}
