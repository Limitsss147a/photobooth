"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Settings, 
  Image as ImageIcon,
  Ticket,
  Camera
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();

  const links = [
    { name: "Overview", href: "/", icon: LayoutDashboard },
    { name: "Transactions", href: "/transactions", icon: Ticket },
    { name: "Frames & Filters", href: "/frames", icon: ImageIcon },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <aside className="w-64 glass-panel border-r border-white/5 flex flex-col justify-between h-screen sticky top-0">
      <div>
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-rose-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Camera size={24} className="text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight">SnapBooth</span>
        </div>

        <nav className="mt-6 px-4 flex flex-col gap-2">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;

            return (
              <Link 
                key={link.name} 
                href={link.href}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group
                  ${isActive 
                    ? "bg-indigo-500/10 text-indigo-400 font-medium" 
                    : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                  }
                `}
              >
                <Icon size={20} className={`transition-all duration-300 ${isActive ? "text-indigo-400" : "text-slate-500 group-hover:text-slate-300"}`} />
                {link.name}
              </Link>
            );
          })}
        </nav>
      </div>
      
      <div className="p-6 text-xs text-slate-500 flex flex-col gap-1 text-center font-medium">
        <span>SnapBooth Admin Panel</span>
        <span>Version 1.0.0</span>
      </div>
    </aside>
  );
}
