"use server";

import { getSupabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

export async function updateDeviceConfig(deviceId: string, newConfig: any) {
  const supabase = getSupabase();
  
  const { error } = await supabase
    .from("devices")
    .update({ config: newConfig })
    .eq("id", deviceId);
    
  if (error) {
    return { error: error.message };
  }
  
  revalidatePath("/settings");
  return { success: true };
}
