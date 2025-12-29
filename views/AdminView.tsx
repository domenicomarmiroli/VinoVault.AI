
import React, { useState, useEffect, useRef } from 'react';
import { User, Restaurant } from '../types';
import { ShieldCheckIcon, LogoutIcon, TrashIcon, WineIcon, ChartBarIcon, RestaurantIcon, CameraIcon } from '../components/Icons';
import { extractTextFromMedia } from '../services/geminiService';

interface AdminViewProps {
  onLogout: () => void;
  token: string;
}

const AdminView: React.FC<AdminViewProps> = ({ onLogout, token }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'users' | 'restaurants'>('users');

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

  const handleDeleteUser = async (id: string) => {
      if (!confirm("Eliminare definitivamente?")) return;
      try {
          const res = await fetch(`${API_BASE}/api/users/${id}`, {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) setUsers(prev => prev.filter(u => u.id !== id));
      } catch (e) { alert("Errore"); }
  };

  const handleToggleRole = async (user: User) => {
      const newRole = user.role === 'restaurant' ? 'user' : 'restaurant';
      if (!confirm(`Cambiare il ruolo di ${user.email} in ${newRole.toUpperCase()}?`)) return;
      
      try {
          const res = await fetch(`${API_BASE}/api/users/${user.id}/role`, {
              method: 'PUT',
              headers: { 
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}` 
              },
              body: JSON.stringify({ role: newRole })
          });
          if (res.ok) {
              setUsers(prev => prev.map(u => u.id === user.id ? { ...u, role: newRole } : u));
          }
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

  return (
    <div className="h-full flex flex-col bg-stone-50 overflow-hidden">
      <div className="bg-white border-b border-gray-200 p-6 shadow-sm z-10 flex justify-between items-start">
        <h1 className="text-2xl font-serif font-bold text-gray-900 flex items-center gap-2">
            <ShieldCheckIcon className="w-8 h-8 text-wine-600" filled />
            Admin Backoffice
        </h1>
        <button onClick={onLogout} className="text-gray-400 hover:text-wine-700 p-2"><LogoutIcon className="w-6 h-6" /></button>
      </div>

      <div className="flex border-b border-gray-200 bg-white">
          <button onClick={() => setActiveTab('users')} className={`flex-1 py-3 font-bold text-sm ${activeTab === 'users' ? 'border-b-2 border-wine-600 text-wine-700' : 'text-gray-500'}`}>Utenti ({users.length})</button>
          <button onClick={() => setActiveTab('restaurants')} className={`flex-1 py-3 font-bold text-sm ${activeTab === 'restaurants' ? 'border-b-2 border-wine-600 text-wine-700' : 'text-gray-500'}`}>Ristoranti ({restaurants.length})</button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-24">
         {activeTab === 'users' && (
             <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                 <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between">
                     <h3 className="font-bold text-gray-700">Gestione Utenti</h3>
                     <button onClick={fetchData} className="text-xs text-wine-600 font-bold">Aggiorna</button>
                 </div>
                 <div className="overflow-x-auto">
                     <table className="w-full text-left text-sm">
                         <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-xs">
                             <tr>
                                 <th className="p-3">Email</th>
                                 <th className="p-3">Ruolo</th>
                                 <th className="p-3 text-center">Premium</th>
                                 <th className="p-3 text-right">Azioni</th>
                             </tr>
                         </thead>
                         <tbody className="divide-y divide-gray-100">
                             {users.map(user => (
                                 <tr key={user.id} className="hover:bg-gray-50">
                                     <td className="p-3 font-medium">{user.email}</td>
                                     <td className="p-3">
                                         <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${user.role === 'restaurant' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                             {user.role}
                                         </span>
                                     </td>
                                     <td className="p-3 text-center">
                                         {user.is_premium ? '💎' : '⚪'}
                                     </td>
                                     <td className="p-3 text-right flex gap-2 justify-end">
                                         <button onClick={() => handleToggleRole(user)} className="text-[10px] font-bold border border-gray-200 px-2 py-1 rounded bg-white" title="Promuovi a Ristorante">
                                             {user.role === 'restaurant' ? 'Riduci a User' : 'Fai Ristorante'}
                                         </button>
                                         <button onClick={() => handleTogglePremium(user.id)} className="p-1">💎</button>
                                         <button onClick={() => handleDeleteUser(user.id)} className="text-red-500 p-1"><TrashIcon className="w-4 h-4" /></button>
                                     </td>
                                 </tr>
                             ))}
                         </tbody>
                     </table>
                 </div>
             </div>
         )}
         {activeTab === 'restaurants' && (
             <div className="space-y-4">
                 {restaurants.map(r => (
                     <div key={r.id} className="bg-white p-4 rounded-xl border border-gray-200 flex justify-between items-center">
                         <div>
                             <h4 className="font-bold">{r.name}</h4>
                             <p className="text-xs text-gray-500 font-mono">slug: {r.slug}</p>
                         </div>
                         <div className="text-right">
                             <p className="text-[10px] font-bold text-gray-400 uppercase">Clienti: {r.user_count}</p>
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
