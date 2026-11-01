var SHEET_NAME = 'Website Enrollments';
var CLASS_REQUEST_SHEET_NAME = 'Class Requests';
var TRIAL_SHEET_NAME = 'Trial Bookings';
var SPAM_SHEET_NAME = 'Suspected Spam';
var HONEYPOT_FIELD = 'website';
var NOTIFY_EMAIL = 'sydney.kungfu.chi@gmail.com';

function doPost(e) {
  var data = JSON.parse(e.postData.contents);

  if (data[HONEYPOT_FIELD]) {
    logSpam(data);
    return jsonResponse({ success: true });
  }

  if (data.formType === 'class-request') {
    return handleClassRequest(data);
  }

  if (data.formType === 'trial') {
    return handleTrialBooking(data);
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
    safe(data.sourcePage),
    safe(data.learnerName),
    safe(data.email),
    safe(data.contactNo),
    safe(data.ageRange),
    safe(data.parentGuardianName),
    safe(data.parentGuardianContact),
    safe(data.interests),
    safe(data.priorExperience),
    safe(data.availability),
    data.waiverAccepted,
    safe(data.signatureName),
    safe(data.emergencyContact),
    safe(data.howHeard)
  ]);

  notifyNewEnrollment(data);

  return jsonResponse({ success: true });
}

function notifyNewEnrollment(data) {
  try {
    var subject = 'New enrollment: ' + data.learnerName;
    var body = 'A new enrollment was just submitted.\n\n' +
      'Learner: ' + data.learnerName + '\n' +
      'Email: ' + data.email + '\n' +
      'Contact No.: ' + (data.contactNo || '-') + '\n' +
      'Age Range: ' + data.ageRange + '\n' +
      'Parent/Guardian: ' + (data.parentGuardianName || '-') + ' / ' + (data.parentGuardianContact || '-') + '\n' +
      'Interests: ' + data.interests + '\n' +
      'Prior Experience: ' + data.priorExperience + '\n' +
      'Availability: ' + data.availability + '\n' +
      'Emergency Contact: ' + (data.emergencyContact || '-') + '\n' +
      'How they heard about us: ' + data.howHeard + '\n\n' +
      'Full entry saved in the "Website Enrollments" sheet tab.';
    MailApp.sendEmail(NOTIFY_EMAIL, subject, body);
    console.log('Notification email sent to ' + NOTIFY_EMAIL);
  } catch (err) {
    console.error('Mail notification failed: ' + err);
  }
}

function testMail() {
  notifyNewEnrollment({
    learnerName: 'Test Learner',
    email: 'test@example.com',
    contactNo: '0400000000',
    ageRange: '25-30',
    parentGuardianName: '',
    parentGuardianContact: '',
    interests: 'Self-defense',
    priorExperience: 'No, I am a complete beginner',
    availability: 'Private Class',
    emergencyContact: '',
    howHeard: 'Google'
  });
}

function handleTrialBooking(data) {
  var required = ['learnerName', 'contactNo'];
  for (var i = 0; i < required.length; i++) {
    if (!data[required[i]]) {
      return jsonResponse({ success: false, error: 'Missing required field: ' + required[i] });
    }
  }

  var sheet = getOrCreateTrialSheet();
  sheet.appendRow([
    new Date(),
    safe(data.sourcePage),
    safe(data.learnerName),
    safe(data.contactNo),
    safe(data.email),
    safe(data.availability),
    safe(data.message),
    safe(data.howHeard)
  ]);

  notifyNewTrialBooking(data);

  return jsonResponse({ success: true });
}

function notifyNewTrialBooking(data) {
  try {
    var subject = 'New free trial booking: ' + data.learnerName;
    var body = 'A new free trial class booking was just submitted.\n\n' +
      'Name: ' + data.learnerName + '\n' +
      'Mobile: ' + data.contactNo + '\n' +
      'Email: ' + (data.email || '-') + '\n' +
      'Class: ' + (data.availability || '-') + '\n' +
      'Message: ' + (data.message || '-') + '\n' +
      'How they heard about us: ' + (data.howHeard || '-') + '\n' +
      'Page: ' + (data.sourcePage || '-') + '\n\n' +
      'Text them to confirm. Full entry saved in the "Trial Bookings" sheet tab.';
    MailApp.sendEmail(NOTIFY_EMAIL, subject, body);
    console.log('Notification email sent to ' + NOTIFY_EMAIL);
  } catch (err) {
    console.error('Mail notification failed: ' + err);
  }
}

function testTrialMail() {
  notifyNewTrialBooking({
    learnerName: 'Test Trial',
    contactNo: '0400000000',
    email: '',
    availability: 'Outside PCYC Hornsby - Tuesday 7:15-8:15pm (Adult Class)',
    message: 'I am a complete beginner',
    howHeard: 'Google',
    sourcePage: '/kungfu-classes-adults-hornsby.html'
  });
}

function handleClassRequest(data) {
  var required = ['name', 'email', 'ageRange', 'suburb', 'preferredDays', 'preferredTime'];
  for (var i = 0; i < required.length; i++) {
    if (!data[required[i]]) {
      return jsonResponse({ success: false, error: 'Missing required field: ' + required[i] });
    }
  }

  var sheet = getOrCreateClassRequestSheet();
  sheet.appendRow([
    new Date(),
    safe(data.sourcePage),
    safe(data.name),
    safe(data.email),
    safe(data.phone),
    safe(data.ageRange),
    safe(data.suburb),
    safe(data.preferredDays),
    safe(data.preferredTime),
    safe(data.notes)
  ]);

  notifyNewClassRequest(data);

  return jsonResponse({ success: true });
}

function notifyNewClassRequest(data) {
  try {
    var subject = 'New class request: ' + data.name;
    var body = 'A new class location/time request was just submitted.\n\n' +
      'Name: ' + data.name + '\n' +
      'Email: ' + data.email + '\n' +
      'Phone: ' + (data.phone || '-') + '\n' +
      'Age Range: ' + data.ageRange + '\n' +
      'Suburb: ' + data.suburb + '\n' +
      'Preferred Days: ' + data.preferredDays + '\n' +
      'Preferred Time: ' + data.preferredTime + '\n' +
      'Notes: ' + (data.notes || '-') + '\n\n' +
      'Full entry saved in the "Class Requests" sheet tab.';
    MailApp.sendEmail(NOTIFY_EMAIL, subject, body);
    console.log('Notification email sent to ' + NOTIFY_EMAIL);
  } catch (err) {
    console.error('Mail notification failed: ' + err);
  }
}

function testClassRequestMail() {
  notifyNewClassRequest({
    name: 'Test Requester',
    email: 'test@example.com',
    phone: '0400000000',
    ageRange: '25-30',
    suburb: 'Chatswood',
    preferredDays: 'Monday, Wednesday',
    preferredTime: 'Evening',
    notes: ''
  });
}

function safe(value) {
  value = value || '';
  return /^[=+\-@]/.test(value) ? "'" + value : value;
}

function logSpam(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SPAM_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SPAM_SHEET_NAME);
    sheet.appendRow(['Timestamp', 'Raw Data']);
  }
  sheet.appendRow([new Date(), JSON.stringify(data)]);
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

function getOrCreateTrialSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(TRIAL_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(TRIAL_SHEET_NAME);
    sheet.appendRow([
      'Timestamp', 'Source Page', 'Name', 'Mobile', 'Email', 'Class', 'Message', 'How Heard'
    ]);
  }
  return sheet;
}

function getOrCreateClassRequestSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(CLASS_REQUEST_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(CLASS_REQUEST_SHEET_NAME);
    sheet.appendRow([
      'Timestamp', 'Source Page', 'Name', 'Email', 'Phone', 'Age Range',
      'Suburb', 'Preferred Days', 'Preferred Time', 'Notes'
    ]);
  }
  return sheet;
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
