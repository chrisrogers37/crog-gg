import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RepoStats, STAR_THRESHOLD } from "../RepoStats";
import {
  githubService,
  type Repository,
} from "../../../../services/githubService";

vi.mock("../../../../services/githubService", () => ({
  githubService: { getRepository: vi.fn() },
}));

const repo = (name: string, stars: number): Repository => ({
  name,
  full_name: `owner/${name}`,
  description: null,
  html_url: `https://github.com/owner/${name}`,
  homepage: null,
  stargazers_count: stars,
  forks_count: 3,
  // Not `stars`: a figure that shows twice can't be found by its text.
  watchers_count: 1,
  open_issues_count: 303,
  language: "Python",
  topics: [],
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-09-29T00:00:00Z",
  pushed_at: "2026-09-29T00:00:00Z",
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
  vi.mocked(githubService.getRepository).mockReset();
});

describe("RepoStats", () => {
  it("leaves out star counts below the threshold, shows merged PRs instead, and never open issues", async () => {
    vi.mocked(githubService.getRepository).mockResolvedValue(
      repo("storydump", 1),
    );
    render(<RepoStats repoName="storydump" />);

    expect(await screen.findByText("PRs merged")).toBeInTheDocument();
    expect(screen.getByText(/as of/)).toBeInTheDocument();
    for (const hidden of ["Stars", "Forks", "Watchers", "Issues"]) {
      expect(screen.queryByText(hidden)).toBeNull();
    }
  });

  it("keeps the snapshot's counts when GitHub's API fails or rate-limits", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(githubService.getRepository).mockRejectedValue(
      new Error("403 rate limited"),
    );
    render(<RepoStats repoName="storydump" />);

    expect(await screen.findByText("PRs merged")).toBeInTheDocument();
    // Only the live figures go: stars and the meta row.
    expect(screen.queryByText("Stars")).toBeNull();
    expect(screen.queryByText(/updated/i)).toBeNull();
  });

  it("shows star counts once there are enough of them", async () => {
    vi.mocked(githubService.getRepository).mockResolvedValue(
      repo("some-other-repo", STAR_THRESHOLD),
    );
    // A repo the snapshot doesn't cover, so only GitHub's own numbers remain.
    render(<RepoStats repoName="some-other-repo" />);

    expect(await screen.findByText("Stars")).toBeInTheDocument();
    expect(screen.queryByText("PRs merged")).toBeNull();
    expect(screen.queryByText("Issues")).toBeNull();
  });
});

describe("RepoStats when the repo changes (#196 M68)", () => {
  it("ignores the last repo's answer when it arrives after this one's", async () => {
    const first = deferred<Repository>();
    const second = deferred<Repository>();
    vi.mocked(githubService.getRepository).mockImplementation((name) =>
      name === "first" ? first.promise : second.promise,
    );

    const { rerender } = render(<RepoStats repoName="first" />);
    rerender(<RepoStats repoName="second" />);

    await act(async () => second.resolve(repo("second", 222)));
    expect(screen.getByText("222")).toBeInTheDocument();

    // The first repo's answer comes back last, and must not replace these.
    await act(async () => first.resolve(repo("first", 111)));
    expect(screen.getByText("222")).toBeInTheDocument();
    expect(screen.queryByText("111")).not.toBeInTheDocument();
  });

  it("drops the last repo's figures while the next one loads", async () => {
    const second = deferred<Repository>();
    vi.mocked(githubService.getRepository).mockImplementation((name) =>
      name === "first"
        ? Promise.resolve(repo("first", 111))
        : second.promise,
    );

    const { rerender, container } = render(<RepoStats repoName="first" />);
    expect(await screen.findByText("111")).toBeInTheDocument();

    rerender(<RepoStats repoName="second" />);
    expect(screen.queryByText("111")).not.toBeInTheDocument();
    expect(container.querySelector(".repo-stats.loading")).toBeInTheDocument();
  });
});
