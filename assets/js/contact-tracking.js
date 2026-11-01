// Sends a GA4 contact_click event for every WhatsApp / SMS / call link on the
// site, so messages and calls show up as leads. One delegated listener; it
// never cancels the click, so the link still opens as normal.
document.addEventListener('click', function (e) {
  var link = e.target.closest && e.target.closest('a[href]');
  if (!link || typeof gtag !== 'function') return;

  var href = link.getAttribute('href');
  var method = /^https?:\/\/wa\.me\//i.test(href) ? 'whatsapp'
    : /^sms:/i.test(href) ? 'sms'
    : /^tel:/i.test(href) ? 'call'
    : null;
  if (!method) return;

  gtag('event', 'contact_click', { method: method, page_location: location.href });
});
