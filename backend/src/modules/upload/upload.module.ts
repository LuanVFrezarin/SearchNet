import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuid } from 'uuid';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';

@Module({
  imports: [
    MulterModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        storage: diskStorage({
          destination: config.get('UPLOAD_DIR', './uploads'),
          filename: (req, file, cb) => {
            const name = uuid();
            const ext = extname(file.originalname);
            cb(null, `${name}${ext}`);
          },
        }),
        limits: {
          fileSize: config.get('MAX_FILE_SIZE', 10485760),
        },
        fileFilter: (req, file, cb) => {
          if (file.mimetype.match(/\/(jpg|jpeg|png|gif|webp|bmp)$/)) {
            cb(null, true);
          } else {
            cb(new Error('Only image files are allowed'), false);
          }
        },
      }),
    }),
  ],
  controllers: [UploadController],
  providers: [UploadService],
  exports: [UploadService],
})
export class UploadModule {}
