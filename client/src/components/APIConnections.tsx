import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { cn, getStatusBadgeClass, timeAgo } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export interface APIConnection {
  id: string;
  name: string;
  icon: string;
  lastVerified: string;
  status: string;
}

interface APIConnectionsProps {
  title?: string;
}

const APIConnections: React.FC<APIConnectionsProps> = ({ 
  title = "API Connections"
}) => {
  const { data: connections = [], isLoading } = useQuery<APIConnection[]>({
    queryKey: ['/api/connections'],
  });

  return (
    <Card className="bg-white dark:bg-gray-800 shadow rounded-lg">
      <CardHeader className="px-6 py-4 border-b dark:border-gray-700">
        <CardTitle className="text-lg font-medium text-gray-900 dark:text-gray-100">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {isLoading ? (
          <div className="flex justify-center py-10">
            <span className="material-icons animate-spin text-primary">refresh</span>
          </div>
        ) : connections.length === 0 ? (
          <div className="text-center py-10 text-gray-500 dark:text-gray-400">
            No connections found
          </div>
        ) : (
          <div className="space-y-4">
            {connections.map((connection) => (
              <div key={connection.id} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-md bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                    <span className="material-icons text-gray-600 dark:text-gray-400">{connection.icon}</span>
                  </div>
                  <div className="ml-3">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-200">{connection.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Last verified {timeAgo(connection.lastVerified)}
                    </div>
                  </div>
                </div>
                <div>
                  <span className={cn(
                    "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                    getStatusBadgeClass(connection.status)
                  )}>
                    {connection.status}
                  </span>
                </div>
              </div>
            ))}
            
            <Button 
              variant="outline" 
              className="w-full mt-4 flex items-center justify-center px-4 py-2 border rounded-md text-sm font-medium text-primary border-primary hover:bg-primary-light hover:bg-opacity-10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              <span className="material-icons text-sm mr-1">add</span>
              Add New Connection
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default APIConnections;
