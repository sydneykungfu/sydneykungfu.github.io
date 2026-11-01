(function () {
  // Same Apps Script as enroll-form.js; it handles formType "trial" separately.
  var APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzs8A69iTSSRwieKv8paarL8XXVgOeemVFiWZLHoL9SEWrK7L8g9uSsC9-HlBjQvcyz8w/exec';

  function init() {
    var form = document.getElementById('trial-form');
    if (!form) return;

    var fields = {
      name: form.querySelector('[name="learnerName"]'),
      mobile: form.querySelector('[name="contactNo"]'),
      email: form.querySelector('[name="email"]')
    };

    function check(input, ok) {
      var errorEl = input.parentNode.querySelector('.trial-error');
      errorEl.classList.toggle('hidden', ok);
      return ok;
    }

    function validate() {
      var email = fields.email.value.trim();
      var ok = check(fields.name, fields.name.value.trim().length > 0);
      ok = check(fields.mobile, fields.mobile.value.replace(/\D/g, '').length >= 8) && ok;
      ok = check(fields.email, email === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) && ok;
      if (!ok) {
        var firstError = form.querySelector('.trial-error:not(.hidden)');
        firstError.parentNode.querySelector('input').focus();
      }
      return ok;
    }

    function value(name) {
      return form.querySelector('[name="' + name + '"]').value.trim();
    }

    function cameFromGoogleAds() {
      return /[?&](gclid|gbraid)=/.test(location.search);
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validate()) return;

      var submitBtn = form.querySelector('button[type="submit"]');
      var errorEl = document.getElementById('trial-submit-error');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending...';
      errorEl.classList.add('hidden');

      // Wizard fields the trial form doesn't ask for are sent blank.
      var payload = {
        formType: 'trial',
        sourcePage: location.pathname + location.search,
        learnerName: value('learnerName'),
        email: value('email'),
        contactNo: value('contactNo'),
        message: value('message'),
        ageRange: '',
        parentGuardianName: '',
        parentGuardianContact: '',
        interests: '',
        priorExperience: '',
        availability: value('availability'),
        emergencyContact: '',
        waiverAccepted: false,
        signatureName: '',
        howHeard: cameFromGoogleAds() ? 'Google' : '',
        website: value('website')
      };

      fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      })
        .then(function (r) { return r.text(); })
        .then(function (text) {
          var data = JSON.parse(text);
          if (data.success) {
            showSuccess();
          } else {
            showError();
          }
        })
        .catch(showError);

      function showSuccess() {
        // Same conversion events thank-you.html fires for the full enrolment.
        if (typeof gtag === 'function') gtag('event', 'generate_lead');
        if (typeof fbq === 'function') fbq('track', 'Lead');
        form.classList.add('hidden');
        var success = document.getElementById('trial-success');
        success.classList.remove('hidden');
        success.focus();
      }

      function showError() {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Book my free class';
        errorEl.classList.remove('hidden');
      }
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
