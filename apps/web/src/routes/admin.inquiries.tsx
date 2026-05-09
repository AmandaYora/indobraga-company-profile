import { createFileRoute } from "@tanstack/react-router";
import { LeadManager } from "@/components/admin/LeadManager";
import type { Inquiry } from "@/lib/api-models";
import { adminLeadApi } from "@/lib/api-services";

export const Route = createFileRoute("/admin/inquiries")({ component: InquiriesAdminPage });

function InquiriesAdminPage() {
  return (
    <LeadManager<Inquiry>
      title="Pesan Kontak"
      description="Kelola pesan dari form kontak publik."
      itemLabel="pesan kontak"
      load={adminLeadApi.inquiries}
      update={adminLeadApi.updateInquiry}
      archive={adminLeadApi.archiveInquiry}
      getContact={(lead) => (
        <>
          {lead.email} - {lead.phone}
          {lead.company ? ` - ${lead.company}` : ""}
        </>
      )}
      getMessage={(lead) => lead.message}
    />
  );
}
