/* eslint-disable @typescript-eslint/no-unused-vars */
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { TemplateProvider } from "./contexts/TemplateContext";
import PhoneAuth from "./pages/auth/PhoneAuth";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import Dashboard from "./pages/Editor/Dashboard";
import Editor from "./Editor";
import NewEditor from "./pages/Editor/NewEditor";
import TextTemplateEditor from "./TextTemplateEditor";
import { Toaster } from "./components/ui/sonner";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import Favorites from "./pages/Favorites";
import KioskViewer from "./pages/Kiosk/KioskViewer";
import LiveMenuPreview from "./pages/LiveMenuPreview";
import RecentWork from "./pages/RecentWork";
import Templates from "./pages/Templates";
import GoogleFeedback from "./pages/GoogleFeedback";
import CouponDesigner from "./pages/CouponDesigner";
import CouponCampaigns from "./pages/CouponCampaigns";
import CouponCampaignDetails from "./pages/CouponCampaignDetails";
import RoyaltyProgram from "./pages/RoyaltyProgram";
import MembershipCard from "./pages/MembershipCard";
import WhatsAppCampaigns from "./pages/WhatsAppCampaigns";
import WhatsAppCampaignDetail from "./pages/WhatsAppCampaignDetail";

function App() {
  return (
    <Router>
      <AuthProvider>
        <TemplateProvider>
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
          />{" "}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
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
          />{" "}
          <Route
            path="/coupon-campaigns"
            element={
              <ProtectedRoute>
                <CouponCampaigns />
              </ProtectedRoute>
            }
          />
          <Route
            path="/coupon-campaigns/:campaignId"
            element={
              <ProtectedRoute>
                <CouponCampaignDetails />
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
          <Route
            path="/whatsapp-campaigns"
            element={
              <ProtectedRoute>
                <WhatsAppCampaigns />
              </ProtectedRoute>
            }
          />
          <Route
            path="/whatsapp-campaigns/:id"
            element={
              <ProtectedRoute>
                <WhatsAppCampaignDetail />
              </ProtectedRoute>
            }
          />
          {/* Kiosk viewer route - public */}
          <Route path="/kiosk/:id" element={<KioskViewer />} />
          {/* Live Menu preview route - public */}
          <Route
            path="/live-menu-preview/:liveMenuId"
            element={<LiveMenuPreview />}
          />
          {/* Fallback route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Toaster />
        </TemplateProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
