"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserNav } from "@/components/layout/user-nav";
import { HeliosChatPanel } from "@/components/shared/HeliosChatPanel";
import { 
  Command, 
  Target, 
  Shield, 
  MessageSquare,
  Bot 
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  {
    name: "Mission Control",
    href: "/",
    icon: Command,
    description: "Live agent activity feed"
  },
  {
    name: "Strategy",
    href: "/strategy",
    icon: Target,
    description: "Goals & Plans workspace"
  },
  {
    name: "Auditor",
    href: "/auditor",
    icon: Shield,
    description: "Claim validation center"
  },
];

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [currentGoalId, setCurrentGoalId] = useState<string | undefined>();

  // Extract goalId from pathname when on goal pages
  useEffect(() => {
    const goalMatch = pathname.match(/^\/goals\/([^\/]+)/);
    setCurrentGoalId(goalMatch ? goalMatch[1] : undefined);
  }, [pathname]);

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Left Sidebar */}
      <div className="w-64 bg-white border-r border-slate-200 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Helios</h1>
              <p className="text-xs text-slate-500">Autonomous TPM Agent</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href || 
                (item.href !== '/' && pathname.startsWith(item.href));
              
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={cn(
                      "group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200",
                      isActive
                        ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg"
                        : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                    )}
                  >
                    <item.icon
                      className={cn(
                        "mr-3 h-5 w-5 transition-colors",
                        isActive ? "text-white" : "text-slate-400 group-hover:text-slate-600"
                      )}
                    />
                    <div>
                      <div className="font-medium">{item.name}</div>
                      <div className={cn(
                        "text-xs mt-0.5",
                        isActive ? "text-purple-100" : "text-slate-500"
                      )}>
                        {item.description}
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-slate-200">
          <UserNav />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Main Content */}
        <main className="flex-1 overflow-auto bg-slate-50">
          {children}
        </main>
      </div>

      {/* Floating Helios Chat Button */}
      <button
        onClick={() => setIsChatOpen(true)}
        className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-110 flex items-center justify-center z-40 group"
      >
        <MessageSquare className="w-7 h-7 group-hover:scale-110 transition-transform" />
        <div className="absolute -top-2 -right-2 w-5 h-5 bg-green-500 rounded-full border-2 border-white animate-pulse" />
      </button>

      {/* Chat Panel */}
      <HeliosChatPanel 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)} 
        goalId={currentGoalId}
      />
    </div>
  );
}