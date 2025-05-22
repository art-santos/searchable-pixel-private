export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  author: {
    name: string;
    avatar?: string;
    title?: string;
  };
  content: string;
  tags: string[];
  readingTime: string;
  featured?: boolean;
  coverImage?: string;
}

export interface BlogCategory {
  name: string;
  slug: string;
  description: string;
  count: number;
} 