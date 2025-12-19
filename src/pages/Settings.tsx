import { useState, useEffect } from 'react';
import { Save, Clock, Calendar as CalendarIcon, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Settings() {
  const navigate = useNavigate();
  const [defaultTime, setDefaultTime] = useState('10:00');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('default_schedule_time');
    if (stored) setDefaultTime(stored);
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('default_schedule_time', defaultTime);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="w-full text-white pb-12">
       <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-400 hover:text-white mb-6">
            <ArrowLeft className="w-4 h-4" /> Back
        </button>

      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-gray-400">Manage your automation preferences.</p>
      </header>
      
      <div className="max-w-xl">
        <div className="glass-card p-6">
            <div className="flex items-center gap-2 mb-6 border-b border-gray-800 pb-4">
                <Clock className="w-5 h-5 text-primary-500" />
                <h2 className="text-lg font-semibold">Automation Defaults</h2>
            </div>
            
            <form onSubmit={handleSave} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Default Schedule Time</label>
                    <p className="text-xs text-gray-500 mb-3">Posts will natively default to this time when scheduling.</p>
                    <div className="relative">
                        <input 
                            type="time" 
                            value={defaultTime}
                            onChange={(e) => setDefaultTime(e.target.value)}
                            className="input-field pl-10"
                        />
                        <CalendarIcon className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    </div>
                </div>

                <button 
                  type="submit" 
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                    <Save className="w-4 h-4" />
                    {saved ? 'Saved!' : 'Save Changes'}
                </button>
            </form>
        </div>
      </div>
    </div>
  );
}
