
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [selectedCompany, setSelectedCompany] = useState('demo');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { toast } = useToast();

  // Lista de empresas disponíveis para teste
  const companies = [
    { value: 'demo', label: 'Imobiliária Demo' },
    { value: 'teste', label: 'Empresa Teste' },
    { value: 'exemplo', label: 'Exemplo Corp' }
  ];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Get subdomain from hostname or use selected company
      const hostname = window.location.hostname;
      let subdomain = selectedCompany;
      
      if (!hostname.includes('localhost') && !hostname.includes('127.0.0.1') && !hostname.includes('replit')) {
        // Extract subdomain from hostname only if not in development
        const parts = hostname.split('.');
        if (parts.length > 2) {
          subdomain = parts[0];
        }
      }

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-subdomain': subdomain
        },
        body: JSON.stringify({ username, password })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Erro ao fazer login');
      }

      // Store auth token
      localStorage.setItem('authToken', result.token);
      localStorage.setItem('user', JSON.stringify(result.user));
      localStorage.setItem('company', JSON.stringify(result.company));

      toast({
        title: "Login realizado com sucesso!",
        description: `Bem-vindo, ${result.user.username}!`
      });

      // Redirect to dashboard
      window.location.href = '/campaigns/dashboard';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  // Check if we're in development environment
  const isDevelopment = window.location.hostname.includes('localhost') || 
                       window.location.hostname.includes('127.0.0.1') || 
                       window.location.hostname.includes('replit');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Entrar no Sistema</CardTitle>
          <CardDescription>
            Faça login com suas credenciais para acessar o painel
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {isDevelopment && (
              <div className="space-y-2">
                <Label htmlFor="company">Empresa (para teste)</Label>
                <Select value={selectedCompany} onValueChange={setSelectedCompany}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma empresa" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((company) => (
                      <SelectItem key={company.value} value={company.value}>
                        {company.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="username">Usuário</Label>
              <Input
                id="username"
                type="text"
                placeholder="Digite seu usuário"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="Digite sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            <p>Usuário demo: <strong>admin</strong></p>
            <p>Senha demo: <strong>admin123</strong></p>
            {isDevelopment && (
              <p className="mt-2 text-xs text-blue-600">
                Modo desenvolvimento: Selecione uma empresa acima para testar
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
