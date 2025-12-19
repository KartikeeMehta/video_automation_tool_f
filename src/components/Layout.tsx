import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { 
  Video, 
  BarChart2, 
  Link2,
  LogOut, 
  Menu, 
  X,
  Clock,
  Settings,
  Wand2, // Added import
  Scissors, // Added import
  Calendar, // Added import
  Bell, // Added import
  Plus // Added import
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Notification {
  id: string;
  message: string; // Changed from 'title' and 'message' combined
  read: boolean; // Changed from 'is_read'
  created_at: string;
}

export default function Layout() {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Mobile & Notifications State
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  React.useEffect(() => {
    fetchNotifications();
  }, [user]);

  const fetchNotifications = async () => {
      if (!user) return;
      
      const { data } = await supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(5);
      if (data) {
          setNotifications(data);
          setUnreadCount(data.filter(n => !n.read).length);
      } else {
        // Mock fallback removed as requested by "real data" prompt earlier, but keeping structure safe
        setNotifications([]);
        setUnreadCount(0);
      }
  };

  const markRead = async (id: string) => {
      setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
      await supabase.from('notifications').update({ read: true }).eq('id', id);
  };

  return (
    <div className="min-h-screen bg-background text-gray-100 font-sans flex text-base">
      
      {/* Mobile Overlay */}
      {mobileMenuOpen && (
          <div className="fixed inset-0 bg-black/80 z-30 lg:hidden" onClick={() => setMobileMenuOpen(false)} />
      )}

      {/* Sidebar (Responsive) */}
      <aside className={`
          fixed lg:sticky top-0 left-0 h-screen w-72 bg-surface border-r border-gray-800 p-6 flex flex-col z-40 transition-transform duration-300 ease-in-out shrink-0
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex items-center justify-between mb-10 px-2 ">
             <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-tr from-primary-500 to-secondary-500 rounded-lg" />
                <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                    AutoVideo
                </h1>
             </div>
             <button onClick={() => setMobileMenuOpen(false)} className="lg:hidden text-gray-400">
                 <X className="w-6 h-6" />
             </button>
        </div>
        
        <nav className="space-y-1.5 flex-1 overflow-y-auto custom-scrollbar">
          <NavItem icon={Video} label="My Videos" onClick={() => navigate('/dashboard')} active={location.pathname === '/dashboard'} />
          <NavItem icon={Wand2} label="AI Generator" onClick={() => navigate('/generate')} active={location.pathname === '/generate'} />
          <NavItem icon={Scissors} label="Studio Editor" onClick={() => navigate('/studio')} active={location.pathname === '/studio'} />
          <NavItem icon={Calendar} label="Schedule" onClick={() => navigate('/schedule')} active={location.pathname === '/schedule'} />
          <NavItem icon={Clock} label="Queue" onClick={() => navigate('/scheduled-posts')} active={location.pathname === '/scheduled-posts'} />
          <NavItem icon={BarChart2} label="Analytics" onClick={() => navigate('/analytics')} active={location.pathname === '/analytics'} />
          <NavItem icon={Link2} label="Connections" onClick={() => navigate('/connections')} active={location.pathname === '/connections'} />
          <NavItem icon={Settings} label="Settings" onClick={() => navigate('/settings')} active={location.pathname === '/settings'} />
        </nav>

        <div className="mt-auto pt-6 border-t border-gray-800">
          <div className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-surfaceHover transition cursor-pointer group">
            <div className="w-9 h-9 bg-primary-900/50 text-primary-400 rounded-full flex items-center justify-center font-bold text-sm border border-primary-500/20 group-hover:border-primary-500/50 transition">
              {user?.email?.[0].toUpperCase()}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium text-gray-200 truncate">{user?.email}</p>
              <p className="text-xs text-gray-500">Free Plan</p>
            </div>
            <button
              onClick={signOut}
              className="p-1.5 text-gray-500 hover:text-white hover:bg-gray-700 rounded-md transition"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Header */}
        <header className="flex justify-between items-center px-4 lg:px-12 py-6 bg-background/50 backdrop-blur-sm sticky top-0 z-20 border-b border-gray-800/50">
          <div className="flex items-center gap-4">
               {/* Mobile Toggle */}
               <button onClick={() => setMobileMenuOpen(true)} className="lg:hidden p-2 text-gray-400 border border-gray-800 rounded-lg">
                   <Menu className="w-6 h-6" />
               </button>
               <div>
                    {/* Dynamic Title based on route could go here, or keep generic */}
                    <h2 className="text-xl lg:text-3xl font-bold text-white mb-1">
                        {getPageTitle(location.pathname)}
                    </h2>
               </div>
          </div>
          
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Notification Bell */}
            <div className="relative">
                <button 
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="p-2 text-gray-400 hover:text-white hover:bg-surface rounded-full transition relative"
                >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-secondary-500 rounded-full border-2 border-background animate-pulse" />}
                </button>

                {/* Dropdown */}
                {showNotifications && (
                    <div className="absolute right-0 mt-2 w-80 bg-surface border border-gray-800 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                        <div className="p-3 border-b border-gray-800 bg-black/20 flex justify-between items-center">
                            <span className="text-sm font-semibold">Notifications</span>
                            <span className="text-xs text-gray-500 cursor-pointer hover:text-white" onClick={() => setNotifications([])}>Clear all</span>
                        </div>
                        <div className="max-h-64 overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="p-4 text-center text-gray-500 text-sm">No new notifications</div>
                            ) : (
                                notifications.map(n => (
                                    <div 
                                        key={n.id} 
                                        onClick={() => markRead(n.id)}
                                        className={`p-4 border-b border-gray-800/50 hover:bg-gray-800/50 cursor-pointer flex gap-3 ${!n.read ? 'bg-primary-500/5' : ''}`}
                                    >
                                        <div className={`w-2 h-2 rounded-full mt-1.5 ${!n.read ? 'bg-secondary-500' : 'bg-transparent'}`} />
                                        <div>
                                            <p className={`text-sm ${!n.read ? 'font-semibold text-white' : 'text-gray-400'}`}>{n.message}</p>
                                            <p className="text-[10px] text-gray-600 mt-2">{new Date(n.created_at).toLocaleTimeString()}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>

            <button 
              onClick={() => navigate('/upload')}
              className="btn-primary flex items-center gap-2 shadow-primary-500/25 px-4 py-2 text-sm sm:text-base sm:px-5 sm:py-2.5"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">New Project</span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-12 scroll-smooth">
            <Outlet />
        </main>
      </div>
    </div>
  );
}

function NavItem({ icon: Icon, label, active = false, onClick }: { icon: any, label: string, active?: boolean, onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
        active 
          ? 'bg-gradient-to-r from-primary-900/40 to-primary-900/10 border-l-4 border-primary-500 text-white' 
          : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
      }`}
    >
      <Icon className={`w-5 h-5 ${active ? 'text-primary-400' : 'text-gray-500 group-hover:text-gray-300'}`} />
      <span className="font-medium">{label}</span>
    </button>
  );
}

function getPageTitle(path: string): string {
    if (path === '/dashboard') return 'Dashboard';
    if (path.startsWith('/video')) return 'Video Details';
    if (path === '/upload') return 'Upload Video';
    if (path === '/generate') return 'AI Generator';
    if (path === '/studio') return 'Video Studio';
    if (path === '/schedule') return 'Schedule Post';
    if (path === '/scheduled-posts') return 'Scheduled Queue';
    if (path === '/analytics') return 'Analytics';
    if (path === '/connections') return 'Connect Accounts';
    if (path === '/settings') return 'Settings';
    return 'Dashboard';
}
