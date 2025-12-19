export interface ScrapedArticle {
  title: string;
  description?: string;
  content?: string;
  url: string;
  imageUrl?: string;
  category: string;
  source: string;
  author?: string;
  publishedAt?: Date;
}