import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Loader2, Scissors, Check, Layers, ArrowLeft } from 'lucide-react';

interface VideoData {
  id: string;
  title: string;
  video_url: string;
  topic?: string;
  duration?: number;
}

export default function VideoStudio() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [videos, setVideos] = useState<VideoData[]>([]);
  const [selectedVideos, setSelectedVideos] = useState<string[]>([]); // Array of IDs
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLibrary();
  }, [user]);

  const fetchLibrary = async () => {
    setLoading(true);
    const { data } = await supabase.from('videos').select('*').order('created_at', { ascending: false });
    if (data) setVideos(data);
    setLoading(false);
  };

  const toggleSelection = (id: string) => {
    if (selectedVideos.includes(id)) {
      setSelectedVideos(selectedVideos.filter(v => v !== id));
    } else {
      setSelectedVideos([...selectedVideos, id]);
    }
  };

  const handleStitch = async () => {
    if (selectedVideos.length < 2) return;
    setProcessing(true);
    setError(null);

    try {
      // Get URLs for selected videos, maintaining selection order if possible
      // (For now, just finding them in the list)
      const selectedVideoData = selectedVideos
        .map(id => videos.find(v => v.id === id))
        .filter(v =>  !!v) as VideoData[];
      
      const videoUrls = selectedVideoData.map(v => v.video_url);

      const response = await fetch('http://localhost:5000/api/stitch-videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoUrls })
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      // Save to Supabase
      const { error: dbError } = await supabase.from('videos').insert({
        user_id: user?.id,
        video_url: data.url,
        public_id: data.public_id,
        title: `Merged Video (${selectedVideos.length} clips)`,
        topic: 'Compilation',
        tone: 'Mixed',
        status: 'ready'
      });

      if (dbError) throw dbError;

      navigate('/');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to merge videos');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="w-full text-white pb-12">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-400 hover:text-white mb-6">
          <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <header className="flex justify-between items-end mb-10">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-pink-500/10 rounded-lg">
                <Scissors className="w-5 h-5 text-pink-500" />
            </div>
            <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-purple-500">
                Video Studio
            </h2>
          </div>
          <p className="text-gray-400">Select clips to merge into a single compilation.</p>
        </div>
        
        <button 
          onClick={handleStitch}
          disabled={selectedVideos.length < 2 || processing}
          className="btn-primary flex items-center gap-2 disabled:grayscale"
        >
          {processing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing...
              </>
          ) : (
              <>
                <Layers className="w-5 h-5" />
                Merge {selectedVideos.length} Clips
              </>
          )}
        </button>
      </header>
      
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-300 p-4 rounded-xl mb-8">
            {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {videos.map(video => {
                const isSelected = selectedVideos.includes(video.id);
                return (
                    <div 
                        key={video.id}
                        onClick={() => toggleSelection(video.id)}
                        className={`
                            relative group cursor-pointer rounded-xl overflow-hidden border-2 transition-all duration-200
                            ${isSelected ? 'border-pink-500 ring-2 ring-pink-500/30' : 'border-gray-800 hover:border-gray-600'}
                        `}
                    >
                        <div className="aspect-video bg-black relative">
                            <video src={video.video_url} className="w-full h-full object-cover opacity-80" />
                            {isSelected && (
                                <div className="absolute inset-0 bg-pink-500/20 flex items-center justify-center backdrop-blur-sm animate-fade-in">
                                    <div className="bg-pink-500 rounded-full p-2">
                                        <Check className="w-6 h-6 text-white" />
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="p-3 bg-surface">
                            <p className="text-sm font-medium truncate text-gray-200">{video.title || 'Untitled'}</p>
                            <p className="text-xs text-gray-500 mt-1">{video.topic}</p>
                        </div>
                        
                        {/* Index Badge */}
                        {isSelected && (
                            <div className="absolute top-2 right-2 bg-pink-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-lg">
                                {selectedVideos.indexOf(video.id) + 1}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
      )}
    </div>
  );
}
