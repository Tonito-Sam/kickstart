export async function copyToClipboard(text: string) {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (e) {
    // fall through
  }
  // fallback
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.left = '-9999px';
  document.body.appendChild(ta);
  ta.select();
  try {
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch (e) {
    document.body.removeChild(ta);
    return false;
  }
}

export function downloadVCard(phone: string, name: string) {
  const phoneDigits = phone.replace(/[^0-9+]/g, '');
  const vcard = `BEGIN:VCARD\nVERSION:3.0\nFN:${name}\nTEL;TYPE=CELL:${phoneDigits}\nEND:VCARD`;
  const blob = new Blob([vcard], { type: 'text/vcard' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${name.replace(/\s+/g, '_')}.vcf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function openWhatsApp(phone: string, plainMessage: string) {
  // returns { opened, copied }
  const isMobile = /Mobi|Android/i.test(navigator.userAgent);
  const phoneDigits = phone.replace(/[^0-9]/g, '');
  const encoded = encodeURIComponent(plainMessage);

  // Try native on mobile
  if (isMobile) {
    try {
      window.location.href = `whatsapp://send?phone=${phoneDigits}&text=${encoded}`;
      // can't reliably detect success on mobile; assume opened
      return { opened: true, copied: false };
    } catch (e) {
      // continue to web attempt
    }
  }

  // Try web on desktop
  try {
    const w = window.open(`https://web.whatsapp.com/send?phone=${phoneDigits}&text=${encoded}`, '_blank');
    if (w) {
      // best effort copy so user can paste
      const copied = await copyToClipboard(plainMessage).catch(() => false);
      return { opened: true, copied };
    }
  } catch (e) {
    // fallback
  }

  // fallback: copy to clipboard
  const copied = await copyToClipboard(plainMessage).catch(() => false);
  return { opened: false, copied };
}
