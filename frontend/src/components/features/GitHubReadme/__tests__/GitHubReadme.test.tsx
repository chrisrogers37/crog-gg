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

    render(<GitHubReadme repoName="example" />);

    expect(await screen.findByText(/no readme available/i)).toBeInTheDocument();
    expect(screen.queryByRole("article")).not.toBeInTheDocument();
  });
});
