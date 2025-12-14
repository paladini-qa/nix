import React from 'react';
import { LayoutDashboard, Wallet, PieChart, Settings, LogOut, Sun, Moon } from 'lucide-react';

interface SidebarProps {
  darkMode: boolean;
  toggleTheme: () => void;
  currentView: 'dashboard' | 'transactions' | 'settings';
  onNavigate: (view: 'dashboard' | 'transactions' | 'settings') => void;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ darkMode, toggleTheme, currentView, onNavigate, onLogout }) => {
  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', id: 'dashboard' as const },
    { icon: Wallet, label: 'Transações', id: 'transactions' as const },
    { icon: Settings, label: 'Configurações', id: 'settings' as const, disabled: false },
    { icon: PieChart, label: 'Relatórios', id: 'reports' as const, disabled: true }, // Placeholder
  ];

  return (
    <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border-r border-gray-200 dark:border-white/10 hidden lg:flex flex-col transition-colors duration-300">
      {/* Logo Area */}
      <div className="h-20 flex items-center px-8 border-b border-gray-100 dark:border-white/5">
        <div className="bg-indigo-600 dark:bg-indigo-500 p-2 rounded-lg shadow-lg dark:shadow-indigo-500/20 mr-3">
          <span className="text-white font-bold text-xl leading-none">FI</span>
        </div>
        <span className="text-lg font-bold text-gray-800 dark:text-white tracking-tight">Finanças</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        <p className="px-4 text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-4">Menu Principal</p>
        {navItems.map((item) => {
           const isActive = currentView === item.id;
           return (
            <button
                key={item.label}
                onClick={() => !item.disabled && onNavigate(item.id as any)}
                disabled={item.disabled}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                isActive
                    ? 'bg-indigo-50 dark:bg-white/10 text-indigo-600 dark:text-white font-medium shadow-sm'
                    : item.disabled 
                        ? 'text-gray-300 dark:text-slate-700 cursor-not-allowed'
                        : 'text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-slate-200'
                }`}
            >
                <item.icon size={20} className={isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-slate-500 group-hover:text-gray-600 dark:group-hover:text-slate-300'} />
                <span>{item.label}</span>
                {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400"></div>
                )}
            </button>
           )
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-gray-100 dark:border-white/5 space-y-2">
        <button
          onClick={toggleTheme}
          className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center space-x-3">
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            <span>{darkMode ? 'Modo Claro' : 'Modo Escuro'}</span>
          </div>
        </button>
        
        <button 
          onClick={onLogout}
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
        >
          <LogOut size={20} />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;