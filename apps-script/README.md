# Apps Script webhook

`Code.gs` is the source of truth for the Google Apps Script Web App that both the
enrollment form (`enroll-wizard.html` / `enroll-form.js`) and the class-request form
(`request-class-form.html` / `request-class-form.js`) POST to. It's tracked here for
history and review, but **deployed manually** — no `clasp`, no CI.

## Deploying a change

1. Open the Apps Script project at script.google.com (bound to the "Website
   Enrollments" Google Sheet).
2. Replace the contents of `Code.gs` in the script editor with this file's contents.
3. **Deploy → Manage deployments → Edit (pencil icon) → Version: New version → Deploy.**
   This keeps the existing Web App URL, so `enroll-form.js` and `request-class-form.js`
   don't need to change. Do **not** create a brand-new deployment — that generates a
   different URL.

## What's in here

- Enrollment submissions (`enroll-wizard.html`) append to the **Website Enrollments**
  sheet tab and email `NOTIFY_EMAIL`.
- Class-request submissions (`request-a-class.html`, sent with `formType:
  'class-request'`) append to a separate **Class Requests** sheet tab (created
  automatically on first submission) and also email `NOTIFY_EMAIL`.
- Both paths share the same honeypot spam check, logging suspected spam to the
  **Suspected Spam** tab instead of processing it.
