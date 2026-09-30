import { Link } from "react-router-dom";
import { claudlobby } from "../../../content/claudlobby";
import { factoryStats } from "../../../content/factory";
import { formatDay, formatMonth } from "../../../utils/formatDate";
import { RepoLink } from "../../common/RepoLink";
import { Section } from "./Section";

const { factory } = claudlobby;

/**
 * The apps the fleet has been building, each with numbers from the dated
 * GitHub snapshot in content/factory-stats.json (#176).
 */
export function Factory() {
  return (
    <Section id="factory" heading={factory.heading} intro={factory.intro}>
      <ul className="cl-apps">
        {factory.apps.map((app) => {
          const stats = factoryStats.apps[app.slug];
          return (
            <li key={app.slug} className="card cl-app">
              <h3>
                <Link to={`/projects/${app.slug}`}>{app.name}</Link>
              </h3>
              <p>{app.summary}</p>
              {stats.since && (
                <p className="cl-app-count">
                  <strong>{stats.merged.value.toLocaleString("en-US")}</strong>{" "}
                  {factory.merged} {formatMonth(stats.since)}
                  {stats.mergedLast30Days.value > 0 &&
                    `, ${stats.mergedLast30Days.value.toLocaleString("en-US")} ${factory.recent}`}
                </p>
              )}
              <p className="cl-app-links">
                <a href={app.url} target="_blank" rel="noopener noreferrer">
                  {factory.appLink}
                </a>
                <a
                  href={`https://github.com/${stats.repo}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {factory.repoLink}
                </a>
              </p>
            </li>
          );
        })}
      </ul>
      <p className="cl-source">
        {factory.source} As of {formatDay(factoryStats.asOf)}.{" "}
        <RepoLink location="factory">{factory.claudlobbyLink}</RepoLink>
      </p>
    </Section>
  );
}
