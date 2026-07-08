"use client";

import { Activity, CreditCard, Users, TrendingUp } from "lucide-react";

export default function OverviewPage() {
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
          value="Rp 1.240.000" 
          trend="+12% from last week" 
          icon={<CreditCard className="text-emerald-400" size={24} />} 
        />
        <StatCard 
          title="Total Sessions" 
          value="124" 
          trend="+8% from last week" 
          icon={<Users className="text-indigo-400" size={24} />} 
        />
        <StatCard 
          title="Active Devices" 
          value="1" 
          trend="All systems nominal" 
          icon={<Activity className="text-rose-400" size={24} />} 
        />
        <StatCard 
          title="Conversion Rate" 
          value="98%" 
          trend="Based on attract screen" 
          icon={<TrendingUp className="text-amber-400" size={24} />} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions placeholder */}
        <div className="lg:col-span-2 glass-card p-6">
          <h2 className="text-xl font-bold mb-4">Recent Transactions</h2>
          <div className="bg-slate-900/50 rounded-xl border border-white/5 p-8 text-center text-slate-500">
            Chart or table will be displayed here
          </div>
        </div>

        {/* Popular Frames placeholder */}
        <div className="glass-card p-6">
          <h2 className="text-xl font-bold mb-4">Popular Frames</h2>
          <div className="space-y-4">
             {/* Mock Data */}
             <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg border border-white/5">
                <span className="font-medium">Classic White</span>
                <span className="text-xs py-1 px-2 rounded-full bg-indigo-500/20 text-indigo-400">45 uses</span>
             </div>
             <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg border border-white/5">
                <span className="font-medium">Vintage Polaroid</span>
                <span className="text-xs py-1 px-2 rounded-full bg-indigo-500/20 text-indigo-400">32 uses</span>
             </div>
             <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg border border-white/5">
                <span className="font-medium">Neon Cyberpunk</span>
                <span className="text-xs py-1 px-2 rounded-full bg-indigo-500/20 text-indigo-400">18 uses</span>
             </div>
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
