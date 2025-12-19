import { useState, useEffect } from 'react';
import { Instagram, Facebook, Link as LinkIcon, AlertCircle, CheckCircle2, Loader2, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
// import { TikTok } from 'lucide-react'; // Lucide might not have TikTok, check or use SVG

// Custom TikTok Icon
const TikTok = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 448 512" 
    className={className} 
    fill="currentColor"
    width="24" 
    height="24"
  >
    <path d="M448 209.91a210.06 210.06 0 0 1-122.77-39.25V349.38A162.55 162.55 0 1 1 185 188.31V278.2a74.62 74.62 0 1 0 52.23 71.18V0l88 0a121.18 121.18 0 0 0 1.86 22.17h0A122.18 122.18 0 0 0 381 102.39a121.43 121.43 0 0 0 67 20.14z"/>
  </svg>
);

interface SocialAccount {
    id: string;
    platform: string;
    handle: string;
    status: string;
}

export default function Connections() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);

  useEffect(() => {
    fetchAccounts();
  }, [user]);

  const fetchAccounts = async () => {
    try {
      const { data, error } = await supabase
        .from('social_accounts')
        .select('*')
        .eq('user_id', user?.id || '');

      if (error) throw error;
      setAccounts(data || []);
    } catch (error) {
      console.error('Error fetching accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (platform: string) => {
    setConnecting(platform);

    // SIMULATE OAUTH POPUP FLOW
    // In a real app, this would redirect to https://api.instagram.com/oauth...
    await new Promise(resolve => setTimeout(resolve, 2000)); // Fake 2s load time

    try {
        // Mock successful Data
        const mockHandle = `@${user?.email?.split('@')[0]}_${platform}`; // e.g. @kartik_instagram

        // Check if already exists
        const exists = accounts.find(a => a.platform === platform);
        if (exists) {
            alert('Account already connected!');
            setConnecting(null);
            return;
        }

        const { error } = await supabase.from('social_accounts').insert({
            user_id: user?.id,
            platform,
            handle: mockHandle,
            status: 'connected'
        });

        if (error) throw error;

        // Refresh UI
        await fetchAccounts();

    } catch (err: any) {
        console.error('Connection failed:', err);
        alert('Connection failed: ' + err.message);
    } finally {
        setConnecting(null);
    }
  };

  const handleDisconnect = async (id: string) => {
    if (!confirm('Are you sure you want to disconnect this account?')) return;
    
    try {
        const { error } = await supabase.from('social_accounts').delete().eq('id', id);
        if (error) throw error;
        setAccounts(accounts.filter(a => a.id !== id));
    } catch (err: any) {
        alert('Failed to disconnect: ' + err.message);
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
        case 'instagram': return <Instagram className="w-6 h-6" />;
        case 'facebook': return <Facebook className="w-6 h-6" />;
        case 'tiktok': return <TikTok className="w-6 h-6" />;
        default: return <LinkIcon className="w-6 h-6" />;
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
        case 'instagram': return 'bg-gradient-to-r from-purple-500 to-pink-500';
        case 'facebook': return 'bg-blue-600';
        case 'tiktok': return 'bg-black border border-gray-700'; // TikTok brand is black
        default: return 'bg-gray-700';
    }
  };

  return (
    <div className="w-full text-white pb-12">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-400 hover:text-white mb-6">
            <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <header className="mb-10">
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500 mb-2">
                Connect Accounts
            </h1>
            <p className="text-gray-400">Manage your social media integration for auto-posting.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Instagram */}
            <ConnectionCard 
                platform="instagram" 
                name="Instagram" 
                icon={<Instagram className="w-8 h-8"/>} 
                connectedAccount={accounts.find(a => a.platform === 'instagram')}
                onConnect={() => handleConnect('instagram')}
                onDisconnect={handleDisconnect}
                loading={connecting === 'instagram'}
                color="from-purple-500 to-pink-500"
            />

            {/* TikTok */}
             <ConnectionCard 
                platform="tiktok" 
                name="TikTok" 
                icon={<TikTok className="w-8 h-8"/>} 
                connectedAccount={accounts.find(a => a.platform === 'tiktok')}
                onConnect={() => handleConnect('tiktok')}
                onDisconnect={handleDisconnect}
                loading={connecting === 'tiktok'}
                color="from-[#00f2ea] to-[#ff0050]"
            />

            {/* Facebook */}
             <ConnectionCard 
                platform="facebook" 
                name="Facebook" 
                icon={<Facebook className="w-8 h-8"/>} 
                connectedAccount={accounts.find(a => a.platform === 'facebook')}
                onConnect={() => handleConnect('facebook')}
                onDisconnect={handleDisconnect}
                loading={connecting === 'facebook'}
                color="from-blue-600 to-blue-700"
            />

        </div>

        {/* Info Box */}
        <div className="mt-12 p-6 glass-card rounded-xl border border-blue-500/30 flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
            <div>
                <h3 className="text-lg font-semibold text-blue-100 mb-1">How it works</h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                    Connecting your accounts allows our Auto-Posting Worker to publish your scheduled videos directly to your feed.
                    <br/>
                    <span className="text-xs opacity-70 mt-2 block">
                        *Note: This is a simulation using Mock OAuth. No real data is sent to Meta/TikTok servers in this portfolio demo.
                    </span>
                </p>
            </div>
        </div>
    </div>
  );
}

function ConnectionCard({ platform, name, icon, connectedAccount, onConnect, onDisconnect, loading, color }: any) {
    const isConnected = !!connectedAccount;

    return (
        <div className="glass-card p-6 rounded-2xl border border-gray-800 relative group overflow-hidden">
             
             {/* Background glow */}
             <div className={`absolute top-0 right-0 p-20 bg-gradient-to-br ${color} opacity-5 blur-[80px] rounded-full translate-x-10 -translate-y-10 group-hover:opacity-10 transition duration-500`}></div>

             <div className="relative z-10 flex flex-col h-full">
                <div className="flex justify-between items-start mb-6">
                    <div className={`p-4 rounded-xl bg-gradient-to-br ${color} text-white shadow-lg`}>
                        {icon}
                    </div>
                    {isConnected && (
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-green-500/10 text-green-400 text-xs font-medium rounded-full border border-green-500/20">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Connected
                        </div>
                    )}
                </div>

                <h3 className="text-xl font-bold mb-1">{name}</h3>
                <p className="text-gray-400 text-sm mb-6">
                    {isConnected 
                        ? `Connected as ${connectedAccount.handle}` 
                        : `Connect your ${name} profile to auto-post content.`}
                </p>

                <div className="mt-auto">
                    {isConnected ? (
                        <button 
                            onClick={() => onDisconnect(connectedAccount.id)}
                            className="w-full py-2.5 rounded-lg border border-gray-700 hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/50 transition duration-200 text-sm font-medium"
                        >
                            Disconnect
                        </button>
                    ) : (
                        <button 
                            onClick={onConnect}
                            disabled={loading}
                            className={`w-full py-2.5 rounded-lg bg-gradient-to-r ${color} text-white font-medium hover:opacity-90 transition duration-200 shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2`}
                        >
                            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                            {loading ? 'Connecting...' : 'Connect Account'}
                        </button>
                    )}
                </div>
             </div>
        </div>
    )
}
