
import React, { useState, useEffect, useRef } from 'react';
import { User, Restaurant, RestaurantAnalysis } from '../types';
import { ShieldCheckIcon, LogoutIcon, TrashIcon, WineIcon, ChartBarIcon, RestaurantIcon, CameraIcon, UserIcon, ChefIcon, StarIcon, PlusIcon } from '../components/Icons';
import { extractTextFromMedia } from '../services/geminiService';

interface AdminViewProps {
  onLogout: () => void;
  token: string;
}

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

const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
    });
};

const AdminView: React.FC<AdminViewProps> = ({ onLogout, token }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'users' | 'restaurants'>('users');

  const [editingRest, setEditingRest] = useState<Partial<Restaurant> | null>(null);
  const [extracting, setExtracting] = useState<'wine' | 'food' | null>(null);
  const [viewingReport, setViewingReport] = useState<RestaurantAnalysis | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const foodFileInputRef = useRef<HTMLInputElement>(null);

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
          if (restRes.ok) {
              const data = await restRes.json();
              const parsedData = data.map((r: any) => ({
                  ...r,
                  menu_analysis: typeof r.menu_analysis === 'string' ? JSON.parse(r.menu_analysis) : r.menu_analysis
              }));
              setRestaurants(parsedData);
          }
      } catch (e) {
          console.error("Failed to fetch admin data", e);
      } finally {
          setLoading(false);
      }
  };

  useEffect(() => {
      fetchData();
  }, [token]);

  const totalBottlesGlobal = users.reduce((acc, u) => acc + Number(u.wine_count || 0), 0);
  const totalAiUsageGlobal = users.reduce((acc, u) => acc + Number(u.ai_usage_count || 0), 0);

  const handleSaveRestaurant = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!editingRest?.name || !editingRest?.slug) return;
      try {
          const res = await fetch(`${API_BASE}/api/admin/restaurants`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify(editingRest)
          });
          if (res.ok) { fetchData(); setEditingRest(null); }
          else { alert("Errore salvataggio"); }
      } catch(e) { alert("Errore connessione"); }
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

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'wine' | 'food') => {
      const file = e.target.files?.[0];
      if (file) {
          try {
              setExtracting(type);
              let processedData = "";
              let mimeType = file.type;
              if (file.type === 'application/pdf') processedData = await readFileAsBase64(file);
              else if (file.type.startsWith('image/')) { processedData = await compressImage(file); mimeType = 'image/jpeg'; }
              else { alert("Formato non supportato. Usa JPG, PNG o PDF."); setExtracting(null); return; }
              const text = await extractTextFromMedia(processedData, mimeType);
              if (type === 'wine') setEditingRest(prev => ({ ...prev, menu_context: (prev?.menu_context || '') + "\n" + text }));
              else setEditingRest(prev => ({ ...prev, food_menu: (prev?.food_menu || '') + "\n" + text }));
          } catch(e) { alert("Errore lettura menu"); }
          finally { setExtracting(null); }
      }
  };

  const generateQrUrl = (slug: string) => `https://www.aiknow.wine/?ref=${encodeURIComponent(slug)}`;

  const handleDeleteUser = async (id: string) => {
      if (!confirm("Eliminare definitivamente l'utente?")) return;
      try {
          const res = await fetch(`${API_BASE}/api/users/${id}`, {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) setUsers(prev => prev.filter(u => u.id !== id));
      } catch (e) { alert("Errore di connessione"); }
  };

  const handleTogglePremium = async (id: string) => {
      try {
          const res = await fetch(`${API_BASE}/api/users/${id}/premium`, {
              method: 'PUT',
              headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) setUsers(prev => prev.map(u => u.id === id ? { ...u, is_premium: !u.is_premium } : u));
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
      <div className="bg-white border-b border-gray-200 p-6 shadow-sm z-10 flex justify-between items-start">
        <div><h1 className="text-2xl font-serif font-bold text-gray-900 flex items-center gap-2"><ShieldCheckIcon className="w-8 h-8 text-wine-600" filled />Admin Backoffice</h1></div>
        <button onClick={onLogout} className="text-gray-400 hover:text-wine-700 p-2"><LogoutIcon className="w-6 h-6" /></button>
      </div>

      <div className="px-6 py-4 bg-white border-b border-gray-100 flex gap-6 overflow-x-auto no-scrollbar">
          <div className="flex-1 min-w-[140px] bg-wine-50 p-3 rounded-2xl border border-wine-100">
              <span className="block text-[10px] font-black text-wine-600 uppercase tracking-widest mb-1">Bottiglie Totali</span>
              <div className="flex items-center gap-2"><WineIcon className="w-5 h-5 text-wine-700" filled /><span className="text-2xl font-black text-wine-900">{totalBottlesGlobal.toLocaleString()}</span></div>
          </div>
          <div className="flex-1 min-w-[140px] bg-cyan-50 p-3 rounded-2xl border border-cyan-100">
              <span className="block text-[10px] font-black text-cyan-600 uppercase tracking-widest mb-1">Interazioni AI</span>
              <div className="flex items-center gap-2"><ChartBarIcon className="w-5 h-5 text-cyan-700" filled /><span className="text-2xl font-black text-cyan-900">{totalAiUsageGlobal.toLocaleString()}</span></div>
          </div>
      </div>

      <div className="flex border-b border-gray-200 bg-white">
          <button onClick={() => setActiveTab('users')} className={`flex-1 py-3 font-bold text-sm ${activeTab === 'users' ? 'border-b-2 border-wine-600 text-wine-700' : 'text-gray-500'}`}>Utenti ({users.length})</button>
          <button onClick={() => setActiveTab('restaurants')} className={`flex-1 py-3 font-bold text-sm ${activeTab === 'restaurants' ? 'border-b-2 border-wine-600 text-wine-700' : 'text-gray-500'}`}>Ristoranti ({restaurants.length})</button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-24 space-y-6">
         {activeTab === 'users' ? (
             <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                 <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50"><h3 className="font-bold text-gray-700">Utenti Registrati</h3><button onClick={fetchData} className="text-wine-600 text-sm font-bold hover:underline">Aggiorna</button></div>
                 {loading ? <div className="p-8 text-center text-gray-400">Caricamento...</div> : (
                     <div className="overflow-x-auto">
                         <table className="w-full text-left text-sm">
                             <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-xs"><tr><th className="p-3">Email</th><th className="p-3">Origine</th><th className="p-3 text-center">Stato</th><th className="p-3 text-center">Stats</th><th className="p-3 text-right">Azioni</th></tr></thead>
                             <tbody className="divide-y divide-gray-100">
                                 {users.map(user => (
                                     <tr key={user.id} className="hover:bg-gray-50">
                                         <td className="p-3 font-medium text-gray-900">{user.email}{user.role === 'admin' && <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] bg-purple-100 text-purple-700">Admin</span>}</td>
                                         <td className="p-3 text-gray-500 text-xs font-mono">{user.ref_restaurant_slug ? <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded">{user.ref_restaurant_slug}</span> : <span className="text-gray-400">-</span>}</td>
                                         <td className="p-3 text-center">{user.is_premium ? <span className="px-2 py-0.5 rounded text-[10px] bg-amber-100 text-amber-700">Premium</span> : <span className="px-2 py-0.5 rounded text-[10px] bg-gray-100 text-gray-500">Free</span>}</td>
                                         <td className="p-3 text-center text-xs">{user.wine_count || 0} Bott. / {user.ai_usage_count || 0} AI</td>
                                         <td className="p-3 text-right flex gap-2 justify-end">
                                             <button onClick={() => handleTogglePremium(user.id)} className="text-amber-600 hover:text-amber-800 text-lg p-1">💎</button>
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
             <div className="space-y-6">
                 <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                     <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-gray-700">{editingRest?.id ? 'Modifica Ristorante' : 'Nuovo Ristorante'}</h3>{editingRest && <button onClick={() => setEditingRest(null)} className="text-xs text-gray-500">Chiudi</button>}</div>
                     <form onSubmit={handleSaveRestaurant} className="space-y-4">
                         <div className="grid grid-cols-2 gap-3">
                             <input type="text" placeholder="Nome Ristorante" value={editingRest?.name || ''} onChange={e => { const val = e.target.value; setEditingRest(prev => ({ ...prev, name: val, slug: (!prev?.id && !prev?.slug) ? val.toLowerCase().replace(/ /g, '-').replace(/[^a-z0-9-]/g, '') : prev?.slug })); }} className="p-2 border border-gray-300 rounded-lg w-full text-sm" required />
                             <input type="text" placeholder="Slug (URL)" value={editingRest?.slug || ''} onChange={e => setEditingRest(prev => ({ ...prev, slug: e.target.value }))} className="p-2 border border-gray-300 rounded-lg w-full text-sm font-mono" required />
                         </div>
                         <div><label className="block text-xs font-bold text-gray-500 mb-1">Gestore Assegnato</label><select value={editingRest?.manager_id || ''} onChange={e => setEditingRest(prev => ({ ...prev, manager_id: e.target.value }))} className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-white"><option value="">-- Nessun Gestore --</option>{users.map(u => <option key={u.id} value={u.id}>{u.email}</option>)}</select></div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div><div className="flex justify-between items-end mb-1"><label className="text-xs font-bold text-gray-500">Carta Vini (Testo)</label><button type="button" onClick={() => fileInputRef.current?.click()} className="text-xs text-wine-600 font-bold flex items-center gap-1 hover:underline" disabled={extracting !== null}><CameraIcon className="w-3 h-3" />{extracting === 'wine' ? '...' : 'Estrai'}</button><input type="file" ref={fileInputRef} className="hidden" accept="image/*,application/pdf" onChange={(e) => handleMediaUpload(e, 'wine')} /></div><textarea value={editingRest?.menu_context || ''} onChange={e => setEditingRest(prev => ({ ...prev, menu_context: e.target.value }))} className="w-full h-32 p-2 border border-gray-300 rounded-lg text-xs font-mono" placeholder="Carta vini..." /></div>
                             <div><div className="flex justify-between items-end mb-1"><label className="text-xs font-bold text-gray-500">Menù Cibo (Testo)</label><button type="button" onClick={() => foodFileInputRef.current?.click()} className="text-xs text-orange-600 font-bold flex items-center gap-1 hover:underline" disabled={extracting !== null}><CameraIcon className="w-3 h-3" />{extracting === 'food' ? '...' : 'Estrai'}</button><input type="file" ref={foodFileInputRef} className="hidden" accept="image/*,application/pdf" onChange={(e) => handleMediaUpload(e, 'food')} /></div><textarea value={editingRest?.food_menu || ''} onChange={e => setEditingRest(prev => ({ ...prev, food_menu: e.target.value }))} className="w-full h-32 p-2 border border-gray-300 rounded-lg text-xs font-mono" placeholder="Menù piatti..." /></div>
                         </div>
                         <button type="submit" className="w-full py-3 bg-wine-600 text-white font-bold rounded-lg hover:bg-wine-700 shadow-md">{editingRest?.id ? 'Aggiorna Ristorante' : 'Crea Ristorante'}</button>
                     </form>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {restaurants.map(r => (
                         <div key={r.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col">
                             <div className="flex justify-between items-start mb-2"><div><h4 className="font-bold text-gray-900">{r.name}</h4><p className="text-xs text-gray-500 font-mono">?ref={r.slug}</p></div><div className="flex gap-2"><button onClick={() => setEditingRest(r)} className="text-blue-600 hover:text-blue-800 text-xs font-bold bg-blue-50 px-2 py-1 rounded border border-blue-100">Modifica</button><button onClick={() => handleDeleteRestaurant(r.id)} className="text-red-500 hover:text-red-700 bg-red-50 p-1 rounded border border-red-100"><TrashIcon className="w-4 h-4" /></button></div></div>
                             <div className="mb-3 flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-100"><UserIcon className="w-4 h-4 text-gray-400" /><div className="min-w-0"><p className="text-[9px] uppercase font-bold text-gray-400 leading-none mb-1">Gestore</p><p className="text-xs font-medium text-gray-700 truncate">{r.manager_email || <span className="text-red-400 italic">Non Assegnato</span>}</p></div></div>
                             <div className="grid grid-cols-2 gap-2 mb-3"><div className="bg-blue-50 p-2 rounded text-center border border-blue-100"><span className="block text-xl font-bold text-blue-800">{r.user_count || 0}</span><span className="text-[9px] uppercase font-bold text-blue-500">Utenti Reg.</span></div><div className="bg-purple-50 p-2 rounded text-center border border-purple-100"><span className="block text-xl font-bold text-purple-800">{r.total_ai_usage || 0}</span><span className="text-[9px] uppercase font-bold text-purple-500">Usi AI Tot.</span></div></div>
                             {r.menu_analysis && <button onClick={() => setViewingReport(r.menu_analysis!)} className="mb-3 w-full py-2 bg-emerald-50 text-emerald-700 text-xs font-black uppercase tracking-widest rounded-lg border border-emerald-100 flex items-center justify-center gap-2 hover:bg-emerald-100 transition-all"><ShieldCheckIcon className="w-4 h-4" filled />Visualizza Report IA</button>}
                             <div className="bg-gray-50 p-2 rounded border border-gray-100 flex gap-4 items-center mt-auto"><img src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(generateQrUrl(r.slug))}`} className="w-16 h-16" /><div><p className="text-[10px] text-gray-400 uppercase">QR Code</p><a href={generateQrUrl(r.slug)} target="_blank" className="text-xs text-wine-600 truncate block hover:underline font-medium">{r.slug}</a></div></div>
                         </div>
                     ))}
                 </div>
             </div>
         )}
      </div>

      {viewingReport && (
          <div className="fixed inset-0 z-[300] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
               <div className="bg-white w-full max-w-2xl h-[85vh] rounded-[2rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95">
                   <div className="bg-emerald-600 p-6 text-white flex justify-between items-center"><h3 className="font-serif font-black text-xl">Report Strategico</h3><button onClick={() => setViewingReport(null)} className="text-white/70 hover:text-white">✕</button></div>
                   <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        <div className="flex justify-between items-center bg-stone-50 p-4 rounded-2xl border border-stone-100">
                            <div><p className="text-xs font-black uppercase text-gray-400 tracking-widest">Punteggio</p><p className="text-4xl font-black text-emerald-600">{Math.round(viewingReport.score)}/100</p></div>
                            <div className="text-right"><p className="text-xs font-bold text-gray-400">Generato il</p><p className="text-sm font-medium">{new Date(viewingReport.generatedAt).toLocaleDateString()}</p></div>
                        </div>
                        <p className="text-lg italic text-gray-800 leading-relaxed border-l-4 border-emerald-500 pl-4">"{viewingReport.summary}"</p>
                        <div className="grid md:grid-cols-2 gap-4"><div className="bg-green-50 p-4 rounded-2xl border border-green-100"><h4 className="text-xs font-black text-green-700 uppercase mb-3">Forza</h4><ul className="space-y-2 text-xs text-green-800">{viewingReport.strengths.map((s, i) => <li key={i}>✓ {s}</li>)}</ul></div><div className="bg-red-50 p-4 rounded-2xl border border-red-100"><h4 className="text-xs font-black text-red-700 uppercase mb-3">Miglioramento</h4><ul className="space-y-2 text-xs text-red-800">{viewingReport.weaknesses.map((w, i) => <li key={i}>⚠ {w}</li>)}</ul></div></div>
                        <div className="bg-indigo-900 p-6 rounded-2xl text-white shadow-lg"><h4 className="text-xs font-black uppercase text-indigo-300 mb-2 flex items-center gap-2"><StarIcon className="w-4 h-4" filled /> Consiglio Strategico</h4><p className="text-sm italic leading-relaxed">"{viewingReport.strategicAdvice}"</p></div>
                   </div>
                   <div className="p-4 bg-gray-50 border-t border-gray-100"><button onClick={() => setViewingReport(null)} className="w-full py-3 bg-white border border-gray-200 rounded-xl font-bold text-sm text-gray-600">Chiudi</button></div>
               </div>
          </div>
      )}

      {resetModalUser && (
          <div className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-xl animate-in zoom-in-95">
                  <h3 className="font-bold text-lg mb-2">Reset Password</h3><p className="text-sm text-gray-600 mb-4">Per <strong>{resetModalUser.email}</strong></p>
                  <form onSubmit={handleResetPassword}><input type="text" placeholder="Nuova Password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg mb-4" autoFocus />
                      <div className="flex gap-3"><button type="button" onClick={() => { setResetModalUser(null); setNewPassword(''); }} className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg font-bold">Annulla</button><button type="submit" disabled={!newPassword} className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50">Salva</button></div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};

export default AdminView;
