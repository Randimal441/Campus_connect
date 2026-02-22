import { useState } from 'react';
import { Input } from '@/components/ui/input';
import Button from '@/components/ui/button';
import Label from '@/components/ui/label';
import Select from '@/components/ui/select';
import { User, Hash, Mail, Lock, Loader2 } from 'lucide-react';
import { ROLE_LABELS, ROLES } from '../../utils/constants';

const SIGNUP_ROLES = [
  ROLES.STUDENT,
  ROLES.COACH,
  ROLES.RESOURCE_COORDINATOR,
  ROLES.CONSULTANT,
  ROLES.EVENT_COORDINATOR,
];

export default function SignUpForm({ onSubmit, loading, message }) {
  const [fullName, setFullName] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ fullName, idNumber, email, password, role });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="fullName">Full Name</Label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="fullName"
            type="text"
            placeholder="John Doe"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="pl-10 h-11"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="idNumber">ID Number</Label>
        <div className="relative">
          <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="idNumber"
            type="text"
            placeholder="STU-12345"
            value={idNumber}
            onChange={(e) => setIdNumber(e.target.value)}
            className="pl-10 h-11"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="signup-email">Email Address</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="signup-email"
            type="email"
            placeholder="you@university.edu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pl-10 h-11"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="signup-password">Password</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="signup-password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pl-10 h-11"
            minLength={6}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="userType">User Type</Label>
        <Select
          value={role}
          onValueChange={setRole}
          placeholder="Select your role"
          required
        >
          {SIGNUP_ROLES.map((r) => (
            <option key={r} value={r}>
              {ROLE_LABELS[r]}
            </option>
          ))}
        </Select>
      </div>

      {message && (
        <p
          className={`text-sm text-center ${
            message.includes('successful') || message.includes('pending')
              ? 'text-success'
              : 'text-destructive'
          }`}
        >
          {message}
        </p>
      )}

      <Button
        type="submit"
        className="w-full h-11 font-semibold"
        disabled={loading || !role}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating Account...
          </>
        ) : (
          'Create Account'
        )}
      </Button>
    </form>
  );
}
