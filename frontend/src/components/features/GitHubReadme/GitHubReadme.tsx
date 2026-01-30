import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import { githubService } from '../../../services/githubService';
import './GitHubReadme.css';

// Import highlight.js theme
import 'highlight.js/styles/github.css';

interface GitHubReadmeProps {
  repoName: string;
  className?: string;
}

/**
 * GitHubReadme
 *
 * Fetches and renders a GitHub repository README with:
 * - GitHub-flavored Markdown support
 * - Syntax highlighting for code blocks
 * - Responsive images
 * - Task lists and tables
 */
export function GitHubReadme({ repoName, className = '' }: GitHubReadmeProps) {
  const [readme, setReadme] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchReadme() {
      try {
        setIsLoading(true);
        setError(null);
        const content = await githubService.getReadme(repoName);
        setReadme(content);
      } catch (err) {
        console.error('Failed to fetch README:', err);
        setError('Unable to load README');
      } finally {
        setIsLoading(false);
      }
    }

    fetchReadme();
  }, [repoName]);

  if (isLoading) {
    return (
      <div className={`github-readme loading ${className}`}>
        <div className="readme-skeleton">
          <div className="skeleton-line w-3-4" />
          <div className="skeleton-line w-full" />
          <div className="skeleton-line w-5-6" />
          <div className="skeleton-line w-2-3" />
        </div>
      </div>
    );
  }

  if (error || !readme) {
    return (
      <div className={`github-readme empty ${className}`}>
        <p className="readme-empty-message">
          {error || 'No README available for this repository.'}
        </p>
        <a
          href={`https://github.com/chrisrogers37/${repoName}`}
          target="_blank"
          rel="noopener noreferrer"
          className="readme-github-link"
        >
          View on GitHub
        </a>
      </div>
    );
  }

  return (
    <div className={`github-readme ${className}`}>
      <article className="readme-content">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeHighlight, rehypeRaw]}
          components={{
            // Custom component rendering
            a: ({ href, children }) => (
              <a
                href={href}
                target={href?.startsWith('http') ? '_blank' : undefined}
                rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
              >
                {children}
              </a>
            ),
            img: ({ src, alt }) => {
              // Handle relative GitHub URLs
              const imageSrc = src?.startsWith('http')
                ? src
                : `https://raw.githubusercontent.com/chrisrogers37/${repoName}/main/${src}`;

              return (
                <img
                  src={imageSrc}
                  alt={alt || ''}
                  loading="lazy"
                  className="readme-image"
                />
              );
            },
            pre: ({ children }) => (
              <pre className="readme-code-block">
                {children}
              </pre>
            ),
          }}
        >
          {readme}
        </ReactMarkdown>
      </article>
    </div>
  );
}
