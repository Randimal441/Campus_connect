import { useEffect, useState, useCallback } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Button from '@/components/ui/button';

/* ─── tiny helpers ─────────────────────────────── */
const STATUS_BADGE = {
  pending_approval: 'bg-yellow-100 text-yellow-800',
  approved:         'bg-green-100 text-green-800',
  disabled:         'bg-red-100 text-red-800',
};
const REQ_BADGE = {
  pending:  'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
};

function formatDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

/* ─────────────────────────────────────────────────
   SUPER ADMIN – CLUBS OVERSIGHT PANEL
   Rendered only when user role === 'super_admin'
───────────────────────────────────────────────── */
function ClubsOversightPanel() {
  const [clubs, setClubs]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState('all');

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const data = await api('/clubs-sports/admin/all').catch(() => []);
    setClubs(data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const setStatus = async (id, status) => {
    try {
      await api(`/clubs-sports/${id}/status`, { method: 'PATCH', body: { status } });
      await fetchAll();
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
    <div className="mt-10">
      {/* section divider */}
      <div className="flex items-center gap-3 mb-6">
        <div className="h-px flex-1 bg-border"></div>
        <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full border border-primary/20">
          <span className="text-lg">🛡️</span>
          <span className="text-sm font-bold text-primary">Super Admin – Club Moderation</span>
        </div>
        <div className="h-px flex-1 bg-border"></div>
      </div>

      {/* filter summary cards */}
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
        <div className="flex justify-center py-10"><div className="loader"></div></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 bg-muted rounded-2xl">
          <p className="text-4xl mb-3">🎯</p>
          <p className="font-semibold text-muted-foreground">No clubs in this category.</p>
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
                  <td className="text-sm text-muted-foreground">{c.sportType || '—'}</td>
                  <td className="text-sm">{c.createdBy?.fullName || '—'}</td>
                  <td className="text-sm text-muted-foreground">{formatDate(c.createdAt)}</td>
                  <td>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${STATUS_BADGE[c.status]}`}>
                      {c.status?.replace('_', ' ')}
                    </span>
                  </td>
                  <td>
                    <div className="flex gap-2">
                      {c.status !== 'approved' && (
                        <Button size="sm" onClick={() => setStatus(c._id, 'approved')}>✔ Approve</Button>
                      )}
                      {c.status !== 'disabled' && (
                        <Button size="sm" variant="destructive" onClick={() => setStatus(c._id, 'disabled')}>⛔ Disable</Button>
                      )}
                      {c.status === 'disabled' && (
                        <Button size="sm" variant="outline" onClick={() => setStatus(c._id, 'approved')}>✅ Re‑enable</Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────
   CLUB FORM MODAL
───────────────────────────────────────────────── */
function ClubFormModal({ initial, onSave, onClose }) {
  const [form, setForm] = useState(
    initial ?? { title: '', description: '', category: 'club', sportType: '', coachInfo: '' }
  );
  const [busy, setBusy] = useState(false);
  const [err, setErr]   = useState('');

  const handle = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    if (!form.title.trim()) return setErr('Title is required.');
    setBusy(true); setErr('');
    try {
      await onSave(form);
      onClose();
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={(e) => e.stopPropagation()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">{initial ? 'Edit Club / Sport' : 'Create Club / Sport'}</h2>

          <div className="space-y-3">
            <div>
              <label className="label">Title *</label>
              <input className="input w-full" value={form.title} onChange={handle('title')} />
            </div>
            <div>
              <label className="label">Category *</label>
              <select className="input w-full" value={form.category} onChange={handle('category')}>
                <option value="club">Club</option>
                <option value="sport">Sport</option>
              </select>
            </div>
            <div>
              <label className="label">Sport / Club Type (e.g. Football, Chess)</label>
              <input className="input w-full" value={form.sportType} onChange={handle('sportType')} />
            </div>
            <div>
              <label className="label">Description</label>
              <textarea className="input w-full h-24 resize-none" value={form.description} onChange={handle('description')} />
            </div>
            <div>
              <label className="label">Coach Information</label>
              <textarea className="input w-full h-20 resize-none" placeholder="Your bio, contact info…" value={form.coachInfo} onChange={handle('coachInfo')} />
            </div>
          </div>

          {err && <p className="text-red-600 text-sm mt-3">{err}</p>}

          <div className="flex gap-3 mt-5">
            <button onClick={submit} disabled={busy} className="btn btn-primary flex-1">
              {busy ? 'Saving…' : 'Save'}
            </button>
            <button onClick={onClose} className="btn btn-outline flex-1">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────
   SCHEDULE FORM MODAL
───────────────────────────────────────────────── */
function ScheduleFormModal({ initial, onSave, onClose }) {
  const [form, setForm] = useState(
    initial
      ? { ...initial, date: initial.date ? initial.date.slice(0, 10) : '' }
      : { title: '', date: '', time: '', location: '', description: '' }
  );
  const [busy, setBusy] = useState(false);
  const [err, setErr]   = useState('');

  const handle = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    if (!form.title || !form.date || !form.time) return setErr('Title, date, and time are required.');
    setBusy(true); setErr('');
    try {
      await onSave(form);
      onClose();
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={(e) => e.stopPropagation()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">{initial ? 'Edit Schedule' : 'Add Schedule'}</h2>
          <div className="space-y-3">
            <div>
              <label className="label">Title *</label>
              <input className="input w-full" value={form.title} onChange={handle('title')} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Date *</label>
                <input type="date" className="input w-full" value={form.date} onChange={handle('date')} />
              </div>
              <div>
                <label className="label">Time *</label>
                <input type="time" className="input w-full" value={form.time} onChange={handle('time')} />
              </div>
            </div>
            <div>
              <label className="label">Location</label>
              <input className="input w-full" value={form.location} onChange={handle('location')} />
            </div>
            <div>
              <label className="label">Notes</label>
              <textarea className="input w-full h-20 resize-none" value={form.description} onChange={handle('description')} />
            </div>
          </div>
          {err && <p className="text-red-600 text-sm mt-3">{err}</p>}
          <div className="flex gap-3 mt-5">
            <button onClick={submit} disabled={busy} className="btn btn-primary flex-1">{busy ? 'Saving…' : 'Save'}</button>
            <button onClick={onClose} className="btn btn-outline flex-1">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────
   TEAM FORM MODAL
───────────────────────────────────────────────── */
function TeamFormModal({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial ?? { name: '', description: '' });
  const [busy, setBusy] = useState(false);
  const [err, setErr]   = useState('');

  const handle = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    if (!form.name.trim()) return setErr('Team name is required.');
    setBusy(true); setErr('');
    try {
      await onSave(form);
      onClose();
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={(e) => e.stopPropagation()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">{initial ? 'Edit Team' : 'Add Team'}</h2>
          <div className="space-y-3">
            <div>
              <label className="label">Team Name *</label>
              <input className="input w-full" value={form.name} onChange={handle('name')} />
            </div>
            <div>
              <label className="label">Description</label>
              <textarea className="input w-full h-20 resize-none" value={form.description} onChange={handle('description')} />
            </div>
          </div>
          {err && <p className="text-red-600 text-sm mt-3">{err}</p>}
          <div className="flex gap-3 mt-5">
            <button onClick={submit} disabled={busy} className="btn btn-primary flex-1">{busy ? 'Saving…' : 'Save'}</button>
            <button onClick={onClose} className="btn btn-outline flex-1">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────
   CLUB MANAGE PANEL  (schedules, teams, requests)
───────────────────────────────────────────────── */
function ClubManagePanel({ club, onClose, onClubUpdated }) {
  const [tab, setTab]             = useState('schedules');
  const [schedules, setSchedules] = useState([]);
  const [teams, setTeams]         = useState([]);
  const [requests, setRequests]   = useState([]);
  const [loading, setLoading]     = useState(true);

  const [scheduleModal, setScheduleModal] = useState(null); // null | 'new' | schedule-obj
  const [teamModal, setTeamModal]         = useState(null); // null | 'new' | team-obj
  const [memberPicker, setMemberPicker]   = useState(null); // teamId whose picker is open

  const load = useCallback(async () => {
    setLoading(true);
    const [s, t, r] = await Promise.all([
      api(`/clubs-sports/${club._id}/schedules`).catch(() => []),
      api(`/clubs-sports/${club._id}/teams`).catch(() => []),
      api(`/clubs-sports/${club._id}/requests`).catch(() => []),
    ]);
    setSchedules(s); setTeams(t); setRequests(r);
    setLoading(false);
  }, [club._id]);

  useEffect(() => { load(); }, [load]);

  /* schedules */
  const saveSchedule = async (form) => {
    if (scheduleModal && scheduleModal._id) {
      await api(`/clubs-sports/schedules/${scheduleModal._id}`, { method: 'PATCH', body: form });
    } else {
      await api(`/clubs-sports/${club._id}/schedules`, { method: 'POST', body: form });
    }
    await load();
  };

  const deleteSchedule = async (id) => {
    if (!window.confirm('Delete this schedule?')) return;
    await api(`/clubs-sports/schedules/${id}`, { method: 'DELETE' });
    await load();
  };

  /* teams */
  const saveTeam = async (form) => {
    if (teamModal && teamModal._id) {
      await api(`/clubs-sports/teams/${teamModal._id}`, { method: 'PATCH', body: form });
    } else {
      await api(`/clubs-sports/${club._id}/teams`, { method: 'POST', body: form });
    }
    await load();
  };

  const deleteTeam = async (id) => {
    if (!window.confirm('Delete this team?')) return;
    await api(`/clubs-sports/teams/${id}`, { method: 'DELETE' });
    await load();
  };

  const addMember = async (teamId, userId) => {
    await api(`/clubs-sports/teams/${teamId}/members`, { method: 'PATCH', body: { userId, action: 'add' } });
    setMemberPicker(null);
    await load();
  };

  const removeMember = async (teamId, userId) => {
    await api(`/clubs-sports/teams/${teamId}/members`, { method: 'PATCH', body: { userId, action: 'remove' } });
    await load();
  };

  /* join requests */
  const handleRequest = async (reqId, status) => {
    await api(`/clubs-sports/requests/${reqId}/status`, { method: 'PATCH', body: { status } });
    await load();
    // refresh parent card so approved member appears immediately
    if (onClubUpdated) onClubUpdated();
  };

  const TABS = ['schedules', 'teams', 'requests'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-primary to-primary-light p-5 rounded-t-2xl text-white flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold">{club.title}</h2>
            <p className="text-white/70 text-sm">Manage schedules, teams, and membership requests</p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white text-2xl leading-none">✕</button>
        </div>

        {/* tabs */}
        <div className="flex border-b border-border">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-3 text-sm font-semibold capitalize transition-colors ${tab === t ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {t === 'schedules' ? '📅 Schedules' : t === 'teams' ? '👥 Teams' : '📬 Requests'}
              {t === 'requests' && requests.filter((r) => r.status === 'pending').length > 0 && (
                <span className="ml-1.5 bg-red-500 text-white rounded-full text-xs px-1.5">
                  {requests.filter((r) => r.status === 'pending').length}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="p-5">
          {loading ? (
            <div className="py-12 text-center"><div className="loader mx-auto"></div></div>
          ) : (
            <>
              {/* ── schedules ── */}
              {tab === 'schedules' && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold">Practice Schedules</h3>
                    <button className="btn btn-sm btn-primary" onClick={() => setScheduleModal('new')}>+ Add</button>
                  </div>
                  {schedules.length === 0 ? (
                    <p className="text-muted-foreground text-sm italic">No schedules yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {schedules.map((s) => (
                        <div key={s._id} className="border border-border rounded-xl p-4 flex justify-between items-start gap-3">
                          <div>
                            <p className="font-medium">{s.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatDate(s.date)} · {s.time}
                              {s.location ? ` · 📍 ${s.location}` : ''}
                            </p>
                            {s.description && <p className="text-xs text-muted-foreground mt-1">{s.description}</p>}
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <button className="btn btn-xs btn-outline" onClick={() => setScheduleModal(s)}>Edit</button>
                            <button className="btn btn-xs btn-destructive" onClick={() => deleteSchedule(s._id)}>Del</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ── teams ── */}
              {tab === 'teams' && (
                <div>

                  {/* ── Approved Members list ── */}
                  <div className="mb-6">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      ✅ Approved Members ({requests.filter((r) => r.status === 'approved').length})
                    </p>
                    {requests.filter((r) => r.status === 'approved').length === 0 ? (
                      <p className="text-sm text-muted-foreground italic">No approved members yet.</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {requests.filter((r) => r.status === 'approved').map((r) => (
                          <div key={r._id} className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-full pl-1 pr-2 py-1">
                            <span className="h-6 w-6 rounded-full bg-green-200 flex items-center justify-center text-green-800 font-bold text-xs shrink-0">
                              {r.user?.fullName?.charAt(0)?.toUpperCase()}
                            </span>
                            <span className="text-sm font-medium text-green-900">{r.user?.fullName}</span>
                            <span className="text-xs text-green-600">· {r.user?.idNumber}</span>
                            <button
                              className="ml-1 text-red-400 hover:text-red-700 font-bold text-sm leading-none"
                              title="Remove member"
                              onClick={() => handleRequest(r._id, 'rejected')}
                            >✕</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="border-t border-border pt-5">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-semibold">Teams</h3>
                      <button className="btn btn-sm btn-primary" onClick={() => setTeamModal('new')}>+ Add Team</button>
                    </div>

                  {teams.length === 0 ? (
                    <div className="text-center py-10 bg-muted rounded-2xl">
                      <p className="text-4xl mb-2">👥</p>
                      <p className="text-muted-foreground text-sm">No teams yet. Create a team and add approved players.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {teams.map((team) => {
                        // approved students not already in this team
                        const teamMemberIds = new Set(team.members?.map((m) => m._id));
                        const available = requests
                          .filter((r) => r.status === 'approved' && !teamMemberIds.has(r.user?._id));

                        return (
                          <div key={team._id} className="border border-border rounded-xl p-4">
                            {/* team header */}
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <p className="font-semibold">{team.name}</p>
                                {team.description && <p className="text-xs text-muted-foreground">{team.description}</p>}
                              </div>
                              <div className="flex gap-2 shrink-0">
                                <button className="btn btn-xs btn-outline" onClick={() => setTeamModal(team)}>Edit</button>
                                <button className="btn btn-xs btn-destructive" onClick={() => deleteTeam(team._id)}>Del</button>
                              </div>
                            </div>

                            {/* roster */}
                            {team.members?.length > 0 ? (
                              <div className="space-y-1.5 mb-3">
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Players</p>
                                {team.members.map((m) => (
                                  <div key={m._id} className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2">
                                    <span className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                                      {m.fullName?.charAt(0)?.toUpperCase()}
                                    </span>
                                    <span className="flex-1 text-sm font-medium">{m.fullName}</span>
                                    <span className="text-xs text-muted-foreground">{m.idNumber}</span>
                                    <button
                                      className="text-red-500 hover:text-red-700 text-xs font-semibold ml-1"
                                      onClick={() => removeMember(team._id, m._id)}
                                    >Remove</button>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-muted-foreground italic mb-3">No players yet.</p>
                            )}

                            {/* add member button + picker */}
                            {available.length > 0 && (
                              <div className="relative">
                                <button
                                  className="btn btn-xs btn-outline w-full"
                                  onClick={() => setMemberPicker(memberPicker === team._id ? null : team._id)}
                                >
                                  + Add Player
                                </button>
                                {memberPicker === team._id && (
                                  <div className="absolute left-0 right-0 mt-1 bg-white border border-border rounded-xl shadow-xl z-10 max-h-48 overflow-y-auto">
                                    {available.map((r) => (
                                      <button
                                        key={r._id}
                                        className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-muted text-left text-sm transition-colors"
                                        onClick={() => addMember(team._id, r.user._id)}
                                      >
                                        <span className="h-7 w-7 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-xs shrink-0">
                                          {r.user?.fullName?.charAt(0)?.toUpperCase()}
                                        </span>
                                        <div>
                                          <p className="font-medium">{r.user?.fullName}</p>
                                          <p className="text-xs text-muted-foreground">{r.user?.idNumber}</p>
                                        </div>
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                  </div>{/* end border-t teams section */}
                </div>
              )}

              {/* ── requests ── */}
              {tab === 'requests' && (
                <div>
                  <h3 className="font-semibold mb-4">Membership Requests</h3>
                  {requests.length === 0 ? (
                    <p className="text-muted-foreground text-sm italic">No requests yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {requests.map((r) => (
                        <div key={r._id} className="border border-border rounded-xl p-4 flex items-center justify-between gap-3">
                          <div>
                            <p className="font-semibold text-sm">{r.user?.fullName}</p>
                            <p className="text-xs text-muted-foreground">{r.user?.email} · {r.user?.idNumber}</p>
                            {r.message && <p className="text-xs italic text-muted-foreground mt-1">"{r.message}"</p>}
                            <p className="text-xs text-muted-foreground mt-1">{formatDate(r.createdAt)}</p>
                          </div>
                          <div className="flex flex-col items-end gap-2 shrink-0">
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${REQ_BADGE[r.status]}`}>
                              {r.status}
                            </span>
                            {r.status === 'pending' && (
                              <div className="flex gap-2">
                                <button className="btn btn-xs btn-primary" onClick={() => handleRequest(r._id, 'approved')}>✔ Approve</button>
                                <button className="btn btn-xs btn-destructive" onClick={() => handleRequest(r._id, 'rejected')}>✖ Reject</button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* nested modals */}
      {scheduleModal && (
        <ScheduleFormModal
          initial={scheduleModal === 'new' ? null : scheduleModal}
          onSave={saveSchedule}
          onClose={() => setScheduleModal(null)}
        />
      )}
      {teamModal && (
        <TeamFormModal
          initial={teamModal === 'new' ? null : teamModal}
          onSave={saveTeam}
          onClose={() => setTeamModal(null)}
        />
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────
   MAIN COACH DASHBOARD
───────────────────────────────────────────────── */
export default function CoachesDashboard() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'super_admin';

  const [items, setItems]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [clubModal, setClubModal]   = useState(null);  // null | 'new' | club-obj
  const [manageClub, setManageClub] = useState(null);  // club being managed

  const fetchClubs = useCallback(async () => {
    const endpoint = isSuperAdmin ? '/clubs-sports/admin/all' : '/clubs-sports/my-clubs';
    const data = await api(endpoint).catch(() => []);
    setItems(data);
  }, [isSuperAdmin]);

  useEffect(() => {
    setLoading(true);
    fetchClubs().finally(() => setLoading(false));
  }, [fetchClubs]);

  const saveClub = async (form) => {
    if (clubModal && clubModal._id) {
      await api(`/clubs-sports/${clubModal._id}`, { method: 'PATCH', body: form });
    } else {
      await api('/clubs-sports', { method: 'POST', body: form });
    }
    await fetchClubs();
  };

  const deleteClub = async (id) => {
    if (!window.confirm('Remove this club?')) return;
    await api(`/clubs-sports/${id}`, { method: 'DELETE' });
    await fetchClubs();
  };

  return (
    <>
      <div className="flex items-center justify-between mb-8 animate-fade-in-up">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary to-primary-light flex items-center justify-center shadow-lg">
            <span className="text-white font-heading text-2xl">🏆</span>
          </div>
          <div>
            <h1 className="mb-1">Clubs &amp; Sports</h1>
            <p className="lead !mb-0">Manage your clubs, teams, schedules &amp; memberships</p>
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => setClubModal('new')}>
          + New Club / Sport
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="loader mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading…</p>
          </div>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 bg-muted rounded-2xl">
          <div className="text-6xl mb-4">🎯</div>
          <p className="text-xl font-bold mb-2">No clubs yet</p>
          <p className="text-muted-foreground mb-4">Create your first club or sports team!</p>
          <button className="btn btn-primary" onClick={() => setClubModal('new')}>+ Create Club</button>
        </div>
      ) : (
        <div className="card-grid">
          {items.map((item) => (
            <div key={item._id} className="card animate-fade-in">
              <div className="flex items-start justify-between mb-3">
                <h3 className="flex-1 leading-snug">{item.title}</h3>
                <span className={`badge ml-2 shrink-0 ${STATUS_BADGE[item.status] || ''}`}>
                  {item.status?.replace('_', ' ')}
                </span>
              </div>
              <div className="flex gap-1 mb-3">
                <span className="badge">{item.category}</span>
                {item.sportType && <span className="badge">{item.sportType}</span>}
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{item.description}</p>
              <div className="flex gap-2 mt-auto">
                <button
                  className="btn btn-sm btn-primary flex-1"
                  onClick={() => setManageClub(item)}
                >
                  Manage
                </button>
                <button
                  className="btn btn-sm btn-outline"
                  onClick={() => setClubModal(item)}
                >
                  Edit
                </button>
                <button
                  className="btn btn-sm btn-destructive"
                  onClick={() => deleteClub(item._id)}
                >
                  Del
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {clubModal && (
        <ClubFormModal
          initial={clubModal === 'new' ? null : clubModal}
          onSave={saveClub}
          onClose={() => setClubModal(null)}
        />
      )}

      {manageClub && (
        <ClubManagePanel
          club={manageClub}
          onClose={() => setManageClub(null)}
          onClubUpdated={fetchClubs}
        />
      )}

      {/* Super Admin moderation panel – only visible to super_admin */}
      {isSuperAdmin && <ClubsOversightPanel />}
    </>
  );
}
