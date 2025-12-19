import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Loader2, Play, Save, AlertCircle, Wand2, ArrowLeft } from 'lucide-react';

export default function GenerateVideo() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const generateVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt) return;
    
    setLoading(true);
    setError(null);
    setPrediction(null);
    setStatus('starting');

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_URL}/api/generate-video`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);
      
      setPrediction(data);
      pollStatus(data.id);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
      setStatus(null);
    }
  };

  const pollStatus = async (id: string) => {
    const interval = setInterval(async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const res = await fetch(`${API_URL}/api/generate-video/${id}`);
        const data = await res.json();
        
        if (data.status === 'succeeded') {
          clearInterval(interval);
          setPrediction(data);
          setLoading(false);
          setStatus('completed');
        } else if (data.status === 'failed') {
          clearInterval(interval);
          setError('Generation failed');
          setLoading(false);
          setStatus('failed');
        } else {
          setPrediction(data);
          setStatus(data.status);
        }
      } catch (err) {
        clearInterval(interval);
        setLoading(false);
      }
    }, 3000);
  };

  const saveToLibrary = async () => {
    if (!prediction?.output?.[0] || !user) return;

    try {
      // For now, we save the replicated URL directly. 
      // In production, you'd want to upload this to Cloudinary first to persist it.
      const videoUrl = prediction.output[0];

      const { error } = await supabase.from('videos').insert({
        user_id: user.id,
        video_url: videoUrl,
        public_id: `ai_${Date.now()}`, // Placeholder ID
        title: prompt.slice(0, 50),
        topic: 'AI Generated',
        tone: 'Creative',
        description: prompt,
        status: 'ready'
      });

      if (error) throw error;
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="w-full text-white pb-12 relative flex flex-col items-center">
       {/* Background Effects */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,rgba(124,58,237,0.1),transparent_50%)]" />

      <div className="w-full max-w-4xl relative z-10">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-400 hover:text-white mb-6">
            <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <header className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 bg-primary-500/10 border border-primary-500/20 px-3 py-1 rounded-full text-primary-300 text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            <span>AI Powered Generation</span>
          </div>
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-purple-200 to-white">
            Transform Text to Video
          </h1>
          <p className="text-gray-400 mt-2 max-w-lg mx-auto">
            Describe your vision and let our advanced AI engine bring it to life in seconds.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="space-y-6">
            <form onSubmit={generateVideo} className="glass-card p-6 space-y-4">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Your Prompt</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="A cinematic drone shot of a futuristic cyberpunk city with neon lights and flying cars, 4k, realistic..."
                className="input-field min-h-[160px] resize-none text-lg"
                disabled={loading}
              />
              
              <div className="flex gap-3">
                 <button
                  type="submit"
                  disabled={loading || !prompt}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-5 h-5" />
                      Generate Video
                    </>
                  )}
                </button>
              </div>
            </form>

            {error && (
              <div className="glass-card p-4 border-red-500/30 bg-red-500/10 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-red-200 text-sm">{error}</p>
              </div>
            )}
          </div>

          {/* Preview Section */}
          <div className="glass-card p-6 flex flex-col min-h-[400px]">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Preview Result</label>
            
            <div className="flex-1 bg-black/50 rounded-xl overflow-hidden border border-gray-800 relative group flex items-center justify-center">
              {prediction?.output && status === 'completed' ? (
                <video 
                  src={prediction.output[0]} 
                  controls 
                  className="w-full h-full object-contain"
                  autoPlay
                  loop
                />
              ) : loading ? (
                 <div className="text-center space-y-4">
                    <div className="relative w-20 h-20 mx-auto">
                       <div className="absolute inset-0 border-4 border-primary-500/30 rounded-full"></div>
                       <div className="absolute inset-0 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-lg capitalize">{status}...</h3>
                      <p className="text-gray-500 text-sm">This usually takes about 2-3 minutes.</p>
                    </div>
                    {prediction?.logs && (
                       <div className="text-xs text-gray-600 font-mono mt-4 max-w-xs mx-auto truncate opacity-50">
                         {prediction.logs.split('\n').pop()}
                       </div>
                    )}
                 </div>
              ) : (
                <div className="text-center text-gray-600">
                  <Play className="w-16 h-16 mx-auto mb-4 opacity-20" />
                  <p>Your generated video will appear here.</p>
                </div>
              )}
            </div>

            {status === 'completed' && (
              <div className="mt-4 flex justify-end">
                <button 
                  onClick={saveToLibrary}
                  className="btn-secondary flex items-center gap-2 hover:bg-green-500/10 hover:text-green-400 hover:border-green-500/50"
                >
                  <Save className="w-4 h-4" />
                  Save to Library
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
