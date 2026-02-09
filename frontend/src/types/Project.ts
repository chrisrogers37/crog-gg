export interface Project {
  id: string;
  title: string;
  description: string;
  url: string;
  icon: string;
  category: string;
  technologies: string[];
  featured: boolean;
  order: number;
  image?: string;
  github?: string;
  demo?: string;
  status?: "active" | "archived" | "experimental";
  tags?: string[];
}
