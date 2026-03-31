import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(private supabase: SupabaseService) {}

  async getKpis() {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const firstDayMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    // 1. Consultas Hoje
    const { count: consultasHoje } = await this.supabase
      .getClient()
      .from('consultas')
      .select('*', { count: 'exact', head: true })
      .gte('data_hora_inicio', today + 'T00:00:00')
      .lte('data_hora_inicio', today + 'T23:59:59');

    // 2. Pacientes Novos (este mês)
    const { count: pacientesNovos } = await this.supabase
      .getClient()
      .from('pacientes')
      .select('*', { count: 'exact', head: true })
      .gte('criado_em', firstDayMonth);

    // 3. Próximas Consultas (Hoje)
    const { data: proximas } = await this.supabase
      .getClient()
      .from('consultas')
      .select('*, paciente:pacientes(nome_completo), medico:usuarios(nome)')
      .gte('data_hora_inicio', today + 'T00:00:00')
      .order('data_hora_inicio', { ascending: true })
      .limit(5);

    // 4. Taxa de ocupação (simplificada: agendado / total slots)
    // Para simplificar, retornaremos mock por enquanto pois requer configuração de agenda
    const taxaOcupacao = 75; 

    return {
      consultasHoje: consultasHoje || 0,
      pacientesNovos: pacientesNovos || 0,
      proximas: proximas || [],
      taxaOcupacao
    };
  }
}
