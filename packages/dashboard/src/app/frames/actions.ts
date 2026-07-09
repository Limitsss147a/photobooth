"use server";

import { getSupabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

export async function addFrameAction(formData: FormData) {
  const supabase = getSupabase();
  
  const name = formData.get("name") as string;
  const category = formData.get("category") as string;
  const price = parseInt(formData.get("price") as string) || 0;
  const file = formData.get("file") as File;

  if (!name || !file || file.size === 0) {
    return { error: "Name and file are required." };
  }

  try {
    // 1. Upload to Supabase Storage
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `frames/${fileName}`;

    // Note: User must create "assets" or "frames" bucket in Supabase. We use "photos" for now to avoid creating new bucket errors,
    // or we assume a "public" bucket exists. Let's use "photos" bucket which we know exists.
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("photos")
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false
      });

    if (uploadError) throw uploadError;

    const { data: publicUrlData } = supabase.storage
      .from("photos")
      .getPublicUrl(filePath);

    // 2. Insert into database
    const { error: dbError } = await supabase
      .from("frame_templates")
      .insert({
        nama: name,
        kategori: category,
        harga_tambahan: price,
        file_url: publicUrlData.publicUrl,
        thumbnail_url: publicUrlData.publicUrl,
        is_active: true
      });

    if (dbError) throw dbError;

    revalidatePath("/frames");
    return { success: true };
  } catch (error: any) {
    console.error("Action error:", error);
    return { error: error.message || "Failed to add frame." };
  }
}

export async function toggleFrameStatus(id: string, currentStatus: boolean) {
  const supabase = getSupabase();
  
  const { error } = await supabase
    .from("frame_templates")
    .update({ is_active: !currentStatus })
    .eq("id", id);
    
  if (error) {
    return { error: error.message };
  }
  
  revalidatePath("/frames");
  return { success: true };
}
