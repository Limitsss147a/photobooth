"use client";

import { useState } from "react";
import { updateDeviceConfig } from "./actions";
import { Save, Loader2, MonitorSmartphone, Palette, Receipt, Clock } from "lucide-react";

export default function SettingsClient({ deviceId, initialConfig }: { deviceId: string, initialConfig: any }) {
  const [config, setConfig] = useState(initialConfig);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setConfig(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage({ text: "", type: "" });
    
    if (!deviceId) {
      setMessage({ text: "Error: No device found to update.", type: "error" });
      setIsSaving(false);
      return;
    }

    const result = await updateDeviceConfig(deviceId, config);
    
    if (result.error) {
      setMessage({ text: result.error, type: "error" });
    } else {
      setMessage({ text: "Settings saved successfully! They will sync to the kiosk on next startup.", type: "success" });
    }
    
    setIsSaving(false);
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
      {/* Settings Form */}
      <div className="xl:col-span-2 space-y-6">
        
        {message.text && (
          <div className={`p-4 rounded-xl border flex items-start gap-3 ${
            message.type === 'error' 
              ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' 
              : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
          }`}>
            <div className="mt-0.5">
              {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            </div>
            <p className="text-sm font-medium leading-relaxed">{message.text}</p>
          </div>
        )}

        {/* Pricing Section */}
        <section className="glass-card p-6">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
              <Receipt size={20} />
            </div>
            <h2 className="text-xl font-semibold">Pricing & Packages</h2>
          </div>
          
          <div className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Base Session Price (Rp)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium">Rp</span>
                <input 
                  type="number" 
                  name="basePrice"
                  value={config.basePrice}
                  onChange={handleChange}
                  className="input-field pl-12" 
                />
              </div>
              <p className="text-xs text-slate-500 mt-2">This is the starting price for the default 2-strip 4x6 print.</p>
            </div>
          </div>
        </section>

        {/* Kiosk Display Section */}
        <section className="glass-card p-6">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
            <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
              <MonitorSmartphone size={20} />
            </div>
            <h2 className="text-xl font-semibold">Attract Screen & UI</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Main Headline</label>
              <input 
                type="text" 
                name="attractTitle"
                value={config.attractTitle}
                onChange={handleChange}
                className="input-field" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Subtitle</label>
              <input 
                type="text" 
                name="attractSubtitle"
                value={config.attractSubtitle}
                onChange={handleChange}
                className="input-field" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1 flex items-center gap-2">
                <Palette size={16} className="text-slate-400" /> Primary Theme Color
              </label>
              <div className="flex items-center gap-3">
                <input 
                  type="color" 
                  name="themeColor"
                  value={config.themeColor}
                  onChange={handleChange}
                  className="h-10 w-20 rounded bg-slate-900 border border-white/10 cursor-pointer" 
                />
                <span className="text-slate-400 font-mono text-sm">{config.themeColor}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Timing Section */}
        <section className="glass-card p-6">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
            <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400">
              <Clock size={20} />
            </div>
            <h2 className="text-xl font-semibold">Session Timers</h2>
          </div>
          
          <div className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Camera Countdown (Seconds)</label>
              <input 
                type="number" 
                name="countdownSeconds"
                value={config.countdownSeconds}
                onChange={handleChange}
                min={3}
                max={15}
                className="input-field" 
              />
              <p className="text-xs text-slate-500 mt-2">Duration between clicking 'Ready' and the camera shutter.</p>
            </div>
          </div>
        </section>

        <div className="flex justify-end pt-4 pb-12 xl:pb-0">
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="btn-primary w-full md:w-auto md:px-8 py-3 rounded-xl text-base shadow-indigo-500/30"
          >
            {isSaving ? (
              <><Loader2 size={20} className="animate-spin" /> Saving Changes...</>
            ) : (
              <><Save size={20} /> Save Configuration</>
            )}
          </button>
        </div>
      </div>

      {/* Preview Section */}
      <div className="xl:col-span-1 hidden xl:block">
        <div className="sticky top-8">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Live Preview</h3>
          <div className="aspect-[9/16] bg-slate-900 rounded-3xl border-8 border-slate-800 shadow-2xl relative overflow-hidden flex flex-col">
            
            {/* Top wave decorative */}
            <div 
              className="absolute top-0 left-0 right-0 h-40 opacity-20"
              style={{ 
                background: `linear-gradient(to bottom, ${config.themeColor}, transparent)` 
              }}
            />

            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center z-10">
              <h1 className="text-3xl font-black text-white mb-2 leading-tight">
                {config.attractTitle}
              </h1>
              <p className="text-slate-300 text-sm mb-12">
                {config.attractSubtitle}
              </p>
              
              <div 
                className="w-24 h-24 rounded-full flex items-center justify-center shadow-xl animate-pulse"
                style={{ backgroundColor: config.themeColor }}
              >
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-slate-900">TAP</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-950 p-4 text-center border-t border-white/5">
              <span className="text-xs font-medium text-slate-500">
                Starting from Rp {config.basePrice.toLocaleString('id-ID')}
              </span>
            </div>
          </div>
          <p className="text-center text-xs text-slate-500 mt-4">
            *This is an approximation of the Kiosk Attract Screen.
          </p>
        </div>
      </div>
    </div>
  );
}

// Simple icons for message
function CheckCircle(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>;
}

function AlertCircle(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;
}
