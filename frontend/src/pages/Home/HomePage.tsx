import { SEO } from "../../components/SEO";
import { HOME_META } from "../../seo/site";
import {
  DarkFactory,
  Hero,
  Quickstart,
  WhyClaudlobby,
} from "../../components/sections/Claudlobby";
import "../../components/sections/Claudlobby/Claudlobby.css";

/**
 * HomePage Component
 *
 * crog.gg's front door for Claudlobby (#173). The copy is bundled
 * (content/claudlobby.ts), so the hero renders without waiting on the content
 * fetch. The personal page it replaced is now /about.
 */
export function HomePage() {
  return (
    <>
      <SEO {...HOME_META} />
      <div className="cl-home">
        <Hero />
        <DarkFactory />
        <WhyClaudlobby />
        <Quickstart />
      </div>
    </>
  );
}
