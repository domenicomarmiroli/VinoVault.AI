
import React, { useState } from 'react';
import { Location } from '../types';
import { TrashIcon, PlusIcon } from './Icons';

interface LocationManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  locations: Location[];
  onAddLocation: (name: string) => void;
  onDeleteLocation: (id: string) => void;
}

const LocationManagerModal: React.FC<LocationManagerModalProps> = ({ 
    isOpen, onClose, locations, onAddLocation, onDeleteLocation 
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
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="font-serif font-bold text-lg text-gray-900">Gestisci Posizioni</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
                </div>

                <div className="p-4">
                    <form onSubmit={handleSubmit} className="flex gap-2 mb-6">
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

                    <div className="space-y-2 max-h-60 overflow-y-auto">
                        {locations.length === 0 ? (
                             <p className="text-center text-xs text-gray-400 italic py-4">Nessuna posizione configurata</p>
                        ) : (
                            locations.map(loc => (
                                <div key={loc.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100 group">
                                    <span className="text-sm font-medium text-gray-700">{loc.name}</span>
                                    <button 
                                        onClick={() => {
                                            if(confirm(`Eliminare ${loc.name}?`)) onDeleteLocation(loc.id);
                                        }}
                                        className="text-gray-400 hover:text-red-500 p-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LocationManagerModal;
