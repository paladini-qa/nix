import React from "react";
import {
  LayoutDashboard,
  Wallet,
  Settings,
  LogOut,
  User,
  ChevronRight,
} from "lucide-react";
import { ThemePreference } from "../types";
import ThemeSwitch from "./ThemeSwitch";

interface SidebarProps {
  themePreference: ThemePreference;
  onThemeChange: (theme: ThemePreference) => void;
  currentView: "dashboard" | "transactions" | "settings";
  onNavigate: (view: "dashboard" | "transactions" | "settings") => void;
  onLogout: () => void;
  displayName: string;
  userEmail: string;
  onOpenProfile: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  themePreference,
  onThemeChange,
  currentView,
  onNavigate,
  onLogout,
  displayName,
  userEmail,
  onOpenProfile,
}) => {
  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", id: "dashboard" as const },
    { icon: Wallet, label: "Transactions", id: "transactions" as const },
    { icon: Settings, label: "Settings", id: "settings" as const },
  ];

  return (
    <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border-r border-gray-200 dark:border-white/10 hidden lg:flex flex-col transition-colors duration-300">
      {/* Logo Area */}
      <div className="h-20 flex items-center px-8 border-b border-gray-100 dark:border-white/5">
        <div className="bg-indigo-600 dark:bg-indigo-500 p-2.5 rounded-lg shadow-lg dark:shadow-indigo-500/20 mr-3">
          <span className="text-white font-bold text-xl leading-none">N</span>
        </div>
        <span className="text-xl font-bold text-gray-800 dark:text-white tracking-tight">
          Nix
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        <p className="px-4 text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-4">
          Main Menu
        </p>
        {navItems.map((item) => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.label}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                isActive
                  ? "bg-indigo-50 dark:bg-white/10 text-indigo-600 dark:text-white font-medium shadow-sm"
                  : "text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-slate-200"
              }`}
            >
              <item.icon
                size={20}
                className={
                  isActive
                    ? "text-indigo-600 dark:text-indigo-400"
                    : "text-gray-400 dark:text-slate-500 group-hover:text-gray-600 dark:group-hover:text-slate-300"
                }
              />
              <span>{item.label}</span>
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400"></div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-gray-100 dark:border-white/5 space-y-3">
        <ThemeSwitch value={themePreference} onChange={onThemeChange} />

        {/* Profile Button */}
        <button
          onClick={onOpenProfile}
          className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
              <User
                size={16}
                className="text-indigo-600 dark:text-indigo-400"
              />
            </div>
            <div className="text-left min-w-0">
              <p className="text-sm font-medium text-gray-800 dark:text-white truncate">
                {displayName || "User"}
              </p>
              <p className="text-xs text-gray-500 dark:text-slate-500 truncate">
                {userEmail}
              </p>
            </div>
          </div>
          <ChevronRight
            size={16}
            className="text-gray-400 dark:text-slate-500 group-hover:text-gray-600 dark:group-hover:text-slate-300 flex-shrink-0 transition-colors"
          />
        </button>

        <button
          onClick={onLogout}
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
        >
          <LogOut size={20} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
