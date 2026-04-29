import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MeiliService } from '../meili/meili.service';
import { CreateErrorDto, UpdateErrorDto, ListErrorsDto } from './errors.dto';
import { Role } from '@prisma/client';

@Injectable()
export class ErrorsService {
  constructor(
    private prisma: PrismaService,
    private meili: MeiliService,
  ) {}

  async create(dto: CreateErrorDto, userId: string) {
    const { tags, imageIds, ...data } = dto;

    const error = await this.prisma.netsuiteError.create({
      data: {
        ...data,
        createdBy: userId,
        tags: tags?.length
          ? {
              create: await Promise.all(
                tags.map(async (tagName) => {
                  const tag = await this.prisma.tag.upsert({
                    where: { name: tagName.toLowerCase().trim() },
                    create: { name: tagName.toLowerCase().trim() },
                    update: {},
                  });
                  return { tagId: tag.id };
                }),
              ),
            }
          : undefined,
      },
      include: {
        tags: { include: { tag: true } },
        images: true,
        author: { select: { id: true, name: true, email: true } },
      },
    });

    // Link uploaded images if any
    if (imageIds?.length) {
      await this.prisma.errorImage.updateMany({
        where: { id: { in: imageIds } },
        data: { errorId: error.id },
      });
    }

    // Index in Meilisearch
    const allImages = await this.prisma.errorImage.findMany({
      where: { errorId: error.id },
    });
    await this.meili.indexError({
      id: error.id,
      title: error.title,
      description: error.description || '',
      solution: error.solution,
      tags: error.tags.map((t) => t.tag.name),
      extractedText: allImages.map((img) => img.extractedText || '').join(' '),
      severity: error.severity,
      difficultyLevel: error.difficultyLevel,
      netsuitePath: error.netsuitePath || '',
    });

    return this.formatError(error);
  }

  async findAll(dto: ListErrorsDto) {
    const { page = 1, limit = 20, severity, difficultyLevel, tag } = dto;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (severity) where.severity = severity;
    if (difficultyLevel) where.difficultyLevel = difficultyLevel;
    if (tag) {
      where.tags = { some: { tag: { name: tag.toLowerCase() } } };
    }

    const [errors, total] = await Promise.all([
      this.prisma.netsuiteError.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          tags: { include: { tag: true } },
          images: true,
          author: { select: { id: true, name: true } },
          _count: { select: { feedback: true, comments: true } },
        },
      }),
      this.prisma.netsuiteError.count({ where }),
    ]);

    return {
      data: errors.map(this.formatError),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const error = await this.prisma.netsuiteError.findUnique({
      where: { id },
      include: {
        tags: { include: { tag: true } },
        images: true,
        author: { select: { id: true, name: true, email: true } },
        feedback: {
          include: { user: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'desc' },
        },
        comments: {
          include: { user: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'desc' },
        },
        _count: { select: { feedback: true, comments: true } },
      },
    });

    if (!error) throw new NotFoundException('Error not found');

    const positiveCount = error.feedback.filter((f) => f.worked).length;
    const totalFeedback = error.feedback.length;

    return {
      ...this.formatError(error),
      feedback: error.feedback,
      comments: error.comments,
      stats: {
        totalFeedback,
        positiveCount,
        successRate: totalFeedback > 0 ? Math.round((positiveCount / totalFeedback) * 100) : null,
      },
    };
  }

  async update(id: string, dto: UpdateErrorDto, userId: string, userRole: Role) {
    const existing = await this.prisma.netsuiteError.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Error not found');
    if (existing.createdBy !== userId && userRole !== Role.ADMIN) {
      throw new ForbiddenException('You can only edit your own errors');
    }

    const { tags, ...data } = dto;

    if (tags) {
      await this.prisma.errorTag.deleteMany({ where: { errorId: id } });
      for (const tagName of tags) {
        const tag = await this.prisma.tag.upsert({
          where: { name: tagName.toLowerCase().trim() },
          create: { name: tagName.toLowerCase().trim() },
          update: {},
        });
        await this.prisma.errorTag.create({ data: { errorId: id, tagId: tag.id } });
      }
    }

    const error = await this.prisma.netsuiteError.update({
      where: { id },
      data,
      include: {
        tags: { include: { tag: true } },
        images: true,
        author: { select: { id: true, name: true, email: true } },
      },
    });

    // Re-index in Meilisearch
    await this.meili.indexError({
      id: error.id,
      title: error.title,
      description: error.description || '',
      solution: error.solution,
      tags: error.tags.map((t) => t.tag.name),
      extractedText: error.images.map((img) => img.extractedText || '').join(' '),
      severity: error.severity,
      difficultyLevel: error.difficultyLevel,
      netsuitePath: error.netsuitePath || '',
    });

    return this.formatError(error);
  }

  async remove(id: string, userId: string, userRole: Role) {
    const existing = await this.prisma.netsuiteError.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Error not found');
    if (existing.createdBy !== userId && userRole !== Role.ADMIN) {
      throw new ForbiddenException('Only admins or the author can delete errors');
    }

    await this.prisma.netsuiteError.delete({ where: { id } });
    await this.meili.removeError(id);
    return { deleted: true };
  }

  private formatError(error: any) {
    return {
      id: error.id,
      title: error.title,
      description: error.description,
      rootCause: error.rootCause,
      solution: error.solution,
      netsuitePath: error.netsuitePath,
      howToTest: error.howToTest,
      postValidation: error.postValidation,
      difficultyLevel: error.difficultyLevel,
      severity: error.severity,
      tags: error.tags?.map((t: any) => t.tag?.name || t.name) || [],
      images: error.images || [],
      author: error.author,
      feedbackCount: error._count?.feedback,
      commentCount: error._count?.comments,
      createdAt: error.createdAt,
      updatedAt: error.updatedAt,
    };
  }
}
