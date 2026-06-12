'use client';

import { useState } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const DEPLOYMENT_ENV_OPTIONS = [
  'Kubernetes — TKG / TAP / Helm',
  'Linux VM / Bare Metal',
  'Docker / Podman / Container',
  'Windows',
];

const RABBITMQ_PRODUCT_OPTIONS = [
  'Tanzu RabbitMQ 3.13.x — Post 3.13.7',
  'Tanzu RabbitMQ 4.x — Kubernetes only',
  'Open Source RabbitMQ 3.13.x+ — Post 3.13.7',
];

const ENVIRONMENT_USE_OPTIONS = [
  'Development / Testing',
  'Staging / QA',
  'Production',
];

const PACKAGING_FORMAT_OPTIONS = [
  'Helm Chart',
  'OCI Image',
  'DEB',
  'RPM',
  'tar.gz',
  'Windows ZIP',
  'TAP Bundle',
  'TKG Integration',
  'VMware OVA',
];

const ENGAGEMENT_TYPE_OPTIONS = [
  'Architecture Review',
  'Migration',
  'Implementation',
  'Performance Tuning',
  'Training',
  'Other',
];

// ─────────────────────────────────────────────────────────────────────────────
// STEP LIST BUILDER
// ─────────────────────────────────────────────────────────────────────────────

function buildStepList(services) {
  const list = ['contact', 'services'];
  if (services.engagement) list.push('engagement');
  if (services.license) {
    list.push('license-tech');
    list.push('license-usage');
    list.push('license-users');
  }
  if (services.support || services.engagement) list.push('support-users');
  return list;
}

// ─────────────────────────────────────────────────────────────────────────────
// UI PRIMITIVES
// ─────────────────────────────────────────────────────────────────────────────

function BtnOrange({ onClick, disabled, children, className = '' }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className={`bg-[#FF6600] text-white border-none rounded-[3rem] px-[4rem] py-[1.2rem] text-[1.7rem] font-[400] cursor-pointer hover:opacity-90 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed transition-all inline-flex items-center gap-[0.8rem] ${className}`}>
      {children}
    </button>
  );
}

function BtnGhost({ onClick, children, className = '' }) {
  return (
    <button onClick={onClick}
      className={`bg-white text-black border border-black rounded-[3rem] px-[3.5rem] py-[1.2rem] text-[1.7rem] font-[400] cursor-pointer hover:bg-[#f5f5f5] active:scale-[0.98] transition-all ${className}`}>
      {children}
    </button>
  );
}

function SectionLabel({ children }) {
  return <p className="text-[#FF6600] text-[1.2rem] font-[400] tracking-[0.15em] uppercase mb-[0.8rem]">{children}</p>;
}

function QHead({ children }) {
  return <h2 className="text-[#000000] text-[2.8rem] leading-[1.3] font-[700] mb-[0.8rem]">{children}</h2>;
}

function QSub({ children, className = '' }) {
  return <p className={`text-[#999999] text-[1.6rem] leading-[1.65] mb-[2.4rem] ${className}`}>{children}</p>;
}

function TF({ type = 'text', placeholder, value, onChange, required }) {
  return (
    <input type={type} placeholder={placeholder} value={value} onChange={onChange} required={required}
      className="w-full bg-white border border-[rgba(0,0,0,0.12)] rounded-[1rem] px-[1.6rem] py-[1.3rem] text-[1.6rem] text-black placeholder:text-[#bbbbbb] outline-none focus:border-[#FF6600] focus:shadow-[0_0_0_3px_rgba(255,102,0,0.08)] transition-all mb-[1rem]" />
  );
}

function TA({ placeholder, value, onChange, rows = 4 }) {
  return (
    <textarea placeholder={placeholder} value={value} onChange={onChange} rows={rows}
      className="w-full bg-white border border-[rgba(0,0,0,0.12)] rounded-[1rem] px-[1.6rem] py-[1.3rem] text-[1.6rem] text-black placeholder:text-[#bbbbbb] outline-none focus:border-[#FF6600] focus:shadow-[0_0_0_3px_rgba(255,102,0,0.08)] transition-all mb-[1rem] resize-y" />
  );
}

function Choice({ selected, onClick, children }) {
  return (
    <button onClick={onClick}
      className={`flex items-center gap-[1.4rem] border rounded-[1rem] px-[1.6rem] py-[1.3rem] w-full text-left text-[1.6rem] cursor-pointer transition-all mb-[0.8rem] ${
        selected
          ? 'border-[#FF6600] bg-[rgba(255,102,0,0.05)] text-[#000000]'
          : 'border-[rgba(0,0,0,0.1)] bg-[#fafafa] text-[#161616] hover:border-[#FF6600] hover:bg-[rgba(255,102,0,0.03)]'
      }`}>
      <span className={`w-[1.8rem] h-[1.8rem] rounded-full border flex-shrink-0 flex items-center justify-center transition-all ${
        selected ? 'border-[#FF6600] bg-[#FF6600]' : 'border-[rgba(0,0,0,0.2)]'
      }`}>
        {selected && <span className="w-[0.6rem] h-[0.6rem] bg-white rounded-full block" />}
      </span>
      {children}
    </button>
  );
}

function Chip({ selected, onClick, children }) {
  return (
    <button onClick={onClick}
      className={`flex items-center gap-[1rem] border rounded-[1rem] px-[1.6rem] py-[1.1rem] text-left text-[1.5rem] cursor-pointer transition-all mb-[0.8rem] ${
        selected
          ? 'border-[#FF6600] bg-[rgba(255,102,0,0.07)] text-[#000000]'
          : 'border-[rgba(0,0,0,0.1)] bg-[#fafafa] text-[#161616] hover:border-[#FF6600] hover:bg-[rgba(255,102,0,0.03)]'
      }`}>
      <span className={`w-[1.6rem] h-[1.6rem] rounded-[4px] border flex-shrink-0 flex items-center justify-center transition-all ${
        selected ? 'border-[#FF6600] bg-[#FF6600]' : 'border-[rgba(0,0,0,0.25)]'
      }`}>
        {selected && (
          <svg className="w-[1rem] h-[1rem] stroke-white fill-none" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </span>
      {children}
    </button>
  );
}

function ServiceCheckbox({ checked, onChange, icon, title, desc }) {
  return (
    <label className={`flex items-start gap-[1.6rem] border rounded-[1.4rem] px-[2rem] py-[1.8rem] cursor-pointer transition-all ${
      checked
        ? 'border-[#FF6600] bg-[rgba(255,102,0,0.04)] shadow-[0_0_0_1px_rgba(255,102,0,0.25)]'
        : 'border-[rgba(0,0,0,0.1)] bg-[#fafafa] hover:border-[#FF6600] hover:bg-[rgba(255,102,0,0.02)]'
    }`}>
      <input type="checkbox" checked={checked} onChange={onChange} className="sr-only" />
      <span className={`mt-[0.2rem] w-[2.2rem] h-[2.2rem] rounded-[6px] border flex-shrink-0 flex items-center justify-center transition-all ${
        checked ? 'border-[#FF6600] bg-[#FF6600]' : 'border-[rgba(0,0,0,0.25)] bg-white'
      }`}>
        {checked && (
          <svg className="w-[1.3rem] h-[1.3rem] stroke-white fill-none" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </span>
      <div>
        <div className="flex items-center gap-[0.8rem] mb-[0.4rem]">
          <span className="text-[2rem]">{icon}</span>
          <span className="text-[1.7rem] font-[700] text-[#161616]">{title}</span>
        </div>
        <p className="text-[1.35rem] text-[#666] leading-[1.6]">{desc}</p>
      </div>
    </label>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SUPPORT USERS EDITOR
// ─────────────────────────────────────────────────────────────────────────────

function SupportUsersEditor({ users, setUsers }) {
  const [draft, setDraft] = useState({ firstName: '', lastName: '', email: '' });
  const [error, setError] = useState('');

  const isEmailValid = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());

  const addUser = () => {
    if (!draft.firstName.trim()) { setError('First name is required.'); return; }
    if (!draft.email.trim() || !isEmailValid(draft.email)) { setError('A valid email address is required.'); return; }
    if (users.some(u => u.email.toLowerCase() === draft.email.toLowerCase().trim())) {
      setError('This email is already in the list.'); return;
    }
    setUsers([...users, { firstName: draft.firstName.trim(), lastName: draft.lastName.trim(), email: draft.email.trim() }]);
    setDraft({ firstName: '', lastName: '', email: '' });
    setError('');
  };

  const removeUser = (idx) => setUsers(users.filter((_, i) => i !== idx));

  return (
    <div>
      <div className="bg-[#fafafa] border border-[rgba(0,0,0,0.08)] rounded-[1.2rem] p-[1.6rem] mb-[1.6rem]">
        <p className="text-[1.3rem] font-[600] text-[#161616] mb-[1.2rem]">Add a user</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-[1rem]">
          <input placeholder="First Name *" value={draft.firstName}
            onChange={e => { setDraft(d => ({ ...d, firstName: e.target.value })); setError(''); }}
            className="w-full bg-white border border-[rgba(0,0,0,0.12)] rounded-[1rem] px-[1.6rem] py-[1.2rem] text-[1.5rem] text-black placeholder:text-[#bbbbbb] outline-none focus:border-[#FF6600] transition-all mb-[1rem]" />
          <input placeholder="Last Name" value={draft.lastName}
            onChange={e => setDraft(d => ({ ...d, lastName: e.target.value }))}
            className="w-full bg-white border border-[rgba(0,0,0,0.12)] rounded-[1rem] px-[1.6rem] py-[1.2rem] text-[1.5rem] text-black placeholder:text-[#bbbbbb] outline-none focus:border-[#FF6600] transition-all mb-[1rem]" />
        </div>
        <input type="email" placeholder="Email Address *" value={draft.email}
          onChange={e => { setDraft(d => ({ ...d, email: e.target.value })); setError(''); }}
          onKeyDown={e => e.key === 'Enter' && addUser()}
          className="w-full bg-white border border-[rgba(0,0,0,0.12)] rounded-[1rem] px-[1.6rem] py-[1.2rem] text-[1.5rem] text-black placeholder:text-[#bbbbbb] outline-none focus:border-[#FF6600] transition-all mb-[1rem]" />
        {error && <p className="text-[#c0392b] text-[1.3rem] mb-[1rem]">{error}</p>}
        <button onClick={addUser}
          className="bg-[#FF6600] text-white rounded-[0.8rem] px-[2rem] py-[1rem] text-[1.4rem] cursor-pointer hover:opacity-90 transition-all">
          + Add User
        </button>
      </div>
      {users.length > 0 && (
        <div className="border border-[rgba(0,0,0,0.08)] rounded-[1.2rem] overflow-hidden mb-[1.6rem]">
          <div className="bg-[#f5f5f5] grid grid-cols-[1fr_1fr_1.5fr_auto] px-[1.6rem] py-[1rem] text-[1.2rem] font-[700] text-[#666] uppercase tracking-[0.05em]">
            <span>First Name</span><span>Last Name</span><span>Email</span><span></span>
          </div>
          {users.map((u, i) => (
            <div key={i} className={`grid grid-cols-[1fr_1fr_1.5fr_auto] px-[1.6rem] py-[1.2rem] text-[1.4rem] items-center ${i % 2 === 0 ? 'bg-white' : 'bg-[#fafafa]'} border-t border-[rgba(0,0,0,0.06)]`}>
              <span className="text-[#161616] font-[600]">{u.firstName}</span>
              <span className="text-[#666]">{u.lastName || '—'}</span>
              <span className="text-[#FF6600]">{u.email}</span>
              <button onClick={() => removeUser(i)} className="text-[#c0392b] hover:text-[#a93226] text-[1.8rem] leading-none cursor-pointer px-[0.8rem]">×</button>
            </div>
          ))}
        </div>
      )}
      {users.length === 0 && (
        <p className="text-[#bbbbbb] text-[1.3rem] text-center py-[1.2rem]">No users added yet.</p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EMAIL TAG INPUT
// ─────────────────────────────────────────────────────────────────────────────

function EmailTagInput({ emails, setEmails }) {
  const [input, setInput] = useState('');
  const [error, setError] = useState('');

  const isValid = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());

  const addEmail = () => {
    const val = input.trim();
    if (!val) return;
    if (!isValid(val)) { setError('Please enter a valid email address.'); return; }
    if (emails.includes(val)) { setError('This email is already added.'); return; }
    setEmails([...emails, val]);
    setInput('');
    setError('');
  };

  const removeEmail = (email) => setEmails(emails.filter(e => e !== email));

  return (
    <div>
      <div className="flex gap-[1rem] mb-[1rem]">
        <input type="email" placeholder="teammate@company.com" value={input}
          onChange={e => { setInput(e.target.value); setError(''); }}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addEmail(); } }}
          className="flex-1 bg-white border border-[rgba(0,0,0,0.12)] rounded-[1rem] px-[1.6rem] py-[1.3rem] text-[1.6rem] text-black placeholder:text-[#bbbbbb] outline-none focus:border-[#FF6600] focus:shadow-[0_0_0_3px_rgba(255,102,0,0.08)] transition-all" />
        <button onClick={addEmail}
          className="bg-[#FF6600] text-white rounded-[1rem] px-[2rem] py-[1.3rem] text-[1.5rem] cursor-pointer hover:opacity-90 transition-all flex-shrink-0">
          + Add
        </button>
      </div>
      {error && <p className="text-[#c0392b] text-[1.3rem] mb-[1rem]">{error}</p>}
      {emails.length > 0 && (
        <div className="flex flex-wrap gap-[0.8rem] mb-[1rem]">
          {emails.map(email => (
            <span key={email} className="inline-flex items-center gap-[0.6rem] bg-[rgba(255,102,0,0.08)] border border-[rgba(255,102,0,0.25)] text-[#FF6600] text-[1.3rem] px-[1.2rem] py-[0.5rem] rounded-[2rem]">
              {email}
              <button onClick={() => removeEmail(email)} className="text-[#FF6600] hover:text-[#cc5200] cursor-pointer leading-none text-[1.5rem]">×</button>
            </span>
          ))}
        </div>
      )}
      <p className="text-[#bbbbbb] text-[1.2rem]">Press Enter or comma to add each address.</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PDF GENERATOR
// ─────────────────────────────────────────────────────────────────────────────

async function loadImg(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  } catch { return null; }
}

async function generateCombinedPDF({
  submitter, company, services,
  // engagement
  engagementType, engagementRmqVersion, engagementDescription,
  // license
  technical, envUse, packaging, comments, portalUsers,
  // support
  supportUsers,
}) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  const W = 210, H = 297, ML = 18, MR = 18;
  const CW = W - ML - MR;
  const logoData = await loadImg('/redesign/ace_logo_footer.png');

  const orange = [255, 102, 0], teal = [143, 213, 204], black = [0, 0, 0],
        white  = [255, 255, 255], ink = [22, 22, 22], mid = [100, 100, 100],
        light  = [160, 160, 160], bgGray = [248, 248, 248], border = [225, 225, 225];

  const sf  = (r,g,b) => doc.setFillColor(r,g,b);
  const sd  = (r,g,b) => doc.setDrawColor(r,g,b);
  const st  = (r,g,b) => doc.setTextColor(r,g,b);
  const sfA = (a) => doc.setFillColor(...a);
  const sdA = (a) => doc.setDrawColor(...a);
  const stA = (a) => doc.setTextColor(...a);

  let pageNum = 0;
  const addFooter = () => {
    sfA(black); doc.rect(0, H - 10, W, 10, 'F');
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); st(150,150,150);
    doc.text('CONFIDENTIAL  ·  Prepared by AceMQ, The #1 RabbitMQ Partner  ·  acemq.com  ·  onboarding@acemq.com', ML, H - 3.5);
    st(100,100,100); doc.text(String(pageNum), W - MR, H - 3.5, { align: 'right' });
  };
  const newPage = () => { doc.addPage(); pageNum++; addFooter(); return ML + 8; };

  const sectionHead = (title, y) => {
    sfA(orange); doc.rect(ML, y, 3.5, 10, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(13.5); stA(ink);
    doc.text(title, ML + 9, y + 7.2);
    return y + 17;
  };

  const bodyText = (text, y, opts = {}) => {
    const { maxW = CW - 6, size = 10, color = mid, x = ML + 4 } = opts;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(size); stA(color);
    const lines = doc.splitTextToSize(text, maxW);
    doc.text(lines, x, y);
    return y + lines.length * (size * 0.53) + 2;
  };

  const stepBox = (num, title, desc, y) => {
    const descLines = desc ? doc.splitTextToSize(desc, CW - 26) : [];
    const boxH = desc ? 15 + descLines.length * 5 + 5 : 15;
    sfA(bgGray); sdA(border); doc.roundedRect(ML, y, CW, boxH, 2, 2, 'FD');
    sfA(orange); doc.circle(ML + 8, y + 7.5, 5, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); stA(white);
    doc.text(String(num), ML + 8, y + 7.5, { align: 'center', baseline: 'middle' });
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10.5); stA(ink);
    doc.text(title, ML + 17, y + 9);
    if (desc) { doc.setFont('helvetica', 'normal'); doc.setFontSize(9); stA(mid); doc.text(descLines, ML + 17, y + 15); }
    return y + boxH + 4;
  };

  const tableRow = (label, value, y, even = true, labelW = 60) => {
    sfA(even ? bgGray : white); sdA(border); doc.rect(ML, y, CW, 10, 'FD');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); stA(mid);
    doc.text(label.toUpperCase(), ML + 5, y + 6.8);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5); stA(ink);
    const val = String(value || '—');
    doc.text(val.length > 72 ? val.substring(0, 70) + '…' : val, ML + labelW, y + 6.8);
    return y + 10;
  };

  const codeBlock = (code, y) => {
    const lines = doc.splitTextToSize(code, CW - 16);
    const boxH = lines.length * 5 + 12;
    sf(22,22,22); sd(40,40,40); doc.roundedRect(ML, y, CW, boxH, 2, 2, 'FD');
    sfA(teal); doc.circle(ML + 6, y + 6, 1.8, 'F');
    doc.setFont('courier', 'normal'); doc.setFontSize(8.5);
    st(180, 240, 230); doc.text(lines, ML + 12, y + 7.5);
    return y + boxH + 5;
  };

  const need = (y, h) => { if (y + h > H - 20) { y = newPage(); } return y; };

  const selectedNames = [
    services.engagement && 'Engagement',
    services.license && 'License',
    services.support && 'Support',
  ].filter(Boolean);

  // ════════════════════════════════════════════════════════════════════════════
  // PAGE 1 — COVER
  // ════════════════════════════════════════════════════════════════════════════
  pageNum = 1;

  sfA(black); doc.rect(0, 0, W, 62, 'F');
  if (logoData) {
    doc.addImage(logoData, 'PNG', ML, 13, 36, 12);
  } else {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(22); stA(white);
    doc.text('AceMQ', ML, 26);
  }
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); stA(teal);
  doc.text('THE #1 RABBITMQ PARTNER', ML, 37);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8); st(120,120,120);
  doc.text('ONBOARDING REPORT', W - MR, 24, { align: 'right' });
  doc.setFontSize(7); st(80,80,80);
  doc.text(new Date().toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' }), W - MR, 32, { align: 'right' });

  sfA(orange); doc.rect(0, 62, W, 4, 'F');

  doc.setFont('helvetica', 'bold'); doc.setFontSize(32); stA(ink);
  doc.text('AceMQ Onboarding', ML, 86);
  stA(orange); doc.text(selectedNames.join(' + '), ML, 100);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(11); st(110,110,110);
  doc.text('Your comprehensive onboarding package for AceMQ RabbitMQ services.', ML, 113);

  sfA(teal); doc.rect(ML, 120, 32, 2, 'F');

  // Info box
  const infoRowCount = 4 + (services.license ? 2 : 0);
  const infoBoxH = infoRowCount * 9.5 + 12;
  sfA(bgGray); sdA(border); doc.roundedRect(ML, 127, CW, infoBoxH, 3, 3, 'FD');
  const coverRows = [
    ['Prepared for', company],
    ['Submitted by', `${submitter.firstName} ${submitter.lastName}`],
    ['Email', submitter.email],
    ...(submitter.jobTitle ? [['Job Title', submitter.jobTitle]] : []),
    ...(submitter.phone ? [['Phone', submitter.phone]] : []),
    ['Onboarding Types', selectedNames.join(', ')],
    ['Date', new Date().toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' })],
  ];
  let iy = 136;
  coverRows.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); stA(light);
    doc.text(label.toUpperCase(), ML + 8, iy);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5); stA(ink);
    const v = String(value || '—');
    doc.text(v.length > 65 ? v.substring(0, 63) + '…' : v, ML + 60, iy);
    iy += 9.5;
  });

  sfA(bgGray); sdA(border); doc.roundedRect(ML, H - 28, CW, 12, 2, 2, 'FD');
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); st(150,150,150);
  doc.text('This document is confidential and prepared exclusively for ' + company + '.', ML + 5, H - 19.5);
  addFooter();

  // ════════════════════════════════════════════════════════════════════════════
  // ENGAGEMENT SECTION
  // ════════════════════════════════════════════════════════════════════════════
  if (services.engagement) {
    let y = newPage();
    y = sectionHead('Engagement Onboarding', y);
    y = bodyText('The following details have been captured for your AceMQ professional services engagement. Your team will be contacted to confirm next steps within 1 business day.', y);
    y += 8;

    const engRows = [
      ['Company', company],
      ['Contact', `${submitter.firstName} ${submitter.lastName}`],
      ['Email', submitter.email],
      ['Engagement Type', engagementType || '—'],
      ['RabbitMQ Version', engagementRmqVersion || 'Not specified'],
    ];
    engRows.forEach(([lbl, val], i) => { y = tableRow(lbl, val, y, i % 2 === 0, 60); });

    if (engagementDescription) {
      y += 8;
      y = need(y, 30);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(9); stA(mid);
      doc.text('ENGAGEMENT DESCRIPTION / GOALS', ML + 4, y); y += 6;
      sfA(bgGray); sdA(border);
      const dLines = doc.splitTextToSize(engagementDescription, CW - 14);
      doc.roundedRect(ML, y - 2, CW, dLines.length * 5.2 + 10, 2, 2, 'FD');
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5); stA(ink);
      doc.text(dLines, ML + 7, y + 5);
      y += dLines.length * 5.2 + 16;
    }

    y += 8;
    y = need(y, 40);
    y = sectionHead('What to Expect', y);
    y = stepBox(1, 'Initial Discovery Call', 'Your AceMQ engagement manager will schedule a discovery call to align on goals, scope, and timeline.', y);
    y = stepBox(2, 'Statement of Work', 'A tailored SOW will be prepared based on your engagement type and requirements.', y);
    y = stepBox(3, 'Kickoff & Delivery', 'Your AceMQ team begins work per the agreed schedule. Progress updates are provided regularly.', y);
  }

  // ════════════════════════════════════════════════════════════════════════════
  // LICENSE SECTION
  // ════════════════════════════════════════════════════════════════════════════
  if (services.license) {
    let y = newPage();
    y = sectionHead('License Configuration', y);
    y = bodyText('Below is a summary of the license configuration you submitted. Contact licensing@acemq.com if any details need correction.', y);
    y += 6;

    const configRows = [
      ['RabbitMQ Product', technical.rmqProduct],
      ['CPU Core Count', technical.cpuCoreCount],
      ['CPU Core Type', technical.cpuCoreType],
      ['Deployment Environment', technical.deploymentEnv],
    ];
    configRows.forEach(([lbl, val], i) => { y = tableRow(lbl, val, y, i % 2 === 0, 68); });
    y += 10;

    doc.setFont('helvetica', 'bold'); doc.setFontSize(9); stA(mid);
    doc.text('ENVIRONMENT USE', ML + 4, y); y += 5;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10); stA(ink);
    doc.text(envUse.length > 0 ? envUse.join('   ·   ') : '—', ML + 4, y); y += 9;

    doc.setFont('helvetica', 'bold'); doc.setFontSize(9); stA(mid);
    doc.text('PACKAGING FORMATS', ML + 4, y); y += 5;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10); stA(ink);
    const pkgText = packaging.length > 0 ? packaging.join('   ·   ') : '—';
    const pkgLines = doc.splitTextToSize(pkgText, CW - 8);
    doc.text(pkgLines, ML + 4, y); y += pkgLines.length * 5.5 + 9;

    if (comments) {
      y = need(y, 30);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(9); stA(mid);
      doc.text('ADDITIONAL COMMENTS', ML + 4, y); y += 5;
      sfA(bgGray); sdA(border);
      const cLines = doc.splitTextToSize(comments, CW - 14);
      doc.roundedRect(ML, y - 2, CW, cLines.length * 5.2 + 10, 2, 2, 'FD');
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5); stA(ink);
      doc.text(cLines, ML + 7, y + 5);
      y += cLines.length * 5.2 + 16;
    }

    if (portalUsers && portalUsers.length > 0) {
      y = need(y, 40);
      y = sectionHead('License Portal Users', y);
      sfA(black); doc.rect(ML, y, CW, 9, 'F');
      doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); stA(white);
      doc.text('EMAIL ADDRESS', ML + 5, y + 6); doc.text('ROLE', ML + 135, y + 6);
      y += 9;
      const allPUsers = [
        { email: submitter.email, role: 'Submitter' },
        ...portalUsers.map(e => ({ email: e, role: 'Portal User' })),
      ];
      allPUsers.forEach((u, i) => {
        sfA(i % 2 === 0 ? bgGray : white); sdA(border); doc.rect(ML, y, CW, 9, 'FD');
        doc.setFont('helvetica', 'normal'); doc.setFontSize(9); stA(orange);
        doc.text(u.email, ML + 5, y + 6.2); stA(mid);
        doc.text(u.role, ML + 135, y + 6.2);
        y += 9;
      });
    }

    // JFrog access page
    y = newPage();
    y = sectionHead('Accessing Your Images via AceMQ JFrog', y);
    y = bodyText('Your RabbitMQ images are delivered via AceMQ\'s JFrog Artifactory — a smart Docker registry proxying Broadcom upstream. Authenticate once, then pull images normally.', y);
    y += 6;

    sf(18,18,18); sd(40,40,40);
    doc.roundedRect(ML, y, CW, 22, 2, 2, 'FD');
    [
      [ML + 6, 'REGISTRY', 'acemq.jfrog.io'],
      [ML + 6 + CW / 3, 'REMOTE REPO', 'rabbitmq-docker-remote'],
      [ML + 6 + (CW / 3) * 2, 'UPSTREAM', 'Broadcom / VMware Tanzu'],
    ].forEach(([x, lbl, val]) => {
      doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); stA(teal);
      doc.text(lbl, x, y + 8);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5); stA(white);
      doc.text(val, x, y + 16);
    });
    y += 28;

    y = stepBox(1, 'Generate a JFrog Access Token',
      'Log into acemq.jfrog.io → open your profile → Access Tokens → create a token and copy it.', y);
    y = bodyText('Then authenticate Docker:', y, { size: 9, color: mid });
    y = codeBlock('docker login acemq.jfrog.io\n  Username: <your JFrog username>\n  Password: <your JFrog access token>', y);

    y = need(y, 35);
    y = stepBox(2, 'Pull a Tanzu RabbitMQ Image', 'The first pull retrieves from Broadcom and caches in JFrog. All future pulls are served directly from AceMQ.', y);
    y = codeBlock('docker pull acemq.jfrog.io/rabbitmq-docker-remote/vmware-tanzu-rabbitmq:3.13.12', y);

    y = need(y, 35);
    y = stepBox(3, 'Kubernetes — Helm values.yaml', null, y);
    y = codeBlock('image:\n  repository: acemq.jfrog.io/rabbitmq-docker-remote/vmware-tanzu-rabbitmq\n  tag: 3.13.12\n  pullPolicy: IfNotPresent', y);
  }

  // ════════════════════════════════════════════════════════════════════════════
  // SUPPORT SECTION
  // ════════════════════════════════════════════════════════════════════════════
  if (services.support || services.engagement) {
    let y = newPage();
    y = sectionHead('Your Two Support Portals', y);
    y = bodyText('Your AceMQ RabbitMQ support subscription gives you access to two portals, each with a distinct purpose.', y);
    y += 8;

    sfA(black); doc.roundedRect(ML, y, CW, 48, 3, 3, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); stA(teal);
    doc.text('HOME BASE — USE THIS FIRST', ML + 7, y + 9);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(13.5); stA(white);
    doc.text('AceMQ RabbitMQ Support Portal', ML + 7, y + 19);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); st(185,185,185);
    doc.text(doc.splitTextToSize('Knowledge base & AI agent, healthcheck scheduler, training resources, and extended support.', CW - 16), ML + 7, y + 28);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10.5); stA(orange);
    doc.text('rabbitmq-support.portal.acemq.com', ML + 7, y + 43);
    y += 54;

    sfA(bgGray); sdA(border); doc.roundedRect(ML, y, CW, 48, 3, 3, 'FD');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); st(150,150,150);
    doc.text('TICKET PORTAL — FOR RAISING SUPPORT TICKETS ONLY', ML + 7, y + 9);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(13.5); stA(ink);
    doc.text('Jira Support Portal', ML + 7, y + 19);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); stA(mid);
    doc.text(doc.splitTextToSize('Use this portal exclusively for creating, updating, and tracking support tickets.', CW - 16), ML + 7, y + 28);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10.5); stA(orange);
    doc.text('support.acemq.com/rabbitmq', ML + 7, y + 43);
    y += 54;

    sf(255,248,235); doc.setDrawColor(255,195,120);
    doc.roundedRect(ML, y, CW, 40, 2, 2, 'FD');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); st(180,80,0);
    doc.text('Quick Reference', ML + 6, y + 8);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); stA(mid);
    doc.text('Knowledge base, AI help, training, healthcheck', ML + 6, y + 17);
    doc.text('   ->  rabbitmq-support.portal.acemq.com',       ML + 6, y + 23);
    doc.text('Raise or track a support ticket',                 ML + 6, y + 31);
    doc.text('   ->  support.acemq.com/rabbitmq',              ML + 6, y + 37);
    y += 46;

    // Getting started
    y = newPage();
    y = sectionHead('Getting Started', y);
    y = bodyText('Follow these steps to get set up on both portals. You will receive separate invitation emails for each portal.', y);
    y += 6;
    y = stepBox(1, 'Receive Your Invitation Emails', 'Each provisioned user will receive welcome emails from noreply@acemq.com within 1 business day — one for the AceMQ RabbitMQ Support Portal and one for the Jira ticket portal. Check spam if they don\'t arrive.', y);
    y = stepBox(2, 'Set Your Password', 'Click the secure link in each email. You\'ll be prompted to create a password. Use at least 12 characters.', y);
    y = stepBox(3, 'Log In to the AceMQ RabbitMQ Support Portal', 'Navigate to rabbitmq-support.portal.acemq.com — this is your home base for knowledge base, AI agent, healthcheck scheduler, and training.', y);
    y = stepBox(4, 'Log In to the Jira Ticket Portal', 'Navigate to support.acemq.com/rabbitmq to access your ticket queue. Use this portal to raise or track support tickets.', y);
    y = stepBox(5, 'Search Before You Ticket', 'Before raising a ticket, search the knowledge base — our AI agent and runbooks resolve many common issues instantly.', y);

    // Ticket submission + severity
    y = newPage();
    y = sectionHead('Submitting a Support Ticket', y);
    y = bodyText('When you need to raise a ticket, go to support.acemq.com/rabbitmq. Thorough information upfront helps our engineers respond faster.', y);
    y += 6;
    y = stepBox(1, 'Go to support.acemq.com/rabbitmq', 'Log in to the Jira ticket portal.', y);
    y = stepBox(2, 'Click "Create" or "New Ticket"', 'Select the appropriate issue type and project.', y);
    y = stepBox(3, 'Set the Correct Severity Level', 'Choose the severity that best matches your issue (see table below).', y);
    y = stepBox(4, 'Describe Your Issue in Detail', 'Include: RabbitMQ version, Erlang version, cluster size, full error messages, steps to reproduce, and recent changes.', y);
    y = stepBox(5, 'Attach Supporting Files', 'Attach log files, config snippets, or screenshots. Maximum 25 MB per attachment.', y);
    y += 8;

    sfA(black); doc.rect(ML, y, CW, 9, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); stA(white);
    doc.text('SEVERITY', ML + 5, y + 6.2); doc.text('DEFINITION', ML + 42, y + 6.2);
    y += 9;
    [
      ['P1 — Critical', 'Production system down, data loss risk, or complete service outage. No workaround available.'],
      ['P2 — High', 'Significant functionality degraded or partial outage. No acceptable workaround.'],
      ['P3 — Medium', 'Non-critical functionality impacted. A workaround is available.'],
      ['P4 — Low', 'General questions, best practice guidance, or feature requests.'],
    ].forEach((row, i) => {
      sfA(i % 2 === 0 ? bgGray : white); sdA(border); doc.rect(ML, y, CW, 10, 'FD');
      doc.setFont('helvetica', 'bold'); doc.setFontSize(9); stA(i === 0 ? orange : ink);
      doc.text(row[0], ML + 5, y + 6.8);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9); stA(mid);
      doc.text(row[1], ML + 42, y + 6.8);
      y += 10;
    });

    // Provisioned users
    y = newPage();
    y = sectionHead('Provisioned Support Users', y);
    y = bodyText(`The following users have been granted access to ${company} support portals. Each will receive invitation emails within 1 business day.`, y);
    y += 6;

    const allUsers = [
      { firstName: submitter.firstName, lastName: submitter.lastName, email: submitter.email, role: 'Submitter' },
      ...supportUsers.map(u => ({ ...u, role: 'Support User' })),
    ];

    sfA(black); doc.rect(ML, y, CW, 9, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); stA(white);
    doc.text('#', ML + 4, y + 6.2);
    doc.text('NAME', ML + 14, y + 6.2);
    doc.text('EMAIL ADDRESS', ML + 72, y + 6.2);
    doc.text('ROLE', ML + 148, y + 6.2);
    y += 9;
    allUsers.forEach((u, i) => {
      sfA(i % 2 === 0 ? bgGray : white); sdA(border); doc.rect(ML, y, CW, 9, 'FD');
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9); stA(mid);
      doc.text(String(i + 1), ML + 4, y + 6);
      stA(ink); doc.text(`${u.firstName} ${u.lastName}`.trim(), ML + 14, y + 6);
      stA(orange); doc.text(u.email, ML + 72, y + 6);
      stA(mid); doc.text(u.role, ML + 148, y + 6);
      y += 9;
    });
  }

  // ════════════════════════════════════════════════════════════════════════════
  // FINAL PAGE — CONTACT
  // ════════════════════════════════════════════════════════════════════════════
  let y = newPage();
  y = sectionHead('Contact & Support', y);
  [
    ['Onboarding', 'onboarding@acemq.com'],
    ['Support Portal', 'rabbitmq-support.portal.acemq.com'],
    ['Raise a Ticket', 'support.acemq.com/rabbitmq'],
    ['Licensing', 'licensing@acemq.com'],
    ['General', 'support@acemq.com'],
    ['Phone', '+1 305-204-2607'],
  ].forEach(([lbl, val], i) => { y = tableRow(lbl, val, y, i % 2 === 0, 50); });

  return doc;
}

// ─────────────────────────────────────────────────────────────────────────────
// FOOTER
// ─────────────────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="bg-black flex-shrink-0 relative z-10">
      <div className="max-w-[1300px] mx-auto px-[5.6rem] pt-[5rem] pb-[3rem]">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-[4rem]">
          <div>
            <img src="/redesign/ace_logo_footer.png" alt="AceMQ" style={{ width: '10rem' }} className="mb-[1.6rem]" />
            <p className="text-[#D0D5DD] text-[1.3rem] leading-[1.7]">The #1 RabbitMQ Partner.<br />Expert consulting, licensing, and support for enterprise messaging.</p>
          </div>
          <div>
            <p className="text-white text-[1.4rem] font-[700] mb-[1.4rem]">Contact</p>
            <div className="flex flex-col gap-[1rem]">
              <div className="flex items-center gap-[0.8rem] text-[#D0D5DD] text-[1.3rem]">
                <img src="/redesign/message.svg" alt="" className="w-[1.4rem] h-[1.4rem] opacity-60" />
                onboarding@acemq.com
              </div>
              <div className="flex items-center gap-[0.8rem] text-[#D0D5DD] text-[1.3rem]">
                <img src="/redesign/phone.svg" alt="" className="w-[1.4rem] h-[1.4rem] opacity-60" />
                +1 305-204-2607
              </div>
              <div className="flex items-center gap-[0.8rem] text-[#D0D5DD] text-[1.3rem]">
                <img src="/redesign/location.svg" alt="" className="w-[1.4rem] h-[1.4rem] opacity-60" />
                United States
              </div>
            </div>
          </div>
          <div>
            <p className="text-white text-[1.4rem] font-[700] mb-[1.4rem]">Navigate</p>
            <div className="flex flex-col gap-[0.8rem]">
              <a href="https://acemq.com/rabbitmq/licensing" target="_blank" rel="noopener noreferrer" className="text-[#D0D5DD] text-[1.3rem] hover:text-white transition-colors">RabbitMQ Licensing</a>
              <a href="https://acemq.com/rabbitmq" target="_blank" rel="noopener noreferrer" className="text-[#D0D5DD] text-[1.3rem] hover:text-white transition-colors">RabbitMQ Services</a>
              <a href="https://acemq.com/support" target="_blank" rel="noopener noreferrer" className="text-[#D0D5DD] text-[1.3rem] hover:text-white transition-colors">RabbitMQ Support</a>
            </div>
          </div>
        </div>
        <div className="border-t border-[#475467] mt-[3rem] pt-[2rem] text-center">
          <p className="text-[#D0D5DD] text-[1.1rem]">© {new Date().getFullYear()} AceMQ, an Ace8 Company. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function CombinedOnboarding() {
  // ── Navigation ──
  const [stepIdx, setStepIdx] = useState(0);
  const [stepList, setStepList] = useState(['contact', 'services']);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [pdfDoc, setPdfDoc] = useState(null);

  // ── Contact Info ──
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [company, setCompany] = useState('');
  const [workEmail, setWorkEmail] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [phone, setPhone] = useState('');

  // ── Service Selection ──
  const [services, setServices] = useState({ engagement: false, support: false, license: false });

  // ── Engagement fields ──
  const [engagementType, setEngagementType] = useState('');
  const [engagementRmqVersion, setEngagementRmqVersion] = useState('');
  const [engagementDescription, setEngagementDescription] = useState('');

  // ── License fields ──
  const [cpuCoreCount, setCpuCoreCount] = useState('');
  const [cpuCoreType, setCpuCoreType] = useState('');
  const [deploymentEnv, setDeploymentEnv] = useState('');
  const [rmqProduct, setRmqProduct] = useState('');
  const [envUse, setEnvUse] = useState([]);
  const [packaging, setPackaging] = useState([]);
  const [comments, setComments] = useState('');
  const [portalEmails, setPortalEmails] = useState([]);

  // ── Support fields ──
  const [supportUsers, setSupportUsers] = useState([]);

  const toggleArr = (arr, setArr, val) =>
    setArr(arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val]);

  const isEmailValid = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  const currentStep = stepList[stepIdx];
  const formSteps = stepList.filter(s => s !== 'contact' && s !== 'services');
  const totalFormSteps = 2 + formSteps.length; // contact + services + dynamic
  const currentFormStepNum = stepIdx + 1;
  const pct = Math.round((stepIdx / (stepList.length - 1)) * 100);

  const scrollTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  const goNext = () => { setStepIdx(i => i + 1); scrollTop(); };
  const goBack = () => { setStepIdx(i => i - 1); scrollTop(); };

  const confirmServices = () => {
    const list = buildStepList(services);
    setStepList(list);
    setStepIdx(2);
    scrollTop();
  };

  const submitterInfo = { firstName, lastName, email: workEmail, jobTitle, phone };

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      // Generate PDF client-side
      const doc = await generateCombinedPDF({
        submitter: submitterInfo,
        company,
        services,
        engagementType,
        engagementRmqVersion,
        engagementDescription,
        technical: { cpuCoreCount, cpuCoreType, deploymentEnv, rmqProduct },
        envUse,
        packaging,
        comments,
        portalUsers: portalEmails,
        supportUsers,
      });

      setPdfDoc(doc);
      const pdfBase64 = doc.output('datauristring').split(',')[1];

      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submitter: submitterInfo,
          company,
          services,
          engagementType,
          engagementRmqVersion,
          engagementDescription,
          technical: { cpuCoreCount, cpuCoreType, deploymentEnv, rmqProduct },
          envUse,
          packaging,
          comments,
          portalUsers: portalEmails,
          supportUsers,
          pdfBase64,
          pdfFilename: `AceMQ-Onboarding-${company.replace(/\s+/g, '-')}.pdf`,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Server error ${res.status}`);
      }

      setSubmitted(true);
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!pdfDoc) return;
    const link = document.createElement('a');
    link.href = pdfDoc.output('datauristring');
    link.download = `AceMQ-Onboarding-${company.replace(/\s+/g, '-')}.pdf`;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const anyServiceSelected = services.engagement || services.support || services.license;

  return (
    <div className="min-h-screen grid-bg flex flex-col relative">

      {/* NAV */}
      <nav className="bg-white border-b border-[rgba(0,0,0,0.08)] px-[5.6rem] py-[1.8rem] flex items-center justify-between flex-shrink-0 relative z-10">
        <img src="/redesign/logo.png" alt="AceMQ" style={{ width: '11.3rem' }} />
        <p className="text-[1.2rem] text-[#999999] tracking-[0.05em] hidden sm:block">AceMQ Onboarding</p>
      </nav>

      {/* PROGRESS BAR */}
      {!submitted && stepIdx >= 0 && (
        <div className="bg-white border-b border-[rgba(0,0,0,0.06)] px-[5.6rem] py-[1.4rem] flex-shrink-0 relative z-10">
          <div className="flex justify-between text-[1.2rem] text-[#999999] mb-[0.8rem]">
            <span>Step {currentFormStepNum} of {totalFormSteps}</span>
            <span>{pct}%</span>
          </div>
          <div className="h-[2px] bg-[rgba(0,0,0,0.08)] rounded-full">
            <div className="h-full bg-[#FF6600] rounded-full transition-all duration-500 ease-in-out" style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}

      {/* MAIN CARD */}
      <div className="flex-1 flex items-start justify-center px-[1.5rem] sm:px-[5.6rem] py-[5.2rem] pb-[8rem] relative z-[1]">
        <div className={`bg-white border border-[rgba(0,0,0,0.08)] rounded-[2rem] w-full relative overflow-hidden shadow-[0_2px_40px_rgba(0,0,0,0.06)] ${
          currentStep === 'support-users' ? 'max-w-[72rem]' : 'max-w-[62rem]'
        }`}
          style={{ padding: 'clamp(3.2rem, 5vw, 5.2rem) clamp(2.4rem, 5vw, 5.6rem)' }}>

          {!submitted && (
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#FF6600]" />
          )}

          <div key={currentStep + (submitted ? '-success' : '')} className="animate-fade-slide">

            {/* ── CONTACT INFO ── */}
            {currentStep === 'contact' && !submitted && (
              <div>
                <div className="absolute top-0 left-0 right-0 h-[4px] bg-gradient-to-r from-[#FF6600] via-[#FF8C40] to-[#8FD5CC]" />
                <SectionLabel>Step 1 — Contact Information</SectionLabel>
                <QHead>Tell us about yourself</QHead>
                <QSub>We'll use this to set up your account and send your onboarding report.</QSub>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-[1rem]">
                  <TF placeholder="First Name *" value={firstName} onChange={e => setFirstName(e.target.value)} />
                  <TF placeholder="Last Name *" value={lastName} onChange={e => setLastName(e.target.value)} />
                </div>
                <TF placeholder="Company Name *" value={company} onChange={e => setCompany(e.target.value)} />
                <TF type="email" placeholder="Work Email *" value={workEmail} onChange={e => setWorkEmail(e.target.value)} />
                <TF placeholder="Job Title (optional)" value={jobTitle} onChange={e => setJobTitle(e.target.value)} />
                <TF type="tel" placeholder="Phone Number (optional)" value={phone} onChange={e => setPhone(e.target.value)} />
                <div className="flex justify-end mt-[3rem] pt-[2.2rem] border-t border-[rgba(0,0,0,0.08)]">
                  <BtnOrange
                    onClick={goNext}
                    disabled={!firstName.trim() || !lastName.trim() || !company.trim() || !isEmailValid(workEmail)}>
                    Continue →
                  </BtnOrange>
                </div>
              </div>
            )}

            {/* ── SERVICE SELECTION ── */}
            {currentStep === 'services' && !submitted && (
              <div>
                <SectionLabel>Step 2 — Select Your Onboarding</SectionLabel>
                <QHead>Which onboarding do you need?</QHead>
                <QSub>Select all that apply. We'll guide you through each one in a single experience.</QSub>
                <div className="flex flex-col gap-[1.2rem] mb-[2.4rem]">
                  <ServiceCheckbox
                    checked={services.engagement}
                    onChange={e => setServices(s => ({ ...s, engagement: e.target.checked }))}
                    icon="🤝"
                    title="Engagement Onboarding"
                    desc="For new AceMQ professional services engagements — consulting, migration, architecture review, and more."
                  />
                  <ServiceCheckbox
                    checked={services.support}
                    onChange={e => setServices(s => ({ ...s, support: e.target.checked }))}
                    icon="🎫"
                    title="Support Onboarding"
                    desc="Set up your team's access to the RabbitMQ Support Portal and Jira ticket system."
                  />
                  <ServiceCheckbox
                    checked={services.license}
                    onChange={e => setServices(s => ({ ...s, license: e.target.checked }))}
                    icon="🔑"
                    title="License Onboarding"
                    desc="Provision your RabbitMQ license, JFrog image access, and portal users."
                  />
                </div>
                <div className="flex items-center justify-between mt-[3rem] pt-[2.2rem] border-t border-[rgba(0,0,0,0.08)]">
                  <BtnGhost onClick={goBack}>← Back</BtnGhost>
                  <BtnOrange onClick={confirmServices} disabled={!anyServiceSelected}>
                    Continue →
                  </BtnOrange>
                </div>
              </div>
            )}

            {/* ── ENGAGEMENT DETAILS ── */}
            {currentStep === 'engagement' && !submitted && (
              <div>
                <SectionLabel>Engagement Onboarding</SectionLabel>
                <QHead>Tell us about your engagement</QHead>
                <QSub>Help us understand what you're looking to accomplish with AceMQ.</QSub>

                <p className="text-[1.4rem] font-[600] text-[#161616] mb-[1rem]">Engagement Type *</p>
                {ENGAGEMENT_TYPE_OPTIONS.map(opt => (
                  <Choice key={opt} selected={engagementType === opt} onClick={() => setEngagementType(opt)}>{opt}</Choice>
                ))}

                <p className="text-[1.4rem] font-[600] text-[#161616] mb-[1rem] mt-[2rem]">Current RabbitMQ Version <span className="text-[#999] font-[400]">(if applicable)</span></p>
                <TF placeholder="e.g. 3.12.6, 3.13.x, not currently using RabbitMQ…" value={engagementRmqVersion} onChange={e => setEngagementRmqVersion(e.target.value)} />

                <p className="text-[1.4rem] font-[600] text-[#161616] mb-[1rem] mt-[1rem]">Description of Goals & Requirements *</p>
                <TA
                  placeholder="Describe your environment, challenges, and what you'd like to achieve through this engagement..."
                  value={engagementDescription}
                  onChange={e => setEngagementDescription(e.target.value)}
                  rows={5}
                />

                <div className="flex items-center justify-between mt-[3rem] pt-[2.2rem] border-t border-[rgba(0,0,0,0.08)]">
                  <BtnGhost onClick={goBack}>← Back</BtnGhost>
                  <BtnOrange onClick={goNext} disabled={!engagementType || !engagementDescription.trim()}>
                    Continue →
                  </BtnOrange>
                </div>
              </div>
            )}

            {/* ── LICENSE TECHNICAL ── */}
            {currentStep === 'license-tech' && !submitted && (
              <div>
                <SectionLabel>License Onboarding</SectionLabel>
                <QHead>Technical configuration</QHead>
                <QSub>This helps us deliver the right license for your infrastructure.</QSub>

                <p className="text-[1.4rem] font-[600] text-[#161616] mb-[0.6rem]">CPU Core Count *</p>
                <TF placeholder="e.g. 16" value={cpuCoreCount} onChange={e => setCpuCoreCount(e.target.value)} />

                <p className="text-[1.4rem] font-[600] text-[#161616] mb-[1rem] mt-[0.6rem]">CPU Core Type *</p>
                {['vCPU', 'Physical CPU'].map(opt => (
                  <Choice key={opt} selected={cpuCoreType === opt} onClick={() => setCpuCoreType(opt)}>{opt}</Choice>
                ))}

                <p className="text-[1.4rem] font-[600] text-[#161616] mb-[1rem] mt-[2rem]">Deployment Environment *</p>
                {DEPLOYMENT_ENV_OPTIONS.map(opt => (
                  <Choice key={opt} selected={deploymentEnv === opt} onClick={() => setDeploymentEnv(opt)}>{opt}</Choice>
                ))}

                <p className="text-[1.4rem] font-[600] text-[#161616] mb-[1rem] mt-[2rem]">RabbitMQ Product *</p>
                {RABBITMQ_PRODUCT_OPTIONS.map(opt => (
                  <Choice key={opt} selected={rmqProduct === opt} onClick={() => setRmqProduct(opt)}>{opt}</Choice>
                ))}

                <div className="flex items-center justify-between mt-[3rem] pt-[2.2rem] border-t border-[rgba(0,0,0,0.08)]">
                  <BtnGhost onClick={goBack}>← Back</BtnGhost>
                  <BtnOrange onClick={goNext} disabled={!cpuCoreCount.trim() || !cpuCoreType || !deploymentEnv || !rmqProduct}>
                    Continue →
                  </BtnOrange>
                </div>
              </div>
            )}

            {/* ── LICENSE USAGE ── */}
            {currentStep === 'license-usage' && !submitted && (
              <div>
                <SectionLabel>License Onboarding</SectionLabel>
                <QHead>Usage & packaging</QHead>
                <QSub>Select all that apply to help us configure the right license scope.</QSub>

                <p className="text-[1.4rem] font-[600] text-[#161616] mb-[1rem]">Environment Use <span className="text-[#999] font-[400]">(select all that apply)</span></p>
                {ENVIRONMENT_USE_OPTIONS.map(opt => (
                  <Chip key={opt} selected={envUse.includes(opt)} onClick={() => toggleArr(envUse, setEnvUse, opt)}>{opt}</Chip>
                ))}

                <p className="text-[1.4rem] font-[600] text-[#161616] mb-[1rem] mt-[2.4rem]">Packaging Format <span className="text-[#999] font-[400]">(select all that apply)</span></p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-[1rem]">
                  {PACKAGING_FORMAT_OPTIONS.map(opt => (
                    <Chip key={opt} selected={packaging.includes(opt)} onClick={() => toggleArr(packaging, setPackaging, opt)}>{opt}</Chip>
                  ))}
                </div>

                <p className="text-[1.4rem] font-[600] text-[#161616] mb-[1rem] mt-[2.4rem]">Additional Comments <span className="text-[#999] font-[400]">(optional)</span></p>
                <TA placeholder="Any other details about your environment or requirements…" value={comments} onChange={e => setComments(e.target.value)} />

                <div className="flex items-center justify-between mt-[3rem] pt-[2.2rem] border-t border-[rgba(0,0,0,0.08)]">
                  <BtnGhost onClick={goBack}>← Back</BtnGhost>
                  <BtnOrange onClick={goNext} disabled={envUse.length === 0 || packaging.length === 0}>
                    Continue →
                  </BtnOrange>
                </div>
              </div>
            )}

            {/* ── LICENSE PORTAL USERS ── */}
            {currentStep === 'license-users' && !submitted && (
              <div>
                <SectionLabel>License Onboarding</SectionLabel>
                <QHead>License portal users</QHead>
                <QSub>
                  Add everyone who needs access to the RabbitMQ licensing portal. Your email{' '}
                  <span className="text-[#FF6600]">{workEmail}</span> is included automatically.
                </QSub>

                <EmailTagInput emails={portalEmails} setEmails={setPortalEmails} />

                {!stepList.includes('support-users') && submitError && (
                  <p className="text-[#c0392b] text-[1.3rem] mt-[1rem] bg-[rgba(192,57,43,0.07)] border border-[rgba(192,57,43,0.2)] rounded-[0.8rem] px-[1.2rem] py-[0.8rem]">
                    {submitError}
                  </p>
                )}

                <div className="flex items-center justify-between mt-[3rem] pt-[2.2rem] border-t border-[rgba(0,0,0,0.08)]">
                  <BtnGhost onClick={goBack}>← Back</BtnGhost>
                  {stepList.includes('support-users') ? (
                    <BtnOrange onClick={goNext}>Continue →</BtnOrange>
                  ) : (
                    <BtnOrange onClick={handleSubmit} disabled={submitting}>
                      {submitting ? 'Submitting…' : 'Submit & Get Report →'}
                    </BtnOrange>
                  )}
                </div>
              </div>
            )}

            {/* ── SUPPORT PORTAL USERS ── */}
            {currentStep === 'support-users' && !submitted && (
              <div>
                <SectionLabel>Support Portal Users</SectionLabel>
                <QHead>Who needs support access?</QHead>
                <QSub>
                  Add each team member who should be able to create and manage support tickets.{' '}
                  <span className="text-[#FF6600]">{firstName} {lastName}</span> is included automatically.
                </QSub>

                <SupportUsersEditor users={supportUsers} setUsers={setSupportUsers} />

                {submitError && (
                  <p className="text-[#c0392b] text-[1.3rem] mt-[1rem] bg-[rgba(192,57,43,0.07)] border border-[rgba(192,57,43,0.2)] rounded-[0.8rem] px-[1.2rem] py-[0.8rem]">
                    {submitError}
                  </p>
                )}

                <div className="flex items-center justify-between mt-[3rem] pt-[2.2rem] border-t border-[rgba(0,0,0,0.08)]">
                  <BtnGhost onClick={goBack}>← Back</BtnGhost>
                  <BtnOrange onClick={handleSubmit} disabled={submitting || supportUsers.length === 0}>
                    {submitting ? (
                      <span className="flex items-center gap-[0.8rem]">
                        <svg className="w-[1.6rem] h-[1.6rem] animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                        </svg>
                        Submitting…
                      </span>
                    ) : 'Submit & Get Report →'}
                  </BtnOrange>
                </div>
              </div>
            )}

            {/* ── SUCCESS ── */}
            {submitted && (
              <div className="text-center py-[2rem]">
                <div className="w-[6rem] h-[6rem] bg-[rgba(39,174,96,0.1)] rounded-full flex items-center justify-center mx-auto mb-[2rem]">
                  <svg className="w-[3rem] h-[3rem] stroke-[#27ae60] fill-none" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <QHead>Onboarding Complete!</QHead>
                <QSub className="max-w-[48rem] mx-auto">
                  Your onboarding has been submitted for <strong>{company}</strong>.
                  Our team will be in touch within <strong>1 business day</strong>.
                </QSub>

                <div className="bg-[rgba(255,102,0,0.04)] border border-[rgba(255,102,0,0.2)] rounded-[1.6rem] p-[2.4rem] mb-[2rem] max-w-[50rem] mx-auto">
                  <div className="text-[2.4rem] mb-[1rem]">📄</div>
                  <p className="text-[1.6rem] font-[700] text-[#161616] mb-[0.6rem]">Download Your Onboarding Report</p>
                  <p className="text-[1.3rem] text-[#666] mb-[2rem]">
                    Your AceMQ-branded PDF has been emailed to our team. Download a copy for your records.
                  </p>
                  <BtnOrange onClick={handleDownloadPDF} className="mx-auto">
                    Download PDF Report →
                  </BtnOrange>
                </div>

                <div className="bg-[rgba(143,213,204,0.07)] border border-[rgba(143,213,204,0.3)] rounded-[1.2rem] p-[1.6rem] max-w-[50rem] mx-auto mb-[2rem] text-left">
                  <p className="text-[1.3rem] font-[700] text-[#161616] mb-[0.8rem]">What happens next?</p>
                  <div className="flex flex-col gap-[0.6rem]">
                    {services.engagement && (
                      <div className="flex items-start gap-[0.8rem] text-[1.3rem] text-[#444]">
                        <span className="text-[#FF6600] font-[700] flex-shrink-0">🤝</span>
                        <span>Your engagement manager will schedule a discovery call.</span>
                      </div>
                    )}
                    {services.support && (
                      <div className="flex items-start gap-[0.8rem] text-[1.3rem] text-[#444]">
                        <span className="text-[#FF6600] font-[700] flex-shrink-0">🎫</span>
                        <span>Portal invitation emails sent to all support users within 1 business day.</span>
                      </div>
                    )}
                    {services.license && (
                      <div className="flex items-start gap-[0.8rem] text-[1.3rem] text-[#444]">
                        <span className="text-[#FF6600] font-[700] flex-shrink-0">🔑</span>
                        <span>Your license configuration is being processed. JFrog access will be set up.</span>
                      </div>
                    )}
                  </div>
                </div>

                <p className="text-[1.3rem] text-[#999]">
                  Questions? Email{' '}
                  <a href="mailto:onboarding@acemq.com" className="text-[#FF6600] hover:underline">onboarding@acemq.com</a>
                  {' '}or call +1 305-204-2607
                </p>
              </div>
            )}

          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
