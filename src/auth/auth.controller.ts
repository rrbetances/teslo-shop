import { Controller, Post, Body, Get, UseGuards, Req, SetMetadata } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto, LoginUserDto } from './dto';
import { AuthGuard } from '@nestjs/passport';
import { User } from './entities/user.entity';
import { GetUser } from './decorators/get-user.decorator';
import { GetRawHeaderDecorator } from './decorators/get-raw-headers.decorator';
import { UserRoleGuard } from './guards/user-role/user-role.guard';
import { RoleProtected } from './decorators/role-protected.decorator';
import { ValidRoles } from './interfaces';
import { Auth } from './decorators';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Auth')
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

   @Auth()
   @Get('check-auth-status')
   checkAuthStatus(
    @GetUser() user : User
   ){
    console.log(user)
    return this.authService.checkAuthStatus(user);
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
  
  //@SetMetadata('roles', ['admin', 'super-user'])
  @RoleProtected(ValidRoles.admin, ValidRoles.superUser)
  @Get('private2')
  @UseGuards(AuthGuard(), UserRoleGuard)
  testPrivateRouting2(
    @GetUser() user: User
  ){

    return {
      ok: true,
      user
    };
  }

  @Auth(ValidRoles.admin, ValidRoles.superUser)
  @Get('private3')
  testPrivateRouting3(
    @GetUser() user: User
  ){

    return {
      ok: true,
      user
    };
  }
}
