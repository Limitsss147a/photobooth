import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import * as crypto from "https://deno.land/std@0.177.0/crypto/mod.ts"

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
const MIDTRANS_SERVER_KEY = Deno.env.get("MIDTRANS_SERVER_KEY")!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

serve(async (req) => {
  try {
    // Hanya menerima method POST
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 })
    }

    const payload = await req.json()
    console.log("Webhook payload received:", payload)

    const orderId = payload.order_id
    const statusCode = payload.status_code
    const grossAmount = payload.gross_amount
    const signatureKey = payload.signature_key
    const transactionStatus = payload.transaction_status

    // 1. Verifikasi Signature Key Midtrans untuk keamanan
    // Rumus: SHA512(order_id + status_code + gross_amount + ServerKey)
    const dataToHash = `${orderId}${statusCode}${grossAmount}${MIDTRANS_SERVER_KEY}`
    
    // Hash menggunakan SHA512
    const hashBuffer = await crypto.crypto.subtle.digest(
      "SHA-512",
      new TextEncoder().encode(dataToHash)
    )
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const generatedSignature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

    if (generatedSignature !== signatureKey) {
      console.error("Invalid signature key")
      return new Response(JSON.stringify({ error: "Invalid signature" }), { status: 401 })
    }

    // 2. Update status transaksi di tabel 'transactions'
    console.log(`Updating transaction ${orderId} status to: ${transactionStatus}`)
    
    const { data, error } = await supabase
      .from('transactions')
      .update({ 
        status_bayar: transactionStatus,
        updated_at: new Date().toISOString()
      })
      .eq('payment_gateway_ref', orderId)

    if (error) {
      console.error("Failed to update database:", error)
      return new Response(JSON.stringify({ error: error.message }), { status: 500 })
    }

    // 3. Selesai
    return new Response(JSON.stringify({ success: true, message: "Webhook processed" }), {
      headers: { "Content-Type": "application/json" },
    })

  } catch (error) {
    console.error("Webhook error:", error)
    return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 })
  }
})
