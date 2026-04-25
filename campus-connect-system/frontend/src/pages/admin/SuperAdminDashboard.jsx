import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import Button from '@/components/ui/button';
import { toast } from 'react-toastify';

/* ────── main component ──────────────────────── */
export default function SuperAdminDashboard() {
  const [pending, setPending] = useState([]);
  const [users, setUsers] = useState([]);
  const [moderation, setModeration] = useState({
    pending_approval: 0,
    approved: 0,
    disabled: 0,
    total: 0,
  });
  const [consultantReviewStats, setConsultantReviewStats] = useState({
    review: 0,
    approve: 0,
    total: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      api('/approvals/pending'),
      api('/clubs-sports/admin/all'),
      api('/consulting'),
      api('/users/admin/all'),
    ]).then(([approvalsResult, clubsResult, consultantsResult, usersResult]) => {
        if (approvalsResult.status === 'fulfilled') {
          const pendingApprovals = Array.isArray(approvalsResult.value) ? approvalsResult.value : [];
          setPending(pendingApprovals);

          const consultantsPendingReview = pendingApprovals.filter((user) => user?.role === 'consultant').length;
          const approvedConsultants =
            consultantsResult.status === 'fulfilled' && Array.isArray(consultantsResult.value)
              ? consultantsResult.value.length
              : 0;

          setConsultantReviewStats({
            review: consultantsPendingReview,
            approve: approvedConsultants,
            total: consultantsPendingReview + approvedConsultants,
          });
        } else {
          setPending([]);
          const approvedConsultants =
            consultantsResult.status === 'fulfilled' && Array.isArray(consultantsResult.value)
              ? consultantsResult.value.length
              : 0;

          setConsultantReviewStats({
            review: 0,
            approve: approvedConsultants,
            total: approvedConsultants,
          });
        }

        if (clubsResult.status === 'fulfilled') {
          const clubs = Array.isArray(clubsResult.value) ? clubsResult.value : [];
          const counts = clubs.reduce(
            (acc, club) => {
              const status = club?.status;
              if (status === 'pending_approval') acc.pending_approval += 1;
              else if (status === 'approved') acc.approved += 1;
              else if (status === 'disabled') acc.disabled += 1;
              return acc;
            },
            { pending_approval: 0, approved: 0, disabled: 0 }
          );

          setModeration({
            ...counts,
            total: clubs.length,
          });
        } else {
          setModeration({ pending_approval: 0, approved: 0, disabled: 0, total: 0 });
        }

        if (usersResult.status === 'fulfilled') {
          setUsers(Array.isArray(usersResult.value) ? usersResult.value : []);
        } else {
          setUsers([]);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const moderationSeries = [
    {
      key: 'pending_approval',
      label: 'Pending Approval',
      value: moderation.pending_approval,
      barClass: 'bg-amber-500',
      textClass: 'text-amber-700',
    },
    {
      key: 'approved',
      label: 'Approved',
      value: moderation.approved,
      barClass: 'bg-emerald-500',
      textClass: 'text-emerald-700',
    },
    {
      key: 'disabled',
      label: 'Disabled',
      value: moderation.disabled,
      barClass: 'bg-rose-500',
      textClass: 'text-rose-700',
    },
  ];

  const maxBar = Math.max(...moderationSeries.map((item) => item.value), 1);
  const consultantPie = consultantReviewStats.total
    ? `conic-gradient(#f59e0b 0deg ${(consultantReviewStats.review / consultantReviewStats.total) * 360}deg, #10b981 ${(consultantReviewStats.review / consultantReviewStats.total) * 360}deg 360deg)`
    : 'conic-gradient(#e5e7eb 0deg 360deg)';

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
          <span className="text-white font-heading font-black text-2xl">⚙️</span>
        </div>
        <div>
          <h1 className="mb-1">Super Admin Dashboard</h1>
          <p className="lead !mb-0">Review and manage user sign-up requests</p>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 xl:grid-cols-2 gap-6 animate-fade-in-up">
        <div className="card">
          <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
            <div>
              <h3 className="mb-1">Club Moderation Overview</h3>
              <p className="text-sm text-muted-foreground">Status distribution of clubs and sports entries</p>
            </div>
            <span className="badge">Total: {moderation.total}</span>
          </div>

          <div className="rounded-xl border border-border bg-muted/30 p-4">
            <div className="h-56 grid grid-cols-3 gap-4 items-end">
              {moderationSeries.map((item) => (
                <div key={item.key} className="h-full flex flex-col justify-end items-center">
                  <span className={`text-sm font-bold mb-2 ${item.textClass}`}>{item.value}</span>
                  <div className="w-full max-w-[90px] h-[82%] rounded-lg bg-muted flex items-end overflow-hidden">
                    <div
                      className={`w-full rounded-lg transition-all duration-500 ${item.barClass}`}
                      style={{ height: `${(item.value / maxBar) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs sm:text-sm text-muted-foreground text-center mt-2 leading-tight">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
            <div>
              <h3 className="mb-1">Consultant Review &amp; Approve</h3>
              <p className="text-sm text-muted-foreground">Live split of consultant records under review vs approved</p>
            </div>
            <span className="badge">Total: {consultantReviewStats.total}</span>
          </div>

          <div className="rounded-xl border border-border bg-muted/30 p-4 min-h-[260px] flex flex-col sm:flex-row items-center justify-center gap-8">
            <div
              className="h-44 w-44 rounded-full border border-border shadow-inner"
              style={{ background: consultantPie }}
            />

            <div className="space-y-3 w-full sm:w-auto">
              <div className="flex items-center justify-between sm:justify-start sm:gap-3">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-amber-500" />
                  <span className="text-sm text-muted-foreground">Review</span>
                </div>
                <span className="text-sm font-bold text-amber-700">{consultantReviewStats.review}</span>
              </div>

              <div className="flex items-center justify-between sm:justify-start sm:gap-3">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-emerald-500" />
                  <span className="text-sm text-muted-foreground">Approve</span>
                </div>
                <span className="text-sm font-bold text-emerald-700">{consultantReviewStats.approve}</span>
              </div>

              {consultantReviewStats.total === 0 && (
                <p className="text-xs text-muted-foreground">No consultant review data available yet.</p>
              )}
            </div>
          </div>
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
                        <Button type="button" size="sm" onClick={() => handleApprove(u._id)}>
                          ✔ Approve
                        </Button>
                        <Button type="button" variant="destructive" size="sm" onClick={() => handleReject(u._id)}>
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

      <div className="mt-10 space-y-4 animate-fade-in-up">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h3 className="mb-1">All Users</h3>
            <p className="text-sm text-muted-foreground">Complete list of registered users and approval status</p>
          </div>
          <span className="badge">Total: {users.length}</span>
        </div>

        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>ID Number</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center text-muted-foreground py-8">
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user._id}>
                    <td className="font-semibold">{user.fullName}</td>
                    <td className="font-mono text-sm">{user.idNumber}</td>
                    <td>{user.email}</td>
                    <td>
                      <span className="badge">{user.role}</span>
                    </td>
                    <td>
                      <span className={`badge ${user.isApproved ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {user.isApproved ? 'Approved' : 'Pending'}
                      </span>
                    </td>
                    <td>{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
