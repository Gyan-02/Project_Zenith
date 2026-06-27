export interface KnowledgeDocument {
  id: string;
  title: string;
  text: string;
  source: string;
  culture?: string;
  objectIds: string[];
}
