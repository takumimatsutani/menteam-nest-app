import * as bcrypt from 'bcrypt';
import {
  Injectable,
  Logger,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../user/entities/user.entity';
import { ConfigService } from '@nestjs/config';
import { RegisterDto } from './dto/register.dto';
import { UserRole } from 'src/user/userRole.entity';
import { Role } from 'src/user/entities/role.entity';

@Injectable()
export class AuthService {
  private readonly logger: Logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private userRoleRepository: Repository<UserRole>,
    private roleRepository: Repository<Role>,
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

  async login(user: User): Promise<{ token: string }> {
    this.logger.log(`Generating JWT for user with userId: ${user.userId}`);
    try {
      const payload: { userId: string } = {
        userId: user.userId,
      };
      const secret: string = this.configService.get<string>('JWT_SECRET');
      const expiresIn: string =
        this.configService.get<string>('JWT_EXPIRES_IN');
      const token: string = this.jwtService.sign(payload, {
        secret,
        expiresIn,
      });
      this.logger.log(
        `JWT generated successfully for user with userId: ${user.userId}`,
      );
      return { token };
    } catch (error) {
      this.logger.error(
        `Error generating JWT for user with userId: ${user.userId}`,
        error.stack,
      );
      throw new InternalServerErrorException('Error generating JWT');
    }
  }

  async register(
    registerDto: RegisterDto,
  ): Promise<{ user: User; userCreated: boolean; roles: Role[] }> {
    const { userId, password, roleIds } = registerDto;
    this.logger.log(`Registering user with userId: ${userId}`);

    const roles = await this.roleRepository.findByIds(roleIds);
    if (roleIds.length !== roles.length) {
      throw new BadRequestException('Invalid roleIds');
    }

    const generatedPassword =
      password || crypto.randomBytes(16).toString('base64').substring(0, 16);

    let user: User;
    let userCreated: boolean;

    try {
      [user, userCreated] = await this.userRepository.findOrCreate({
        where: { userId },
        defaults: { password: generatedPassword },
      });

      if (!userCreated) {
        await this.userRepository.restore({ userId });
        user.password = generatedPassword;
        await this.userRepository.save(user);
      }

      let ignoreRoleIds: string[] = [];

      if (!userCreated) {
        await this.userRoleRepository.softDelete({ userId });
        await this.userRoleRepository.restore({ userId, roleId: roleIds });

        const restoredRoles = await this.userRoleRepository.find({
          where: { userId },
          select: ['roleId'],
        });
        ignoreRoleIds = restoredRoles.map((role) => role.roleId);
      }

      const newRoles = roleIds
        .filter((roleId) => !ignoreRoleIds.includes(roleId))
        .map((roleId) => ({
          userId,
          roleId,
        }));

      if (newRoles.length > 0) {
        await this.userRoleRepository.save(newRoles);
      }

      const addRoles = await this.roleRepository.findByIds(roleIds);

      return { user, userCreated, roles: addRoles };
    } catch (error) {
      this.logger.error(
        `Error registering user with userId: ${userId}`,
        error.stack,
      );
      throw new InternalServerErrorException('Error registering user');
    }
  }

  async deleteUser(userId: string): Promise<void> {
    this.logger.log(`Deleting user with userId: ${userId}`);
    try {
      await this.userRepository.delete({ userId });
      this.logger.log(`User deleted successfully with userId: ${userId}`);
    } catch (error) {
      this.logger.error(
        `Error deleting user with userId: ${userId}`,
        error.stack,
      );
      throw new InternalServerErrorException('Error deleting user');
    }
  }
}
