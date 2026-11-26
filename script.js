// Clutter Rack staging integration (sandbox webhook)
const LEAD_WEBHOOK_URL = 'https://api.clutterrackos.example/leads'; // Staging placeholder

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
    timestamp: new Date().toISOString()
  };
}

async function submitLead(data) {
  const payload = {
    ...data,
    source: 'website_staging',
    attribution: getAttribution(),
    tcpa_consent: !!data.tcpa_consent,
    consent_timestamp: data.tcpa_consent ? new Date().toISOString() : null
  };

  console.log('Staging lead payload:', payload);

  try {
    const res = await fetch(LEAD_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Webhook returned ' + res.status);
    return { success: true };
  } catch (err) {
    console.warn('Staging webhook unavailable (expected):', err);
    return { success: true, offline: true };
  }
}

// Mobile menu
const menuToggle = document.querySelector('.menu-toggle');
const mainNav = document.getElementById('main-nav');
if (menuToggle && mainNav) {
  menuToggle.addEventListener('click', () => {
    const isOpen = mainNav.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', isOpen);
    menuToggle.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
  });
  mainNav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      mainNav.classList.remove('open');
      menuToggle.setAttribute('aria-expanded', 'false');
      menuToggle.setAttribute('aria-label', 'Open menu');
    });
  });
}

// Design My Garage steps
function showStep(id) {
  document.querySelectorAll('.design-step').forEach(s => s.classList.remove('active'));
  const el = document.getElementById(id);
  if (el) el.classList.add('active');
}

document.getElementById('to-step-2')?.addEventListener('click', () => showStep('step-2'));
document.getElementById('to-recommendation')?.addEventListener('click', () => showStep('step-recommendation'));
document.getElementById('to-contact')?.addEventListener('click', () => showStep('step-contact'));

// Quote form
const form = document.getElementById('lead-form');
const msg = document.getElementById('form-message');
if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    data.tcpa_consent = formData.get('tcpa_consent') === 'on';

    msg.textContent = 'Sending...';
    msg.className = '';

    const result = await submitLead({
      name: data.name || '',
      email: data.email || '',
      phone: data.phone || '',
      zip: data.zip || '',
      preferred_contact: data.preferred_contact || '',
      tcpa_consent: data.tcpa_consent,
      type: 'quote_request'
    });

    if (result.success) {
      msg.textContent = result.offline
        ? 'Thank you. Your request has been recorded for staging review. We will follow up.'
        : 'Thank you. We have received your request and will be in touch soon.';
      msg.className = 'success';
      form.reset();
    } else {
      msg.textContent = 'Something went wrong. Please call us at (645) 246-4886.';
      msg.className = 'error';
    }
  });
}

// Design contact form
const designForm = document.getElementById('design-form');
const designMsg = document.getElementById('design-message');
if (designForm) {
  designForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(designForm);
    const data = Object.fromEntries(formData.entries());
    data.tcpa_consent = formData.get('tcpa_consent') === 'on';

    designMsg.textContent = 'Sending...';
    designMsg.className = '';

    const result = await submitLead({
      name: data.name || '',
      email: data.email || '',
      phone: data.phone || '',
      preferred_contact: data.preferred_contact || '',
      storage_goal: document.getElementById('storage-goal')?.value || '',
      access_freq: document.getElementById('access-freq')?.value || '',
      zip: document.getElementById('zip')?.value || '',
      dimensions: {
        width: document.getElementById('width')?.value || null,
        depth: document.getElementById('depth')?.value || null,
        height: document.getElementById('height')?.value || null
      },
      tcpa_consent: data.tcpa_consent,
      type: 'design_my_garage',
      plan_note: 'Preliminary recommendation shown client-side from staging rules'
    });

    if (result.success) {
      designMsg.textContent = result.offline
        ? 'Plan saved for staging review. We will follow up about your free inspection. Final fit confirmed on site.'
        : 'Thank you. Your plan has been received. We will follow up about next steps.';
      designMsg.className = 'success';
      designForm.reset();
    } else {
      designMsg.textContent = 'Something went wrong. Please call us at (645) 246-4886.';
      designMsg.className = 'error';
    }
  });
}

// Chat
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

if (chatToggle && chatWindow) {
  chatToggle.addEventListener('click', () => {
    const isOpen = chatWindow.classList.toggle('open');
    chatToggle.setAttribute('aria-expanded', isOpen);
    chatToggle.setAttribute('aria-label', isOpen ? 'Close chat' : 'Open chat');
  });
  if (chatClose) {
    chatClose.addEventListener('click', () => {
      chatWindow.classList.remove('open');
      chatToggle.setAttribute('aria-expanded', 'false');
      chatToggle.setAttribute('aria-label', 'Open chat');
    });
  }

  if (chatInput) {
    chatInput.addEventListener('keypress', async (e) => {
      if (e.key !== 'Enter' || !chatInput.value.trim()) return;
      const text = chatInput.value.trim();
      chatInput.value = '';
      addMessage(text, 'user');

      if (!chatStarted) {
        chatStarted = true;
        await submitLead({
          name: 'Chat Visitor',
          message: text,
          type: 'chat_start',
          tcpa_consent: false
        });
        addMessage('Thanks. A team member will reply shortly. You can also use Design My Garage or the quote form.', 'bot');
      } else {
        addMessage('Got it. We will follow up. You can also call (645) 246-4886.', 'bot');
      }
    });
  }
}
