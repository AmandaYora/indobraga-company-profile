import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Edit2, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ErrorState, LoadingState } from "@/components/admin/ApiState";
import { ConfirmDialog, CrudModal, Field, TextInput } from "@/components/admin/CrudModal";
import { EmailContentEditor } from "@/components/admin/EmailContentEditor";
import { EmptyState, TablePagination } from "@/components/admin/Pagination";
import { ActionButtonGroup, Card, IconActionButton, PageTitle } from "@/components/admin/ui";
import { getErrorMessage, useApiQuery } from "@/hooks/use-api-query";
import type { EmailTemplate } from "@/lib/api-models";
import { adminEmailTemplateApi } from "@/lib/api-services";
import { formatDateId } from "@/lib/date";
import { validateBody, type ContentMode } from "./-admin.email-blast.helpers";

export const Route = createFileRoute("/admin/email-templates")({ component: EmailTemplatesPage });

type TemplateForm = {
  name: string;
  subject: string;
  content_mode: ContentMode;
  body_text: string;
  body_html: string;
};

const EMPTY_FORM: TemplateForm = {
  name: "",
  subject: "",
  content_mode: "text",
  body_text: "",
  body_html: "",
};

function EmailTemplatesPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<EmailTemplate | null>(null);
  const [target, setTarget] = useState<EmailTemplate | null>(null);
  const [form, setForm] = useState<TemplateForm>(EMPTY_FORM);

  const loadTemplates = useCallback(
    () => adminEmailTemplateApi.list({ page, limit: pageSize, q: query }),
    [page, pageSize, query],
  );
  const templates = useApiQuery(["admin", "email-templates", page, pageSize, query], loadTemplates);
  const list = templates.data?.items ?? [];
  const pagination = templates.data?.pagination;
  const start =
    pagination && pagination.total > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0;
  const end = pagination ? Math.min(pagination.page * pagination.limit, pagination.total) : 0;

  useEffect(() => {
    setPage(1);
  }, [pageSize, query]);

  const updateForm = (patch: Partial<TemplateForm>) =>
    setForm((current) => ({ ...current, ...patch }));

  const openEdit = (template: EmailTemplate) => {
    setForm({
      name: template.name,
      subject: template.subject,
      content_mode: template.content_mode,
      body_text: template.body_text ?? "",
      body_html: template.body_html ?? "",
    });
    setEditing(template);
  };

  const submitEdit = async () => {
    if (!editing) {
      return;
    }
    if (!form.name.trim()) {
      toast.error("Nama template wajib diisi");
      return;
    }
    const validationError = validateBody(form);
    if (validationError) {
      toast.error(validationError.title, { description: validationError.description });
      return;
    }

    try {
      await adminEmailTemplateApi.update(editing.id, {
        name: form.name.trim(),
        subject: form.subject.trim(),
        content_mode: form.content_mode,
        body_text: form.content_mode === "text" ? form.body_text.trim() : undefined,
        body_html: form.content_mode === "html" ? form.body_html.trim() : undefined,
      });
      toast.success("Template diperbarui");
      setEditing(null);
      templates.reload();
    } catch (error) {
      toast.error("Template gagal diperbarui", {
        description: getErrorMessage(error, { action: "save" }),
      });
    }
  };

  const confirmDelete = async () => {
    if (!target) {
      return;
    }

    try {
      await adminEmailTemplateApi.remove(target.id);
      toast.success("Template dihapus");
      setTarget(null);
      templates.reload();
    } catch (error) {
      toast.error("Template gagal dihapus", {
        description: getErrorMessage(error, { action: "delete" }),
      });
    }
  };

  return (
    <>
      <PageTitle
        title="Kelola Template"
        desc="Template email yang Anda simpan dari halaman Kirim Email. Di sini Anda bisa menyunting atau menghapusnya."
      />

      <Card className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative min-w-0 flex-1 basis-full sm:basis-auto">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari nama atau subjek template..."
            className="w-full rounded-full border border-border bg-secondary py-2 pl-10 pr-4 text-sm outline-none focus:border-primary"
          />
        </div>
      </Card>

      {templates.loading && !templates.data && <LoadingState label="Memuat template..." />}
      {templates.error && <ErrorState error={templates.error} onRetry={templates.reload} />}

      <div className="grid gap-4 lg:hidden">
        {list.length === 0 && !templates.loading && (
          <Card>
            <EmptyState
              title="Belum ada template"
              description='Simpan template lewat "Simpan sebagai Template" di halaman Kirim Email.'
            />
          </Card>
        )}
        {list.map((template) => (
          <Card key={template.id}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-anywhere font-semibold">{template.name}</p>
                <p className="text-anywhere text-xs text-muted-foreground">{template.subject}</p>
              </div>
              <ModeBadge mode={template.content_mode} />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Diperbarui {formatDateId(template.updated_at, "short")}
            </p>
            <TemplateActions
              template={template}
              onEdit={() => openEdit(template)}
              onDelete={() => setTarget(template)}
            />
          </Card>
        ))}
      </div>

      <Card className="hidden overflow-hidden p-0 lg:block">
        <table className="w-full text-sm">
          <thead className="bg-secondary text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="p-4 text-left">Nama Template</th>
              <th className="p-4 text-left">Subjek</th>
              <th className="p-4 text-left">Format</th>
              <th className="p-4 text-left">Diperbarui</th>
              <th className="p-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {list.map((template) => (
              <tr key={template.id} className="hover:bg-secondary/40">
                <td className="p-4 font-semibold">{template.name}</td>
                <td className="max-w-md p-4">
                  <p className="line-clamp-2 text-muted-foreground">{template.subject}</p>
                </td>
                <td className="p-4">
                  <ModeBadge mode={template.content_mode} />
                </td>
                <td className="p-4 text-muted-foreground">
                  {formatDateId(template.updated_at, "short")}
                </td>
                <td className="p-4 text-right">
                  <TemplateActions
                    template={template}
                    onEdit={() => openEdit(template)}
                    onDelete={() => setTarget(template)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {list.length === 0 && !templates.loading && (
          <EmptyState
            title="Belum ada template"
            description='Simpan template lewat "Simpan sebagai Template" di halaman Kirim Email.'
          />
        )}
      </Card>

      {pagination && (
        <div className="mt-3">
          <TablePagination
            page={pagination.page}
            pageCount={pagination.total_pages}
            pageSize={pagination.limit}
            total={pagination.total}
            start={start}
            end={end}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            itemLabel="template"
            className="rounded-xl border bg-card"
          />
        </div>
      )}

      <CrudModal
        open={Boolean(editing)}
        onOpenChange={(open) => !open && setEditing(null)}
        title={editing ? `Sunting "${editing.name}"` : "Sunting Template"}
        description="Variabel {{nama}}, {{email}}, dan kolom lain dari Excel diganti otomatis saat email dikirim."
        size="lg"
        onSubmit={submitEdit}
      >
        <Field label="Nama Template" required>
          <TextInput
            value={form.name}
            onChange={(event) => updateForm({ name: event.target.value })}
            placeholder="Mis. Follow-up Pesan Kontak"
          />
        </Field>
        <Field label="Subjek Email" required>
          <TextInput
            value={form.subject}
            onChange={(event) => updateForm({ subject: event.target.value })}
            placeholder="Tulis subjek email..."
          />
        </Field>
        <Field label="Isi Email" required>
          <EmailContentEditor
            mode={form.content_mode}
            bodyText={form.body_text}
            bodyHtml={form.body_html}
            onModeChange={(mode) => updateForm({ content_mode: mode })}
            onBodyTextChange={(value) => updateForm({ body_text: value })}
            onBodyHtmlChange={(value) => updateForm({ body_html: value })}
            variables={["nama", "email"]}
          />
        </Field>
      </CrudModal>

      <ConfirmDialog
        open={Boolean(target)}
        onOpenChange={(open) => !open && setTarget(null)}
        title={target ? `Hapus template "${target.name}"?` : "Hapus template?"}
        description="Template akan dihapus permanen. Email yang sudah dikirim tidak terpengaruh."
        confirmLabel="Hapus"
        onConfirm={confirmDelete}
      />
    </>
  );
}

function ModeBadge({ mode }: { mode: ContentMode }) {
  const isHtml = mode === "html";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        isHtml ? "bg-accent/20 text-accent-foreground" : "bg-secondary text-muted-foreground"
      }`}
    >
      {isHtml ? "HTML" : "Teks"}
    </span>
  );
}

function TemplateActions({
  template,
  onEdit,
  onDelete,
}: {
  template: EmailTemplate;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <ActionButtonGroup className="mt-3 justify-start lg:mt-0 lg:justify-end">
      <IconActionButton
        label={`Sunting template ${template.name}`}
        tooltip="Sunting"
        onClick={onEdit}
        icon={<Edit2 className="h-4 w-4" />}
      />
      <IconActionButton
        label={`Hapus template ${template.name}`}
        tooltip="Hapus"
        onClick={onDelete}
        icon={<Trash2 className="h-4 w-4" />}
        tone="danger"
      />
    </ActionButtonGroup>
  );
}
