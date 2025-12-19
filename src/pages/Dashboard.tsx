import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Video, Play, Trash2, Search } from 'lucide-react';

interface VideoData {
  id: string;
  title: string;
  video_url: string;
  topic: string;
  tone: string;
  created_at: string;
  status: string;
}



export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [videos, setVideos] = useState<VideoData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVideos();
  }, [user]);

  const fetchVideos = async () => {
    try {
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVideos(data || []);
    } catch (error) {
      console.error('Error fetching videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this video?')) return;

    try {
      const { error } = await supabase.from('videos').delete().match({ id });
      if (error) throw error;
      setVideos(videos.filter(v => v.id !== id));
    } catch (error) {
      console.error('Error deleting video:', error);
    }
  };

  return (
    <div className="w-full">
      {/* Dashboard Stats & Content */}

        {/* Stats Row (Real Data) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <StatCard 
            label="Uploaded Videos" 
            value={videos.length.toString()} 
            trend={`${videos.filter(v => new Date(v.created_at) > new Date(Date.now() - 7*86400000)).length} new this week`} 
          />
          <StatCard 
            label="Total Views" 
            value={videos.reduce((acc, curr: any) => acc + (curr.views || 0), 0).toLocaleString()} 
            trend="Real-time" 
          />
          <StatCard 
            label="Total Likes" 
            value={videos.reduce((acc, curr: any) => acc + (curr.likes || 0), 0).toLocaleString()} 
            trend="Real-time" 
          />
        </div>

        {/* Video Grid Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h3 className="text-xl font-bold text-white">Recent Videos</h3>
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Search library..." 
              className="bg-surface border border-gray-800 text-sm rounded-lg pl-10 pr-4 py-2 w-full sm:w-64 text-gray-300 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
             <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mb-4" />
             <p className="text-gray-500 text-sm">Loading your library...</p>
          </div>
        ) : videos.length === 0 ? (
          <div className="text-center py-24 bg-surface/30 rounded-2xl border border-dashed border-gray-800 hover:border-gray-700 transition">
            <div className="w-16 h-16 bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Video className="w-8 h-8 text-gray-600" />
            </div>
            <p className="text-gray-300 text-lg font-medium mb-1">Your library is empty</p>
            <p className="text-gray-500 text-sm mb-6">Upload your first video to get started with automation.</p>
            <button 
              onClick={() => navigate('/upload')}
              className="btn-secondary text-sm"
            >
              Upload Video
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {videos.map((video) => (
              <div 
                key={video.id} 
                className="group bg-surface rounded-xl overflow-hidden border border-gray-800 hover:border-primary-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-primary-900/10 cursor-pointer"
                onClick={() => navigate(`/video/${video.id}`)}
              >
                <div className="relative aspect-video bg-black overflow-hidden">
                  <video src={video.video_url} className="w-full h-full object-cover opacity-80 group-hover:opacity-60 transition duration-500 group-hover:scale-105" />
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-300 gap-4 bg-black/20">
                    <button className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-black transform scale-90 hover:scale-100 transition shadow-lg">
                      <Play className="w-5 h-5 fill-current ml-1" />
                    </button>
                  </div>

                  <div className="absolute top-3 left-3">
                    <span className={`px-2 py-1 rounded-md text-xs font-medium backdrop-blur-md ${video.status === 'ready' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-yellow-500/20 text-yellow-400'}`}>
                      {video.status}
                    </span>
                  </div>

                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition">
                     <button 
                      onClick={(e) => handleDelete(video.id, e)}
                      className="p-2 bg-black/60 hover:bg-red-500 text-white rounded-lg backdrop-blur-sm transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="p-5">
                  <h4 className="font-bold text-white truncate text-lg mb-1" title={video.title}>
                    {video.title}
                  </h4>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-xs font-medium text-primary-400 bg-primary-900/30 px-2 py-0.5 rounded border border-primary-500/20">
                      {video.topic}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center text-xs text-gray-500 pt-4 border-t border-gray-800">
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-gray-600 rounded-full" />
                      {video.tone} tone
                    </span>
                    <span>{new Date(video.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  );
}

function StatCard({ label, value, trend }: { label: string, value: string, trend: string }) {
  return (
    <div className="glass-card p-6 relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-24 h-24 bg-primary-500/10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-primary-500/20 transition duration-500" />
      <h3 className="text-gray-400 text-sm font-medium mb-2">{label}</h3>
      <div className="flex items-baseline gap-3">
        <p className="text-3xl font-bold text-white">{value}</p>
        <span className="text-xs text-green-400 bg-green-900/20 px-1.5 py-0.5 rounded border border-green-500/20">{trend}</span>
      </div>
    </div>
  );
}
