
import React, { useState, useEffect } from 'react';
import { User, Restaurant } from '../types';
import { ShieldCheckIcon, LogoutIcon, TrashIcon, UserIcon, RestaurantIcon, PlusIcon } from '../components/Icons';

interface AdminViewProps {
  onLogout: () => void;
  token: string;
}

const AdminView: React.FC<AdminViewProps> = ({ onLogout, token }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'users' | 'restaurants'>('users');
  const [newOwnerEmail, setNewOwnerEmail] = useState<Record<string, string>>({});
  const [showAddRestaurant, setShowAddRestaurant] = useState(false);
  const [newRest, setNewRest] = useState({ name: '', slug: '' });

  const fetchData = async () => {
      setLoading(true);
      try {
          const [uRes, rRes] = await Promise.all([
              fetch('/api/admin/users', { headers: { 'Authorization': `Bearer ${token}` } }),
              fetch('/api/admin/restaurants', { headers: { 'Authorization': `Bearer ${token}` } })
          ]);
          if (uRes.ok) setUsers(await uRes.json());
          if (rRes.ok) setRestaurants(await rRes.json());
      } catch (e) { console.error(e); }
      setLoading(false);
  };

  useEffect(() => { fetchData(); }, [token]);

  const handleTogglePremium = async (userId: string, current: boolean) => {
      await fetch(`/api/admin/users/${userId}/premium`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ isPremium: !current })
      });
      fetchData();
  };

  const handleAssignOwner = async (restaurantId: string) => {
      const email = newOwnerEmail[restaurantId];
      if (!email) return;
      const res = await fetch(`/api/admin/restaurants/${restaurantId}/owner`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ ownerEmail: email })
      });
      if (res.ok) {
          alert("Gestore collegato!");
          fetchData();
      } else {
          alert("Errore: Utente non trovato.");
      }
  };

  const handleCreateRestaurant = async () => {
      if (!newRest.name || !newRest.slug) return;
      await fetch('/api/admin/restaurants', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(newRest)
      });
      setShowAddRestaurant(false);
      setNewRest({ name: '', slug: '' });
      fetchData();
  };

  const handleDeleteUser = async (id: string) => {
      if (!confirm("Eliminare utente e tutti i suoi vini?")) return;
      await fetch(`/api/admin/users/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchData();
  };

  return (
    <div className="h-full flex flex-col bg-stone-50 overflow-hidden">
      <div className="bg-white border-b border-gray-200 p-6 shadow-sm flex justify-between items-center">
        <h1 className="text-xl font-serif font-bold text-gray-900 flex items-center gap-2">
            <ShieldCheckIcon className="w-6 h-6 text-wine-600" filled /> Backoffice
        </h1>
        <button onClick={onLogout} className="text-gray-400 p-2 hover:text-wine-600"><LogoutIcon className="w-6 h-6" /></button>
      </div>

      <div className="flex border-b border-gray-200 bg-white">
          <button 
            onClick={() => setActiveTab('users')}
            className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider transition-all ${activeTab === 'users' ? 'text-wine-600 border-b-2 border-wine-600' : 'text-gray-400'}`}
          >
            Utenti ({users.length})
          </button>
          <button 
            onClick={() => setActiveTab('restaurants')}
            className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider transition-all ${activeTab === 'restaurants' ? 'text-wine-600 border-b-2 border-wine-600' : 'text-gray-400'}`}
          >
            Ristoranti ({restaurants.length})
          </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-20">
          {activeTab === 'users' ? (
              <div className="space-y-3">
                  {users.map(u => (
                      <div key={u.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex justify-between items-center">
                          <div className="min-w-0 flex-1">
                              <p className="font-bold text-gray-900 truncate">{u.email}</p>
                              <div className="flex gap-2 mt-1">
                                  <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${u.role === 'admin' ? 'bg-red-100 text-red-700' : u.role === 'restaurant' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{u.role}</span>
                                  {u.is_premium && <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">💎 Premium</span>}
                              </div>
                          </div>
                          <div className="flex gap-2 ml-4">
                              <button 
                                onClick={() => handleTogglePremium(u.id, u.is_premium || false)}
                                className={`p-2 rounded-lg border transition-all ${u.is_premium ? 'bg-amber-50 border-amber-200 text-amber-600' : 'bg-white border-gray-200 text-gray-400'}`}
                                title="Toggle Premium"
                              >💎</button>
                              <button onClick={() => handleDeleteUser(u.id)} className="p-2 bg-red-50 text-red-500 rounded-lg border border-red-100"><TrashIcon className="w-4 h-4" /></button>
                          </div>
                      </div>
                  ))}
              </div>
          ) : (
              <div className="space-y-4">
                  <button 
                    onClick={() => setShowAddRestaurant(true)}
                    className="w-full py-3 bg-wine-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg"
                  >
                    <PlusIcon className="w-5 h-5" /> Aggiungi Ristorante
                  </button>

                  {showAddRestaurant && (
                      <div className="bg-white p-4 rounded-xl border-2 border-wine-100 space-y-3 animate-in slide-in-from-top">
                          <input type="text" placeholder="Nome Ristorante" value={newRest.name} onChange={e => setNewRest({...newRest, name: e.target.value})} className="w-full p-2 border rounded-lg text-sm" />
                          <input type="text" placeholder="slug-unico" value={newRest.slug} onChange={e => setNewRest({...newRest, slug: e.target.value})} className="w-full p-2 border rounded-lg text-sm font-mono" />
                          <div className="flex gap-2">
                              <button onClick={() => setShowAddRestaurant(false)} className="flex-1 py-2 text-xs font-bold text-gray-500">Annulla</button>
                              <button onClick={handleCreateRestaurant} className="flex-1 py-2 bg-wine-700 text-white rounded-lg text-xs font-bold">Crea</button>
                          </div>
                      </div>
                  )}

                  {restaurants.map(r => (
                      <div key={r.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-4">
                          <div className="flex justify-between items-start">
                              <div>
                                  <h3 className="font-bold text-gray-900">{r.name}</h3>
                                  <p className="text-[10px] text-gray-400 font-mono">/{r.slug}</p>
                              </div>
                              <div className="text-right">
                                  <span className="text-[10px] font-black text-wine-600 bg-wine-50 px-2 py-0.5 rounded tracking-widest uppercase">Clienti: {r.user_count}</span>
                              </div>
                          </div>

                          <div className="bg-stone-50 p-3 rounded-lg border border-stone-100">
                              <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Gestore (Email)</label>
                              {r.owner_id ? (
                                  <div className="flex justify-between items-center">
                                      <span className="text-sm font-medium text-green-700">✓ {r.owner_email}</span>
                                      <button onClick={() => {
                                          setNewOwnerEmail({ ...newOwnerEmail, [r.id]: '' });
                                          handleAssignOwner(r.id);
                                      }} className="text-[10px] text-red-500 font-bold uppercase hover:underline">Cambia</button>
                                  </div>
                              ) : (
                                  <div className="flex gap-2">
                                      <input 
                                        type="email" 
                                        placeholder="email@utente.it"
                                        value={newOwnerEmail[r.id] || ''}
                                        onChange={e => setNewOwnerEmail({ ...newOwnerEmail, [r.id]: e.target.value })}
                                        className="flex-1 text-sm p-2 border border-gray-200 rounded-lg outline-none bg-white"
                                      />
                                      <button onClick={() => handleAssignOwner(r.id)} className="bg-wine-600 text-white px-3 py-2 rounded-lg text-xs font-bold">Collega</button>
                                  </div>
                              )}
                          </div>
                      </div>
                  ))}
              </div>
          )}
      </div>
    </div>
  );
};

export default AdminView;
