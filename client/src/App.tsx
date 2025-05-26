import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Login from "@/pages/Login";
import SideDrawer from "@/components/SideDrawer";
import Dashboard from "@/pages/Dashboard";
import Workflows from "@/pages/Workflows";
import Integrations from "@/pages/Integrations";
import Settings from "@/pages/Settings";
import { ThemeProvider } from "./contexts/ThemeContext";
import { useState, useEffect } from "react";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const user = localStorage.getItem('user');
    const company = localStorage.getItem('company');

    if (token && user && company) {
      // Validate token with server
      fetch('/api/auth/validate', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then(response => {
        if (response.ok) {
          setIsAuthenticated(true);
        } else {
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          localStorage.removeItem('company');
          setIsAuthenticated(false);
        }
      })
      .catch(() => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        localStorage.removeItem('company');
        setIsAuthenticated(false);
      });
    } else {
      setIsAuthenticated(false);
    }
  }, []);

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/campaigns/login">
        <Login />
      </Route>
      <Route path="/campaigns/dashboard">
        <div className="flex min-h-screen">
          <SideDrawer />
          <div className="flex-1 flex flex-col">
            <ProtectedRoute component={Dashboard} />
          </div>
        </div>
      </Route>
      <Route path="/campaigns/workflows">
        <div className="flex min-h-screen">
          <SideDrawer />
          <div className="flex-1 flex flex-col">
            <ProtectedRoute component={Workflows} />
          </div>
        </div>
      </Route>
      <Route path="/campaigns/integrations">
        <div className="flex min-h-screen">
          <SideDrawer />
          <div className="flex-1 flex flex-col">
            <ProtectedRoute component={Integrations} />
          </div>
        </div>
      </Route>
      <Route path="/campaigns/settings">
        <div className="flex min-h-screen">
          <SideDrawer />
          <div className="flex-1 flex flex-col">
            <ProtectedRoute component={Settings} />
          </div>
        </div>
      </Route>
      <Route path="/campaigns">
        <div className="flex min-h-screen">
          <SideDrawer />
          <div className="flex-1 flex flex-col">
            <ProtectedRoute component={Dashboard} />
          </div>
        </div>
      </Route>
      <Route component={NotFound} />
    </Switch>
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
