(function () {
  'use strict';

  var script = document.currentScript;
  var CONFIG = {
    auth0Domain: script.dataset.auth0Domain,
    clientId:    script.dataset.auth0ClientId,
    audience:    script.dataset.auth0Audience,
    apiUrl:      (script.dataset.apiUrl || '').replace(/\/$/, ''),
    containerId: script.dataset.containerId || 'kungfu-widget',
  };

  // ── PKCE helpers ──────────────────────────────────────────────────────

  function _base64url(bytes) {
    return btoa(String.fromCharCode.apply(null, bytes))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  function generateVerifier() {
    var buf = new Uint8Array(32);
    crypto.getRandomValues(buf);
    return _base64url(buf);
  }

  function computeChallenge(verifier) {
    var data = new TextEncoder().encode(verifier);
    return crypto.subtle.digest('SHA-256', data).then(function (hash) {
      return _base64url(new Uint8Array(hash));
    });
  }

  // ── Auth state — memory only, never persisted ─────────────────────────

  var _token = null;

  // ── Auth0 PKCE flow ───────────────────────────────────────────────────

  function login() {
    var verifier = generateVerifier();
    var stateBuf = new Uint8Array(16);
    crypto.getRandomValues(stateBuf);
    var state = _base64url(stateBuf);

    sessionStorage.setItem('kf_verifier', verifier);
    sessionStorage.setItem('kf_state', state);

    computeChallenge(verifier).then(function (challenge) {
      var redirectUri = window.location.origin + window.location.pathname;
      var params = new URLSearchParams({
        response_type:         'code',
        client_id:             CONFIG.clientId,
        redirect_uri:          redirectUri,
        audience:              CONFIG.audience,
        scope:                 'openid profile email',
        state:                 state,
        code_challenge:        challenge,
        code_challenge_method: 'S256',
      });
      window.location.href = 'https://' + CONFIG.auth0Domain + '/authorize?' + params;
    });
  }

  function handleCallback() {
    var params  = new URLSearchParams(window.location.search);
    var code    = params.get('code');
    if (!code) return Promise.resolve();

    var returnedState = params.get('state');
    var storedState   = sessionStorage.getItem('kf_state');
    if (returnedState !== storedState) return Promise.reject(new Error('State mismatch'));

    var verifier    = sessionStorage.getItem('kf_verifier');
    var redirectUri = window.location.origin + window.location.pathname;
    sessionStorage.removeItem('kf_verifier');
    sessionStorage.removeItem('kf_state');

    return fetch('https://' + CONFIG.auth0Domain + '/oauth/token', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        grant_type:    'authorization_code',
        client_id:     CONFIG.clientId,
        code_verifier: verifier,
        code:          code,
        redirect_uri:  redirectUri,
      }),
    }).then(function (res) {
      if (!res.ok) throw new Error('Token exchange failed: ' + res.status);
      return res.json();
    }).then(function (data) {
      _token = data.access_token;
      window.history.replaceState({}, '', window.location.pathname);
    });
  }

  // ── API client ────────────────────────────────────────────────────────

  function callQuery(query) {
    return fetch(CONFIG.apiUrl + '/query', {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': 'Bearer ' + _token,
      },
      body: JSON.stringify({ query: query }),
    }).then(function (res) {
      return res.json().then(function (data) {
        if (!res.ok) {
          var err   = new Error('API error');
          err.status = res.status;
          err.data   = data;
          throw err;
        }
        return data;
      });
    });
  }

  // ── Rendering ─────────────────────────────────────────────────────────

  function _escape(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function _renderCitations(citations) {
    if (!citations || citations.length === 0) return '';
    var items = citations.map(function (c, i) {
      var loc = _escape(c.document);
      if (c.volume !== null && c.volume !== undefined) {
        loc += ', Vol. ' + _escape(String(c.volume));
      }
      loc += ', p. ' + _escape(String(c.page));
      var passageId = 'kf-passage-' + i;
      var toggle = c.text
        ? ' <a class="kf-view-source" href="#" data-passage="' + passageId + '">View source</a>' +
          '<div id="' + passageId + '" class="kf-passage" hidden>' +
          _escape(c.text) +
          '</div>'
        : '';
      return '<li>' + loc + toggle + '</li>';
    });
    return (
      '<p class="kf-sources-label">Sources:</p>' +
      '<ul class="kf-citations">' + items.join('') + '</ul>'
    );
  }

  function _renderQuota(remaining) {
    return (
      '<p class="kf-quota">Queries remaining this month: <strong>' +
      _escape(String(remaining)) + '</strong></p>'
    );
  }

  function renderLogin(container) {
    container.innerHTML =
      '<div class="kf-widget">' +
      '<p class="kf-tagline">Ask about Choy Lee Fut kung fu</p>' +
      '<button class="kf-btn kf-login-btn">Sign in to continue</button>' +
      '</div>';
    container.querySelector('.kf-login-btn').addEventListener('click', login);
  }

  function renderApp(container) {
    container.innerHTML =
      '<div class="kf-widget">' +
      '<p class="kf-disclaimer">For reference only. Always train under qualified instruction.</p>' +
      '<form class="kf-form">' +
      '<input class="kf-input" type="text" placeholder="Ask about Choy Lee Fut…"' +
      ' autocomplete="off" required />' +
      '<button class="kf-btn kf-submit" type="submit">Ask</button>' +
      '</form>' +
      '<div class="kf-response" aria-live="polite"></div>' +
      '</div>';

    var form        = container.querySelector('.kf-form');
    var input       = container.querySelector('.kf-input');
    var responseDiv = container.querySelector('.kf-response');
    var submitBtn   = container.querySelector('.kf-submit');

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var query = input.value.trim();
      if (!query) return;

      responseDiv.innerHTML = '<p class="kf-loading">Thinking…</p>';
      submitBtn.disabled = true;

      callQuery(query).then(function (data) {
        if (data.type === 'quota_exceeded') {
          responseDiv.innerHTML =
            '<p class="kf-quota-exceeded">Monthly query limit reached. Resets on the 1st.</p>';
        } else if (data.type === 'refusal') {
          responseDiv.innerHTML =
            '<p class="kf-refusal">' + _escape(data.message) + '</p>' +
            _renderQuota(data.quota_remaining);
        } else {
          responseDiv.innerHTML =
            '<p class="kf-answer">' + _escape(data.answer) + '</p>' +
            _renderCitations(data.citations) +
            _renderQuota(data.quota_remaining);
          responseDiv.querySelectorAll('.kf-view-source').forEach(function (link) {
            link.addEventListener('click', function (e) {
              e.preventDefault();
              var block = document.getElementById(link.dataset.passage);
              if (block) {
                block.hidden = !block.hidden;
                link.textContent = block.hidden ? 'View source' : 'Hide source';
              }
            });
          });
        }
      }).catch(function (err) {
        if (err.status === 401) {
          _token = null;
          renderLogin(container);
        } else if (err.status === 429) {
          responseDiv.innerHTML =
            '<p class="kf-quota-exceeded">Monthly query limit reached. Resets on the 1st.</p>';
        } else {
          responseDiv.innerHTML =
            '<p class="kf-error">The server is unreachable. Please try again shortly.</p>';
        }
      }).then(function () {
        submitBtn.disabled = false;
      });
    });
  }

  // ── Init ──────────────────────────────────────────────────────────────

  function init() {
    var container = document.getElementById(CONFIG.containerId);
    if (!container) return;

    handleCallback().then(function () {
      if (_token) {
        renderApp(container);
      } else {
        renderLogin(container);
      }
    }).catch(function (err) {
      console.error('[kf-widget] auth error:', err.message);
      renderLogin(container);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}());
