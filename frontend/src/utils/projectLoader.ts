import yaml from 'js-yaml';
import { Project } from '../types/Project';

/**
 * Raw YAML project data structure before mapping to Project interface
 */
interface RawProjectData {
  id: string;
  title: string;
  description: string;
  url?: string;
  demo_url?: string;
  github_url?: string;
  icon: string;
  category: string;
  technologies?: string[];
  featured?: boolean;
  order?: number;
  image?: string;
  status?: 'active' | 'archived' | 'experimental';
  tags?: string[];
}

export const loadProjects = async (): Promise<Project[]> => {
  try {
    // Dynamically discover all YAML files in the projects directory
    // We'll need to create an index file or use a different approach
    // For now, let's try to fetch a projects index that lists all available files
    const indexResponse = await fetch('/content/projects/index.yaml');
    
    if (indexResponse.ok) {
      // If we have an index file, use it to get the list of project files
      const indexContent = await indexResponse.text();
      const indexData = yaml.load(indexContent) as { projects: string[] };
      const projectFiles = indexData.projects;
      
      const projects = await Promise.all(
        projectFiles.map(async (file: string) => {
          const response = await fetch(`/content/projects/${file}`);
          if (!response.ok) {
            throw new Error(`Failed to fetch ${file}: ${response.statusText}`);
          }
          const content = await response.text();
          const projectData = yaml.load(content) as RawProjectData;
          
          // Map YAML fields to Project interface
          const project: Project = {
            id: projectData.id,
            title: projectData.title,
            description: projectData.description,
            url: projectData.url || projectData.demo_url || projectData.github_url || '#',
            icon: projectData.icon,
            category: projectData.category,
            technologies: projectData.technologies || [],
            featured: projectData.featured || false,
            order: projectData.order || 999,
            image: projectData.image,
            github: projectData.github_url,
            demo: projectData.demo_url,
            status: projectData.status,
            tags: projectData.tags || []
          };
          
          return project;
        })
      );
      
      console.log('Projects data loaded from YAML:', projects);
      return projects.sort((a, b) => a.order - b.order);
    } else {
      // Fallback: try to load common project files if no index exists
      const commonFiles = [
        'shuffify.yaml',
        'city-cycles.yaml', 
        'hedwig.yaml',
        'github.yaml'
      ];
      
      const projects = await Promise.all(
        commonFiles.map(async (file: string) => {
          try {
            const response = await fetch(`/content/projects/${file}`);
            if (!response.ok) {
              console.warn(`Skipping ${file}: ${response.statusText}`);
              return null;
            }
            const content = await response.text();
            const projectData = yaml.load(content) as RawProjectData;
            
            // Map YAML fields to Project interface
            const project: Project = {
              id: projectData.id,
              title: projectData.title,
              description: projectData.description,
              url: projectData.url || projectData.demo_url || projectData.github_url || '#',
              icon: projectData.icon,
              category: projectData.category,
              technologies: projectData.technologies || [],
              featured: projectData.featured || false,
              order: projectData.order || 999,
              image: projectData.image,
              github: projectData.github_url,
              demo: projectData.demo_url,
              status: projectData.status,
              tags: projectData.tags || []
            };
            
            return project;
          } catch (error) {
            console.warn(`Error loading ${file}:`, error);
            return null;
          }
        })
      );
      
      // Filter out null results
      const validProjects = projects.filter((project): project is Project => project !== null);
      
      console.log('Projects data loaded from YAML:', validProjects);
      return validProjects.sort((a, b) => a.order - b.order);
    }
  } catch (error) {
    console.error('Error loading projects from YAML:', error);
    throw error;
  }
};
