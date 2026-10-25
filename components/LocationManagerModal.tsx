
import React, { useState } from 'react';
import { Location } from '../types';
import { TrashIcon, PlusIcon } from './Icons';
import { is3DLocation, layoutCapacity } from '../services/cellarLayout';

interface LocationManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  locations: Location[];
  onAddLocation: (name: string) => void;
  onDeleteLocation: (id: string) => void;
  onConfigure: (location: Location) => void;
  onOpen3D: (location: Location) => void;
}

const KIND_META: Record<string, { icon: string; label: string }> = {
  generic: { icon: '📦', label: 'Generica' },
  rack: { icon: '🪵', label: 'Scaffale' },
  fridge: { icon: '🧊', label: 'Cantinetta frigo' },
};

const LocationManagerModal: React.FC<LocationManagerModalProps> = ({
    isOpen, onClose, locations, onAddLocation, onDeleteLocation, onConfigure, onOpen3D
}) => {
    const [newLocName, setNewLocName] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newLocName.trim()) {
            onAddLocation(newLocName.trim());
            setNewLocName('');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <div>
                        <h3 className="font-serif font-bold text-lg text-gray-900">Gestisci Posizioni</h3>
                        <p className="text-[11px] text-gray-500">Configura scaffali e cantinette in 3D per ritrovare ogni bottiglia.</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
                </div>

                <div className="p-4">
                    <form onSubmit={handleSubmit} className="flex gap-2 mb-5">
                        <input
                            type="text"
                            placeholder="Nuova posizione..."
                            value={newLocName}
                            onChange={(e) => setNewLocName(e.target.value)}
                            className="flex-1 p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-wine-500 outline-none"
                        />
                        <button type="submit" className="bg-wine-600 text-white p-2 rounded-lg hover:bg-wine-700">
                            <PlusIcon className="w-5 h-5" />
                        </button>
                    </form>

                    <div className="space-y-2 max-h-[55vh] overflow-y-auto">
                        {locations.length === 0 ? (
                             <p className="text-center text-xs text-gray-400 italic py-4">Nessuna posizione configurata</p>
                        ) : (
                            locations.map(loc => {
                                const meta = KIND_META[loc.kind || 'generic'];
                                const has3D = is3DLocation(loc);
                                return (
                                    <div key={loc.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xl">{meta.icon}</span>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-bold text-gray-800 truncate">{loc.name}</p>
                                                <p className="text-[11px] text-gray-500">{meta.label}{has3D ? ` · ${layoutCapacity(loc.layout)} posti` : ''}</p>
                                            </div>
                                            <button
                                                onClick={() => { if (confirm(`Eliminare ${loc.name}?`)) onDeleteLocation(loc.id); }}
                                                className="text-gray-400 hover:text-red-500 p-1"
                                                aria-label={`Elimina ${loc.name}`}
                                            >
                                                <TrashIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <div className="flex gap-2 mt-2.5">
                                            <button onClick={() => onConfigure(loc)} className="flex-1 py-1.5 text-xs font-bold rounded-lg bg-white border border-gray-200 hover:bg-gray-100">
                                                {has3D ? 'Modifica struttura' : 'Configura in 3D'}
                                            </button>
                                            {has3D && (
                                                <button onClick={() => onOpen3D(loc)} className="flex-1 py-1.5 text-xs font-bold rounded-lg bg-wine-700 text-white hover:bg-wine-800">Apri vista 3D</button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LocationManagerModal;
