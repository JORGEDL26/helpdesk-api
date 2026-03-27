import { Controller, Post, Get, Body, Request, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { CreateUserDto } from './dto/create-user.dto';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() body: CreateUserDto) {
    return this.usersService.create(body.name, body.email, body.password, body.role)
  }

  @ApiBearerAuth()
  @UseGuards(JwtGuard)
  @Get('me')
  me(@Request() req: any) {
    return this.usersService.findMe(req.user.sub)
  }
}