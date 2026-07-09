"use client";

import { useState } from "react";
import { Plus, Image as ImageIcon, Check, X, Loader2 } from "lucide-react";
import { addFrameAction, toggleFrameStatus } from "./actions";

export default function FramesClient({ initialFrames }: { initialFrames: any[] }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg("");
    
    const formData = new FormData(e.currentTarget);
    const result = await addFrameAction(formData);
    
    if (result.error) {
      setErrorMsg(result.error);
      setIsSubmitting(false);
    } else {
      setIsModalOpen(false);
      setIsSubmitting(false);
    }
  };

  const handleToggle = async (id: string, currentStatus: boolean) => {
    await toggleFrameStatus(id, currentStatus);
  };

  return (
    <>
      <div className="flex justify-between items-center bg-slate-900/50 p-4 rounded-xl border border-white/5">
        <div className="flex gap-4">
          <button className="px-4 py-2 bg-indigo-500/20 text-indigo-400 rounded-lg text-sm font-medium">
            All Frames
          </button>
          <button className="px-4 py-2 text-slate-400 hover:text-slate-200 rounded-lg text-sm font-medium transition-colors">
            Active
          </button>
          <button className="px-4 py-2 text-slate-400 hover:text-slate-200 rounded-lg text-sm font-medium transition-colors">
            Inactive
          </button>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="btn-primary"
        >
          <Plus size={18} /> Add New Frame
        </button>
      </div>

      {initialFrames.length === 0 ? (
        <div className="glass-card p-12 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4 border border-white/5">
            <ImageIcon size={32} className="text-slate-500" />
          </div>
          <h3 className="text-xl font-medium text-white mb-2">No frames found</h3>
          <p className="text-slate-400 max-w-md">
            You haven't uploaded any frame templates yet. Upload your first frame to make it available on the photobooth.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {initialFrames.map((frame) => (
            <div key={frame.id} className="glass-card overflow-hidden group">
              <div className="aspect-[2/3] bg-slate-800 relative">
                {frame.thumbnail_url ? (
                  <img 
                    src={frame.thumbnail_url} 
                    alt={frame.nama} 
                    className="w-full h-full object-contain p-4"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-600">
                    <ImageIcon size={48} />
                  </div>
                )}
                
                <div className="absolute top-3 right-3">
                  <span className={`px-2 py-1 rounded text-xs font-medium backdrop-blur-md border ${
                    frame.is_active 
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" 
                      : "bg-slate-800/80 text-slate-400 border-white/10"
                  }`}>
                    {frame.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
              
              <div className="p-4">
                <h3 className="font-bold text-lg mb-1">{frame.nama}</h3>
                <div className="flex justify-between items-center text-sm text-slate-400 mb-4">
                  <span>{frame.kategori}</span>
                  <span>{frame.harga_tambahan > 0 ? `+Rp ${frame.harga_tambahan}` : "Free"}</span>
                </div>
                
                <button 
                  onClick={() => handleToggle(frame.id, frame.is_active)}
                  className={`w-full py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                    frame.is_active
                      ? "bg-rose-500/10 text-rose-400 hover:bg-rose-500/20"
                      : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                  }`}
                >
                  {frame.is_active ? <X size={16} /> : <Check size={16} />}
                  {frame.is_active ? "Disable Frame" : "Enable Frame"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="glass-card p-6 w-full max-w-md shadow-2xl relative">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X size={20} />
            </button>
            
            <h2 className="text-xl font-bold mb-6">Upload New Frame</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMsg && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 text-sm">
                  {errorMsg}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Frame Name</label>
                <input 
                  type="text" 
                  name="name" 
                  required 
                  className="input-field" 
                  placeholder="e.g. Classic White" 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Category</label>
                <select name="category" className="input-field appearance-none">
                  <option value="Basic">Basic</option>
                  <option value="Premium">Premium</option>
                  <option value="Seasonal">Seasonal</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Additional Price (Rp)</label>
                <input 
                  type="number" 
                  name="price" 
                  defaultValue="0" 
                  className="input-field" 
                />
                <p className="text-xs text-slate-500 mt-1">Leave 0 if included in base package.</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Frame File (PNG with transparency)</label>
                <input 
                  type="file" 
                  name="file" 
                  accept="image/png" 
                  required 
                  className="block w-full text-sm text-slate-400
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-lg file:border-0
                    file:text-sm file:font-semibold
                    file:bg-indigo-500/20 file:text-indigo-400
                    hover:file:bg-indigo-500/30 transition-all
                  " 
                />
              </div>
              
              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="btn-secondary flex-1"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary flex-1"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <><Loader2 size={18} className="animate-spin" /> Uploading...</>
                  ) : (
                    "Upload Frame"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
