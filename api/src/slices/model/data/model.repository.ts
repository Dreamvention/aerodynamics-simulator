import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { IModelGateway, ModelMetadata, CreateModelInput } from '../domain';

@Injectable()
export class ModelRepository implements IModelGateway {
  // In-memory store for MVP; replace with database
  private models: Map<string, ModelMetadata> = new Map();

  async createModel(input: CreateModelInput): Promise<ModelMetadata> {
    const id = randomUUID();
    const model: ModelMetadata = {
      id,
      filename: input.filename,
      fileSize: input.fileSize,
      fileType: input.fileType,
      uploadedAt: new Date(),
      s3Key: `models/${id}/${input.filename}`,
    };

    this.models.set(id, model);
    return model;
  }

  async getModel(id: string): Promise<ModelMetadata | null> {
    return this.models.get(id) || null;
  }

  async listModels(): Promise<ModelMetadata[]> {
    return Array.from(this.models.values());
  }

  async deleteModel(id: string): Promise<void> {
    this.models.delete(id);
  }
}
