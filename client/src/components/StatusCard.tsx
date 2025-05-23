import React from 'react';
import { cn, formatPercentage } from '@/lib/utils';

interface StatusCardProps {
  title: string;
  value: string | number;
  icon: string;
  iconBgColor: string;
  iconColor: string;
  metaLabel?: string;
  metaValue?: string;
  trend?: {
    direction: 'up' | 'down' | 'neutral';
    value: string;
    label: string;
  };
  progressBar?: {
    percentage: number;
    color: string;
    label: string;
  };
  successFailCount?: {
    success: number;
    failed: number;
  };
}

const StatusCard: React.FC<StatusCardProps> = ({
  title,
  value,
  icon,
  iconBgColor,
  iconColor,
  metaLabel,
  metaValue,
  trend,
  progressBar,
  successFailCount
}) => {
  return (
    <div className="card bg-white dark:bg-gray-800 shadow rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{title}</p>
          <h3 className={cn(
            "text-xl font-medium",
            iconColor === 'text-success' ? 'text-success dark:text-success' :
            iconColor === 'text-error' ? 'text-error dark:text-error' : 
            'text-gray-900 dark:text-gray-100'
          )}>{value}</h3>
        </div>
        <div className={cn(
          "w-12 h-12 rounded-full flex items-center justify-center",
          `${iconBgColor} bg-opacity-10`
        )}>
          <span className={cn("material-icons", iconColor)}>{icon}</span>
        </div>
      </div>
      
      <div className="mt-4">
        {trend && (
          <div className="flex items-center">
            <span className={cn(
              "material-icons text-sm mr-1",
              trend.direction === 'up' ? 'text-success' : 
              trend.direction === 'down' ? 'text-error' : 'text-gray-500'
            )}>
              {trend.direction === 'up' ? 'trending_up' : 
               trend.direction === 'down' ? 'trending_down' : 'trending_flat'}
            </span>
            <span className={cn(
              "text-sm font-medium mr-1",
              trend.direction === 'up' ? 'text-success' : 
              trend.direction === 'down' ? 'text-error' : 'text-gray-500'
            )}>
              {trend.value}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {trend.label}
            </span>
          </div>
        )}
        
        {metaLabel && metaValue && (
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{metaLabel}</div>
            <div className="text-sm dark:text-gray-300">{metaValue}</div>
          </div>
        )}
        
        {progressBar && (
          <>
            <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mt-2">
              <div 
                className={`h-full ${progressBar.color}`}
                style={{ width: `${progressBar.percentage}%` }}
              ></div>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {progressBar.label}
            </div>
          </>
        )}
        
        {successFailCount && (
          <>
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <div className="h-2 w-2 rounded-full bg-success mr-1"></div>
                <span className="text-xs text-gray-600 dark:text-gray-400">Success</span>
              </div>
              <span className="text-xs font-medium dark:text-gray-300">{successFailCount.success}</span>
            </div>
            <div className="flex justify-between items-center mt-1">
              <div className="flex items-center">
                <div className="h-2 w-2 rounded-full bg-error mr-1"></div>
                <span className="text-xs text-gray-600 dark:text-gray-400">Failed</span>
              </div>
              <span className="text-xs font-medium dark:text-gray-300">{successFailCount.failed}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default StatusCard;
