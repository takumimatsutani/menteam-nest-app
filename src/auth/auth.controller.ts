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
import { Role } from 'src/user/entities/role.entity';
import { UserRole } from 'src/user/userRole.entity';

@Controller()
export class AuthController {
  private readonly logger: Logger = new Logger(AuthController.name);

  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto): Promise<{ token: string }> {
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

  @Post('add.user')
  async register(@Body() registerDto: RegisterDto): Promise<{
    message: string;
    user: { userId: string };
    roles: Role[];
  }> {
    this.logger.log('Registration attempt', { registerDto });

    if (
      !registerDto.userId ||
      !registerDto.roleIds ||
      !Array.isArray(registerDto.roleIds)
    ) {
      throw new BadRequestException('Invalid request body');
    }

    try {
      const { user, userCreated, roles } =
        await this.authService.register(registerDto);

      return {
        message: userCreated ? 'newAdd' : 'alreadyExists',
        user: { userId: user.userId },
        roles: roles,
      };
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

  @Post('delete.user')
  async deleteUser(@Body() userId: string): Promise<void> {
    this.logger.log(`Deleting user with userId: ${userId}`);
    try {
      await this.authService.deleteUser(userId);
      this.logger.log(`User deleted successfully: ${userId}`);
    } catch (error) {
      this.logger.error(
        `Error deleting user with userId: ${userId} - ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Error deleting user');
    }
  }
}
