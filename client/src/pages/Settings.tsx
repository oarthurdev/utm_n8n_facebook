import React from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import TopAppBar from '@/components/TopAppBar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { auth } from "@/lib/auth";
import { apiMethods } from "@/lib/api";

// Form validation schema
const apiSettingsSchema = z.object({
  kommoApiToken: z.string().min(1, 'API Token is required'),
  kommoAccountId: z.string().min(1, 'Account ID is required'),
  kommoPipelineId: z.string().min(1, 'Pipeline ID is required'),
  facebookAccessToken: z.string().min(1, 'Access Token is required'),
  facebookPixelId: z.string().min(1, 'Pixel ID is required'),
  facebookAppId: z.string().min(1, 'App ID is required'),
  facebookAppSecret: z.string().min(1, 'App Secret is required'),
  n8nWebhookSecret: z.string().min(1, 'Webhook Secret is required'),
});

type ApiSettingsFormValues = z.infer<typeof apiSettingsSchema>;

const Settings: React.FC = () => {
  const { toast } = useToast();

  const { data: settings, isLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: apiMethods.getSettings,
  });

  const mutation = useMutation({
    mutationFn: async (values: ApiSettingsFormValues) => {
      await apiRequest('PUT', '/api/settings', values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
      toast({
        title: 'Settings updated',
        description: 'Your API settings have been updated successfully.',
        variant: 'default',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to update settings: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  const form = useForm<ApiSettingsFormValues>({
    resolver: zodResolver(apiSettingsSchema),
    defaultValues: settings || {
      kommoApiToken: '',
      kommoAccountId: '',
      kommoPipelineId: '',
      facebookAccessToken: '',
      facebookPixelId: '',
      facebookAppId: '',
      facebookAppSecret: '',
      n8nWebhookSecret: '',
    },
  });

  // Update form when settings are loaded
  React.useEffect(() => {
    if (settings) {
      form.reset(settings);
    }
  }, [settings, form]);

  const onSubmit = (values: ApiSettingsFormValues) => {
    mutation.mutate(values);
  };

  return (
    <>
      <TopAppBar 
        title="Settings" 
        subtitle="Manage integration settings" 
      />

      <main className="flex-1 overflow-auto p-6 bg-gray-50 dark:bg-gray-900">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>
          <p className="text-gray-500 dark:text-gray-400">Configure integration settings and API credentials</p>
        </div>

        <Tabs defaultValue="api" className="mb-8">
          <TabsList>
            <TabsTrigger value="api">API Settings</TabsTrigger>
            <TabsTrigger value="general">General Settings</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          <TabsContent value="api" className="mt-4">
            <Card className="bg-white dark:bg-gray-800 shadow">
              <CardHeader>
                <CardTitle>API Credentials</CardTitle>
                <CardDescription>
                  Configure the API credentials required for integrations to work properly.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-10">
                    <span className="material-icons animate-spin text-primary">refresh</span>
                  </div>
                ) : (
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <div className="space-y-4">
                        <h3 className="text-md font-medium text-gray-900 dark:text-gray-100">Kommo CRM</h3>

                        <FormField
                          control={form.control}
                          name="kommoApiToken"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>API Token</FormLabel>
                              <FormControl>
                                <Input 
                                  type="password" 
                                  placeholder="Enter your Kommo API token" 
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="kommoAccountId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Account ID</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="Enter your Kommo account ID" 
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="kommoPipelineId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Pipeline ID</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="Enter your pipeline ID" 
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h3 className="text-md font-medium text-gray-900 dark:text-gray-100">Facebook Ads</h3>

                        <FormField
                          control={form.control}
                          name="facebookAccessToken"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Access Token</FormLabel>
                              <FormControl>
                                <Input 
                                  type="password" 
                                  placeholder="Enter your Facebook access token" 
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="facebookPixelId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Pixel ID</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="Enter your Facebook pixel ID" 
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="facebookAppId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>App ID</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="Enter your Facebook app ID" 
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={form.control}
                          name="facebookAppSecret"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>App Secret</FormLabel>
                              <FormControl>
                                <Input 
                                  type="password" 
                                  placeholder="Enter your Facebook app secret" 
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="space-y-4">
                        <h3 className="text-md font-medium text-gray-900 dark:text-gray-100">N8N</h3>

                        <FormField
                          control={form.control}
                          name="n8nWebhookSecret"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Webhook Secret</FormLabel>
                              <FormControl>
                                <Input 
                                  type="password" 
                                  placeholder="Enter your N8N webhook secret" 
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="flex justify-end space-x-4 pt-4">
                        <Button 
                          type="button" 
                          variant="outline"
                          onClick={() => form.reset()}
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="submit"
                          disabled={mutation.isPending}
                        >
                          {mutation.isPending ? (
                            <>
                              <span className="material-icons animate-spin mr-2 text-sm">refresh</span>
                              Saving...
                            </>
                          ) : 'Save Settings'}
                        </Button>
                      </div>
                    </form>
                  </Form>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="general" className="mt-4">
            <Card className="bg-white dark:bg-gray-800 shadow">
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>
                  Configure general application settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500 dark:text-gray-400">General settings will be implemented in future updates.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="advanced" className="mt-4">
            <Card className="bg-white dark:bg-gray-800 shadow">
              <CardHeader>
                <CardTitle>Advanced Settings</CardTitle>
                <CardDescription>
                  Configure advanced settings for the integration
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500 dark:text-gray-400">Advanced settings will be implemented in future updates.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </>
  );
};

export default Settings;