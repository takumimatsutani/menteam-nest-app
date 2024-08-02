import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { User } from './entities/user.entity';
import { UserSlack } from './entities/user-slack.entity';
import { UserRole } from './entities/user-role.entity';
import { UserProfile } from './entities/user-profile.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserSlackDto } from './dto/update-user-slack.dto';
import { CreateUserSlackDto } from './dto/create-user-slack.dto';
import { CreateUserProfileDto } from './dto/create-user-profile.dto';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserSlack)
    private readonly userSlackRepository: Repository<UserSlack>,
    @InjectRepository(UserRole)
    private readonly userRoleRepository: Repository<UserRole>,
    @InjectRepository(UserProfile)
    private readonly userProfileRepository: Repository<UserProfile>,
  ) {}

  async createUser(createUserDto: CreateUserDto): Promise<User> {
    const newUser = this.userRepository.create(createUserDto);
    return this.userRepository.save(newUser);
  }

  async findUserByEmail(userId: string): Promise<User> {
    return this.userRepository.findOne({
      where: { userId },
      withDeleted: true,
    });
  }

  async updateUserPassword(userId: string, password: string): Promise<void> {
    await this.userRepository.update(userId, { password });
  }

  async restoreUser(userId: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { userId },
      withDeleted: true,
    });
    if (user) {
      user.deletedAt = null;
      await this.userRepository.save(user);
    }
  }

  async findUserSlackByUserId(userId: string): Promise<UserSlack> {
    // メソッド名を修正
    return this.userSlackRepository.findOne({
      where: { userId },
      withDeleted: true,
    });
  }

  async restoreUserSlack(userId: string): Promise<void> {
    const userSlack = await this.userSlackRepository.findOne({
      where: { userId },
      withDeleted: true,
    });
    if (userSlack) {
      userSlack.deletedAt = null;
      await this.userSlackRepository.save(userSlack);
    }
  }

  async updateUserSlack(
    userId: string,
    updateData: UpdateUserSlackDto,
  ): Promise<void> {
    await this.userSlackRepository.update(userId, updateData);
  }

  async createUserSlack(createData: CreateUserSlackDto): Promise<void> {
    const newUserSlack = this.userSlackRepository.create(createData);
    await this.userSlackRepository.save(newUserSlack);
  }

  async clearUserRoles(userId: string): Promise<void> {
    await this.userRoleRepository.delete({ userId });
  }

  async restoreUserRoles(userId: string, roleIds: number[]): Promise<void> {
    await this.userRoleRepository.restore({
      userId,
      roleId: In(roleIds),
    });
  }

  async createUserRoles(userId: string, roleIds: number[]): Promise<void> {
    const createUserRoles = roleIds.map((roleId) => ({ userId, roleId }));
    await this.userRoleRepository.save(createUserRoles);
  }

  async findUserProfileByUserId(userId: string): Promise<UserProfile> {
    // メソッド名を修正
    return this.userProfileRepository.findOne({
      where: { userId },
      withDeleted: true,
    });
  }

  async restoreUserProfile(userId: string): Promise<void> {
    const userProfile = await this.userProfileRepository.findOne({
      where: { userId },
      withDeleted: true,
    });
    if (userProfile) {
      userProfile.deletedAt = null;
      await this.userProfileRepository.save(userProfile);
    }
  }

  async updateUserProfile(
    userId: string,
    updateData: UpdateUserProfileDto,
  ): Promise<void> {
    await this.userProfileRepository.update(userId, updateData);
  }

  async createUserProfile(createData: CreateUserProfileDto): Promise<void> {
    const newUserProfile = this.userProfileRepository.create(createData);
    await this.userProfileRepository.save(newUserProfile);
  }
}
