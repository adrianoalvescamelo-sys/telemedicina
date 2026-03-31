import { Module, Controller, Get, Post, Body, UseGuards, Param } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { AuthGuard } from '../auth/auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@Controller('prontuarios')
@UseGuards(AuthGuard, RolesGuard)
export class ProntuarioController {
  constructor(private supabase: SupabaseService) {}

  @Get(':id')
  @Roles('admin', 'medico')
  async findOne(@Param('id') id: string) {
    const { data, error } = await this.supabase
      .getClient()
      .from('prontuarios')
      .select('*, pacientes(nome_completo)')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  @Get('pacientes/:id')
  @Roles('admin', 'medico')
  async findByPaciente(@Param('id') id: string) {
    const { data, error } = await this.supabase
      .getClient()
      .from('prontuarios')
      .select('*')
      .eq('paciente_id', id)
      .order('criado_em', { ascending: false });

    if (error) throw error;
    return data;
  }

  @Post()
  @Roles('medico')
  async create(@Body() record: any) {
    const { data, error } = await this.supabase
      .getClient()
      .from('prontuarios')
      .insert({
        ...record,
        status: 'draft',
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  @Post(':id/assinar')
  @Roles('medico')
  async sign(@Param('id') id: string, @Body() sig: { assinado_por: string }) {
    const { data, error } = await this.supabase
      .getClient()
      .from('prontuarios')
      .update({
        status: 'assinado',
        assinado_por: sig.assinado_por,
        assinado_em: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

@Module({
  controllers: [ProntuarioController],
})
export class ProntuarioModule {}
