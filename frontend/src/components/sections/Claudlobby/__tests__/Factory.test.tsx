import { describe, expect, it } from "vitest";
import { renderWithProviders, screen, within } from "../../../../test/utils";
import { Factory } from "../Factory";
import { ProofBar } from "../ProofBar";
import { claudlobby } from "../../../../content/claudlobby";
import { factoryStats } from "../../../../content/factory";
import { formatDay } from "../../../../utils/formatDate";

const { factory } = claudlobby;
const asOf = formatDay(factoryStats.asOf);

describe("Factory", () => {
  it("gives every app a card linking to its project page, the live app and its repo", () => {
    renderWithProviders(<Factory />);
    const cards = screen.getAllByRole("listitem");
    expect(cards).toHaveLength(factory.apps.length);

    factory.apps.forEach((app, index) => {
      const card = within(cards[index]);
      const stats = factoryStats.apps[app.slug];
      expect(card.getByRole("link", { name: app.name })).toHaveAttribute(
        "href",
        `/projects/${app.slug}`,
      );
      expect(card.getByRole("link", { name: factory.appLink })).toHaveAttribute(
        "href",
        app.url,
      );
      expect(card.getByRole("link", { name: factory.repoLink })).toHaveAttribute(
        "href",
        `https://github.com/${stats.repo}`,
      );
      expect(cards[index]).toHaveTextContent(
        stats.merged.value.toLocaleString("en-US"),
      );
    });
  });

  it("dates its numbers", () => {
    renderWithProviders(<Factory />);
    expect(screen.getByText(/As of/)).toHaveTextContent(asOf);
  });
});

describe("ProofBar", () => {
  it("shows the snapshot's numbers, dated, and never a star count", () => {
    renderWithProviders(<ProofBar />);
    const mergedLast30Days = factory.apps.reduce(
      (total, app) => total + factoryStats.apps[app.slug].mergedLast30Days.value,
      0,
    );
    expect(
      screen.getByText(mergedLast30Days.toLocaleString("en-US")),
    ).toBeInTheDocument();
    expect(screen.getByText(String(factory.apps.length))).toBeInTheDocument();
    expect(
      screen.getByText(`#${factoryStats.tracker.latestNumber}`),
    ).toBeInTheDocument();
    expect(screen.getByText(/As of/)).toHaveTextContent(asOf);
    expect(screen.queryByText(/star/i)).toBeNull();
  });
});
