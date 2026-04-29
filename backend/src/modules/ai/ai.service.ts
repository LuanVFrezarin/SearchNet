import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import OpenAI from 'openai';

@Injectable()
export class AiService {
  private openai: OpenAI | null = null;
  private readonly logger = new Logger(AiService.name);

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {
    const apiKey = this.config.get('OPENAI_API_KEY');
    if (apiKey && !apiKey.startsWith('sk-your')) {
      this.openai = new OpenAI({ apiKey });
      this.logger.log('OpenAI initialized');
    } else {
      this.logger.warn('OpenAI not configured - AI features disabled');
    }
  }

  isAvailable(): boolean {
    return this.openai !== null;
  }

  async generateEmbedding(text: string): Promise<number[] | null> {
    if (!this.openai) return null;
    try {
      const response = await this.openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text.slice(0, 8000),
      });
      return response.data[0].embedding;
    } catch (err) {
      this.logger.warn(`Embedding generation failed: ${err.message}`);
      return null;
    }
  }

  async storeEmbedding(errorId: string): Promise<void> {
    if (!this.openai) return;

    const error = await this.prisma.netsuiteError.findUnique({
      where: { id: errorId },
      include: { images: true },
    });
    if (!error) return;

    const text = [
      error.title,
      error.description,
      error.solution,
      error.rootCause,
      error.netsuitePath,
      ...error.images.map((img) => img.extractedText).filter(Boolean),
    ]
      .filter(Boolean)
      .join(' ');

    const embedding = await this.generateEmbedding(text);
    if (!embedding) return;

    await this.prisma.errorEmbedding.upsert({
      where: { errorId },
      create: { errorId, embeddingVector: embedding },
      update: { embeddingVector: embedding },
    });
  }

  async findSimilar(text: string, limit = 5): Promise<{ errorId: string; score: number }[]> {
    if (!this.openai) return [];

    const queryEmbedding = await this.generateEmbedding(text);
    if (!queryEmbedding) return [];

    const allEmbeddings = await this.prisma.errorEmbedding.findMany();

    const results = allEmbeddings
      .map((item) => {
        const stored = item.embeddingVector as number[];
        const score = this.cosineSimilarity(queryEmbedding, stored);
        return { errorId: item.errorId, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return results.filter((r) => r.score > 0.3);
  }

  async suggestFromText(errorText: string): Promise<{
    suggestedTitle: string;
    suggestedCause: string;
    suggestedSolution: string;
    suggestedTags: string[];
  } | null> {
    if (!this.openai) return null;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a NetSuite expert. Given an error message or description, suggest:
1. A concise title for the error
2. The probable root cause
3. A step-by-step solution
4. Relevant tags (NetSuite modules/areas)

Respond in JSON format:
{
  "suggestedTitle": "...",
  "suggestedCause": "...",
  "suggestedSolution": "...",
  "suggestedTags": ["tag1", "tag2"]
}`,
          },
          {
            role: 'user',
            content: errorText,
          },
        ],
        response_format: { type: 'json_object' },
        max_tokens: 1000,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) return null;

      return JSON.parse(content);
    } catch (err) {
      this.logger.warn(`AI suggestion failed: ${err.message}`);
      return null;
    }
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    return denominator === 0 ? 0 : dotProduct / denominator;
  }
}
