import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ModelService } from './data';
import { CreateModelDto, ModelResponseDto } from './dtos';

@Controller('models')
export class ModelController {
  constructor(private readonly modelService: ModelService) {}

  @Post()
  async create(@Body() dto: CreateModelDto): Promise<ModelResponseDto> {
    return this.modelService.createModel({
      filename: dto.filename,
      fileSize: dto.fileSize,
      fileType: dto.fileType,
      // File bytes are uploaded separately (e.g. via a presigned URL); the
      // metadata-only MVP keeps an empty buffer placeholder.
      fileBuffer: Buffer.alloc(0),
    });
  }

  @Get()
  async list(): Promise<ModelResponseDto[]> {
    return this.modelService.listModels();
  }

  @Get(':id')
  async getOne(@Param('id') id: string): Promise<ModelResponseDto> {
    return this.modelService.getModel(id);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    return this.modelService.deleteModel(id);
  }
}
