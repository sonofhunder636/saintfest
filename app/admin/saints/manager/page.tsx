'use client';

import { useRequireAuth } from '@/hooks/useRequireAuth';
import { useState, useEffect } from 'react';
import { Saint } from '@/types';

export default function SaintsManagerPage() {
  const { currentUser, loading: authLoading } = useRequireAuth();
  const [saints, setSaints] = useState<Saint[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importStatus, setImportStatus] = useState<string>('');
  const [showWipeConfirm, setShowWipeConfirm] = useState(false);
  const [editingSaint, setEditingSaint] = useState<Saint | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<Saint>>({});

  // Fetch saints
  const fetchSaints = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/saints');
      const data = await response.json();
      if (data.success) {
        setSaints(data.data);
      }
    } catch (error) {
      console.error('Error fetching saints:', error);
    }
    setLoading(false);
  };

  // Wipe database
  const handleWipeDatabase = async () => {
    setLoading(true);
    setImportStatus('Wiping database...');
    try {
      const response = await fetch('/api/admin/saints/wipe', {
        method: 'DELETE',
      });
      const data = await response.json();
      
      if (data.success) {
        setImportStatus(`✅ Database wiped: ${data.deletedCount} saints deleted`);
        setSaints([]);
      } else {
        setImportStatus(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      setImportStatus(`❌ Error: ${error}`);
    }
    setLoading(false);
    setShowWipeConfirm(false);
  };

  // Import from Excel
  const handleExcelImport = async () => {
    if (!selectedFile) {
      setImportStatus('❌ Please select an Excel file');
      return;
    }

    setLoading(true);
    setImportStatus('Importing saints from Excel...');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch('/api/admin/saints/import', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (data.success) {
        setImportStatus(`✅ Import successful: ${data.importedCount} saints imported, ${data.skippedCount} skipped`);
        await fetchSaints(); // Refresh the list
      } else {
        setImportStatus(`❌ Import failed: ${data.error}`);
      }
    } catch (error) {
      setImportStatus(`❌ Import error: ${error}`);
    }
    
    setLoading(false);
    setSelectedFile(null);
  };

  // Delete individual saint
  const handleDeleteSaint = async (saintId: string) => {
    if (!confirm('Are you sure you want to delete this saint?')) return;

    try {
      const response = await fetch(`/api/admin/saints/${saintId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setSaints(saints.filter(s => s.id !== saintId));
        setImportStatus('✅ Saint deleted successfully');
      }
    } catch (error) {
      setImportStatus(`❌ Error deleting saint: ${error}`);
    }
  };

  // Edit saint functions
  const handleEditSaint = (saint: Saint) => {
    setEditingSaint(saint);
    setEditFormData({ ...saint });
  };

  const handleSaveEdit = async () => {
    if (!editingSaint || !editFormData.name) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/saints/${editingSaint.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData),
      });

      const data = await response.json();
      if (data.success) {
        setSaints(saints.map(s => s.id === editingSaint.id ? { ...editingSaint, ...editFormData } : s));
        setImportStatus('✅ Saint updated successfully');
        setEditingSaint(null);
        setEditFormData({});
      } else {
        setImportStatus(`❌ Error updating saint: ${data.error}`);
      }
    } catch (error) {
      setImportStatus(`❌ Error updating saint: ${error}`);
    }
    setLoading(false);
  };

  const handleCancelEdit = () => {
    setEditingSaint(null);
    setEditFormData({});
  };

  useEffect(() => {
    if (currentUser && !authLoading) {
      fetchSaints();
    }
  }, [currentUser, authLoading]);

  // Filter saints based on search
  const filteredSaints = saints.filter(saint => {
    if (searchTerm === 'participated2024:true') {
      return saint.participatedIn2024 === true;
    }
    if (searchTerm === 'participated2024:false') {
      return !saint.participatedIn2024;
    }
    
    // Regular search
    return saint.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           saint.origin?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-100 p-4 flex items-center justify-center">
        <div className="text-lg font-semibold">Loading authentication...</div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-100 p-4 flex items-center justify-center">
        <div className="text-lg font-semibold text-red-600">Not authenticated</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Saints Database Manager</h1>
          <p className="text-gray-600">Manage your saints database: import, edit, and maintain saint records</p>
        </div>

        {/* Control Panel */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Database Operations</h2>
          
          {/* Status Display */}
          {importStatus && (
            <div className="mb-4 p-3 bg-gray-50 rounded border-l-4 border-blue-500">
              <p className="text-sm">{importStatus}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Excel Import Section */}
            <div className="border rounded p-4">
              <h3 className="font-semibold mb-3">Import from Excel</h3>
              <div className="space-y-3">
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="w-full p-2 border rounded"
                />
                <button
                  onClick={handleExcelImport}
                  disabled={!selectedFile || loading}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {loading ? 'Importing...' : 'Import Excel File'}
                </button>
              </div>
            </div>

            {/* Database Management Section */}
            <div className="border rounded p-4">
              <h3 className="font-semibold mb-3">Database Management</h3>
              <div className="space-y-3">
                <button
                  onClick={() => fetchSaints()}
                  disabled={loading}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
                >
                  {loading ? 'Loading...' : 'Refresh Saints List'}
                </button>
                
                <button
                  onClick={() => setShowWipeConfirm(true)}
                  disabled={loading}
                  className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400"
                >
                  Wipe All Saints
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Wipe Confirmation Modal */}
        {showWipeConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md mx-4">
              <h3 className="text-lg font-bold text-red-600 mb-3">⚠️ Danger Zone</h3>
              <p className="mb-4">
                This will permanently delete ALL saints from the database. This action cannot be undone.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowWipeConfirm(false)}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleWipeDatabase}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Yes, Wipe Database
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Saint Modal */}
        {editingSaint && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-4xl mx-auto max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-900">Edit Saint: {editingSaint.name}</h3>
                <button onClick={handleCancelEdit} className="text-gray-400 hover:text-gray-600">
                  ✕
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    type="text"
                    value={editFormData.name || ''}
                    onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Feast Day</label>
                  <input
                    type="text"
                    value={editFormData.feastDay || ''}
                    onChange={(e) => setEditFormData({...editFormData, feastDay: e.target.value})}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Origin</label>
                  <input
                    type="text"
                    value={editFormData.origin || ''}
                    onChange={(e) => setEditFormData({...editFormData, origin: e.target.value})}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location of Labor</label>
                  <input
                    type="text"
                    value={editFormData.locationOfLabor || ''}
                    onChange={(e) => setEditFormData({...editFormData, locationOfLabor: e.target.value})}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Birth Year</label>
                  <input
                    type="number"
                    value={editFormData.birthYear || ''}
                    onChange={(e) => setEditFormData({...editFormData, birthYear: parseInt(e.target.value) || undefined})}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Death Year</label>
                  <input
                    type="number"
                    value={editFormData.deathYear || ''}
                    onChange={(e) => setEditFormData({...editFormData, deathYear: parseInt(e.target.value) || undefined})}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Tournament History</label>
                <div className="mb-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={!!editFormData.participatedIn2024}
                      onChange={(e) => setEditFormData({
                        ...editFormData,
                        participatedIn2024: e.target.checked
                      })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-900">Participated in Saintfest 2024</span>
                  </label>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Categories</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {[
                    'eastern', 'western', 'evangelist', 'martyrs', 'confessors', 'doctorsofthechurch',
                    'virgins', 'holywoman', 'mystic', 'convert', 'blessed', 'venerable',
                    'missionary', 'deacon', 'priest', 'bishop', 'cardinal', 'pope',
                    'apostle', 'abbotabbess', 'hermit', 'royalty', 'religious', 'lay',
                    'groupcompanions', 'churchfather', 'oldtestament'
                  ].map((category) => (
                    <label key={category} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={!!(editFormData as Record<string, boolean>)[category]}
                        onChange={(e) => setEditFormData({
                          ...editFormData,
                          [category]: e.target.checked
                        })}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm capitalize">{category.replace(/([A-Z])/g, ' $1').trim()}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Hagiography/Biography</label>
                <textarea
                  value={editFormData.hagiography || ''}
                  onChange={(e) => setEditFormData({...editFormData, hagiography: e.target.value})}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                  rows={4}
                />
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={handleCancelEdit}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={loading || !editFormData.name}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Saints List */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
              <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                <h2 className="text-xl font-semibold">
                  Saints List ({filteredSaints.length} of {saints.length})
                </h2>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setSearchTerm('participated2024:true')}
                    className="px-3 py-1 bg-orange-100 text-orange-800 text-xs rounded-full hover:bg-orange-200 transition-colors"
                  >
                    Show 2024 Participants ({saints.filter(s => s.participatedIn2024).length})
                  </button>
                  <button
                    onClick={() => setSearchTerm('participated2024:false')}
                    className="px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full hover:bg-green-200 transition-colors"
                  >
                    Show Available Saints ({saints.filter(s => !s.participatedIn2024).length})
                  </button>
                </div>
              </div>
              <input
                type="text"
                placeholder="Search saints..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-4 py-2 border rounded-lg w-full sm:w-64"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categories</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSaints.map((saint) => (
                  <tr key={saint.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">{saint.name || 'Unknown'}</div>
                          {saint.feastDay && <div className="text-sm text-gray-500">{saint.feastDay}</div>}
                        </div>
                        {saint.participatedIn2024 && (
                          <div className="flex-shrink-0">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                              2024
                            </span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="max-w-2xl">
                        {saint.eastern && <span className="inline-block m-1 px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded whitespace-nowrap">Eastern</span>}
                        {saint.western && <span className="inline-block m-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded whitespace-nowrap">Western</span>}
                        {saint.evangelist && <span className="inline-block m-1 px-2 py-1 bg-sky-100 text-sky-800 text-xs rounded whitespace-nowrap">Evangelist</span>}
                        {saint.martyrs && <span className="inline-block m-1 px-2 py-1 bg-red-100 text-red-800 text-xs rounded whitespace-nowrap">Martyr</span>}
                        {saint.confessors && <span className="inline-block m-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded whitespace-nowrap">Confessor</span>}
                        {saint.doctorsofthechurch && <span className="inline-block m-1 px-2 py-1 bg-amber-100 text-amber-800 text-xs rounded whitespace-nowrap">Doctor</span>}
                        {saint.virgins && <span className="inline-block m-1 px-2 py-1 bg-rose-100 text-rose-800 text-xs rounded whitespace-nowrap">Virgin</span>}
                        {saint.holywoman && <span className="inline-block m-1 px-2 py-1 bg-pink-100 text-pink-800 text-xs rounded whitespace-nowrap">Holy Woman</span>}
                        {saint.mystic && <span className="inline-block m-1 px-2 py-1 bg-fuchsia-100 text-fuchsia-800 text-xs rounded whitespace-nowrap">Mystic</span>}
                        {saint.convert && <span className="inline-block m-1 px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded whitespace-nowrap">Convert</span>}
                        {saint.blessed && <span className="inline-block m-1 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded whitespace-nowrap">Blessed</span>}
                        {saint.venerable && <span className="inline-block m-1 px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded whitespace-nowrap">Venerable</span>}
                        {saint.missionary && <span className="inline-block m-1 px-2 py-1 bg-emerald-100 text-emerald-800 text-xs rounded whitespace-nowrap">Missionary</span>}
                        {saint.deacon && <span className="inline-block m-1 px-2 py-1 bg-teal-100 text-teal-800 text-xs rounded whitespace-nowrap">Deacon</span>}
                        {saint.priest && <span className="inline-block m-1 px-2 py-1 bg-cyan-100 text-cyan-800 text-xs rounded whitespace-nowrap">Priest</span>}
                        {saint.bishop && <span className="inline-block m-1 px-2 py-1 bg-indigo-100 text-indigo-800 text-xs rounded whitespace-nowrap">Bishop</span>}
                        {saint.cardinal && <span className="inline-block m-1 px-2 py-1 bg-red-200 text-red-900 text-xs rounded whitespace-nowrap">Cardinal</span>}
                        {saint.pope && <span className="inline-block m-1 px-2 py-1 bg-yellow-200 text-yellow-900 text-xs rounded whitespace-nowrap">Pope</span>}
                        {saint.apostle && <span className="inline-block m-1 px-2 py-1 bg-blue-200 text-blue-900 text-xs rounded whitespace-nowrap">Apostle</span>}
                        {saint.abbotabbess && <span className="inline-block m-1 px-2 py-1 bg-purple-200 text-purple-900 text-xs rounded whitespace-nowrap">Abbot/Abbess</span>}
                        {saint.hermit && <span className="inline-block m-1 px-2 py-1 bg-stone-100 text-stone-800 text-xs rounded whitespace-nowrap">Hermit</span>}
                        {saint.royalty && <span className="inline-block m-1 px-2 py-1 bg-violet-100 text-violet-800 text-xs rounded whitespace-nowrap">Royalty</span>}
                        {saint.religious && <span className="inline-block m-1 px-2 py-1 bg-lime-100 text-lime-800 text-xs rounded whitespace-nowrap">Religious</span>}
                        {saint.lay && <span className="inline-block m-1 px-2 py-1 bg-slate-100 text-slate-800 text-xs rounded whitespace-nowrap">Lay</span>}
                        {saint.groupcompanions && <span className="inline-block m-1 px-2 py-1 bg-neutral-100 text-neutral-800 text-xs rounded whitespace-nowrap">Group/Companions</span>}
                        {saint.churchfather && <span className="inline-block m-1 px-2 py-1 bg-zinc-100 text-zinc-800 text-xs rounded whitespace-nowrap">Church Father</span>}
                        {saint.oldtestament && <span className="inline-block m-1 px-2 py-1 bg-amber-200 text-amber-900 text-xs rounded whitespace-nowrap">Old Testament</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleEditSaint(saint)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteSaint(saint.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredSaints.length === 0 && !loading && (
            <div className="text-center py-8 text-gray-500">
              {searchTerm ? 'No saints found matching your search.' : 'No saints in database.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}