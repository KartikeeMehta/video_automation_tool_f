import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Loader2, Calendar, Instagram, Youtube, Clock, CheckCircle2, Repeat, ArrowRight, ArrowLeft } from 'lucide-react';

interface VideoData {
  id: string;
  title: string;
  video_url: string;
  topic?: string;
}

export default function SchedulePost() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [videos, setVideos] = useState<VideoData[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<VideoData | null>(null);
  
  const [platforms, setPlatforms] = useState<string[]>([]); // 'instagram', 'tiktok', 'youtube'
  const [caption, setCaption] = useState('');
  const [hashtags, setHashtags] = useState('');
  
  // Scheduling State
  const [startDate, setStartDate] = useState('');
  const [frequency, setFrequency] = useState('once'); // 'once', 'daily', 'weekly', 'monthly'
  const [endDate, setEndDate] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLibrary();
  }, [user]);

  const fetchLibrary = async () => {
    const { data } = await supabase.from('videos').select('*').order('created_at', { ascending: false });
    if (data) {
        setVideos(data);
        if (data.length > 0) setSelectedVideo(data[0]);
    }
  };

  const togglePlatform = (p: string) => {
    if (platforms.includes(p)) setPlatforms(platforms.filter(x => x !== p));
    else setPlatforms([...platforms, p]);
  };

  // Generate Preview Dates
  const getProjectedDates = () => {
      if (!startDate) return [];
      
      const dates: Date[] = [];
      const start = new Date(startDate);
      const end = endDate ? new Date(endDate) : new Date(startDate);
      
      // If 'once', just return start
      if (frequency === 'once') return [start];

      let current = new Date(start);
      // Safety limit: Max 50 posts to prevent infinite loops or spam
      let count = 0; 
      
      while (current <= end && count < 50) {
          dates.push(new Date(current));
          
          if (frequency === 'daily') current.setDate(current.getDate() + 1);
          if (frequency === 'weekly') current.setDate(current.getDate() + 7);
          if (frequency === 'monthly') current.setMonth(current.getMonth() + 1);
          
          count++;
      }
      return dates;
  };

  const projectedDates = getProjectedDates();

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVideo || platforms.length === 0 || !startDate || !user) {
        setError("Please fill in all fields.");
        return;
    }

    if (frequency !== 'once' && !endDate) {
        setError("Please select an end date for recurring posts.");
        return;
    }
    
    setLoading(true);
    setError(null);

    try {
        const datesToSchedule = getProjectedDates();
        
        // Prepare rows for batch insert
        const rows = datesToSchedule.map(date => ({
            user_id: user.id,
            video_id: selectedVideo.id,
            platforms: platforms, // Auto-converted to JSONB by Supabase JS if passed as array? No, simpler to pass directly or verify types. Supabase JS handles arrays for JSON types usually.
            caption,
            hashtags,
            scheduled_time: date.toISOString(),
            status: 'scheduled'
        }));

        console.log('Scheduling Posts:', rows);

        // Batch Insert
        const { error: dbError } = await supabase.from('scheduled_posts').insert(rows);

        if (dbError) throw dbError;

        navigate('/'); 

    } catch (err: any) {
        console.error(err);
        setError(err.message);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="w-full text-white pb-12 flex flex-col items-center">
       <div className="w-full max-w-6xl">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-400 hover:text-white mb-6">
            <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <header className="mb-10">
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                <Calendar className="w-8 h-8 text-primary-500" />
                Schedule Post
            </h1>
            <p className="text-gray-400">Automate your content calendar across platforms.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Left: Configuration */}
            <form onSubmit={handleSchedule} className="space-y-8">
                {/* 1. Select Video */}
                <div className="space-y-3">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">1. Select Video</label>
                    {videos.length === 0 ? (
                        <p className="text-gray-500 italic">No videos found. Upload one first.</p>
                    ) : (
                        <div className="grid grid-cols-3 gap-3 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                            {videos.map(v => (
                                <div 
                                    key={v.id}
                                    onClick={() => setSelectedVideo(v)}
                                    className={`
                                        cursor-pointer rounded-lg border-2 overflow-hidden relative aspect-video group
                                        ${selectedVideo?.id === v.id ? 'border-primary-500 ring-2 ring-primary-500/30' : 'border-gray-800 hover:border-gray-600'}
                                    `}
                                >
                                    <video src={v.video_url} className="w-full h-full object-cover" />
                                    {selectedVideo?.id === v.id && (
                                        <div className="absolute inset-0 bg-primary-500/20 flex items-center justify-center">
                                            <CheckCircle2 className="w-6 h-6 text-white bg-primary-500 rounded-full" />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* 2. Platforms */}
                <div className="space-y-3">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">2. Choose Platforms</label>
                    <div className="flex gap-4">
                        <PlatformButton 
                            label="Instagram" 
                            icon={Instagram} 
                            active={platforms.includes('instagram')} 
                            onClick={() => togglePlatform('instagram')} 
                        />
                        <PlatformButton 
                            label="TikTok" 
                            icon={({className}: {className?: string}) => <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/></svg>} 
                            active={platforms.includes('tiktok')} 
                            onClick={() => togglePlatform('tiktok')} 
                        />
                         <PlatformButton 
                            label="YouTube Shorts" 
                            icon={Youtube} 
                            active={platforms.includes('youtube')} 
                            onClick={() => togglePlatform('youtube')} 
                        />
                    </div>
                </div>

                {/* 3. Details */}
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">3. Caption</label>
                        <textarea 
                            value={caption}
                            onChange={(e) => setCaption(e.target.value)}
                            className="input-field min-h-[100px] resize-none"
                            placeholder="Write a catchy caption..."
                        />
                        <div className="flex justify-between text-xs text-gray-500">
                             <span>{caption.length} chars</span>
                             <span>Max 2200</span>
                        </div>
                    </div>
                    
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Hashtags</label>
                        <input 
                            value={hashtags}
                            onChange={(e) => setHashtags(e.target.value)}
                            className="input-field text-primary-300"
                            placeholder="#viral #trending #fyp"
                        />
                    </div>
                </div>
                
                {/* 4. Time & Recurrence (MILESTONE 10) */}
                <div className="space-y-4 p-5 bg-surface rounded-xl border border-gray-800">
                     <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                         <Repeat className="w-4 h-4 text-primary-500" />    
                         4. Schedule & Repeat
                     </label>
                     
                     <div className="grid grid-cols-2 gap-4">
                        <div className="relative">
                            <label className="text-xs text-gray-500 mb-1 block">Start Date & Time</label>
                            <input 
                                type="datetime-local" 
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="input-field"
                                min={new Date().toISOString().slice(0, 16)}
                            />
                        </div>

                        <div>
                             <label className="text-xs text-gray-500 mb-1 block">Frequency</label>
                             <select 
                                value={frequency}
                                onChange={(e) => setFrequency(e.target.value)}
                                className="input-field appearance-none cursor-pointer"
                             >
                                 <option value="once">Does not repeat</option>
                                 <option value="daily">Daily</option>
                                 <option value="weekly">Weekly</option>
                                 <option value="monthly">Monthly</option>
                             </select>
                        </div>
                     </div>

                     {/* End Date (Conditional) */}
                     {frequency !== 'once' && (
                        <div className="animate-in fade-in slide-in-from-top-2">
                             <label className="text-xs text-gray-500 mb-1 block">End Date</label>
                             <input 
                                type="date" 
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="input-field"
                                min={startDate ? startDate.slice(0, 10) : new Date().toISOString().slice(0, 10)}
                            />
                            <div className="mt-4 p-3 bg-gray-900/50 rounded-lg border border-gray-800">
                                <p className="text-xs text-gray-400 mb-2">Schedule Preview ({projectedDates.length} posts):</p>
                                <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                                    {projectedDates.map((d, i) => (
                                        <span key={i} className="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded">
                                            {d.toLocaleDateString()} {d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                     )}
                </div>

                {error && <p className="text-red-400 text-sm bg-red-500/10 p-3 rounded-lg border border-red-500/20">{error}</p>}

                <button 
                    type="submit" 
                    disabled={loading}
                    className="btn-primary w-full py-4 flex items-center justify-center gap-2 text-lg shadow-lg shadow-primary-500/20 hover:shadow-primary-500/40 transition-all"
                >
                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Calendar className="w-6 h-6" />}
                    Confirm Schedule ({projectedDates.length})
                </button>
            </form>

            {/* Right: Live Preview */}
            <div className="hidden lg:block">
                <div className="sticky top-10">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 text-center">Live Preview</h3>
                    
                    {/* Phone Mockup */}
                    <div className="w-[320px] mx-auto bg-black border-[12px] border-gray-800 rounded-[3rem] overflow-hidden shadow-2xl relative h-[650px]">
                        {/* Notch */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-gray-800 rounded-b-xl z-20"></div>
                        
                        {/* Status Bar */}
                        <div className="absolute top-2 right-5 z-20 flex gap-1">
                            <div className="w-4 h-2 bg-white rounded-sm"></div>
                            <div className="w-3 h-2 bg-white rounded-sm"></div>
                        </div>

                        {/* Content */}
                        <div className="h-full w-full bg-gray-900 flex flex-col relative">
                           {/* Video Area */}
                           <div className="flex-1 bg-black relative flex items-center justify-center overflow-hidden">
                                {selectedVideo ? (
                                    <video src={selectedVideo.video_url} className="w-full h-full object-cover" autoPlay muted loop />
                                ) : (
                                    <div className="text-gray-600 text-center p-8">
                                        <div className="w-16 h-16 border-2 border-gray-700 rounded-full flex items-center justify-center mx-auto mb-2">
                                            <div className="w-12 h-12 bg-gray-800 rounded-full"></div>
                                        </div>
                                        <p className="text-sm">Select a video to preview</p>
                                    </div>
                                )}
                                
                                {/* UI Overlay (Instagram Style) */}
                                <div className="absolute bottom-4 left-4 right-16 text-white text-sm z-10 space-y-2">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-8 h-8 bg-gradient-to-tr from-yellow-400 to-purple-600 rounded-full" />
                                        <span className="font-bold text-sm">your_account</span>
                                    </div>
                                    <p className="line-clamp-2 text-xs opacity-90">
                                        <span className="font-semibold mr-1">your_account</span>
                                        {caption || 'Your caption will appear here...'}
                                    </p>
                                    <p className="text-blue-300 text-xs">{hashtags}</p>
                                </div>
                                
                                {/* Side Icons */}
                                <div className="absolute bottom-20 right-2 flex flex-col gap-6 items-center">
                                    <div className="w-8 h-8 bg-gray-800/50 rounded-full" />
                                    <div className="w-8 h-8 bg-gray-800/50 rounded-full" />
                                    <div className="w-8 h-8 bg-gray-800/50 rounded-full" />
                                </div>
                           </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
       </div>
    </div>
  );
}

function PlatformButton({ label, icon: Icon, active, onClick }: { label: string, icon: any, active: boolean, onClick: () => void }) {
    return (
        <button 
            type="button"
            onClick={onClick}
            className={`
                flex-1 py-3 px-2 rounded-xl border flex flex-col items-center gap-2 transition-all duration-200
                ${active 
                    ? 'bg-surface border-primary-500 text-white shadow-lg shadow-primary-500/20 scale-105' 
                    : 'bg-surface/50 border-gray-700 text-gray-400 hover:border-gray-500 hover:bg-surface'
                }
            `}
        >
            <Icon className={`w-6 h-6 ${active ? 'text-primary-400' : 'grayscale opacity-70'}`} />
            <span className="text-xs font-medium">{label}</span>
        </button>
    )
}
