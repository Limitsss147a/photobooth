import { Activity, CreditCard, Users, TrendingUp } from "lucide-react";
import { getSupabase } from "@/lib/supabase";

export default async function OverviewPage() {
  const supabase = getSupabase();

  // Fetch metrics
  const { data: transactions } = await supabase
    .from("transactions")
    .select("jumlah, status_bayar, created_at")
    .order("created_at", { ascending: false });

  const { count: sessionCount } = await supabase
    .from("sessions")
    .select("*", { count: "exact", head: true });

  const { data: photos } = await supabase
    .from("photos")
    .select("is_composited, file_url")
    .eq("is_composited", true);

  // Calculate stats
  const successfulTx = (transactions || []).filter(t => t.status_bayar === "settlement" || t.status_bayar === "success" || t.status_bayar === "cash");
  const totalRevenue = successfulTx.reduce((sum, t) => sum + (Number(t.jumlah) || 0), 0);
  const totalSessions = sessionCount || 0;
  
  // Format currency
  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Recent transactions for table
  const recentTx = (transactions || []).slice(0, 5);

  return (
    <div className="space-y-8 animate-fade-in">
      <header>
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
          Dashboard Overview
        </h1>
        <p className="text-slate-400 mt-1">Welcome back to SnapBooth Admin.</p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard 
          title="Total Revenue" 
          value={formatRupiah(totalRevenue)} 
          trend={`${successfulTx.length} paid transactions`} 
          icon={<CreditCard className="text-emerald-400" size={24} />} 
        />
        <StatCard 
          title="Total Sessions" 
          value={totalSessions.toString()} 
          trend="Total captured sessions" 
          icon={<Users className="text-indigo-400" size={24} />} 
        />
        <StatCard 
          title="Active Devices" 
          value="1" 
          trend="All systems nominal" 
          icon={<Activity className="text-rose-400" size={24} />} 
        />
        <StatCard 
          title="Total Photos" 
          value={(photos?.length || 0).toString()} 
          trend="Printed/Saved photos" 
          icon={<TrendingUp className="text-amber-400" size={24} />} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions */}
        <div className="lg:col-span-2 glass-card p-6">
          <h2 className="text-xl font-bold mb-4">Recent Transactions</h2>
          <div className="bg-slate-900/50 rounded-xl border border-white/5 overflow-hidden">
            <table className="w-full text-left text-sm text-slate-400">
              <thead className="bg-slate-800/50 text-xs uppercase text-slate-300">
                <tr>
                  <th className="px-6 py-4 font-medium">Date</th>
                  <th className="px-6 py-4 font-medium">Amount</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentTx.length > 0 ? (
                  recentTx.map((tx, idx) => (
                    <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">{new Date(tx.created_at).toLocaleString('id-ID')}</td>
                      <td className="px-6 py-4 text-white font-medium">{formatRupiah(tx.jumlah)}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          ['settlement', 'success', 'cash'].includes(tx.status_bayar?.toLowerCase()) 
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : tx.status_bayar === 'pending'
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-rose-500/20 text-rose-400'
                        }`}>
                          {tx.status_bayar?.toUpperCase() || 'UNKNOWN'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-slate-500">
                      No recent transactions
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Popular Frames placeholder */}
        <div className="glass-card p-6">
          <h2 className="text-xl font-bold mb-4">Storage Overview</h2>
          <div className="space-y-4">
             <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg border border-white/5">
                <span className="font-medium">Total Uploaded Photos</span>
                <span className="text-xs py-1 px-2 rounded-full bg-indigo-500/20 text-indigo-400">{photos?.length || 0} files</span>
             </div>
             <p className="text-xs text-slate-500 mt-4 leading-relaxed">
               Photos are automatically synced to Supabase Storage bucket <code>photos</code> when a session completes.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, trend, icon }: { title: string, value: string, trend: string, icon: React.ReactNode }) {
  return (
    <div className="glass-card p-6 flex flex-col gap-4 group hover:border-indigo-500/30 transition-all duration-300">
      <div className="flex justify-between items-start">
        <div className="p-3 bg-slate-800/50 rounded-xl border border-white/5 group-hover:scale-110 group-hover:bg-slate-800 transition-all duration-300">
          {icon}
        </div>
      </div>
      <div>
        <h3 className="text-slate-400 text-sm font-medium mb-1">{title}</h3>
        <p className="text-3xl font-bold text-white tracking-tight">{value}</p>
        <p className="text-xs text-slate-500 mt-2 font-medium">{trend}</p>
      </div>
    </div>
  );
}
