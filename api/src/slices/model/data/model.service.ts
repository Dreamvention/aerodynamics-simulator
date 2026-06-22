import { Injectable, NotFoundException } from '@nestjs/common';
import { ModelRepository } from './model.repository';
import { CreateModelInput, ModelMetadata } from '../domain';

@Injectable()
export class ModelService {
  constructor(private readonly repository: ModelRepository) {}

  createModel(input: CreateModelInput): Promise<ModelMetadata> {
    return this.repository.createModel(input);
  }

  async getModel(id: string): Promise<ModelMetadata> {
    const model = await this.repository.getModel(id);
    if (!model) {
      throw new NotFoundException(`Model ${id} not found`);
    }
    return model;
  }

  listModels(): Promise<ModelMetadata[]> {
    return this.repository.listModels();
  }

  deleteModel(id: string): Promise<void> {
    return this.repository.deleteModel(id);
  }
}
