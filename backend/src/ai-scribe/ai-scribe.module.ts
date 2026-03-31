import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AIScribeGateway } from './ai-scribe.gateway';
import { AIScribeService } from './ai-scribe.service';

@Module({
  imports: [ConfigModule],
  providers: [AIScribeGateway, AIScribeService],
  exports: [AIScribeService],
})
export class AIScribeModule {}
