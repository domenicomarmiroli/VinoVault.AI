import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { ShieldCheckIcon, LogoutIcon, TrashIcon, WineIcon, ChartBarIcon } from '../components/Icons';

interface AdminViewProps {
  onLogout: () => void;
  token: string;
}

const AdminView: React.FC<AdminViewProps> = ({ onLogout, token }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [resetModalUser, setResetModalUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');

  const API_BASE = ''; 

  const fetchUsers = async () => {
      setLoading(true);
      try {
          const res = await fetch(`${API_BASE}/api/users`, {
              headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
              const data = await res.json();
              setUsers(data);
          }
      } catch (e) {
          console.error("Failed to fetch users", e);
      } finally {
          setLoading(false);
      }
  };

  useEffect(() => {
      fetchUsers();
  }, [token]);

  const handleDeleteUser = async (id: string) => {
      if (!confirm("Sei sicuro di voler eliminare questo utente e tutti i suoi dati? Questa azione è irreversibile.")) return;
      try {
          const res = await fetch(`${API_BASE}/api/users/${id}`, {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
              setUsers(prev => prev.filter(u => u.id !== id));
          } else {
              alert("Errore durante l'eliminazione");
          }
      } catch (e) {
          alert("Errore di connessione");
      }
  };

  const handleTogglePremium = async (id: string) => {
      try {
          const res = await fetch(`${API_BASE}/api/users/${id}/premium`, {
              method: 'PUT',
              headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
              setUsers(prev => prev.map(u => 
                  u.id === id ? { ...u, is_premium: !u.is_premium } : u
              ));
          } else {
              alert("Errore cambio stato premium");
          }
      } catch (e) {
          alert("Errore di connessione");
      }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!resetModalUser || !newPassword) return;

      try {
          const res = await fetch(`${API_BASE}/api/users/${resetModalUser.id}/reset-password`, {
              method: 'PUT',
              headers: { 
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}` 
              },
              body: JSON.stringify({ newPassword })
          });
          if (res.ok) {
              alert(`Password aggiornata per ${resetModalUser.email}`);
              setResetModalUser(null);
              setNewPassword('');
          } else {
              alert("Errore durante il reset della password");
          }
      } catch (e) {
          alert("Errore di connessione");
      }
  };

  // Stats Calculations
  const totalUsers = users.length;
  const totalWines = users.reduce((acc, u) => acc + (parseInt(u.wine_count as any) || 0), 0);
  const totalAiRequests = users.reduce((acc, u) => acc + (u.ai_usage_count || 0), 0);

  return (
    <div className="h-full flex flex-col bg-stone-50 overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-6 shadow-sm z-10 flex justify-between items-start">
        <div>
            <h1 className="text-2xl font-serif font-bold text-gray-900 flex items-center gap-2">
                <ShieldCheckIcon className="w-8 h-8 text-wine-600" filled />
                Admin Backoffice
            </h1>
            <p className="text-sm text-gray-500 mt-1">
                Gestione utenti e manutenzione.
            </p>
        </div>
        <button onClick={onLogout} className="text-gray-400 hover:text-wine-700 p-2">
            <LogoutIcon className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-24 space-y-6">
         
         {/* Stats Cards */}
         <div className="grid grid-cols-3 gap-4">
             <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 text-center">
                 <span className="block text-3xl font-bold text-gray-900">{totalUsers}</span>
                 <span className="text-xs text-gray-500 font-bold uppercase">Utenti</span>
             </div>
             <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 text-center">
                 <span className="block text-3xl font-bold text-wine-700">{totalWines}</span>
                 <span className="text-xs text-gray-500 font-bold uppercase">Bottiglie</span>
             </div>
             <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 text-center">
                 <span className="block text-3xl font-bold text-blue-600">{totalAiRequests}</span>
                 <span className="text-xs text-gray-500 font-bold uppercase">Richieste AI</span>
             </div>
         </div>

         {/* Users Table */}
         <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
             <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                 <h3 className="font-bold text-gray-700">Utenti Registrati</h3>
                 <button onClick={fetchUsers} className="text-wine-600 text-sm font-bold hover:underline">Aggiorna</button>
             </div>
             
             {loading ? (
                 <div className="p-8 text-center text-gray-400 italic">Caricamento utenti...</div>
             ) : (
                 <div className="overflow-x-auto">
                     <table className="w-full text-left text-sm">
                         <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-xs">
                             <tr>
                                 <th className="p-3">Email</th>
                                 <th className="p-3 text-center">Stato</th>
                                 <th className="p-3 text-center">Vini</th>
                                 <th className="p-3 text-center">Uso AI</th>
                                 <th className="p-3">Registrato</th>
                                 <th className="p-3 text-right">Azioni</th>
                             </tr>
                         </thead>
                         <tbody className="divide-y divide-gray-100">
                             {users.map(user => (
                                 <tr key={user.id} className="hover:bg-gray-50">
                                     <td className="p-3 font-medium text-gray-900">
                                         {user.email}
                                         {user.role === 'admin' && (
                                             <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-purple-100 text-purple-700">Admin</span>
                                         )}
                                     </td>
                                     <td className="p-3 text-center">
                                         {user.is_premium ? (
                                              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 text-amber-700 border border-amber-200">Premium</span>
                                         ) : (
                                              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-gray-100 text-gray-500">Free</span>
                                         )}
                                     </td>
                                     <td className="p-3 text-center font-bold text-gray-700">
                                         {user.wine_count || 0}
                                     </td>
                                     <td className="p-3 text-center">
                                         <span className="inline-block px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold text-xs">
                                             {user.ai_usage_count || 0}
                                         </span>
                                     </td>
                                     <td className="p-3 text-gray-500 text-xs">{new Date(user.created_at || '').toLocaleDateString()}</td>
                                     <td className="p-3 text-right flex gap-2 justify-end items-center">
                                         <button 
                                            onClick={() => handleTogglePremium(user.id)}
                                            className="text-amber-600 hover:text-amber-800 text-lg p-1"
                                            title="Toggle Premium"
                                         >
                                             💎
                                         </button>
                                         <button 
                                            onClick={() => setResetModalUser(user)}
                                            className="text-blue-600 hover:text-blue-800 text-xs font-bold border border-blue-200 bg-blue-50 px-2 py-1 rounded"
                                         >
                                             Pwd
                                         </button>
                                         <button 
                                            onClick={() => handleDeleteUser(user.id)}
                                            disabled={user.role === 'admin'}
                                            className={`text-red-600 hover:text-red-800 p-1 ${user.role === 'admin' ? 'opacity-30 cursor-not-allowed' : ''}`}
                                         >
                                             <TrashIcon className="w-4 h-4" />
                                         </button>
                                     </td>
                                 </tr>
                             ))}
                         </tbody>
                     </table>
                 </div>
             )}
         </div>
      </div>

      {/* Reset Password Modal */}
      {resetModalUser && (
          <div className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-xl animate-in zoom-in-95">
                  <h3 className="font-bold text-lg mb-2">Reset Password</h3>
                  <p className="text-sm text-gray-600 mb-4">Imposta una nuova password per <strong>{resetModalUser.email}</strong></p>
                  
                  <form onSubmit={handleResetPassword}>
                      <input 
                        type="text" 
                        placeholder="Nuova Password" 
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg mb-4"
                        autoFocus
                      />
                      <div className="flex gap-3">
                          <button 
                            type="button" 
                            onClick={() => { setResetModalUser(null); setNewPassword(''); }}
                            className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg font-bold"
                          >
                              Annulla
                          </button>
                          <button 
                            type="submit" 
                            disabled={!newPassword}
                            className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50"
                          >
                              Salva
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};

export default AdminView;