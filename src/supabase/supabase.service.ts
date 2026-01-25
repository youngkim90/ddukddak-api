import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService implements OnModuleInit {
  private client: SupabaseClient;
  private adminClient: SupabaseClient;

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.getOrThrow<string>('supabase.url');
    const supabaseAnonKey = this.configService.getOrThrow<string>('supabase.anonKey');
    const supabaseServiceRoleKey = this.configService.getOrThrow<string>('supabase.serviceRoleKey');

    // Public client (respects RLS)
    this.client = createClient(supabaseUrl, supabaseAnonKey);

    // Admin client (bypasses RLS - use carefully)
    this.adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  onModuleInit() {
    // Supabase client initialized
  }

  getClient(): SupabaseClient {
    return this.client;
  }

  getAdminClient(): SupabaseClient {
    return this.adminClient;
  }
}
