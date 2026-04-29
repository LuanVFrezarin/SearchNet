import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TagsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.tag.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { errors: true } } },
    });
  }

  async search(query: string) {
    return this.prisma.tag.findMany({
      where: { name: { contains: query.toLowerCase(), mode: 'insensitive' } },
      orderBy: { name: 'asc' },
      take: 10,
    });
  }

  async getPopular(limit = 20) {
    const tags = await this.prisma.tag.findMany({
      include: { _count: { select: { errors: true } } },
      orderBy: { errors: { _count: 'desc' } },
      take: limit,
    });
    return tags;
  }
}
