import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { githubService } from "../../../../services/githubService";
import { GitHubReadme } from "../GitHubReadme";

describe("GitHubReadme", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("says there's no README when the repo's README is empty", async () => {
    // What the contents API gives an empty README, or one over 1 MB.
    vi.spyOn(githubService, "getReadme").mockResolvedValue({
      text: "  \n",
      htmlUrl: "https://github.com/chrisrogers37/example/blob/main/README.md",
      downloadUrl:
        "https://raw.githubusercontent.com/chrisrogers37/example/main/README.md",
    });

    render(<GitHubReadme owner="someone" repoName="example" />);

    expect(await screen.findByText(/no readme available/i)).toBeInTheDocument();
    expect(screen.queryByRole("article")).not.toBeInTheDocument();
    // The project's own owner, not one the component knows.
    expect(screen.getByRole("link", { name: /github/i })).toHaveAttribute(
      "href",
      "https://github.com/someone/example",
    );
  });

  it("names a task list's checkboxes, and puts a table in a box that scrolls", async () => {
    vi.spyOn(githubService, "getReadme").mockResolvedValue({
      text: "- [x] shipped\n- [ ] planned\n\n| a | b |\n| --- | --- |\n| 1 | 2 |\n",
      htmlUrl: "https://github.com/someone/example/blob/main/README.md",
      downloadUrl: "https://raw.githubusercontent.com/someone/example/main/README.md",
    });

    render(<GitHubReadme owner="someone" repoName="example" />);

    expect(await screen.findByRole("checkbox", { name: "done" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "to do" })).not.toBeChecked();
    const table = screen.getByRole("table");
    // A box a keyboard can reach, since it may need scrolling sideways.
    expect(table.parentElement).toHaveClass("readme-table");
    expect(table.parentElement).toHaveAttribute("tabindex", "0");
  });
});
