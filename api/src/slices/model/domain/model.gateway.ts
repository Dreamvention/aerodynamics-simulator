import { ModelMetadata, CreateModelInput } from './model.types';

export interface IModelGateway {
  createModel(input: CreateModelInput): Promise<ModelMetadata>;
  getModel(id: string): Promise<ModelMetadata | null>;
  listModels(): Promise<ModelMetadata[]>;
  deleteModel(id: string): Promise<void>;
}
