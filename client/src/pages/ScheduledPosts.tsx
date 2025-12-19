import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Trash2, Calendar, Clock, AlertCircle, CheckCircle2, Youtube, Instagram, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ScheduledPost {
    id: string;
    video_id: string;
    scheduled_time: string;
    platforms: string[];
    status: 'scheduled' | 'posted' | 'failed';
    caption?: string;
    videos: {
        title: string;
        video_url: string;
    };
}

export default function ScheduledPosts() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [posts, setPosts] = useState<ScheduledPost[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) fetchPosts();
    }, [user]);

    const fetchPosts = async () => {
        try {
            const { data, error } = await supabase
                .from('scheduled_posts')
                .select(`
                    *,
                    videos (
                        title,
                        video_url
                    )
                `)
                .eq('user_id', user?.id)
                .order('scheduled_time', { ascending: true });

            if (error) throw error;
            setPosts(data as any);
        } catch (error) {
            console.error('Error fetching scheduled posts:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to cancel this scheduled post?')) return;
        
        const { error } = await supabase.from('scheduled_posts').delete().eq('id', id);
        if (!error) {
            setPosts(posts.filter(p => p.id !== id));
        }
    };

    const getPlatformIcon = (platform: string) => {
        switch (platform.toLowerCase()) {
            case 'youtube': return <Youtube className="w-4 h-4 text-red-500" />;
            case 'instagram': return <Instagram className="w-4 h-4 text-pink-500" />;
            case 'tiktok': return <svg className="w-4 h-4 text-[#00F2EA]" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/></svg>;
            default: return null;
        }
    };

    const StatusBadge = ({ status }: { status: string }) => {
        const styles = {
            scheduled: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
            posted: 'bg-green-500/10 text-green-400 border-green-500/20',
            failed: 'bg-red-500/10 text-red-400 border-red-500/20'
        };
        
        const icons = {
            scheduled: <Clock className="w-3 h-3" />,
            posted: <CheckCircle2 className="w-3 h-3" />,
            failed: <AlertCircle className="w-3 h-3" />
        };

        return (
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium border flex items-center gap-1.5 w-fit ${(styles as any)[status] || styles.scheduled}`}>
                {(icons as any)[status]}
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    return (
        <div className="w-full text-white pb-12">
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-400 hover:text-white mb-6">
                <ArrowLeft className="w-4 h-4" /> Back
            </button>

            <header className="mb-10 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600 mb-2 flex items-center gap-3">
                        <Calendar className="w-8 h-8 text-purple-500" />
                        Scheduled Queue
                    </h1>
                    <p className="text-gray-400">Manage your upcoming and past content distributions.</p>
                </div>
            </header>

            <div className="glass-card rounded-2xl border border-gray-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-900/50 text-gray-400 text-xs uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-4">Video</th>
                                <th className="px-6 py-4">Scheduled For</th>
                                <th className="px-6 py-4">Platforms</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                            {posts.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                        No scheduled posts found.
                                    </td>
                                </tr>
                            )}
                            {posts.map((post) => (
                                <tr key={post.id} className="hover:bg-gray-800/30 transition group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-16 h-9 bg-gray-800 rounded overflow-hidden flex-shrink-0">
                                                {post.videos?.video_url ? (
                                                    <video src={post.videos.video_url} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-gray-900 text-gray-600 text-xs">No Preview</div>
                                                )}
                                            </div>
                                            <span className="font-medium text-sm text-gray-200 line-clamp-1 max-w-[200px]" title={post.videos?.title}>
                                                {post.videos?.title || 'Untitled Video'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col text-sm">
                                            <span className="text-white font-medium">
                                                {new Date(post.scheduled_time).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </span>
                                            <span className="text-gray-500 text-xs">
                                                {new Date(post.scheduled_time).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-2">
                                            {post.platforms?.map(p => (
                                                <div key={p} className="p-1.5 bg-gray-800 rounded-full border border-gray-700" title={p}>
                                                    {getPlatformIcon(p)}
                                                </div>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <StatusBadge status={post.status} />
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {post.status === 'scheduled' && (
                                            <button 
                                                onClick={() => handleDelete(post.id)}
                                                className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                                                title="Cancel Post"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
