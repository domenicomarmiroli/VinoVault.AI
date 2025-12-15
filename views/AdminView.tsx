import React, { useState, useEffect, useRef } from 'react';
import { User, Restaurant } from '../types';
import { ShieldCheckIcon, LogoutIcon, TrashIcon, WineIcon, ChartBarIcon, RestaurantIcon, CameraIcon } from '../components/Icons';
import { extractTextFromImage } from '../services/geminiService';

interface AdminViewProps {
  onLogout: () => void;
  token: string;
}

// Reuse helper locally
const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 1000;
                const MAX_HEIGHT = 1000;
                let width = img.width;
                let height = img.height;
                if (width > height) {
                    if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
                } else {
                    if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
                }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(img, 0, 0, width, height);
                    resolve(canvas.toDataURL('image/jpeg', 0.7));
                } else reject(new Error("Canvas error"));
            };
            img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
    });
};

const AdminView: React.FC<AdminViewProps> = ({ onLogout, token }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'users' | 'restaurants'>('users');

  // Restaurant Form State
  const [editingRest, setEditingRest] = useState<Partial<Restaurant> | null>(null);
  const [menuImage, setMenuImage] = useState<string | null>(null);
  const [extracting, setExtracting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // User Reset State
  const [resetModalUser, setResetModalUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');

  const API_BASE = ''; 

  const fetchData = async () => {
      setLoading(true);
      try {
          const [usersRes, restRes] = await Promise.all([
              fetch(`${API_BASE}/api/users`, { headers: { 'Authorization': `Bearer ${token}` } }),
              fetch(`${API_BASE}/api/admin/restaurants`, { headers: { 'Authorization': `Bearer ${token}` } })
          ]);
          
          if (usersRes.ok) setUsers(await usersRes.json());
          if (restRes.ok) setRestaurants(await restRes.json());
      } catch (e) {
          console.error("Failed to fetch admin data", e);
      } finally {
          setLoading(false);
      }
  };

  useEffect(() => {
      fetchData();
  }, [token]);

  // --- RESTAURANT ACTIONS ---
  const handleSaveRestaurant = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!editingRest?.name || !editingRest?.slug) return;

      try {
          const res = await fetch(`${API_BASE}/api/admin/restaurants`, {
              method: 'POST',
              headers: { 
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}` 
              },
              body: JSON.stringify(editingRest)
          });
          if (res.ok) {
              fetchData();
              setEditingRest(null);
              setMenuImage(null);
          } else {
              alert("Errore salvataggio");
          }
      } catch(e) {
          alert("Errore connessione");
      }
  };

  const handleDeleteRestaurant = async (id: string) => {
      if(!confirm("Eliminare ristorante?")) return;
      try {
          await fetch(`${API_BASE}/api/admin/restaurants/${id}`, {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${token}` }
          });
          setRestaurants(prev => prev.filter(r => r.id !== id));
      } catch(e) { alert("Errore"); }
  };

  const handleMenuImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          try {
              setExtracting(true);
              const compressed = await compressImage(file);
              const text = await extractTextFromImage(compressed);
              setEditingRest(prev => ({
                  ...prev,
                  menu_context: (prev?.menu_context || '') + "\n" + text
              }));
          } catch(e) {
              alert("Errore lettura menu");
          } finally {
              setExtracting(false);
          }
      }
  };

  const generateQrUrl = (slug: string) => `${window.location.origin}/?ref=${encodeURIComponent(slug)}`;

  // --- USER ACTIONS ---
  const handleDeleteUser = async (id: string) => {
      if (!confirm("Eliminare utente?")) return;
      try {
          const res = await fetch(`${API_BASE}/api/users/${id}`, {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) setUsers(prev => prev.filter(u => u.id !== id));
      } catch (e) { alert("Errore"); }
  };

  const handleTogglePremium = async (id: string) => {
      try {
          const res = await fetch(`${API_BASE}/api/users/${id}/premium`, {
              method: 'PUT',
              headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
              setUsers(prev => prev.map(u => u.id === id ? { ...u, is_premium: !u.is_premium } : u));
          }
      } catch (e) { alert("Errore"); }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!resetModalUser || !newPassword) return;
      try {
          await fetch(`${API_BASE}/api/users/${resetModalUser.id}/reset-password`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify({ newPassword })
          });
          alert("Password aggiornata");
          setResetModalUser(null);
          setNewPassword('');
      } catch (e) { alert("Errore"); }
  };

  return (
    <div className="h-full flex flex-col bg-stone-50 overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-6 shadow-sm z-10 flex justify-between items-start">
        <div>
            <h1 className="text-2xl font-serif font-bold text-gray-900 flex items-center gap-2">
                <ShieldCheckIcon className="w-8 h-8 text-wine-600" filled />
                Admin Backoffice
            </h1>
        </div>
        <button onClick={onLogout} className="text-gray-400 hover:text-wine-700 p-2"><LogoutIcon className="w-6 h-6" /></button>
      </div>

      <div className="flex border-b border-gray-200 bg-white">
          <button 
            onClick={() => setActiveTab('users')} 
            className={`flex-1 py-3 font-bold text-sm ${activeTab === 'users' ? 'border-b-2 border-wine-600 text-wine-700' : 'text-gray-500'}`}
          >
              Utenti ({users.length})
          </button>
          <button 
            onClick={() => setActiveTab('restaurants')} 
            className={`flex-1 py-3 font-bold text-sm ${activeTab === 'restaurants' ? 'border-b-2 border-wine-600 text-wine-700' : 'text-gray-500'}`}
          >
              Ristoranti ({restaurants.length})
          </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-24 space-y-6">
         
         {activeTab === 'users' ? (
             /* Users Table */
             <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                 <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                     <h3 className="font-bold text-gray-700">Utenti Registrati</h3>
                     <button onClick={fetchData} className="text-wine-600 text-sm font-bold hover:underline">Aggiorna</button>
                 </div>
                 
                 {loading ? <div className="p-8 text-center text-gray-400">Caricamento...</div> : (
                     <div className="overflow-x-auto">
                         <table className="w-full text-left text-sm">
                             <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-xs">
                                 <tr>
                                     <th className="p-3">Email</th>
                                     <th className="p-3 text-center">Stato</th>
                                     <th className="p-3 text-center">Stats</th>
                                     <th className="p-3 text-right">Azioni</th>
                                 </tr>
                             </thead>
                             <tbody className="divide-y divide-gray-100">
                                 {users.map(user => (
                                     <tr key={user.id} className="hover:bg-gray-50">
                                         <td className="p-3 font-medium text-gray-900">
                                             {user.email}
                                             {user.role === 'admin' && <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] bg-purple-100 text-purple-700">Admin</span>}
                                         </td>
                                         <td className="p-3 text-center">
                                             {user.is_premium ? <span className="px-2 py-0.5 rounded text-[10px] bg-amber-100 text-amber-700">Premium</span> : <span className="px-2 py-0.5 rounded text-[10px] bg-gray-100 text-gray-500">Free</span>}
                                         </td>
                                         <td className="p-3 text-center text-xs">
                                             {user.wine_count || 0} Vini / {user.ai_usage_count || 0} AI
                                         </td>
                                         <td className="p-3 text-right flex gap-2 justify-end">
                                             <button onClick={() => handleTogglePremium(user.id)} className="text-amber-600 hover:text-amber-800 text-lg p-1" title="Toggle Premium">💎</button>
                                             <button onClick={() => setResetModalUser(user)} className="text-blue-600 hover:text-blue-800 text-xs font-bold border border-blue-200 bg-blue-50 px-2 py-1 rounded">Pwd</button>
                                             <button onClick={() => handleDeleteUser(user.id)} disabled={user.role === 'admin'} className={`text-red-600 hover:text-red-800 p-1 ${user.role === 'admin' && 'opacity-30'}`}><TrashIcon className="w-4 h-4" /></button>
                                         </td>
                                     </tr>
                                 ))}
                             </tbody>
                         </table>
                     </div>
                 )}
             </div>
         ) : (
             /* Restaurants Management */
             <div className="space-y-6">
                 {/* Create/Edit Form */}
                 <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                     <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-gray-700">{editingRest?.id ? 'Modifica Ristorante' : 'Nuovo Ristorante'}</h3>
                        {editingRest && <button onClick={() => setEditingRest(null)} className="text-xs text-gray-500">Chiudi</button>}
                     </div>
                     
                     <form onSubmit={handleSaveRestaurant} className="space-y-3">
                         <div className="grid grid-cols-2 gap-3">
                             <input 
                                type="text" 
                                placeholder="Nome Ristorante" 
                                value={editingRest?.name || ''} 
                                onChange={e => {
                                    const val = e.target.value;
                                    setEditingRest(prev => ({ 
                                        ...prev, 
                                        name: val,
                                        // Auto-slug only if new
                                        slug: (!prev?.id && !prev?.slug) ? val.toLowerCase().replace(/ /g, '-').replace(/[^a-z0-9-]/g, '') : prev?.slug 
                                    }));
                                }}
                                className="p-2 border border-gray-300 rounded-lg w-full text-sm"
                                required
                             />
                             <input 
                                type="text" 
                                placeholder="Slug (URL)" 
                                value={editingRest?.slug || ''} 
                                onChange={e => setEditingRest(prev => ({ ...prev, slug: e.target.value }))}
                                className="p-2 border border-gray-300 rounded-lg w-full text-sm font-mono"
                                required
                             />
                         </div>
                         
                         <div>
                             <div className="flex justify-between items-end mb-1">
                                <label className="text-xs font-bold text-gray-500">Carta Vini (Testo)</label>
                                <button 
                                    type="button" 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="text-xs text-wine-600 font-bold flex items-center gap-1 hover:underline"
                                    disabled={extracting}
                                >
                                    <CameraIcon className="w-3 h-3" />
                                    {extracting ? 'Analisi in corso...' : 'Estrai da Foto'}
                                </button>
                                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleMenuImageUpload} />
                             </div>
                             <textarea 
                                value={editingRest?.menu_context || ''} 
                                onChange={e => setEditingRest(prev => ({ ...prev, menu_context: e.target.value }))}
                                className="w-full h-32 p-2 border border-gray-300 rounded-lg text-xs font-mono"
                                placeholder="Incolla qui il testo del menu o usa 'Estrai da Foto'..."
                             />
                         </div>

                         <button type="submit" className="w-full py-2 bg-wine-600 text-white font-bold rounded-lg hover:bg-wine-700">
                             {editingRest?.id ? 'Aggiorna' : 'Crea Ristorante'}
                         </button>
                     </form>
                 </div>

                 {/* List */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {restaurants.map(r => (
                         <div key={r.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                             <div className="flex justify-between items-start mb-2">
                                 <div>
                                     <h4 className="font-bold text-gray-900">{r.name}</h4>
                                     <p className="text-xs text-gray-500 font-mono">?ref={r.slug}</p>
                                 </div>
                                 <div className="flex gap-2">
                                     <button onClick={() => setEditingRest(r)} className="text-blue-600 hover:text-blue-800 text-xs font-bold">Edit</button>
                                     <button onClick={() => handleDeleteRestaurant(r.id)} className="text-red-500 hover:text-red-700"><TrashIcon className="w-4 h-4" /></button>
                                 </div>
                             </div>
                             
                             <div className="bg-gray-50 p-2 rounded border border-gray-100 flex gap-4 items-center mb-2">
                                 <img src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(generateQrUrl(r.slug))}`} className="w-16 h-16" />
                                 <div className="overflow-hidden">
                                     <p className="text-[10px] text-gray-400 uppercase">QR Code & Link</p>
                                     <a href={generateQrUrl(r.slug)} target="_blank" className="text-xs text-wine-600 truncate block hover:underline">{generateQrUrl(r.slug)}</a>
                                 </div>
                             </div>
                             
                             <div className="text-[10px] text-gray-400">
                                 Menu: {r.menu_context ? `${r.menu_context.length} caratteri` : 'Vuoto'}
                             </div>
                         </div>
                     ))}
                 </div>
             </div>
         )}
      </div>

      {/* Reset Password Modal */}
      {resetModalUser && (
          <div className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-xl animate-in zoom-in-95">
                  <h3 className="font-bold text-lg mb-2">Reset Password</h3>
                  <p className="text-sm text-gray-600 mb-4">Per <strong>{resetModalUser.email}</strong></p>
                  <form onSubmit={handleResetPassword}>
                      <input type="text" placeholder="Nuova Password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg mb-4" autoFocus />
                      <div className="flex gap-3">
                          <button type="button" onClick={() => { setResetModalUser(null); setNewPassword(''); }} className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg font-bold">Annulla</button>
                          <button type="submit" disabled={!newPassword} className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50">Salva</button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};

export default AdminView;