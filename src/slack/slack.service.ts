import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WebClient } from '@slack/web-api';
import { UserService } from '../user/user.service';
import * as crypto from 'crypto';

@Injectable()
export class SlackService {
  private readonly botClient: WebClient;
  private readonly clientId: string;
  private readonly clientSecret: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UserService,
  ) {
    this.botClient = new WebClient(
      this.configService.get<string>('SLACK_BOT_TOKEN'),
    );
    this.clientId = this.configService.get<string>('SLACK_CLIENT_ID');
    this.clientSecret = this.configService.get<string>('SLACK_CLIENT_SECRET');
  }

  async getAuthorizeUri(type: string): Promise<{ url: string; team: any }> {
    const redirectUri =
      type === 'aligment'
        ? `${this.configService.get<string>('APP_URI')}${this.configService.get<string>('SLACK_ALIGMENT_REDIRECT')}`
        : type === 'signup'
          ? `${this.configService.get<string>('APP_URI')}${this.configService.get<string>('SLACK_SIGNUP_REDIRECT')}`
          : undefined;

    if (!redirectUri) {
      throw new Error('Invalid type');
    }

    const query = new URLSearchParams({
      client_id: this.clientId,
      scope:
        'chat:write,channels:manage,groups:write,im:write,mpim:write,users:read,users:read.email,team:read',
      user_scope: 'users:read',
      redirect_uri: redirectUri,
    });

    const slackURL = new URL('https://slack.com/oauth/v2/authorize');
    slackURL.search = query.toString();

    const team = await this.botClient.team.info();

    return {
      team: {
        id: team.team.id,
        name: team.team.name,
        icon: team.team.icon.image_230,
      },
      url: slackURL.toString(),
    };
  }

  async getAccessToken(code: string): Promise<any> {
    const client = new WebClient();
    const accessResult = await client.oauth.v2.access({
      client_id: this.clientId,
      client_secret: this.clientSecret,
      code: code,
    });
    return accessResult;
  }

  async testAuth(accessToken: string): Promise<any> {
    const slackClient = new WebClient(accessToken);
    return slackClient.auth.test();
  }

  async getUserInfo(accessToken: string, userId: string): Promise<any> {
    const slackClient = new WebClient(accessToken);
    return slackClient.users.info({ user: userId });
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
    const userSlackData = {
      email: email,
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
    };

    const userSlack = await this.userService.findUserSlackByEmail(email);

    if (userSlack) {
      if (userSlack.deletedAt) {
        await this.userService.restoreUserSlack(userSlack.id);
      }
      await this.userService.updateUserSlack(userSlack.id, userSlackData);
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
        await this.userService.restoreUser(user.id);
      }
      await this.userService.updateUserPassword(user.id, password);
    } else {
      await this.userService.createUser({ email, password });
    }

    const displayName = infoResult.user.profile.display_name || null;
    const image = infoResult.user.profile.image_512 || null;

    const userProfile = await this.userService.findUserProfileByEmail(email);
    if (userProfile) {
      if (userProfile.deletedAt) {
        await this.userService.restoreUserProfile(userProfile.id);
      }
      await this.userService.updateUserProfile(userProfile.id, {
        displayName,
        image,
      });
    } else {
      await this.userService.createUserProfile({ email, displayName, image });
    }

    const userSlackData = {
      email: email,
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
    };

    const userSlack = await this.userService.findUserSlackByEmail(email);
    if (userSlack) {
      if (userSlack.deletedAt) {
        await this.userService.restoreUserSlack(userSlack.id);
      }
      await this.userService.updateUserSlack(userSlack.id, userSlackData);
    } else {
      await this.userService.createUserSlack(userSlackData);
    }

    await this.userService.clearUserRoles(email);
    const roleIds = [1, 2];
    await this.userService.restoreUserRoles(email, roleIds);
    await this.userService.createUserRoles(email, roleIds);

    // Slack DM to the user
    const openResult = await this.botClient.conversations.open({
      users: slackUserId,
    });

    if (openResult.ok) {
      await this.botClient.chat.postMessage({
        channel: openResult.channel.id,
        text: [
          ' ━ *MENTEAM のアカウントが登録され、 Slack と連携しました* ━\n',
          `【 MENTEAM 】`,
          `ログインID : \`${email}\``,
          `パスワード : \`${password}\``,
          `\n【 Slack 】 <@${slackUserId}>\n`,
          `<${this.configService.get<string>('APP_URI')}/login|to MENTEAM>`,
          '━━━━━━━━━━━━━━━━━━━━',
        ].join('\n'),
      });
    }

    return { message: 'Account signed up successfully' };
  }
}
