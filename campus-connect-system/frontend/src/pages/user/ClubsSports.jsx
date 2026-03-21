import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';

const heroImage = 'https://img.freepik.com/free-vector/active-people-concept-illustration_114360-9025.jpg';
const connectImage = 'https://img.freepik.com/free-vector/team-spirit-concept-illustration_114360-1676.jpg';
const supportImage = 'https://img.freepik.com/free-vector/doctor-concept-illustration_114360-1781.jpg';

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
};

function formatDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function ClubDetailModal({ club, onClose, onJoin, onLeave, myRequests }) {
  const [teams, setTeams] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [joinMsg, setJoinMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState('');

  const myReq = myRequests.find((r) => r.club?._id === club._id || r.club === club._id);
  const isMember = myReq?.status === 'approved';

  useEffect(() => {
    api(`/clubs-sports/${club._id}/teams`).then(setTeams).catch(() => setTeams([]));
    api(`/clubs-sports/${club._id}/schedules`).then(setSchedules).catch(() => setSchedules([]));
  }, [club._id]);

  const handleJoin = async () => {
    setBusy(true);
    setFeedback('');
    try {
      await onJoin(club._id, joinMsg);
      setFeedback('Join request sent successfully.');
    } catch (e) {
      setFeedback(e.message || 'Failed to send join request.');
    } finally {
      setBusy(false);
    }
  };

  const handleLeave = async () => {
    if (!window.confirm('Leave this club?')) return;
    setBusy(true);
    setFeedback('');
    try {
      await onLeave(club._id);
      setFeedback('You have left this club.');
    } catch (e) {
      setFeedback(e.message || 'Failed to leave this club.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-r from-green-600 to-emerald-500 p-6 rounded-t-2xl text-white">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="uppercase text-xs font-semibold tracking-wide bg-white/20 px-2 py-1 rounded-full">
                  {club.category || 'club'}
                </span>
                {club.sportType && (
                  <span className="text-xs bg-white/20 px-2 py-1 rounded-full">{club.sportType}</span>
                )}
              </div>
              <h2 className="text-2xl font-bold">{club.title}</h2>
              <p className="text-sm text-white/80 mt-1">Hosted by {club.createdBy?.fullName || 'Campus Team'}</p>
            </div>
            <button onClick={onClose} className="text-2xl text-white/80 hover:text-white" aria-label="Close dialog">
              x
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {club.description && (
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">About this club</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{club.description}</p>
            </div>
          )}

          {club.coachInfo && (
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <h3 className="font-semibold text-gray-800 mb-1">Coach Information</h3>
              <p className="text-sm text-gray-600">{club.coachInfo}</p>
            </div>
          )}

          <div>
            <h3 className="font-semibold text-gray-800 mb-3">Practice Schedules</h3>
            {schedules.length === 0 ? (
              <p className="text-sm text-gray-500">No schedules have been published yet.</p>
            ) : (
              <div className="space-y-3">
                {schedules.map((s) => (
                  <div key={s._id} className="border border-gray-100 rounded-xl p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-gray-800 text-sm">{s.title}</p>
                      <p className="text-xs text-gray-500">
                        {formatDate(s.date)} {s.time ? `- ${s.time}` : ''}
                      </p>
                    </div>
                    {s.location && <p className="text-xs text-gray-500 mt-1">{s.location}</p>}
                    {s.description && <p className="text-xs text-gray-500 mt-1">{s.description}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h3 className="font-semibold text-gray-800 mb-3">Teams</h3>
            {teams.length === 0 ? (
              <p className="text-sm text-gray-500">No team records yet.</p>
            ) : (
              <div className="space-y-3">
                {teams.map((t) => (
                  <div key={t._id} className="border border-gray-100 rounded-xl p-3">
                    <p className="font-medium text-gray-800 text-sm">{t.name}</p>
                    {t.description && <p className="text-xs text-gray-500 mt-1">{t.description}</p>}
                    <p className="text-xs text-gray-500 mt-1">
                      {t.members?.length || 0} member{(t.members?.length || 0) !== 1 ? 's' : ''}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {feedback && (
            <p
              className={`text-sm px-3 py-2 rounded-lg ${
                feedback.toLowerCase().includes('failed') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
              }`}
            >
              {feedback}
            </p>
          )}

          {!myReq && (
            <div className="border-t border-gray-100 pt-4">
              <h3 className="font-semibold text-gray-800 mb-2">Send Join Request</h3>
              <textarea
                value={joinMsg}
                onChange={(e) => setJoinMsg(e.target.value)}
                placeholder="Introduce yourself to the club (optional)"
                className="w-full h-24 border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <button
                onClick={handleJoin}
                disabled={busy}
                className="w-full mt-3 bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-60"
              >
                {busy ? 'Sending...' : 'Send Join Request'}
              </button>
            </div>
          )}

          {myReq && !isMember && (
            <div className="border-t border-gray-100 pt-4">
              <span className={`inline-flex px-3 py-1.5 rounded-full text-xs font-semibold ${STATUS_COLORS[myReq.status]}`}>
                Request status: {myReq.status}
              </span>
              {myReq.adminNote && <p className="text-xs text-gray-500 mt-2">Note: {myReq.adminNote}</p>}
            </div>
          )}

          {isMember && (
            <div className="border-t border-gray-100 pt-4 flex items-center justify-between gap-4">
              <p className="text-sm font-semibold text-green-700">You are an approved member.</p>
              <button
                onClick={handleLeave}
                disabled={busy}
                className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-60"
              >
                Leave Club
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ClubsSports() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [selected, setSelected] = useState(null);
  const [activeTab, setActiveTab] = useState('clubs');

  const fetchClubs = useCallback(async () => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (category) params.set('category', category);
    const qs = params.toString();
    const data = await api(`/clubs-sports${qs ? `?${qs}` : ''}`).catch(() => []);
    setItems(Array.isArray(data) ? data : []);
  }, [search, category]);

  const fetchMyRequests = useCallback(async () => {
    if (!user) {
      setMyRequests([]);
      return;
    }
    const data = await api('/clubs-sports/my-requests').catch(() => []);
    setMyRequests(Array.isArray(data) ? data : []);
  }, [user]);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchClubs(), fetchMyRequests()]).finally(() => setLoading(false));
  }, [fetchClubs, fetchMyRequests]);

  const handleJoin = async (clubId, message) => {
    const req = await api(`/clubs-sports/${clubId}/join`, {
      method: 'POST',
      body: { message },
    });
    await fetchMyRequests();
    return req;
  };

  const handleLeave = async (clubId) => {
    await api(`/clubs-sports/${clubId}/leave`, { method: 'DELETE' });
    await fetchMyRequests();
  };

  const getReqStatus = (clubId) => {
    const req = myRequests.find((r) => r.club?._id === clubId || r.club === clubId);
    return req?.status || null;
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <section className="bg-gradient-to-br from-green-50 to-white py-16 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6 leading-tight">
              How does
              <br />
              <span className="text-green-600">Clubs and Sports Connect</span>
              <br />
              work?
            </h1>
            <p className="text-gray-600 mb-8 text-lg leading-relaxed">
              Find clubs and sports that match your interests, request to join in seconds, and stay connected to
              practices, teams, and campus activities all in one place.
            </p>
            <button
              onClick={() => document.getElementById('clubs-list').scrollIntoView({ behavior: 'smooth' })}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-8 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              Explore Clubs
            </button>
          </div>
          <div className="flex-1">
            <img src={heroImage} alt="Clubs and Sports" className="w-full max-w-md mx-auto rounded-2xl shadow-lg" />
          </div>
        </div>
      </section>

      <section id="clubs-list" className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Clubs and Sports Directory</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Browse available communities, view details, and track your participation requests.
            </p>
          </div>

          <div className="bg-gray-50 rounded-2xl p-5 md:p-6 mb-8 border border-gray-100">
            <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab('clubs')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    activeTab === 'clubs' ? 'bg-green-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  All Clubs
                </button>
                <button
                  onClick={() => setActiveTab('my-requests')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    activeTab === 'my-requests' ? 'bg-green-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  My Requests
                </button>
              </div>
              <Link
                to="/user/clubs-sports/medicle-support"
                className="inline-flex items-center justify-center bg-white border border-gray-200 hover:border-green-200 hover:bg-green-50 text-gray-700 text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
              >
                Medical Support
              </Link>
            </div>

            {activeTab === 'clubs' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by title or sport type"
                  className="md:col-span-2 w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">All Categories</option>
                  <option value="club">Clubs</option>
                  <option value="sport">Sports</option>
                </select>
              </div>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
          ) : activeTab === 'clubs' ? (
            items.length === 0 ? (
              <div className="text-center py-16 bg-gray-50 rounded-2xl border border-gray-100">
                <p className="text-xl font-semibold text-gray-700 mb-2">No clubs or sports found</p>
                <p className="text-gray-500">Try a different search or category.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
                {items.map((item) => {
                  const status = getReqStatus(item._id);
                  return (
                    <div
                      key={item._id}
                      className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300"
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <h3 className="text-xl font-semibold text-gray-800">{item.title}</h3>
                        <span className="text-xs font-semibold uppercase bg-green-50 text-green-700 px-2 py-1 rounded-full">
                          {item.category || 'club'}
                        </span>
                      </div>

                      {item.sportType && (
                        <p className="text-sm text-green-600 font-medium mb-2">{item.sportType}</p>
                      )}

                      <p className="text-sm text-gray-600 mb-3 leading-relaxed">
                        {(item.description || 'No description provided').slice(0, 180)}
                        {(item.description || '').length > 180 ? '...' : ''}
                      </p>

                      <p className="text-xs text-gray-500 mb-5">Hosted by {item.createdBy?.fullName || 'Campus Team'}</p>

                      <div className="flex items-center justify-between gap-2">
                        <button
                          onClick={() => setSelected(item)}
                          className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2.5 px-5 rounded-lg transition-colors"
                        >
                          View Details
                        </button>
                        {status && (
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLORS[status]}`}>
                            {status}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : myRequests.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 rounded-2xl border border-gray-100">
              <p className="text-xl font-semibold text-gray-700 mb-2">No join requests yet</p>
              <p className="text-gray-500">Open All Clubs and send your first request.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {myRequests.map((r) => (
                <div key={r._id} className="bg-white border border-gray-100 rounded-xl p-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-gray-800">{r.club?.title || 'Unknown club'}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {r.club?.category || 'club'} {r.club?.sportType ? `- ${r.club.sportType}` : ''}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Requested on {formatDate(r.createdAt)}</p>
                    {r.adminNote && <p className="text-xs text-gray-500 mt-1">Note: {r.adminNote}</p>}
                  </div>
                  <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${STATUS_COLORS[r.status]}`}>
                    {r.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1 flex justify-center">
            <img src={connectImage} alt="Campus community" className="w-full max-w-sm rounded-2xl shadow-lg" />
          </div>
          <div className="flex-1">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Build your campus circle</h2>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Join communities that push you to grow, collaborate with teammates, and stay active through organized
              practices and events.
            </p>
            <button
              onClick={() => document.getElementById('clubs-list').scrollIntoView({ behavior: 'smooth' })}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-8 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              Join a Community
            </button>
          </div>
        </div>
      </section>

      <section className="py-16 px-4 bg-gradient-to-br from-green-50 to-white">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Need extra support for training?</h2>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Access campus medical support resources for advice, guidance, and safer participation in sports and
              physical activities.
            </p>
            <Link
              to="/user/clubs-sports/medicle-support"
              className="inline-block bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-8 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              View Medical Support
            </Link>
          </div>
          <div className="flex-1 flex justify-center">
            <img src={supportImage} alt="Medical support" className="w-full max-w-sm rounded-2xl shadow-lg" />
          </div>
        </div>
      </section>

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
