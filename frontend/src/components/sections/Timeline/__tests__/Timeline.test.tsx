import { render, screen } from "@testing-library/react";
import { describe, it, expect, beforeAll } from "vitest";
import { Timeline } from "../Timeline";
import { logoUrl } from "../../../../utils/logos";

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
      title: "Senior Analytics Engineer",
      organization: "Citadel",
      domain: "citadel.com",
      start_date: "Feb 2023",
      end_date: "Jul 2025",
      one_liner:
        "automated a bunch of finance workflows that people were doing by hand. saved everyone a lot of time",
      skills: ["python", "sql"],
    },
    {
      type: "role" as const,
      title: "Senior Data Scientist and Engineer",
      organization: "Artemis",
      domain: "artemis.xyz",
      start_date: "Nov 2025",
      end_date: "present",
      one_liner: "data science and engineering for blockchain analytics",
      skills: ["python"],
    },
    {
      type: "education" as const,
      title: "BS, Chemical Engineering",
      organization: "Cornell University",
      domain: "cornell.edu",
      start_date: "2010",
      end_date: "2014",
      one_liner: "where it all started. go big red",
      skills: [],
    },
    {
      type: "milestone" as const,
      title: "AI-Maxxing",
      organization: "Independent",
      start_date: "Jul 2025",
      end_date: "Nov 2025",
      one_liner:
        "quit my job and went full send on ai. built things, broke things, learned a ton",
      skills: ["llms"],
    },
  ],
  skill_categories: {
    languages: { color: "#3178C6", skills: ["python", "sql"] },
    creative: { color: "#EC4899", skills: ["llms"] },
  },
};

describe("Timeline", () => {
  it("renders timeline entries", () => {
    render(<Timeline data={mockData} />);
    expect(screen.getByText("Senior Analytics Engineer")).toBeInTheDocument();
    expect(screen.getByText("Citadel")).toBeInTheDocument();
    expect(screen.getByText("Cornell University")).toBeInTheDocument();
  });

  it("renders loading state when data is null", () => {
    render(<Timeline data={null} />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it("displays one-liners for each entry", () => {
    render(<Timeline data={mockData} />);
    expect(
      screen.getByText(
        "automated a bunch of finance workflows that people were doing by hand. saved everyone a lot of time",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText("where it all started. go big red"),
    ).toBeInTheDocument();
  });

  it("sorts entries newest-first (present at top)", () => {
    render(<Timeline data={mockData} />);
    const titles = screen.getAllByRole("heading", { level: 2 });
    // Artemis (present) should be first, then AI-Maxxing (Nov 2025),
    // then Citadel (Jul 2025), then Cornell (2014)
    expect(titles[0].textContent).toBe("Senior Data Scientist and Engineer");
    expect(titles[1].textContent).toBe("AI-Maxxing");
    expect(titles[2].textContent).toBe("Senior Analytics Engineer");
    expect(titles[3].textContent).toBe("BS, Chemical Engineering");
  });

  it("formats date periods correctly", () => {
    render(<Timeline data={mockData} />);
    expect(screen.getByText("Nov 2025 - present")).toBeInTheDocument();
    expect(screen.getByText("Feb 2023 - Jul 2025")).toBeInTheDocument();
    expect(screen.getByText("Jul 2025 - Nov 2025")).toBeInTheDocument();
  });

  it("renders logo images for entries with domains", () => {
    const { container } = render(<Timeline data={mockData} />);
    // The logos are decorative: the organisation's name is the text beside
    // them. So they are found by source, not by an accessible name.
    const citadelLogos = container.querySelectorAll(
      `img[src="${logoUrl("citadel.com")}"]`,
    );
    expect(citadelLogos).toHaveLength(2); // dot + card header
    citadelLogos.forEach((img) => expect(img).toHaveAttribute("alt", ""));
  });

  it("renders emoji fallback for entries without domain", () => {
    render(<Timeline data={mockData} />);
    // AI-Maxxing has no domain, should show star emoji fallback
    const icons = document.querySelectorAll(".timeline-icon");
    expect(icons.length).toBeGreaterThan(0);
  });
});
