import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FeedbackService } from './feedback.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

class CreateFeedbackDto {
  @IsBoolean()
  worked: boolean;

  @IsString()
  @IsOptional()
  comment?: string;
}

@Controller('errors/:errorId/feedback')
export class FeedbackController {
  constructor(private feedbackService: FeedbackService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  create(
    @Param('errorId') errorId: string,
    @Body() dto: CreateFeedbackDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.feedbackService.create(errorId, userId, dto.worked, dto.comment);
  }

  @Get('stats')
  stats(@Param('errorId') errorId: string) {
    return this.feedbackService.getStats(errorId);
  }
}
