/**
 * ═══════════════════════════════════════════════════════════════════
 *  ShayanEV — Exit-Intent Popup (self-contained, vanilla JS)
 * ═══════════════════════════════════════════════════════════════════
 *
 *  USAGE — paste these two lines before </body> on any page:
 *
 *    <script>
 *      window.__SHAYANEV__ = {
 *        webhookUrl: 'https://your-esp.com/api/subscribe'
 *      };
 *    </script>
 *    <script src="/js/exit-popup.js"></script>
 *
 *  To EXCLUDE the popup on a specific page (e.g. landing page, checkout):
 *
 *    <script>window.__SHAYANEV_NO_POPUP__ = true;</script>
 *
 * ═══════════════════════════════════════════════════════════════════
 */
(function() {
  'use strict';

  // ════════════════════ CONFIGURATION ════════════════════
  var CONFIG = {
    webhookUrl: (window.__SHAYANEV__ && window.__SHAYANEV__.webhookUrl) || '',
    mobileDelayMs: 45000,
    mobileScrollTrigger: 0.6,
    dismissCooldownDays: 7,
    initDelayMs: 2000,
    storageKeyShown:     'shayanev_exit_popup_shown',
    storageKeyDismissed: 'shayanev_exit_popup_dismissed',
    storageKeyConverted: 'shayanev_exit_popup_converted',
  };

  // ════════════════════ POPUP CSS ════════════════════
  var POPUP_CSS = [
    ".exit-popup-overlay{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.6);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);z-index:99998;display:flex;align-items:center;justify-content:center;animation:shayanFadeIn 0.25s ease-out;padding:16px;}",
    ".exit-popup{background:#FFFFFF;border-radius:16px;padding:40px 36px;max-width:460px;width:100%;position:relative;z-index:99999;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,0.3);animation:shayanScaleIn 0.3s ease-out;box-sizing:border-box;}",
    ".exit-popup *{box-sizing:border-box;}",
    ".exit-popup-close{position:absolute;top:14px;right:14px;background:none;border:none;font-size:22px;line-height:1;color:#94A3B8;cursor:pointer;width:32px;height:32px;display:flex;align-items:center;justify-content:center;border-radius:50%;transition:background 0.15s,color 0.15s;font-family:inherit;padding:0;}",
    ".exit-popup-close:hover{background:#F1F5F9;color:#475569;}",
    ".exit-popup h2{font-family:'DM Sans',-apple-system,BlinkMacSystemFont,sans-serif;font-size:26px;font-weight:700;color:#0F172A;margin:0 0 6px;line-height:1.2;letter-spacing:-0.3px;}",
    ".exit-popup .subtitle{font-family:'DM Sans',-apple-system,BlinkMacSystemFont,sans-serif;font-size:16px;font-weight:500;color:#00C896;margin:0 0 20px;line-height:1.4;}",
    ".exit-popup .benefits{text-align:left;margin:16px auto;padding:0;max-width:300px;list-style:none;}",
    ".exit-popup .benefits li{font-family:'Source Sans 3',-apple-system,BlinkMacSystemFont,sans-serif;font-size:15px;color:#475569;padding:4px 0;display:flex;align-items:center;gap:8px;}",
    ".exit-popup .benefits li::before{content:'\\2713';color:#00C896;font-weight:700;flex-shrink:0;}",
    ".exit-popup input[type=\"email\"]{width:100%;padding:14px 16px;border:1.5px solid #CBD5E1;border-radius:8px;font-size:16px;margin:16px 0 10px;transition:border-color 0.2s,box-shadow 0.2s;font-family:inherit;outline:none;}",
    ".exit-popup input[type=\"email\"]:focus{border-color:#00C896;box-shadow:0 0 0 3px rgba(0,200,150,0.1);}",
    ".exit-popup input[type=\"email\"].error{border-color:#D93025;box-shadow:0 0 0 3px rgba(217,48,37,0.1);}",
    ".exit-popup .cta-btn{width:100%;padding:14px;background:#00C896;color:white;border:none;border-radius:8px;font-family:'DM Sans',-apple-system,BlinkMacSystemFont,sans-serif;font-size:16px;font-weight:600;cursor:pointer;transition:background 0.2s,transform 0.1s;box-shadow:0 4px 14px rgba(0,200,150,0.3);}",
    ".exit-popup .cta-btn:hover{background:#00A87E;transform:translateY(-1px);}",
    ".exit-popup .cta-btn:active{transform:translateY(0);}",
    ".exit-popup .cta-btn:disabled{opacity:0.7;cursor:not-allowed;transform:none;}",
    ".exit-popup .dismiss{display:inline-block;margin-top:14px;font-family:'Source Sans 3',-apple-system,BlinkMacSystemFont,sans-serif;font-size:13px;color:#94A3B8;cursor:pointer;border:none;background:none;text-decoration:underline;transition:color 0.15s;padding:6px 12px;}",
    ".exit-popup .dismiss:hover{color:#475569;}",
    ".exit-popup-spinner{display:inline-block;width:14px;height:14px;border:2px solid rgba(255,255,255,0.3);border-top-color:white;border-radius:50%;animation:shayanSpin 0.7s linear infinite;vertical-align:middle;margin-right:8px;}",
    "@keyframes shayanFadeIn{from{opacity:0;}to{opacity:1;}}",
    "@keyframes shayanScaleIn{from{opacity:0;transform:scale(0.92);}to{opacity:1;transform:scale(1);}}",
    "@keyframes shayanFadeOut{from{opacity:1;}to{opacity:0;}}",
    "@keyframes shayanSpin{to{transform:rotate(360deg);}}",
    "@media (max-width:480px){.exit-popup{padding:32px 24px;}.exit-popup h2{font-size:22px;}.exit-popup .subtitle{font-size:14px;}}",
    "@media (prefers-reduced-motion:reduce){.exit-popup-overlay,.exit-popup{animation:none!important;}}"
  ].join('\n');

  // ════════════════════ POPUP HTML ════════════════════
  function popupHTML() {
    return [
      '<div class="exit-popup-overlay" id="exitPopupOverlay">',
      '  <div class="exit-popup" role="dialog" aria-modal="true" aria-label="Free guide download">',
      '    <button class="exit-popup-close" id="exitPopupClose" aria-label="Close popup" type="button">&times;</button>',
      '    <h2>Wait — Don\'t Leave<br>Without This Free Guide</h2>',
      '    <p class="subtitle">7 EV Battery Mistakes That Cut Your Range By 30%</p>',
      '    <ul class="benefits">',
      '      <li>Takes 5 minutes to read</li>',
      '      <li>Specific to your EV model</li>',
      '      <li>Downloaded by 3,200+ EV owners</li>',
      '    </ul>',
      '    <div id="exitPopupForm">',
      '      <input type="email" id="exitPopupEmail" placeholder="your.email@example.com"',
      '             aria-label="Email address" autocomplete="email" required>',
      '      <button class="cta-btn" id="exitPopupSubmit" type="button">',
      '        <span id="exitPopupBtnLabel">Get the Free Guide →</span>',
      '      </button>',
      '    </div>',
      '    <div id="exitPopupSuccess" style="display:none;">',
      '      <p style="font-family:\'DM Sans\',sans-serif;font-size:22px;font-weight:700;color:#00C896;margin:16px 0 8px;">✓ Check your inbox!</p>',
      '      <p style="font-family:\'Source Sans 3\',sans-serif;font-size:14px;color:#475569;margin:0;">Your free guide is on its way.</p>',
      '    </div>',
      '    <button class="dismiss" id="exitPopupDismiss" type="button">',
      '      No thanks, I\'ll risk it',
      '    </button>',
      '  </div>',
      '</div>'
    ].join('\n');
  }

  // ════════════════════ GUARD CHECKS ════════════════════
  function safeStorage(type, action, key, value) {
    try {
      var store = type === 'session' ? sessionStorage : localStorage;
      if (action === 'get')    return store.getItem(key);
      if (action === 'set')    return store.setItem(key, value);
      if (action === 'remove') return store.removeItem(key);
    } catch (_) { return null; }
  }

  function shouldShow() {
    if (window.__SHAYANEV_NO_POPUP__) return false;
    if (safeStorage('local',   'get', CONFIG.storageKeyConverted)) return false;
    if (safeStorage('session', 'get', CONFIG.storageKeyShown))     return false;

    var dismissed = safeStorage('local', 'get', CONFIG.storageKeyDismissed);
    if (dismissed) {
      var daysSince = (Date.now() - parseInt(dismissed, 10)) / 86400000;
      if (daysSince < CONFIG.dismissCooldownDays) return false;
    }

    if (document.querySelector('.email-success, [data-email-submitted]')) return false;
    return true;
  }

  // ════════════════════ SHOW / HIDE ════════════════════
  var popupOpen = false;
  var savedScrollY = 0;

  function showPopup() {
    if (popupOpen || !shouldShow()) return;
    popupOpen = true;

    safeStorage('session', 'set', CONFIG.storageKeyShown, 'true');

    // Inject CSS once
    if (!document.getElementById('shayanevExitPopupStyles')) {
      var style = document.createElement('style');
      style.id = 'shayanevExitPopupStyles';
      style.textContent = POPUP_CSS;
      document.head.appendChild(style);
    }

    // Inject HTML
    var container = document.createElement('div');
    container.id = 'shayanevExitPopupContainer';
    container.innerHTML = popupHTML();
    document.body.appendChild(container);

    // Lock scroll (preserve scroll position)
    savedScrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = '-' + savedScrollY + 'px';
    document.body.style.width = '100%';

    // Focus email input
    setTimeout(function() {
      var input = document.getElementById('exitPopupEmail');
      if (input) input.focus();
    }, 300);

    bindEvents();

    // Analytics
    if (window.dataLayer) {
      window.dataLayer.push({ event: 'exit_popup_shown', page: window.location.pathname });
    }
  }

  function closePopup() {
    var overlay = document.getElementById('exitPopupOverlay');
    var container = document.getElementById('shayanevExitPopupContainer');
    if (!overlay || !container) return;

    overlay.style.animation = 'shayanFadeOut 0.2s ease-out forwards';

    setTimeout(function() {
      if (container.parentElement) container.parentElement.removeChild(container);

      // Restore scroll
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      window.scrollTo(0, savedScrollY);

      popupOpen = false;
    }, 200);

    document.removeEventListener('keydown', onEscape);
  }

  // ════════════════════ EVENT HANDLERS ════════════════════
  function onEscape(e) { if (e.key === 'Escape') closePopup(); }

  function bindEvents() {
    var close   = document.getElementById('exitPopupClose');
    var overlay = document.getElementById('exitPopupOverlay');
    var dismiss = document.getElementById('exitPopupDismiss');
    var submit  = document.getElementById('exitPopupSubmit');
    var email   = document.getElementById('exitPopupEmail');

    if (close)   close.addEventListener('click', closePopup);
    if (overlay) overlay.addEventListener('click', function(e) {
      if (e.target.id === 'exitPopupOverlay') closePopup();
    });
    if (dismiss) dismiss.addEventListener('click', function() {
      safeStorage('local', 'set', CONFIG.storageKeyDismissed, Date.now().toString());
      if (window.dataLayer) window.dataLayer.push({ event: 'exit_popup_dismissed' });
      closePopup();
    });
    if (submit) submit.addEventListener('click', handleSubmit);
    if (email)  email.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') { e.preventDefault(); handleSubmit(); }
    });

    document.addEventListener('keydown', onEscape);
  }

  async function handleSubmit() {
    var emailInput = document.getElementById('exitPopupEmail');
    var submitBtn  = document.getElementById('exitPopupSubmit');
    var btnLabel   = document.getElementById('exitPopupBtnLabel');
    var email      = (emailInput && emailInput.value || '').trim();

    // Validate
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      emailInput.classList.add('error');
      emailInput.value = '';
      emailInput.setAttribute('placeholder', 'Please enter a valid email');
      emailInput.focus();
      return;
    }

    // Loading state
    submitBtn.disabled = true;
    btnLabel.innerHTML = '<span class="exit-popup-spinner"></span>Sending...';

    try {
      if (CONFIG.webhookUrl) {
        var isGAS = CONFIG.webhookUrl.indexOf('script.google.com') > -1;
        if (isGAS) {
          // GET with params (no CORS preflight)
          var u = new URL(CONFIG.webhookUrl);
          u.searchParams.set('name',      '');
          u.searchParams.set('email',     email);
          u.searchParams.set('source',    'exit-intent-popup');
          u.searchParams.set('page',      window.location.pathname);
          u.searchParams.set('timestamp', new Date().toISOString());
          await fetch(u.toString(), { method: 'GET', mode: 'no-cors' });
        } else {
          await fetch(CONFIG.webhookUrl, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: email,
              tags: ['pdf-guide', 'exit-popup'],
              source: 'exit-intent-popup',
              page: window.location.pathname,
              timestamp: new Date().toISOString(),
            }),
          });
        }
      }

      // Analytics
      if (window.dataLayer) window.dataLayer.push({ event: 'email_captured', source: 'exit-popup' });
      if (window.fbq)       window.fbq('track', 'Lead', { content_name: 'exit-popup-pdf' });

      finishSuccess();
    } catch (err) {
      // Still treat as success so the user isn't punished for backend issues
      console.error('Exit popup submission error:', err);
      if (window.dataLayer) window.dataLayer.push({ event: 'form_error', source: 'exit-popup', error: err.message });
      finishSuccess();
    }
  }

  function finishSuccess() {
    safeStorage('local', 'set', CONFIG.storageKeyConverted, 'true');

    var form    = document.getElementById('exitPopupForm');
    var success = document.getElementById('exitPopupSuccess');
    var dismiss = document.getElementById('exitPopupDismiss');

    if (form)    form.style.display = 'none';
    if (success) success.style.display = 'block';
    if (dismiss) dismiss.style.display = 'none';

    setTimeout(closePopup, 3000);
  }

  // ════════════════════ TRIGGERS ════════════════════
  function isMobile() {
    return /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) || window.innerWidth < 768;
  }

  function initTriggers() {
    if (!shouldShow()) return;

    if (isMobile()) {
      // Time-based
      setTimeout(function() { showPopup(); }, CONFIG.mobileDelayMs);

      // Scroll-based
      var scrollTriggered = false;
      window.addEventListener('scroll', function() {
        if (scrollTriggered || popupOpen) return;
        var docHeight = document.body.scrollHeight;
        if (docHeight <= window.innerHeight) return;
        var pct = (window.scrollY + window.innerHeight) / docHeight;
        if (pct > CONFIG.mobileScrollTrigger) {
          scrollTriggered = true;
          showPopup();
        }
      }, { passive: true });

    } else {
      // Desktop mouse-out (top of viewport)
      document.addEventListener('mouseleave', function(e) {
        if (e.clientY <= 0) showPopup();
      });
    }
  }

  // ════════════════════ INIT ════════════════════
  function init() {
    // Small delay so it doesn't fire instantly on page load
    setTimeout(initTriggers, CONFIG.initDelayMs);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose for manual triggering / testing
  window.__SHAYANEV_EXIT_POPUP__ = {
    show:    showPopup,
    close:   closePopup,
    reset:   function() {
      safeStorage('session', 'remove', CONFIG.storageKeyShown);
      safeStorage('local',   'remove', CONFIG.storageKeyDismissed);
      safeStorage('local',   'remove', CONFIG.storageKeyConverted);
    }
  };
})();
