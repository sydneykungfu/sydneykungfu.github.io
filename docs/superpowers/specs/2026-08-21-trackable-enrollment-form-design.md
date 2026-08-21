# Trackable Enrollment Form — Design

## Problem

`enroll.html` (and its `zh/` and `zh-CN/` equivalents) link out to a Google Form for new-student enrollment. Because the form lives on `docs.google.com`, the site's existing GA4 (`G-PXVEYWLYKY`) and Google Ads (`AW-17281374397`) tags — loaded sitewide via [`_layouts/default.html`](../../../_layouts/default.html) — can never see a submission happen. There is currently no way to measure enrollment conversions from ad spend or organic traffic.

## Current state

### Analytics already in place
GA4, Google Ads, and GTM are all already wired into every page via `gtag.js` in `_layouts/default.html`. No new tag infrastructure is needed — the gap is purely that the form submission event happens outside the site's domain.

### The Google Form is not a simple lead form
Inspecting the live form revealed a 5-section flow with real branching logic, not a flat set of fields:

1. **Basic Info** — Learner Name*, Email Address*, Contact No. (optional), Age Range* (radio, 12 brackets from 3–5 to 61+)
2. **Parent / Guardian** *(conditional — shown only if Age Range is a minor bracket: 3–5 through 15–17)* — Parent/Guardian Name*, Parent/Guardian Contact No.* (for emergency purposes)
3. **Training Experience & Goals** — main interests* (checkbox, multi-select + "Other"), prior martial arts experience* (radio: beginner / CLF experience / other styles)
4. **Availability** — preferred days/times* (checkbox, multi-select + "Other")
5. **Martial Arts Training Waiver** — a full legal liability waiver referencing the NSW *Civil Liability Act 2002*, naming the business entity (Hard Clutch Pty Ltd, trading as Tse Kung Fu Academy) and its ABN, with an explicit "participants under 18" parent/guardian consent clause; an emergency contact field; an acknowledgement checkbox*; a typed full name acting as an e-signature*; and "how did you hear about us?"* (radio)

This means the form is doubling as a **signed legal waiver**, not just a lead-capture form. That materially raises the bar on data-loss risk: a silently-failed submission here isn't just a missed lead, it's someone believing they've signed a liability waiver that was never recorded.

### Current submission workflow
Responses currently land in a linked Google Sheet, which is how enrollments are checked today. This workflow should be preserved.

### Reuse elsewhere
The same Google Form URL is also linked from `kids-school-holiday-activities-sydney.html`, in two places directly and once via a hardcoded `enroll_url` override passed into the shared `schedule-cards-en.html` include — bypassing `enroll.html` entirely.

## Approaches considered and rejected

- **Click-intent proxy** (fire a GA event on the "Book a Free Trial" click instead of tracking real submissions) — rejected: overcounts, since not everyone who opens the form finishes it. The user explicitly wants real submission tracking.
- **Google Form confirmation page links to a thank-you page** — rejected: relies on the user manually clicking a second link after submitting, which most people won't do. Undercounts badly.
- **Third-party form tool (e.g. Tally.so) with native redirect-on-submit** — rejected: introduces a new vendor dependency and moves data off Google Sheets by default, for no real benefit over the free, fully-Google-stack alternative below.
- **Direct POST to Google's `formResponse` endpoint** (bypassing Apps Script, submitting straight into the existing Google Form via its internal `entry.NNNNNNNN` field IDs) — rejected: this endpoint returns no CORS-readable response, so success can never be confirmed client-side (it's inherently a blind/fire-and-forget POST). The `entry.NNNNNNNN` IDs are also undocumented and can silently change if the Google Form is ever edited. Both are unacceptable given the waiver signature this form carries — a silent failure here has real consequences.

## Chosen approach

Replace the Google Forms link on all three enroll pages with a native, in-page multi-step form. On submit, it POSTs to a Google Apps Script Web App (deployed by the site owner, code owned by us, response readable), which appends a row to the existing Google Sheet and returns a real success/failure response. Only on confirmed success does the browser redirect to a new `thank-you.html` on the site's own domain, where GA4/Ads can finally observe the conversion.

## Architecture & data flow

Each of `enroll.html`, `zh/enroll.html`, `zh-CN/enroll.html` gets a 5-step wizard form (mirroring the Google Form's own structure and pacing) built with `/assets/js/enroll-form.js`, shared across all three pages:

1. **Basic Info** — Learner Name*, Email*, Contact No. (optional), Age Range* (radio: `3--5`, `6-8`, `9-11`, `12-14`, `15-17`, `18-24`, `25-30`, `31-40`, `41-45`, `46-50`, `51-60`, `61+`)
2. **Parent/Guardian** *(shown/hidden client-side based on the Age Range selection — no page reload, no server round-trip)* — Parent/Guardian Name*, Parent/Guardian Contact No.*
3. **Training Experience & Goals** — main interests* (checkbox, multi-select: Self-defense / Traditional forms & techniques / Weapons training (Wooden Staff, Broadsword, etc.) / Sparring & combat applications / Strength & fitness / Other); prior experience* (radio: No, I am a complete beginner / Yes, I have some experience in Choy Lee Fut only / Yes, I have trained in other styles)
4. **Availability** — preferred days/times* (checkbox, multi-select: Marsfield Park - Saturday 9:30-11:30AM / Marsfield Park - Saturday 11:45-12:45PM / Outside PCYC Waitara - Tuesday 6:00-7:00pm / Private Class / Other)
5. **Waiver** — legal text copied verbatim from the current Google Form (see Appendix, not paraphrased or rewritten), Emergency contact name & Phone (optional), acknowledgement checkbox* ("I have read and agree to the waiver terms."), typed full name as signature*, "how did you hear about us?"* (radio: Google / Facebook / Instagram / YouTube / 小紅書 / Friend / Existing member referral / Community board / Other)

Each step validates its own required fields before allowing "Next," mirroring the current Google Forms behavior.

On final submit:
1. `fetch()` POSTs all collected fields to a single shared Apps Script Web App URL.
2. The Apps Script appends a row to the existing Sheet (all fields + timestamp + source page/language) and returns a real JSON response.
3. The client reads that response. **Only on confirmed success** does it redirect to `/thank-you.html` (+ `/zh/thank-you.html`, `/zh-CN/thank-you.html`).
4. The thank-you page fires `gtag('event', 'generate_lead', {...})`. This is the only GA/Ads-visible signal needed — Google Ads is already linked to this GA4 property, so it pulls the conversion via GA4 import rather than needing its own separate `AW-XXX/LABEL` tag on the page.

## Components

**New:**
- `/assets/js/enroll-form.js` — shared wizard UI + submit logic
- One Google Apps Script project, deployed manually via script.google.com (not `clasp`, not repo-tracked — kept simple per the site owner's preference)
- `thank-you.html`, `zh/thank-you.html`, `zh-CN/thank-you.html`

**Edited:**
- `enroll.html`, `zh/enroll.html`, `zh-CN/enroll.html` — Google Forms link/button and sticky mobile CTA replaced with the on-page wizard form
- `kids-school-holiday-activities-sydney.html` — hardcoded `enroll_url` overrides pointed back to `/enroll.html` so that traffic doesn't leak past tracking

## Error handling

- Per-step required-field validation before advancing, mirroring the current Google Forms "This is a required question" behavior.
- On submit, a confirmed failure (bad response or network error) shows an inline error, preserves entered data, and does **not** redirect — so nothing is lost silently and no false conversion fires.
- A hidden honeypot field guards the public Apps Script endpoint against basic spam bots.

## Testing / verification

Before handover, verification is performed directly (not left as a manual checklist for the site owner) using the Claude Browser tool:

- Submit the **adult path** (Age Range 18+, Parent/Guardian step skipped) end-to-end and confirm the row lands correctly in the Sheet.
- Submit the **minor path** (Age Range under 18, Parent/Guardian step shown and required) end-to-end and confirm that row too, including the waiver acknowledgement and signature.
- Inspect the actual outgoing network request on `/thank-you.html` to confirm the GA4 `generate_lead` event fires — verified via the real outgoing gtag beacon request, not by logging into the GA4 dashboard.
- Simulate a failed submission (e.g. a temporarily bad Apps Script URL) and confirm the inline error shows, with no redirect and no false conversion.

No automated test suite — this is a static Jekyll site with no existing tests, so this follows that convention rather than introducing one.

## Manual setup (site owner)

1. **Deploy the Apps Script as a Web App** via script.google.com, and hand its URL back for `enroll-form.js`. **This needs to happen early, mid-implementation** — the headless testing above needs a real, already-deployed endpoint to test against, so this can't be deferred to a final handover step.
2. Mark `generate_lead` as a **Key Event** in GA4 (Admin → Events). Can be done any time, including after handover.
3. In Google Ads: Tools & Settings → Conversions → New conversion action → Google Analytics 4 properties → import the `generate_lead` key event. Can be done any time, including after handover.

Steps 2 and 3 only change how GA4/Ads *treat* the event after the fact — they don't affect whether the event fires, so they don't block verification.

## Appendix: verbatim waiver text

Captured directly from the live Google Form on 2026-08-21. This is the exact text to be reproduced on the Waiver step — not paraphrased.

> **Martial Arts Training Waiver**
>
> RISK WARNING, WAIVER AND RELEASE — TSE KUNG FU ACADEMY
>
> (Hard Clutch Pty Ltd, ABN 34 678 262 809, trading as Tse Kung Fu Academy)
>
> **1. Nature of the activity and risks**
>
> Tse Kung Fu Academy provides Choy Lee Fut Kung Fu classes and related activities, including adult and children's classes and childcare incursions ("the Activities"). Participation in the Activities involves inherent risks, including but not limited to:
>
> - Impact injury from striking, blocking, sparring or partner drills
> - Sprains, strains, joint injury and muscle soreness
> - Falls, collisions and contact with other participants or equipment
> - Concussion or other head injury
> - Aggravation of pre-existing injuries or medical conditions
> - Injury arising from the outdoor park locations used for classes (uneven ground, weather exposure)
>
> This is a general description of risk and is not exhaustive. By signing this form, you acknowledge that you have read and understood this risk warning, and that it constitutes a formal risk warning for the purposes of section 5M of the Civil Liability Act 2002 (NSW) and equivalent provisions in other States or Territories where applicable.
>
> **2. Voluntary participation and assumption of risk**
>
> I voluntarily choose to participate (or to allow the person named below to participate) in the Activities, in full knowledge of the risks described above, and I accept those risks.
>
> **3. Exclusion of liability**
>
> To the maximum extent permitted by law, including under section 5N of the Civil Liability Act 2002 (NSW), I agree that this waiver excludes, restricts and modifies any liability of Hard Clutch Pty Ltd, its instructors, employees, contractors and agents arising from breach of any express or implied warranty that the Activities will be provided with reasonable care and skill. This exclusion does not apply to the extent the law does not permit it to apply — including liability for reckless conduct or gross negligence, or where a non-excludable consumer guarantee applies under the Australian Consumer Law.
>
> **4. Release**
>
> I release and agree not to sue Hard Clutch Pty Ltd, its instructors, employees, contractors and agents for any injury, loss or damage arising out of my (or my child's) participation in the Activities, except to the extent caused by their reckless or grossly negligent conduct.
>
> **5. Health declaration**
>
> I confirm that I (or the participant named below) am, to the best of my knowledge, fit and healthy enough to participate in the Activities. I will notify the Academy of any medical condition, injury or disability that may affect safe participation, including:
>
> **6. Participants under 18**
>
> (To be completed by a parent or legal guardian if the participant is under 18 years of age.)
>
> I am the parent/legal guardian of the participant named below. I have explained the nature of the Activities and the risks described in section 1 to the participant, in terms appropriate to their age and understanding. I accept this risk warning and the terms of this waiver on the participant's behalf, and I confirm I have authority to do so.
>
> **7. Emergency contact and medical treatment**
>
> In the event of injury during the Activities, I authorise Academy staff to arrange any necessary first aid or emergency medical treatment, and to contact:
