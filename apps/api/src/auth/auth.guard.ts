import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private supabase: SupabaseService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      return false;
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await this.supabase.getClient().auth.getUser(token);

    if (error || !user) {
      return false;
    }

    // Attach user and role to request
    request.user = user;
    // Note: Suapbase metadata usually stores the role if configured
    request.user.role = user.app_metadata?.role || 'paciente';

    return true;
  }
}
