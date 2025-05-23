import React from 'react';
import { useQuery } from '@tanstack/react-query';
import TopAppBar from '@/components/TopAppBar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getStatusBadgeClass, cn } from '@/lib/utils';

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: string;
  status: string;
  connected: boolean;
  endpoints?: {
    name: string;
    url: string;
    method: string;
  }[];
  credentials?: {
    key: string;
    status: 'set' | 'missing';
  }[];
}

const Integrations: React.FC = () => {
  const { data: integrations = [], isLoading } = useQuery<Integration[]>({
    queryKey: ['/api/integrations'],
  });

  return (
    <>
      <TopAppBar 
        title="Integrations" 
        subtitle="Manage API connections" 
      />
      
      <main className="flex-1 overflow-auto p-6 bg-gray-50 dark:bg-gray-900">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Integrations</h1>
            <p className="text-gray-500 dark:text-gray-400">Manage connections with external APIs</p>
          </div>
          
          <Button className="bg-primary hover:bg-primary-dark text-white">
            <span className="material-icons text-sm mr-1">add</span>
            Add Integration
          </Button>
        </div>
        
        <Tabs defaultValue="all" className="mb-8">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="inactive">Inactive</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {isLoading ? (
                <div className="col-span-3 flex justify-center py-20">
                  <span className="material-icons animate-spin text-primary">refresh</span>
                </div>
              ) : integrations.length === 0 ? (
                <div className="col-span-3 text-center py-20 text-gray-500 dark:text-gray-400">
                  No integrations found
                </div>
              ) : (
                integrations.map((integration) => (
                  <Card key={integration.id} className="bg-white dark:bg-gray-800 shadow">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-md bg-gray-100 dark:bg-gray-700 flex items-center justify-center mr-3">
                            <span className="material-icons text-gray-600 dark:text-gray-400">{integration.icon}</span>
                          </div>
                          <div>
                            <CardTitle className="text-xl">{integration.name}</CardTitle>
                            <span className={cn(
                              "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1",
                              getStatusBadgeClass(integration.status)
                            )}>
                              {integration.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        {integration.description}
                      </CardDescription>
                      
                      {integration.credentials && integration.credentials.length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Credentials</h4>
                          <div className="space-y-2">
                            {integration.credentials.map((credential) => (
                              <div key={credential.key} className="flex justify-between text-sm">
                                <span className="text-gray-600 dark:text-gray-400">{credential.key}</span>
                                <span className={credential.status === 'set' ? 'text-success' : 'text-error'}>
                                  {credential.status === 'set' ? 'Set' : 'Missing'}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="flex justify-between gap-2 mt-4">
                        <Button 
                          variant="outline" 
                          className="flex-1"
                        >
                          Configure
                        </Button>
                        <Button 
                          variant={integration.connected ? "destructive" : "default"}
                          className="flex-1"
                        >
                          {integration.connected ? 'Disconnect' : 'Connect'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="active" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {isLoading ? (
                <div className="col-span-3 flex justify-center py-20">
                  <span className="material-icons animate-spin text-primary">refresh</span>
                </div>
              ) : (
                integrations
                  .filter(i => i.connected)
                  .map((integration) => (
                    <Card key={integration.id} className="bg-white dark:bg-gray-800 shadow">
                      {/* Same card content as above */}
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center">
                            <div className="w-10 h-10 rounded-md bg-gray-100 dark:bg-gray-700 flex items-center justify-center mr-3">
                              <span className="material-icons text-gray-600 dark:text-gray-400">{integration.icon}</span>
                            </div>
                            <div>
                              <CardTitle className="text-xl">{integration.name}</CardTitle>
                              <span className={cn(
                                "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1",
                                getStatusBadgeClass(integration.status)
                              )}>
                                {integration.status}
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <CardDescription className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                          {integration.description}
                        </CardDescription>
                        
                        {integration.credentials && integration.credentials.length > 0 && (
                          <div className="mb-4">
                            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Credentials</h4>
                            <div className="space-y-2">
                              {integration.credentials.map((credential) => (
                                <div key={credential.key} className="flex justify-between text-sm">
                                  <span className="text-gray-600 dark:text-gray-400">{credential.key}</span>
                                  <span className={credential.status === 'set' ? 'text-success' : 'text-error'}>
                                    {credential.status === 'set' ? 'Set' : 'Missing'}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        <div className="flex justify-between gap-2 mt-4">
                          <Button 
                            variant="outline" 
                            className="flex-1"
                          >
                            Configure
                          </Button>
                          <Button 
                            variant="destructive"
                            className="flex-1"
                          >
                            Disconnect
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="inactive" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {isLoading ? (
                <div className="col-span-3 flex justify-center py-20">
                  <span className="material-icons animate-spin text-primary">refresh</span>
                </div>
              ) : (
                integrations
                  .filter(i => !i.connected)
                  .map((integration) => (
                    <Card key={integration.id} className="bg-white dark:bg-gray-800 shadow">
                      {/* Same card content as above */}
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center">
                            <div className="w-10 h-10 rounded-md bg-gray-100 dark:bg-gray-700 flex items-center justify-center mr-3">
                              <span className="material-icons text-gray-600 dark:text-gray-400">{integration.icon}</span>
                            </div>
                            <div>
                              <CardTitle className="text-xl">{integration.name}</CardTitle>
                              <span className={cn(
                                "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1",
                                getStatusBadgeClass(integration.status)
                              )}>
                                {integration.status}
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <CardDescription className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                          {integration.description}
                        </CardDescription>
                        
                        {integration.credentials && integration.credentials.length > 0 && (
                          <div className="mb-4">
                            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Credentials</h4>
                            <div className="space-y-2">
                              {integration.credentials.map((credential) => (
                                <div key={credential.key} className="flex justify-between text-sm">
                                  <span className="text-gray-600 dark:text-gray-400">{credential.key}</span>
                                  <span className={credential.status === 'set' ? 'text-success' : 'text-error'}>
                                    {credential.status === 'set' ? 'Set' : 'Missing'}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        <div className="flex justify-between gap-2 mt-4">
                          <Button 
                            variant="outline" 
                            className="flex-1"
                          >
                            Configure
                          </Button>
                          <Button 
                            variant="default"
                            className="flex-1"
                          >
                            Connect
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </>
  );
};

export default Integrations;
