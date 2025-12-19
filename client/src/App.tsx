import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import UploadVideo from './pages/UploadVideo';
import GenerateVideo from './pages/GenerateVideo';
import VideoStudio from './pages/VideoStudio';
import SchedulePost from './pages/SchedulePost';
import Analytics from './pages/Analytics';
import Connections from './pages/Connections';
import VideoDetails from './pages/VideoDetails';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import ScheduledPosts from './pages/ScheduledPosts';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route element={<ProtectedRoute />}>
             <Route element={<Layout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/video/:id" element={<VideoDetails />} />
                <Route path="/upload" element={<UploadVideo />} />
                <Route path="/generate" element={<GenerateVideo />} />
                <Route path="/studio" element={<VideoStudio />} />
                <Route path="/schedule" element={<SchedulePost />} />
                <Route path="/scheduled-posts" element={<ScheduledPosts />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/connections" element={<Connections />} />
             </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
