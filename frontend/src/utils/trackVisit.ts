export const trackVisit = async () => {
  try {
    const API_BASE = import.meta.env.VITE_API_BASE || "";
    await fetch(`${API_BASE}/api/track-visit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        page_url: window.location.pathname,
        referrer: document.referrer
      })
    });
  } catch (err) {
    console.error('Visit tracking failed:', err);
  }
};