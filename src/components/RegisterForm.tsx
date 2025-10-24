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
      // Use Vite runtime env for API base so the frontend can call the live server
      // when deployed elsewhere (e.g. https://kickstartevents.co.za).
      const API_BASE = (import.meta as any).env?.VITE_API_BASE || '';
      // Open windows synchronously as part of the click user-gesture so browsers
      // are less likely to block them. We'll navigate them once we have the
      // server ticket URL and a constructed WhatsApp URL.
      const ticketWin = window.open('', '_blank');
      const whatsappWin = window.open('', '_blank');

      const url = `${API_BASE.replace(/\/$/, '')}/register`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || 'Registration failed');
      setTicketUrl(body.ticketUrl || null);
      if (onSuccess && body.ticketUrl) onSuccess(body.ticketUrl);

      // build message for WhatsApp
  const eventTitle = (import.meta as any).env?.VITE_EVENT_TITLE || 'Kickstart 2026';
  const plain = `Hi, I registered for ${eventTitle}\nName: ${form.fullname}\nEmail: ${form.email}\nPhone: ${form.phone}\nSector: ${form.sector || '-'}\nRole: ${form.role || '-' }\nTicket: ${body.ticketUrl || ''}`;

      // organiser phone
      const organiser = (window as any).__KICKSTART_ORGANISER_PHONE || '+27615266887';
      const phoneDigits = organiser.replace(/[^0-9]/g, '');
      const encoded = encodeURIComponent(plain);
      const isMobile = /Mobi|Android/i.test(navigator.userAgent);
      const whatsappUrl = isMobile
        ? `whatsapp://send?phone=${phoneDigits}&text=${encoded}`
        : `https://web.whatsapp.com/send?phone=${phoneDigits}&text=${encoded}`;

      // Navigate WhatsApp window immediately (should succeed because it was
      // opened synchronously on the click). If it failed to open, fallback
      // will copy the message to clipboard.
      try {
        if (whatsappWin) {
          whatsappWin.location.href = whatsappUrl;
          whatsappWin.focus();
        } else {
          // If the window popup was blocked, try to open normally (this will
          // probably be blocked too, but we attempt it as a best effort).
          window.open(whatsappUrl, '_blank');
        }
      } catch (e) {
        // ignore
      }

      // Copy message to clipboard as a fallback if WhatsApp fails to open
      const copied = await copyToClipboard(plain).catch(() => false);
      if (!copied) {
        // If copy also fails, user will have to paste manually.
        // We'll still navigate the ticket below.
      }

      // Navigate to the ticket PDF after a short delay so the WhatsApp window
      // has time to load and the browser doesn't consider both popups abusive.
      const TICKET_NAV_DELAY_MS = 700;
      if (body.ticketUrl) {
        setTimeout(() => {
          try {
            if (ticketWin) {
              ticketWin.location.href = body.ticketUrl;
              ticketWin.focus();
            } else {
              window.open(body.ticketUrl, '_blank');
            }
          } catch (e) {
            // ignore
          }
        }, TICKET_NAV_DELAY_MS);
      } else {
        // no ticket, close the placeholder window if it exists
        try { ticketWin?.close(); } catch (e) { /* ignore */ }
      }

      if (!copied) {
        alert('Message could not be copied to clipboard. If WhatsApp did not open, paste the message manually.');
      } else {
        // optionally inform user that both windows were opened
        // keep this unobtrusive
        console.info('WhatsApp opened and message copied to clipboard. Ticket will open in a new tab.');
      }

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
