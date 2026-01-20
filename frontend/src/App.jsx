import { Navigate, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import { useAuth } from "./context/AuthContext";

import Dashboard from "./pages/Dashboard";
import History from "./pages/History";
import Images from "./pages/Images";
import ImagePreview from "./pages/ImagePreview";
import Login from "./pages/Login";
import Preview from "./pages/Preview";
import Register from "./pages/Register";

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="py-20 text-center">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const AppShell = () => (
  <div className="min-h-screen hero-glow">
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-6">
      <Navbar />
      <main className="flex-1 pb-16">
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/upload" element={<Navigate to="/dashboard" replace />} />
          <Route
            path="/images"
            element={
              <ProtectedRoute>
                <Images />
              </ProtectedRoute>
            }
          />
          <Route
            path="/image-preview/:imageId"
            element={
              <ProtectedRoute>
                <ImagePreview />
              </ProtectedRoute>
            }
          />
          <Route
            path="/history"
            element={
              <ProtectedRoute>
                <History />
              </ProtectedRoute>
            }
          />
          <Route
            path="/preview/:videoId"
            element={
              <ProtectedRoute>
                <Preview />
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </main>
    </div>
  </div>
);

export default function App() {
  return <AppShell />;
}
