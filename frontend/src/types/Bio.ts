export interface BioData {
  display_name: string;
  email: string;
  location: string;
  about_text: string;
  tagline?: string;
  role?: string;
  social_links: {
    github: string;
    hoobe: string;
    spotify: string;
    linkedin: string;
    telegram?: string;
    instagram_personal?: string;
    instagram_music?: string;
  };
}
