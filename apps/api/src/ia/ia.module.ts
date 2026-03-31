import { Controller, Post, UseInterceptors, UploadedFile, UseGuards, Body, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { IaService } from './ia.service';
import { AuthGuard } from '../auth/auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@Controller('ia')
@UseGuards(AuthGuard, RolesGuard)
export class IaController {
  constructor(private readonly iaService: IaService) {}

  @Post('transcrever')
  @Roles('admin', 'medico')
  @UseInterceptors(FileInterceptor('audio'))
  async transcribe(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Nenhum arquivo de áudio enviado');
    
    // Save to Supabase Storage first
    const timestamp = Date.now();
    const fileName = `consulta_${timestamp}.webm`;
    const audioUrl = await this.iaService.saveAudioToSupabase(file, fileName);
    
    // Then transcribe
    const text = await this.iaService.transcribe(file);
    
    return { text, audioUrl };
  }

  @Post('analisar')
  @Roles('admin', 'medico')
  async analyze(@Body() body: { transcript: string; patientContext: any }) {
    if (!body.transcript) throw new BadRequestException('Transcrição necessária');
    
    const analysis = await this.iaService.analyzeClinical(body.transcript, body.patientContext);
    return { analysis };
  }
}

import { Module } from '@nestjs/common';

@Module({
  controllers: [IaController],
  providers: [IaService],
  exports: [IaService],
})
export class IaModule {}
