import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { ConfigModule } from '@nestjs/config';
import { SupabaseModule } from './supabase/supabase.module';
import { AuthModule } from './auth/auth.module';
import { PacientesModule } from './pacientes/pacientes.module';
import { AgendaModule } from './agenda/agenda.module';
import { ProntuarioModule } from './prontuario/prontuario.module';
import { IaModule } from './ia/ia.module';
import { FinanceiroModule } from './financeiro/financeiro.module';
import { DashboardModule } from './dashboard/dashboard.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    SupabaseModule,
    AuthModule,
    PacientesModule,
    AgendaModule,
    ProntuarioModule,
    IaModule,
    FinanceiroModule,
    DashboardModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
