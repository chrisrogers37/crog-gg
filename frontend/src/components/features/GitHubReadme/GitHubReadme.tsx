import {
  Children,
  cloneElement,
  isValidElement,
  useEffect,
  useState,
  type ComponentProps,
} from "react";
import ReactMarkdown, { type ExtraProps } from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import {
  githubService,
  type Readme,
} from "../../../services/githubService";
import {
  isLocalDevUrl,
  readmeHref,
  readmeImageSrc,
} from "../../../utils/readmeLinks";
// Base syntax theme first; the component adapts its surface and dark colors.
import "highlight.js/styles/github.css";
import "./GitHubReadme.css";

/** A wide table scrolls in a box a keyboard can focus, like code. */
function ReadmeTable({ node: _node, ...props }: ComponentProps<"table"> & ExtraProps) {
  return (
    <div className="readme-table" tabIndex={0}>
      <table {...props} />
    </div>
  );
}

/**
 * Both plain and highlighted fences scroll their <code> element sideways,
 * so that is what a keyboard must be able to focus.
 */
function ReadmeCodeBlock({ children }: ComponentProps<"pre">) {
  return (
    <pre className="readme-code-block">
      {Children.map(children, (child) =>
        isValidElement<{ tabIndex?: number }>(child)
          ? cloneElement(child, { tabIndex: 0 })
          : child,
      )}
    </pre>
  );
}

/**
 * A task list's checkbox says what it shows to a screen reader. With no raw
 * HTML rendered, a task list is the only place a README has an input.
 */
function TaskCheckbox({ node: _node, ...props }: ComponentProps<"input"> & ExtraProps) {
  return <input {...props} aria-label={props.checked ? "done" : "to do"} />;
}

interface GitHubReadmeProps {
  /** The repo's owner, from the project's own GitHub URL. */
  owner: string;
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
export function GitHubReadme({
  owner,
  repoName,
  className = "",
}: GitHubReadmeProps) {
  const [readme, setReadme] = useState<Readme | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function fetchReadme() {
      try {
        setIsLoading(true);
        setError(null);
        const content = await githubService.getReadme(owner, repoName);
        if (!ignore) {
          setReadme(content);
        }
      } catch (err) {
        if (!ignore) {
          console.error("Failed to fetch README:", err);
          setError("Unable to load README");
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    fetchReadme();

    return () => {
      ignore = true;
    };
  }, [owner, repoName]);

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

  // An empty README, or one over the contents API's 1 MB limit, arrives with
  // no text: say so rather than render an empty article.
  if (error || !readme || !readme.text.trim()) {
    return (
      <div className={`github-readme empty ${className}`}>
        <p className="readme-empty-message">
          {error || "No README available for this repository."}
        </p>
        <a
          href={`https://github.com/${owner}/${repoName}`}
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
          rehypePlugins={[rehypeHighlight]}
          components={{
            // Relative links and images resolve against the README on GitHub,
            // not against this site (utils/readmeLinks.ts).
            a: ({ href, children }) => {
              if (isLocalDevUrl(href)) return <span>{children}</span>;
              const target = readmeHref(href, readme);
              const external = target?.startsWith("http");
              return (
                <a
                  href={target}
                  target={external ? "_blank" : undefined}
                  rel={external ? "noopener noreferrer" : undefined}
                >
                  {children}
                </a>
              );
            },
            img: ({ src, alt }) => (
              <img
                src={readmeImageSrc(src, readme)}
                alt={alt || ""}
                loading="lazy"
                className="readme-image"
              />
            ),
            table: ReadmeTable,
            input: TaskCheckbox,
            pre: ReadmeCodeBlock,
          }}
        >
          {readme.text}
        </ReactMarkdown>
      </article>
    </div>
  );
}
