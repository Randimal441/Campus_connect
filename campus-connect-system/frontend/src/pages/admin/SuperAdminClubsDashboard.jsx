import { useEffect, useState, useCallback } from 'react';
import { api } from '../../services/api';
import Button from '@/components/ui/button';

const CLUB_STATUS_BADGE = {
  pending_approval: 'bg-yellow-100 text-yellow-800',
  approved:         'bg-green-100 text-green-800',
  disabled:         'bg-red-100 text-red-800',
};

function formatDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function SuperAdminClubsDashboard() {
  const [clubs, setClubs]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState('all');

  const fetchClubs = useCallback(async () => {
    setLoading(true);
    const data = await api('/clubs-sports/admin/all').catch(() => []);
    setClubs(data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchClubs(); }, [fetchClubs]);

  const setStatus = async (id, status) => {
    try {
      await api(`/clubs-sports/${id}/status`, { method: 'PATCH', body: { status } });
      await fetchClubs();
    } catch (e) {
      alert(e.message);
    }
  };

  const filtered = filter === 'all' ? clubs : clubs.filter((c) => c.status === filter);

  const counts = {
    all:              clubs.length,
    pending_approval: clubs.filter((c) => c.status === 'pending_approval').length,
    approved:         clubs.filter((c) => c.status === 'approved').length,
    disabled:         clubs.filter((c) => c.status === 'disabled').length,
  };

  return (
    <>
      {/* header */}
      <div className="flex items-center gap-4 mb-8 animate-fade-in-up">
        <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary to-primary-light flex items-center justify-center shadow-lg">
          <span className="text-white font-heading font-black text-2xl">🏆</span>
        </div>
        <div>
          <h1 className="mb-1">Clubs &amp; Sports Oversight</h1>
          <p className="lead !mb-0">Approve, disable or re-enable clubs and sports teams</p>
        </div>
      </div>

      {/* summary filter cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { key: 'all',              label: 'Total',    color: 'text-primary' },
          { key: 'pending_approval', label: 'Pending',  color: 'text-yellow-600' },
          { key: 'approved',         label: 'Approved', color: 'text-green-600' },
          { key: 'disabled',         label: 'Disabled', color: 'text-red-600' },
        ].map((s) => (
          <button
            key={s.key}
            onClick={() => setFilter(s.key)}
            className={`rounded-xl p-4 text-left border-2 transition-all ${
              filter === s.key
                ? 'border-primary bg-primary/5'
                : 'border-border bg-muted hover:border-primary/40'
            }`}
          >
            <p className={`text-2xl font-bold ${s.color}`}>{counts[s.key]}</p>
            <p className="text-sm text-muted-foreground font-medium">{s.label}</p>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="loader mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading clubs…</p>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-muted rounded-2xl">
          <div className="text-6xl mb-4">🎯</div>
          <p className="text-xl font-semibold text-muted-foreground mb-2">No clubs in this category</p>
          <p className="text-muted-foreground">Check back once coaches create clubs.</p>
        </div>
      ) : (
        <div className="table-wrapper animate-fade-in">
          <table className="data-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Type</th>
                <th>Coach</th>
                <th>Created</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c._id}>
                  <td className="font-semibold">{c.title}</td>
                  <td className="capitalize">{c.category}</td>
                  <td className="text-muted-foreground text-sm">{c.sportType || '—'}</td>
                  <td className="text-sm">{c.createdBy?.fullName || '—'}</td>
                  <td className="text-sm text-muted-foreground">{formatDate(c.createdAt)}</td>
                  <td>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${CLUB_STATUS_BADGE[c.status]}`}>
                      {c.status?.replace('_', ' ')}
                    </span>
                  </td>
                  <td>
                    <div className="flex gap-2">
                      {c.status !== 'approved' && (
                        <Button size="sm" onClick={() => setStatus(c._id, 'approved')}>
                          ✔ Approve
                        </Button>
                      )}
                      {c.status !== 'disabled' && (
                        <Button size="sm" variant="destructive" onClick={() => setStatus(c._id, 'disabled')}>
                          ⛔ Disable
                        </Button>
                      )}
                      {c.status === 'disabled' && (
                        <Button size="sm" variant="outline" onClick={() => setStatus(c._id, 'approved')}>
                          ✅ Re-enable
                        </Button>
                      )}
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
