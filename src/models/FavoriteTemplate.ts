export interface FavoriteTemplate {
  templateId: string;
  userId: string;
  createdAt: string;
  updatedAt?: string;
}

export interface FavoriteTemplateWithDetails extends FavoriteTemplate {
  title?: string;
  description?: string;
  thumbnailUrl?: string;
  templateUrl?: string;
  isPublic?: boolean;
}
