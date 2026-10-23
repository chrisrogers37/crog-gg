import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { githubService } from "../../../../services/githubService";
import { GitHubReadme } from "../GitHubReadme";

describe("GitHubReadme", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each([
    [
      // What the contents API gives an empty README.
      "an empty README",
      {
        text: "  \n",
        htmlUrl: "https://github.com/chrisrogers37/example/blob/main/README.md",
        downloadUrl:
          "https://raw.githubusercontent.com/chrisrogers37/example/main/README.md",
      },
    ],
    ["a repo with none", null],
  ])("renders nothing for %s, and calls onMissing once", async (_, reply) => {
    vi.spyOn(githubService, "getReadme").mockResolvedValue(reply);
    const onMissing = vi.fn();

    const { container } = render(
      <GitHubReadme owner="someone" repoName="example" onMissing={onMissing} />,
    );

    // The loading stand-in goes, and nothing takes its place: no message, no link.
    await waitFor(() => expect(container).toBeEmptyDOMElement());
    expect(onMissing).toHaveBeenCalledTimes(1);
  });

  it("still shows 'Unable to load README' when the fetch fails, and doesn't call onMissing", async () => {
    vi.spyOn(githubService, "getReadme").mockRejectedValue(new Error("offline"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    const onMissing = vi.fn();

    render(<GitHubReadme owner="someone" repoName="example" onMissing={onMissing} />);

    expect(await screen.findByText("Unable to load README")).toBeInTheDocument();
    // The project's own owner, not one the component knows.
    expect(screen.getByRole("link", { name: /github/i })).toHaveAttribute(
      "href",
      "https://github.com/someone/example",
    );
    expect(onMissing).not.toHaveBeenCalled();
  });

  it("names a task list's checkboxes, and puts a table in a box that scrolls", async () => {
    vi.spyOn(githubService, "getReadme").mockResolvedValue({
      text: "- [x] shipped\n- [ ] planned\n\n| a | b |\n| --- | --- |\n| 1 | 2 |\n",
      htmlUrl: "https://github.com/someone/example/blob/main/README.md",
      downloadUrl: "https://raw.githubusercontent.com/someone/example/main/README.md",
    });

    render(<GitHubReadme owner="someone" repoName="example" />);

    expect(await screen.findByRole("checkbox", { name: /done/i })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: /to do/i })).not.toBeChecked();
    const table = screen.getByRole("table");
    // A box a keyboard can reach, since it may need scrolling sideways.
    expect(table.parentElement).toHaveClass("readme-table");
    expect(table.parentElement).toHaveAttribute("tabindex", "0");
  });
});
