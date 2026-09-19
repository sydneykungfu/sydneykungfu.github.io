(function () {
  var APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzs8A69iTSSRwieKv8paarL8XXVgOeemVFiWZLHoL9SEWrK7L8g9uSsC9-HlBjQvcyz8w/exec';

  function init() {
    var form = document.getElementById('request-class-form');
    if (!form) return;

    var successEl = document.getElementById('request-class-success');
    var errorEl = document.getElementById('request-class-submit-error');

    function groupHasValue(group) {
      var inputs = group.querySelectorAll('input, textarea');
      if (group.dataset.type === 'checkbox-group') {
        return Array.prototype.some.call(inputs, function (i) { return i.type === 'checkbox' && i.checked; });
      }
      if (group.dataset.type === 'radio-group') {
        return Array.prototype.some.call(inputs, function (i) { return i.type === 'radio' && i.checked; });
      }
      var input = inputs[0];
      if (!input || input.value.trim().length === 0) return false;
      if (input.type === 'email') return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim());
      return true;
    }

    function validate() {
      var ok = true;
      Array.prototype.forEach.call(form.querySelectorAll('[data-required]'), function (group) {
        var filled = groupHasValue(group);
        var alertEl = group.querySelector('.wizard-error');
        if (!filled) {
          ok = false;
          if (alertEl) alertEl.classList.remove('hidden');
        } else if (alertEl) {
          alertEl.classList.add('hidden');
        }
      });
      return ok;
    }

    function collectChecked(name) {
      return Array.prototype.slice.call(form.querySelectorAll('input[name="' + name + '"]:checked'))
        .map(function (i) { return i.value; })
        .join(', ');
    }

    function textValue(name) {
      var el = form.querySelector('[name="' + name + '"]');
      return el ? el.value.trim() : '';
    }

    function radioValue(name) {
      var el = form.querySelector('input[name="' + name + '"]:checked');
      return el ? el.value : '';
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validate()) return;
      submit();
    });

    function submit() {
      var submitBtn = form.querySelector('[data-action="submit"]');
      var originalText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = '...';
      errorEl.classList.add('hidden');

      var payload = {
        formType: 'class-request',
        sourcePage: location.pathname + location.search,
        name: textValue('name'),
        email: textValue('email'),
        phone: textValue('phone'),
        ageRange: radioValue('ageRange'),
        suburb: textValue('suburb'),
        preferredDays: collectChecked('preferredDays'),
        preferredTime: collectChecked('preferredTime'),
        notes: textValue('notes'),
        website: textValue('website')
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
            form.classList.add('hidden');
            successEl.classList.remove('hidden');
          } else {
            showError();
          }
        })
        .catch(showError);

      function showError() {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
        errorEl.classList.remove('hidden');
      }
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
