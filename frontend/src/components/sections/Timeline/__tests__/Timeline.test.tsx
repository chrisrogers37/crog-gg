import { render, screen } from "@testing-library/react";
import { describe, it, expect, beforeAll } from "vitest";
import { Timeline } from "../Timeline";

// framer-motion's whileInView requires IntersectionObserver to be a real class
beforeAll(() => {
  window.IntersectionObserver = class IntersectionObserver {
    readonly root: Element | null = null;
    readonly rootMargin: string = "";
    readonly thresholds: ReadonlyArray<number> = [];
    constructor(
      _callback: IntersectionObserverCallback,
      _options?: IntersectionObserverInit,
    ) {}
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }
  };
});

const mockData = {
  entries: [
    {
      type: "role" as const,
      title: "Data Engineer",
      organization: "Citadel",
      start_date: "2023",
      end_date: "present",
      one_liner: "building data pipelines",
      skills: ["python", "sql"],
    },
    {
      type: "education" as const,
      title: "BS, Engineering",
      organization: "Cornell",
      start_date: "2010",
      end_date: "2014",
      one_liner: "engineering fundamentals",
      skills: [],
    },
  ],
  skill_categories: {
    languages: { color: "#3178C6", skills: ["python", "sql"] },
  },
};

describe("Timeline", () => {
  it("renders timeline entries", () => {
    render(<Timeline data={mockData} />);
    expect(screen.getByText("Data Engineer")).toBeInTheDocument();
    expect(screen.getByText("Citadel")).toBeInTheDocument();
    expect(screen.getByText("Cornell")).toBeInTheDocument();
  });

  it("renders loading state when data is null", () => {
    render(<Timeline data={null} />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it("displays one-liners for each entry", () => {
    render(<Timeline data={mockData} />);
    expect(screen.getByText("building data pipelines")).toBeInTheDocument();
  });
});
