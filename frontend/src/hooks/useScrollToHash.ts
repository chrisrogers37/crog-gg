import { useEffect, useRef } from "react";

/**
 * Brings a link's #section into view once the page has rendered it. The
 * browser looks for the target when the page loads, before content that
 * waits on a fetch exists, so a shared link to a section would otherwise
 * open at the top.
 *
 * Once per mount: a part that reloads later (a retry) makes `ready` false and
 * true again, and by then the visitor has moved on. A fragment that isn't
 * valid percent-encoding (`#50%`) is looked up as it is, as the browser does,
 * rather than throwing.
 */
export function useScrollToHash(ready: boolean) {
  const done = useRef(false);
  useEffect(() => {
    if (!ready || done.current) return;
    done.current = true;
    const raw = window.location.hash.slice(1);
    let id = raw;
    try {
      id = decodeURIComponent(raw);
    } catch {
      // Not percent-encoding: the id is the fragment as written.
    }
    if (id) document.getElementById(id)?.scrollIntoView();
  }, [ready]);
}
