// Abbonamento Premium: il pagamento avviene sulle pagine di Stripe, l'app riceve l'esito via webhook.
export interface BillingPlan {
  id: 'monthly' | 'yearly';
  amount: number;
  currency: string;
  interval: string | null;
}

export interface BillingConfig {
  enabled: boolean;
  plans: BillingPlan[];
}

const authHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('vinovault_token');
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
};

let configPromise: Promise<BillingConfig> | null = null;

export const getBillingConfig = (): Promise<BillingConfig> => {
  if (!configPromise) {
    configPromise = fetch('/api/billing/config', { headers: authHeaders() })
      .then(res => (res.ok ? res.json() : { enabled: false, plans: [] }))
      .catch(() => ({ enabled: false, plans: [] }));
  }
  return configPromise;
};

const redirectTo = async (path: string, body?: object) => {
  const res = await fetch(path, { method: 'POST', headers: authHeaders(), body: body ? JSON.stringify(body) : undefined });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.url) throw new Error(data.error || 'Pagamento non disponibile');
  window.location.href = data.url;
};

export const startCheckout = (plan: BillingPlan['id']) => redirectTo('/api/billing/checkout', { plan });
export const openBillingPortal = () => redirectTo('/api/billing/portal');

export const formatPrice = (plan: BillingPlan, language: string) =>
  new Intl.NumberFormat(language, { style: 'currency', currency: plan.currency.toUpperCase() }).format(plan.amount);
