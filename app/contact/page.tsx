import { supabaseServer } from "@/lib/supabase-server";
import { StoreSettings } from "@/lib/types";
import { getWhatsAppLink } from "@/lib/whatsapp";
import { MessageCircle, Mail, Phone, MapPin } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Contact Us — NOVAHAUS" };
export const revalidate = 60;

export default async function ContactPage() {
  const supabase = supabaseServer();
  const { data: settings } = await supabase.from("store_settings").select("*").single();
  const s = settings as StoreSettings | null;
  const waLink = getWhatsAppLink(s?.whatsapp_number || "2347041629846", "Hello NOVAHAUS 👋 I have a question.");

  return (
    <div className="container-nova py-16 max-w-xl">
      <h1 className="font-serif text-3xl mb-4">Contact NOVAHAUS</h1>
      <p className="text-black/60 mb-10">We reply fastest on WhatsApp — reach out any time.</p>

      <div className="space-y-6">
        <a href={waLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm hover:text-nova-gold">
          <MessageCircle className="w-5 h-5" /> Chat on WhatsApp
        </a>
        <div className="flex items-center gap-3 text-sm">
          <Phone className="w-5 h-5" /> {s?.support_phone || "Contact us on WhatsApp"}
        </div>
        <div className="flex items-center gap-3 text-sm">
          <Mail className="w-5 h-5" /> {s?.support_email || "support@novahaus.store"}
        </div>
        <div className="flex items-center gap-3 text-sm">
          <MapPin className="w-5 h-5" /> {s?.store_address || "Nigeria"}
        </div>
      </div>
    </div>
  );
}
