import React from 'react';
import { useQuery } from '@tanstack/react-query';
import TopAppBar from '@/components/TopAppBar';
import WorkflowsTable from '@/components/WorkflowsTable';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Workflows: React.FC = () => {
  return (
    <>
      <TopAppBar 
        title="Workflows" 
        subtitle="Manage integration workflows" 
      />
      
      <main className="flex-1 overflow-auto p-6 bg-gray-50 dark:bg-gray-900">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Workflows</h1>
            <p className="text-gray-500 dark:text-gray-400">Manage and monitor all integration workflows</p>
          </div>
          
          <Button className="bg-primary hover:bg-primary-dark text-white">
            <span className="material-icons text-sm mr-1">add</span>
            Create Workflow
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="bg-white dark:bg-gray-800 shadow">
            <CardContent className="p-6 flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-primary bg-opacity-10 flex items-center justify-center mb-3">
                <span className="material-icons text-primary">webhook</span>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">Webhook Workflows</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-4">Trigger actions from external events</p>
              <Button variant="outline" className="mt-auto w-full">
                Create Webhook
              </Button>
            </CardContent>
          </Card>
          
          <Card className="bg-white dark:bg-gray-800 shadow">
            <CardContent className="p-6 flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-secondary bg-opacity-10 flex items-center justify-center mb-3">
                <span className="material-icons text-secondary">send</span>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">Trigger Workflows</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-4">Automatically respond to CRM events</p>
              <Button variant="outline" className="mt-auto w-full">
                Create Trigger
              </Button>
            </CardContent>
          </Card>
          
          <Card className="bg-white dark:bg-gray-800 shadow">
            <CardContent className="p-6 flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-gray-400 bg-opacity-10 flex items-center justify-center mb-3">
                <span className="material-icons text-gray-500">sync</span>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">Poll Workflows</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-4">Periodically check for changes</p>
              <Button variant="outline" className="mt-auto w-full">
                Create Poll
              </Button>
            </CardContent>
          </Card>
        </div>
        
        <WorkflowsTable 
          title="All Workflows" 
          showAddButton={false} 
        />
      </main>
    </>
  );
};

export default Workflows;
