import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WebClient } from '@slack/web-api';
import { UserService } from '../user/user.service';
import { UpdateUserSlackDto } from 'src/user/dto/update-user-slack.dto';
import { CreateUserSlackDto } from 'src/user/dto/create-user-slack.dto';
import { UpdateUserProfileDto } from 'src/user/dto/update-user-profile.dto';
import * as crypto from 'crypto';

@Injectable()
export class SlackService {
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly botClient: WebClient;

  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UserService,
  ) {
    this.clientId = this.configService.get<string>('SLACK_CLIENT_ID');
    this.clientSecret = this.configService.get<string>('SLACK_CLIENT_SECRET');
    this.botClient = new WebClient(
      this.configService.get<string>('SLACK_BOT_TOKEN'),
    );
  }

  async getAuthorizeUri(type: string): Promise<{ url: string }> {
    const redirectUri =
      type === 'aligment'
        ? `${this.configService.get<string>('APP_URI')}${this.configService.get<string>('SLACK_ALIGMENT_REDIRECT')}`
        : type === 'signup'
          ? `${this.configService.get<string>('APP_URI')}${this.configService.get<string>('SLACK_SIGNUP_REDIRECT')}`
          : null;

    if (!redirectUri) {
      throw new BadRequestException('Invalid type for authorization URL');
    }

    const slackURL = new URL('https://slack.com/oauth/v2/authorize');
    slackURL.searchParams.append('client_id', this.clientId);
    slackURL.searchParams.append(
      'scope',
      this.configService.get<string>('SLACK_SCOPE'),
    );
    slackURL.searchParams.append(
      'user_scope',
      this.configService.get<string>('SLACK_USER_SCOPE'),
    );
    slackURL.searchParams.append('redirect_uri', redirectUri);

    return { url: slackURL.toString() };
  }

  async getAccessToken(code: string): Promise<any> {
    const result = await this.botClient.oauth.v2.access({
      client_id: this.clientId,
      client_secret: this.clientSecret,
      code: code,
    });

    if (!result.ok) {
      throw new UnauthorizedException('Failed to get access token');
    }

    return result;
  }

  async testAuth(accessToken: string): Promise<any> {
    const client = new WebClient(accessToken);
    const result = await client.auth.test();

    if (!result.ok) {
      throw new UnauthorizedException(
        'Failed to authenticate with provided token',
      );
    }

    return result;
  }

  async getUserInfo(accessToken: string, userId: string): Promise<any> {
    const client = new WebClient(accessToken);
    const result = await client.users.info({ user: userId });

    if (!result.ok) {
      throw new UnauthorizedException('Failed to fetch user information');
    }

    return result;
  }

  async alignAccount(code: string): Promise<any> {
    const accessResult = await new WebClient().oauth.v2.access({
      client_id: this.clientId,
      client_secret: this.clientSecret,
      code: code,
    });

    if (!accessResult.ok) {
      throw new UnauthorizedException('Invalid access code');
    }

    const slackUserId = accessResult.authed_user.id;
    const infoResult = await this.botClient.users.info({ user: slackUserId });

    if (!infoResult.ok) {
      throw new UnauthorizedException('Failed to fetch user info');
    }

    const email = infoResult.user.profile.email;
    const userSlackData: CreateUserSlackDto = {
      userId: email,
      slackId: infoResult.user.id,
      teamId: infoResult.user.team_id,
      name: infoResult.user.name,
      email: infoResult.user.profile.email,
      realName: infoResult.user.real_name || null,
      isCustomImage: infoResult.user.profile.is_custom_image || false,
      image24: infoResult.user.profile.image_24 || null,
      image32: infoResult.user.profile.image_32 || null,
      image48: infoResult.user.profile.image_48 || null,
      image72: infoResult.user.profile.image_72 || null,
      image192: infoResult.user.profile.image_192 || null,
      image512: infoResult.user.profile.image_512 || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const userSlack = await this.userService.findUserSlackByUserId(email);

    if (userSlack) {
      if (userSlack.deletedAt) {
        await this.userService.restoreUserSlack(userSlack.userId);
      }
      const updateUserSlackData: UpdateUserSlackDto = {
        ...userSlackData,
        updatedAt: new Date(),
      };
      await this.userService.updateUserSlack(
        userSlack.userId,
        updateUserSlackData,
      );
    } else {
      await this.userService.createUserSlack(userSlackData);
    }

    await this.userService.clearUserRoles(email);
    const roleIds = [1, 2];
    await this.userService.restoreUserRoles(email, roleIds);
    await this.userService.createUserRoles(email, roleIds);

    return { message: 'Account aligned successfully' };
  }

  async signup(code: string): Promise<any> {
    const accessResult = await new WebClient().oauth.v2.access({
      client_id: this.clientId,
      client_secret: this.clientSecret,
      code: code,
    });

    if (!accessResult.ok) {
      throw new UnauthorizedException('Invalid access code');
    }

    const slackUserId = accessResult.authed_user.id;
    const infoResult = await this.botClient.users.info({ user: slackUserId });

    if (!infoResult.ok) {
      throw new UnauthorizedException('Failed to fetch user info');
    }

    const email = infoResult.user.profile.email;
    if (!email) {
      throw new UnauthorizedException('Email is required');
    }

    if (
      !email.endsWith(this.configService.get<string>('SIGNUP_APPROVAL_DOMAIN'))
    ) {
      throw new UnauthorizedException('Unauthorized email domain');
    }

    const password = crypto.randomBytes(16).toString('base64').substring(0, 16);

    const user = await this.userService.findUserByEmail(email);
    if (user) {
      if (user.deletedAt) {
        await this.userService.restoreUser(user.userId);
      }
      await this.userService.updateUserPassword(user.userId, password);
    } else {
      await this.userService.createUser({ userId: email, password });
    }

    const displayName = infoResult.user.profile.display_name || null;
    const image = infoResult.user.profile.image_512 || null;

    const userProfile = await this.userService.findUserProfileByUserId(email);
    if (userProfile) {
      if (userProfile.deletedAt) {
        await this.userService.restoreUserProfile(userProfile.userId);
      }
      const updateUserProfileData: UpdateUserProfileDto = {
        displayName,
        image,
        updatedAt: new Date(),
      };
      await this.userService.updateUserProfile(
        userProfile.userId,
        updateUserProfileData,
      );
    } else {
      await this.userService.createUserProfile({
        userId: email,
        displayName,
        image,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    const userSlackData: CreateUserSlackDto = {
      userId: email,
      slackId: infoResult.user.id,
      teamId: infoResult.user.team_id,
      name: infoResult.user.name,
      email: infoResult.user.profile.email,
      realName: infoResult.user.real_name || null,
      isCustomImage: infoResult.user.profile.is_custom_image || false,
      image24: infoResult.user.profile.image_24 || null,
      image32: infoResult.user.profile.image_32 || null,
      image48: infoResult.user.profile.image_48 || null,
      image72: infoResult.user.profile.image_72 || null,
      image192: infoResult.user.profile.image_192 || null,
      image512: infoResult.user.profile.image_512 || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const userSlack = await this.userService.findUserSlackByUserId(email);
    if (userSlack) {
      if (userSlack.deletedAt) {
        await this.userService.restoreUserSlack(userSlack.userId);
      }
      const updateUserSlackData: UpdateUserSlackDto = {
        ...userSlackData,
        updatedAt: new Date(),
      };
      await this.userService.updateUserSlack(
        userSlack.userId,
        updateUserSlackData,
      );
    } else {
      await this.userService.createUserSlack(userSlackData);
    }

    await this.userService.clearUserRoles(email);
    const roleIds = [1, 2];
    await this.userService.restoreUserRoles(email, roleIds);
    await this.userService.createUserRoles(email, roleIds);

    return { message: 'Signup and account linkage successful', password };
  }
}
