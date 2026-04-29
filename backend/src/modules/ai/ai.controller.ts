import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AiService } from './ai.service';
import { IsString, MinLength } from 'class-validator';

class SuggestDto {
  @IsString()
  @MinLength(5)
  text: string;
}

@Controller('ai')
export class AiController {
  constructor(private aiService: AiService) {}

  @Post('suggest')
  @UseGuards(AuthGuard('jwt'))
  async suggest(@Body() dto: SuggestDto) {
    if (!this.aiService.isAvailable()) {
      return { error: 'AI not configured. Set OPENAI_API_KEY in environment.' };
    }

    const [suggestions, similar] = await Promise.all([
      this.aiService.suggestFromText(dto.text),
      this.aiService.findSimilar(dto.text, 5),
    ]);

    return { suggestions, similarErrorIds: similar };
  }
}
