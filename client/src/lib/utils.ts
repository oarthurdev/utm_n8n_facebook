import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format timestamp to relative time (e.g., "5 minutes ago")
export function timeAgo(timestamp: Date | string | number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const secondsAgo = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (secondsAgo < 60) {
    return 'just now';
  } else if (secondsAgo < 3600) {
    const minutes = Math.floor(secondsAgo / 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else if (secondsAgo < 86400) {
    const hours = Math.floor(secondsAgo / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else {
    const days = Math.floor(secondsAgo / 86400);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }
}

// Get environment variable with fallback
export function getEnvVariable(key: string, fallbacks: string[] = [], defaultValue: string = ''): string {
  if (typeof window !== 'undefined') {
    const envVar = import.meta.env[key];
    if (envVar) return envVar;

    for (const fallback of fallbacks) {
      const fallbackValue = import.meta.env[fallback];
      if (fallbackValue) return fallbackValue;
    }

    return defaultValue;
  }
  
  return defaultValue;
}

// Status badge class helper
export function getStatusBadgeClass(status: string): string {
  switch (status.toLowerCase()) {
    case 'active':
    case 'connected':
    case 'success':
      return 'bg-success bg-opacity-10 text-success';
    case 'warning':
    case 'needs attention':
      return 'bg-warning bg-opacity-10 text-warning';
    case 'error':
    case 'failed':
    case 'disconnected':
      return 'bg-error bg-opacity-10 text-error';
    default:
      return 'bg-gray-200 text-gray-700';
  }
}

// Format percentage for display
export function formatPercentage(value: number): string {
  return `${Math.round(value)}%`;
}
