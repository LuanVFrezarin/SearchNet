import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CommentsService {
  constructor(private prisma: PrismaService) {}

  async findByError(errorId: string) {
    return this.prisma.comment.findMany({
      where: { errorId },
      include: { user: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(errorId: string, userId: string, content: string) {
    const error = await this.prisma.netsuiteError.findUnique({ where: { id: errorId } });
    if (!error) throw new NotFoundException('Error not found');

    return this.prisma.comment.create({
      data: { errorId, userId, content },
      include: { user: { select: { id: true, name: true } } },
    });
  }

  async remove(commentId: string, userId: string) {
    const comment = await this.prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) throw new NotFoundException('Comment not found');
    if (comment.userId !== userId) {
      throw new NotFoundException('You can only delete your own comments');
    }
    await this.prisma.comment.delete({ where: { id: commentId } });
    return { deleted: true };
  }
}
