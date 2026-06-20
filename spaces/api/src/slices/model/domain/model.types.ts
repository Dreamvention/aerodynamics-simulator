export interface ModelMetadata {
  id: string;
  filename: string;
  fileSize: number;
  fileType: 'stl' | 'step';
  uploadedAt: Date;
  s3Key: string;
}

export interface CreateModelInput {
  filename: string;
  fileSize: number;
  fileType: 'stl' | 'step';
  fileBuffer: Buffer;
}
