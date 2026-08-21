(function () {
  var APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw6fMbxx41Cf74-sLCV65FNI8ZLGmCXSEW-LiumguH4f6UBLfYpmTudY8B3CFEDlFIdoQ/exec';
  var MINOR_AGE_RANGES = ['3--5', '6-8', '9-11', '12-14', '15-17'];

  function init() {
    var wizard = document.getElementById('enroll-wizard');
    if (!wizard) return;

    var steps = Array.prototype.slice.call(wizard.querySelectorAll('.wizard-step'));
    var current = 0;

    function isMinor() {
      var checked = wizard.querySelector('input[name="ageRange"]:checked');
      return !!checked && MINOR_AGE_RANGES.indexOf(checked.value) !== -1;
    }

    function activeSteps() {
      return isMinor()
        ? steps
        : steps.filter(function (s) { return s.dataset.step !== 'parent-guardian'; });
    }

    function show(index) {
      var list = activeSteps();
      steps.forEach(function (s) {
        var i = list.indexOf(s);
        s.classList.toggle('hidden', i !== index);
      });
    }

    function groupHasValue(group) {
      var inputs = group.querySelectorAll('input, textarea');
      if (group.dataset.type === 'checkbox-group') {
        return Array.prototype.some.call(inputs, function (i) { return i.type === 'checkbox' && i.checked; });
      }
      if (group.dataset.type === 'radio-group') {
        return Array.prototype.some.call(inputs, function (i) { return i.type === 'radio' && i.checked; });
      }
      var input = inputs[0];
      return !!input && input.value.trim().length > 0;
    }

    function validateStep(step) {
      var ok = true;
      Array.prototype.forEach.call(step.querySelectorAll('[data-required]'), function (group) {
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

    Array.prototype.forEach.call(wizard.querySelectorAll('[data-action="next"]'), function (btn) {
      btn.addEventListener('click', function () {
        var list = activeSteps();
        if (!validateStep(list[current])) return;
        current += 1;
        show(current);
      });
    });

    Array.prototype.forEach.call(wizard.querySelectorAll('[data-action="back"]'), function (btn) {
      btn.addEventListener('click', function () {
        current -= 1;
        show(current);
      });
    });

    Array.prototype.forEach.call(wizard.querySelectorAll('[data-action="submit"]'), function (btn) {
      btn.addEventListener('click', function () {
        var list = activeSteps();
        if (!validateStep(list[current])) return;
        submit(btn);
      });
    });

    function collectChecked(name) {
      return Array.prototype.slice.call(wizard.querySelectorAll('input[name="' + name + '"]:checked'))
        .map(function (i) { return i.value; })
        .join(', ');
    }

    function textValue(name) {
      var el = wizard.querySelector('[name="' + name + '"]');
      return el ? el.value.trim() : '';
    }

    function radioValue(name) {
      var el = wizard.querySelector('input[name="' + name + '"]:checked');
      return el ? el.value : '';
    }

    function submit(submitBtn) {
      var errorEl = document.getElementById('enroll-submit-error');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Submitting...';
      errorEl.classList.add('hidden');

      var interestsOther = textValue('interestsOther');
      var availabilityOther = textValue('availabilityOther');
      var waiverCheckbox = wizard.querySelector('[name="waiverAccepted"]');

      var payload = {
        sourcePage: location.pathname,
        learnerName: textValue('learnerName'),
        email: textValue('email'),
        contactNo: textValue('contactNo'),
        ageRange: radioValue('ageRange'),
        parentGuardianName: textValue('parentGuardianName'),
        parentGuardianContact: textValue('parentGuardianContact'),
        interests: collectChecked('interests') + (interestsOther ? ', ' + interestsOther : ''),
        priorExperience: radioValue('priorExperience'),
        availability: collectChecked('availability') + (availabilityOther ? ', ' + availabilityOther : ''),
        emergencyContact: textValue('emergencyContact'),
        waiverAccepted: !!(waiverCheckbox && waiverCheckbox.checked),
        signatureName: textValue('signatureName'),
        howHeard: radioValue('howHeard') + (textValue('howHeardOther') ? ', ' + textValue('howHeardOther') : ''),
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
            window.location.href = 'thank-you.html';
          } else {
            showError();
          }
        })
        .catch(showError);

      function showError() {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit';
        errorEl.classList.remove('hidden');
      }
    }

    show(current);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
