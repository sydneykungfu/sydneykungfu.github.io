# Trackable Enrollment Form Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the external Google Form linked from `enroll.html`, `zh/enroll.html`, and `zh-CN/enroll.html` with an in-page multi-step form that writes to the same Google Sheet via Apps Script and redirects to an on-domain thank-you page, so GA4/Google Ads can finally observe enrollment conversions.

**Architecture:** A single shared Jekyll include (`_includes/enroll-wizard.html`) renders a 5-step wizard form on all three enroll pages. A shared `assets/js/enroll-form.js` drives step navigation, per-step validation, the minor/adult branch, and submission. Submission POSTs to a Google Apps Script Web App (deployed manually, not repo-tracked) which appends a row to the existing Sheet and returns a real JSON response; only on confirmed success does the browser redirect to a `thank-you.html` that fires the GA4 `generate_lead` event.

**Tech Stack:** Jekyll (Liquid includes), vanilla ES6 JS (no build step, no framework — matches `assets/js/navigation.js`), Tailwind CSS (utility classes, matches existing pages), Google Apps Script (`doPost`, `ContentService`).

## Global Constraints

- Form fields stay **English-only** on all three language pages (zh/zh-CN included) — matches current live behavior, confirmed with site owner. No Chinese translation of the waiver.
- The waiver legal text must be reproduced **verbatim** — see the Appendix of `docs/superpowers/specs/2026-08-21-trackable-enrollment-form-design.md`. Do not paraphrase.
- The Apps Script backend must return a **real, readable JSON response** the client can check — no `no-cors`/fire-and-forget. A confirmed failure must show an inline error and must **not** redirect (no false conversions, no silently-lost waiver signatures).
- No automated test suite exists in this repo (static Jekyll site). Verification is done by hand via the Claude Browser tool, not via a test framework.
- Apps Script code is deployed manually via script.google.com (not `clasp`, not repo-tracked) — confirmed with site owner.
- GA4 event fired is `gtag('event', 'generate_lead')`. Google Ads pulls this conversion via the already-linked GA4 property — no separate `AW-XXX/LABEL` snippet needed on the thank-you page.

---

### Task 1: Google Apps Script backend

**Files:** None in this repo — this produces code to hand to the site owner, plus deployment instructions. This task blocks Task 5 (end-to-end verification needs the real deployed URL), so start it first and let it run in parallel with Tasks 2–4.

**Interfaces:**
- Produces: a deployed Web App URL (`https://script.google.com/macros/s/.../exec`) that Task 2's `enroll-form.js` POSTs to.
- Consumes: nothing from this repo.

- [ ] **Step 1: Write the Apps Script source**

Give the site owner this exact code to paste into the Apps Script editor:

```javascript
var SHEET_NAME = 'Website Enrollments';
var HONEYPOT_FIELD = 'website';

function doPost(e) {
  var data = JSON.parse(e.postData.contents);

  if (data[HONEYPOT_FIELD]) {
    return jsonResponse({ success: true });
  }

  var required = ['learnerName', 'email', 'ageRange', 'interests', 'priorExperience', 'availability', 'waiverAccepted', 'signatureName', 'howHeard'];
  for (var i = 0; i < required.length; i++) {
    if (!data[required[i]]) {
      return jsonResponse({ success: false, error: 'Missing required field: ' + required[i] });
    }
  }

  var sheet = getOrCreateSheet();
  sheet.appendRow([
    new Date(),
    data.sourcePage || '',
    data.learnerName,
    data.email,
    data.contactNo || '',
    data.ageRange,
    data.parentGuardianName || '',
    data.parentGuardianContact || '',
    data.interests,
    data.priorExperience,
    data.availability,
    data.waiverAccepted,
    data.signatureName,
    data.emergencyContact || '',
    data.howHeard
  ]);

  return jsonResponse({ success: true });
}

function getOrCreateSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow([
      'Timestamp', 'Source Page', 'Learner Name', 'Email', 'Contact No.', 'Age Range',
      'Parent/Guardian Name', 'Parent/Guardian Contact', 'Interests', 'Prior Experience',
      'Availability', 'Waiver Accepted', 'Signature Name', 'Emergency Contact', 'How Heard'
    ]);
  }
  return sheet;
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
```

This writes into a **new tab** called "Website Enrollments" in the same spreadsheet — it does not touch the existing Google Forms "Form Responses" tab, so nothing about the current setup breaks.

- [ ] **Step 2: Deployment instructions for the site owner**

Hand over these exact steps:

1. Open the Google Sheet that currently receives the Google Form's responses.
2. Extensions → Apps Script.
3. Delete any placeholder code in `Code.gs`, paste the code from Step 1.
4. Deploy → New deployment → gear icon → Web app.
5. Description: "Enrollment form endpoint". Execute as: **Me**. Who has access: **Anyone**.
6. Click Deploy, authorize the requested permissions (it will warn "Google hasn't verified this app" — this is expected for a script you wrote yourself; click Advanced → Go to [project name] (unsafe) → Allow).
7. Copy the resulting Web app URL (ends in `/exec`) and send it back.

- [ ] **Step 3: Confirm receipt**

Do not proceed to Task 5 until the real deployed URL has been received. Tasks 2–4 and 6–8 do not depend on it and can proceed immediately.

---

### Task 2: Shared wizard JS engine

**Files:**
- Create: `assets/js/enroll-form.js`

**Interfaces:**
- Consumes: DOM structure produced by Task 3's `_includes/enroll-wizard.html` — specifically: a container `#enroll-wizard`, child elements with `class="wizard-step"` and a `data-step` attribute, field wrapper elements with `data-required` and `data-type` (`text`, `checkbox-group`, or `radio-group`) attributes containing a `.wizard-error` element, buttons with `data-action="next"|"back"|"submit"`, radio inputs `name="ageRange"`, and an error banner `#enroll-submit-error`.
- Produces: nothing consumed by other repo files — this is a leaf script, loaded via `<script src="/assets/js/enroll-form.js" defer></script>` on each enroll page.

- [ ] **Step 1: Write the wizard engine**

```javascript
(function () {
  var APPS_SCRIPT_URL = 'REPLACE_WITH_DEPLOYED_APPS_SCRIPT_URL';
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
```

- [ ] **Step 2: Verify the file is syntactically valid**

Run: `node --check assets/js/enroll-form.js`
Expected: no output, exit code 0.

- [ ] **Step 3: Commit**

```bash
git add assets/js/enroll-form.js
git commit -m "feat: add enrollment form wizard engine"
```

---

### Task 3: Build the wizard include and wire it into enroll.html

**Files:**
- Create: `_includes/enroll-wizard.html`
- Modify: `enroll.html:59-73` (replace the Google Forms CTA block), `enroll.html:85` (schedule-cards `enroll_url`), `enroll.html:166-169` (sticky mobile CTA)

**Interfaces:**
- Consumes: `assets/js/enroll-form.js` from Task 2 (loaded via `<script src="/assets/js/enroll-form.js" defer></script>`).
- Produces: the DOM structure Task 2's JS expects (see Task 2's Interfaces block). Reused unmodified by Tasks 6 and 7 via `{% include enroll-wizard.html %}`.

- [ ] **Step 1: Create `_includes/enroll-wizard.html`**

```html
<div id="enroll-wizard" class="bg-white rounded-lg shadow-sm p-6 mb-3">

  <div class="wizard-step" data-step="1">
    <div class="mb-4" data-required data-type="text">
      <label class="block font-semibold mb-1">Learner Name *</label>
      <input type="text" name="learnerName" class="w-full border border-gray-300 rounded px-3 py-2">
      <p class="wizard-error hidden text-red-600 text-sm mt-1">This is a required question</p>
    </div>
    <div class="mb-4" data-required data-type="text">
      <label class="block font-semibold mb-1">Email Address *</label>
      <input type="email" name="email" class="w-full border border-gray-300 rounded px-3 py-2">
      <p class="wizard-error hidden text-red-600 text-sm mt-1">This is a required question</p>
    </div>
    <div class="mb-4">
      <label class="block font-semibold mb-1">Contact No. (Optional)</label>
      <input type="text" name="contactNo" class="w-full border border-gray-300 rounded px-3 py-2">
    </div>
    <div class="mb-4" data-required data-type="radio-group">
      <label class="block font-semibold mb-2">Age Range *</label>
      <div class="grid grid-cols-3 sm:grid-cols-4 gap-2">
        <label class="flex items-center gap-1"><input type="radio" name="ageRange" value="3--5"> 3&ndash;5</label>
        <label class="flex items-center gap-1"><input type="radio" name="ageRange" value="6-8"> 6-8</label>
        <label class="flex items-center gap-1"><input type="radio" name="ageRange" value="9-11"> 9-11</label>
        <label class="flex items-center gap-1"><input type="radio" name="ageRange" value="12-14"> 12-14</label>
        <label class="flex items-center gap-1"><input type="radio" name="ageRange" value="15-17"> 15-17</label>
        <label class="flex items-center gap-1"><input type="radio" name="ageRange" value="18-24"> 18-24</label>
        <label class="flex items-center gap-1"><input type="radio" name="ageRange" value="25-30"> 25-30</label>
        <label class="flex items-center gap-1"><input type="radio" name="ageRange" value="31-40"> 31-40</label>
        <label class="flex items-center gap-1"><input type="radio" name="ageRange" value="41-45"> 41-45</label>
        <label class="flex items-center gap-1"><input type="radio" name="ageRange" value="46-50"> 46-50</label>
        <label class="flex items-center gap-1"><input type="radio" name="ageRange" value="51-60"> 51-60</label>
        <label class="flex items-center gap-1"><input type="radio" name="ageRange" value="61+"> 61+</label>
      </div>
      <p class="wizard-error hidden text-red-600 text-sm mt-1">This is a required question</p>
    </div>
    <button type="button" data-action="next" class="bg-red-600 px-6 py-3 rounded text-white font-semibold hover:bg-red-700">Next</button>
  </div>

  <div class="wizard-step hidden" data-step="parent-guardian">
    <p class="text-gray-600 mb-4">For learner younger than 18 years old.</p>
    <div class="mb-4" data-required data-type="text">
      <label class="block font-semibold mb-1">Parent / Guardian Name *</label>
      <input type="text" name="parentGuardianName" class="w-full border border-gray-300 rounded px-3 py-2">
      <p class="wizard-error hidden text-red-600 text-sm mt-1">This is a required question</p>
    </div>
    <div class="mb-4" data-required data-type="text">
      <label class="block font-semibold mb-1">Parent / Guardian Contact No. *</label>
      <p class="text-gray-500 text-sm mb-1">For Emergency purpose.</p>
      <input type="text" name="parentGuardianContact" class="w-full border border-gray-300 rounded px-3 py-2">
      <p class="wizard-error hidden text-red-600 text-sm mt-1">This is a required question</p>
    </div>
    <button type="button" data-action="back" class="border border-gray-300 px-6 py-3 rounded font-semibold hover:bg-gray-50 mr-2">Back</button>
    <button type="button" data-action="next" class="bg-red-600 px-6 py-3 rounded text-white font-semibold hover:bg-red-700">Next</button>
  </div>

  <div class="wizard-step hidden" data-step="3">
    <div class="mb-4" data-required data-type="checkbox-group">
      <label class="block font-semibold mb-2">What are your main interests in Kung Fu training? *</label>
      <label class="flex items-center gap-2 mb-1"><input type="checkbox" name="interests" value="Self-defense"> Self-defense</label>
      <label class="flex items-center gap-2 mb-1"><input type="checkbox" name="interests" value="Traditional forms & techniques"> Traditional forms &amp; techniques</label>
      <label class="flex items-center gap-2 mb-1"><input type="checkbox" name="interests" value="Weapons training (Wooden Staff, Broadsword, etc.)"> Weapons training (Wooden Staff, Broadsword, etc.)</label>
      <label class="flex items-center gap-2 mb-1"><input type="checkbox" name="interests" value="Sparring & combat applications"> Sparring &amp; combat applications</label>
      <label class="flex items-center gap-2 mb-1"><input type="checkbox" name="interests" value="Strength & fitness"> Strength &amp; fitness</label>
      <label class="flex items-center gap-2 mb-1">Other: <input type="text" name="interestsOther" class="border border-gray-300 rounded px-2 py-1"></label>
      <p class="wizard-error hidden text-red-600 text-sm mt-1">This is a required question</p>
    </div>
    <div class="mb-4" data-required data-type="radio-group">
      <label class="block font-semibold mb-2">Have you practiced martial arts before? *</label>
      <label class="flex items-center gap-2 mb-1"><input type="radio" name="priorExperience" value="No, I am a complete beginner"> No, I am a complete beginner</label>
      <label class="flex items-center gap-2 mb-1"><input type="radio" name="priorExperience" value="Yes, I have some experience in Choy Lee Fut only"> Yes, I have some experience in Choy Lee Fut only</label>
      <label class="flex items-center gap-2 mb-1"><input type="radio" name="priorExperience" value="Yes, I have trained in other styles"> Yes, I have trained in other styles</label>
      <p class="wizard-error hidden text-red-600 text-sm mt-1">This is a required question</p>
    </div>
    <button type="button" data-action="back" class="border border-gray-300 px-6 py-3 rounded font-semibold hover:bg-gray-50 mr-2">Back</button>
    <button type="button" data-action="next" class="bg-red-600 px-6 py-3 rounded text-white font-semibold hover:bg-red-700">Next</button>
  </div>

  <div class="wizard-step hidden" data-step="4">
    <div class="mb-4" data-required data-type="checkbox-group">
      <label class="block font-semibold mb-2">What days/times are you choose for training? *</label>
      <p class="text-gray-500 text-sm mb-2">Feel free to suggest any time/location. I will consider it in the near future.</p>
      <label class="flex items-center gap-2 mb-1"><input type="checkbox" name="availability" value="Marsfield Park - Saturday 9:30-11:30AM"> Marsfield Park - Saturday 9:30-11:30AM</label>
      <label class="flex items-center gap-2 mb-1"><input type="checkbox" name="availability" value="Marsfield Park - Saturday 11:45-12:45PM"> Marsfield Park - Saturday 11:45-12:45PM</label>
      <label class="flex items-center gap-2 mb-1"><input type="checkbox" name="availability" value="Outside PCYC Waitara - Tuesday 6:00-7:00pm"> Outside PCYC Waitara - Tuesday 6:00-7:00pm</label>
      <label class="flex items-center gap-2 mb-1"><input type="checkbox" name="availability" value="Private Class"> Private Class</label>
      <label class="flex items-center gap-2 mb-1">Other: <input type="text" name="availabilityOther" class="border border-gray-300 rounded px-2 py-1"></label>
      <p class="wizard-error hidden text-red-600 text-sm mt-1">This is a required question</p>
    </div>
    <button type="button" data-action="back" class="border border-gray-300 px-6 py-3 rounded font-semibold hover:bg-gray-50 mr-2">Back</button>
    <button type="button" data-action="next" class="bg-red-600 px-6 py-3 rounded text-white font-semibold hover:bg-red-700">Next</button>
  </div>

  <div class="wizard-step hidden" data-step="5">
    <h3 class="text-xl font-bold mb-3">Martial Arts Training Waiver</h3>
    <div class="text-sm text-gray-700 border border-gray-200 rounded p-4 mb-4 max-h-64 overflow-y-auto space-y-3">
      <p><strong>RISK WARNING, WAIVER AND RELEASE — TSE KUNG FU ACADEMY</strong></p>
      <p>(Hard Clutch Pty Ltd, ABN 34 678 262 809, trading as Tse Kung Fu Academy)</p>
      <p><strong>1. Nature of the activity and risks</strong></p>
      <p>Tse Kung Fu Academy provides Choy Lee Fut Kung Fu classes and related activities, including adult and children's classes and childcare incursions ("the Activities"). Participation in the Activities involves inherent risks, including but not limited to:</p>
      <ul class="list-disc pl-5">
        <li>Impact injury from striking, blocking, sparring or partner drills</li>
        <li>Sprains, strains, joint injury and muscle soreness</li>
        <li>Falls, collisions and contact with other participants or equipment</li>
        <li>Concussion or other head injury</li>
        <li>Aggravation of pre-existing injuries or medical conditions</li>
        <li>Injury arising from the outdoor park locations used for classes (uneven ground, weather exposure)</li>
      </ul>
      <p>This is a general description of risk and is not exhaustive. By signing this form, you acknowledge that you have read and understood this risk warning, and that it constitutes a formal risk warning for the purposes of section 5M of the Civil Liability Act 2002 (NSW) and equivalent provisions in other States or Territories where applicable.</p>
      <p><strong>2. Voluntary participation and assumption of risk</strong></p>
      <p>I voluntarily choose to participate (or to allow the person named below to participate) in the Activities, in full knowledge of the risks described above, and I accept those risks.</p>
      <p><strong>3. Exclusion of liability</strong></p>
      <p>To the maximum extent permitted by law, including under section 5N of the Civil Liability Act 2002 (NSW), I agree that this waiver excludes, restricts and modifies any liability of Hard Clutch Pty Ltd, its instructors, employees, contractors and agents arising from breach of any express or implied warranty that the Activities will be provided with reasonable care and skill. This exclusion does not apply to the extent the law does not permit it to apply — including liability for reckless conduct or gross negligence, or where a non-excludable consumer guarantee applies under the Australian Consumer Law.</p>
      <p><strong>4. Release</strong></p>
      <p>I release and agree not to sue Hard Clutch Pty Ltd, its instructors, employees, contractors and agents for any injury, loss or damage arising out of my (or my child's) participation in the Activities, except to the extent caused by their reckless or grossly negligent conduct.</p>
      <p><strong>5. Health declaration</strong></p>
      <p>I confirm that I (or the participant named below) am, to the best of my knowledge, fit and healthy enough to participate in the Activities. I will notify the Academy of any medical condition, injury or disability that may affect safe participation, including:</p>
      <p><strong>6. Participants under 18</strong></p>
      <p>(To be completed by a parent or legal guardian if the participant is under 18 years of age.)</p>
      <p>I am the parent/legal guardian of the participant named below. I have explained the nature of the Activities and the risks described in section 1 to the participant, in terms appropriate to their age and understanding. I accept this risk warning and the terms of this waiver on the participant's behalf, and I confirm I have authority to do so.</p>
      <p><strong>7. Emergency contact and medical treatment</strong></p>
      <p>In the event of injury during the Activities, I authorise Academy staff to arrange any necessary first aid or emergency medical treatment, and to contact:</p>
    </div>
    <div class="mb-4">
      <label class="block font-semibold mb-1">Emergency contact name &amp; Phone</label>
      <input type="text" name="emergencyContact" class="w-full border border-gray-300 rounded px-3 py-2">
    </div>
    <div class="mb-4" data-required data-type="checkbox-group">
      <label class="flex items-center gap-2"><input type="checkbox" name="waiverAccepted" value="on"> I have read and agree to the waiver terms. *</label>
      <p class="wizard-error hidden text-red-600 text-sm mt-1">This is a required question</p>
    </div>
    <div class="mb-4" data-required data-type="text">
      <label class="block font-semibold mb-1">Your full name as a Signature *</label>
      <input type="text" name="signatureName" class="w-full border border-gray-300 rounded px-3 py-2">
      <p class="wizard-error hidden text-red-600 text-sm mt-1">This is a required question</p>
    </div>
    <div class="mb-4" data-required data-type="radio-group">
      <label class="block font-semibold mb-2">How did you hear about us? *</label>
      <label class="flex items-center gap-2 mb-1"><input type="radio" name="howHeard" value="Google"> Google</label>
      <label class="flex items-center gap-2 mb-1"><input type="radio" name="howHeard" value="Facebook"> Facebook</label>
      <label class="flex items-center gap-2 mb-1"><input type="radio" name="howHeard" value="Instagram"> Instagram</label>
      <label class="flex items-center gap-2 mb-1"><input type="radio" name="howHeard" value="YouTube"> YouTube</label>
      <label class="flex items-center gap-2 mb-1"><input type="radio" name="howHeard" value="小紅書"> 小紅書</label>
      <label class="flex items-center gap-2 mb-1"><input type="radio" name="howHeard" value="Friend"> Friend</label>
      <label class="flex items-center gap-2 mb-1"><input type="radio" name="howHeard" value="Existing member referral"> Existing member referral</label>
      <label class="flex items-center gap-2 mb-1"><input type="radio" name="howHeard" value="Community board"> Community board</label>
      <label class="flex items-center gap-2 mb-1">Other: <input type="text" name="howHeardOther" class="border border-gray-300 rounded px-2 py-1"></label>
      <p class="wizard-error hidden text-red-600 text-sm mt-1">This is a required question</p>
    </div>

    <div style="position: absolute; left: -9999px;" aria-hidden="true">
      <label>Website <input type="text" name="website" tabindex="-1" autocomplete="off"></label>
    </div>

    <p id="enroll-submit-error" class="hidden text-red-600 text-sm mb-3">Something went wrong submitting your form. Please try again, or contact us directly.</p>
    <button type="button" data-action="back" class="border border-gray-300 px-6 py-3 rounded font-semibold hover:bg-gray-50 mr-2">Back</button>
    <button type="button" data-action="submit" class="bg-red-600 px-6 py-3 rounded text-white font-semibold hover:bg-red-700">Submit</button>
  </div>

</div>
<script src="/assets/js/enroll-form.js" defer></script>
```

- [ ] **Step 2: Wire the include into `enroll.html`**

Replace `enroll.html:61-67` (the `<a href="https://docs.google.com/forms/...">Book a Free Trial</a>` block and the "Takes 2 minutes" paragraph directly below it) with:

```html
    {% include enroll-wizard.html %}
```

- [ ] **Step 3: Point the schedule cards at the in-page form**

On `enroll.html:85`, change:

```
{% include schedule-cards-en.html enroll_url="https://docs.google.com/forms/d/e/1FAIpQLSeNLhIwc0D4bmBNuAlrZ8p9-38qFTWtVmVwyIWaphRDmoXcfQ/viewform" new_window=true %}
```

to:

```
{% include schedule-cards-en.html enroll_url="#enroll-form" %}
```

- [ ] **Step 4: Point the sticky mobile CTA at the in-page form**

On `enroll.html:166-169`, change:

```html
    <a href="https://docs.google.com/forms/d/e/1FAIpQLSeNLhIwc0D4bmBNuAlrZ8p9-38qFTWtVmVwyIWaphRDmoXcfQ/viewform"
       target="_blank"
       class="bg-red-600 text-white font-bold px-5 py-3 rounded hover:bg-red-700 whitespace-nowrap">
      Book Free Trial &rarr;
    </a>
```

to:

```html
    <a href="#enroll-form"
       class="bg-red-600 text-white font-bold px-5 py-3 rounded hover:bg-red-700 whitespace-nowrap">
      Book Free Trial &rarr;
    </a>
```

- [ ] **Step 5: Verify step navigation, validation, and branching in the browser (no network dependency yet)**

Using the Claude Browser tool: `preview_start` with a local Jekyll server (`bundle exec jekyll serve`, or the project's existing dev command) and navigate to `/enroll.html`. Then:
- Click "Next" on step 1 with all fields empty → confirm "This is a required question" appears under Learner Name, Email, and Age Range, and the page does not advance.
- Fill Learner Name, Email, select Age Range `6-8` → click Next → confirm the "Parent / Guardian" step appears (not "Training Experience & Goals").
- Go Back, change Age Range to `25-30` → click Next → confirm it skips straight to "Training Experience & Goals" (Parent/Guardian step is not shown).
- Step through to the Waiver step, confirm the full legal text renders, confirm clicking "Submit" with the acknowledgement checkbox unchecked shows the required-field error and does not submit.

Expected: all of the above pass. This step does not require the real Apps Script URL yet — it only exercises client-side navigation/validation.

- [ ] **Step 6: Commit**

```bash
git add _includes/enroll-wizard.html enroll.html
git commit -m "feat: replace enrollment Google Form with in-page wizard on enroll.html"
```

---

### Task 4: Create the English thank-you page

**Files:**
- Create: `thank-you.html`

**Interfaces:**
- Consumes: `gtag` global function, already defined in `_layouts/default.html`'s `<head>`.
- Produces: nothing consumed elsewhere in the repo — `enroll-form.js` redirects to it by relative path (`thank-you.html`), not by importing anything from it.

- [ ] **Step 1: Write `thank-you.html`**

```html
---
layout: default
title: "Thanks for Enrolling | Tse Kung Fu Academy"
permalink: /thank-you.html
noindex: true
meta:
  description: "Thank you for enrolling in a free trial class at Tse Kung Fu Academy."
---

  <div class="max-w-2xl mx-auto px-4 py-16 text-center">
    <h1 class="text-3xl font-bold mb-4">Thanks — you're booked in!</h1>
    <p class="text-lg text-gray-700 mb-8">We've received your enrollment and will contact you shortly with your trial class details.</p>
    <a href="/index.html" class="text-blue-600 hover:underline">Back to homepage</a>
  </div>

  <script>
    gtag('event', 'generate_lead');
  </script>
```

- [ ] **Step 2: Verify the page renders**

Using the Claude Browser tool, navigate to `/thank-you.html` on the local Jekyll server. Confirm the heading and back-link render, and confirm via `read_network_requests` (filter on `google-analytics` or `collect`) that a GA4 beacon request fires containing `en=generate_lead`.

- [ ] **Step 3: Commit**

```bash
git add thank-you.html
git commit -m "feat: add enrollment thank-you page with GA4 generate_lead event"
```

---

### Task 5: Wire in the real Apps Script URL and verify the English flow end-to-end

**Files:**
- Modify: `assets/js/enroll-form.js:2` (the `APPS_SCRIPT_URL` constant)

**Interfaces:**
- Consumes: the deployed URL from Task 1, Step 3.

- [ ] **Step 1: Confirm the Apps Script URL has been received**

Do not proceed until Task 1 is complete and a real `.../exec` URL is in hand.

- [ ] **Step 2: Update the constant**

In `assets/js/enroll-form.js`, change:

```javascript
var APPS_SCRIPT_URL = 'REPLACE_WITH_DEPLOYED_APPS_SCRIPT_URL';
```

to the real deployed URL.

- [ ] **Step 3: Verify the adult path end-to-end in the browser**

Using the Claude Browser tool on the local Jekyll server:
- Navigate to `/enroll.html`, fill Basic Info with a test name/email and Age Range `25-30`, click Next (confirms Parent/Guardian is skipped), fill Training Goals, Availability, and the Waiver step (check the acknowledgement box, fill a signature name, pick "How did you hear about us").
- Click Submit.
- Use `read_network_requests` to find the POST to the Apps Script URL and confirm the response body is `{"success":true}` (or similar with `success: true`).
- Confirm the browser navigated to `/thank-you.html`.
- Confirm (via `read_network_requests`) the GA4 `generate_lead` beacon fired on the thank-you page.

Expected: all of the above pass.

- [ ] **Step 4: Verify the minor path end-to-end in the browser**

Repeat Step 3, but select Age Range `6-8`, confirm the Parent/Guardian step appears and is required, fill it, and confirm the rest of the flow (including the Apps Script POST, JSON success response, and redirect) behaves identically.

- [ ] **Step 5: Verify failure handling**

Temporarily change `APPS_SCRIPT_URL` to an invalid URL (e.g. append `x` to the path), reload, submit a complete form, and confirm: the inline error banner (`#enroll-submit-error`) appears, the page does **not** redirect to `/thank-you.html`, and no GA4 event fires. Then restore the correct URL.

- [ ] **Step 6: Commit**

```bash
git add assets/js/enroll-form.js
git commit -m "feat: wire enrollment form to deployed Apps Script endpoint"
```

---

### Task 6: Replicate the wizard on zh/enroll.html

**Files:**
- Modify: `zh/enroll.html:67-73` (CTA block), `zh/enroll.html:83-84` (schedule-cards `enroll_url`), `zh/enroll.html:171-175` (sticky mobile CTA)
- Create: `zh/thank-you.html`

**Interfaces:**
- Consumes: `_includes/enroll-wizard.html` (Task 3) and `assets/js/enroll-form.js` (Tasks 2 & 5) unchanged — no zh-specific version needed, since the form itself stays English per the Global Constraints.

- [ ] **Step 1: Replace the CTA block**

Replace `zh/enroll.html:67-73` (the `<a href="https://docs.google.com/forms/...">立即預約免費試堂</a>` block and the "只需兩分鐘" paragraph below it) with:

```html
    {% include enroll-wizard.html %}
```

- [ ] **Step 2: Point the schedule cards at the in-page form**

Change `zh/enroll.html:83-84` from:

```
{% include schedule-cards-zh.html enroll_url="https://docs.google.com/forms/d/e/1FAIpQLSeNLhIwc0D4bmBNuAlrZ8p9-38qFTWtVmVwyIWaphRDmoXcfQ/viewform" 
  new_window=true %}
```

to:

```
{% include schedule-cards-zh.html enroll_url="#enroll-form" %}
```

- [ ] **Step 3: Point the sticky mobile CTA at the in-page form**

Change `zh/enroll.html:171-175` from:

```html
  <a href="https://docs.google.com/forms/d/e/1FAIpQLSeNLhIwc0D4bmBNuAlrZ8p9-38qFTWtVmVwyIWaphRDmoXcfQ/viewform"
     target="_blank"
     class="bg-red-600 text-white font-bold px-5 py-3 rounded hover:bg-red-700 whitespace-nowrap">
    預約免費試堂 &rarr;
  </a>
```

to:

```html
  <a href="#enroll-form"
     class="bg-red-600 text-white font-bold px-5 py-3 rounded hover:bg-red-700 whitespace-nowrap">
    預約免費試堂 &rarr;
  </a>
```

- [ ] **Step 4: Create `zh/thank-you.html`**

```html
---
layout: default
title: "多謝報名 | 謝氏蔡李佛武館"
permalink: /zh/thank-you.html
noindex: true
meta:
  description: "多謝報名悉尼功夫班免費試堂。"
---

  <div class="max-w-2xl mx-auto px-4 py-16 text-center">
    <h1 class="text-3xl font-bold mb-4">多謝報名！</h1>
    <p class="text-lg text-gray-700 mb-8">我們已收到你的報名，稍後會聯絡你確認試堂詳情。</p>
    <a href="/index.html" class="text-blue-600 hover:underline">返回主頁</a>
  </div>

  <script>
    gtag('event', 'generate_lead');
  </script>
```

- [ ] **Step 5: Verify in the browser**

Repeat Task 5's Step 3 verification (adult path, POST succeeds, redirect, GA4 beacon) against `/zh/enroll.html` and `/zh/thank-you.html`. The wizard form itself stays in English; only the surrounding page copy is Chinese — confirm this matches (i.e. don't flag it as a bug).

- [ ] **Step 6: Commit**

```bash
git add zh/enroll.html zh/thank-you.html
git commit -m "feat: replace enrollment Google Form with in-page wizard on zh/enroll.html"
```

---

### Task 7: Replicate the wizard on zh-CN/enroll.html

**Files:**
- Modify: `zh-CN/enroll.html:67-73` (CTA block), `zh-CN/enroll.html:84` (schedule-cards `enroll_url`), `zh-CN/enroll.html:171-175` (sticky mobile CTA)
- Create: `zh-CN/thank-you.html`

**Interfaces:**
- Consumes: `_includes/enroll-wizard.html` (Task 3) and `assets/js/enroll-form.js` (Tasks 2 & 5) unchanged, same as Task 6.

- [ ] **Step 1: Replace the CTA block**

Replace `zh-CN/enroll.html:67-73` (the `<a href="https://docs.google.com/forms/...">立即预约免费试课</a>` block and the "只需两分钟" paragraph below it) with:

```html
    {% include enroll-wizard.html %}
```

- [ ] **Step 2: Point the schedule cards at the in-page form**

Change `zh-CN/enroll.html:84` from:

```
{% include schedule-cards-zh-CN.html enroll_url="https://docs.google.com/forms/d/e/1FAIpQLSeNLhIwc0D4bmBNuAlrZ8p9-38qFTWtVmVwyIWaphRDmoXcfQ/viewform" new_window=true %}
```

to:

```
{% include schedule-cards-zh-CN.html enroll_url="#enroll-form" %}
```

- [ ] **Step 3: Point the sticky mobile CTA at the in-page form**

Change `zh-CN/enroll.html:171-175` from:

```html
  <a href="https://docs.google.com/forms/d/e/1FAIpQLSeNLhIwc0D4bmBNuAlrZ8p9-38qFTWtVmVwyIWaphRDmoXcfQ/viewform"
     target="_blank"
     class="bg-red-600 text-white font-bold px-5 py-3 rounded hover:bg-red-700 whitespace-nowrap">
    预约免费试课 &rarr;
  </a>
```

to:

```html
  <a href="#enroll-form"
     class="bg-red-600 text-white font-bold px-5 py-3 rounded hover:bg-red-700 whitespace-nowrap">
    预约免费试课 &rarr;
  </a>
```

- [ ] **Step 4: Create `zh-CN/thank-you.html`**

```html
---
layout: default
title: "多谢报名 | 谢氏蔡李佛武馆"
permalink: /zh-CN/thank-you.html
noindex: true
meta:
  description: "多谢报名悉尼功夫班免费试课。"
---

  <div class="max-w-2xl mx-auto px-4 py-16 text-center">
    <h1 class="text-3xl font-bold mb-4">多谢报名！</h1>
    <p class="text-lg text-gray-700 mb-8">我们已收到你的报名，稍后会联系你确认试课详情。</p>
    <a href="/index.html" class="text-blue-600 hover:underline">返回主页</a>
  </div>

  <script>
    gtag('event', 'generate_lead');
  </script>
```

- [ ] **Step 5: Verify in the browser**

Repeat Task 5's Step 3 verification against `/zh-CN/enroll.html` and `/zh-CN/thank-you.html`.

- [ ] **Step 6: Commit**

```bash
git add zh-CN/enroll.html zh-CN/thank-you.html
git commit -m "feat: replace enrollment Google Form with in-page wizard on zh-CN/enroll.html"
```

---

### Task 8: Fix Google Form references on kids-school-holiday-activities-sydney.html

**Files:**
- Modify: `kids-school-holiday-activities-sydney.html` (7 locations: lines 29, 108, 169, 274, 293, 395, 456)

**Interfaces:**
- Consumes: `/enroll.html#enroll-form` as the new destination (the wizard built in Task 3).

This page currently sends its "Book a Free Trial" traffic straight to the old Google Form, bypassing `enroll.html` entirely — left alone, ad clicks landing here would still be untracked even after Tasks 1–7 are done.

- [ ] **Step 1: Fix the four plain CTA links**

At lines 29-32, 108-111, 274-277, and 293-296, each follows the pattern:

```html
<a href="https://docs.google.com/forms/d/e/1FAIpQLSeNLhIwc0D4bmBNuAlrZ8p9-38qFTWtVmVwyIWaphRDmoXcfQ/viewform"
   target="_blank"
   class="...">
  ...button text...
</a>
```

For each, change the `href` to `/enroll.html#enroll-form` and remove the `target="_blank"` line entirely (the button text and `class` attribute stay exactly as they are). For example, line 29 becomes:

```html
<a href="/enroll.html#enroll-form"
   class="bg-red-600 px-8 py-4 rounded text-white font-bold text-xl hover:bg-red-700 inline-block w-full text-center mb-3">
```

- [ ] **Step 2: Fix the schedule-cards include**

At line 169, change:

```
{% include schedule-cards-en.html filter="kids" enroll_url="https://docs.google.com/forms/d/e/1FAIpQLSeNLhIwc0D4bmBNuAlrZ8p9-38qFTWtVmVwyIWaphRDmoXcfQ/viewform" new_window=true %}
```

to:

```
{% include schedule-cards-en.html filter="kids" enroll_url="/enroll.html#enroll-form" %}
```

- [ ] **Step 3: Fix the JSON-LD schema reference**

At line 395, change:

```json
"url": "https://docs.google.com/forms/d/e/1FAIpQLSeNLhIwc0D4bmBNuAlrZ8p9-38qFTWtVmVwyIWaphRDmoXcfQ/viewform",
```

to:

```json
"url": "https://sydneykungfu.au/enroll.html",
```

- [ ] **Step 4: Fix the sticky mobile CTA**

At lines 456-459, change:

```html
<a href="https://docs.google.com/forms/d/e/1FAIpQLSeNLhIwc0D4bmBNuAlrZ8p9-38qFTWtVmVwyIWaphRDmoXcfQ/viewform"
   target="_blank"
   class="bg-red-600 text-white font-bold px-5 py-3 rounded hover:bg-red-700 whitespace-nowrap">
  Book Free Trial &rarr;
```

to:

```html
<a href="/enroll.html#enroll-form"
   class="bg-red-600 text-white font-bold px-5 py-3 rounded hover:bg-red-700 whitespace-nowrap">
  Book Free Trial &rarr;
```

- [ ] **Step 5: Verify no references remain**

Run: `grep -n "docs.google.com/forms" kids-school-holiday-activities-sydney.html`
Expected: no output.

- [ ] **Step 6: Verify in the browser**

Navigate to `/kids-school-holiday-activities-sydney.html` on the local Jekyll server, click each "Book a Free Trial" CTA, and confirm each one navigates to `/enroll.html#enroll-form` (same tab, scrolled to the wizard) rather than opening the Google Form in a new tab.

- [ ] **Step 7: Commit**

```bash
git add kids-school-holiday-activities-sydney.html
git commit -m "fix: point kids holiday page CTAs at tracked enrollment form"
```

---

### Task 9: Final regression pass

**Files:** None (verification only).

- [ ] **Step 1: Confirm no Google Form references remain anywhere in scope**

Run: `grep -rn "docs.google.com/forms" enroll.html zh/enroll.html zh-CN/enroll.html kids-school-holiday-activities-sydney.html`
Expected: no output.

- [ ] **Step 2: Spot-check the mobile sticky CTA on all 3 enroll pages**

Using the Claude Browser tool, `resize_window` to the `mobile` preset, load `/enroll.html`, `/zh/enroll.html`, `/zh-CN/enroll.html` in turn, click the sticky bottom CTA on each, and confirm it scrolls to `#enroll-form` rather than opening a new tab.

- [ ] **Step 3: Confirm the GA4 event fires on all 3 thank-you pages**

For each of `/thank-you.html`, `/zh/thank-you.html`, `/zh-CN/thank-you.html`, navigate directly (no need to resubmit the full form again) and use `read_network_requests` to confirm a `generate_lead` beacon fires.

- [ ] **Step 4: Report back to the site owner**

Summarize: what was verified, and the two remaining manual steps that are entirely theirs (mark `generate_lead` as a GA4 Key Event; import it as a Google Ads conversion action) — these don't block anything already done, but the conversion won't show up in Google Ads until they're completed.
