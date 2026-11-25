// Clutter Rack OS Integration
// Update LEAD_WEBHOOK_URL to your actual Clutter Rack OS lead intake endpoint
const LEAD_WEBHOOK_URL = 'https://api.clutterrackos.example/leads'; // Placeholder — replace with real webhook

// Capture marketing attribution (Google Ads, Meta, etc.)
function getAttribution() {
  const params = new URLSearchParams(window.location.search);
  return {
    gclid: params.get('gclid') || '',
    fbclid: params.get('fbclid') || '',
    utm_source: params.get('utm_source') || '',
    utm_medium: params.get('utm_medium') || '',
    utm_campaign: params.get('utm_campaign') || '',
    utm_term: params.get('utm_term') || '',
    utm_content: params.get('utm_content') || '',
    landing_page: window.location.href,
    referrer: document.referrer || '',
    timestamp: new Date().toISOString(),
    user_agent: navigator.userAgent
  };
}

async function submitLead(data) {
  const payload = {
    ...data,
    source: 'website',
    attribution: getAttribution(),
    tcpa_consent: !!data.tcpa_consent,
    consent_timestamp: data.tcpa_consent ? new Date().toISOString() : null
  };

  console.log('Lead payload for Clutter Rack OS:', payload);

  try {
    const res = await fetch(LEAD_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Webhook returned ' + res.status);
    return { success: true };
  } catch (err) {
    console.warn('Webhook failed (expected with placeholder URL):', err);
    // Still succeed for demo / until real endpoint is set
    return { success: true, offline: true };
  }
}

// Lead Form
const form = document.getElementById('lead-form');
const msg = document.getElementById('form-message');

if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    data.tcpa_consent = formData.get('tcpa_consent') === 'on';

    if (!data.tcpa_consent) {
      // Still allow submission but flag it
      console.log('Submitted without TCPA consent');
    }

    msg.textContent = 'Submitting...';
    msg.className = '';

    const result = await submitLead({
      name: data.name,
      email: data.email,
      phone: data.phone,
      garage_type: data.garage_type || '',
      message: data.message || '',
      tcpa_consent: data.tcpa_consent,
      type: 'quote_request'
    });

    if (result.success) {
      msg.textContent = result.offline
        ? 'Thank you! Your quote request has been received. (OS webhook pending setup)'
        : 'Thank you! Your quote request has been sent to Clutter Rack OS. We\'ll be in touch soon.';
      msg.className = 'success';
      form.reset();
    } else {
      msg.textContent = 'Something went wrong. Please call us at (645) 246-4886.';
      msg.className = 'error';
    }
  });
}

// Chat Widget
const chatToggle = document.getElementById('chat-toggle');
const chatWindow = document.getElementById('chat-window');
const chatClose = document.getElementById('chat-close');
const chatInput = document.getElementById('chat-input');
const chatMessages = document.getElementById('chat-messages');

let chatStarted = false;

function addMessage(text, from = 'user') {
  const p = document.createElement('p');
  p.innerHTML = `<strong>${from === 'user' ? 'You' : 'Clutter Rack'}:</strong> ${text}`;
  chatMessages.appendChild(p);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

if (chatToggle) {
  chatToggle.addEventListener('click', () => chatWindow.classList.toggle('open'));
  chatClose.addEventListener('click', () => chatWindow.classList.remove('open'));

  chatInput.addEventListener('keypress', async (e) => {
    if (e.key !== 'Enter' || !chatInput.value.trim()) return;
    const text = chatInput.value.trim();
    chatInput.value = '';
    addMessage(text, 'user');

    // First message creates a lead in OS
    if (!chatStarted) {
      chatStarted = true;
      await submitLead({
        name: 'Chat Visitor',
        email: '',
        phone: '',
        message: text,
        type: 'chat_start',
        tcpa_consent: false
      });
      addMessage('Thanks! A team member will reply shortly. For faster service, you can also submit a full quote above.', 'bot');
    } else {
      // Subsequent messages can be logged or sent to OS as chat updates
      console.log('Chat message:', text);
      addMessage('Got it. Our team will follow up. You can also call (645) 246-4886.', 'bot');
    }
  });
}

// Auto-fill phone from URL if present (for ads)
const urlPhone = new URLSearchParams(location.search).get('phone');
if (urlPhone && document.getElementById('phone')) {
  document.getElementById('phone').value = urlPhone;
}
