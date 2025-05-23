import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { cn, timeAgo } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export interface Event {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  status: 'success' | 'warning' | 'error';
}

interface RecentEventsProps {
  title?: string;
  limit?: number;
}

const RecentEvents: React.FC<RecentEventsProps> = ({ 
  title = "Recent Events",
  limit = 5
}) => {
  const { data: events = [], isLoading } = useQuery<Event[]>({
    queryKey: ['/api/events'],
  });

  const displayedEvents = limit ? events.slice(0, limit) : events;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'border-success';
      case 'warning':
        return 'border-warning';
      case 'error':
        return 'border-error';
      default:
        return 'border-gray-300';
    }
  };

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
        ) : displayedEvents.length === 0 ? (
          <div className="text-center py-10 text-gray-500 dark:text-gray-400">
            No events found
          </div>
        ) : (
          <div className="space-y-4">
            {displayedEvents.map((event) => (
              <div 
                key={event.id} 
                className={cn(
                  "border-l-4 pl-3 py-1",
                  getStatusColor(event.status)
                )}
              >
                <div className="flex justify-between">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-200">{event.title}</p>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{timeAgo(event.timestamp)}</span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400" dangerouslySetInnerHTML={{ __html: event.description }}></p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      {events.length > 0 && (
        <CardFooter className="flex justify-center pt-0 pb-4">
          <Button 
            variant="link" 
            className="text-sm text-primary font-medium hover:text-primary-dark dark:hover:text-primary-light flex items-center"
          >
            View all events
            <span className="material-icons text-sm ml-1">arrow_forward</span>
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default RecentEvents;
