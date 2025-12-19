import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Upload, Loader2, FileVideo, CheckCircle2, AlertCircle, ArrowLeft, X } from 'lucide-react';

const TOPICS = ['Fitness', 'Cooking', 'Tech', 'Travel', 'Education', 'Lifestyle', 'Business', 'Other'];
const TONES = ['Funny', 'Professional', 'Inspirational', 'Casual', 'Dramatic', 'Educational'];

export default function UploadVideo() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [file, setFile] = useState<File | null>(null);
  const [topic, setTopic] = useState(TOPICS[0]);
  const [tone, setTone] = useState(TONES[0]);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const files = e.dataTransfer.files;
    if (files?.[0]?.type.startsWith('video/')) {
      setFile(files[0]);
      setError(null);
    } else {
      setError('Please upload a valid video file (MP4, MOOV, etc)');
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const uploadToCloudinary = async (fileToUpload: File) => {
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      throw new Error('Cloudinary configuration missing');
    }

    const formData = new FormData();
    formData.append('file', fileToUpload);
    formData.append('upload_preset', uploadPreset);
    formData.append('folder', 'video-automation');

    const xhr = new XMLHttpRequest();
    
    return new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
      xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percentComplete = Math.round((e.loaded / e.total) * 100);
          setUploadProgress(percentComplete);
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          resolve(response);
        } else {
          try {
            const errorResp = JSON.parse(xhr.responseText);
            reject(new Error(errorResp.error?.message || 'Upload failed'));
          } catch {
            reject(new Error('Upload failed'));
          }
        }
      };

      xhr.onerror = () => reject(new Error('Network error during upload'));
      xhr.send(formData);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !user) return;

    setLoading(true);
    setError(null);

    try {
      const { secure_url, public_id } = await uploadToCloudinary(file);

      const { error: dbError } = await supabase
        .from('videos')
        .insert({
          user_id: user.id,
          video_url: secure_url,
          public_id: public_id,
          title: file.name,
          topic,
          tone,
          description,
          status: 'ready'
        });

      if (dbError) throw dbError;

      navigate('/');
    } catch (err: any) {
      console.error('Upload Error:', err);
      setError(err.message || 'Something went wrong');
      setLoading(false);
    }
  };

  return (
    <div className="w-full text-white pb-12 flex flex-col items-center relative">
       {/* Background Glow */}
      <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-primary-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-3xl relative z-10">
        <header className="flex flex-col items-start gap-4 mb-8">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-400 hover:text-white">
              <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">Upload New Video</h1>
            <p className="text-gray-400 text-sm">Categorize your video to help our AI engine.</p>
          </div>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Enhanced Dropzone */}
          <div 
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={`
              relative border-2 border-dashed rounded-2xl p-12 transition-all duration-300 group cursor-pointer
              bg-surface/50 backdrop-blur-sm
              ${file 
                ? 'border-green-500/50 bg-green-500/5 shadow-[0_0_30px_rgba(34,197,94,0.1)]' 
                : 'border-gray-700 hover:border-primary-500 hover:bg-surface hover:shadow-[0_0_30px_rgba(124,58,237,0.1)]'
              }
            `}
          >
            <input 
              type="file" 
              accept="video/*" 
              onChange={handleFileSelect} 
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
              disabled={loading}
            />
            
            <div className="flex flex-col items-center justify-center text-center relative z-10">
              {loading ? (
                <div className="flex flex-col items-center">
                  <div className="relative w-20 h-20 mb-4">
                     <svg className="w-full h-full" viewBox="0 0 100 100">
                       <circle className="text-gray-700 stroke-current" strokeWidth="8" cx="50" cy="50" r="40" fill="transparent"></circle>
                       <circle className="text-primary-500 progress-ring__circle stroke-current" strokeWidth="8" strokeLinecap="round" cx="50" cy="50" r="40" fill="transparent" strokeDasharray={`${uploadProgress * 2.51} 251.2`}></circle>
                     </svg>
                     <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">{uploadProgress}%</div>
                  </div>
                  <p className="text-primary-300 font-medium animate-pulse">Uploading to cloud...</p>
                </div>
              ) : file ? (
                <div className="animate-fade-in">
                  <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileVideo className="w-8 h-8 text-green-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-1">{file.name}</h3>
                  <p className="text-sm text-gray-400 mb-4">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                  <button 
                    type="button" 
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setFile(null); }} 
                    className="px-4 py-2 bg-red-500/10 text-red-300 rounded-lg hover:bg-red-500/20 text-sm font-medium transition flex items-center gap-2 mx-auto relative z-30"
                  >
                    <X className="w-4 h-4" /> Remove
                  </button>
                </div>
              ) : (
                <>
                  <div className="w-20 h-20 rounded-full bg-gray-800 flex items-center justify-center mb-6 group-hover:scale-110 transition duration-300 shadow-xl shadow-black/50">
                    <Upload className="w-10 h-10 text-gray-400 group-hover:text-primary-400 transition" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-200 mb-2">Drag video to upload</h3>
                  <p className="text-gray-500 text-sm max-w-xs mx-auto">Support for MP4, MOV, and WebM up to 100MB.</p>
                </>
              )}
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-3 text-red-300 bg-red-500/10 border border-red-500/20 p-4 rounded-xl animate-fade-in">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Details Form Card */}
          <div className="glass-card p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Video Topic</label>
                <div className="relative">
                  <select 
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="input-field appearance-none cursor-pointer hover:border-gray-700"
                  >
                    {TOPICS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Tone & Style</label>
                <div className="relative">
                  <select 
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    className="input-field appearance-none cursor-pointer hover:border-gray-700"
                  >
                    {TONES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Description / Script</label>
              <textarea 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="input-field resize-none"
                placeholder="What is this video about? Paste your script or add a short description..."
              />
              <p className="text-xs text-gray-500 text-right">0/500 characters</p>
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <button 
              type="button" 
              onClick={() => navigate('/')}
              className="btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={!file || loading}
              className="btn-primary px-8 flex items-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
              Save & Process
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
