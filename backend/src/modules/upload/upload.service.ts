import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const Tesseract = require('tesseract.js');

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);

  constructor(private prisma: PrismaService) {}

  async processImage(file: Express.Multer.File, errorId?: string) {
    const imageUrl = `/uploads/${file.filename}`;
    let extractedText = '';

    // Run OCR
    try {
      this.logger.log(`Running OCR on ${file.filename}...`);
      const result = await Tesseract.recognize(file.path, 'eng+por', {
        logger: () => {},
      });
      extractedText = result.data.text.trim();
      this.logger.log(`OCR extracted ${extractedText.length} chars`);
    } catch (err) {
      this.logger.warn(`OCR failed: ${err.message}`);
    }

    // Save to database
    const image = await this.prisma.errorImage.create({
      data: {
        imageUrl,
        extractedText: extractedText || null,
        errorId: errorId || null,
      },
    });

    return {
      id: image.id,
      imageUrl,
      extractedText,
    };
  }
}
