import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useContentStore } from "../store";
import { useContentLoader } from "./useContentLoader";

const INITIAL = useContentStore.getState();
afterEach(() => {
  useContentStore.setState(INITIAL, true);
});

describe("useContentLoader", () => {
  it("loads the content once, when the app mounts, and not again on a re-render", () => {
    const loadContent = vi.fn();
    useContentStore.setState({ loadContent });

    const { rerender } = renderHook(() => useContentLoader());
    rerender();
    rerender();

    expect(loadContent).toHaveBeenCalledOnce();
  });
});
