import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FeedbackService {
  constructor(private prisma: PrismaService) {}

  async create(errorId: string, userId: string, worked: boolean, comment?: string) {
    // Verify error exists
    const error = await this.prisma.netsuiteError.findUnique({ where: { id: errorId } });
    if (!error) throw new NotFoundException('Error not found');

    // Upsert: one feedback per user per error
    const existing = await this.prisma.errorFeedback.findFirst({
      where: { errorId, userId },
    });

    if (existing) {
      return this.prisma.errorFeedback.update({
        where: { id: existing.id },
        data: { worked, comment },
      });
    }

    return this.prisma.errorFeedback.create({
      data: { errorId, userId, worked, comment },
    });
  }

  async getStats(errorId: string) {
    const [positive, total] = await Promise.all([
      this.prisma.errorFeedback.count({ where: { errorId, worked: true } }),
      this.prisma.errorFeedback.count({ where: { errorId } }),
    ]);
    return {
      positive,
      negative: total - positive,
      total,
      successRate: total > 0 ? Math.round((positive / total) * 100) : null,
    };
  }
}
