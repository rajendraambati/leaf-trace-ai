import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Farmers from "./pages/Farmers";
import Procurement from "./pages/Procurement";
import Logistics from "./pages/Logistics";
import Warehouse from "./pages/Warehouse";
import Processing from "./pages/Processing";
import Compliance from "./pages/Compliance";
import AIGrading from "./pages/AIGrading";
import IoTDevices from "./pages/IoTDevices";
import FarmerRegistration from "./pages/FarmerRegistration";
import TechnicianActivity from "./pages/TechnicianActivity";
import QRScanner from "./pages/QRScanner";
import MobileHub from "./pages/MobileHub";
import Features from "./pages/Features";
import Architecture from "./pages/Architecture";
import RBACMatrix from "./pages/RBACMatrix";
import AutomatedReports from "./pages/AutomatedReports";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
            <Route path="/farmers" element={<ProtectedRoute><Layout><Farmers /></Layout></ProtectedRoute>} />
            <Route path="/procurement" element={<ProtectedRoute><Layout><Procurement /></Layout></ProtectedRoute>} />
            <Route path="/logistics" element={<ProtectedRoute><Layout><Logistics /></Layout></ProtectedRoute>} />
            <Route path="/warehouse" element={<ProtectedRoute><Layout><Warehouse /></Layout></ProtectedRoute>} />
            <Route path="/processing" element={<ProtectedRoute><Layout><Processing /></Layout></ProtectedRoute>} />
            <Route path="/compliance" element={<ProtectedRoute><Layout><Compliance /></Layout></ProtectedRoute>} />
            <Route path="/ai-grading" element={<ProtectedRoute><Layout><AIGrading /></Layout></ProtectedRoute>} />
            <Route path="/iot-devices" element={<ProtectedRoute><Layout><IoTDevices /></Layout></ProtectedRoute>} />
            <Route path="/mobile" element={<ProtectedRoute><MobileHub /></ProtectedRoute>} />
            <Route path="/mobile/farmer-registration" element={<ProtectedRoute><FarmerRegistration /></ProtectedRoute>} />
            <Route path="/mobile/technician-activity" element={<ProtectedRoute><TechnicianActivity /></ProtectedRoute>} />
            <Route path="/mobile/qr-scanner" element={<ProtectedRoute><QRScanner /></ProtectedRoute>} />
            <Route path="/features" element={<ProtectedRoute><Layout><Features /></Layout></ProtectedRoute>} />
            <Route path="/architecture" element={<ProtectedRoute><Layout><Architecture /></Layout></ProtectedRoute>} />
            <Route path="/rbac-matrix" element={<ProtectedRoute><Layout><RBACMatrix /></Layout></ProtectedRoute>} />
            <Route path="/automated-reports" element={<ProtectedRoute><Layout><AutomatedReports /></Layout></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
