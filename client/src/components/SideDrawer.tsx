import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Settings, 
  Workflow, 
  Plug,
  LogOut
} from "lucide-react";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

const SideDrawer: React.FC = () => {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const { theme } = useTheme();

  const toggleDrawer = () => {
    setIsOpen(!isOpen);
  };

  // Close drawer when clicking outside on mobile
  const handleClickOutside = (e: React.MouseEvent<HTMLDivElement>) => {
    if (window.innerWidth < 768 && isOpen) {
      setIsOpen(false);
    }
  };

  const company = auth.getCompany();
  const user = auth.getUser();

  const handleLogout = () => {
    auth.logout();
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-20"
          onClick={handleClickOutside}
        />
      )}

      <aside 
        className={cn(
          "w-64 bg-white dark:bg-gray-800 shadow-lg fixed top-0 bottom-0 left-0 z-30 transition-transform transform md:relative md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="p-4 border-b dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-primary-light flex items-center justify-center">
              <span className="material-icons text-white">integration_instructions</span>
            </div>
            <div>
              <h1 className="font-medium text-xl text-gray-900 dark:text-white">Integration Hub</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">v1.0.0</p>
            </div>
          </div>
        </div>

        <nav className="py-4">
          <div className="px-4 py-2">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Management</p>
          </div>

          <Link href="/campaigns/dashboard">
            <a className={cn(
              "flex items-center px-4 py-3 text-gray-700 dark:text-gray-300",
              (location === "/campaigns/dashboard" || location === "/campaigns") ? "border-l-4 border-primary bg-primary bg-opacity-10 text-primary dark:text-primary-light" : "hover:bg-gray-100 dark:hover:bg-gray-700"
            )}>
              <span className="material-icons mr-3">dashboard</span>
              <span className={(location === "/campaigns/dashboard" || location === "/campaigns") ? "font-medium" : ""}>Dashboard</span>
            </a>
          </Link>

          <Link href="/campaigns/workflows">
            <a className={cn(
              "flex items-center px-4 py-3 text-gray-700 dark:text-gray-300",
              location === "/campaigns/workflows" ? "border-l-4 border-primary bg-primary bg-opacity-10 text-primary dark:text-primary-light" : "hover:bg-gray-100 dark:hover:bg-gray-700"
            )}>
              <span className="material-icons mr-3">sync</span>
              <span className={location === "/campaigns/workflows" ? "font-medium" : ""}>Workflows</span>
            </a>
          </Link>

          <Link href="/campaigns/integrations">
            <a className={cn(
              "flex items-center px-4 py-3 text-gray-700 dark:text-gray-300",
              location === "/campaigns/integrations" ? "border-l-4 border-primary bg-primary bg-opacity-10 text-primary dark:text-primary-light" : "hover:bg-gray-100 dark:hover:bg-gray-700"
            )}>
              <span className="material-icons mr-3">api</span>
              <span className={location === "/campaigns/integrations" ? "font-medium" : ""}>Integrations</span>
            </a>
          </Link>

          <Link href="/campaigns/logs">
            <a className={cn(
              "flex items-center px-4 py-3 text-gray-700 dark:text-gray-300",
              location === "/campaigns/logs" ? "border-l-4 border-primary bg-primary bg-opacity-10 text-primary dark:text-primary-light" : "hover:bg-gray-100 dark:hover:bg-gray-700"
            )}>
              <span className="material-icons mr-3">history</span>
              <span className={location === "/campaigns/logs" ? "font-medium" : ""}>Logs</span>
            </a>
          </Link>

          <div className="px-4 py-2 mt-4">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Configuration</p>
          </div>

          <Link href="/campaigns/kommo">
            <a className={cn(
              "flex items-center px-4 py-3 text-gray-700 dark:text-gray-300",
              location === "/campaigns/kommo" ? "border-l-4 border-primary bg-primary bg-opacity-10 text-primary dark:text-primary-light" : "hover:bg-gray-100 dark:hover:bg-gray-700"
            )}>
              <span className="material-icons mr-3">business</span>
              <span className={location === "/campaigns/kommo" ? "font-medium" : ""}>Kommo CRM</span>
            </a>
          </Link>

          <Link href="/campaigns/n8n">
            <a className={cn(
              "flex items-center px-4 py-3 text-gray-700 dark:text-gray-300",
              location === "/campaigns/n8n" ? "border-l-4 border-primary bg-primary bg-opacity-10 text-primary dark:text-primary-light" : "hover:bg-gray-100 dark:hover:bg-gray-700"
            )}>
              <span className="material-icons mr-3">settings_suggest</span>
              <span className={location === "/campaigns/n8n" ? "font-medium" : ""}>N8N</span>
            </a>
          </Link>

          <Link href="/campaigns/facebook">
            <a className={cn(
              "flex items-center px-4 py-3 text-gray-700 dark:text-gray-300",
              location === "/campaigns/facebook" ? "border-l-4 border-primary bg-primary bg-opacity-10 text-primary dark:text-primary-light" : "hover:bg-gray-100 dark:hover:bg-gray-700"
            )}>
              <span className="material-icons mr-3">campaign</span>
              <span className={location === "/campaigns/facebook" ? "font-medium" : ""}>Facebook Ads</span>
            </a>
          </Link>

          <Link href="/campaigns/settings">
            <a className={cn(
              "flex items-center px-4 py-3 text-gray-700 dark:text-gray-300",
              location === "/campaigns/settings" ? "border-l-4 border-primary bg-primary bg-opacity-10 text-primary dark:text-primary-light" : "hover:bg-gray-100 dark:hover:bg-gray-700"
            )}>
              <span className="material-icons mr-3">settings</span>
              <span className={location === "/campaigns/settings" ? "font-medium" : ""}>Settings</span>
            </a>
          </Link>
        </nav>

        <div className="absolute bottom-0 w-full border-t dark:border-gray-700 p-4">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
              <span className="material-icons text-gray-600 dark:text-gray-300 text-sm">person</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Admin User</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">admin@imobiliaria.com</p>
            </div>
            <button className="ml-auto text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <span className="material-icons">logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile menu toggle button */}
      <button 
        id="menuToggle"
        className="md:hidden fixed top-4 left-4 z-40 p-2 rounded-md text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 shadow-md"
        onClick={toggleDrawer}
      >
        <span className="material-icons">{isOpen ? 'close' : 'menu'}</span>
      </button>
    </>
  );
};

export default SideDrawer;