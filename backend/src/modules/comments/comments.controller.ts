import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CommentsService } from './comments.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { IsString, MinLength } from 'class-validator';

class CreateCommentDto {
  @IsString()
  @MinLength(1)
  content: string;
}

@Controller('errors/:errorId/comments')
export class CommentsController {
  constructor(private commentsService: CommentsService) {}

  @Get()
  findAll(@Param('errorId') errorId: string) {
    return this.commentsService.findByError(errorId);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'))
  create(
    @Param('errorId') errorId: string,
    @Body() dto: CreateCommentDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.commentsService.create(errorId, userId, dto.content);
  }

  @Delete(':commentId')
  @UseGuards(AuthGuard('jwt'))
  remove(
    @Param('commentId') commentId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.commentsService.remove(commentId, userId);
  }
}
