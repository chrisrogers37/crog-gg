import { act, render, screen } from "@testing-library/react";
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
