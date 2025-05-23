import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { cn, getStatusBadgeClass } from '@/lib/utils';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export interface Workflow {
  id: string;
  name: string;
  type: string;
  status: string;
  lastExecution: string;
  successRate: number;
  icon: string;
  iconBgColor: string;
  iconColor: string;
}

interface WorkflowsTableProps {
  title?: string;
  showAddButton?: boolean;
  limit?: number;
}

const WorkflowsTable: React.FC<WorkflowsTableProps> = ({ 
  title = "Active Workflows", 
  showAddButton = true,
  limit 
}) => {
  const { data: workflows = [], isLoading } = useQuery<Workflow[]>({
    queryKey: ['/api/workflows'],
  });

  const displayedWorkflows = limit ? workflows.slice(0, limit) : workflows;

  const handleEdit = (id: string) => {
    // Handle edit workflow logic
    console.log(`Edit workflow: ${id}`);
  };

  const handleDelete = (id: string) => {
    // Handle delete workflow logic
    console.log(`Delete workflow: ${id}`);
  };

  return (
    <section className="mb-8">
      {title && (
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">{title}</h2>
          {showAddButton && (
            <button className="flex items-center text-primary hover:text-primary-dark text-sm font-medium">
              <span className="material-icons text-sm mr-1">add</span>
              New Workflow
            </button>
          )}
        </div>
      )}
      
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50 dark:bg-gray-700">
            <TableRow>
              <TableHead className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Name
              </TableHead>
              <TableHead className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Type
              </TableHead>
              <TableHead className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Status
              </TableHead>
              <TableHead className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Last Execution
              </TableHead>
              <TableHead className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Success Rate
              </TableHead>
              <TableHead className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-6">
                  <div className="flex justify-center">
                    <span className="material-icons animate-spin text-primary">refresh</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : displayedWorkflows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-6 text-gray-500 dark:text-gray-400">
                  No workflows found
                </TableCell>
              </TableRow>
            ) : (
              displayedWorkflows.map((workflow) => (
                <TableRow key={workflow.id}>
                  <TableCell className="whitespace-nowrap">
                    <div className="flex items-center">
                      <div className={cn(
                        "flex-shrink-0 h-8 w-8 rounded-md flex items-center justify-center",
                        `${workflow.iconBgColor} bg-opacity-10`
                      )}>
                        <span className={cn("material-icons text-sm", workflow.iconColor)}>
                          {workflow.icon}
                        </span>
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-200">{workflow.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{workflow.id}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <span className="text-sm text-gray-900 dark:text-gray-200">{workflow.type}</span>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <span className={cn(
                      "px-2 py-1 text-xs font-medium rounded-full",
                      getStatusBadgeClass(workflow.status)
                    )}>
                      {workflow.status}
                    </span>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {workflow.lastExecution}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-16 h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                        <div 
                          className={cn("h-full", 
                            workflow.successRate >= 95 ? "bg-success" : 
                            workflow.successRate >= 80 ? "bg-warning" : "bg-error"
                          )}
                          style={{ width: `${workflow.successRate}%` }}
                        ></div>
                      </div>
                      <span className="ml-2 text-xs font-medium text-gray-900 dark:text-gray-200">
                        {workflow.successRate}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm text-gray-500">
                    <div className="flex space-x-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button 
                              className="text-gray-400 hover:text-primary dark:text-gray-500 dark:hover:text-primary-light"
                              onClick={() => handleEdit(workflow.id)}
                            >
                              <span className="material-icons text-sm">edit</span>
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Edit workflow</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button 
                              className="text-gray-400 hover:text-error dark:text-gray-500 dark:hover:text-error"
                              onClick={() => handleDelete(workflow.id)}
                            >
                              <span className="material-icons text-sm">delete</span>
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Delete workflow</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </section>
  );
};

export default WorkflowsTable;
