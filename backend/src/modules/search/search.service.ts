import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MeiliService } from '../meili/meili.service';
import { RedisService } from '../redis/redis.service';
import { AiService } from '../ai/ai.service';

interface SearchResult {
  id: string;
  title: string;
  description: string;
  solution: string;
  tags: string[];
  severity: string;
  difficultyLevel?: string;
  source: 'meili' | 'db' | 'semantic';
  score?: number;
}

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  constructor(
    private prisma: PrismaService,
    private meili: MeiliService,
    private redis: RedisService,
    private ai: AiService,
  ) {}

  async search(query: string, options?: { limit?: number; severity?: string; difficulty?: string }) {
    if (!query || query.trim().length < 2) {
      return { results: [], sources: [] };
    }

    const cacheKey = `search:${query}:${JSON.stringify(options || {})}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const limit = options?.limit || 20;
    const sources: string[] = [];

    // Run all search methods in parallel
    const [meiliResults, dbResults, semanticResults] = await Promise.all([
      this.searchMeili(query, limit),
      this.searchDatabase(query, limit),
      this.searchSemantic(query, Math.min(limit, 5)),
    ]);

    // Merge and deduplicate results
    const resultMap = new Map<string, SearchResult>();

    meiliResults.forEach((r) => {
      resultMap.set(r.id, { ...r, source: 'meili' });
      if (!sources.includes('meili')) sources.push('meili');
    });

    dbResults.forEach((r) => {
      if (!resultMap.has(r.id)) {
        resultMap.set(r.id, { ...r, source: 'db' });
        if (!sources.includes('db')) sources.push('db');
      }
    });

    semanticResults.forEach((r) => {
      if (!resultMap.has(r.id)) {
        resultMap.set(r.id, { ...r, source: 'semantic' });
      } else {
        // Boost score for items found in both text and semantic search
        const existing = resultMap.get(r.id)!;
        existing.score = (existing.score || 0.5) + (r.score || 0);
      }
      if (!sources.includes('semantic')) sources.push('semantic');
    });

    let results = Array.from(resultMap.values());

    // Apply filters
    if (options?.severity) {
      results = results.filter((r) => r.severity === options.severity);
    }
    if (options?.difficulty) {
      results = results.filter((r) => r.difficultyLevel === options.difficulty);
    }

    // Sort by score (highest first)
    results.sort((a, b) => (b.score || 0.5) - (a.score || 0.5));
    results = results.slice(0, limit);

    const response = { results, sources };

    // Cache for 60 seconds
    await this.redis.set(cacheKey, JSON.stringify(response), 60);

    return response;
  }

  async autocomplete(query: string): Promise<{ id: string; title: string; severity: string }[]> {
    if (!query || query.trim().length < 2) return [];

    const cacheKey = `autocomplete:${query.toLowerCase()}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    let results: { id: string; title: string; severity: string }[];

    if (this.meili.isAvailable()) {
      const meiliResults = await this.meili.search(query, { limit: 8 });
      results = meiliResults.map((r) => ({
        id: r.id,
        title: r.title,
        severity: r.severity,
      }));
    } else {
      const dbResults = await this.prisma.netsuiteError.findMany({
        where: {
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { tags: { some: { tag: { name: { contains: query, mode: 'insensitive' } } } } },
          ],
        },
        select: { id: true, title: true, severity: true },
        take: 8,
        orderBy: { createdAt: 'desc' },
      });
      results = dbResults;
    }

    await this.redis.set(cacheKey, JSON.stringify(results), 30);
    return results;
  }

  private async searchMeili(query: string, limit: number): Promise<SearchResult[]> {
    if (!this.meili.isAvailable()) return [];
    try {
      const hits = await this.meili.search(query, { limit });
      return hits.map((h) => ({
        id: h.id,
        title: h.title,
        description: h.description,
        solution: h.solution,
        tags: h.tags,
        severity: h.severity,
        source: 'meili' as const,
        score: 0.8,
      }));
    } catch {
      return [];
    }
  }

  private async searchDatabase(query: string, limit: number): Promise<SearchResult[]> {
    try {
      const errors = await this.prisma.netsuiteError.findMany({
        where: {
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { solution: { contains: query, mode: 'insensitive' } },
            { rootCause: { contains: query, mode: 'insensitive' } },
            { netsuitePath: { contains: query, mode: 'insensitive' } },
            { images: { some: { extractedText: { contains: query, mode: 'insensitive' } } } },
            { tags: { some: { tag: { name: { contains: query, mode: 'insensitive' } } } } },
          ],
        },
        include: { tags: { include: { tag: true } } },
        take: limit,
        orderBy: { createdAt: 'desc' },
      });

      return errors.map((e) => ({
        id: e.id,
        title: e.title,
        description: e.description || '',
        solution: e.solution,
        tags: e.tags.map((t) => t.tag.name),
        severity: e.severity,
        difficultyLevel: e.difficultyLevel,
        source: 'db' as const,
        score: 0.5,
      }));
    } catch {
      return [];
    }
  }

  private async searchSemantic(query: string, limit: number): Promise<SearchResult[]> {
    if (!this.ai.isAvailable()) return [];
    try {
      const similar = await this.ai.findSimilar(query, limit);
      if (similar.length === 0) return [];

      const errorIds = similar.map((s) => s.errorId);
      const errors = await this.prisma.netsuiteError.findMany({
        where: { id: { in: errorIds } },
        include: { tags: { include: { tag: true } } },
      });

      return errors.map((e) => {
        const sim = similar.find((s) => s.errorId === e.id);
        return {
          id: e.id,
          title: e.title,
          description: e.description || '',
          solution: e.solution,
          tags: e.tags.map((t) => t.tag.name),
          severity: e.severity,
          difficultyLevel: e.difficultyLevel,
          source: 'semantic' as const,
          score: sim?.score || 0.3,
        };
      });
    } catch {
      return [];
    }
  }
}
