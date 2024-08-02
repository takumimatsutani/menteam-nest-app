import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { UserProfile } from './userProfile.entity';
import { UserSlack } from './userSlack.entity';
import { UserRole } from './userRole.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(UserProfile)
    private userProfileRepository: Repository<UserProfile>,
    @InjectRepository(UserSlack)
    private userSlackRepository: Repository<UserSlack>,
    @InjectRepository(UserRole)
    private userRoleRepository: Repository<UserRole>,
  ) {}

  async findUserSlackByEmail(email: string): Promise<UserSlack> {
    return this.userSlackRepository.findOne({
      where: { email },
      withDeleted: true,
    });
  }

  async restoreUserSlack(userSlackId: string): Promise<void> {
    const userSlack = await this.userSlackRepository.findOne({
      where: { id: userSlackId },
      withDeleted: true,
    });
    if (userSlack) {
      userSlack.deletedAt = null;
      await this.userSlackRepository.save(userSlack);
    }
  }

  async updateUserSlack(
    userSlackId: string,
    userSlackData: Partial<UserSlack>,
  ): Promise<void> {
    await this.userSlackRepository.update(userSlackId, userSlackData);
  }

  async createUserSlack(userSlackData: Partial<UserSlack>): Promise<UserSlack> {
    const newUserSlack = this.userSlackRepository.create(userSlackData);
    return this.userSlackRepository.save(newUserSlack);
  }

  async clearUserRoles(email: string): Promise<void> {
    await this.userRoleRepository.delete({ userId: email });
  }

  async restoreUserRoles(email: string, roleIds: number[]): Promise<void> {
    await this.userRoleRepository.restore({
      userId: email,
      roleId: roleIds,
    });
  }

  async createUserRoles(email: string, roleIds: number[]): Promise<void> {
    const userRoles = roleIds.map((roleId) => ({ userId: email, roleId }));
    await this.userRoleRepository.insert(userRoles);
  }

  async findUserByEmail(email: string): Promise<User> {
    return this.userRepository.findOne({ where: { email }, withDeleted: true });
  }

  async restoreUser(userId: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      withDeleted: true,
    });
    if (user) {
      user.deletedAt = null;
      await this.userRepository.save(user);
    }
  }

  async updateUserPassword(userId: string, password: string): Promise<void> {
    await this.userRepository.update(userId, { password });
  }

  async createUser(userData: Partial<User>): Promise<User> {
    const newUser = this.userRepository.create(userData);
    return this.userRepository.save(newUser);
  }

  async findUserProfileByEmail(email: string): Promise<UserProfile> {
    return this.userProfileRepository.findOne({
      where: { email },
      withDeleted: true,
    });
  }

  async restoreUserProfile(userProfileId: string): Promise<void> {
    const userProfile = await this.userProfileRepository.findOne({
      where: { id: userProfileId },
      withDeleted: true,
    });
    if (userProfile) {
      userProfile.deletedAt = null;
      await this.userProfileRepository.save(userProfile);
    }
  }

  async updateUserProfile(
    userProfileId: string,
    userProfileData: Partial<UserProfile>,
  ): Promise<void> {
    await this.userProfileRepository.update(userProfileId, userProfileData);
  }

  async createUserProfile(
    userProfileData: Partial<UserProfile>,
  ): Promise<UserProfile> {
    const newUserProfile = this.userProfileRepository.create(userProfileData);
    return this.userProfileRepository.save(newUserProfile);
  }
}
