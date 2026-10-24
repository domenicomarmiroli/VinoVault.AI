import { CellarValueHistory, CellarRevaluationResult } from '../types';

const authHeaders = () => {
    const token = localStorage.getItem('vinovault_token');
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
};

export const getCellarValueHistory = async (): Promise<CellarValueHistory> => {
    const res = await fetch('/api/cellar-value-history', { headers: authHeaders() });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Errore caricamento storico valore' }));
        throw new Error(err.error || 'Errore caricamento storico valore');
    }
    return res.json();
};

export const revalueCellar = async (): Promise<CellarRevaluationResult> => {
    const res = await fetch('/api/wines/revalue', { method: 'POST', headers: authHeaders() });
    const data = await res.json().catch(() => ({ error: 'Errore ricalcolo valore cantina' }));
    if (!res.ok) {
        const error: any = new Error(data.error || 'Errore ricalcolo valore cantina');
        error.nextAvailableAt = data.nextAvailableAt;
        throw error;
    }
    return data;
};
