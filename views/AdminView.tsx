
import React, { useState, useEffect } from 'react';
import { User, Restaurant } from '../types';
import { ShieldCheckIcon, LogoutIcon, TrashIcon, RestaurantIcon } from '../components/Icons';

interface AdminViewProps {
  onLogout: () => void;
  token: string;
}

const AdminView: React.FC<AdminViewProps> = ({ onLogout, token }) => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(false);
  const [newOwnerEmail, setNewOwnerEmail] = useState<Record<string, string>>({});

  const fetchData = async () => {
      setLoading(true);
      const res = await fetch('/api/admin/restaurants', { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) setRestaurants(await res.json());
      setLoading(false);
  };

  useEffect(() => { fetchData(); }, [token]);

  const handleAssignOwner = async (restaurantId: string) => {
      const email = newOwnerEmail[restaurantId];
      if (!email) return;
      const res = await fetch(`/api/admin/restaurants/${restaurantId}/owner`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ ownerEmail: email })
      });
      if (res.ok) {
          alert("Gestore associato con successo!");
          fetchData();
      } else {
          const err = await res.json();
          alert(err.error || "Errore associazione");
      }
  };

  return (
    <div className="h-full flex flex-col bg-stone-50 overflow-hidden">
      <div className="bg-white border-b border-gray-200 p-6 shadow-sm flex justify-between items-center">
        <h1 className="text-xl font-serif font-bold text-gray-900 flex items-center gap-2">
            <ShieldCheckIcon className="w-6 h-6 text-wine-600" filled /> Admin Backoffice
        </h1>
        <button onClick={onLogout} className="text-gray-400 p-2"><LogoutIcon className="w-6 h-6" /></button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <h2 className="text-sm font-black uppercase text-gray-400 tracking-widest px-2">Gestione Ristoranti & Utenti</h2>
          {restaurants.map(r => (
              <div key={r.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                      <div>
                          <h3 className="font-bold text-gray-900">{r.name}</h3>
                          <p className="text-xs text-gray-500 font-mono">slug: {r.slug}</p>
                      </div>
                      <div className="text-right">
                          <span className="text-[10px] font-bold text-wine-600 bg-wine-50 px-2 py-0.5 rounded">Clienti: {r.user_count}</span>
                      </div>
                  </div>

                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Associa Gestore (Email Utente)</label>
                      {r.owner_id ? (
                          <div className="flex justify-between items-center">
                              <span className="text-sm font-medium text-green-700">✓ {r.owner_email}</span>
                              <button onClick={() => {
                                  setNewOwnerEmail({ ...newOwnerEmail, [r.id]: '' });
                                  handleAssignOwner(r.id);
                              }} className="text-[10px] text-red-500 font-bold uppercase">Rimuovi</button>
                          </div>
                      ) : (
                          <div className="flex gap-2">
                              <input 
                                type="email" 
                                placeholder="email@utente.it"
                                value={newOwnerEmail[r.id] || ''}
                                onChange={e => setNewOwnerEmail({ ...newOwnerEmail, [r.id]: e.target.value })}
                                className="flex-1 text-sm p-2 border border-gray-200 rounded-lg outline-none"
                              />
                              <button 
                                onClick={() => handleAssignOwner(r.id)}
                                className="bg-wine-600 text-white px-3 py-2 rounded-lg text-xs font-bold"
                              >
                                Collega
                              </button>
                          </div>
                      )}
                  </div>
              </div>
          ))}
      </div>
    </div>
  );
};

export default AdminView;
