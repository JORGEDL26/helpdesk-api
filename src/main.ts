import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { seed } from '../prisma/seed';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('HelpDesk API')
    .setDescription('API do sistema de chamados')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT ?? 3000);
  console.log(`🚀 Servidor rodando na porta ${process.env.PORT ?? 3000}`)
  await seed()
}

bootstrap().catch((err) => {
  console.error('❌ Falha ao iniciar a aplicação:', err)
  process.exit(1)
})