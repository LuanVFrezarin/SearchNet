import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './modules/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { ErrorsModule } from './modules/errors/errors.module';
import { UploadModule } from './modules/upload/upload.module';
import { SearchModule } from './modules/search/search.module';
import { TagsModule } from './modules/tags/tags.module';
import { FeedbackModule } from './modules/feedback/feedback.module';
import { CommentsModule } from './modules/comments/comments.module';
import { AiModule } from './modules/ai/ai.module';
import { RedisModule } from './modules/redis/redis.module';
import { MeiliModule } from './modules/meili/meili.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    RedisModule,
    MeiliModule,
    AuthModule,
    ErrorsModule,
    UploadModule,
    SearchModule,
    TagsModule,
    FeedbackModule,
    CommentsModule,
    AiModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
