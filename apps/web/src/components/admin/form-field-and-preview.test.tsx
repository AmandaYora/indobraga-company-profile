// @vitest-environment jsdom
import { act, useEffect } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Field, Select, TextArea, TextInput } from "@/components/admin/CrudModal";
import { EmailHtmlPreview } from "@/components/admin/EmailHtmlPreview";
import { collectNumericIds, useSessionUploads } from "@/hooks/use-session-uploads";

const remove = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api-services", () => ({
  adminMediaApi: { remove },
}));

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLElement;
let root: Root;

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  remove.mockReset();
  remove.mockResolvedValue({ id: 0, status: "permanently_deleted" });
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

describe("Field (QA IB-10 / IB-16)", () => {
  it("links the label to its control and exposes the error to assistive tech", async () => {
    await act(async () => {
      root.render(
        <Field label="Nama Klien" required error="Nama Klien wajib diisi." hint="Contoh: PT Maju">
          <TextInput />
        </Field>,
      );
    });

    const input = container.querySelector("input") as HTMLInputElement;
    const label = container.querySelector("label") as HTMLLabelElement;
    const alert = container.querySelector('[role="alert"]') as HTMLElement;

    expect(input.id).not.toBe("");
    expect(label.htmlFor).toBe(input.id);
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(input.getAttribute("aria-required")).toBe("true");
    expect(input.getAttribute("aria-describedby")).toContain(alert.id);
    expect(alert.textContent).toBe("Nama Klien wajib diisi.");
  });

  it("does not mark a valid control invalid and works for textarea and select too", async () => {
    await act(async () => {
      root.render(
        <>
          <Field label="Deskripsi">
            <TextArea />
          </Field>
          <Field label="Kategori" error="Pilih kategori.">
            <Select>
              <option value="">Pilih</option>
            </Select>
          </Field>
        </>,
      );
    });

    const textarea = container.querySelector("textarea") as HTMLTextAreaElement;
    const select = container.querySelector("select") as HTMLSelectElement;

    expect(textarea.getAttribute("aria-invalid")).toBeNull();
    expect((container.querySelectorAll("label")[0] as HTMLLabelElement).htmlFor).toBe(textarea.id);
    expect(select.getAttribute("aria-invalid")).toBe("true");
  });
});

describe("EmailHtmlPreview (QA IB-02)", () => {
  it("renders hostile HTML in a script-less sandboxed iframe and never into the page", async () => {
    await act(async () => {
      root.render(<EmailHtmlPreview html="<p>Halo</p><img src=x onerror=window.__qaXss=1>" />);
    });

    const frame = container.querySelector("iframe") as HTMLIFrameElement;

    // An empty sandbox attribute = no scripts, no same-origin access, no forms, no popups.
    expect(frame.getAttribute("sandbox")).toBe("");
    expect(frame.getAttribute("srcdoc")).toContain("Content-Security-Policy");
    expect(frame.getAttribute("srcdoc")).toContain("default-src 'none'");
    // The payload only exists inside the iframe document string, not as live host DOM.
    expect(container.querySelector("img")).toBeNull();
    expect((window as unknown as { __qaXss?: number }).__qaXss).toBeUndefined();
  });

  it("shows a placeholder for empty HTML", async () => {
    await act(async () => {
      root.render(<EmailHtmlPreview html="   " />);
    });

    expect(container.querySelector("iframe")?.getAttribute("srcdoc")).toContain(
      "Belum ada isi HTML",
    );
  });
});

describe("useSessionUploads (QA IB-09)", () => {
  type Handle = ReturnType<typeof useSessionUploads>;

  async function mountHook() {
    const handle: { current: Handle | null } = { current: null };
    function Harness() {
      const uploads = useSessionUploads();
      useEffect(() => {
        handle.current = uploads;
      });
      return null;
    }
    await act(async () => {
      root.render(<Harness />);
    });
    return handle as { current: Handle };
  }

  it("deletes every tracked upload when the form is cancelled", async () => {
    const hook = await mountHook();

    hook.current.track(11);
    hook.current.track(12);
    hook.current.track(undefined);
    await act(async () => {
      await hook.current.discard();
    });

    expect(remove.mock.calls.map((call) => call[0]).sort()).toEqual([11, 12]);

    remove.mockClear();
    await act(async () => {
      await hook.current.discard();
    });
    expect(remove).not.toHaveBeenCalled();
  });

  it("keeps uploads that were saved and removes the replaced ones", async () => {
    const hook = await mountHook();

    hook.current.track(21);
    hook.current.track(22);
    await act(async () => {
      await hook.current.discard([22]);
    });

    expect(remove).toHaveBeenCalledTimes(1);
    expect(remove).toHaveBeenCalledWith(21);
  });

  it("never throws when a delete fails and does not delete forgotten uploads", async () => {
    const hook = await mountHook();
    remove.mockRejectedValue(new Error("masih dipakai"));

    hook.current.track(31);
    await act(async () => {
      await expect(hook.current.discard()).resolves.toBeUndefined();
    });

    hook.current.track(32);
    hook.current.reset();
    remove.mockClear();
    await act(async () => {
      await hook.current.discard();
    });
    expect(remove).not.toHaveBeenCalled();
  });

  it("collects numeric ids (including arrays) from a saved payload", () => {
    expect(
      collectNumericIds({ name: "x", media_file_id: 5, media_file_ids: [6, 7], tags: ["a"] }),
    ).toEqual([5, 6, 7]);
  });
});
