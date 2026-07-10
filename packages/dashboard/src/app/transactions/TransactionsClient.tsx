"use client";

import { useState, useMemo } from "react";
import { Search, Filter, Download, ArrowUpDown } from "lucide-react";

export default function TransactionsClient({ initialData }: { initialData: any[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0
    }).format(amount);
  };

  const filteredData = useMemo(() => {
    return initialData.filter(tx => {
      const matchesSearch = 
        (tx.payment_gateway_ref?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (tx.id?.toLowerCase().includes(searchTerm.toLowerCase()));
        
      const matchesStatus = statusFilter === "all" || tx.status_bayar?.toLowerCase() === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [initialData, searchTerm, statusFilter]);

  const handleExportCSV = () => {
    const headers = ["Date", "Order ID", "Amount", "Method", "Status"];
    const csvContent = [
      headers.join(","),
      ...filteredData.map(tx => [
        new Date(tx.created_at).toLocaleString('id-ID'),
        tx.payment_gateway_ref || tx.id,
        tx.jumlah,
        tx.metode_bayar || 'Unknown',
        tx.status_bayar
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `transactions_${new Date().getTime()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              type="text" 
              placeholder="Search Order ID..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10 min-w-[250px]"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <select 
              className="input-field pl-10 appearance-none bg-slate-900 pr-10 cursor-pointer"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="settlement">Settlement (Success)</option>
              <option value="pending">Pending</option>
              <option value="expire">Expired</option>
              <option value="cancel">Cancelled</option>
            </select>
          </div>
        </div>

        <button 
          onClick={handleExportCSV}
          className="btn-secondary whitespace-nowrap"
        >
          <Download size={18} /> Export CSV
        </button>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-400">
            <thead className="bg-slate-800/50 text-xs uppercase text-slate-300 border-b border-white/5">
              <tr>
                <th className="px-6 py-4 font-medium whitespace-nowrap cursor-pointer hover:text-white transition-colors">
                  <div className="flex items-center gap-2">Date <ArrowUpDown size={14} /></div>
                </th>
                <th className="px-6 py-4 font-medium">Order ID</th>
                <th className="px-6 py-4 font-medium">Method</th>
                <th className="px-6 py-4 font-medium text-right">Amount</th>
                <th className="px-6 py-4 font-medium text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredData.length > 0 ? (
                filteredData.map((tx) => (
                  <tr key={tx.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-white">{new Date(tx.created_at).toLocaleDateString('id-ID')}</div>
                      <div className="text-xs text-slate-500">{new Date(tx.created_at).toLocaleTimeString('id-ID')}</div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-300">
                      {tx.payment_gateway_ref || tx.id.substring(0, 13) + "..."}
                    </td>
                    <td className="px-6 py-4 uppercase">
                      {tx.metode_bayar ? tx.metode_bayar.replace("_", " ") : "QRIS"}
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-white">
                      {formatRupiah(tx.jumlah || 0)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium inline-block w-24 ${
                        ['settlement', 'success', 'cash'].includes(tx.status_bayar?.toLowerCase()) 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : tx.status_bayar === 'pending'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {tx.status_bayar?.toUpperCase() || 'UNKNOWN'}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-800 mb-4">
                      <Filter className="text-slate-500" size={24} />
                    </div>
                    <h3 className="text-lg font-medium text-white mb-1">No transactions found</h3>
                    <p className="text-slate-500">Try adjusting your search or filters to find what you're looking for.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination summary */}
        {filteredData.length > 0 && (
          <div className="bg-slate-900/40 px-6 py-4 border-t border-white/5 flex items-center justify-between text-xs text-slate-500">
            <span>Showing <span className="font-medium text-white">{filteredData.length}</span> out of <span className="font-medium text-white">{initialData.length}</span> transactions</span>
          </div>
        )}
      </div>
    </div>
  );
}
