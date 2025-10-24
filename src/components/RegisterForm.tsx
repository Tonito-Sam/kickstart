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
  // Detect mobile early so we can choose a device-friendly flow.
  const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent || '');

  // On desktop we open blanks synchronously (browsers tolerate multiple
  // windows/tabs opened from a click). On mobile we avoid multiple popups
  // because mobile browsers often block or merge them — instead we'll
  // prefer the native share sheet or navigate the current tab to WhatsApp.
  const ticketWin = isMobile ? null : window.open('', '_blank');
  const whatsappWin = isMobile ? null : window.open('', '_blank');

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
      const whatsappUrl = isMobile
        ? `https://wa.me/${phoneDigits}?text=${encoded}`
        : `https://web.whatsapp.com/send?phone=${phoneDigits}&text=${encoded}`;

      // Device-aware flow:
      if (isMobile) {
        // 1) Prefer the Web Share API (opens native share sheet where WhatsApp
        //    will be an option). This is the best UX on mobile.
        if ((navigator as any).share) {
          try {
            await (navigator as any).share({ title: eventTitle, text: plain, url: body.ticketUrl });
            // Shared successfully (or user cancelled) — stop here.
            return;
          } catch (e) {
            // share failed or was cancelled; fall through to fallback behavior
          }
        }

        // 2) Fallback: try to open the ticket in a new tab (anchor click) and
        //    then navigate the current tab to the WhatsApp URL so the OS opens
        //    the WhatsApp app. We do this synchronously (no awaits) to reduce
        //    the chance of pop-up blocking.
        try {
          if (body.ticketUrl) {
            const a = document.createElement('a');
            a.href = body.ticketUrl;
            a.target = '_blank';
            // optional 'rel' omitted intentionally to allow app handoff on some mobile UAs
            document.body.appendChild(a);
            a.click();
            a.remove();
          }
        } catch (e) {
          // ignore anchor failure
        }

        // Navigate current tab to WhatsApp (this will open the app on many devices)
        try {
          window.location.href = whatsappUrl;
        } catch (e) {
          // if navigation fails, attempt to copy the message to clipboard
          const copied = await copyToClipboard(plain).catch(() => false);
          if (!copied) alert('Could not open WhatsApp. The message was not copied either; please send manually.');
        }
      } else {
        // Desktop flow: we opened placeholder windows earlier; navigate them
        // now that we have URLs. Also copy to clipboard as fallback.
        try {
          if (whatsappWin) {
            whatsappWin.location.href = whatsappUrl;
            whatsappWin.focus();
          } else {
            window.open(whatsappUrl, '_blank');
          }
        } catch (e) { /* ignore */ }

        const copied = await copyToClipboard(plain).catch(() => false);

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
            } catch (e) { /* ignore */ }
          }, TICKET_NAV_DELAY_MS);
        } else {
          try { ticketWin?.close(); } catch (e) { /* ignore */ }
        }

        if (!copied) {
          alert('Message could not be copied to clipboard. If WhatsApp did not open, paste the message manually.');
        } else {
          console.info('WhatsApp opened and message copied to clipboard. Ticket will open in a new tab.');
        }
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
