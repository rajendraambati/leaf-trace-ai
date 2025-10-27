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
import LogisticsJourney from "./pages/LogisticsJourney";
import IoTDevices from "./pages/IoTDevices";
import AIInsights from "./pages/AIInsights";
import Warehouse from "./pages/Warehouse";
import Processing from "./pages/Processing";
import Compliance from "./pages/Compliance";
import AIGrading from "./pages/AIGrading";
import FarmerRegistration from "./pages/FarmerRegistration";
import TechnicianActivity from "./pages/TechnicianActivity";
import QRScanner from "./pages/QRScanner";
import MobileHub from "./pages/MobileHub";
import Features from "./pages/Features";
import Architecture from "./pages/Architecture";
import RBACMatrix from "./pages/RBACMatrix";
import AutomatedReports from "./pages/AutomatedReports";
import SystemMonitoring from "./pages/SystemMonitoring";
import AnalyticsDashboard from "./pages/AnalyticsDashboard";
import TrainingSupport from "./pages/TrainingSupport";
import Auth from "./pages/Auth";
import RoleSelection from "./pages/RoleSelection";
import Register from "./pages/Register";
import SignIn from "./pages/SignIn";
import AdminApprovals from "./pages/AdminApprovals";
import NotFound from "./pages/NotFound";
import ERPIntegration from "./pages/ERPIntegration";
import AIVehicleTracking from "./pages/AIVehicleTracking";
import DriverApp from "./pages/DriverApp";
import InstallApp from "./pages/InstallApp";

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
            <Route path="/role-selection" element={<RoleSelection />} />
            <Route path="/register" element={<Register />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/admin/approvals" element={<ProtectedRoute><Layout><AdminApprovals /></Layout></ProtectedRoute>} />
            <Route path="/" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
            <Route path="/farmers" element={<ProtectedRoute><Layout><Farmers /></Layout></ProtectedRoute>} />
            <Route path="/procurement" element={<ProtectedRoute><Layout><Procurement /></Layout></ProtectedRoute>} />
            <Route path="/logistics" element={<ProtectedRoute><Layout><Logistics /></Layout></ProtectedRoute>} />
            <Route path="/logistics-journey" element={<ProtectedRoute><Layout><LogisticsJourney /></Layout></ProtectedRoute>} />
            <Route path="/iot-devices" element={<ProtectedRoute><Layout><IoTDevices /></Layout></ProtectedRoute>} />
            <Route path="/ai-insights" element={<ProtectedRoute><Layout><AIInsights /></Layout></ProtectedRoute>} />
            <Route path="/warehouse" element={<ProtectedRoute><Layout><Warehouse /></Layout></ProtectedRoute>} />
            <Route path="/processing" element={<ProtectedRoute><Layout><Processing /></Layout></ProtectedRoute>} />
            <Route path="/compliance" element={<ProtectedRoute><Layout><Compliance /></Layout></ProtectedRoute>} />
            <Route path="/ai-grading" element={<ProtectedRoute><Layout><AIGrading /></Layout></ProtectedRoute>} />
            <Route path="/mobile" element={<ProtectedRoute><MobileHub /></ProtectedRoute>} />
            <Route path="/mobile/farmer-registration" element={<ProtectedRoute><FarmerRegistration /></ProtectedRoute>} />
            <Route path="/mobile/technician-activity" element={<ProtectedRoute><TechnicianActivity /></ProtectedRoute>} />
            <Route path="/mobile/qr-scanner" element={<ProtectedRoute><QRScanner /></ProtectedRoute>} />
            <Route path="/features" element={<ProtectedRoute><Layout><Features /></Layout></ProtectedRoute>} />
            <Route path="/architecture" element={<ProtectedRoute><Layout><Architecture /></Layout></ProtectedRoute>} />
            <Route path="/rbac-matrix" element={<ProtectedRoute><Layout><RBACMatrix /></Layout></ProtectedRoute>} />
            <Route path="/automated-reports" element={<ProtectedRoute><Layout><AutomatedReports /></Layout></ProtectedRoute>} />
            <Route path="/analytics" element={<ProtectedRoute><Layout><AnalyticsDashboard /></Layout></ProtectedRoute>} />
            <Route path="/training-support" element={<ProtectedRoute><Layout><TrainingSupport /></Layout></ProtectedRoute>} />
            <Route path="/system-monitoring" element={<ProtectedRoute><Layout><SystemMonitoring /></Layout></ProtectedRoute>} />
            <Route path="/erp-integration" element={<ProtectedRoute><Layout><ERPIntegration /></Layout></ProtectedRoute>} />
            <Route path="/ai-vehicle-tracking" element={<ProtectedRoute><Layout><AIVehicleTracking /></Layout></ProtectedRoute>} />
            <Route path="/driver-app" element={<ProtectedRoute><DriverApp /></ProtectedRoute>} />
            <Route path="/install" element={<InstallApp />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
