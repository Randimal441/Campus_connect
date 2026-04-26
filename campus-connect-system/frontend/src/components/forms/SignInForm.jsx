import { useState } from 'react';
import { Input } from '@/components/ui/input';
import Button from '@/components/ui/button';
import Label from '@/components/ui/label';
import { Mail, Lock, Loader2 } from 'lucide-react';

export default function SignInForm({ onSubmit, loading, message }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ email, password });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="signin-email">Email or ID Number</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="signin-email"
            type="text"
            placeholder="you@university.edu or STU-12345"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pl-10 h-11"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="signin-password">Password</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="signin-password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pl-10 h-11"
            required
          />
        </div>
      </div>

      {message && (
        <p
          className={`text-sm text-center ${
            message.includes('successful') ? 'text-success' : 'text-destructive'
          }`}
        >
          {message}
        </p>
      )}

      <Button
        type="submit"
        className="w-full h-11 font-semibold"
        disabled={loading}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Signing in...
          </>
        ) : (
          'Sign In'
        )}
      </Button>
    </form>
  );
}
