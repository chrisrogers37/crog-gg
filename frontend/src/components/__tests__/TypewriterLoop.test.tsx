import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import TypewriterLoop from "../TypewriterLoop";

beforeEach(() => {
  vi.useFakeTimers();
  // No jitter: the initial delay is exactly `initialDelay`.
  vi.spyOn(Math, "random").mockReturnValue(0);
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

/**
 * Moves time on in small steps, each in its own act(), so React applies each
 * phase change, and schedules the next phase's timers, before time moves on.
 */
const advance = (ms: number) => {
  for (let step = 0; step < ms; step += 50) {
    act(() => vi.advanceTimersByTime(50));
  }
};

/** What has been typed so far, without the cursor. */
const typed = (container: HTMLElement) =>
  (container.querySelector(".typewriter-text")?.textContent ?? "").replace(
    "|",
    "",
  );

describe("TypewriterLoop", () => {
  it("waits initialDelay before it starts typing (#193)", () => {
    const { container } = render(
      <TypewriterLoop messages={["hello"]} initialDelay={5000} typeSpeed={10} />,
    );

    advance(4900);
    expect(typed(container)).toBe("");

    advance(400);
    expect(typed(container)).not.toBe("");
  });

  it("shows the cursor from the start", () => {
    const { container } = render(
      <TypewriterLoop messages={["hello"]} initialDelay={1000} />,
    );
    expect(
      container.querySelector(".typewriter-text .typewriter-cursor"),
    ).toBeInTheDocument();
  });
});
