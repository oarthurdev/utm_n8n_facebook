import React from "react";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiMethods } from "@/lib/api";

export interface Credential {
  key: string;
  status: "set" | "missing";
}

interface ConfigSectionProps {
  title?: string;
}

const ConfigSection: React.FC<ConfigSectionProps> = ({
  title = "System Environment",
}) => {
  const { data: credentials = [], isLoading } = useQuery<Credential[]>({
    queryKey: ["/api/credentials"],
    queryFn: apiMethods.getCredentials,
  });

  return (
    <Card className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden mb-8">
      <CardHeader className="px-6 py-4 border-b dark:border-gray-700">
        <CardTitle className="text-lg font-medium text-gray-900 dark:text-gray-100">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {isLoading ? (
          <div className="flex justify-center py-10">
            <span className="material-icons animate-spin text-primary">
              refresh
            </span>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                API Credentials Status
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {credentials.map((credential) => (
                  <div
                    key={credential.key}
                    className="flex items-center space-x-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-md"
                  >
                    <span
                      className={cn(
                        "material-icons text-sm",
                        credential.status === "set"
                          ? "text-success"
                          : "text-error",
                      )}
                    >
                      {credential.status === "set" ? "check_circle" : "error"}
                    </span>
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {credential.key}
                    </span>
                    <span
                      className={cn(
                        "text-xs ml-auto",
                        credential.status === "set"
                          ? "text-gray-500 dark:text-gray-400"
                          : "text-error",
                      )}
                    >
                      {credential.status === "set" ? "Set" : "Missing"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Environment Actions
                </p>
              </div>
              <div className="mt-3 flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  <span className="material-icons text-gray-500 dark:text-gray-400 mr-2 text-sm">
                    restart_alt
                  </span>
                  Restart Integration Service
                </Button>
                <Button
                  variant="outline"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  <span className="material-icons text-gray-500 dark:text-gray-400 mr-2 text-sm">
                    build
                  </span>
                  Test Connections
                </Button>
                <Button
                  variant="outline"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  <span className="material-icons text-gray-500 dark:text-gray-400 mr-2 text-sm">
                    sync
                  </span>
                  Sync Environment Variables
                </Button>
                <Button
                  variant="outline"
                  className="inline-flex items-center px-4 py-2 border border-error rounded-md shadow-sm text-sm font-medium text-error bg-white dark:bg-gray-800 hover:bg-error hover:bg-opacity-10 dark:hover:bg-opacity-10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-error"
                >
                  <span className="material-icons text-error mr-2 text-sm">
                    settings
                  </span>
                  Manage API Keys
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default ConfigSection;
