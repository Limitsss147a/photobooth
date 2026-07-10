import { getSupabase } from "@/lib/supabase";
import TransactionsClient from "./TransactionsClient";

export default async function TransactionsPage() {
  const supabase = getSupabase();
  
  // Fetch transactions and join with sessions and devices if needed
  const { data: transactions, error } = await supabase
    .from("transactions")
    .select(`
      id,
      session_id,
      order_id,
      jumlah,
      tipe_pembayaran,
      status_bayar,
      created_at
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching transactions:", error);
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
            Transactions History
          </h1>
          <p className="text-slate-400 mt-1">View and manage all photobooth payments and sessions.</p>
        </div>
      </header>

      <TransactionsClient initialData={transactions || []} />
    </div>
  );
}
