import { NextResponse } from 'next/server';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

const HS_TOKEN        = process.env.HUBSPOT_TOKEN;
const HS_PORTAL_ID    = process.env.HUBSPOT_PORTAL_ID    || '3925227';
const HS_FORM_GUID    = process.env.HUBSPOT_FORM_GUID    || '325ed46c-382b-4d0e-89f3-6b17bf81df6e';

const MJ_API_KEY      = process.env.MAILJET_API_KEY      || 'bbbbe6000d4db8179e4eafaa9b1c432b';
const MJ_SECRET_KEY   = process.env.MAILJET_SECRET_KEY   || 'c72154c82ee4e1577e536302fb38e7a1';

const JFROG_URL       = process.env.JFROG_URL            || 'https://acemq.jfrog.io';
const JFROG_TOKEN     = process.env.JFROG_ACCESS_TOKEN;

const JIRA_BASE_URL       = process.env.JIRA_BASE_URL        || 'https://acemq.atlassian.net';
const JIRA_EMAIL_ADDR     = process.env.JIRA_EMAIL;
const JIRA_API_TOKEN      = process.env.JIRA_API_TOKEN;
const JIRA_SERVICE_DESK_ID = process.env.JIRA_SERVICE_DESK_ID || '1';

const HS_BASE = 'https://api.hubapi.com';

// ─────────────────────────────────────────────────────────────────────────────
// HubSpot helpers
// ─────────────────────────────────────────────────────────────────────────────

async function hsGet(path) {
  const r = await fetch(`${HS_BASE}${path}`, {
    headers: { Authorization: `Bearer ${HS_TOKEN}`, 'Content-Type': 'application/json' },
  });
  if (!r.ok) return null;
  return r.json();
}

async function hsPost(path, body) {
  const r = await fetch(`${HS_BASE}${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${HS_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const text = await r.text();
  try { return JSON.parse(text); } catch { return { _raw: text }; }
}

async function upsertContact(submitter, company) {
  const email = submitter.email.toLowerCase().trim();

  // Try to find existing
  const search = await hsPost('/crm/v3/objects/contacts/search', {
    filterGroups: [{ filters: [{ propertyName: 'email', operator: 'EQ', value: email }] }],
    properties: ['email', 'firstname', 'lastname'],
    limit: 1,
  });

  const props = {
    email,
    firstname: submitter.firstName,
    lastname: submitter.lastName,
    company,
    jobtitle: submitter.jobTitle || '',
    phone: submitter.phone || '',
  };

  if (search?.results?.length > 0) {
    const id = search.results[0].id;
    await fetch(`${HS_BASE}/crm/v3/objects/contacts/${id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${HS_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ properties: props }),
    });
    return id;
  }

  const created = await hsPost('/crm/v3/objects/contacts', { properties: props });
  return created?.id;
}

async function findOrCreateCompany(companyName) {
  const search = await hsPost('/crm/v3/objects/companies/search', {
    filterGroups: [{ filters: [{ propertyName: 'name', operator: 'EQ', value: companyName }] }],
    properties: ['name'],
    limit: 1,
  });

  if (search?.results?.length > 0) return search.results[0].id;

  const created = await hsPost('/crm/v3/objects/companies', {
    properties: { name: companyName, domain: '' },
  });
  return created?.id;
}

async function associateContactToCompany(contactId, companyId) {
  await fetch(
    `${HS_BASE}/crm/v4/objects/contact/${contactId}/associations/company/${companyId}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${HS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: 1 }]),
    }
  );
}

async function createEngagementNote(contactId, companyId, noteBody) {
  const note = await hsPost('/crm/v3/objects/notes', {
    properties: {
      hs_note_body: noteBody,
      hs_timestamp: new Date().toISOString(),
    },
    associations: [
      { to: { id: contactId }, types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: 202 }] },
      ...(companyId ? [{ to: { id: companyId }, types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: 188 }] }] : []),
    ],
  });
  return note;
}

async function submitHubSpotForm(submitter, company, services, extra = {}) {
  const selectedServices = [
    services.engagement && 'Engagement',
    services.license    && 'License',
    services.support    && 'Support',
  ].filter(Boolean).join(', ');

  const fields = [
    { name: 'email',     value: submitter.email },
    { name: 'firstname', value: submitter.firstName },
    { name: 'lastname',  value: submitter.lastName },
    { name: 'company',   value: company },
  ];

  if (submitter.phone)    fields.push({ name: 'phone',    value: submitter.phone });
  if (submitter.jobTitle) fields.push({ name: 'jobtitle', value: submitter.jobTitle });

  fields.push({ name: 'services_selected', value: selectedServices });

  if (services.license && extra.technical) {
    const t = extra.technical;
    if (t.rmqProduct)    fields.push({ name: 'rmq_product',    value: t.rmqProduct });
    if (t.cpuCoreCount)  fields.push({ name: 'cpu_core_count', value: String(t.cpuCoreCount) });
    if (t.cpuCoreType)   fields.push({ name: 'cpu_core_type',  value: t.cpuCoreType });
    if (t.deploymentEnv) fields.push({ name: 'deployment_env', value: t.deploymentEnv });
    if (extra.envUse?.length)    fields.push({ name: 'environment_use',  value: extra.envUse.join(', ') });
    if (extra.packaging?.length) fields.push({ name: 'packaging_format', value: extra.packaging.join(', ') });
    if (extra.portalUsers?.length) fields.push({ name: 'portal_users', value: extra.portalUsers.join(', ') });
    if (extra.comments)  fields.push({ name: 'message', value: extra.comments });
  }

  if (services.engagement) {
    if (extra.kickoffDate)    fields.push({ name: 'kickoff_date',   value: extra.kickoffDate });
    if (extra.teamTimezone)   fields.push({ name: 'team_timezone',  value: extra.teamTimezone });
    if (extra.schedulingPref) fields.push({ name: 'scheduling_pref', value: extra.schedulingPref });
    if (extra.engagementDescription) fields.push({ name: 'message', value: extra.engagementDescription });
  }

  await fetch(
    `https://api.hsforms.com/submissions/v3/integration/submit/${HS_PORTAL_ID}/${HS_FORM_GUID}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields, context: { pageName: 'AceMQ Combined Onboarding' } }),
    }
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Mailjet helper
// ─────────────────────────────────────────────────────────────────────────────

async function sendMailjetEmail({ toEmail, toName, subject, html, pdfBase64, pdfFilename }) {
  const credentials = Buffer.from(`${MJ_API_KEY}:${MJ_SECRET_KEY}`).toString('base64');

  const body = {
    Messages: [
      {
        From:        { Email: 'team@acemq.com', Name: 'AceMQ Team' },
        To:          [{ Email: toEmail, Name: toName }],
        Subject:     subject,
        HTMLPart:    html,
        Attachments: pdfBase64
          ? [{ ContentType: 'application/pdf', Filename: pdfFilename || 'onboarding.pdf', Base64Content: pdfBase64 }]
          : [],
      },
    ],
  };

  const res = await fetch('https://api.mailjet.com/v3.1/send', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data?.ErrorMessage || `Mailjet error ${res.status}`);
  return data;
}

// ─────────────────────────────────────────────────────────────────────────────
// Note body builder
// ─────────────────────────────────────────────────────────────────────────────

function buildNoteBody({ submitter, company, services,
  engagementParticipants, kickoffDate, teamTimezone, schedulingPref,
  engagementDescription, technical, envUse, packaging, comments, portalUsers, supportUsers }) {

  const selectedServices = [
    services.engagement && 'Engagement',
    services.license    && 'License',
    services.support    && 'Support',
  ].filter(Boolean).join(', ');

  let note = `AceMQ Combined Onboarding Submission\n`;
  note += `Company: ${company}\n`;
  note += `Submitter: ${submitter.firstName} ${submitter.lastName} <${submitter.email}>\n`;
  if (submitter.jobTitle) note += `Title: ${submitter.jobTitle}\n`;
  if (submitter.phone)    note += `Phone: ${submitter.phone}\n`;
  note += `Services: ${selectedServices}\n\n`;

  if (services.engagement) {
    note += `--- ENGAGEMENT ---\n`;
    if (kickoffDate)           note += `Est. Kickoff: ${kickoffDate}\n`;
    if (teamTimezone)          note += `Timezone: ${teamTimezone}\n`;
    if (schedulingPref)        note += `Scheduling: ${schedulingPref}\n`;
    if (engagementParticipants?.length) {
      note += `Participants:\n`;
      engagementParticipants.forEach(p => {
        note += `  ${p.firstName} ${p.lastName}${p.title ? ` · ${p.title}` : ''} · ${p.email} · ${p.role}\n`;
      });
    }
    if (engagementDescription) note += `Comments: ${engagementDescription}\n`;
    note += '\n';
  }

  if (services.license) {
    note += `--- LICENSE ---\n`;
    note += `Product: ${technical.rmqProduct || '—'}\n`;
    note += `CPU: ${technical.cpuCoreCount || '—'} ${technical.cpuCoreType || ''}\n`;
    note += `Deployment: ${technical.deploymentEnv || '—'}\n`;
    note += `Env Use: ${envUse.join(', ') || '—'}\n`;
    note += `Packaging: ${packaging.join(', ') || '—'}\n`;
    if (comments) note += `Comments: ${comments}\n`;
    if (portalUsers?.length) note += `Portal Users: ${portalUsers.join(', ')}\n`;
    note += '\n';
  }

  if (services.support || services.engagement) {
    note += `--- SUPPORT USERS ---\n`;
    supportUsers?.forEach(u => {
      note += `  ${u.firstName} ${u.lastName} <${u.email}>\n`;
    });
  }

  return note;
}

// ─────────────────────────────────────────────────────────────────────────────
// Email HTML builder
// ─────────────────────────────────────────────────────────────────────────────

function buildEmailHtml({ submitter, company, services }) {
  const selectedNames = [
    services.engagement && '🤝 Engagement',
    services.license    && '🔑 License',
    services.support    && '🎫 Support',
  ].filter(Boolean).join(', ');

  return `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9f9f9;font-family:Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f9f9;">
    <tr><td align="center" style="padding:40px 20px;">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 20px rgba(0,0,0,0.08);">
        <tr><td style="background:#000;padding:28px 40px;">
          <p style="margin:0;color:#8FD5CC;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;">THE #1 RABBITMQ PARTNER</p>
          <p style="margin:6px 0 0;color:#fff;font-size:24px;font-weight:700;">AceMQ</p>
        </td></tr>
        <tr><td style="background:#FF6600;height:4px;"></td></tr>
        <tr><td style="padding:40px;">
          <p style="margin:0 0 8px;color:#FF6600;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;">New Onboarding Submission</p>
          <h1 style="margin:0 0 24px;color:#161616;font-size:28px;font-weight:700;">AceMQ Onboarding</h1>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f8f8;border-radius:8px;margin-bottom:24px;">
            <tr><td style="padding:20px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:8px 0;color:#999;font-size:12px;font-weight:700;text-transform:uppercase;width:40%;">Company</td>
                  <td style="padding:8px 0;color:#161616;font-size:14px;">${company}</td>
                </tr>
                <tr>
                  <td style="padding:8px 0;color:#999;font-size:12px;font-weight:700;text-transform:uppercase;">Submitted by</td>
                  <td style="padding:8px 0;color:#161616;font-size:14px;">${submitter.firstName} ${submitter.lastName}</td>
                </tr>
                <tr>
                  <td style="padding:8px 0;color:#999;font-size:12px;font-weight:700;text-transform:uppercase;">Email</td>
                  <td style="padding:8px 0;color:#FF6600;font-size:14px;">${submitter.email}</td>
                </tr>
                <tr>
                  <td style="padding:8px 0;color:#999;font-size:12px;font-weight:700;text-transform:uppercase;">Onboarding</td>
                  <td style="padding:8px 0;color:#161616;font-size:14px;">${selectedNames}</td>
                </tr>
                <tr>
                  <td style="padding:8px 0;color:#999;font-size:12px;font-weight:700;text-transform:uppercase;">Date</td>
                  <td style="padding:8px 0;color:#161616;font-size:14px;">${new Date().toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' })}</td>
                </tr>
              </table>
            </td></tr>
          </table>
          <p style="color:#666;font-size:14px;line-height:1.6;">The complete onboarding report is attached as a PDF. Please review and follow up with the customer within 1 business day.</p>
        </td></tr>
        <tr><td style="background:#000;padding:20px 40px;text-align:center;">
          <p style="margin:0;color:#666;font-size:11px;">© ${new Date().getFullYear()} AceMQ, an Ace8 Company · onboarding@acemq.com · acemq.com</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// PDF report — pdf-lib, matches AceMQ Standard Doc Format (same as Redis tool)
// ─────────────────────────────────────────────────────────────────────────────

async function buildReportPdf({
  submitter, company, services,
  engagementParticipants, kickoffDate, teamTimezone, schedulingPref, timeSlotPref, engagementDescription,
  technical, envUse, packaging, comments, portalUsers, supportUsers,
}) {
  const doc     = await PDFDocument.create();
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold    = await doc.embedFont(StandardFonts.HelveticaBold);

  const BLACK  = rgb(0,    0,    0);
  const ORANGE = rgb(1,    0.4,  0);
  const DARK   = rgb(0.1,  0.1,  0.1);
  const LIGHT  = rgb(0.6,  0.6,  0.6);
  const WHITE  = rgb(1,    1,    1);
  const ROWALT = rgb(0.98, 0.98, 0.98);
  const BRDR   = rgb(0.91, 0.91, 0.91);

  const W = 595, H = 842;
  const ML = 56, MR = 56;
  const BW = W - ML - MR;

  const date      = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const dateShort = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
  const subName   = [submitter.firstName, submitter.lastName].filter(Boolean).join(' ');
  const svcNames  = [
    services.engagement && 'Engagement',
    services.license    && 'License',
    services.support    && 'Support',
  ].filter(Boolean);

  let page = doc.addPage([W, H]);
  let y = H - 56;

  function wrapLines(text, font, size, maxW) {
    const words = String(text || '').split(/\s+/).filter(Boolean);
    const lines = [];
    let cur = '';
    for (const w of words) {
      const trial = cur ? `${cur} ${w}` : w;
      if (font.widthOfTextAtSize(trial, size) > maxW && cur) { lines.push(cur); cur = w; }
      else cur = trial;
    }
    if (cur) lines.push(cur);
    return lines.length ? lines : [''];
  }

  function ensureSpace(needed) {
    if (y - needed < 56) {
      page = doc.addPage([W, H]);
      y = H - 56;
      drawFooter(page);
    }
  }

  function drawFooter(p) {
    const fy = 36;
    p.drawLine({ start: { x: ML, y: fy + 12 }, end: { x: W - MR, y: fy + 12 }, thickness: 0.5, color: LIGHT, opacity: 0.5 });
    p.drawText('AceMQ · an ace8 company', { x: ML, y: fy, font: regular, size: 7, color: LIGHT });
    const right = `AceMQ Onboarding Report  ·  ${dateShort}`;
    p.drawText(right, { x: W - MR - regular.widthOfTextAtSize(right, 7), y: fy, font: regular, size: 7, color: LIGHT });
  }

  drawFooter(page);

  // ── COVER ──
  page.drawRectangle({ x: ML, y: y - 2, width: BW, height: 2, color: ORANGE });
  y -= 16;
  page.drawText('ONBOARDING REPORT', { x: ML, y, font: bold, size: 7.5, color: ORANGE, characterSpacing: 1.8 });
  y -= 14;
  page.drawText('AceMQ Onboarding Report', { x: ML, y, font: bold, size: 22, color: BLACK });
  y -= 28;
  page.drawText(`${company}  ·  Prepared by AceMQ  ·  ${date}`, { x: ML, y, font: regular, size: 10, color: LIGHT });
  y -= 20;
  page.drawRectangle({ x: ML, y: y - 18, width: BW, height: 18, color: ORANGE });
  page.drawText(`SERVICES:  ${svcNames.join('  ·  ').toUpperCase()}`, { x: ML + 10, y: y - 13, font: bold, size: 7.5, color: WHITE, characterSpacing: 0.6 });
  y -= 30;

  // Submission details table
  y -= 6;
  page.drawText('Submission Details', { x: ML, y, font: bold, size: 13, color: BLACK });
  y -= 12;

  const COL1  = BW * 0.3;
  const ROW_H = 16;

  const detailRows = [
    ['Title',          'AceMQ Onboarding Report'],
    ['Services',       svcNames.join(', ')],
    ['Submitted By',   subName],
    ['Company',        company],
    ...(submitter.jobTitle ? [['Job Title',  submitter.jobTitle]] : []),
    ['Email',          submitter.email],
    ...(submitter.phone    ? [['Phone',      submitter.phone]]    : []),
    ['Date Submitted', date],
    ['Prepared By',    'AceMQ — Program Management'],
  ];

  page.drawRectangle({ x: ML, y: y - ROW_H, width: BW, height: ROW_H, color: DARK });
  page.drawText('Document', { x: ML + 6,       y: y - ROW_H + 5, font: bold, size: 8, color: WHITE });
  page.drawText('Detail',   { x: ML + COL1 + 6, y: y - ROW_H + 5, font: bold, size: 8, color: WHITE });
  y -= ROW_H;

  detailRows.forEach(([l, v], i) => {
    ensureSpace(ROW_H + 2);
    if (i % 2 === 1) page.drawRectangle({ x: ML, y: y - ROW_H, width: BW, height: ROW_H, color: ROWALT });
    page.drawLine({ start: { x: ML, y: y - ROW_H }, end: { x: ML + BW, y: y - ROW_H }, thickness: 0.4, color: BRDR });
    page.drawText(l, { x: ML + 6, y: y - ROW_H + 5, font: regular, size: 8, color: LIGHT });
    const vf = (l === 'Company' || l === 'Services') ? bold : regular;
    page.drawText(String(v || '—'), { x: ML + COL1 + 6, y: y - ROW_H + 5, font: vf, size: 8, color: DARK, maxWidth: BW - COL1 - 12 });
    y -= ROW_H;
  });
  y -= 16;

  // ── Helpers ──

  function drawSectionBanner(num, title) {
    ensureSpace(36);
    y -= 8;
    page.drawRectangle({ x: ML, y: y - 18, width: BW, height: 18, color: ORANGE });
    page.drawText(`${num}.  ${title}`, { x: ML + 10, y: y - 13, font: bold, size: 8, color: WHITE, characterSpacing: 0.8 });
    y -= 28;
  }

  function drawSectionHead(text) {
    ensureSpace(22);
    page.drawText(text, { x: ML, y, font: bold, size: 12, color: BLACK });
    y -= 16;
  }

  function drawSubHead(text) {
    ensureSpace(18);
    page.drawText(text, { x: ML, y, font: bold, size: 10, color: DARK });
    y -= 14;
  }

  function drawKVTable(rows) {
    page.drawRectangle({ x: ML, y: y - ROW_H, width: BW, height: ROW_H, color: DARK });
    page.drawText('Detail', { x: ML + 6,       y: y - ROW_H + 5, font: bold, size: 8, color: WHITE });
    page.drawText('Value',  { x: ML + COL1 + 6, y: y - ROW_H + 5, font: bold, size: 8, color: WHITE });
    y -= ROW_H;
    rows.forEach(([l, v], i) => {
      ensureSpace(ROW_H + 2);
      if (i % 2 === 1) page.drawRectangle({ x: ML, y: y - ROW_H, width: BW, height: ROW_H, color: ROWALT });
      page.drawLine({ start: { x: ML, y: y - ROW_H }, end: { x: ML + BW, y: y - ROW_H }, thickness: 0.4, color: BRDR });
      page.drawText(l, { x: ML + 6, y: y - ROW_H + 5, font: regular, size: 8, color: LIGHT });
      page.drawText(String(v || '—'), { x: ML + COL1 + 6, y: y - ROW_H + 5, font: regular, size: 8, color: DARK, maxWidth: BW - COL1 - 12 });
      y -= ROW_H;
    });
    y -= 8;
  }

  function drawTextBlock(text) {
    if (!text?.trim()) return;
    const LH = 13, SZ = 8.5, AW = BW - 16;
    const lines = wrapLines(text, regular, SZ, AW);
    const blockH = lines.length * LH + 10;
    ensureSpace(blockH);
    page.drawRectangle({ x: ML, y: y - blockH + 10, width: 3, height: blockH - 10, color: ORANGE });
    lines.forEach((line, i) => {
      page.drawText(line, { x: ML + 10, y: y - i * LH, font: regular, size: SZ, color: DARK });
    });
    y -= blockH;
  }

  let sn = 1;

  // ── ENGAGEMENT ──
  if (services.engagement) {
    drawSectionBanner(sn++, 'ENGAGEMENT ONBOARDING');
    drawSectionHead('Engagement Details');

    const engRows = [
      ['Est. Kickoff Date',      kickoffDate],
      ['Team Timezone',          teamTimezone],
      ['Scheduling Preference',  schedulingPref],
      ['Time Preference',        timeSlotPref],
    ].filter(([, v]) => v);
    if (engRows.length) drawKVTable(engRows);

    if (engagementParticipants?.length) {
      drawSubHead('Participants');
      const PC = [BW * 0.25, BW * 0.22, BW * 0.28, BW * 0.25];
      const PRH = 15;
      ensureSpace(PRH + 2);
      page.drawRectangle({ x: ML, y: y - PRH, width: BW, height: PRH, color: DARK });
      let xo = ML;
      ['Name', 'Title', 'Email', 'Role'].forEach((h, ci) => {
        page.drawText(h, { x: xo + 4, y: y - PRH + 5, font: bold, size: 7.5, color: WHITE, maxWidth: PC[ci] - 8 });
        xo += PC[ci];
      });
      y -= PRH;
      engagementParticipants.forEach((p, i) => {
        ensureSpace(PRH + 2);
        if (i % 2 === 1) page.drawRectangle({ x: ML, y: y - PRH, width: BW, height: PRH, color: ROWALT });
        page.drawLine({ start: { x: ML, y: y - PRH }, end: { x: ML + BW, y: y - PRH }, thickness: 0.4, color: BRDR });
        xo = ML;
        [`${p.firstName || ''} ${p.lastName || ''}`.trim() || '—', p.title || '—', p.email || '—', p.role || '—'].forEach((c, ci) => {
          page.drawText(c, { x: xo + 4, y: y - PRH + 5, font: regular, size: 7.5, color: DARK, maxWidth: PC[ci] - 8 });
          xo += PC[ci];
        });
        y -= PRH;
      });
      y -= 8;
    }

    if (engagementDescription?.trim()) {
      drawSubHead('Additional Comments');
      drawTextBlock(engagementDescription);
    }
  }

  // ── LICENSE ──
  if (services.license) {
    drawSectionBanner(sn++, 'LICENSE SETUP');
    drawSectionHead('Technical Environment');

    const licRows = [
      ['RabbitMQ Product',   technical?.rmqProduct],
      ['CPU Core Count',     technical?.cpuCoreCount],
      ['CPU Core Type',      technical?.cpuCoreType],
      ['Deployment Env',     technical?.deploymentEnv],
      ['Environment Use',    envUse?.join(', ')],
      ['Packaging Format',   packaging?.join(', ')],
    ].filter(([, v]) => v);
    if (licRows.length) drawKVTable(licRows);

    if (portalUsers?.length) {
      drawSubHead('Portal Users');
      portalUsers.forEach((email, i) => {
        ensureSpace(14);
        if (i % 2 === 0) page.drawRectangle({ x: ML, y: y - 13, width: BW, height: 13, color: ROWALT });
        page.drawLine({ start: { x: ML, y: y - 13 }, end: { x: ML + BW, y: y - 13 }, thickness: 0.4, color: BRDR });
        page.drawText(email, { x: ML + 6, y: y - 8, font: regular, size: 8, color: DARK });
        y -= 13;
      });
      y -= 8;
    }

    if (comments?.trim()) {
      drawSubHead('Additional Comments');
      drawTextBlock(comments);
    }
  }

  // ── SUPPORT ──
  if (services.support) {
    drawSectionBanner(sn++, 'SUPPORT SETUP');
    drawSectionHead('Support Users');

    if (supportUsers?.length) {
      const SC = [BW * 0.28, BW * 0.28, BW * 0.44];
      const SRH = 15;
      ensureSpace(SRH + 2);
      page.drawRectangle({ x: ML, y: y - SRH, width: BW, height: SRH, color: DARK });
      let xo = ML;
      ['First Name', 'Last Name', 'Email'].forEach((h, ci) => {
        page.drawText(h, { x: xo + 4, y: y - SRH + 5, font: bold, size: 7.5, color: WHITE, maxWidth: SC[ci] - 8 });
        xo += SC[ci];
      });
      y -= SRH;
      supportUsers.forEach((u, i) => {
        ensureSpace(SRH + 2);
        if (i % 2 === 1) page.drawRectangle({ x: ML, y: y - SRH, width: BW, height: SRH, color: ROWALT });
        page.drawLine({ start: { x: ML, y: y - SRH }, end: { x: ML + BW, y: y - SRH }, thickness: 0.4, color: BRDR });
        xo = ML;
        [u.firstName || '—', u.lastName || '—', u.email || '—'].forEach((c, ci) => {
          page.drawText(c, { x: xo + 4, y: y - SRH + 5, font: regular, size: 8, color: DARK, maxWidth: SC[ci] - 8 });
          xo += SC[ci];
        });
        y -= SRH;
      });
    } else {
      ensureSpace(18);
      page.drawText('No support users specified.', { x: ML, y, font: regular, size: 8.5, color: LIGHT });
      y -= 16;
    }
  }

  return Buffer.from(await doc.save());
}

// ─────────────────────────────────────────────────────────────────────────────
// JFrog provisioning
//
// Pattern inferred from all existing customers:
//   group:       customer-{slug}
//   permission:  perm-{slug}-rmq-access
//   repos:       ossrabbitmq-rabbitmq-oss, rabbitmq-docker-remote,
//                rabbitmq-helmoci-remote, rabbitmq-operator-docker-remote
//   access:      read + annotate + write
// ─────────────────────────────────────────────────────────────────────────────

const JFROG_REPOS = [
  'ossrabbitmq-rabbitmq-oss',
  'rabbitmq-docker-remote',
  'rabbitmq-helmoci-remote',
  'rabbitmq-operator-docker-remote',
];

function slugifyCompany(name) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

async function jfrog(method, path, body) {
  const res = await fetch(`${JFROG_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${JFROG_TOKEN}`,
      'Content-Type': 'application/json',
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  return { status: res.status, data };
}

async function ensureJFrogGroup(groupName) {
  const { status } = await jfrog('GET', `/access/api/v2/groups/${groupName}`);
  if (status === 200) return false; // already existed
  await jfrog('POST', '/access/api/v2/groups', {
    name: groupName,
    description: `Customer access group — ${groupName.replace('customer-', '')}`,
    auto_join: false,
  });
  return true; // newly created
}

async function ensureJFrogPermission(slug, groupName) {
  const permName = `perm-${slug}-rmq-access`;
  const { status } = await jfrog('GET', `/artifactory/api/v2/security/permissions/${encodeURIComponent(permName)}`);
  if (status === 200) return false; // already existed

  await jfrog('PUT', `/artifactory/api/v2/security/permissions/${encodeURIComponent(permName)}`, {
    name: permName,
    repo: {
      actions: {
        groups: {
          [groupName]: ['read', 'write'],
        },
      },
      repositories: JFROG_REPOS,
      'include-patterns': ['**'],
      'exclude-patterns': [],
    },
  });
  return true; // newly created
}

async function sendJFrogInviteEmail(email, tempPwd, company) {
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#333;">
      <div style="background:#FF6B00;padding:24px 32px;">
        <span style="color:#fff;font-size:20px;font-weight:700;letter-spacing:1px;">AceMQ</span>
      </div>
      <div style="padding:32px;">
        <h2 style="margin:0 0 16px;font-size:22px;">Your RabbitMQ Artifact Access is Ready</h2>
        <p style="margin:0 0 20px;line-height:1.6;">
          Your account on the AceMQ JFrog Artifactory platform has been provisioned as part of
          the <strong>${company}</strong> license onboarding. You now have access to the
          AceMQ RabbitMQ repositories.
        </p>
        <table style="width:100%;border-collapse:collapse;margin-bottom:24px;background:#f8f8f8;border-radius:6px;">
          <tr>
            <td style="padding:12px 16px;font-size:13px;color:#666;width:120px;">Platform</td>
            <td style="padding:12px 16px;font-size:14px;"><a href="https://acemq.jfrog.io" style="color:#FF6B00;">acemq.jfrog.io</a></td>
          </tr>
          <tr style="border-top:1px solid #eee;">
            <td style="padding:12px 16px;font-size:13px;color:#666;">Username</td>
            <td style="padding:12px 16px;font-size:14px;font-family:monospace;">${email}</td>
          </tr>
          <tr style="border-top:1px solid #eee;">
            <td style="padding:12px 16px;font-size:13px;color:#666;">Temp Password</td>
            <td style="padding:12px 16px;font-size:14px;font-family:monospace;letter-spacing:1px;">${tempPwd}</td>
          </tr>
        </table>
        <a href="https://acemq.jfrog.io" style="display:inline-block;background:#FF6B00;color:#fff;text-decoration:none;padding:12px 28px;border-radius:4px;font-weight:700;font-size:15px;">
          Log In to AceMQ Artifactory →
        </a>
        <p style="margin:20px 0 0;font-size:13px;color:#888;line-height:1.5;">
          You will be prompted to change your password after your first login.
        </p>
        <hr style="margin:32px 0;border:none;border-top:1px solid #eee;">
        <p style="margin:0;font-size:13px;color:#888;">
          AceMQ · an ace8 company<br>
          Questions? Contact <a href="mailto:support@acemq.com" style="color:#FF6B00;">support@acemq.com</a>
        </p>
      </div>
    </div>`;

  await sendMailjetEmail({
    toEmail: email,
    toName:  email,
    subject: 'Your AceMQ RabbitMQ Artifact Access is Ready',
    html,
  });
}

async function provisionJFrogUser(email, groupName, company) {
  const username = email.toLowerCase().trim();
  const { status, data } = await jfrog('GET', `/access/api/v2/users/${username}`);

  if (status === 200) {
    // User exists — add to group (merge with existing groups)
    const existingGroups = data.groups || [];
    const groups = [...new Set([...existingGroups, groupName])];
    await jfrog('PATCH', `/access/api/v2/users/${username}`, { groups });
    return 'updated';
  } else {
    // New user — create with a temporary password and send it via email
    const tempPwd = require('crypto').randomBytes(10).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 12) + 'Aa1!';
    await jfrog('POST', '/access/api/v2/users', {
      username,
      email: username,
      password: tempPwd,
      groups: [groupName],
      realm: 'internal',
      profileUpdatable: true,
      disableUIAccess: false,
    });
    await sendJFrogInviteEmail(username, tempPwd, company);
    return 'invited';
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Jira Service Management helpers
// ─────────────────────────────────────────────────────────────────────────────

function jiraAuth() {
  return 'Basic ' + Buffer.from(`${JIRA_EMAIL_ADDR}:${JIRA_API_TOKEN}`).toString('base64');
}

async function jira(method, path, body) {
  const res = await fetch(`${JIRA_BASE_URL}${path}`, {
    method,
    headers: {
      Authorization: jiraAuth(),
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-ExperimentalApi': 'opt-in',
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = res.headers.get('content-type')?.includes('application/json') ? await res.json() : null;
  return { status: res.status, data };
}

async function findJSMOrg(companyName) {
  // Pages through all orgs on the service desk looking for a name match
  let start = 0;
  while (true) {
    const { data } = await jira('GET', `/rest/servicedeskapi/servicedesk/${JIRA_SERVICE_DESK_ID}/organization?start=${start}&limit=50`);
    const values = data?.values || [];
    const match = values.find(o => o.name.toLowerCase() === companyName.toLowerCase());
    if (match) return match;
    if (data?.isLastPage || values.length === 0) return null;
    start += values.length;
  }
}

async function createJSMOrg(companyName) {
  // Create org then associate it with the service desk
  const { data: org } = await jira('POST', '/rest/servicedeskapi/organization', { name: companyName });
  await jira('POST', `/rest/servicedeskapi/servicedesk/${JIRA_SERVICE_DESK_ID}/organization`, { organizationId: org.id });
  return org;
}

async function addUsersToJSMOrg(orgId, emails) {
  // JSM accepts accountIds or emails (cloud supports email-based lookup)
  await jira('POST', `/rest/servicedeskapi/organization/${orgId}/user`, {
    usernames: emails, // legacy field — cloud also accepts this for email lookup
  });
}

async function provisionJSMAccess({ company, submitterEmail, portalUsers }) {
  const emails = [...new Set([submitterEmail, ...(portalUsers || [])])].filter(Boolean);

  let org = await findJSMOrg(company);
  const orgCreated = !org;
  if (!org) {
    org = await createJSMOrg(company);
  }

  await addUsersToJSMOrg(org.id, emails);

  return { orgId: org.id, orgName: org.name, orgCreated, usersAdded: emails };
}

async function provisionJFrogAccess({ company, submitterEmail, portalUsers }) {
  const slug      = slugifyCompany(company);
  const groupName = `customer-${slug}`;

  // Group must exist before creating the permission target that references it
  const groupCreated = await ensureJFrogGroup(groupName);
  const permCreated  = await ensureJFrogPermission(slug, groupName);

  const emails  = [...new Set([submitterEmail, ...(portalUsers || [])])].filter(Boolean);
  const results = await Promise.allSettled(emails.map(e => provisionJFrogUser(e, groupName, company)));

  const invited = [], updated = [], failed = [];
  results.forEach((r, i) => {
    if (r.status === 'fulfilled') {
      (r.value === 'invited' ? invited : updated).push(emails[i]);
    } else {
      failed.push(`${emails[i]}: ${r.reason?.message}`);
    }
  });

  return { groupName, permName: `perm-${slug}-rmq-access`, groupCreated, permCreated, invited, updated, failed };
}

// ─────────────────────────────────────────────────────────────────────────────
// POST handler
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      submitter, company, services,
      engagementParticipants,
      kickoffDate, teamTimezone, schedulingPref, timeSlotPref, engagementDescription,
      technical, envUse, packaging, comments, portalUsers, supportUsers,
    } = body;

    if (!submitter?.email || !company) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const errors = [];

    // HubSpot CRM
    if (HS_TOKEN) {
      try {
        const [contactId, companyId] = await Promise.all([
          upsertContact(submitter, company),
          findOrCreateCompany(company),
        ]);

        if (contactId && companyId) {
          await associateContactToCompany(contactId, companyId);
        }

        const noteBody = buildNoteBody({
          submitter, company, services,
          engagementParticipants, kickoffDate, teamTimezone, schedulingPref,
          engagementDescription, technical, envUse, packaging, comments, portalUsers, supportUsers,
        });

        if (contactId) {
          await createEngagementNote(contactId, companyId, noteBody);
        }

        await submitHubSpotForm(submitter, company, services, {
          technical, envUse, packaging, portalUsers, comments,
          kickoffDate, teamTimezone, schedulingPref, engagementDescription,
        });
      } catch (hsErr) {
        console.error('HubSpot error:', hsErr);
        errors.push(`HubSpot: ${hsErr.message}`);
      }
    }

    // Generate PDF server-side
    let pdfBuffer = null;
    let pdfBase64 = null;
    try {
      pdfBuffer = await buildReportPdf({
        submitter, company, services,
        engagementParticipants, kickoffDate, teamTimezone, schedulingPref, timeSlotPref, engagementDescription,
        technical, envUse, packaging, comments, portalUsers, supportUsers,
      });
      pdfBase64 = pdfBuffer.toString('base64');
    } catch (pdfErr) {
      console.error('PDF build error:', pdfErr);
      errors.push(`PDF: ${pdfErr.message}`);
    }

    // Mailjet — send to onboarding@acemq.com
    try {
      const selectedServices = [
        services.engagement && 'Engagement',
        services.license    && 'License',
        services.support    && 'Support',
      ].filter(Boolean).join(' + ');

      await sendMailjetEmail({
        toEmail:     'onboarding@acemq.com',
        toName:      'AceMQ Onboarding Team',
        subject:     `New Onboarding — ${company} (${selectedServices})`,
        html:        buildEmailHtml({ submitter, company, services }),
        pdfBase64,
        pdfFilename: `AceMQ-Onboarding-${company.replace(/\s+/g, '-')}.pdf`,
      });
    } catch (mjErr) {
      console.error('Mailjet error:', mjErr);
      errors.push(`Mailjet: ${mjErr.message}`);
    }

    // JFrog provisioning — runs when license onboarding is selected
    if (services.license && JFROG_TOKEN) {
      let jfrogResult = null;
      let jfrogError  = null;

      try {
        jfrogResult = await provisionJFrogAccess({
          company,
          submitterEmail: submitter.email,
          portalUsers: portalUsers || [],
        });
        jfrogResult.failed.forEach(f => errors.push(`JFrog: ${f}`));
        console.log(`JFrog: group=${jfrogResult.groupName} invited=${jfrogResult.invited.length} updated=${jfrogResult.updated.length} failed=${jfrogResult.failed.length}`);
      } catch (err) {
        console.error('JFrog provisioning error:', err);
        jfrogError = err.message;
        errors.push(`JFrog: ${err.message}`);
      }

      // Mailjet notification to onboarding team
      try {
        const success = !jfrogError && jfrogResult?.failed.length === 0;
        const subject = success
          ? `✅ JFrog Provisioned — ${company}`
          : `⚠️ JFrog Provisioning Issue — ${company}`;

        const allUsers = [...(jfrogResult?.invited || []), ...(jfrogResult?.updated || [])];
        const html = `
<!DOCTYPE html><html><body style="font-family:Helvetica,Arial,sans-serif;background:#f9f9f9;margin:0;padding:20px;">
<table width="600" style="background:#fff;border-radius:8px;padding:32px;margin:auto;">
  <tr><td>
    <p style="margin:0 0 4px;color:#FF6600;font-size:11px;letter-spacing:.1em;text-transform:uppercase;">JFrog Access Provisioning</p>
    <h2 style="margin:0 0 20px;color:#161616;">${success ? '✅ Provisioning Complete' : '⚠️ Provisioning Had Errors'}</h2>
    <table width="100%" style="border-collapse:collapse;margin-bottom:20px;">
      <tr style="background:#f0f0f0;"><td style="padding:8px 12px;font-size:12px;color:#666;width:40%;">Company</td><td style="padding:8px 12px;font-size:13px;font-weight:bold;">${company}</td></tr>
      <tr><td style="padding:8px 12px;font-size:12px;color:#666;">Submitter</td><td style="padding:8px 12px;font-size:13px;">${submitter.firstName} ${submitter.lastName} &lt;${submitter.email}&gt;</td></tr>
      <tr style="background:#f0f0f0;"><td style="padding:8px 12px;font-size:12px;color:#666;">JFrog Group</td><td style="padding:8px 12px;font-size:13px;font-family:monospace;">${jfrogResult?.groupName || '—'}</td></tr>
      <tr><td style="padding:8px 12px;font-size:12px;color:#666;">Permission Target</td><td style="padding:8px 12px;font-size:13px;font-family:monospace;">${jfrogResult?.permName || '—'}</td></tr>
      <tr style="background:#f0f0f0;"><td style="padding:8px 12px;font-size:12px;color:#666;">Group Created</td><td style="padding:8px 12px;font-size:13px;">${jfrogResult?.groupCreated ? 'Yes (new)' : 'No (existing)'}</td></tr>
      <tr><td style="padding:8px 12px;font-size:12px;color:#666;">Perm Target Created</td><td style="padding:8px 12px;font-size:13px;">${jfrogResult?.permCreated ? 'Yes (new)' : 'No (existing)'}</td></tr>
    </table>
    ${allUsers.length > 0 ? `
    <p style="font-weight:bold;margin:16px 0 8px;">Users Provisioned (${allUsers.length})</p>
    <ul style="margin:0;padding-left:20px;">${allUsers.map(e => `<li style="font-size:13px;padding:2px 0;">${e}${jfrogResult?.invited?.includes(e) ? ' <span style="color:#FF6600;font-size:11px;">(invited)</span>' : ' <span style="color:#666;font-size:11px;">(added to group)</span>'}</li>`).join('')}</ul>` : ''}
    ${jfrogResult?.failed?.length > 0 ? `
    <p style="font-weight:bold;margin:16px 0 8px;color:#c0392b;">Failed (${jfrogResult.failed.length})</p>
    <ul style="margin:0;padding-left:20px;">${jfrogResult.failed.map(f => `<li style="font-size:13px;color:#c0392b;padding:2px 0;">${f}</li>`).join('')}</ul>` : ''}
    ${jfrogError ? `<p style="color:#c0392b;margin-top:16px;font-size:13px;"><strong>Error:</strong> ${jfrogError}</p>` : ''}
    <p style="margin-top:24px;font-size:12px;color:#999;">Sent automatically by AceMQ Onboarding · onboarding.acemq.com</p>
  </td></tr>
</table>
</body></html>`;

        await sendMailjetEmail({
          toEmail: 'onboarding@acemq.com',
          toName:  'AceMQ Onboarding Team',
          subject,
          html,
        });
      } catch (notifyErr) {
        console.error('JFrog notification email error:', notifyErr);
      }
    }

    // JSM provisioning — runs when license onboarding is selected
    if (services.license && JIRA_API_TOKEN) {
      try {
        const jsmResult = await provisionJSMAccess({
          company,
          submitterEmail: submitter.email,
          portalUsers: portalUsers || [],
        });
        console.log(`JSM: org="${jsmResult.orgName}" id=${jsmResult.orgId} created=${jsmResult.orgCreated} users=${jsmResult.usersAdded.length}`);
      } catch (jsmErr) {
        console.error('JSM provisioning error:', jsmErr);
        errors.push(`JSM: ${jsmErr.message}`);
      }
    }

    return NextResponse.json({
      ok: true,
      pdfBase64,
      warnings: errors.length > 0 ? errors : undefined,
    });
  } catch (err) {
    console.error('Submit error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
