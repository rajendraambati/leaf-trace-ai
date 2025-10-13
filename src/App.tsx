import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Farmers from "./pages/Farmers";
import Procurement from "./pages/Procurement";
import Logistics from "./pages/Logistics";
import Warehouse from "./pages/Warehouse";
import Processing from "./pages/Processing";
import Compliance from "./pages/Compliance";
import AIGrading from "./pages/AIGrading";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout><Dashboard /></Layout>} />
          <Route path="/farmers" element={<Layout><Farmers /></Layout>} />
          <Route path="/procurement" element={<Layout><Procurement /></Layout>} />
          <Route path="/logistics" element={<Layout><Logistics /></Layout>} />
          <Route path="/warehouse" element={<Layout><Warehouse /></Layout>} />
          <Route path="/processing" element={<Layout><Processing /></Layout>} />
          <Route path="/compliance" element={<Layout><Compliance /></Layout>} />
          <Route path="/ai-grading" element={<Layout><AIGrading /></Layout>} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
