"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { DeliveryFee } from "@/lib/types";
import { Plus, Trash2 } from "lucide-react";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<any>(null);
  const [deliveryFees, setDeliveryFees] = useState<DeliveryFee[]>([]);
  const [newState, setNewState] = useState("");
  const [newFee, setNewFee] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function load() {
    const supabase = supabaseBrowser();
    const [{ data: s }, { data: fees }] = await Promise.all([
      supabase.from("store_settings").select("*").single(),
      supabase.from("delivery_fees").select("*").order("state"),
    ]);
    setSettings(s);
    setDeliveryFees(fees || []);
  }

  useEffect(() => {
    load();
  }, []);

  async function saveSettings() {
    setSaving(true);
    await supabaseBrowser().from("store_settings").update(settings).eq("id", 1);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  async function updateFee(state: string, fee: number) {
    await supabaseBrowser().from("delivery_fees").update({ fee, updated_at: new Date().toISOString() }).eq("state", state);
    load();
  }

  async function addFee() {
    if (!newState || !newFee) return;
    await supabaseBrowser().from("delivery_fees").insert({ state: newState, fee: Number(newFee) });
    setNewState("");
    setNewFee("");
    load();
  }

  async function deleteFee(state: string) {
    await supabaseBrowser().from("delivery_fees").delete().eq("state", state);
    load();
  }

  if (!settings) return <p className="text-black/50">Loading...</p>;

  return (
    <div className="max-w-2xl space-y-8">
      <h1 className="font-serif text-2xl">Settings</h1>

      <div className="bg-white rounded-sm border border-black/5 p-6 space-y-4">
        <h2 className="font-medium">Store Info</h2>
        {[
          ["store_name", "Store Name"],
          ["whatsapp_number", "WhatsApp Number (e.g. 2348012345678)"],
          ["support_phone", "Support Phone"],
          ["support_email", "Support Email"],
          ["store_address", "Store Address"],
          ["paystack_public_key", "Paystack Public Key"],
          ["instagram_url", "Instagram URL"],
          ["twitter_url", "Twitter/X URL"],
          ["facebook_url", "Facebook URL"],
        ].map(([key, label]) => (
          <div key={key}>
            <label className="text-xs text-black/50">{label}</label>
            <input
              value={settings[key] || ""}
              onChange={(e) => setSettings({ ...settings, [key]: e.target.value })}
              className="border border-black/15 rounded-sm p-2.5 text-sm w-full mt-1"
            />
          </div>
        ))}
      </div>

      <div className="bg-white rounded-sm border border-black/5 p-6 space-y-4">
        <h2 className="font-medium">Bank Transfer Details</h2>
        {[
          ["bank_name", "Bank Name"],
          ["bank_account_name", "Account Name"],
          ["bank_account_number", "Account Number"],
        ].map(([key, label]) => (
          <div key={key}>
            <label className="text-xs text-black/50">{label}</label>
            <input
              value={settings[key] || ""}
              onChange={(e) => setSettings({ ...settings, [key]: e.target.value })}
              className="border border-black/15 rounded-sm p-2.5 text-sm w-full mt-1"
            />
          </div>
        ))}
      </div>

      <button onClick={saveSettings} disabled={saving} className="btn-gold">
        {saving ? "Saving..." : "Save Settings"}
      </button>
      {saved && <p className="text-green-700 text-sm">Saved ✓</p>}

      <div className="bg-white rounded-sm border border-black/5 p-6">
        <h2 className="font-medium mb-4">Delivery Fees</h2>
        <div className="space-y-2 mb-4">
          {deliveryFees.map((f) => (
            <div key={f.state} className="flex items-center gap-3">
              <span className="text-sm w-32">{f.state}</span>
              <input
                type="number"
                defaultValue={f.fee}
                onBlur={(e) => updateFee(f.state, Number(e.target.value))}
                className="border border-black/15 rounded-sm p-2 text-sm w-32"
              />
              <button onClick={() => deleteFee(f.state)} className="text-red-500">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <input
            placeholder="State name"
            value={newState}
            onChange={(e) => setNewState(e.target.value)}
            className="border border-black/15 rounded-sm p-2 text-sm w-32"
          />
          <input
            type="number"
            placeholder="Fee (₦)"
            value={newFee}
            onChange={(e) => setNewFee(e.target.value)}
            className="border border-black/15 rounded-sm p-2 text-sm w-32"
          />
          <button onClick={addFee} className="text-nova-gold flex items-center gap-1 text-sm">
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>
      </div>
    </div>
  );
}
