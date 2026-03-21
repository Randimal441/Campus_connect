import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';

/* ─── helpers ─────────────────────────────────── */
const STATUS_COLORS = {
  pending:  'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
};

const CATEGORY_ICONS = { club: '', sport: '' };

function formatDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

/* ─── ClubDetailModal ─────────────────────────── */
function ClubDetailModal({ club, onClose, onJoin, onLeave, myRequests }) {
  const [teams, setTeams]         = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [joinMsg, setJoinMsg]     = useState('');
  const [busy, setBusy]           = useState(false);
  const [feedback, setFeedback]   = useState('');

  const myReq = myRequests.find((r) => r.club?._id === club._id || r.club === club._id);
  const isMember = myReq?.status === 'approved';

  useEffect(() => {
    api(`/clubs-sports/${club._id}/teams`).then(setTeams).catch(() => {});
    api(`/clubs-sports/${club._id}/schedules`).then(setSchedules).catch(() => {});
  }, [club._id]);

  const handleJoin = async () => {
    setBusy(true); setFeedback('');
    try {
      await onJoin(club._id, joinMsg);
      setFeedback('Join request sent!');
    } catch (e) {
      setFeedback(e.message);
    } finally {
      setBusy(false);
    }
  };

  const handleLeave = async () => {
    if (!window.confirm('Leave this club?')) return;
    setBusy(true); setFeedback('');
    try {
      await onLeave(club._id);
      setFeedback('You have left the club.');
    } catch (e) {
      setFeedback(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* header */}
        <div className="bg-gradient-to-r from-primary to-primary-light p-6 rounded-t-2xl text-white">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-3xl">{CATEGORY_ICONS[club.category] || '🏆'}</span>
                <span className="uppercase text-xs font-bold tracking-widest bg-white/20 px-2 py-0.5 rounded-full">
                  {club.category}
                </span>
                {club.sportType && (
                  <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">{club.sportType}</span>
                )}
              </div>
              <h2 className="text-2xl font-heading font-bold">{club.title}</h2>
              <p className="text-white/80 text-sm mt-1">Created by {club.createdBy?.fullName}</p>
            </div>
            <button onClick={onClose} className="text-white/70 hover:text-white text-2xl leading-none">✕</button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* description */}
          {club.description && (
            <div>
              <h4 className="font-semibold text-foreground mb-1">About</h4>
              <p className="text-muted-foreground text-sm leading-relaxed">{club.description}</p>
            </div>
          )}

          {/* coach info */}
          {club.coachInfo && (
            <div className="bg-muted rounded-xl p-4">
              <h4 className="font-semibold text-foreground mb-1 flex items-center gap-2">
                Coach Information
              </h4>
              <p className="text-sm text-muted-foreground">{club.coachInfo}</p>
            </div>
          )}

          {/* practice schedules */}
          <div>
            <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
              <span>📅</span> Practice Schedules
            </h4>
            {schedules.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No schedules added yet.</p>
            ) : (
              <div className="space-y-2">
                {schedules.map((s) => (
                  <div key={s._id} className="border border-border rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{s.title}</span>
                      <span className="text-xs text-muted-foreground">{formatDate(s.date)} · {s.time}</span>
                    </div>
                    {s.location && <p className="text-xs text-muted-foreground mt-0.5"> {s.location}</p>}
                    {s.description && <p className="text-xs text-muted-foreground mt-0.5">{s.description}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* teams */}
          <div>
            <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
              <span>👥</span> Teams
            </h4>
            {teams.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No teams listed yet.</p>
            ) : (
              <div className="space-y-2">
                {teams.map((t) => (
                  <div key={t._id} className="border border-border rounded-lg p-3">
                    <p className="font-medium text-sm">{t.name}</p>
                    {t.description && <p className="text-xs text-muted-foreground mt-0.5">{t.description}</p>}
                    {t.members?.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {t.members.length} member{t.members.length !== 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* join / leave */}
          {feedback && (
            <p className={`text-sm font-medium px-3 py-2 rounded-lg ${feedback.includes('sent') || feedback.includes('left') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {feedback}
            </p>
          )}

          {!myReq && (
            <div className="border-t border-border pt-4">
              <h4 className="font-semibold mb-2">Send Join Request</h4>
              <textarea
                value={joinMsg}
                onChange={(e) => setJoinMsg(e.target.value)}
                placeholder="Introduce yourself (optional)…"
                className="input w-full h-20 resize-none text-sm"
              />
              <button onClick={handleJoin} disabled={busy} className="btn btn-primary mt-2 w-full">
                {busy ? 'Sending…' : ' Send Join Request'}
              </button>
            </div>
          )}

          {myReq && !isMember && (
            <div className={`border-t border-border pt-4`}>
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold ${STATUS_COLORS[myReq.status]}`}>
                Request status: {myReq.status}
              </div>
              {myReq.adminNote && <p className="text-xs text-muted-foreground mt-2">Note: {myReq.adminNote}</p>}
            </div>
          )}

          {isMember && (
            <div className="border-t border-border pt-4 flex items-center justify-between">
              <span className="text-sm font-semibold text-green-600">✅ You are a member</span>
              <button onClick={handleLeave} disabled={busy} className="btn btn-sm btn-destructive">
                Leave Club
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── main page ───────────────────────────────── */
export default function ClubsSports() {
  const { user } = useAuth();
  const [items, setItems]           = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [category, setCategory]     = useState('');
  const [selected, setSelected]     = useState(null);
  const [activeTab, setActiveTab]   = useState('clubs'); // 'clubs' | 'my-requests'

  const fetchClubs = useCallback(async () => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (category) params.set('category', category);
    const qs = params.toString();
    const data = await api(`/clubs-sports${qs ? `?${qs}` : ''}`).catch(() => []);
    setItems(data);
  }, [search, category]);

  const fetchMyRequests = useCallback(async () => {
    if (!user) return;
    const data = await api('/clubs-sports/my-requests').catch(() => []);
    setMyRequests(data);
  }, [user]);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchClubs(), fetchMyRequests()]).finally(() => setLoading(false));
  }, [fetchClubs, fetchMyRequests]);

  const handleJoin = async (clubId, message) => {
    const req = await api(`/clubs-sports/${clubId}/join`, { method: 'POST', body: { message } });
    await fetchMyRequests();
    return req;
  };

  const handleLeave = async (clubId) => {
    await api(`/clubs-sports/${clubId}/leave`, { method: 'DELETE' });
    await fetchMyRequests();
  };

  const getReqStatus = (clubId) => {
    const r = myRequests.find((r) => r.club?._id === clubId || r.club === clubId);
    return r?.status || null;
  };

  return (
    <div className="page">
      <Navbar />
      <main className="main-content clubs-full-width">
        {/* ── header ── */}
        <div className="mb-8 animate-fade-in-up text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div>
              <h1>Clubs &amp; Sports</h1>
              <p className="lead !mb-0">Discover and join exciting clubs and sports activities on campus</p>
            </div>
          </div>

          {/* tabs */}
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            {['clubs', 'my-requests'].map((t) => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${activeTab === t ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:bg-muted/70'}`}
              >
                {t === 'clubs' ? '🏟️ All Clubs' : '📋 My Requests'}
              </button>
            ))}
            <Link
              to="/user/clubs-sports/medicle-support"
              className="px-4 py-2 rounded-lg text-sm font-semibold transition-colors bg-muted text-muted-foreground hover:bg-muted/70"
            >
              🩺 MEdicle Support
            </Link>
          </div>
        </div>

        {/* ── clubs tab ── */}
        {activeTab === 'clubs' && (
          <>
            {/* search & filter */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <input
                className="input flex-1"
                placeholder="Search by name or sport type…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <select
                className="input sm:w-44"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">All Categories</option>
                <option value="club">Clubs</option>
                <option value="sport">Sports</option>
              </select>
            </div>

            {loading ? (
              <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                  <div className="loader mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading clubs and sports…</p>
                </div>
              </div>
            ) : items.length === 0 ? (
              <div className="text-center py-16 bg-muted rounded-2xl">
                <div className="text-6xl mb-4">🎯</div>
                <p className="text-xl font-semibold text-muted-foreground mb-2">No clubs or sports found</p>
                <p className="text-muted-foreground">Try a different search or check back soon!</p>
              </div>
            ) : (
              <div className="card-grid">
                {items.map((item, index) => {
                  const status = getReqStatus(item._id);
                  return (
                    <div
                      key={item._id}
                      className="card cursor-pointer hover:shadow-lg transition-shadow animate-fade-in"
                      style={{ animationDelay: `${index * 0.05}s` }}
                      onClick={() => setSelected(item)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="flex-1 leading-snug">{item.title}</h3>
                        <span className="badge ml-2 shrink-0">{item.category}</span>
                      </div>
                      {item.sportType && (
                        <p className="text-xs text-primary font-semibold mb-2">🏷 {item.sportType}</p>
                      )}
                      <p className="text-sm text-muted-foreground line-clamp-3 mb-4">{item.description}</p>
                      {item.createdBy && (
                        <p className="text-xs text-muted-foreground mb-4">{item.createdBy.fullName}</p>
                      )}
                      <div className="flex items-center justify-between mt-auto">
                        <button className="btn btn-sm btn-outline" onClick={(e) => { e.stopPropagation(); setSelected(item); }}>
                          View Details
                        </button>
                        {status && (
                          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${STATUS_COLORS[status]}`}>
                            {status}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ── my requests tab ── */}
        {activeTab === 'my-requests' && (
          <div>
            {myRequests.length === 0 ? (
              <div className="text-center py-16 bg-muted rounded-2xl">
                <div className="text-6xl mb-4">📋</div>
                <p className="text-xl font-semibold text-muted-foreground mb-2">No join requests yet</p>
                <p className="text-muted-foreground">Browse clubs and send a join request!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {myRequests.map((r) => (
                  <div key={r._id} className="card flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold">{r.club?.title || 'Unknown club'}</p>
                      <p className="text-xs text-muted-foreground">
                        {r.club?.category} {r.club?.sportType ? `· ${r.club.sportType}` : ''}
                      </p>
                      {r.adminNote && (
                        <p className="text-xs text-muted-foreground mt-1">Note: {r.adminNote}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        Requested on {formatDate(r.createdAt)}
                      </p>
                    </div>
                    <span className={`shrink-0 text-xs font-bold px-3 py-1.5 rounded-full ${STATUS_COLORS[r.status]}`}>
                      {r.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* club detail modal */}
      {selected && (
        <ClubDetailModal
          club={selected}
          onClose={() => setSelected(null)}
          onJoin={handleJoin}
          onLeave={handleLeave}
          myRequests={myRequests}
        />
      )}

      <Footer />
    </div>
  );
}
