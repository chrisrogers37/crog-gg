import { act, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RepoStats } from "../RepoStats";
import {
  githubService,
  type Repository,
} from "../../../../services/githubService";

const repo = (name: string, stars: number): Repository => ({
  name,
  full_name: `owner/${name}`,
  description: null,
  html_url: `https://github.com/owner/${name}`,
  homepage: null,
  stargazers_count: stars,
  forks_count: 1,
  watchers_count: 1,
  open_issues_count: 0,
  language: "TypeScript",
  topics: [],
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-09-01T00:00:00Z",
  pushed_at: "2026-09-01T00:00:00Z",
  license: null,
  default_branch: "main",
});

/** A promise the test resolves when it chooses. */
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("RepoStats when the repo changes (#196 M68)", () => {
  it("ignores the last repo's answer when it arrives after this one's", async () => {
    const first = deferred<Repository>();
    const second = deferred<Repository>();
    vi.spyOn(githubService, "getRepository").mockImplementation((_owner, name) =>
      name === "first" ? first.promise : second.promise,
    );

    const { rerender } = render(<RepoStats owner="owner" repoName="first" />);
    rerender(<RepoStats owner="owner" repoName="second" />);

    await act(async () => second.resolve(repo("second", 222)));
    expect(screen.getByText("222")).toBeInTheDocument();

    // The first repo's answer comes back last, and must not replace these.
    await act(async () => first.resolve(repo("first", 111)));
    expect(screen.getByText("222")).toBeInTheDocument();
    expect(screen.queryByText("111")).not.toBeInTheDocument();
  });

  it("drops the last repo's figures while the next one loads", async () => {
    const second = deferred<Repository>();
    vi.spyOn(githubService, "getRepository").mockImplementation((_owner, name) =>
      name === "first"
        ? Promise.resolve(repo("first", 111))
        : second.promise,
    );

    const { rerender, container } = render(<RepoStats owner="owner" repoName="first" />);
    expect(await screen.findByText("111")).toBeInTheDocument();

    rerender(<RepoStats owner="owner" repoName="second" />);
    expect(screen.queryByText("111")).not.toBeInTheDocument();
    expect(container.querySelector(".repo-stats.loading")).toBeInTheDocument();
  });
});

describe("RepoStats' topics", () => {
  it("lists the repo's topics, as the site's pills", async () => {
    vi.spyOn(githubService, "getRepository").mockResolvedValue({
      ...repo("tagged", 1),
      topics: ["agents", "tmux"],
    });
    render(<RepoStats owner="owner" repoName="tagged" />);

    const topics = await screen.findByRole("list", { name: "Topics" });
    expect(topics).toHaveClass("pills");
    expect(within(topics).getAllByRole("listitem").map((item) => item.textContent)).toEqual([
      "agents",
      "tmux",
    ]);
  });

  it("lists none when the repo has none", async () => {
    vi.spyOn(githubService, "getRepository").mockResolvedValue(repo("bare", 5));
    render(<RepoStats owner="owner" repoName="bare" />);
    expect(await screen.findByText("5")).toBeInTheDocument();
    expect(screen.queryByRole("list", { name: "Topics" })).toBeNull();
  });
});

describe("RepoStats while it loads", () => {
  it("lays out a whole panel, hidden, so the figures arriving don't move the page", () => {
    vi.spyOn(githubService, "getRepository").mockReturnValue(new Promise(() => {}));

    const { container } = render(<RepoStats owner="owner" repoName="repo" />);

    const loading = screen.getByRole("status", { name: /loading repository stats/i });
    // The loaded panel's own parts, so its height is the loaded one's...
    expect(loading.querySelector(".stats-grid .stat-item")).toBeInTheDocument();
    expect(loading.querySelector(".repo-meta")).toBeInTheDocument();
    // ...with nothing of the stand-in figures read out.
    expect(loading.firstElementChild).toHaveAttribute("aria-hidden", "true");
    expect(container.querySelectorAll(".repo-stats")).toHaveLength(1);
  });
});
