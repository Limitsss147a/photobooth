import { getSupabase } from "@/lib/supabase";
import SettingsClient from "./SettingsClient";

export default async function SettingsPage() {
  const supabase = getSupabase();
  
  // Ambil data device pertama sebagai default untuk MVP
  let { data: device } = await supabase
    .from("devices")
    .select("id, config, outlet_id")
    .limit(1)
    .single();

  // Jika tidak ada device, kita buat satu (untuk keperluan demo/MVP)
  if (!device) {
    // Pastikan ada setidaknya 1 outlet
    let { data: outlet } = await supabase.from("outlets").select("id").limit(1).single();
    if (!outlet) {
      const { data: newOutlet } = await supabase.from("outlets").insert({ nama: "Outlet Utama" }).select("id").single();
      outlet = newOutlet;
    }

    if (outlet) {
      const defaultConfig = {
        basePrice: 35000,
        attractTitle: "Tap Anywhere to Start",
        attractSubtitle: "Create beautiful memories today",
        countdownSeconds: 5,
        themeColor: "#6366f1"
      };

      const { data: newDevice } = await supabase
        .from("devices")
        .insert({ 
          outlet_id: outlet.id, 
          device_name: "Booth 1",
          config: defaultConfig
        })
        .select("id, config, outlet_id")
        .single();
        
      device = newDevice;
    }
  }

  // Ekstrak config, kasih fallback jika kosong
  const config = device?.config || {
    basePrice: 35000,
    attractTitle: "Tap Anywhere to Start",
    attractSubtitle: "Create beautiful memories today",
    countdownSeconds: 5,
    themeColor: "#6366f1"
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <header>
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
          Photobooth Settings
        </h1>
        <p className="text-slate-400 mt-1">Configure pricing, UI themes, and timers for your kiosk.</p>
      </header>

      <SettingsClient 
        deviceId={device?.id} 
        initialConfig={config} 
      />
    </div>
  );
}
