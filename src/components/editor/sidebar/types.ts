// Common types for sidebar components
export interface Template {
  _id: string;
  title: string;
  description?: string;
  thumbnailUrl: string;
  templateUrl: string;
  tags?: string[];
  createdAt?: string;
  userId?: string;
  isPublic: boolean;
  pages?: number;
}

export interface TextTemplate extends Template {
  type?: "text";
}

export interface Text {
  img: string;
  data: string;
}

export interface Image {
  _id: string;
  title?: string;
  description?: string;
  url: string;
  thumbnailUrl?: string;
  tags?: string[];
  createdAt?: string;
  userId?: string;
  isPublic?: boolean;
}

export interface Shape {
  _id: string;
  title?: string;
  description?: string;
  url: string;
  thumbnailUrl?: string;
  tags?: string[];
  createdAt?: string;
  userId?: string;
  isPublic?: boolean;
  svg?: string;
  width?: number;
  height?: number;
  background?: string;
}

export interface SearchResult<T> {
  item: T;
  refIndex: number;
  score: number;
}
