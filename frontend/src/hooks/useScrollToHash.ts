import { useEffect } from "react";

/**
 * Brings a link's #section into view once the page has rendered it. The
 * browser looks for the target when the page loads, before content that
 * waits on a fetch exists, so a shared link to a section would otherwise
 * open at the top.
 */
export function useScrollToHash(ready: boolean) {
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (ready && id) document.getElementById(id)?.scrollIntoView();
  }, [ready]);
}
