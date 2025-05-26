
export interface User {
  id: number;
  username: string;
  companyId: string;
}

export interface Company {
  id: string;
  name: string;
  subdomain: string;
}

export const auth = {
  getToken(): string | null {
    return localStorage.getItem('authToken');
  },

  getUser(): User | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  getCompany(): Company | null {
    const companyStr = localStorage.getItem('company');
    return companyStr ? JSON.parse(companyStr) : null;
  },

  isAuthenticated(): boolean {
    return !!(this.getToken() && this.getUser() && this.getCompany());
  },

  logout(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('company');
    window.location.href = '/login';
  },

  getAuthHeaders(): Record<string, string> {
    const token = this.getToken();
    const company = this.getCompany();
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (company) {
      headers['x-subdomain'] = company.subdomain;
    }

    return headers;
  }
};
