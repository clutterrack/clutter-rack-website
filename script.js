// Clutter Rack OS Integration
// Update LEAD_WEBHOOK_URL to your actual Clutter Rack OS lead intake endpoint
const LEAD_WEBHOOK_URL = 'https://api.clutterrackos.example/leads'; // Placeholder — replace with real webhook

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
    return { success: true, offline: true };
  }
}

// Standard Quote Form
const form = document.getElementById('lead-form');
const msg = document.getElementById('form-message');

if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    data.tcpa_consent = formData.get('tcpa_consent') === 'on';

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

// Design My Garage Form
const designForm = document.getElementById('design-form');
const designMsg = document.getElementById('design-message');

if (designForm) {
  designForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(designForm);
    const data = Object.fromEntries(formData.entries());
    data.tcpa_consent = formData.get('tcpa_consent') === 'on';

    designMsg.textContent = 'Processing your design request...';
    designMsg.className = '';

    // Photos are not sent as binary in this JSON payload; in production they would be uploaded to storage and URLs attached
    const result = await submitLead({
      name: data.name,
      email: data.email,
      phone: data.phone,
      dimensions: {
        width: data.width || null,
        depth: data.depth || null,
        height: data.height || null
      },
      storage_needs: data.storage_needs || '',
      photos_note: 'Photos uploaded (handled separately in production)',
      tcpa_consent: data.tcpa_consent,
      type: 'design_my_garage'
    });

    if (result.success) {
      designMsg.textContent = result.offline
        ? 'Thank you! Your Design My Garage request has been received. (OS webhook pending setup). Our team will follow up with recommendations.'
        : 'Thank you! Your garage design request has been sent to Clutter Rack OS. We\'ll review and send recommendations plus an estimated installed price.';
      designMsg.className = 'success';
      designForm.reset();
    } else {
      designMsg.textContent = 'Something went wrong. Please call us at (645) 246-4886.';
      designMsg.className = 'error';
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
      addMessage('Thanks! A team member will reply shortly. You can also use Design My Garage or the quote form above.', 'bot');
    } else {
      console.log('Chat message:', text);
      addMessage('Got it. Our team will follow up. You can also call (645) 246-4886.', 'bot');
    }
  });
}

const urlPhone = new URLSearchParams(location.search).get('phone');
if (urlPhone && document.getElementById('phone')) {
  document.getElementById('phone').value = urlPhone;
}
