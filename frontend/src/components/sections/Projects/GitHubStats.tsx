import './GitHubStats.css';

// A mapping of language names to colors for consistent styling
const LANGUAGE_COLORS: { [key: string]: string } = {
  TypeScript: '#3178C6',
  JavaScript: '#F7DF1E',
  Python: '#3572A5',
  HTML: '#E34F26',
  CSS: '#1572B6',
  'Jupyter Notebook': '#DA5B0B',
  Shell: '#89E051',
  SCSS: '#C6538C',
  Dockerfile: '#384d54',
  Other: '#CCCCCC',
};

interface Language {
  name: string;
  bytes: number;
}

interface GitHubStatsProps {
  languages: Language[];
  isLoading: boolean;
  error: string | null;
}

/**
 * GitHubStats
 *
 * Displays GitHub language statistics as a horizontal bar chart.
 */
export function GitHubStats({ languages, isLoading, error }: GitHubStatsProps) {
  if (isLoading) {
    return (
      <div className="github-stats-container">
        <div className="loading-message">Summoning language stats from GitHub...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="github-stats-container">
        <div className="error-message">Error: {error}</div>
      </div>
    );
  }

  if (!languages || languages.length === 0) {
    return null;
  }

  const totalBytes = languages.reduce((sum, lang) => sum + lang.bytes, 0);

  return (
    <div className="github-stats-container">
      <h4 className="stats-header">GitHub Language Stats</h4>
      <p className="skills-subtitle">
        A dynamic overview of languages from my public repositories, sized by bytes of code.
      </p>
      <div className="skills-bar-chart">
        {languages.map((lang, index) => {
          const percentage = totalBytes > 0 ? (lang.bytes / totalBytes) * 100 : 0;
          const barColor = LANGUAGE_COLORS[lang.name] || LANGUAGE_COLORS['Other'];

          return (
            <div key={index} className="skill-bar-wrapper">
              <div className="skill-bar-label">
                <span>{lang.name}</span>
                <span>{percentage.toFixed(2)}%</span>
              </div>
              <div className="skill-bar">
                <div
                  className="skill-bar-fill"
                  style={{ width: `${percentage}%`, backgroundColor: barColor }}
                  title={`${lang.bytes.toLocaleString()} bytes`}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
