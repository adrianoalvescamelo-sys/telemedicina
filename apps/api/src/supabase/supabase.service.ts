import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private readonly logger = new Logger(SupabaseService.name);
  private clientInstance: SupabaseClient;

  constructor(private configService: ConfigService) {}

  getClient(): SupabaseClient {
    if (this.clientInstance) {
      return this.clientInstance;
    }

    const url = this.configService.get<string>('SUPABASE_URL');
    const key = this.configService.get<string>('SUPABASE_KEY');

    if (!url || !key) {
      this.logger.error('SUPABASE_URL or SUPABASE_KEY missing in environment');
      throw new Error('Supabase configuration missing');
    }

    this.clientInstance = createClient(url, key);
    return this.clientInstance;
  }
}
