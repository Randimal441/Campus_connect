import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  getAllMaterials,
  getMyMaterials,
  uploadMaterial,
  downloadMaterial,
  rateMaterial,
  reportMaterial,
  deleteMaterial,
  summarizeMaterial,
} from '../../services/resourceService';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';

const SUBJECTS = [
  'All',
  'General',
  'Mathematics',
  'Computer Science',
  'Physics',
  'Chemistry',
  'Biology',
  'Engineering',
  'Business',
  'Arts',
  'Other',
];

// ─── star helper ────────────────────────────────────
function Stars({ value = 0, interactive = false, onRate }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = interactive ? star <= (hover || value) : star <= Math.round(value);
        return (
          <button
            key={star}
            type="button"
            disabled={!interactive}
            className={`text-lg transition-transform ${interactive ? 'cursor-pointer hover:scale-125' : 'cursor-default'} ${filled ? 'text-amber-400' : 'text-gray-400/40'}`}
            onMouseEnter={() => interactive && setHover(star)}
            onMouseLeave={() => interactive && setHover(0)}
            onClick={() => interactive && onRate && onRate(star)}
          >
            ★
          </button>
        );
      })}
    </div>
  );
}

// ─── file size formatter ────────────────────────────
function formatSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// ─── file type icon ─────────────────────────────────
function fileIcon(name) {
  if (!name) return '📄';
  const ext = name.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return '📕';
  if (['doc', 'docx'].includes(ext)) return '📘';
  if (['ppt', 'pptx'].includes(ext)) return '📙';
  if (ext === 'txt') return '📝';
  return '📄';
}

export default function ResourceSharing() {
  const { user } = useAuth();

  // tabs
  const [tab, setTab] = useState('all'); // 'all' | 'my'

  // data
  const [allItems, setAllItems] = useState([]);
  const [myItems, setMyItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // filters
  const [search, setSearch] = useState('');
  const [subject, setSubject] = useState('All');

  // modals
  const [uploadOpen, setUploadOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(null); // material _id
  const [summaryOpen, setSummaryOpen] = useState(null); // { title, text }
  const [deleteConfirm, setDeleteConfirm] = useState(null); // material _id

  // form state
  const [uploadForm, setUploadForm] = useState({ title: '', description: '', subject: 'General', file: null });
  const [uploadLoading, setUploadLoading] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportLoading, setReportLoading] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // toast
  const [toast, setToast] = useState(null);
  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ─── fetch data ───────────────────────────────────
  const fetchAll = useCallback(async () => {
    try {
      const data = await getAllMaterials(search, subject);
      setAllItems(data);
    } catch {
      setAllItems([]);
    }
  }, [search, subject]);

  const fetchMy = useCallback(async () => {
    try {
      const data = await getMyMaterials();
      setMyItems(data);
    } catch {
      setMyItems([]);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchAll(), fetchMy()]).finally(() => setLoading(false));
  }, [fetchAll, fetchMy]);

  // ─── handlers ─────────────────────────────────────
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadForm.file) return showToast('Please select a file.', 'error');
    if (!uploadForm.title.trim()) return showToast('Title is required.', 'error');

    const fd = new FormData();
    fd.append('title', uploadForm.title);
    fd.append('description', uploadForm.description);
    fd.append('subject', uploadForm.subject);
    fd.append('file', uploadForm.file);

    setUploadLoading(true);
    try {
      await uploadMaterial(fd);
      showToast('Material uploaded successfully! 🎉');
      setUploadOpen(false);
      setUploadForm({ title: '', description: '', subject: 'General', file: null });
      fetchAll();
      fetchMy();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setUploadLoading(false);
    }
  };

  const handleDownload = async (item) => {
    try {
      await downloadMaterial(item._id, item.fileName);
      // refresh to update download count
      fetchAll();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleRate = async (id, value) => {
    try {
      await rateMaterial(id, value);
      showToast('Rating submitted! ⭐');
      fetchAll();
      fetchMy();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleReport = async () => {
    if (!reportReason.trim()) return showToast('Please provide a reason.', 'error');
    setReportLoading(true);
    try {
      const res = await reportMaterial(reportOpen, reportReason);
      showToast(res.message);
      setReportOpen(null);
      setReportReason('');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setReportLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await deleteMaterial(deleteConfirm);
      showToast('Material deleted.');
      setDeleteConfirm(null);
      fetchAll();
      fetchMy();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleSummarize = async (item) => {
    setSummaryLoading(true);
    setSummaryOpen({ title: item.title, text: 'Generating summary…' });
    try {
      const res = await summarizeMaterial(item._id);
      setSummaryOpen({ title: item.title, text: res.summary });
    } catch (err) {
      setSummaryOpen({ title: item.title, text: `Error: ${err.message}` });
    } finally {
      setSummaryLoading(false);
    }
  };

  // ─── render card ──────────────────────────────────
  const renderCard = (item, index, isOwn = false) => (
    <div
      key={item._id}
      className="card animate-fade-in relative overflow-hidden"
      style={{ animationDelay: `${index * 0.04}s` }}
    >
      {/* subject badge */}
      <div className="flex items-start justify-between mb-3 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-2xl flex-shrink-0">{fileIcon(item.fileName)}</span>
          <h3 className="truncate text-base">{item.title}</h3>
        </div>
        <span className="badge flex-shrink-0 text-xs">{item.subject}</span>
      </div>

      {/* description */}
      <p className="text-sm mb-3 line-clamp-2">{item.description || 'No description provided.'}</p>

      {/* meta row */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mb-3">
        <span>👤 {item.uploadedBy?.fullName || 'Unknown'}</span>
        <span>📥 {item.downloadCount ?? 0}</span>
        <span>{formatSize(item.fileSize)}</span>
      </div>

      {/* rating */}
      <div className="flex items-center gap-2 mb-4">
        <Stars
          value={item.averageRating || 0}
          interactive={!isOwn}
          onRate={(v) => handleRate(item._id, v)}
        />
        <span className="text-xs text-muted-foreground font-semibold">
          {item.averageRating?.toFixed(1) ?? '0.0'} ({item.totalRatings ?? 0})
        </span>
      </div>

      {/* actions */}
      <div className="flex flex-wrap gap-2">
        <button
          className="px-3 py-1.5 rounded-lg bg-primary/15 text-primary font-semibold text-xs hover:bg-primary/25 transition-colors"
          onClick={() => handleDownload(item)}
        >
          ⬇ Download
        </button>
        <button
          className="px-3 py-1.5 rounded-lg bg-violet-500/15 text-violet-400 font-semibold text-xs hover:bg-violet-500/25 transition-colors"
          onClick={() => handleSummarize(item)}
        >
          🤖 Summarize
        </button>
        {!isOwn && (
          <button
            className="px-3 py-1.5 rounded-lg bg-red-500/15 text-red-400 font-semibold text-xs hover:bg-red-500/25 transition-colors"
            onClick={() => setReportOpen(item._id)}
          >
            🚩 Report
          </button>
        )}
        {isOwn && (
          <button
            className="px-3 py-1.5 rounded-lg bg-red-500/15 text-red-400 font-semibold text-xs hover:bg-red-500/25 transition-colors"
            onClick={() => setDeleteConfirm(item._id)}
          >
            🗑 Delete
          </button>
        )}
      </div>
    </div>
  );

  // ─── main render ──────────────────────────────────
  return (
    <div className="page">
      <Navbar />
      <main className="main-content">
        {/* ─ header ─ */}
        <div className="mb-8 animate-fade-in-up">
          <div className="flex items-center gap-3 mb-4">
            <div className="text-5xl">📚</div>
            <div>
              <h1>Resource Sharing</h1>
              <p className="lead !mb-0">Upload, browse & download study materials</p>
            </div>
          </div>
        </div>

        {/* ─ tabs ─ */}
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          <button
            className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${tab === 'all' ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
            onClick={() => setTab('all')}
          >
            📖 All Resources
          </button>
          <button
            className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${tab === 'my' ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
            onClick={() => setTab('my')}
          >
            📁 My Uploads
          </button>
          <div className="flex-1" />
          {tab === 'my' && (
            <button
              className="px-5 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-primary to-primary-light text-white shadow-lg shadow-primary/30 hover:shadow-xl hover:scale-[1.02] transition-all"
              onClick={() => setUploadOpen(true)}
            >
              ＋ Upload Material
            </button>
          )}
        </div>

        {/* ─ search / filter (all tab) ─ */}
        {tab === 'all' && (
          <div className="flex flex-col sm:flex-row gap-3 mb-6 animate-fade-in">
            <input
              type="text"
              placeholder="🔍  Search materials…"
              className="flex-1 px-4 py-2.5 rounded-xl bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className="px-4 py-2.5 rounded-xl bg-muted border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm min-w-[160px]"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            >
              {SUBJECTS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        )}

        {/* ─ content ─ */}
        {loading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="loader mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading resources…</p>
            </div>
          </div>
        ) : tab === 'all' ? (
          allItems.length === 0 ? (
            <div className="text-center py-16 bg-muted rounded-2xl animate-fade-in">
              <div className="text-6xl mb-4">📦</div>
              <p className="text-xl font-semibold text-muted-foreground mb-2">No resources found</p>
              <p className="text-muted-foreground">Try adjusting your search or be the first to upload!</p>
            </div>
          ) : (
            <div className="card-grid">
              {allItems.map((item, i) => renderCard(item, i, item.uploadedBy?._id === user?._id))}
            </div>
          )
        ) : myItems.length === 0 ? (
          <div className="text-center py-16 bg-muted rounded-2xl animate-fade-in">
            <div className="text-6xl mb-4">📂</div>
            <p className="text-xl font-semibold text-muted-foreground mb-2">You haven't uploaded anything yet</p>
            <p className="text-muted-foreground mb-6">Share your study materials with the campus community!</p>
            <button
              className="px-6 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-primary to-primary-light text-white shadow-lg shadow-primary/30 hover:shadow-xl transition-all"
              onClick={() => setUploadOpen(true)}
            >
              ＋ Upload Your First Material
            </button>
          </div>
        ) : (
          <div className="card-grid">
            {myItems.map((item, i) => renderCard(item, i, true))}
          </div>
        )}
      </main>

      {/* ═══════════ UPLOAD MODAL ═══════════ */}
      {uploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setUploadOpen(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl p-6 animate-fade-in-up"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-1">📤 Upload Study Material</h2>
            <p className="text-sm text-muted-foreground mb-5">Share documents with the campus community</p>

            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Title *</label>
                <input
                  type="text"
                  className="w-full px-4 py-2.5 rounded-xl bg-muted border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm"
                  placeholder="e.g. Data Structures Notes - Chapter 5"
                  value={uploadForm.title}
                  onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Description</label>
                <textarea
                  className="w-full px-4 py-2.5 rounded-xl bg-muted border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm resize-none"
                  rows={3}
                  placeholder="Brief description of the material…"
                  value={uploadForm.description}
                  onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Subject</label>
                <select
                  className="w-full px-4 py-2.5 rounded-xl bg-muted border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm"
                  value={uploadForm.subject}
                  onChange={(e) => setUploadForm({ ...uploadForm, subject: e.target.value })}
                >
                  {SUBJECTS.filter((s) => s !== 'All').map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">File * <span className="text-muted-foreground font-normal">(pdf, doc, docx, ppt, pptx, txt — max 10 MB)</span></label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
                  className="w-full text-sm file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary/15 file:text-primary file:font-semibold file:cursor-pointer hover:file:bg-primary/25 text-muted-foreground"
                  onChange={(e) => setUploadForm({ ...uploadForm, file: e.target.files?.[0] || null })}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={uploadLoading}
                  className="flex-1 px-5 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-primary to-primary-light text-white shadow-lg shadow-primary/30 hover:shadow-xl transition-all disabled:opacity-50"
                >
                  {uploadLoading ? 'Uploading…' : 'Upload'}
                </button>
                <button
                  type="button"
                  className="px-5 py-2.5 rounded-xl font-bold text-sm bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
                  onClick={() => setUploadOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════ REPORT MODAL ═══════════ */}
      {reportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => { setReportOpen(null); setReportReason(''); }}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl p-6 animate-fade-in-up"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-1">🚩 Report Resource</h2>
            <p className="text-sm text-muted-foreground mb-5">Help us keep the campus community safe</p>
            <textarea
              className="w-full px-4 py-2.5 rounded-xl bg-muted border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-red-400/40 text-sm resize-none"
              rows={4}
              placeholder="Describe the issue (e.g. inappropriate content, copyright violation, spam…)"
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
            />
            <div className="flex gap-3 mt-4">
              <button
                disabled={reportLoading}
                className="flex-1 px-5 py-2.5 rounded-xl font-bold text-sm bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50"
                onClick={handleReport}
              >
                {reportLoading ? 'Submitting…' : 'Submit Report'}
              </button>
              <button
                className="px-5 py-2.5 rounded-xl font-bold text-sm bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
                onClick={() => { setReportOpen(null); setReportReason(''); }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════ AI SUMMARY MODAL ═══════════ */}
      {summaryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setSummaryOpen(null)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-2xl max-h-[80vh] bg-card border border-border rounded-2xl shadow-2xl p-6 animate-fade-in-up overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">🤖</span>
              <h2 className="text-xl font-bold">AI Summary</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-3 font-semibold">{summaryOpen.title}</p>
            {summaryLoading ? (
              <div className="flex items-center gap-3 py-8 justify-center">
                <div className="loader"></div>
                <span className="text-muted-foreground text-sm">Generating summary with AI…</span>
              </div>
            ) : (
              <div className="prose prose-sm prose-invert max-w-none bg-muted rounded-xl p-4 text-sm leading-relaxed whitespace-pre-wrap">
                {summaryOpen.text}
              </div>
            )}
            <div className="flex justify-end mt-4">
              <button
                className="px-5 py-2.5 rounded-xl font-bold text-sm bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
                onClick={() => setSummaryOpen(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════ DELETE CONFIRM MODAL ═══════════ */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setDeleteConfirm(null)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-sm bg-card border border-border rounded-2xl shadow-2xl p-6 animate-fade-in-up text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-5xl mb-3">🗑️</div>
            <h2 className="text-lg font-bold mb-2">Delete Material?</h2>
            <p className="text-sm text-muted-foreground mb-5">This action cannot be undone. The file will be permanently removed.</p>
            <div className="flex gap-3">
              <button
                disabled={deleteLoading}
                className="flex-1 px-5 py-2.5 rounded-xl font-bold text-sm bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50"
                onClick={handleDelete}
              >
                {deleteLoading ? 'Deleting…' : 'Yes, Delete'}
              </button>
              <button
                className="flex-1 px-5 py-2.5 rounded-xl font-bold text-sm bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
                onClick={() => setDeleteConfirm(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════ TOAST ═══════════ */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-[60] px-5 py-3 rounded-xl font-semibold text-sm shadow-2xl animate-fade-in-up ${toast.type === 'error'
            ? 'bg-red-500 text-white'
            : 'bg-emerald-500 text-white'
          }`}>
          {toast.msg}
        </div>
      )}

      <Footer />
    </div>
  );
}
