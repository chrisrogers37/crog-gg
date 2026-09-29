import { useEffect, useState } from "react";
import { claudlobby } from "../../../content/claudlobby";
import {
  CLAUDLOBBY_GETTING_STARTED,
  CLAUDLOBBY_README_QUICKSTART,
} from "../../../content/links";
import { InlineCode } from "./InlineCode";
import { Section } from "./Section";

type CopyState = "idle" | "copied" | "failed";

const LABEL: Record<CopyState, string> = {
  idle: "Copy",
  copied: "Copied",
  failed: "Copy failed",
};

const ANNOUNCEMENT: Record<CopyState, string> = {
  idle: "",
  copied: "Commands copied to the clipboard",
  failed: "Couldn't copy. Select the commands and copy them instead.",
};

function CopyButton({ text }: { text: string }) {
  const [state, setState] = useState<CopyState>("idle");

  useEffect(() => {
    if (state === "idle") return;
    const timer = setTimeout(() => setState("idle"), 2000);
    return () => clearTimeout(timer);
  }, [state]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setState("copied");
    } catch {
      // No clipboard access (permissions, or an insecure context). The
      // commands are still selectable, and the announcement says so.
      setState("failed");
    }
  };

  return (
    <>
      <button type="button" className="cl-copy" onClick={copy}>
        {LABEL[state]}
      </button>
      <span className="sr-only" aria-live="polite">
        {ANNOUNCEMENT[state]}
      </span>
    </>
  );
}

/**
 * The README's guided setup, with its real prerequisites stated up front.
 * The hero's Quickstart button jumps here.
 */
export function Quickstart() {
  const { quickstart } = claudlobby;
  return (
    <Section
      id="quickstart"
      heading={quickstart.heading}
      intro={quickstart.intro}
    >
      <div className="cl-quickstart">
        <div>
          <h3>{quickstart.prerequisitesHeading}</h3>
          <ul className="cl-prereqs">
            {quickstart.prerequisites.map((item) => (
              <li key={item}>
                <InlineCode text={item} />
              </li>
            ))}
          </ul>
        </div>
        <div>
          <div className="cl-code">
            {/* Focusable, so a keyboard can scroll a line that overflows. */}
            <pre tabIndex={0}>
              <code>{quickstart.commands}</code>
            </pre>
            <CopyButton text={quickstart.commands} />
          </div>
          <p className="cl-after">
            <InlineCode text={quickstart.after} />
          </p>
        </div>
      </div>
      <p className="cl-links">
        <a
          href={CLAUDLOBBY_GETTING_STARTED}
          target="_blank"
          rel="noopener noreferrer"
        >
          {quickstart.docsLink}
        </a>
        <a
          href={CLAUDLOBBY_README_QUICKSTART}
          target="_blank"
          rel="noopener noreferrer"
        >
          {quickstart.readmeLink}
        </a>
      </p>
    </Section>
  );
}
