import React, { useState } from 'react';
import { downloadVCard, copyToClipboard } from '../lib/whatsapp';

type FormState = {
  fullname: string;
  email: string;
  phone: string;
  sector: string;
  role: string;
};

export default function RegisterForm({ onSuccess }: { onSuccess?: (ticketUrl: string) => void }) {
  const [form, setForm] = useState<FormState>({ fullname: '', email: '', phone: '', sector: '', role: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ticketUrl, setTicketUrl] = useState<string | null>(null);

  function update<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm(prev => ({ ...prev, [k]: v }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.fullname || !form.email || !form.phone) {
      setError('Please fill name, email and phone');
      return;
    }
    setLoading(true);
    try {
      const PHP_BASE = (import.meta as any).env?.VITE_PHP_API_BASE || '/server';
      const url = `${PHP_BASE.replace(/\/$/, '')}/register.php`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || 'Registration failed');
      setTicketUrl(null);
      alert('Registration complete — ticket will be emailed to you shortly.');
      if (onSuccess) onSuccess('');
    } catch (err: any) {
      setError(String(err.message || err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3 max-w-md">
      {error && <div className="text-red-600">{error}</div>}
      <div>
        <label className="block text-sm">Full name</label>
        <input value={form.fullname} onChange={e => update('fullname', e.target.value)} className="w-full" />
      </div>
      <div>
        <label className="block text-sm">Email</label>
        <input value={form.email} onChange={e => update('email', e.target.value)} className="w-full" />
      </div>
      <div>
        <label className="block text-sm">Phone (include country code)</label>
        <input value={form.phone} onChange={e => update('phone', e.target.value)} className="w-full" />
      </div>
      <div>
        <label className="block text-sm">Sector</label>
        <input value={form.sector} onChange={e => update('sector', e.target.value)} className="w-full" />
      </div>
      <div>
        <label className="block text-sm">Role</label>
        <input value={form.role} onChange={e => update('role', e.target.value)} className="w-full" />
      </div>

      <div className="flex items-center gap-2">
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Registering…' : 'Register & Send to WhatsApp'}
        </button>
        <button type="button" onClick={() => downloadVCard(form.phone || '+27615266887', 'Kickstart Organizer')} className="btn-outline">
          Save organizer contact
        </button>
      </div>

      {ticketUrl && (
        <div className="mt-2">
          <a href={ticketUrl} target="_blank" rel="noreferrer" className="underline">Open ticket</a>
        </div>
      )}
    </form>
  );
}
