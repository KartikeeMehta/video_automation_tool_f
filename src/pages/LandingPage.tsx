import { Link } from 'react-router-dom';
import { Play, Calendar, BarChart, Wand2, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LandingPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-primary-500 selection:text-white">
      
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-black/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 bg-gradient-to-tr from-primary-500 to-secondary-500 rounded-lg shadow-lg shadow-primary-500/20" />
             <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                AutoVideo
             </span>
          </div>
          <div className="flex items-center gap-4">
            {user ? (
               <Link 
                to="/dashboard" 
                className="px-6 py-2.5 rounded-full bg-white text-black font-semibold hover:bg-gray-200 transition"
               >
                 Go to Dashboard
               </Link>
            ) : (
                <>
                    <Link to="/login" className="hidden sm:block text-gray-400 hover:text-white font-medium transition">
                        Sign In
                    </Link>
                    <Link 
                        to="/login?signup=true" 
                        className="px-6 py-2.5 rounded-full bg-primary-600 hover:bg-primary-500 text-white font-semibold shadow-lg shadow-primary-600/20 transition flex items-center gap-2"
                    >
                        Get Started <ArrowRight className="w-4 h-4" />
                    </Link>
                </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-32 overflow-hidden flex flex-col items-center text-center px-6">
          {/* Background Glows */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-primary-600/20 blur-[120px] rounded-full -z-10" />
          <div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-secondary-600/10 blur-[100px] rounded-full -z-10" />

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary-500/30 bg-primary-500/10 text-primary-300 text-sm font-medium mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
             <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
             AI Video Automation 2.0 is live
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 max-w-4xl leading-tight animate-in fade-in slide-in-from-bottom-8 duration-1000">
             Turn Ideas into <br/>
             <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary-400 via-purple-400 to-secondary-400">Viral Videos</span> Instantly
          </h1>
          
          <p className="text-xl text-gray-400 max-w-2xl mb-12 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-200">
            The all-in-one platform to generate, edit, and schedule short-form content. 
            Powered by advanced AI to automate your growth on TikTok, Instagram, and YouTube.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
             <Link 
                to="/login?signup=true"
                className="px-8 py-4 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white font-bold text-lg shadow-xl shadow-primary-600/25 transition-all transform hover:scale-105"
             >
                Start Creating Free
             </Link>
             <button className="px-8 py-4 rounded-xl border border-gray-700 bg-gray-900/50 hover:bg-gray-800 text-white font-semibold text-lg transition flex items-center gap-2">
                <Play className="w-5 h-5 fill-current" /> Watch Demo
             </button>
          </div>

          {/* Hero Visual */}
          <div className="mt-20 relative max-w-5xl w-full aspect-video rounded-2xl border border-white/10 bg-gray-900/50 backdrop-blur-sm shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-1000 delay-500 group">
             <div className="absolute inset-0 flex items-center justify-center">
                 <div className="text-center">
                    <Wand2 className="w-16 h-16 text-gray-600 mx-auto mb-4 group-hover:text-primary-500 transition-colors duration-500" />
                    <p className="text-gray-500 font-medium">Platform Dashboard Preview</p>
                 </div>
             </div>
             {/* Abstract UI Mockup Elements */}
             <div className="absolute top-4 left-4 w-1/4 h-3/4 border-r border-white/5 bg-white/5 rounded-lg" />
             <div className="absolute top-4 right-4 w-2/3 h-1/3 border border-white/5 bg-white/5 rounded-lg" />
             <div className="absolute bottom-4 right-4 w-2/3 h-1/2 border border-white/5 bg-white/5 rounded-lg" />
          </div>
      </section>

      {/* Stats Section */}
      <section className="border-y border-white/5 bg-white/5 py-12">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <Stat label="Videos Generated" value="10k+" />
            <Stat label="Hours Saved" value="500+" />
            <Stat label="Active Creators" value="2k+" />
            <Stat label="Platform Uptime" value="99.9%" />
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-32 relative">
          <div className="max-w-7xl mx-auto px-6">
              <div className="text-center mb-20">
                  <h2 className="text-3xl md:text-5xl font-bold mb-6">Everything you need to scale</h2>
                  <p className="text-gray-400 text-xl max-w-2xl mx-auto">Stop juggling 5 different tools. We combine generation, editing, and publishing in one seamless workflow.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <FeatureCard 
                    icon={Wand2}
                    title="AI Video Generation"
                    desc="Just type a prompt. Our AI writes the script, generates visuals, adds voiceovers, and syncs everything perfectly."
                    color="text-primary-400"
                    gradient="from-primary-500/20 to-transparent"
                  />
                   <FeatureCard 
                    icon={Calendar}
                    title="Smart Scheduling"
                    desc="Plan your content calendar for the entire month. We auto-post to TikTok, Reels, and Shorts at the best times."
                    color="text-secondary-400"
                    gradient="from-secondary-500/20 to-transparent"
                  />
                   <FeatureCard 
                    icon={BarChart}
                    title="Deep Analytics"
                    desc="Track views, likes, and engagement across all platforms in one dashboard. Understand what works."
                    color="text-emerald-400"
                    gradient="from-emerald-500/20 to-transparent"
                  />
              </div>
          </div>
      </section>

      {/* CTA Footer */}
      <section className="py-24 px-6 relative overflow-hidden">
          <div className="max-w-4xl mx-auto text-center relative z-10">
              <h2 className="text-4xl md:text-5xl font-bold mb-8">Ready to automate your channel?</h2>
              <Link to="/login?signup=true" className="inline-flex items-center gap-2 px-10 py-5 rounded-xl bg-white text-black font-bold text-lg hover:bg-gray-200 transition shadow-2xl shadow-white/10">
                  Get Started for Free <ArrowRight className="w-5 h-5" />
              </Link>
          </div>
          
          {/* Footer Background Effect */}
          <div className="absolute inset-0 bg-gradient-to-t from-primary-900/40 via-black to-black -z-10" />
      </section>

      {/* Footer Links */}
      <footer className="border-t border-white/10 bg-black py-12">
          <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
              <div className="flex items-center gap-3">
                 <div className="w-6 h-6 bg-gradient-to-tr from-primary-500 to-secondary-500 rounded-md" />
                 <span className="font-bold text-gray-300">AutoVideo.ai</span>
              </div>
              <div className="flex gap-8 text-sm text-gray-500">
                  <a href="#" className="hover:text-white transition">Features</a>
                  <a href="#" className="hover:text-white transition">Pricing</a>
                  <a href="#" className="hover:text-white transition">Blog</a>
                  <a href="#" className="hover:text-white transition">Terms</a>
              </div>
              <div className="text-xs text-gray-600">
                  © 2024 AutoVideo Inc.
              </div>
          </div>
      </footer>

    </div>
  );
}

function Stat({ label, value }: { label: string, value: string }) {
    return (
        <div>
            <div className="text-4xl font-bold text-white mb-2">{value}</div>
            <div className="text-sm text-primary-400 font-medium tracking-wide uppercase">{label}</div>
        </div>
    )
}

function FeatureCard({ icon: Icon, title, desc, color, gradient }: any) {
    return (
        <div className="p-8 rounded-3xl border border-white/5 bg-white/5 hover:border-white/10 hover:bg-white/10 transition group relative overflow-hidden">
             <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-100 transition duration-500`} />
             
             <div className={`w-12 h-12 rounded-xl bg-gray-900 flex items-center justify-center mb-6 ${color} relative z-10`}>
                <Icon className="w-6 h-6" />
             </div>
             
             <h3 className="text-xl font-bold mb-4 relative z-10">{title}</h3>
             <p className="text-gray-400 leading-relaxed relative z-10">{desc}</p>
        </div>
    )
}
