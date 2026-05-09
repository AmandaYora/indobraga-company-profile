import { createFileRoute } from "@tanstack/react-router";
import { LeadManager } from "@/components/admin/LeadManager";
import type { WhatsAppLead } from "@/lib/api-models";
import { adminLeadApi } from "@/lib/api-services";

export const Route = createFileRoute("/admin/whatsapp")({ component: WhatsAppAdminPage });

function WhatsAppAdminPage() {
  return (
    <LeadManager<WhatsAppLead>
      title="Prospek WhatsApp"
      description="Kelola prospek dari tombol WhatsApp publik."
      itemLabel="prospek WhatsApp"
      load={adminLeadApi.whatsappLeads}
      update={adminLeadApi.updateWhatsAppLead}
      archive={adminLeadApi.archiveWhatsAppLead}
      getContact={(lead) => lead.phone}
      getMessage={(lead) => lead.generated_message}
    />
  );
}
