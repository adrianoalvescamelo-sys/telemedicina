import { Module, Controller, Get, Post, Body, UseGuards, Patch, Param } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { SupabaseModule } from '../supabase/supabase.module';
import { FinanceiroService } from '../financeiro/financeiro.service';
import { FinanceiroModule } from '../financeiro/financeiro.module';
import { AuthGuard } from '../auth/auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@Controller('consultas')
@UseGuards(AuthGuard, RolesGuard)
export class AgendaController {
  constructor(
    private supabase: SupabaseService,
    private financeiro: FinanceiroService
  ) {}

  @Get()
  @Roles('admin', 'medico', 'recepcionista')
  async findAll() {
    const { data, error } = await this.supabase
      .getClient()
      .from('consultas')
      .select('*, paciente:pacientes(nome_completo), medico:usuarios(nome)');

    if (error) throw error;
    return data;
  }

  @Post()
  @Roles('admin', 'recepcionista')
  async create(@Body() appointment: any) {
    const { data, error } = await this.supabase
      .getClient()
      .from('consultas')
      .insert(appointment)
      .select('*, paciente:pacientes(nome_completo)')
      .single();

    if (error) throw error;

    // Trigger Automatic Billing
    if (data.valor > 0) {
      await this.financeiro.create({
        descricao: `Consulta - ${data.paciente.nome_completo}`,
        valor: data.valor,
        tipo: 'entrada',
        paciente_id: data.paciente_id,
        data_vencimento: data.data_hora_inicio.split('T')[0]
      });
    }

    return data;
  }

  @Patch(':id/status')
  @Roles('admin', 'medico', 'recepcionista')
  async updateStatus(@Param('id') id: string, @Body('status') status: string) {
    const { data, error } = await this.supabase
      .getClient()
      .from('consultas')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

@Module({
  imports: [SupabaseModule, FinanceiroModule],
  controllers: [AgendaController],
})
export class AgendaModule {}
