import { Controller, Post, Body, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Controller('auth')
export class AuthController {
  constructor(private supabase: SupabaseService) {}

  @Post('login')
  async login(@Body() body: any) {
    const { email, senha } = body;

    if (!email || !senha) {
      throw new BadRequestException('E-mail e senha são obrigatórios');
    }

    const { data, error } = await this.supabase
      .getClient()
      .auth.signInWithPassword({ email, password: senha });

    if (error) {
      throw new UnauthorizedException(error.message);
    }

    // Check if MFA is required (Supabase sometimes returns a challenge)
    // Actually, for basic integration we return the user and session
    const userRole = data.user.app_metadata?.role || 'paciente';
    const userName = data.user.user_metadata?.nome || data.user.email?.split('@')[0];

    return {
      user: {
        id: data.user.id,
        nome: userName,
        email: data.user.email,
        role: userRole,
        mfaAtivo: !!data.user.factors?.length,
      },
      accessToken: data.session?.access_token,
      refreshToken: data.session?.refresh_token,
    };
  }

  @Post('mfa/verify')
  async verifyMfa(@Body() body: any) {
    const { factorId, code } = body;
    
    // Supabase MFA verification logic
    const { data, error } = await this.supabase
      .getClient()
      .auth.mfa.challengeAndVerify({
        factorId,
        code,
      });

    if (error) {
      throw new UnauthorizedException(error.message);
    }

    return data;
  }

  @Post('refresh')
  async refresh(@Body('refreshToken') refreshToken: string) {
    const { data, error } = await this.supabase
      .getClient()
      .auth.refreshSession({ refresh_token: refreshToken });

    if (error) {
      throw new UnauthorizedException(error.message);
    }

    return {
      accessToken: data.session?.access_token,
      refreshToken: data.session?.refresh_token,
    };
  }
}
