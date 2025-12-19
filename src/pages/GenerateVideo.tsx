import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Loader2, Play, AlertCircle, Wand2, ArrowLeft, RefreshCw, Plus, Calendar } from 'lucide-react';

export default function GenerateVideo() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  // Unified Flow State
  const [videoSession, setVideoSession] = useState<string[]>([]); // URLs of clips in order
  const [currentResultUrl, setCurrentResultUrl] = useState<string | null>(null); // The video currently being previewed (could be single or stitched)

  // Auto-Merge Effect: When videoSession changes (and has > 1 clips), auto-merge them.
  useEffect(() => {
    if (videoSession.length > 1) {
       autoMerge(videoSession);
    } else if (videoSession.length === 1) {
       setCurrentResultUrl(videoSession[0]);
    }
  }, [videoSession]);

  const generateVideo = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt) return;
    
      setLoading(true);
      setError(null);
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
          setLoading(false);
          setStatus('completed');
          
          // Successful generation! Add to session.
          // Note: If we are "Recreating", we should replace the last one? 
          // For simplicity in this "Addon" flow: 
          // 1. If it's the FIRST video, just set the session.
          // 2. If it's an ADDON, push to session.
          // We need to distinguish "Initial" vs "Addon".
          // BUT, `videoSession` is our source of truth.
          const newUrl = data.output[0];
          setVideoSession(prev => [...prev, newUrl]);

        } else if (data.status === 'failed') {
          clearInterval(interval);
          setError('Generation failed');
          setLoading(false);
          setStatus('failed');
        } else {
          setStatus(data.status);
        }
      } catch (err) {
        clearInterval(interval);
        setLoading(false);
      }
    }, 3000);
  };

  const autoMerge = async (urls: string[]) => {
      setLoading(true);
      setStatus('merging');
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const response = await fetch(`${API_URL}/api/stitch-videos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ videoUrls: urls })
        });
        const data = await response.json();
        if (data.error) throw new Error(data.error);
        
        // Update the PREVIEW to show the merged result, but keep the session clips intact
        setCurrentResultUrl(data.url); 

      } catch (err: any) {
          setError("Merge failed: " + err.message);
      } finally {
          setLoading(false);
          setStatus('completed');
      }
  };

  // Button Handlers
  const handleRecreate = () => {
      // Remove the last added video from session so we can try again
      setVideoSession(prev => prev.slice(0, -1));
      setCurrentResultUrl(null);
      generateVideo(); // Re-run with SAME prompt
  };

  const handleAddOn = () => {
      // Current result is "locked" in session. 
      // We clear the prompt so user can type next scene.
      // But wait... actually, we want to KEEP the current preview until the new one is ready?
      // No, UI wise: We move to "Input Mode" again.
      setPrompt('');
      // currentResultUrl remains visible as context? Or clear it?
      // Let's clear it to show "Ready for next clip".
      // actually user wants to "put prompt" -> "finish".
      // "Addon" means "I want another clip". 
      // So we just clear prompt, and let them type new one.
      // The session state preserves the history.
  };

  const handlePost = async () => {
    if (!currentResultUrl || !user) return;
    
    // Save Final Video to DB
    const { data, error } = await supabase.from('videos').insert({
        user_id: user.id,
        video_url: currentResultUrl,
        public_id: `ai_gen_${Date.now()}`,
        title: prompt.slice(0, 50) || 'AI Generated Video', // Use last prompt as title?
        topic: 'AI Automation',
        status: 'ready'
    }).select().single();

    if (error) {
        setError("Failed to save: " + error.message);
        return;
    }

    // Redirect to Schedule page with this video selected
    navigate(`/schedule?videoId=${data.id}`);
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
            <span>AI Automation Workflow</span>
          </div>
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-purple-200 to-white">
            Create & Automate
          </h1>
          <p className="text-gray-400 mt-2 max-w-lg mx-auto">
            Generate clips, auto-stitch, and schedule in one flow.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="space-y-6">
            <div className="glass-card p-6 space-y-4">
              <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      {videoSession.length > 0 ? `Next Clip Prompt (Clip #${videoSession.length + 1})` : "Video Prompt"}
                  </label>
                  {videoSession.length > 0 && <span className="text-xs text-secondary-400">{videoSession.length} clips ready</span>}
              </div>
              
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={videoSession.length > 0 ? "Describe the next scene to append..." : "Describe your video vision..."}
                className="input-field min-h-[160px] resize-none text-lg"
                disabled={loading}
              />
              
              <div className="flex gap-3">
                 <button
                  onClick={() => generateVideo()}
                  disabled={loading || !prompt}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {status === 'merging' ? 'Auto-Stitching...' : 'Generating...'}
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-5 h-5" />
                      {videoSession.length > 0 ? 'Generate & Merge' : 'Generate Video'}
                    </>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="glass-card p-4 border-red-500/30 bg-red-500/10 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-red-200 text-sm">{error}</p>
              </div>
            )}
          </div>

          {/* Preview Section */}
          <div className="glass-card p-6 flex flex-col min-h-[400px]">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Live Result</label>
            
            <div className="flex-1 bg-black/50 rounded-xl overflow-hidden border border-gray-800 relative group flex items-center justify-center">
              {currentResultUrl && !loading ? (
                <video 
                  src={currentResultUrl} 
                  controls 
                  className="w-full h-full object-contain"
                  autoPlay
                  loop
                />
              ) : loading ? (
                 <div className="text-center space-y-4">
                    <Loader2 className="w-10 h-10 animate-spin text-primary-500 mx-auto" />
                    <div>
                      <h3 className="text-white font-bold text-lg capitalize">{status}...</h3>
                      <p className="text-gray-500 text-sm">AI is working its magic.</p>
                    </div>
                 </div>
              ) : (
                <div className="text-center text-gray-600">
                  <Play className="w-16 h-16 mx-auto mb-4 opacity-20" />
                  <p>Your generated video will appear here.</p>
                </div>
              )}
            </div>

            {/* Action Buttons (The "Three Button" Request) */}
            {currentResultUrl && !loading && (
              <div className="mt-4 grid grid-cols-3 gap-3">
                 {/* 1. Recreate */}
                <button 
                  onClick={handleRecreate}
                  className="py-2.5 rounded-lg border border-gray-700 hover:bg-gray-800 text-gray-300 flex flex-col items-center gap-1 text-xs transition"
                >
                  <RefreshCw className="w-4 h-4" />
                  Recreate
                </button>

                 {/* 2. Add-on */}
                <button 
                  onClick={handleAddOn}
                  className="py-2.5 rounded-lg border border-secondary-500/30 bg-secondary-500/10 hover:bg-secondary-500/20 text-secondary-400 flex flex-col items-center gap-1 text-xs transition"
                >
                  <Plus className="w-4 h-4" />
                  Add Clip
                </button>

                 {/* 3. Post */}
                <button 
                  onClick={handlePost}
                  className="py-2.5 rounded-lg bg-primary-600 hover:bg-primary-500 text-white shadow-lg shadow-primary-600/20 flex flex-col items-center gap-1 text-xs font-semibold transition"
                >
                  <Calendar className="w-4 h-4" />
                  Post Now
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
