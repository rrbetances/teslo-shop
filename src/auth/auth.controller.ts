import { Controller, Post, Body, Get, UseGuards, Req, SetMetadata } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto, LoginUserDto } from './dto';
import { AuthGuard } from '@nestjs/passport';
import { User } from './entities/user.entity';
import { GetUser } from './decorators/get-user.decorator';
import { GetRawHeaderDecorator } from './decorators/get-raw-headers.decorator';
import { UserRoleGuard } from './guards/user-role/user-role.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  createUser(@Body() createAuthDto: CreateUserDto) {
    return this.authService.create(createAuthDto);
  }

  @Post('login')
  async loginUser(@Body() loginUserDto: LoginUserDto) {
    return await this.authService.login(loginUserDto);
  }

  @Get('private')
  @UseGuards(AuthGuard())
  testPrivateRouting(
    @GetUser() user: User,
    @GetUser('email') UserEmail: string,
    @GetRawHeaderDecorator() rawHeaders: string[]
  ){

    return {
      ok: true,
      message:'Hello from private route',
      user,
      UserEmail, 
      rawHeaders
    };
  }

  @Get('private2')
  @SetMetadata('roles', ['admin', 'super-user'])
  @UseGuards(AuthGuard(), UserRoleGuard)
  testPrivateRouting2(
    @GetUser() user: User
  ){

    return {
      ok: true,
      user
    };
  }
}
