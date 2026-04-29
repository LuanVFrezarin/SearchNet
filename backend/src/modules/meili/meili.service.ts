import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MeiliSearch, Index } from 'meilisearch';

export interface MeiliError {
  id: string;
  title: string;
  description: string;
  solution: string;
  tags: string[];
  extractedText: string;
  severity: string;
  difficultyLevel: string;
  netsuitePath: string;
}

@Injectable()
export class MeiliService implements OnModuleInit {
  private client: MeiliSearch;
  private index: Index<MeiliError>;
  private available = false;
  private readonly logger = new Logger(MeiliService.name);

  constructor(private config: ConfigService) {}

  async onModuleInit() {
    try {
      this.client = new MeiliSearch({
        host: this.config.get('MEILI_HOST', 'http://localhost:7700'),
        apiKey: this.config.get('MEILI_API_KEY', ''),
      });

      await this.client.health();
      this.available = true;
      this.logger.log('Meilisearch connected');

      this.index = this.client.index('errors');

      await this.index.updateSettings({
        searchableAttributes: [
          'title',
          'description',
          'solution',
          'tags',
          'extractedText',
          'netsuitePath',
        ],
        filterableAttributes: ['severity', 'difficultyLevel', 'tags'],
        sortableAttributes: ['title'],
        typoTolerance: {
          enabled: true,
          minWordSizeForTypos: { oneTypo: 3, twoTypos: 6 },
        },
      });
    } catch (err) {
      this.logger.warn(`Meilisearch not available: ${err.message}`);
      this.available = false;
    }
  }

  isAvailable(): boolean {
    return this.available;
  }

  async indexError(error: MeiliError): Promise<void> {
    if (!this.available) return;
    try {
      await this.index.addDocuments([error]);
    } catch (err) {
      this.logger.warn(`Failed to index error: ${err.message}`);
    }
  }

  async removeError(id: string): Promise<void> {
    if (!this.available) return;
    try {
      await this.index.deleteDocument(id);
    } catch (err) {
      this.logger.warn(`Failed to remove error from index: ${err.message}`);
    }
  }

  async search(
    query: string,
    options?: { limit?: number; filters?: string },
  ): Promise<{ id: string; title: string; description: string; solution: string; tags: string[]; severity: string }[]> {
    if (!this.available) return [];
    try {
      const results = await this.index.search(query, {
        limit: options?.limit || 20,
        filter: options?.filters,
        attributesToHighlight: ['title', 'description', 'solution'],
        highlightPreTag: '<mark>',
        highlightPostTag: '</mark>',
      });
      return results.hits.map((hit) => ({
        id: hit.id,
        title: (hit._formatted?.title as string) || hit.title,
        description: (hit._formatted?.description as string) || hit.description,
        solution: (hit._formatted?.solution as string) || hit.solution,
        tags: hit.tags,
        severity: hit.severity,
      }));
    } catch (err) {
      this.logger.warn(`Search failed: ${err.message}`);
      return [];
    }
  }
}
