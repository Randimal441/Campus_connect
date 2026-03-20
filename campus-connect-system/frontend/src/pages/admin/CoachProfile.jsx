import { useEffect, useState } from 'react';
import { getProfile } from '../../services/userService';
import { useAuth } from '../../context/AuthContext';

function formatDate(value) {
  if (!value) return 'N/A';
  return new Date(value).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function toDisplayRole(role) {
  if (!role) return 'N/A';
  return role
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export default function CoachProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await getProfile();
        setProfile(data);
      } catch (err) {
        setError(err.message || 'Failed to load profile details.');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const details = profile || user;

  return (
    <div className="animate-fade-in-up">
      <div className="flex items-center gap-4 mb-8">
        <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary to-primary-light flex items-center justify-center shadow-lg">
          <span className="text-white font-heading text-2xl">👤</span>
        </div>
        <div>
          <h1 className="mb-1">Profile</h1>
          <p className="lead !mb-0">Coach account information and status details</p>
        </div>
      </div>

      {loading ? (
        <div className="card text-center py-12">
          <div className="loader mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      ) : error ? (
        <div className="card text-center py-10">
          <p className="text-red-600 font-semibold">{error}</p>
        </div>
      ) : (
        <div className="card max-w-3xl">
          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Full Name</p>
              <p className="font-semibold text-foreground">{details?.fullName || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Role</p>
              <p className="font-semibold text-foreground">{toDisplayRole(details?.role)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">ID Number</p>
              <p className="font-semibold text-foreground">{details?.idNumber || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Email</p>
              <p className="font-semibold text-foreground break-all">{details?.email || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Approval Status</p>
              <p className="font-semibold text-foreground">{details?.isApproved ? 'Approved' : 'Pending'}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Member Since</p>
              <p className="font-semibold text-foreground">{formatDate(details?.createdAt)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
