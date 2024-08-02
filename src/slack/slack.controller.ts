import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { SlackService } from './slack.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthorizeUriDto } from './dto/authorize-uri.dto';
import { AccessTokenDto } from './dto/access-token.dto';
import { AuthTestDto } from './dto/auth-test.dto';
import { UserInfoDto } from './dto/user-info.dto';

@Controller('slack')
export class SlackController {
  constructor(private readonly slackService: SlackService) {}

  @Get('authorize_uri/:type')
  getAuthorizeUri(@Param() params: AuthorizeUriDto) {
    return this.slackService.getAuthorizeUri(params.type);
  }

  @Get('oauth.access/:code')
  @UseGuards(JwtAuthGuard)
  getAccessToken(@Param() params: AccessTokenDto) {
    return this.slackService.getAccessToken(params.code);
  }

  @Post('auth.test')
  @UseGuards(JwtAuthGuard)
  testAuth(@Body() body: AuthTestDto) {
    return this.slackService.testAuth(body.access_token);
  }

  @Post('users.info')
  @UseGuards(JwtAuthGuard)
  getUserInfo(@Body() body: UserInfoDto) {
    return this.slackService.getUserInfo(body.access_token, body.user_id);
  }

  @Get('alignment/:code')
  @UseGuards(JwtAuthGuard)
  alignAccount(@Param('code') code: string) {
    return this.slackService.alignAccount(code);
  }

  @Get('signup/:code')
  signup(@Param('code') code: string) {
    return this.slackService.signup(code);
  }
}
