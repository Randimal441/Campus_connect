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
  'IT',
  'Computer Science',
  'Engineering',
  'Business Management',
  'Humanities & Science',
  'School of Architecture',
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
            className={`text-lg transition-transform ${interactive ? 'cursor-pointer hover:scale-125' : 'cursor-default'} ${filled ? 'text-yellow-400' : 'text-gray-200'}`}
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
  const [visibleCountAll, setVisibleCountAll] = useState(9);
  const [visibleCountMy, setVisibleCountMy] = useState(9);

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
  const [uploadForm, setUploadForm] = useState({ title: '', description: '', subject: '', file: null });
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
      setVisibleCountAll(9);
    } catch {
      setAllItems([]);
    }
  }, [search, subject]);

  const fetchMy = useCallback(async () => {
    try {
      const data = await getMyMaterials();
      setMyItems(data);
      setVisibleCountMy(9);
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
    if (!uploadForm.subject.trim()) return showToast('Subject is required.', 'error');

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
      setUploadForm({ title: '', description: '', subject: '', file: null });
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
      className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 relative overflow-hidden flex flex-col h-full"
      style={{ animationDelay: `${index * 0.04}s` }}
    >
      {/* subject badge */}
      <div className="flex items-start justify-between mb-4 gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center flex-shrink-0 shadow-sm border border-green-200">
            <span className="text-2xl">{fileIcon(item.fileName)}</span>
          </div>
          <h3 className="truncate text-lg font-bold text-gray-800">{item.title}</h3>
        </div>
        <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-semibold whitespace-nowrap border border-green-200">{item.subject}</span>
      </div>

      {/* description */}
      <p className="text-sm text-gray-600 mb-4 line-clamp-2 flex-grow">{item.description || 'No description provided.'}</p>

      {/* meta row */}
      <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-gray-500 mb-4 bg-gray-50 p-3 rounded-xl border border-gray-100">
        <span className="flex items-center gap-1.5"><span className="text-gray-400">👤</span> {item.uploadedBy?.fullName || 'Unknown'}</span>
        <span className="flex items-center gap-1.5"><span className="text-gray-400">📥</span> {item.downloadCount ?? 0}</span>
        <span className="flex items-center gap-1.5"><span className="text-gray-400">💾</span> {formatSize(item.fileSize)}</span>
      </div>

      {/* rating */}
      <div className="flex items-center gap-2 mb-6">
        <Stars
          value={item.averageRating || 0}
          interactive={!isOwn}
          onRate={(v) => handleRate(item._id, v)}
        />
        <span className="text-sm text-gray-500 font-semibold ml-1">
          {item.averageRating?.toFixed(1) ?? '0.0'} ({item.totalRatings ?? 0})
        </span>
      </div>

      {/* actions */}
      <div className="flex flex-wrap gap-2 mt-auto">
        <button
          className="flex-1 min-w-[100px] bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-3 rounded-lg transition-all duration-300 text-sm shadow-md"
          onClick={() => handleDownload(item)}
        >
          ⬇ Download
        </button>
        <button
          className="flex-1 min-w-[100px] bg-green-50 text-green-700 hover:bg-green-100 font-semibold py-2 px-3 rounded-lg transition-all duration-300 text-sm border border-green-200"
          onClick={() => handleSummarize(item)}
        >
          🤖 Summarize
        </button>
        {!isOwn && (
          <button
            className="px-3 py-2 rounded-lg bg-red-50 text-red-500 font-semibold hover:bg-red-100 transition-all duration-300 text-sm border border-red-200"
            title="Report"
            onClick={() => setReportOpen(item._id)}
          >
            🚩
          </button>
        )}
        {isOwn && (
          <button
            className="px-3 py-2 rounded-lg bg-red-50 text-red-500 font-semibold hover:bg-red-100 transition-all duration-300 text-sm border border-red-200"
            title="Delete"
            onClick={() => setDeleteConfirm(item._id)}
          >
            🗑
          </button>
        )}
      </div>
    </div>
  );

  // ─── main render ──────────────────────────────────
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-green-50 to-white py-16 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-start items-center gap-12">
          <div className="flex-1">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6 leading-tight">
              Share and Discover <span className="text-green-600">Study Resources</span>
            </h1>
            <p className="text-gray-600 mb-8 text-lg leading-relaxed">
              Elevate your learning experience by accessing a vast library of study materials 
              shared by the campus community. Upload your own notes, download helpful resources, 
              and generate AI summaries to learn faster.
            </p>
            <button
              onClick={() => document.getElementById('resources-section').scrollIntoView({ behavior: 'smooth' })}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-8 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              Explore Materials
            </button>
          </div>
          <div className="flex-1">
            <img
              src="https://img.freepik.com/free-vector/online-library-concept-illustration_114360-1490.jpg"
              alt="Resource Sharing"
              className="w-full max-w-md mx-auto rounded-2xl shadow-lg"
            />
          </div>
        </div>
      </section>

      {/* Main Content Section */}
      <section id="resources-section" className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          
          {/* ─ tabs ─ */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-8 border-b border-gray-100 pb-6">
            <div className="flex items-center gap-3">
              <button
                className={`px-6 py-2.5 rounded-full font-semibold text-sm transition-all duration-300 ${tab === 'all' ? 'bg-green-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                onClick={() => setTab('all')}
              >
                📖 All Resources
              </button>
              <button
                className={`px-6 py-2.5 rounded-full font-semibold text-sm transition-all duration-300 ${tab === 'my' ? 'bg-green-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                onClick={() => setTab('my')}
              >
                📁 My Uploads
              </button>
            </div>
            <div className="flex-1" />
            <button
              className="px-6 py-2.5 rounded-full font-bold text-sm bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/30 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-2 whitespace-nowrap"
              onClick={() => setUploadOpen(true)}
            >
              <span className="text-lg leading-none">+</span> Upload Material
            </button>
          </div>

          {/* ─ search / filter (all tab) ─ */}
          {tab === 'all' && (
            <div className="flex flex-col sm:flex-row gap-4 mb-10">
              <div className="flex-1 relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                <input
                  type="text"
                  placeholder="Search materials…"
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/40 focus:border-green-500 transition-all text-sm"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <input
                list="filter-subject-list"
                type="text"
                placeholder="Filter by subject..."
                className="px-5 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500/40 focus:border-green-500 transition-all text-sm min-w-[200px]"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
              <datalist id="filter-subject-list">
                {SUBJECTS.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </div>
          )}

          {/* ─ content ─ */}
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600"></div>
            </div>
          ) : tab === 'all' ? (
            allItems.length === 0 ? (
              <div className="text-center py-24 bg-gray-50 border border-dashed border-gray-300 rounded-3xl">
                <div className="text-6xl mb-4 opacity-50">📚</div>
                <p className="text-2xl font-bold text-gray-700 mb-2">No resources found</p>
                <p className="text-gray-500 max-w-md mx-auto">Try adjusting your search criteria or be the very first to share a document!</p>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {allItems.slice(0, visibleCountAll).map((item, i) => renderCard(item, i, item.uploadedBy?._id === user?._id))}
                </div>
                {(allItems.length > visibleCountAll || visibleCountAll > 9) && (
                  <div className="flex justify-center gap-4 pt-4">
                    {visibleCountAll > 9 && (
                      <button
                        onClick={() => {
                          setVisibleCountAll(9);
                          document.getElementById('resources-section').scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="px-8 py-3 rounded-xl font-bold text-sm bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
                      >
                        Show Less Resources
                      </button>
                    )}
                    {allItems.length > visibleCountAll && (
                      <button
                        onClick={() => setVisibleCountAll(prev => prev + 9)}
                        className="px-8 py-3 rounded-xl font-bold text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors shadow-sm"
                      >
                        Show More Resources
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          ) : myItems.length === 0 ? (
            <div className="text-center py-24 bg-gray-50 border border-dashed border-gray-300 rounded-3xl">
              <div className="text-6xl mb-4 opacity-50">📂</div>
              <p className="text-2xl font-bold text-gray-700 mb-2">You haven't uploaded anything yet</p>
              <p className="text-gray-500 max-w-md mx-auto mb-8">Share your study materials, lecture notes, and summaries with the campus community!</p>
              <button
                className="px-8 py-3.5 rounded-xl font-bold text-sm bg-green-600 text-white shadow-lg shadow-green-600/30 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 inline-flex items-center gap-2"
                onClick={() => setUploadOpen(true)}
              >
                <span className="text-lg leading-none">+</span> Upload Your First Material
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {myItems.slice(0, visibleCountMy).map((item, i) => renderCard(item, i, true))}
              </div>
              {(myItems.length > visibleCountMy || visibleCountMy > 9) && (
                <div className="flex justify-center gap-4 pt-4">
                  {visibleCountMy > 9 && (
                    <button
                      onClick={() => {
                        setVisibleCountMy(9);
                        document.getElementById('resources-section').scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="px-8 py-3 rounded-xl font-bold text-sm bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
                    >
                      Show Less
                    </button>
                  )}
                  {myItems.length > visibleCountMy && (
                    <button
                      onClick={() => setVisibleCountMy(prev => prev + 9)}
                      className="px-8 py-3 rounded-xl font-bold text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors shadow-sm"
                    >
                      Show More Resources
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ═══════════ UPLOAD MODAL ═══════════ */}
      {uploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm" onClick={() => setUploadOpen(false)}>
          <div
            className="relative w-full max-w-lg bg-white border border-gray-100 rounded-2xl shadow-2xl p-6 md:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-2xl font-bold text-gray-800">Upload Material</h2>
              <button onClick={() => setUploadOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <p className="text-sm text-gray-500 mb-6">Share documents with the campus community.</p>

            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Title *</label>
                <input
                  type="text"
                  className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500/40 focus:bg-white text-sm transition-all"
                  placeholder="e.g. Data Structures Notes - Chapter 5"
                  value={uploadForm.title}
                  onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                <textarea
                  className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500/40 focus:bg-white text-sm resize-none transition-all"
                  rows={3}
                  placeholder="Brief description of the material…"
                  value={uploadForm.description}
                  onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Subject *</label>
                <input
                  list="upload-subject-list"
                  type="text"
                  placeholder="Select or type a subject..."
                  className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500/40 focus:bg-white text-sm transition-all"
                  value={uploadForm.subject}
                  onChange={(e) => setUploadForm({ ...uploadForm, subject: e.target.value })}
                  required
                />
                <datalist id="upload-subject-list">
                  {SUBJECTS.filter((s) => s !== 'All').map((s) => (
                    <option key={s} value={s} />
                  ))}
                </datalist>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">File * <span className="text-gray-500 font-normal">(pdf, doc, ppt, txt — max 10 MB)</span></label>
                <div className="w-full border-2 border-dashed border-gray-300 rounded-xl p-4 bg-gray-50 text-center hover:bg-gray-100 transition-all">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100 cursor-pointer"
                    onChange={(e) => setUploadForm({ ...uploadForm, file: e.target.files?.[0] || null })}
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={uploadLoading}
                  className="flex-1 px-5 py-3 rounded-xl font-bold text-sm bg-green-600 hover:bg-green-700 text-white shadow-lg transition-all disabled:opacity-50"
                >
                  {uploadLoading ? 'Uploading…' : 'Upload Securely'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════ REPORT MODAL ═══════════ */}
      {reportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm" onClick={() => { setReportOpen(null); setReportReason(''); }}>
          <div
            className="relative w-full max-w-md bg-white border border-gray-100 rounded-2xl shadow-2xl p-6 md:p-8 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-4xl mb-4">🚩</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Report Resource</h2>
            <p className="text-sm text-gray-500 mb-6">Help us keep the campus community safe. Your report will be sent to the admins.</p>
            <textarea
              className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-400/40 transition-all text-sm resize-none mb-4"
              rows={4}
              placeholder="Describe the issue (e.g. copyright violation, spam…)"
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
            />
            <div className="flex gap-3">
              <button
                disabled={reportLoading}
                className="flex-1 px-5 py-3 rounded-xl font-bold text-sm bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50 shadow-lg"
                onClick={handleReport}
              >
                {reportLoading ? 'Submitting…' : 'Submit Report'}
              </button>
              <button
                className="px-5 py-3 rounded-xl font-bold text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm" onClick={() => setSummaryOpen(null)}>
          <div
            className="relative w-full max-w-2xl max-h-[85vh] bg-white border border-gray-100 rounded-2xl shadow-2xl p-6 overflow-auto flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl bg-green-50 p-2 rounded-xl border border-green-100">🤖</span>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">AI Summary</h2>
                  <p className="text-xs text-gray-500 line-clamp-1">{summaryOpen.title}</p>
                </div>
              </div>
              <button onClick={() => setSummaryOpen(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            {summaryLoading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600"></div>
                <span className="text-gray-500 font-medium text-sm">Our AI is reading the document...</span>
              </div>
            ) : (
              <div className="flex-1 bg-gray-50 border border-gray-100 rounded-xl p-5 text-gray-700 text-sm leading-relaxed whitespace-pre-wrap overflow-y-auto">
                {summaryOpen.text}
              </div>
            )}
            <div className="mt-6 flex justify-end">
              <button
                className="px-6 py-2.5 rounded-xl font-bold text-white bg-green-600 hover:bg-green-700 transition-all shadow-md"
                onClick={() => setSummaryOpen(null)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════ DELETE CONFIRM MODAL ═══════════ */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)}>
          <div
            className="relative w-full max-w-sm bg-white border border-gray-100 rounded-2xl shadow-2xl p-8 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-4 border-2 border-white shadow-sm">
              🗑
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Delete Material?</h2>
            <p className="text-sm text-gray-500 mb-8">This action cannot be undone. The file will be permanently removed.</p>
            <div className="flex gap-3">
              <button
                disabled={deleteLoading}
                className="flex-1 px-5 py-3 rounded-xl font-bold text-sm bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50 shadow-lg"
                onClick={handleDelete}
              >
                {deleteLoading ? 'Deleting…' : 'Yes, Delete'}
              </button>
              <button
                className="flex-1 px-5 py-3 rounded-xl font-bold text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
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
        <div className={`fixed bottom-8 right-8 z-[60] px-6 py-3 rounded-xl font-bold text-sm shadow-2xl transition-all ${
            toast.type === 'error'
              ? 'bg-red-600 text-white shadow-red-500/30'
              : 'bg-green-600 text-white shadow-green-600/30'
          }`}>
          {toast.msg}
        </div>
      )}

      {/* Community Contribution Section */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1 flex justify-center">
            <img
              src="https://img.freepik.com/free-vector/students-studying-concept-illustration_114360-8438.jpg"
              alt="Empower your peers"
              className="w-full max-w-sm rounded-2xl shadow-lg"
            />
          </div>
          <div className="flex-1">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Empower your academic circle</h2>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Don't keep your knowledge to yourself! Upload your lecture notes, summaries, and past papers to help your fellow students succeed. Build a robust academic community where everyone can thrive through shared resources.
            </p>
            <button
              onClick={() => {
                document.getElementById('resources-section').scrollIntoView({ behavior: 'smooth' });
                setUploadOpen(true);
              }}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-8 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              Start Uploading
            </button>
          </div>
        </div>
      </section>

      {/* AI Summary Section */}
      <section className="py-16 px-4 bg-gradient-to-br from-green-50 to-white">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Learn faster with AI Summaries</h2>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Short on time? Use our integrated AI summarization tool to extract the most important points from any uploaded document instantly. Spend less time reading and more time mastering the core concepts of your courses.
            </p>
            <button
              onClick={() => {
                document.getElementById('resources-section').scrollIntoView({ behavior: 'smooth' });
                setTab('all');
              }}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-8 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              Try AI Summaries
            </button>
          </div>
          <div className="flex-1 flex justify-center">
            <img
              src="https://img.freepik.com/free-vector/artificial-intelligence-concept-illustration_114360-7001.jpg"
              alt="AI Summaries"
              className="w-full max-w-sm rounded-2xl shadow-lg"
            />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
