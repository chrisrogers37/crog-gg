import { useMemo, type ReactNode } from "react";
import { Link } from "react-router";
import site from "virtual:site-config";
import type { SectionId } from "../../config/schema";
import { useRegenerateOn, useRegeneration, useScrollToHash } from "../../hooks";
import {
  useBio,
  useContentStore,
  useLoad,
  useRegenerationError,
  useTimeline,
} from "../../store";
import { SEO } from "../../components/SEO";
import { HOME_META } from "../../seo";
import { AboutText } from "../../components/AboutText";
import { ActionButtons } from "../../components/ActionButtons";
import TypewriterLoop from "../../components/TypewriterLoop";
import { ErrorBoundary } from "../../components/common/ErrorBoundary";
import { ImageShowcase } from "../../components/common/ImageShowcase";
import { LoadError } from "../../components/common/LoadError";
import { PageSection } from "../../components/common/PageSection";
import { useSectionMenu } from "../../components/layout/MobileMenu/sectionMenu";
import {
  ContactCTA,
  CONTACT_ID,
  Music,
  Projects,
  Timeline,
} from "../../components/sections";
import { photoSrc, photoSrcSet } from "../../utils/photos";
import "./HomePage.css";

/** What the mobile menu jumps to: site.yaml's sections, then contact. */
const MENU_SECTIONS = [
  ...site.sections,
  { id: CONTACT_ID, label: site.contact.heading },
];

const scrollToSection = (id: string) =>
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

/**
 * HomePage: the owner's page, one column in the site's look (styles/page.css):
 * the hero, then site.yaml's sections in order (about, with SUMMON NEW LORE
 * under it; the journey; the projects; the music), the photo strip and the
 * contact links.
 */
export function HomePage() {
  // The head in every state, loading and failed included.
  return (
    <>
      <SEO {...HOME_META} />
      <HomeContent />
    </>
  );
}

function HomeContent() {
  // One of the hero photos, picked once per visit.
  const profilePhoto = useMemo(() => {
    const { photos } = site.hero;
    return photos[Math.floor(Math.random() * photos.length)];
  }, []);

  // The page waits on bio.yaml alone; the journey waits on timeline.yaml, and
  // says so in its own section when it fails (#190 M23).
  const bioLoad = useLoad("bio");
  const timelineLoad = useLoad("timeline");
  const bio = useBio();
  const timeline = useTimeline();
  const regenerationError = useRegenerationError();
  const loadContent = useContentStore((s) => s.loadContent);
  const reloadTimeline = useContentStore((s) => s.reloadTimeline);
  // SUMMON shows only where the deployment can serve it (#189 M21).
  const regenerateOn = useRegenerateOn();
  const { regenerate, reset, isRegenerating, hasModifiedContent } =
    useRegeneration();

  // Before the early returns, so the menu lists the sections while loading.
  useSectionMenu(MENU_SECTIONS, "", scrollToSection);

  // A link to a section (/#journey) lands on it once the sections exist.
  useScrollToHash(bioLoad === "ready");

  if (bioLoad === "loading" || !bio) {
    // A failed bio.yaml is fatal: there's no page without it.
    if (typeof bioLoad === "object") {
      return (
        <div className="page">
          <LoadError
            message={`This page didn't load: ${bioLoad.error}.`}
            onRetry={() => loadContent()}
          />
        </div>
      );
    }
    return <HomeSkeleton />;
  }

  // The tagline's first line is the headline; the rest reads under it.
  const [headline, ...rest] = (bio.tagline ?? "").trim().split("\n");

  // One renderer per section id site.yaml can name, so an id with no
  // component fails the type check rather than rendering nothing.
  const sectionContent: Record<SectionId, () => ReactNode> = {
    about: () => (
      <>
        <AboutText text={bio.about_text} />
        {regenerateOn && (
          <>
            <ActionButtons
              onRegenerate={() => regenerate(true)}
              onReset={reset}
              isRegenerating={isRegenerating}
              hasModifiedContent={hasModifiedContent}
            />
            {regenerationError && (
              <div className="regeneration-notice" role="status">
                {regenerationError}
              </div>
            )}
          </>
        )}
      </>
    ),
    journey: () =>
      typeof timelineLoad === "object" ? (
        <LoadError
          compact
          message={`The journey didn't load: ${timelineLoad.error}.`}
          onRetry={() => reloadTimeline()}
        />
      ) : (
        <Timeline data={timeline} />
      ),
    projects: () => <Projects />,
    music: () => <Music />,
  };

  return (
    <div className="page home-page">
      <section className="page-hero home-hero" aria-labelledby="home-heading">
        {/* src goes last: attributes are set in order, and Safari starts
            fetching src the moment it is set, before srcset can choose. */}
        <img
          alt={`${bio.display_name}'s profile photo`}
          className="home-photo"
          width={240}
          height={240}
          loading="eager"
          // .home-photo's widths, per breakpoint (HomePage.css).
          sizes="(max-width: 768px) 140px, 220px"
          srcSet={photoSrcSet(profilePhoto)}
          src={photoSrc(profilePhoto)}
        />
        <div>
          {headline ? (
            <>
              <p className="page-eyebrow">{bio.display_name}</p>
              <h1 id="home-heading" className="page-headline">
                {headline}
              </h1>
              {rest.length > 0 && <p className="page-sub">{rest.join(" ")}</p>}
            </>
          ) : (
            <h1 id="home-heading" className="page-headline">
              {bio.display_name}
            </h1>
          )}
          <p className="page-note home-typewriter">
            <TypewriterLoop
              messages={site.hero.typewriter}
              typeSpeed={25}
              deleteSpeed={15}
              pauseTime={2000}
              initialDelay={1000}
              className="welcome-typewriter"
            />
          </p>
          <div className="page-ctas">
            <Link to="/projects" className="btn btn-primary">
              Projects
            </Link>
            <a href={`#${CONTACT_ID}`} className="btn btn-ghost">
              Connect
            </a>
          </div>
        </div>
      </section>

      {site.sections.map(({ id, label }) => (
        <PageSection key={id} id={id} heading={label}>
          <ErrorBoundary compact>{sectionContent[id]()}</ErrorBoundary>
        </PageSection>
      ))}

      <ImageShowcase />
      <ContactCTA />
    </div>
  );
}

/** The hero's boxes while bio.yaml loads, so nothing moves when it lands. */
function HomeSkeleton() {
  return (
    <div className="page home-page" role="status" aria-label="Loading">
      <div className="page-hero home-hero" aria-hidden="true">
        <div className="home-photo home-skeleton" />
        <div>
          <div className="home-skeleton home-skeleton-line home-skeleton-eyebrow" />
          <div className="home-skeleton home-skeleton-line home-skeleton-headline" />
          <div className="home-skeleton home-skeleton-line" />
        </div>
      </div>
    </div>
  );
}
