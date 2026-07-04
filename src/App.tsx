import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { createBrowserRouter, RouterProvider, Navigate, ScrollRestoration } from 'react-router-dom';
import { ThemeProvider } from './lib/ThemeContext';
import { SettingsProvider } from './lib/SettingsContext';
import { AuthProvider } from './lib/AuthContext';
import { SidebarProvider } from './lib/SidebarContext';
import { queryClient } from './lib/queryClient';
import Home from './pages/Home';
import ReadingList from './pages/ReadingList';
import Bookmarks from './pages/Bookmarks';
import Feed from './pages/Feed';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import OtherProfile from './pages/OtherProfile';
import WriteArticle from './pages/WriteArticle';
import FindPeople from './pages/FindPeople';
import Auth from './pages/Auth';
import Community from './pages/Community';
import ArticleView from './pages/ArticleView';
import MicroPostView from './pages/MicroPostView';
import SearchResults from './pages/SearchResults';
import Drafts from './pages/Drafts';
import Leaderboard from './pages/Leaderboard';
import { useAuth } from './lib/AuthContext';
import { Outlet } from 'react-router-dom';
import { OfflineIndicator } from './components/OfflineIndicator';

function Layout() {
  return (
    <>
      <Outlet />
      <OfflineIndicator />
    </>
  );
}


function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return <>{children}</>;
  }
  return isAuthenticated ? <>{children}</> : <Navigate to="/signin" replace />;
}

function RootRedirect() {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return <Feed />;
  }
  return isAuthenticated ? <Navigate to="/feed" replace /> : <Navigate to="/signin" replace />;
}

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: "/", element: <RootRedirect /> },
      { path: "/signin", element: <Auth mode="signin" /> },
      { path: "/signup", element: <Auth mode="signup" /> },
      { path: "/explore", element: <Navigate to="/feed" replace /> },
      { path: "/feed", element: <ProtectedRoute><Feed /></ProtectedRoute> },
      { path: "/dashboard", element: <Navigate to="/feed" replace /> },
      { path: "/article/:id", element: <ArticleView /> },
      { path: "/micro-post/:id", element: <MicroPostView /> },
      { path: "/analytics", element: <Navigate to="/profile?tab=analytics" replace /> },
      { path: "/community", element: <ProtectedRoute><Community /></ProtectedRoute> },
      { path: "/find-people", element: <ProtectedRoute><FindPeople /></ProtectedRoute> },
      { path: "/search", element: <ProtectedRoute><SearchResults /></ProtectedRoute> },
      { path: "/leaderboard", element: <ProtectedRoute><Leaderboard /></ProtectedRoute> },
      { path: "/drafts", element: <ProtectedRoute><Drafts /></ProtectedRoute> },
      { path: "/bookmarks", element: <ProtectedRoute><Bookmarks /></ProtectedRoute> },
      { path: "/settings", element: <ProtectedRoute><Settings /></ProtectedRoute> },
      { path: "/profile", element: <ProtectedRoute><Profile /></ProtectedRoute> },
      { path: "/profile/:username", element: <ProtectedRoute><OtherProfile /></ProtectedRoute> },
      { path: "/write-article", element: <ProtectedRoute><WriteArticle /></ProtectedRoute> },
      { path: "/editor", element: <Navigate to="/write-article" replace /> },
      { path: "*", element: <Navigate to="/" replace /> },
    ]
  }
]);

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <SettingsProvider>
          <AuthProvider>
            <SidebarProvider>
              <RouterProvider router={router} />
            </SidebarProvider>
          </AuthProvider>
        </SettingsProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
