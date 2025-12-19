import { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { Eye, Heart, Share2, TrendingUp, Users, ArrowUpRight, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface VideoData {
    id: string;
    title: string;
    views: number;
    likes: number;
    platform?: string;
    created_at: string;
}

interface PlatformStat {
  name: string;
  value: number;
  color: string;
}

interface ChartData {
    name: string;
    views: number;
}

export default function Analytics() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // State
  const [totalViews, setTotalViews] = useState(0);
  const [totalLikes, setTotalLikes] = useState(0);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [platformData, setPlatformData] = useState<PlatformStat[]>([]);
  const [topVideos, setTopVideos] = useState<VideoData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
      setLoading(true);
      try {
          // 1. Fetch Key Stats (Views & Likes)
          const { data: videos } = await supabase.from('videos').select('views, likes, id, title').order('views', { ascending: false });
          
          if (videos) {
              const views = videos.reduce((acc, curr) => acc + (curr.views || 0), 0);
              const likes = videos.reduce((acc, curr) => acc + (curr.likes || 0), 0);
              setTotalViews(views);
              setTotalLikes(likes);
              
              // Top 5 Videos (Base)
              setTopVideos(videos.slice(0, 5) as any);
          }

          // 2. Fetch Chart Data (Daily Stats)
          const { data: dailyStats } = await supabase.from('daily_stats').select('date, views').order('date', { ascending: true }).limit(7);
          
          if (dailyStats && dailyStats.length > 0) {
             const formattedChart = dailyStats.map(stat => ({
                 name: new Date(stat.date).toLocaleDateString('en-US', { weekday: 'short' }),
                 views: stat.views
             }));
             setChartData(formattedChart);
          } else {
              // Fallback empty chart if no data yet
             const empty = Array.from({length: 7}, (_, i) => {
                 const d = new Date();
                 d.setDate(d.getDate() - (6 - i));
                 return { name: d.toLocaleDateString('en-US', { weekday: 'short' }), views: 0 };
             });
             setChartData(empty);
          }

        // 3. Fetch Platform Data & Join Top Videos Platform info
        // We need to know which platform each video was scheduled to.
        const { data: posts } = await supabase.from('scheduled_posts').select('video_id, platforms');
        
        const platformCounts: Record<string, number> = { Instagram: 0, TikTok: 0, YouTube: 0 };
        const videoPlatforms: Record<string, string> = {}; // Map video_id -> platform (first one found)

        if (posts) {
            posts.forEach(post => {
                const platforms = post.platforms as string[];
                if (Array.isArray(platforms)) {
                    platforms.forEach(p => {
                        const key = p.charAt(0).toUpperCase() + p.slice(1); // Capitalize
                        if (platformCounts[key] !== undefined) platformCounts[key]++;
                        else platformCounts[key] = 1;
                        
                        // Assign platform to video if not set
                        if (!videoPlatforms[post.video_id]) videoPlatforms[post.video_id] = key;
                    });
                }
            });
        }

        setPlatformData([
            { name: 'Instagram', value: platformCounts['Instagram'] || 0, color: '#E1306C' },
            { name: 'TikTok', value: platformCounts['TikTok'] || 0, color: '#00F2EA' },
            { name: 'YouTube', value: platformCounts['Youtube'] || 0, color: '#FF0000' }, // Note: check capitalization in DB usually 'youtube'
        ]);

        // Enrich Top Videos with Platform info
        if (videos) {
            const enrichedTop = videos.slice(0, 5).map(v => ({
                ...v,
                platform: videoPlatforms[v.id] || 'N/A'
            }));
            setTopVideos(enrichedTop as any);
        }

      } catch (error) {
          console.error("Error fetching analytics:", error);
      } finally {
          setLoading(false);
      }
  };

  return (
    <div className="w-full text-white pb-12">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-400 hover:text-white mb-6">
          <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <header className="mb-10">
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500 mb-2">
            Performance Analytics
        </h1>
        <p className="text-gray-400">Track your automation growth across channels.</p>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <KPICard icon={Eye} label="Total Views" value={totalViews.toLocaleString()} trend="+12%" color="bg-blue-500" />
        <KPICard icon={Heart} label="Total Likes" value={totalLikes.toLocaleString()} trend="+5%" color="bg-pink-500" />
        <KPICard icon={Share2} label="Shares" value="0" trend="+0%" color="bg-green-500" />
        <KPICard icon={Users} label="Reach" value={ (totalViews * 1.2).toFixed(0) } trend="Est." color="bg-purple-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        {/* Main Chart */}
        <div className="lg:col-span-2 glass-card p-6 rounded-2xl border border-gray-800">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary-500" />
            Views Overview
          </h3>
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
                <YAxis stroke="#666" tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                <Tooltip 
                    contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                    itemStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="views" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#colorViews)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Platform Breakdown */}
        <div className="glass-card p-6 rounded-2xl border border-gray-800">
           <h3 className="text-lg font-bold mb-6">Platform Split</h3>
           <div className="h-[300px] w-full">
            {platformData.reduce((acc, curr) => acc + curr.value, 0) === 0 ? (
                <div className="h-full flex items-center justify-center text-gray-500 text-sm">
                    No posts scheduled yet.
                </div>
            ) : (
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={platformData} layout="vertical">
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" stroke="#999" width={70} tickLine={false} axisLine={false} />
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                            cursor={{fill: 'rgba(255,255,255,0.05)'}}
                        />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={30}>
                            {platformData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            )}
           </div>
        </div>
      </div>

      {/* Top Videos Table */}
      <div className="glass-card rounded-2xl border border-gray-800 overflow-hidden">
        <div className="p-6 border-b border-gray-800 flex justify-between items-center">
            <h3 className="text-lg font-bold">Top Performing Videos</h3>
            <button className="text-sm text-primary-400 hover:text-primary-300 flex items-center gap-1">
                View All <ArrowUpRight className="w-4 h-4" />
            </button>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-gray-900/50 text-gray-400 text-xs uppercase tracking-wider">
                    <tr>
                        <th className="px-6 py-4">Video Title</th>
                        <th className="px-6 py-4">Platform</th>
                        <th className="px-6 py-4">Views</th>
                        <th className="px-6 py-4">Likes</th>
                        <th className="px-6 py-4">Performance</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                    {topVideos.map((video) => (
                        <tr key={video.id} className="hover:bg-gray-800/30 transition">
                            <td className="px-6 py-4 font-medium text-white max-w-[200px] truncate" title={video.title}>{video.title || 'Untitled'}</td>
                            <td className="px-6 py-4">
                                <span className={`
                                    px-2 py-1 rounded text-xs font-medium 
                                    ${video.platform === 'TikTok' ? 'bg-[#00F2EA]/10 text-[#00F2EA]' : 
                                      video.platform === 'Instagram' ? 'bg-[#E1306C]/10 text-[#E1306C]' : 
                                      video.platform === 'Youtube' ? 'bg-red-500/10 text-red-500' : 'bg-gray-700/50 text-gray-400'}
                                `}>
                                    {video.platform || 'Unposted'}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-gray-300">{video.views}</td>
                            <td className="px-6 py-4 text-gray-300">{video.likes}</td>
                            <td className="px-6 py-4">
                                <div className="w-24 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                     {/* Simple normalization: view count / 100 max out at 100% just for visuals, or relative to max view */}
                                    <div className="h-full bg-green-500 rounded-full" style={{ width: `${Math.min((video.views / (topVideos[0]?.views || 1)) * 100, 100)}%` }}></div>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {topVideos.length === 0 && (
                <div className="p-8 text-center text-gray-500">No videos found.</div>
            )}
        </div>
      </div>
    </div>
  );
}

function KPICard({ icon: Icon, label, value, trend, color }: any) {
    return (
        <div className="glass-card p-6 flex items-center gap-4 border border-gray-800 group hover:border-gray-700 transition">
            <div className={`p-3 rounded-xl ${color} bg-opacity-10 text-${color.split('-')[1]}-500 group-hover:scale-110 transition duration-300`}>
                <Icon className="w-6 h-6" />
            </div>
            <div>
                <p className="text-gray-400 text-sm mb-1">{label}</p>
                <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-white">{value}</span>
                    <span className="text-xs text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded">{trend}</span>
                </div>
            </div>
        </div>
    )
}
