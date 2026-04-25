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

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
const PASSWORD_HINT =
  'Password must be at least 8 characters and include uppercase, lowercase, a number, and a symbol.';

export default function SignUpForm({ onSubmit, loading, message }) {
  const [fullName, setFullName] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('');
  const [idNumberError, setIdNumberError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const validateIdNumber = (value) => {
    if (!value?.trim()) return 'ID Number is required.';
    return '';
  };

  const validateEmail = (value) => {
    if (!value) return 'Email Address is required.';
    if (!EMAIL_REGEX.test(value)) return 'Please enter a valid email address.';
    return '';
  };

  const validatePassword = (value) => {
    if (!value) return 'Password is required.';
    if (!PASSWORD_REGEX.test(value)) return PASSWORD_HINT;
    return '';
  };

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    setEmailError(value ? validateEmail(value) : '');
  };

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setPassword(value);
    setPasswordError(value ? validatePassword(value) : '');
  };

  const handleIdNumberChange = (e) => {
    const value = e.target.value;
    setIdNumber(value);
    setIdNumberError(validateIdNumber(value));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const nextIdNumberError = validateIdNumber(idNumber);
    const nextEmailError = validateEmail(email);
    const nextPasswordError = validatePassword(password);
    setIdNumberError(nextIdNumberError);
    setEmailError(nextEmailError);
    setPasswordError(nextPasswordError);

    if (nextIdNumberError || nextEmailError || nextPasswordError) {
      return;
    }

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
            placeholder="Kasun Perera"
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
            onChange={handleIdNumberChange}
            onBlur={() => setIdNumberError(validateIdNumber(idNumber))}
            className="pl-10 h-11"
            aria-invalid={!!idNumberError}
            required
          />
        </div>
        {idNumberError && <p className="text-xs text-destructive">{idNumberError}</p>}
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
            onChange={handleEmailChange}
            onBlur={() => setEmailError(validateEmail(email))}
            className="pl-10 h-11"
            aria-invalid={!!emailError}
            required
          />
        </div>
        {emailError && <p className="text-xs text-destructive">{emailError}</p>}
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
            onChange={handlePasswordChange}
            onBlur={() => setPasswordError(validatePassword(password))}
            className="pl-10 h-11"
            minLength={8}
            aria-invalid={!!passwordError}
            required
          />
        </div>
        {passwordError ? (
          <p className="text-xs text-destructive">{passwordError}</p>
        ) : (
          <p className="text-xs text-muted-foreground">{PASSWORD_HINT}</p>
        )}
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
