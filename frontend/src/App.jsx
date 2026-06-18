import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { notificationsAPI, meetingsAPI } from './services/api';
import { useWebSocket } from './hooks/useWebSocket';
import ProtectedRoute from './components/common/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';

import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ForgotPassword from './components/auth/ForgotPassword';
import Dashboard from './components/dashboard/Dashboard';
import CalendarView from './components/calendar/CalendarView';
import CalendarSync from './components/calendar/CalendarSync';
import MeetingsList from './components/meetings/MeetingsList';
import MeetingForm from './components/meetings/MeetingForm';
import MeetingDetail from './components/meetings/MeetingDetail';
import Notifications from './components/notifications/Notifications';
import Profile from './components/profile/Profile';

import './styles/global.css';

// Edit wrapper that loads meeting data first
function EditMeeting() {
  const { id } = useParams();
  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    meetingsAPI.getById(id)
      .then(({ data }) => setMeeting(data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="loading-spinner" />;
  if (!meeting) return <div style={{ padding: '40px', textAlign: 'center' }}>Meeting not found</div>;
  return <MeetingForm existing={meeting} />;
}

function AppRoutes() {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    notificationsAPI.getAll()
      .then(({ data }) => {
        const unread = (data.data || []).filter(n => !n.readStatus).length;
        setUnreadCount(unread);
      })
      .catch(() => {});
  }, [user]);

  useWebSocket((msg) => {
    if (['REMINDER','MEETING_INVITE','MEETING_UPDATE','MEETING_CANCELLED'].includes(msg.type)) {
      setUnreadCount(c => c + 1);
    }
  });

  const withLayout = (Component) => (
    <ProtectedRoute>
      <AppLayout unreadCount={unreadCount}>
        <Component />
      </AppLayout>
    </ProtectedRoute>
  );

  const withLayoutEdit = () => (
    <ProtectedRoute>
      <AppLayout unreadCount={unreadCount}>
        <EditMeeting />
      </AppLayout>
    </ProtectedRoute>
  );

  return (
    <Routes>
      {/* Public */}
      <Route path="/login"          element={user ? <Navigate to="/dashboard" /> : <Login />} />
      <Route path="/register"       element={user ? <Navigate to="/dashboard" /> : <Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* Protected */}
      <Route path="/dashboard"      element={withLayout(Dashboard)} />
      <Route path="/calendar"       element={withLayout(CalendarView)} />
      <Route path="/calendar-sync"  element={withLayout(CalendarSync)} />
      <Route path="/meetings"       element={withLayout(MeetingsList)} />
      <Route path="/meetings/new"   element={withLayout(MeetingForm)} />
      <Route path="/meetings/:id"   element={withLayout(MeetingDetail)} />
      <Route path="/meetings/:id/edit" element={withLayoutEdit()} />
      <Route path="/notifications"  element={withLayout(Notifications)} />
      <Route path="/profile"        element={withLayout(Profile)} />

      {/* Default */}
      <Route path="/" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <AppRoutes />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'var(--bg-card)',
                color: 'var(--text)',
                border: '1px solid var(--border)',
                borderRadius: '10px',
                boxShadow: 'var(--shadow-lg)',
              },
              success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
              error:   { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
            }}
          />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
