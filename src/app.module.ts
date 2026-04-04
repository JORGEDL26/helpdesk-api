import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { TicketsModule } from './tickets/tickets.module';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule,ThrottlerGuard } from '@nestjs/throttler';

@Module({
  imports: [UsersModule, AuthModule, TicketsModule, ThrottlerModule.forRoot([{
    ttl: 60000,
    limit: 10,
  }])],
  controllers: [AppController],
  providers: [AppService, {
    provide: APP_GUARD,
    useClass: ThrottlerGuard,
  }],
})
export class AppModule {}
