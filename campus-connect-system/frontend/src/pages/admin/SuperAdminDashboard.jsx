import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import Button from '@/components/ui/button';
import { toast } from 'react-toastify';

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
      toast.error(e.message);
    }
  };

  const handleReject = async (id) => {
    try {
      await api(`/approvals/${id}/reject`, { method: 'DELETE' });
      setPending((p) => p.filter((u) => u._id !== id));
    } catch (e) {
      toast.error(e.message);
    }
  };

  return (
    <>
      <div className="flex items-center gap-4 mb-8 animate-fade-in-up">
        <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary to-primary-light flex items-center justify-center shadow-lg">
          <span className="text-white font-heading font-black text-2xl">
            ⚙️
          </span>
        </div>
        <div>
          <h1 className="mb-1">Super Admin Dashboard</h1>
          <p className="lead !mb-0">Review and manage user sign-up requests</p>
        </div>
      </div>
      
      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="loader mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading pending approvals...</p>
          </div>
        </div>
      ) : pending.length === 0 ? (
        <div className="text-center py-16 bg-muted rounded-2xl">
          <div className="text-6xl mb-4">✅</div>
          <p className="text-2xl font-bold text-foreground mb-2">All caught up!</p>
          <p className="text-muted-foreground">No pending approvals at the moment</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-gradient-to-r from-primary/10 to-primary/5 px-6 py-4 rounded-xl border border-primary/20">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-primary font-bold text-lg">{pending.length}</span>
              </div>
              <div>
                <p className="font-bold text-foreground">Pending Requests</p>
                <p className="text-sm text-muted-foreground">Review and take action</p>
              </div>
            </div>
          </div>
          
          <div className="table-wrapper animate-fade-in">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>ID Number</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pending.map((u) => (
                  <tr key={u._id}>
                    <td className="font-semibold">{u.fullName}</td>
                    <td className="font-mono text-sm">{u.idNumber}</td>
                    <td>{u.email}</td>
                    <td>
                      <span className="badge">{u.role}</span>
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => handleApprove(u._id)}
                        >
                          ✔ Approve
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => handleReject(u._id)}
                        >
                          ✖ Reject
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
