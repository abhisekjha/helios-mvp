"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { User, LogOut, Settings, ChevronUp } from "lucide-react";

export function UserNav() {
  const [isOpen, setIsOpen] = useState(false);
  const { logout, user } = useAuth();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleLogout = () => {
    logout();
    setIsOpen(false);
  };

  const getInitials = (fullName: string) => {
    return fullName
      .split(' ')
      .map(name => name.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={toggleMenu}
        className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-slate-100 transition-all duration-200 group"
      >
        <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
          <span className="text-white font-semibold text-sm">
            {user?.full_name ? getInitials(user.full_name) : 'U'}
          </span>
        </div>
        <div className="flex-1 text-left">
          <div className="text-sm font-medium text-slate-900">
            {user?.full_name || 'User'}
          </div>
          <div className="text-xs text-slate-500 capitalize">
            {user?.role || 'Role'}
          </div>
        </div>
        <ChevronUp 
          className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`} 
        />
      </button>

      {isOpen && (
        <div className="absolute bottom-full mb-2 right-0 w-56 origin-bottom-right bg-white rounded-xl shadow-xl ring-1 ring-slate-200 border border-slate-100 z-50">
          <div className="py-2" role="menu" aria-orientation="vertical">
            {/* User Info Header */}
            <div className="px-4 py-3 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-medium text-xs">
                    {user?.full_name ? getInitials(user.full_name) : 'U'}
                  </span>
                </div>
                <div>
                  <div className="text-sm font-medium text-slate-900">
                    {user?.full_name || 'User'}
                  </div>
                  <div className="text-xs text-slate-500">
                    {user?.email || 'user@example.com'}
                  </div>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="py-1">
              <Link
                href="/profile"
                className="flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                role="menuitem"
                onClick={() => setIsOpen(false)}
              >
                <User className="w-4 h-4 mr-3 text-slate-400" />
                Profile
              </Link>
              <Link
                href="/settings"
                className="flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                role="menuitem"
                onClick={() => setIsOpen(false)}
              >
                <Settings className="w-4 h-4 mr-3 text-slate-400" />
                Settings
              </Link>
              <div className="border-t border-slate-100 my-1"></div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                role="menuitem"
              >
                <LogOut className="w-4 h-4 mr-3 text-red-500" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}