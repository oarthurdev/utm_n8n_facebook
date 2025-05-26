import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import SideDrawer from "@/components/SideDrawer";
import Dashboard from "@/pages/Dashboard";
import Workflows from "@/pages/Workflows";
import Integrations from "@/pages/Integrations";
import Settings from "@/pages/Settings";
import { ThemeProvider } from "./contexts/ThemeContext";

function Router() {
  return (
    <div className="flex min-h-screen">
      <SideDrawer />
      <div className="flex-1 flex flex-col">
        <Switch>
          <Route path="/campaigns" component={Dashboard} />
          <Route path="/campaigns/workflows" component={Workflows} />
          <Route path="/campaigns/integrations" component={Integrations} />
          <Route path="/campaigns/settings" component={Settings} />
          <Route component={NotFound} />
        </Switch>
      </div>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
