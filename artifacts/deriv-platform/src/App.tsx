import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import Deposit from "./pages/Deposit";
import Positions from "./pages/Positions";
import Automate from "./pages/Automate";
import Partners from "./pages/Partners";
import NotFound from "./pages/NotFound";
const queryClient = new QueryClient();
const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner position="top-center" />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/deposit" element={<Deposit />} />
          <Route path="/withdrawal" element={<Deposit />} />
          <Route path="/cashier" element={<Deposit />} />
          <Route path="/reports" element={<Dashboard />} />
          <Route path="/portfolio" element={<Dashboard />} />
          <Route path="/markets" element={<Dashboard />} />
          <Route path="/about" element={<Index />} />
          <Route path="/settings" element={<Profile />} />
          <Route path="/positions" element={<Positions />} />
          <Route path="/automate" element={<Automate />} />
          <Route path="/partners" element={<Partners />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);
export default App;
