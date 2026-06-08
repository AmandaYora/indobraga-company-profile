import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { LeadManager } from "@/components/admin/LeadManager";
import type { Inquiry } from "@/lib/api-models";
import { adminLeadApi } from "@/lib/api-services";
import { openWhatsAppLead } from "@/lib/lead-contact";

export const Route = createFileRoute("/admin/inquiries")({ component: InquiriesAdminPage });

function InquiriesAdminPage() {
  const navigate = useNavigate();

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
      sendActions={{
        email: (lead) =>
          void navigate({
            to: "/admin/email-blast",
            search: { tab: "single", email: lead.email, name: lead.name },
          }),
        whatsapp: (lead) => {
          if (!openWhatsAppLead(lead)) {
            toast.error("Nomor telepon tidak valid untuk WhatsApp.");
          }
        },
      }}
    />
  );
}
