/* eslint-disable @typescript-eslint/no-unused-vars */
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import PhoneAuth from "./pages/auth/PhoneAuth";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import Dashbord from "./pages/Editor/Dashbord";
import Editor from "./Editor";
import NewEditor from "./pages/Editor/NewEditor";
import TextTemplateEditor from "./TextTemplateEditor";
import { Toaster } from "./components/ui/sonner";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import Favorites from "./pages/Favorites";
import KioskViewer from "./pages/Kiosk/KioskViewer";
import RecentWork from "./pages/RecentWork";
import Templates from "./pages/Templates";
import GoogleFeedback from "./pages/GoogleFeedback";
import CouponDesigner from "./pages/CouponDesigner";
import RoyaltyProgram from "./pages/RoyaltyProgram";
import MembershipCard from "./pages/MembershipCard";

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Home route */}
          <Route path="/" element={<Home />} />

          {/* Auth routes */}
          <Route path="/auth" element={<PhoneAuth />} />

          {/* Protected routes */}
          <Route
            path="/editor"
            element={
              <ProtectedRoute>
                <NewEditor />
              </ProtectedRoute>
            }
          />
          <Route
            path="/classic-editor"
            element={
              <ProtectedRoute>
                <Editor />
              </ProtectedRoute>
            }
          />
          <Route
            path="/new-text"
            element={
              <ProtectedRoute>
                <TextTemplateEditor />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashbord />
              </ProtectedRoute>
            }
          />
          <Route
            path="/favorites"
            element={
              <ProtectedRoute>
                <Favorites />
              </ProtectedRoute>
            }
          />
          <Route
            path="/recent-work"
            element={
              <ProtectedRoute>
                <RecentWork />
              </ProtectedRoute>
            }
          />
          <Route
            path="/templates"
            element={
              <ProtectedRoute>
                <Templates />
              </ProtectedRoute>
            }
          />
          <Route
            path="/google-feedback"
            element={
              <ProtectedRoute>
                <GoogleFeedback />
              </ProtectedRoute>
            }
          />
          <Route
            path="/coupon-designer"
            element={
              <ProtectedRoute>
                <CouponDesigner />
              </ProtectedRoute>
            }
          />
          <Route
            path="/royalty-program"
            element={
              <ProtectedRoute>
                <RoyaltyProgram />
              </ProtectedRoute>
            }
          />
          <Route
            path="/membership-card"
            element={
              <ProtectedRoute>
                <MembershipCard />
              </ProtectedRoute>
            }
          />

          {/* Kiosk viewer route - public */}
          <Route path="/kiosk/:id" element={<KioskViewer />} />

          {/* Fallback route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Toaster />
      </AuthProvider>
    </Router>
  );
}

export default App;
