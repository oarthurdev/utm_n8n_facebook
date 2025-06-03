
import { auth } from './auth';

class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = '/api';
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    // Get auth headers from auth utility
    const authHeaders = auth.getAuthHeaders();
    
    // Merge with provided headers
    const headers = {
      ...authHeaders,
      ...options.headers,
    };

    const config: RequestInit = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);
      
      // Handle unauthorized responses
      if (response.status === 401) {
        auth.logout();
        throw new Error('Unauthorized - redirecting to login');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      // Handle empty responses
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      } else {
        return {} as T;
      }
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // HTTP methods
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'GET',
    });
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    });
  }

  async patch<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }
}

// Export singleton instance
export const api = new ApiClient();

// Export types for convenience
export interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  success?: boolean;
}

// Specific API methods for your application
export const apiMethods = {
  // Dashboard
  getDashboardStats: () => api.get<any>('/dashboard/stats'),
  
  // Workflows
  getWorkflows: () => api.get<any[]>('/workflows'),
  
  // Connections
  getConnections: () => api.get<any[]>('/connections'),
  
  // Credentials
  getCredentials: () => api.get<any[]>('/credentials'),
  
  // Companies
  getCompanies: () => api.get<any[]>('/companies'),
  getCompanyConfig: (companyId: string) => api.get<any>(`/companies/${companyId}/config`),
  saveCompanyConfig: (companyId: string, service: string, data: any) => 
    api.post<any>(`/companies/${companyId}/config/${service}`, data),
  
  // Integrations
  getIntegrations: () => api.get<any[]>('/integrations'),
  
  // Settings
  getSettings: () => api.get<any>('/settings'),
  updateSettings: (data: any) => api.put<any>('/settings', data),
  
  // Kommo
  captureUtm: (data: any) => api.post<any>('/kommo/capture-utm', data),
  
  // Facebook
  sendEvent: (data: any) => api.post<any>('/facebook/send-event', data),
  
  // N8N
  getN8nWorkflows: () => api.get<any[]>('/n8n/workflows'),
  getN8nWorkflow: (id: string) => api.get<any>(`/n8n/workflow/${id}`),
};
