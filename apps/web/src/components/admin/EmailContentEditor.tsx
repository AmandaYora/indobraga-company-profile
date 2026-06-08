import { useState } from "react";
import { Code2, Eye, Pencil, Type } from "lucide-react";
import { TextArea } from "@/components/admin/CrudModal";
import type { ContentMode } from "@/routes/-admin.email-blast.helpers";

/**
 * Body editor with a plain-text / HTML toggle. HTML mode offers an inline
 * rendered preview so non-technical admins can check the layout. Variables
 * like {{nama}} stay usable in both modes and are replaced per recipient.
 */
export function EmailContentEditor({
  mode,
  bodyText,
  bodyHtml,
  onModeChange,
  onBodyTextChange,
  onBodyHtmlChange,
  variables,
}: {
  mode: ContentMode;
  bodyText: string;
  bodyHtml: string;
  onModeChange: (mode: ContentMode) => void;
  onBodyTextChange: (value: string) => void;
  onBodyHtmlChange: (value: string) => void;
  variables: readonly string[];
}) {
  const [htmlPreview, setHtmlPreview] = useState(false);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="inline-flex rounded-lg border border-border bg-secondary p-0.5">
          <ModeButton active={mode === "text"} onClick={() => onModeChange("text")}>
            <Type className="h-3.5 w-3.5" /> Teks
          </ModeButton>
          <ModeButton active={mode === "html"} onClick={() => onModeChange("html")}>
            <Code2 className="h-3.5 w-3.5" /> HTML
          </ModeButton>
        </div>
        {mode === "html" && (
          <button
            type="button"
            onClick={() => setHtmlPreview((value) => !value)}
            className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold text-primary transition hover:bg-primary-soft"
          >
            {htmlPreview ? (
              <>
                <Pencil className="h-3.5 w-3.5" /> Edit HTML
              </>
            ) : (
              <>
                <Eye className="h-3.5 w-3.5" /> Pratinjau
              </>
            )}
          </button>
        )}
      </div>

      {mode === "text" ? (
        <TextArea
          rows={8}
          value={bodyText}
          onChange={(event) => onBodyTextChange(event.target.value)}
          placeholder="Halo {{nama}}, terima kasih sudah menghubungi Indobraga..."
        />
      ) : htmlPreview ? (
        <div
          className="email-html-preview min-h-[12rem] overflow-auto rounded-lg border border-input bg-background p-4 text-sm"
          // Admin-authored email HTML rendered for preview only.
          dangerouslySetInnerHTML={{
            __html: bodyHtml.trim() || "<p style='color:#9ca3af'>Belum ada isi HTML.</p>",
          }}
        />
      ) : (
        <TextArea
          rows={12}
          value={bodyHtml}
          onChange={(event) => onBodyHtmlChange(event.target.value)}
          placeholder={"<p>Halo {{nama}},</p>\n<p>Terima kasih sudah menghubungi Indobraga.</p>"}
          className="font-mono text-xs"
        />
      )}

      {mode === "html" && !htmlPreview && (
        <p className="text-[11px] text-muted-foreground">
          Tulis HTML langsung. Variabel seperti {"{{nama}}"} tetap diganti otomatis per penerima.
        </p>
      )}

      <VariableHints variables={variables} />
    </div>
  );
}

function ModeButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-semibold transition ${
        active
          ? "bg-card text-primary-deep shadow-card"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

export function VariableHints({ variables }: { variables: readonly string[] }) {
  if (variables.length === 0) {
    return null;
  }

  return (
    <div className="text-anywhere flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
      <span className="font-semibold">Variabel tersedia:</span>
      {variables.map((key) => (
        <code key={key} className="rounded bg-secondary px-1.5 py-0.5 text-primary-deep">
          {`{{${key}}}`}
        </code>
      ))}
    </div>
  );
}
