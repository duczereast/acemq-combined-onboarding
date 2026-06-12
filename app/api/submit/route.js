import { NextResponse } from 'next/server';

const HS_TOKEN        = process.env.HUBSPOT_TOKEN;
const HS_PORTAL_ID    = process.env.HUBSPOT_PORTAL_ID    || '3925227';
const HS_FORM_GUID    = process.env.HUBSPOT_FORM_GUID    || '219059aa-6367-4fbd-82b4-b000b9c88089';

const MJ_API_KEY      = process.env.MAILJET_API_KEY      || 'bbbbe6000d4db8179e4eafaa9b1c432b';
const MJ_SECRET_KEY   = process.env.MAILJET_SECRET_KEY   || 'c72154c82ee4e1577e536302fb38e7a1';

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

async function submitHubSpotForm(submitter, company, services) {
  const fields = [
    { name: 'email',     value: submitter.email },
    { name: 'firstname', value: submitter.firstName },
    { name: 'lastname',  value: submitter.lastName },
    { name: 'company',   value: company },
  ];
  if (submitter.phone)    fields.push({ name: 'phone',    value: submitter.phone });
  if (submitter.jobTitle) fields.push({ name: 'jobtitle', value: submitter.jobTitle });

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
        From:        { Email: 'submissions@acemq.com', Name: 'AceMQ Onboarding' },
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

function buildNoteBody({ submitter, company, services, engagementType, engagementRmqVersion,
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
    note += `Type: ${engagementType || '—'}\n`;
    note += `RabbitMQ Version: ${engagementRmqVersion || '—'}\n`;
    if (kickoffDate)           note += `Est. Kickoff: ${kickoffDate}\n`;
    if (teamTimezone)          note += `Timezone: ${teamTimezone}\n`;
    if (schedulingPref)        note += `Scheduling: ${schedulingPref}\n`;
    if (engagementParticipants) note += `Participants:\n${engagementParticipants}\n`;
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
// POST handler
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      submitter, company, services,
      engagementType, engagementRmqVersion, engagementParticipants,
      kickoffDate, teamTimezone, schedulingPref, engagementDescription,
      technical, envUse, packaging, comments, portalUsers, supportUsers,
      pdfBase64, pdfFilename,
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
          submitter, company, services, engagementType, engagementRmqVersion,
          engagementParticipants, kickoffDate, teamTimezone, schedulingPref,
          engagementDescription, technical, envUse, packaging, comments, portalUsers, supportUsers,
        });

        if (contactId) {
          await createEngagementNote(contactId, companyId, noteBody);
        }

        await submitHubSpotForm(submitter, company, services);
      } catch (hsErr) {
        console.error('HubSpot error:', hsErr);
        errors.push(`HubSpot: ${hsErr.message}`);
      }
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
        pdfFilename: pdfFilename || `AceMQ-Onboarding-${company.replace(/\s+/g, '-')}.pdf`,
      });
    } catch (mjErr) {
      console.error('Mailjet error:', mjErr);
      errors.push(`Mailjet: ${mjErr.message}`);
      // Don't fail the whole submission if email fails — data is already in HubSpot
    }

    return NextResponse.json({ ok: true, warnings: errors.length > 0 ? errors : undefined });
  } catch (err) {
    console.error('Submit error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
