import React from 'react';
import { useQuery } from '@tanstack/react-query';
import TopAppBar from '@/components/TopAppBar';
import StatusCard from '@/components/StatusCard';
import WorkflowsTable from '@/components/WorkflowsTable';
import APIConnections from '@/components/APIConnections';
import RecentEvents from '@/components/RecentEvents';
import ConfigSection from '@/components/ConfigSection';

// Dashboard stats type
interface DashboardStats {
  integrationStatus: {
    status: string;
    lastChecked: string;
  };
  leadsToday: {
    count: number;
    change: string;
  };
  eventsToday: {
    total: number;
    success: number;
    failed: number;
  };
  utmData: {
    percentage: number;
    raw: string;
  };
}

const Dashboard: React.FC = () => {
  const { data: stats, isLoading: isLoadingStats } = useQuery<DashboardStats>({
    queryKey: ['/api/dashboard/stats'],
  });

  return (
    <>
      <TopAppBar 
        title="Dashboard" 
        subtitle="Integration overview and monitoring" 
      />
      
      <main className="flex-1 overflow-auto p-6 bg-gray-50 dark:bg-gray-900">
        {/* Status Overview */}
        <section className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatusCard
              title="Integration Status"
              value={isLoadingStats ? "Loading..." : stats?.integrationStatus.status || "Unknown"}
              icon="check_circle"
              iconBgColor="bg-success"
              iconColor="text-success"
              metaLabel="Last checked"
              metaValue={isLoadingStats ? "Loading..." : stats?.integrationStatus.lastChecked || "Unknown"}
            />
            
            <StatusCard
              title="Lead Captures (Today)"
              value={isLoadingStats ? "-" : stats?.leadsToday.count.toString() || "0"}
              icon="person_add"
              iconBgColor="bg-primary"
              iconColor="text-primary"
              trend={{
                direction: "up",
                value: isLoadingStats ? "-" : stats?.leadsToday.change || "+0%",
                label: "vs yesterday"
              }}
            />
            
            <StatusCard
              title="Events Sent (Today)"
              value={isLoadingStats ? "-" : stats?.eventsToday.total.toString() || "0"}
              icon="send"
              iconBgColor="bg-secondary"
              iconColor="text-secondary"
              successFailCount={{
                success: isLoadingStats ? 0 : stats?.eventsToday.success || 0,
                failed: isLoadingStats ? 0 : stats?.eventsToday.failed || 0
              }}
            />
            
            <StatusCard
              title="UTM Data Captured"
              value={isLoadingStats ? "-" : `${stats?.utmData.percentage}%` || "0%"}
              icon="analytics"
              iconBgColor="bg-warning"
              iconColor="text-warning"
              progressBar={{
                percentage: isLoadingStats ? 0 : stats?.utmData.percentage || 0,
                color: "bg-warning",
                label: isLoadingStats ? "Loading..." : `${stats?.utmData.raw || "0 of 0"} leads with UTM data`
              }}
            />
          </div>
        </section>
        
        {/* Workflows Table */}
        <WorkflowsTable />
        
        {/* Integration Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <APIConnections />
          <RecentEvents />
        </div>
        
        {/* Configuration Section */}
        <ConfigSection />
      </main>
    </>
  );
};

export default Dashboard;
