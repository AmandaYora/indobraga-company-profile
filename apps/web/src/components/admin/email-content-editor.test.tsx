// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EmailContentEditor } from "@/components/admin/EmailContentEditor";

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

describe("EmailContentEditor variable insertion", () => {
  let container: HTMLElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.clearAllMocks();
  });

  it("inserts a clicked variable into the text body", async () => {
    const onBodyTextChange = vi.fn();
    await act(async () => {
      root.render(
        <EmailContentEditor
          mode="text"
          bodyText="Halo "
          bodyHtml=""
          onModeChange={vi.fn()}
          onBodyTextChange={onBodyTextChange}
          onBodyHtmlChange={vi.fn()}
          variables={["nama", "email"]}
        />,
      );
    });

    const chip = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent === "{{nama}}",
    );
    expect(chip).toBeDefined();

    await act(async () => {
      chip!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(onBodyTextChange).toHaveBeenCalledWith(expect.stringContaining("{{nama}}"));
  });
});
