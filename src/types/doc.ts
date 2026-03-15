export interface Doc {
  id?: string;
  content: string;
  metadata: Record<string, unknown>;
  embedding: number[];
}