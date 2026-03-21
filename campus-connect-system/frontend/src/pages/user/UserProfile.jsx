import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProfile, updateProfile } from '../../services/userService';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';

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

export default function UserProfile() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    fullName: '',
    idNumber: '',
    email: '',
    password: '',
    confirmPassword: '',
    confirmDetails: false,
  });

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await getProfile();
        setProfile(data);
        setForm({
          fullName: data?.fullName || '',
          idNumber: data?.idNumber || '',
          email: data?.email || '',
          password: '',
          confirmPassword: '',
          confirmDetails: false,
        });
      } catch (err) {
        setError(err.message || 'Failed to load profile details.');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const details = profile || user;

  const handleChange = (field) => (e) => {
    setSaveMessage('');
    const value = field === 'confirmDetails' ? e.target.checked : e.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaveMessage('');

    const payload = {
      fullName: form.fullName.trim(),
      idNumber: form.idNumber.trim(),
      email: form.email.trim(),
    };

    if (!payload.fullName || !payload.idNumber || !payload.email) {
      setSaveMessage('Full Name, ID Number, and Email are required.');
      return;
    }

    if (form.password && form.password.length < 6) {
      setSaveMessage('Password must be at least 6 characters.');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setSaveMessage('Password and confirmation do not match.');
      return;
    }

    if (!form.confirmDetails) {
      setSaveMessage('Please confirm your details before updating.');
      return;
    }

    if (form.password) payload.password = form.password;

    setSaving(true);
    try {
      const updated = await updateProfile(payload);
      setProfile(updated);
      if (refreshUser) {
        await refreshUser();
      }
      setForm((prev) => ({
        ...prev,
        password: '',
        confirmPassword: '',
        confirmDetails: false,
      }));
      setIsEditing(false);
      setSaveMessage('Profile updated successfully.');
    } catch (err) {
      setSaveMessage(err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate('/user');
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="py-10 px-4">
        <div className="max-w-4xl mx-auto animate-fade-in-up">
          <div className="text-center mb-8">
            <div className="flex justify-start mb-4">
              <button type="button" className="btn btn-outline" onClick={handleBack}>
                Back
              </button>
            </div>
            <h1 className="mb-1">Profile</h1>
            <p className="lead !mb-0">Your account information and status details</p>
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
            <div className="card max-w-3xl mx-auto border-2 border-primary/15 shadow-lg">
              <div className="mb-5 rounded-2xl bg-gradient-to-r from-primary/15 to-primary/5 border border-primary/20 px-4 py-3 text-center">
                <p className="text-xs uppercase tracking-[0.16em] text-primary font-semibold mb-1">User Details</p>
                <p className="text-sm text-muted-foreground">Keep your profile information up to date</p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 mb-6">
                <div className="rounded-xl border border-border bg-muted/40 p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Full Name</p>
                  <p className="font-semibold text-foreground text-base">{details?.fullName || 'N/A'}</p>
                </div>
                <div className="rounded-xl border border-border bg-muted/40 p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Role</p>
                  <p className="font-semibold text-foreground text-base">{toDisplayRole(details?.role)}</p>
                </div>
                <div className="rounded-xl border border-border bg-muted/40 p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">ID Number</p>
                  <p className="font-semibold text-foreground text-base">{details?.idNumber || 'N/A'}</p>
                </div>
                <div className="rounded-xl border border-border bg-muted/40 p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Email</p>
                  <p className="font-semibold text-foreground break-all text-base">{details?.email || 'N/A'}</p>
                </div>
                <div className="rounded-xl border border-border bg-muted/40 p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Approval Status</p>
                  <p className="font-semibold text-foreground text-base">{details?.isApproved ? 'Approved' : 'Pending'}</p>
                </div>
                <div className="rounded-xl border border-border bg-muted/40 p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Member Since</p>
                  <p className="font-semibold text-foreground text-base">{formatDate(details?.createdAt)}</p>
                </div>
              </div>

              {!isEditing ? (
                <div className="flex justify-center">
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => {
                      setSaveMessage('');
                      setForm((prev) => ({
                        ...prev,
                        fullName: details?.fullName || '',
                        idNumber: details?.idNumber || '',
                        email: details?.email || '',
                        password: '',
                        confirmPassword: '',
                        confirmDetails: false,
                      }));
                      setIsEditing(true);
                    }}
                  >
                    Update Profile
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSave} className="space-y-4 border-t border-border pt-5">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Full Name</p>
                      <input
                        className="input w-full"
                        value={form.fullName}
                        onChange={handleChange('fullName')}
                        placeholder="Enter full name"
                      />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">ID Number</p>
                      <input
                        className="input w-full"
                        value={form.idNumber}
                        onChange={handleChange('idNumber')}
                        placeholder="Enter ID number"
                      />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Email</p>
                      <input
                        type="email"
                        className="input w-full"
                        value={form.email}
                        onChange={handleChange('email')}
                        placeholder="Enter email"
                      />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Password</p>
                      <input
                        type="password"
                        className="input w-full"
                        value={form.password}
                        onChange={handleChange('password')}
                        placeholder="Enter new password"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Leave blank to keep current password.</p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border bg-muted/40 p-4">
                    <p className="text-sm font-semibold mb-3">Confirmation Section</p>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Confirm Password</p>
                        <input
                          type="password"
                          className="input w-full"
                          value={form.confirmPassword}
                          onChange={handleChange('confirmPassword')}
                          placeholder="Re-enter password"
                        />
                      </div>
                      <label className="flex items-center gap-2 text-sm text-foreground mt-6 sm:mt-0">
                        <input
                          type="checkbox"
                          checked={form.confirmDetails}
                          onChange={handleChange('confirmDetails')}
                        />
                        I confirm these details are correct.
                      </label>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 pt-1">
                    <p className={`text-sm ${saveMessage.includes('successfully') ? 'text-green-600' : 'text-red-600'}`}>
                      {saveMessage}
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="btn btn-outline"
                        onClick={() => {
                          setIsEditing(false);
                          setSaveMessage('');
                        }}
                      >
                        Cancel
                      </button>
                      <button type="submit" className="btn btn-primary" disabled={saving}>
                        {saving ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
