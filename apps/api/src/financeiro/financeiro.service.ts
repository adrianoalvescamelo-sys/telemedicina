import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class FinanceiroService {
  private readonly logger = new Logger(FinanceiroService.name);

  constructor(private supabase: SupabaseService) {}

  async findAll(filters?: { status?: string; tipo?: string }) {
    let query = this.supabase.getClient().from('lancamentos').select('*');

    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.tipo) query = query.eq('tipo', filters.tipo);

    const { data, error } = await query.order('criado_em', { ascending: false });
    if (error) throw error;
    return data;
  }

  async getStats() {
    const { data: all, error } = await this.supabase
      .getClient()
      .from('lancamentos')
      .select('*');

    if (error) throw error;

    const stats = {
      totalPendente: all.filter(l => l.status === 'pendente').reduce((sum, l) => sum + Number(l.valor), 0),
      totalPago: all.filter(l => l.status === 'pago').reduce((sum, l) => sum + Number(l.valor), 0),
      totalInadimplente: all.filter(l => l.status === 'atrasado').reduce((sum, l) => sum + Number(l.valor), 0),
      cashflow: this.aggregateCashflow(all)
    };

    return stats;
  }

  async create(data: { descricao: string; valor: number; tipo: string; paciente_id?: string; data_vencimento: string }) {
    const { data: res, error } = await this.supabase
      .getClient()
      .from('lancamentos')
      .insert([data])
      .select();

    if (error) throw error;
    return res[0];
  }

  async updateStatus(id: string, status: string) {
    const updateData: any = { status };
    if (status === 'pago') updateData.data_pagamento = new Date().toISOString();

    const { data, error } = await this.supabase
      .getClient()
      .from('lancamentos')
      .update(updateData)
      .eq('id', id)
      .select();

    if (error) throw error;
    return data[0];
  }

  private aggregateCashflow(items: any[]) {
    const monthly: Record<string, { mes: string; entrada: number; saida: number }> = {};
    const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const label = `${months[d.getMonth()]}`;
      monthly[label] = { mes: label, entrada: 0, saida: 0 };
    }

    items.forEach(item => {
      const date = new Date(item.criado_em);
      const label = months[date.getMonth()];
      if (monthly[label]) {
        if (item.tipo === 'entrada') monthly[label].entrada += Number(item.valor);
        if (item.tipo === 'saida') monthly[label].saida += Number(item.valor);
      }
    });

    return Object.values(monthly);
  }
}
