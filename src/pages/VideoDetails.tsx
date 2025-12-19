import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Share2, Eye, MessageCircle, Heart, Repeat } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface VideoData {
    id: string;
    title: string;
    video_url: string;
    topic: string;
    created_at: string;
    views?: number;
    likes?: number;
    comments_count?: number;
}

export default function VideoDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [video, setVideo] = useState<VideoData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchVideo = async () => {
            if (!id) return;
            const { data } = await supabase.from('videos').select('*').eq('id', id).single();
            setVideo(data);
            setLoading(false);
        };
        fetchVideo();
    }, [id]);

    // Mock Chart Data only if DB is empty, otherwise use real daily_stats
    const [chartData, setChartData] = useState<any[]>([]);

    useEffect(() => {
        if (!id) return;
        const fetchStats = async () => {
            const { data } = await supabase.from('daily_stats').select('*').eq('video_id', id).order('date', { ascending: true });
            if (data && data.length > 0) {
                 setChartData(data.map(d => ({ name: new Date(d.date).toLocaleDateString(undefined, {weekday: 'short'}), views: d.views })));
            } else {
                 // Fallback: Show last 7 days with 0 views if no history
                 const empty = Array.from({length: 7}, (_, i) => {
                     const d = new Date();
                     d.setDate(d.getDate() - (6 - i));
                     return { name: d.toLocaleDateString(undefined, { weekday: 'short' }), views: 0 };
                 });
                 setChartData(empty);
            }
        };
        fetchStats();
    }, [id, video]);

    if (loading) return <div className="text-center p-20 text-gray-400">Loading details...</div>;
    if (!video) return <div className="text-center p-20 text-red-400">Video not found.</div>;

    return (
        <div className="w-full text-white pb-12">
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-400 hover:text-white mb-6">
                <ArrowLeft className="w-4 h-4" /> Back
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Left: Video Player */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="rounded-2xl overflow-hidden border border-gray-800 bg-black shadow-2xl">
                        <video src={video.video_url} controls className="w-full aspect-[9/16] object-cover" />
                    </div>
                    
                    <div className="p-6 bg-surface rounded-xl border border-gray-800">
                        <h1 className="text-2xl font-bold mb-2">{video.title}</h1>
                        <p className="text-gray-400 text-sm mb-4">Topic: {video.topic}</p>
                        <div className="flex gap-2">
                             <button onClick={() => navigate('/schedule')} className="btn-primary flex-1 py-3 text-sm flex items-center justify-center gap-2">
                                <Repeat className="w-4 h-4" /> Repost
                             </button>
                             <button className="btn-secondary flex-1 py-3 text-sm flex items-center justify-center gap-2">
                                <Share2 className="w-4 h-4" /> Share
                             </button>
                        </div>
                    </div>
                </div>

                {/* Right: Analytics */}
                <div className="lg:col-span-2 space-y-8">
                    
                    {/* KPI Cards */}
                    <div className="grid grid-cols-3 gap-4">
                        <KPICard icon={Eye} label="Views" value={(video as any)?.views || 0} color="bg-blue-500" />
                        <KPICard icon={Heart} label="Likes" value={(video as any)?.likes || 0} color="bg-pink-500" />
                        <KPICard icon={MessageCircle} label="Comments" value={(video as any)?.comments_count || 0} color="bg-purple-500" />
                    </div>

                    {/* Chart */}
                    <div className="glass-card p-6 rounded-2xl border border-gray-800">
                        <h3 className="text-lg font-bold mb-6">Engagement Timeline</h3>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                    <XAxis dataKey="name" stroke="#666" tickLine={false} axisLine={false} />
                                    <YAxis stroke="#666" tickLine={false} axisLine={false} />
                                    <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }} itemStyle={{ color: '#fff' }} />
                                    <Area type="monotone" dataKey="views" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#colorViews)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Recent Comments (Mock) */}
                    <div className="bg-surface rounded-xl border border-gray-800 p-6">
                        <h3 className="text-lg font-bold mb-4">Recent Comments</h3>
                        <div className="text-center py-8 text-gray-500 text-sm">
                            No comments yet. Be the first to engage!
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

function KPICard({ icon: Icon, label, value, color }: any) {
    return (
        <div className="bg-surface p-5 rounded-xl border border-gray-800 flex items-center gap-4">
            <div className={`p-3 rounded-lg ${color} bg-opacity-10 text-${color.split('-')[1]}-400`}>
                <Icon className="w-6 h-6" />
            </div>
            <div>
                <p className="text-gray-500 text-xs uppercase font-bold tracking-wider">{label}</p>
                <p className="text-2xl font-bold text-white">{value}</p>
            </div>
        </div>
    )
}
