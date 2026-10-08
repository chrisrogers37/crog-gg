import { useEffect, useRef } from "react";

/** Native modal dialogs provide focus containment and make the page inert.
 * Inline demos remain the same DOM node when expanded, preserving iframe state.
 */
export function useModalDialog(isModal: boolean, inline = false) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (!isModal) {
      if (inline) dialog.setAttribute("open", "");
      return;
    }

    const opener = document.activeElement;
    const overflow = document.body.style.overflow;
    // An inline, non-modal dialog must close before entering the top layer.
    if (dialog.open) dialog.close();
    dialog.showModal();
    dialog.querySelector<HTMLElement>("[data-modal-focus]")?.focus({ preventScroll: true });
    document.body.style.overflow = "hidden";

    // Native inertness keeps focus off the page. Wrap at the controls too,
    // rather than sending Tab/Shift+Tab to the browser chrome at either edge.
    const wrapFocus = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const controls = [...dialog.querySelectorAll<HTMLElement>(
        'a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), iframe, [tabindex]:not([tabindex="-1"])',
      )].filter((element) => element.getClientRects().length > 0);
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    dialog.addEventListener("keydown", wrapFocus);

    return () => {
      dialog.removeEventListener("keydown", wrapFocus);
      dialog.close();
      document.body.style.overflow = overflow;
      if (inline) dialog.setAttribute("open", "");
      if (opener instanceof HTMLElement && opener.isConnected) {
        opener.focus({ preventScroll: true });
      }
    };
  }, [isModal, inline]);

  return ref;
}
