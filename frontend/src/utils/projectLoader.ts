import yaml from 'js-yaml';
import { Project } from '../types/Project';

// Note: In a browser environment, we'll need to fetch these files
// For now, we'll create a mock implementation that can be replaced
// with actual file loading in production

export const loadProjects = async (): Promise<Project[]> => {
  // This is a mock implementation for development
  // In production, you would fetch the YAML files from the content directory
  const mockProjects: Project[] = [
    {
      id: 'shuffify',
      title: 'Shuffify',
      description: 'A better way to manage your Spotify playlists',
      url: 'https://shuffify.app',
      icon: 'fas fa-music',
      category: 'web-app',
      technologies: ['React', 'TypeScript', 'Spotify API'],
      featured: true,
      order: 1,
      status: 'active',
      tags: ['music', 'spotify', 'playlist-management']
    },
    {
      id: 'city-cycles',
      title: 'City Cycles',
      description: 'End-to-end analytics flow comparing public bike programs in NYC and London',
      url: 'https://city-cycles.streamlit.app/',
      icon: 'fas fa-bicycle',
      category: 'data-science',
      technologies: ['Python', 'Streamlit', 'Data Analysis'],
      featured: true,
      order: 2,
      status: 'active',
      tags: ['data-science', 'transportation', 'analytics']
    },
    {
      id: 'hedwig',
      title: 'Hedwig',
      description: 'RAG-assisted LLM chatbot for generating email outreach templates',
      url: 'https://hedwig.streamlit.app/',
      icon: 'fas fa-feather',
      category: 'ai-tools',
      technologies: ['Python', 'LLM', 'RAG', 'Streamlit'],
      featured: true,
      order: 3,
      status: 'active',
      tags: ['ai', 'llm', 'email', 'automation']
    },
    {
      id: 'github',
      title: 'GitHub',
      description: 'Check out my open source projects and contributions',
      url: 'https://github.com/chrisrogers37/',
      icon: 'fab fa-github',
      category: 'open-source',
      technologies: ['Various'],
      featured: false,
      order: 4,
      status: 'active',
      tags: ['open-source', 'development', 'contributions']
    }
  ];

  return mockProjects.sort((a, b) => a.order - b.order);
};

// Future implementation for loading actual YAML files:
/*
export const loadProjectsFromYAML = async (): Promise<Project[]> => {
  const projectsDir = '/src/content/projects/';
  const response = await fetch(projectsDir);
  const files = await response.json(); // Assuming you have an API endpoint
  
  const projects = await Promise.all(
    files
      .filter((file: string) => file.endsWith('.yaml'))
      .map(async (file: string) => {
        const response = await fetch(`${projectsDir}/${file}`);
        const content = await response.text();
        return yaml.load(content) as Project;
      })
  );
  
  return projects.sort((a, b) => a.order - b.order);
};
*/
