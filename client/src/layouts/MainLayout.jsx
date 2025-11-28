import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Calendar, Users, CheckSquare, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const MainLayout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();

  const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Özet' },
    { path: '/calendar', icon: Calendar, label: 'Takvim' },
    { path: '/contacts', icon: Users, label: 'Kişiler' },
    { path: '/tasks', icon: CheckSquare, label: 'Görevler' },
    { path: '/settings', icon: Settings, label: 'Ayarlar' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-secondary">
      {/* Sidebar */}
      <aside className="w-64 bg-secondary border-r border-white/5 flex flex-col">
        <div className="p-6">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
            Takip Uygulaması
          </h1>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-indigo-500/10 text-indigo-400' 
                    : 'text-secondary hover:bg-white/5 hover:text-primary'
                }`}
              >
                <Icon size={20} />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/5 space-y-2">
          {/* User Info */}
          <div className="flex items-center gap-3 px-4 py-3 text-secondary">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
              {currentUser?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-primary">{currentUser?.name || 'Kullanıcı'}</p>
              <p className="text-xs text-muted">@{currentUser?.username}</p>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-muted hover:bg-red-500/10 hover:text-red-400 w-full"
          >
            <LogOut size={20} />
            <span className="font-medium">Çıkış Yap</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-primary">
        <div className="container py-8 px-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default MainLayout;
