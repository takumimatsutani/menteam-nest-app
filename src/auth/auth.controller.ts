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
    this.logger.log(`Login attempt with userId: ${loginDto.userId}`);
    try {
      const user = await this.authService.validateUser(
        loginDto.userId,
        loginDto.password,
      );
      if (!user) {
        this.logger.warn(`Invalid credentials for userId: ${loginDto.userId}`);
        throw new UnauthorizedException('Invalid credentials');
      }
      const jwt = await this.authService.login(user);
      this.logger.log(`User logged in successfully: ${loginDto.userId}`);
      return jwt;
    } catch (error) {
      this.logger.error(
        `Login failed for userId: ${loginDto.userId} - ${error.message}`,
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
        this.logger.warn(
          `Registration failed for userId: ${registerDto.userId}`,
        );
        throw new BadRequestException('Registration failed');
      }
      const jwt = await this.authService.login(user);
      this.logger.log(
        `User registered and logged in successfully: ${registerDto.userId}`,
      );
      return { accessToken: jwt.accessToken };
    } catch (error) {
      if (error.message === 'User already exists with this userId') {
        this.logger.warn(
          `User already exists with userId: ${registerDto.userId}`,
        );
        throw new UnauthorizedException(error.message);
      } else {
        this.logger.error(
          `Registration failed for userId: ${registerDto.userId} - ${error.message}`,
          error.stack,
        );
        throw new InternalServerErrorException('Registration failed');
      }
    }
  }
}
