// Generate or get session ID - must persist across all routes
const getSessionId = (): string => {
  // Try to get from localStorage first
  let sessionId = localStorage.getItem('cumeyr_session_id');
  
  if (!sessionId) {
    // Generate new session ID if doesn't exist
    sessionId = 'sess_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    localStorage.setItem('cumeyr_session_id', sessionId);
    console.log('🆕 Generated new session ID:', sessionId);
  } else {
    console.log('📦 Using existing session ID:', sessionId);
  }
  
  return sessionId;
};

// Track last visit to prevent duplicate tracking of same page
let lastTrackedUrl: string | null = null;
let lastTrackedTime: number = 0;

export const trackVisit = async () => {
  try {
    const API_BASE = import.meta.env.VITE_API_BASE || "";
    if (!API_BASE) {
      console.log('⏭️ Skipping visit track - API_BASE not configured');
      return;
    }
    
    const currentUrl = window.location.pathname;
    const now = Date.now();
    
    // Prevent tracking the same page twice within 5 seconds
    if (lastTrackedUrl === currentUrl && (now - lastTrackedTime) < 5000) {
      console.log('⏭️ Skipping duplicate visit track for same page:', currentUrl);
      return;
    }
    
    lastTrackedUrl = currentUrl;
    lastTrackedTime = now;
    
    const sessionId = getSessionId();
    console.log('📍 [VISIT] URL:', currentUrl, '| Session:', sessionId);
    
    const response = await fetch(`${API_BASE}/api/track-visit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        page_url: currentUrl,
        referrer: document.referrer,
        session_id: sessionId
      })
    });
    const data = await response.json();
    console.log('✅ [VISIT TRACKED] Response:', data);
  } catch (err) {
    console.error('❌ Visit tracking failed:', err);
  }
};