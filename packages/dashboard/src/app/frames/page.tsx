import { getSupabase } from "@/lib/supabase";
import FramesClient from "./FramesClient";

export default async function FramesPage() {
  const supabase = getSupabase();
  
  const { data: frames, error } = await supabase
    .from("frame_templates")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching frames:", error);
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
            Frames & Filters
          </h1>
          <p className="text-slate-400 mt-1">Manage photo frames and visual filters for the kiosk.</p>
        </div>
      </header>

      <FramesClient initialFrames={frames || []} />
    </div>
  );
}
