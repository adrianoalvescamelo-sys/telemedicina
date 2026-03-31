import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { FinanceiroService } from './financeiro.service';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('financeiro')
@UseGuards(AuthGuard, RolesGuard)
@Roles('admin', 'recepcionista')
export class FinanceiroController {
  constructor(private readonly financeiroService: FinanceiroService) {}

  @Get('stats')
  getStats() {
    return this.financeiroService.getStats();
  }

  @Get()
  findAll(@Query('status') status?: string, @Query('tipo') tipo?: string) {
    return this.financeiroService.findAll({ status, tipo });
  }

  @Post()
  create(@Body() data: any) {
    return this.financeiroService.create(data);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.financeiroService.updateStatus(id, status);
  }
}
