import { useEffect, useState } from 'react';
import { getAllMaterials, deleteMaterial, downloadMaterial } from '../../services/resourceService';

export default function ResourceCoordinatorDashboard() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all' or 'reported'
  const [isDeleting, setIsDeleting] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const fetchResources = async () => {
    setLoading(true);
    try {
      const data = await getAllMaterials();
      setItems(data || []);
    } catch (err) {
      console.error(err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, []);

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setIsDeleting(deleteConfirm);
    try {
      await deleteMaterial(deleteConfirm);
      setDeleteConfirm(null);
      fetchResources();
    } catch (err) {
      alert(err.message || 'Failed to delete resource');
    } finally {
      setIsDeleting(null);
    }
  };

  const handleDownload = async (item) => {
    try {
      await downloadMaterial(item._id, item.fileName);
    } catch (err) {
      alert(err.message || 'Download failed');
    }
  };

  const displayedItems = filter === 'reported' 
    ? items.filter(item => item.reports && item.reports.length > 0)
    : items;

  return (
    <div className="space-y-6">
      <div className="admin-events-header">
        <div>
          <h1 className="text-2xl font-bold text-white m-0">Resource Management</h1>
          <p className="admin-events-header-subtitle mt-1 mb-0">Oversee all user-uploaded study materials and handle reported content.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setFilter('all')} 
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${filter === 'all' ? 'bg-white text-green-700 shadow-sm' : 'bg-green-700/50 text-white hover:bg-green-600/50'}`}
          >
            All Resources
          </button>
          <button 
            onClick={() => setFilter('reported')} 
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors flex items-center gap-2 ${filter === 'reported' ? 'bg-white text-red-600 shadow-sm' : 'bg-green-700/50 text-white hover:bg-red-500/50'}`}
          >
            🚩 Reported
            {items.filter(i => i.reports?.length > 0).length > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                {items.filter(i => i.reports?.length > 0).length}
              </span>
            )}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600"></div>
        </div>
      ) : displayedItems.length === 0 ? (
        <div className="admin-events-empty">
          <p className="text-xl mb-2 text-gray-400">📂</p>
          <p className="text-gray-600 font-medium">No resources found in this category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {displayedItems.map((item) => {
            const size = item.fileSize ? (item.fileSize / (1024 * 1024)).toFixed(2) + ' MB' : 'Unknown';
            const reported = item.reports && item.reports.length > 0;
            
            return (
              <div key={item._id} className={`bg-white rounded-2xl p-5 shadow-sm border transition-shadow hover:shadow-md ${reported ? 'border-red-200' : 'border-gray-100'}`}>
                <div className="flex justify-between items-start mb-3 gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                       <span className="text-xs font-semibold px-2.5 py-1 bg-green-50 text-green-700 rounded-full">{item.subject || 'General'}</span>
                       {reported && <span className="text-xs font-semibold px-2.5 py-1 bg-red-50 text-red-600 rounded-full animate-pulse">🚩 {item.reports.length} Reports</span>}
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 line-clamp-1" title={item.title}>{item.title}</h3>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-gray-500 font-medium">{new Date(item.createdAt).toLocaleDateString()}</p>
                    <p className="text-xs text-gray-400 mt-1">{size}</p>
                  </div>
                </div>

                <p className="text-sm text-gray-600 mb-4 line-clamp-2 min-h-[40px]">{item.description || 'No description provided.'}</p>
                
                <div className="bg-gray-50 rounded-xl p-3 mb-4 border border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">👤</span>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Uploaded by</p>
                      <p className="text-sm text-gray-800 font-semibold">{item.uploadedBy?.fullName || 'Unknown User'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 font-medium">Downloads</p>
                    <p className="text-sm text-gray-800 font-semibold">{item.downloadCount || 0}</p>
                  </div>
                </div>

                {reported && (
                  <div className="bg-red-50/50 rounded-xl p-3 mb-4 border border-red-100 max-h-32 overflow-y-auto">
                    <p className="text-xs font-bold text-red-700 mb-2 uppercase tracking-wide">Report Reasons:</p>
                    <ul className="list-disc pl-4 text-xs text-red-600 space-y-1">
                      {item.reports.map((r, idx) => (
                        <li key={idx}>{r.reason}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex gap-3 justify-end pt-2 border-t border-gray-100">
                  <button 
                    onClick={() => handleDownload(item)}
                    className="px-4 py-2 text-sm font-semibold rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
                  >
                    Download File
                  </button>
                  <button 
                    onClick={() => setDeleteConfirm(item._id)}
                    disabled={isDeleting === item._id}
                    className="px-4 py-2 text-sm font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50 shadow-sm"
                  >
                    {isDeleting === item._id ? 'Deleting...' : 'Delete Resource'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ═══════════ DELETE CONFIRM MODAL ═══════════ */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)}>
          <div
            className="relative w-full max-w-sm bg-white border border-gray-100 rounded-2xl shadow-2xl p-8 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Delete Resource?</h2>
            <p className="text-gray-500 mb-8 text-sm leading-relaxed">
              This action cannot be undone. This material will be removed permanently.
            </p>
            <div className="flex gap-3">
              <button
                className="flex-1 py-3 rounded-xl font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all"
                onClick={() => setDeleteConfirm(null)}
                disabled={isDeleting === deleteConfirm}
              >
                Cancel
              </button>
              <button
                className="flex-1 py-3 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 transition-all shadow-md flex justify-center items-center"
                onClick={handleDelete}
                disabled={isDeleting === deleteConfirm}
              >
                {isDeleting === deleteConfirm ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
