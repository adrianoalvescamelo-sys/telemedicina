import { Module, Controller, Get, Post, Body, UseGuards, Param } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { AuthGuard } from '../auth/auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@Controller('pacientes')
@UseGuards(AuthGuard, RolesGuard)
export class PacientesController {
  constructor(private supabase: SupabaseService) {}

  @Get(':id')
  @Roles('admin', 'medico', 'recepcionista')
  async findOne(@Param('id') id: string) {
    const { data, error } = await this.supabase
      .getClient()
      .from('pacientes')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  @Get()
  @Roles('admin', 'medico', 'recepcionista')
  async findAll() {
    const { data, error } = await this.supabase
      .getClient()
      .from('pacientes')
      .select('*')
      .order('nome_completo', { ascending: true });

    if (error) throw error;
    return data;
  }

  @Post()
  @Roles('admin', 'recepcionista')
  async create(@Body() patient: any) {
    const { data, error } = await this.supabase
      .getClient()
      .from('pacientes')
      .insert(patient)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

@Module({
  controllers: [PacientesController],
})
export class PacientesModule {}
