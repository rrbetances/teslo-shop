import { BadRequestException, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import * as bcrypt  from 'bcrypt'
import { LoginUserDto, CreateUserDto } from './dto';
import { JwtPayload } from './interfaces/wjt-payload.interface';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService
  ){}

  async create(createAuthDto: CreateUserDto) {
    try {
      
      const { password, ...userData } = createAuthDto;

      const user = this.userRepository.create({
        ...userData,
        password: bcrypt.hashSync(password, 10)
      });
      await this.userRepository.save(user);
      delete user.password;

      return { ...user, token: this.getJwtToken({ id: user.id }) };;

    } catch (error) {
      this.handleDbError(error);
    }
  }

  async login(loginUserDto: LoginUserDto){
      const { email, password } = loginUserDto;

      const user = await this.userRepository.findOne({ 
        where: { email },
        select: { email: true, password: true, id: true }
       });

       if( !user || !bcrypt.compareSync(password, user.password)){
         throw new UnauthorizedException("Not valid credentials!");
       }

      var token = this.getJwtToken({ id: user.id });
      delete user.id;
      return { ...user, token };
  }

  checkAuthStatus(user: User){
    var token = this.getJwtToken({ id: user.id });
    delete user.id;
    return { ...user, token };
  }

  private getJwtToken(payload: JwtPayload){
    const token = this.jwtService.sign(payload);
    return token;
  }

  private handleDbError(error: any): never{
    if(error.code === '23505'){
      throw new BadRequestException(error.detail);
    }
    console.log(error);

    throw new InternalServerErrorException('Please check server logs');
  }
}
