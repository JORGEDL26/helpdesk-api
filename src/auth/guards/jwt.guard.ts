import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Injectable()
export class JwtGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>()
    const authHeader = request.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token não encontrado')
    }

    const token = authHeader.split(' ')[1]

    try {
      const payload = this.jwt.verify(token)
      request['user'] = payload
      return true
    } catch {
      throw new UnauthorizedException('Token inválido ou expirado')
    }
  }
}