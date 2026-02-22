import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import Button from '@/components/ui/button';

export default function SuperAdminDashboard() {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api('/approvals/pending')
      .then(setPending)
      .catch(() => setPending([]))
      .finally(() => setLoading(false));
  }, []);

  const handleApprove = async (id) => {
    try {
      await api(`/approvals/${id}/approve`, { method: 'PATCH' });
      setPending((p) => p.filter((u) => u._id !== id));
    } catch (e) {
      alert(e.message);
    }
  };

  const handleReject = async (id) => {
    try {
      await api(`/approvals/${id}/reject`, { method: 'DELETE' });
      setPending((p) => p.filter((u) => u._id !== id));
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <>
      <div className="flex items-center gap-3 mb-6">
        <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center">
          <span className="text-primary-foreground font-heading font-bold text-xl">
            CC
          </span>
        </div>
        <div>
          <h1>Super Admin Dashboard</h1>
          <p className="lead !mb-0">Approve or reject sign-up requests.</p>
        </div>
      </div>
        {loading ? (
          <p>Loading...</p>
        ) : pending.length === 0 ? (
          <p>No pending approvals.</p>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>ID</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pending.map((u) => (
                  <tr key={u._id}>
                    <td>{u.fullName}</td>
                    <td>{u.idNumber}</td>
                    <td>{u.email}</td>
                    <td>{u.role}</td>
                    <td>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          className="!bg-primary hover:!bg-primary-dark !text-white h-9 px-3 text-sm"
                          onClick={() => handleApprove(u._id)}
                        >
                          Approve
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          className="!border-destructive !text-destructive hover:!bg-destructive/10 h-9 px-3 text-sm"
                          onClick={() => handleReject(u._id)}
                        >
                          Reject
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
    </>
  );
}
