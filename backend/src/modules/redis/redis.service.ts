import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private client: Redis;
  private readonly logger = new Logger(RedisService.name);
  private connected = false;

  constructor(private config: ConfigService) {
    try {
      const tlsEnabled = this.config.get('REDIS_TLS') === 'true';
      const password = this.config.get('REDIS_PASSWORD');

      this.client = new Redis({
        host: this.config.get('REDIS_HOST', 'localhost'),
        port: this.config.get<number>('REDIS_PORT', 6379),
        password: password || undefined,
        tls: tlsEnabled ? {} : undefined,
        maxRetriesPerRequest: 3,
        retryStrategy(times) {
          if (times > 3) return null;
          return Math.min(times * 200, 1000);
        },
      });

      this.client.on('connect', () => {
        this.connected = true;
        this.logger.log('Redis connected');
      });

      this.client.on('error', (err) => {
        this.connected = false;
        this.logger.warn(`Redis error: ${err.message}`);
      });
    } catch {
      this.logger.warn('Redis not available, caching disabled');
    }
  }

  async get(key: string): Promise<string | null> {
    if (!this.connected) return null;
    try {
      return await this.client.get(key);
    } catch {
      return null;
    }
  }

  async set(key: string, value: string, ttlSeconds = 300): Promise<void> {
    if (!this.connected) return;
    try {
      await this.client.set(key, value, 'EX', ttlSeconds);
    } catch {
      // silently fail - cache is optional
    }
  }

  async del(key: string): Promise<void> {
    if (!this.connected) return;
    try {
      await this.client.del(key);
    } catch {
      // silently fail
    }
  }

  async flushPattern(pattern: string): Promise<void> {
    if (!this.connected) return;
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(...keys);
      }
    } catch {
      // silently fail
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit();
    }
  }
}
