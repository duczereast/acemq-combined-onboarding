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

const SCHEDULING_OPTIONS = [
  'Fixed Reoccurring Time Slot',
  'Dynamically Scheduled Sessions',
];

const TIME_SLOT_OPTIONS = [
  'Mornings (9am–12pm)',
  'Afternoons (12pm–5pm)',
  'Full-day availability',
  'Flexible / No preference',
];

const TIMEZONE_OPTIONS = [
  'Eastern (ET) — UTC-5/4',
  'Central (CT) — UTC-6/5',
  'Mountain (MT) — UTC-7/6',
  'Pacific (PT) — UTC-8/7',
  'Alaska (AKT) — UTC-9/8',
  'Hawaii (HT) — UTC-10',
  'Atlantic (AT) — UTC-4/3',
  'UTC / GMT',
  'London (GMT/BST) — UTC+0/1',
  'Central European (CET) — UTC+1/2',
  'Eastern European (EET) — UTC+2/3',
  'India (IST) — UTC+5:30',
  'Singapore / HKT — UTC+8',
  'Japan (JST) — UTC+9',
  'Sydney (AEST) — UTC+10/11',
  'New Zealand (NZST) — UTC+12/13',
];

const ENGAGEMENT_ROLE_OPTIONS = [
  'Lead Stakeholder',
  'Technical Lead',
  'Architect',
  'Platform Owner',
  'Project Manager',
  'Observer',
  'Other',
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
// SECTION TRANSITION HEADER
// ─────────────────────────────────────────────────────────────────────────────

function SectionHeader({ icon, label, accent, stepLabel, steps }) {
  return (
    <div className="rounded-[1.4rem] overflow-hidden mb-[3.2rem]" style={{ border: `1.5px solid ${accent}22` }}>
      {/* Colored top band */}
      <div className="flex items-center gap-[1.4rem] px-[2rem] py-[1.6rem]" style={{ background: `${accent}12` }}>
        <span className="text-[2.4rem] leading-none">{icon}</span>
        <div className="flex-1">
          <p className="text-[1.1rem] font-[700] tracking-[0.12em] uppercase mb-[0.2rem]" style={{ color: accent }}>
            {stepLabel}
          </p>
          <p className="text-[1.8rem] font-[700] text-[#161616]">{label}</p>
        </div>
        <div className="flex items-center gap-[0.6rem]">
          {steps.map((s, i) => (
            <span key={i} className="w-[0.8rem] h-[0.8rem] rounded-full"
              style={{ background: i === 0 ? accent : `${accent}33` }} />
          ))}
        </div>
      </div>
      {/* What's covered */}
      <div className="px-[2rem] py-[1.2rem] bg-white flex flex-wrap gap-x-[2rem] gap-y-[0.4rem]">
        {steps.map((s, i) => (
          <span key={i} className="flex items-center gap-[0.5rem] text-[1.25rem]"
            style={{ color: i === 0 ? '#161616' : '#bbb' }}>
            <span style={{ color: i === 0 ? accent : '#ccc' }}>{i === 0 ? '●' : '○'}</span>
            {s}
          </span>
        ))}
      </div>
    </div>
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
// ENGAGEMENT PARTICIPANTS EDITOR
// ─────────────────────────────────────────────────────────────────────────────

function EngagementParticipantsEditor({ participants, setParticipants }) {
  const [draft, setDraft] = useState({ firstName: '', lastName: '', title: '', email: '', role: '' });
  const [error, setError] = useState('');

  const isEmailValid = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());

  const addParticipant = () => {
    if (!draft.firstName.trim()) { setError('First name is required.'); return; }
    if (!draft.email.trim() || !isEmailValid(draft.email)) { setError('A valid email address is required.'); return; }
    if (!draft.role) { setError('Please select an engagement role.'); return; }
    if (participants.some(p => p.email.toLowerCase() === draft.email.toLowerCase().trim())) {
      setError('This email is already added.'); return;
    }
    setParticipants([...participants, {
      firstName: draft.firstName.trim(),
      lastName: draft.lastName.trim(),
      title: draft.title.trim(),
      email: draft.email.trim(),
      role: draft.role,
    }]);
    setDraft({ firstName: '', lastName: '', title: '', email: '', role: '' });
    setError('');
  };

  const removeParticipant = (idx) => setParticipants(participants.filter((_, i) => i !== idx));

  return (
    <div>
      <div className="bg-[#fafafa] border border-[rgba(0,0,0,0.08)] rounded-[1.2rem] p-[1.6rem] mb-[1.6rem]">
        <p className="text-[1.3rem] font-[600] text-[#161616] mb-[1.2rem]">Add a participant</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-[1rem]">
          <input placeholder="First Name *" value={draft.firstName}
            onChange={e => { setDraft(d => ({ ...d, firstName: e.target.value })); setError(''); }}
            className="w-full bg-white border border-[rgba(0,0,0,0.12)] rounded-[1rem] px-[1.6rem] py-[1.2rem] text-[1.5rem] text-black placeholder:text-[#bbbbbb] outline-none focus:border-[#FF6600] transition-all mb-[1rem]" />
          <input placeholder="Last Name" value={draft.lastName}
            onChange={e => setDraft(d => ({ ...d, lastName: e.target.value }))}
            className="w-full bg-white border border-[rgba(0,0,0,0.12)] rounded-[1rem] px-[1.6rem] py-[1.2rem] text-[1.5rem] text-black placeholder:text-[#bbbbbb] outline-none focus:border-[#FF6600] transition-all mb-[1rem]" />
        </div>
        <input placeholder="Job Title" value={draft.title}
          onChange={e => setDraft(d => ({ ...d, title: e.target.value }))}
          className="w-full bg-white border border-[rgba(0,0,0,0.12)] rounded-[1rem] px-[1.6rem] py-[1.2rem] text-[1.5rem] text-black placeholder:text-[#bbbbbb] outline-none focus:border-[#FF6600] transition-all mb-[1rem]" />
        <input type="email" placeholder="Email Address *" value={draft.email}
          onChange={e => { setDraft(d => ({ ...d, email: e.target.value })); setError(''); }}
          className="w-full bg-white border border-[rgba(0,0,0,0.12)] rounded-[1rem] px-[1.6rem] py-[1.2rem] text-[1.5rem] text-black placeholder:text-[#bbbbbb] outline-none focus:border-[#FF6600] transition-all mb-[1rem]" />
        <select value={draft.role} onChange={e => { setDraft(d => ({ ...d, role: e.target.value })); setError(''); }}
          className="w-full bg-white border border-[rgba(0,0,0,0.12)] rounded-[1rem] px-[1.6rem] py-[1.2rem] text-[1.5rem] text-black outline-none focus:border-[#FF6600] transition-all mb-[1rem] cursor-pointer">
          <option value="">Engagement Role *</option>
          {ENGAGEMENT_ROLE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        {error && <p className="text-[#c0392b] text-[1.3rem] mb-[1rem]">{error}</p>}
        <button onClick={addParticipant}
          className="bg-[#FF6600] text-white rounded-[0.8rem] px-[2rem] py-[1rem] text-[1.4rem] cursor-pointer hover:opacity-90 transition-all">
          + Add Participant
        </button>
      </div>
      {participants.length > 0 && (
        <div className="border border-[rgba(0,0,0,0.08)] rounded-[1.2rem] overflow-hidden mb-[1.6rem]">
          <div className="bg-[#f5f5f5] grid grid-cols-[1fr_1.4fr_1fr_auto] px-[1.6rem] py-[1rem] text-[1.2rem] font-[700] text-[#666] uppercase tracking-[0.05em]">
            <span>Name</span><span>Email</span><span>Role</span><span></span>
          </div>
          {participants.map((p, i) => (
            <div key={i} className={`grid grid-cols-[1fr_1.4fr_1fr_auto] px-[1.6rem] py-[1.2rem] text-[1.4rem] items-center ${i % 2 === 0 ? 'bg-white' : 'bg-[#fafafa]'} border-t border-[rgba(0,0,0,0.06)]`}>
              <div>
                <span className="text-[#161616] font-[600] block">{p.firstName} {p.lastName}</span>
                {p.title && <span className="text-[#999] text-[1.2rem]">{p.title}</span>}
              </div>
              <span className="text-[#FF6600] text-[1.3rem] truncate">{p.email}</span>
              <span className="text-[#666]">{p.role}</span>
              <button onClick={() => removeParticipant(i)} className="text-[#c0392b] hover:text-[#a93226] text-[1.8rem] leading-none cursor-pointer px-[0.8rem]">×</button>
            </div>
          ))}
        </div>
      )}
      {participants.length === 0 && (
        <p className="text-[#bbbbbb] text-[1.3rem] text-center py-[1.2rem]">No participants added yet.</p>
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
  engagementParticipants,
  kickoffDate, teamTimezone, schedulingPref, timeSlotPref, engagementDescription,
  // license
  technical, envUse, packaging, comments, portalUsers,
  // support
  supportUsers,
}) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  const W = 210, H = 297, ML = 20, MR = 20;
  const CW = W - ML - MR;

  const logoLg = await loadImg('/redesign/logo.png');
  const logoSm = await loadImg('/redesign/ace_logo_footer.png');

  // Brand palette — AceMQ Standard Doc Format
  const orange  = [255, 102, 0];
  const ink     = [22, 22, 22];
  const body    = [65, 65, 65];
  const mid     = [120, 120, 120];
  const white   = [255, 255, 255];
  const bgGray  = [248, 248, 248];
  const border  = [215, 215, 215];
  const tblHdr  = [30, 30, 30];
  const codeBg  = [243, 243, 243];
  const callBg  = [255, 249, 238];
  const callBdr = [255, 190, 105];

  const sf = (c) => doc.setFillColor(c[0], c[1], c[2]);
  const sd = (c) => doc.setDrawColor(c[0], c[1], c[2]);
  const st = (c) => doc.setTextColor(c[0], c[1], c[2]);

  const dateStr  = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const dateShort = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
  const docTitle = 'AceMQ Onboarding Report';

  const selectedNames = [
    services.engagement && 'Engagement',
    services.license    && 'License',
    services.support    && 'Support',
  ].filter(Boolean);

  let pageNum = 0;

  // ── Footer: thin rule + "AceMQ · an ace8 company" | "DocTitle · Date · Page N" ──
  const addFooter = () => {
    sd(border); doc.setLineWidth(0.25);
    doc.line(ML, H - 13, W - MR, H - 13);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); st(mid);
    doc.text('AceMQ  ·  an ace8 company', ML, H - 7.5);
    doc.text(`${docTitle}  ·  ${dateShort}  ·  Page ${pageNum}`, W - MR, H - 7.5, { align: 'right' });
  };

  // ── Small logo top-right ──
  const addSmLogo = () => {
    const lg = logoSm || logoLg;
    if (lg) doc.addImage(lg, 'PNG', W - MR - 25, 9, 25, 10);
  };

  // ── Orange breadcrumb banner (full-width, white text) ──
  const addBanner = (docLabel, sectionBold, trailItems = []) => {
    sf(orange); doc.rect(0, 7, W, 15, 'F');
    let x = ML;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); st(white);
    const dl = docLabel.toUpperCase() + '  ';
    doc.text(dl, x, 17);
    x += doc.getTextWidth(dl);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9); st(white);
    const sb = sectionBold.toUpperCase();
    doc.text(sb, x, 17);
    x += doc.getTextWidth(sb);
    if (trailItems.length) {
      doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); st([255, 215, 168]);
      doc.text('  ' + trailItems.join('  ·  '), x, 17);
    }
  };

  // ── New content page ──
  const newPage = (docLabel, sectionBold, trailItems = []) => {
    doc.addPage(); pageNum++;
    addSmLogo();
    addBanner(docLabel, sectionBold, trailItems);
    addFooter();
    return 30;
  };

  // ── Section heading with orange left-bar accent ──
  const secHead = (n, title, y) => {
    sf(orange); doc.rect(ML - 5, y - 11, 3.5, 13, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(17); st(ink);
    doc.text(`${n}.  ${title}`, ML, y);
    return y + 14;
  };

  // ── Sub-section heading with orange left-bar accent ──
  const subHead = (label, y) => {
    sf(orange); doc.rect(ML - 4, y - 8, 3, 10, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(11); st(ink);
    doc.text(label, ML, y);
    return y + 10;
  };

  // ── Body paragraph ──
  const para = (text, y, w = CW) => {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5); st(body);
    const lines = doc.splitTextToSize(text, w);
    doc.text(lines, ML, y);
    return y + lines.length * 5.5 + 3;
  };

  // ── Table header row (dark background, white bold text) ──
  const tblHead = (cols, colW, y) => {
    sf(tblHdr); sd(tblHdr); doc.setLineWidth(0.2);
    doc.rect(ML, y, CW, 9, 'F');
    let x = ML + 3;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); st(white);
    cols.forEach((c, i) => { doc.text(c, x, y + 6.3); x += colW[i]; });
    return y + 9;
  };

  // ── Two-column detail row (alternating rows) ──
  const detRow = (label, value, y, even, lw = 58) => {
    sf(even ? bgGray : white); sd(border); doc.setLineWidth(0.2);
    doc.rect(ML, y, CW, 9, 'FD');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); st(mid);
    doc.text(label, ML + 3, y + 6.3);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); st(ink);
    const v = String(value || '—');
    doc.text(v.length > 70 ? v.substring(0, 68) + '…' : v, ML + lw, y + 6.3);
    return y + 9;
  };

  // ── Code block: plain light-gray background, no left accent (matches Standard Doc Format) ──
  const codeBox = (code, y) => {
    const lines = doc.splitTextToSize(code, CW - 10);
    const bh = lines.length * 4.9 + 11;
    sf(codeBg); sd(border); doc.setLineWidth(0.3);
    doc.roundedRect(ML, y, CW, bh, 1.5, 1.5, 'FD');
    doc.setFont('courier', 'normal'); doc.setFontSize(8.5); st(ink);
    doc.text(lines, ML + 5, y + 7.5);
    return y + bh + 5;
  };

  // ── Callout box: warm background, left orange stripe ──
  const callBox = (text, y) => {
    const lines = doc.splitTextToSize(text, CW - 17);
    const bh = lines.length * 5.5 + 13;
    sf(callBg); sd(callBdr); doc.setLineWidth(0.3);
    doc.roundedRect(ML, y, CW, bh, 1.5, 1.5, 'FD');
    sf(orange); doc.rect(ML, y, 3, bh, 'F');
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); st(body);
    doc.text(lines, ML + 7, y + 9);
    return y + bh + 6;
  };

  // ── Numbered step box ──
  const stepBox = (n, title, desc, y) => {
    const dLines = desc ? doc.splitTextToSize(desc, CW - 20) : [];
    const bh = desc ? 13 + dLines.length * 5 + 5 : 14;
    sf(bgGray); sd(border); doc.setLineWidth(0.2);
    doc.roundedRect(ML, y, CW, bh, 1.5, 1.5, 'FD');
    sf(orange); doc.circle(ML + 7.5, y + bh / 2, 4, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); st(white);
    doc.text(String(n), ML + 7.5, y + bh / 2 + 3, { align: 'center' });
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10); st(ink);
    doc.text(title, ML + 17, y + 9);
    if (desc) { doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); st(body); doc.text(dLines, ML + 17, y + 15); }
    return y + bh + 4;
  };

  // ════════════════════════════════════════════════════════════════════════════
  // PAGE 1 — COVER
  // ════════════════════════════════════════════════════════════════════════════
  pageNum = 1;

  // Large logo top-left, small logo top-right
  if (logoLg) doc.addImage(logoLg, 'PNG', ML, 12, 54, 21);
  addSmLogo();

  // Orange rule below logo area — full width, matches Standard Doc Format
  sf(orange); doc.rect(0, 40, W, 0.8, 'F');

  // Category label
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9); st(orange);
  doc.text('ONBOARDING REPORT', ML, 53);

  // Title
  doc.setFont('helvetica', 'bold'); doc.setFontSize(26); st(ink);
  doc.text('AceMQ Onboarding Report', ML, 68);

  // Subtitle
  doc.setFont('helvetica', 'normal'); doc.setFontSize(12); st(mid);
  doc.text(`${company}  ·  ${selectedNames.join('  ·  ')}`, ML, 80);

  // Services banner — full-width, flat (matches Standard Doc Format)
  sf(orange); doc.rect(0, 88, W, 11, 'F');
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8); st(white);
  const banLeft = 'ONBOARDING REPORT  ';
  doc.text(banLeft, ML, 95.2);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
  doc.text(selectedNames.join('  ·  ').toUpperCase(), ML + doc.getTextWidth(banLeft), 95.2);

  // Document details table
  let y = 108;
  y = tblHead(['Document', 'Detail'], [58, CW - 58], y);
  [
    ['Title', 'AceMQ Onboarding Report'],
    ['Prepared For', company],
    ['Submitted By', `${submitter.firstName} ${submitter.lastName}`],
    ['Email', submitter.email],
    ...(submitter.jobTitle ? [['Job Title', submitter.jobTitle]] : []),
    ...(submitter.phone    ? [['Phone', submitter.phone]]         : []),
    ['Services', selectedNames.join('  ·  ')],
    ['Date', dateStr],
    ['Classification', 'Confidential — Prepared by AceMQ'],
  ].forEach(([l, v], i) => { y = detRow(l, v, y, i % 2 === 0); });

  addFooter();
  let secN = 0;

  // ════════════════════════════════════════════════════════════════════════════
  // ENGAGEMENT
  // ════════════════════════════════════════════════════════════════════════════
  if (services.engagement) {
    secN++;
    y = newPage('AceMQ Onboarding Report', 'Engagement', ['Details', 'Participants', 'Schedule']);
    y = secHead(secN, 'Engagement Onboarding', y);
    y = para('The following details have been captured for your AceMQ professional services engagement. Your engagement manager will reach out within 1 business day to confirm scheduling and next steps.', y);
    y += 5;

    y = tblHead(['Field', 'Value'], [60, CW - 60], y);
    [
      ['Company', company],
      ['Lead Stakeholder', `${submitter.firstName} ${submitter.lastName}`],
      ['Email', submitter.email],
      ...(submitter.phone    ? [['Phone', submitter.phone]]                     : []),
      ...(kickoffDate        ? [['Est. Kickoff Date', kickoffDate]]              : []),
      ...(teamTimezone       ? [['Team Timezone', teamTimezone]]                 : []),
      ...(schedulingPref     ? [['Scheduling Preference', schedulingPref]]       : []),
      ...(timeSlotPref       ? [['Time Preference', timeSlotPref]]               : []),
    ].forEach(([l, v], i) => { y = detRow(l, v, y, i % 2 === 0, 60); });
    y += 9;

    // Participants table
    if (engagementParticipants && engagementParticipants.length > 0) {
      if (y + 20 + engagementParticipants.length * 9 > H - 22) {
        y = newPage('AceMQ Onboarding Report', 'Engagement', ['Participants']);
      }
      y = subHead('Engagement Participants', y);
      y = tblHead(['Name / Title', 'Email', 'Role'], [60, 68, CW - 128], y);
      engagementParticipants.forEach((p, i) => {
        sf(i % 2 === 0 ? bgGray : white); sd(border); doc.setLineWidth(0.2);
        doc.rect(ML, y, CW, 9, 'FD');
        const name = `${p.firstName} ${p.lastName}`.trim() + (p.title ? ` · ${p.title}` : '');
        doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); st(ink);
        doc.text(name.length > 30 ? name.substring(0, 28) + '…' : name, ML + 3, y + 6.3);
        doc.setFont('helvetica', 'normal'); doc.setFontSize(9); st([220, 100, 0]);
        doc.text(p.email.length > 36 ? p.email.substring(0, 34) + '…' : p.email, ML + 63, y + 6.3);
        st(mid); doc.text(p.role || '', ML + 131, y + 6.3);
        y += 9;
      });
      y += 9;
    }

    // Comments callout
    if (engagementDescription) {
      if (y + 30 > H - 22) {
        y = newPage('AceMQ Onboarding Report', 'Engagement', ['Comments']);
      }
      y = subHead('Additional Comments', y);
      y = callBox(engagementDescription, y);
    }

    // What to expect
    if (y + 62 > H - 22) {
      y = newPage('AceMQ Onboarding Report', 'Engagement', ['Next Steps']);
    }
    y = subHead('What to Expect', y);
    y = stepBox(1, 'Initial Discovery Call', 'Your AceMQ engagement manager will schedule a discovery call to align on goals, scope, and timeline.', y);
    y = stepBox(2, 'Statement of Work', 'A tailored SOW will be prepared based on your engagement type and requirements.', y);
    y = stepBox(3, 'Kickoff & Delivery', 'Your AceMQ team begins work per the agreed schedule. Progress updates provided throughout.', y);
  }

  // ════════════════════════════════════════════════════════════════════════════
  // LICENSE
  // ════════════════════════════════════════════════════════════════════════════
  if (services.license) {
    secN++;
    y = newPage('AceMQ Onboarding Report', 'License', ['Configuration', 'Usage', 'JFrog Access']);
    y = secHead(secN, 'License Onboarding', y);
    y = para('Below is a summary of your license configuration. Contact licensing@acemq.com to correct any details. JFrog credentials will be issued within 1 business day.', y);
    y += 5;

    y = tblHead(['Field', 'Value'], [68, CW - 68], y);
    [
      ['RabbitMQ Product', technical.rmqProduct],
      ['CPU Core Count', technical.cpuCoreCount],
      ['CPU Core Type', technical.cpuCoreType],
      ['Deployment Environment', technical.deploymentEnv],
      ['Environment Use', envUse.length > 0 ? envUse.join(', ') : '—'],
      ['Packaging Formats', packaging.length > 0 ? packaging.join(', ') : '—'],
    ].forEach(([l, v], i) => { y = detRow(l, v, y, i % 2 === 0, 68); });
    y += 9;

    if (comments) {
      if (y + 30 > H - 22) { y = newPage('AceMQ Onboarding Report', 'License', []); }
      y = subHead('Additional Comments', y);
      y = callBox(comments, y);
    }

    if (portalUsers && portalUsers.length > 0) {
      if (y + 20 + (portalUsers.length + 2) * 9 > H - 22) {
        y = newPage('AceMQ Onboarding Report', 'License', ['Portal Users']);
      }
      y = subHead('License Portal Users', y);
      const puList = [
        { email: submitter.email, role: 'Submitter' },
        ...portalUsers.map(e => ({ email: e, role: 'Portal User' })),
      ];
      y = tblHead(['Email Address', 'Role'], [Math.round(CW * 0.72), Math.round(CW * 0.28)], y);
      puList.forEach((u, i) => {
        sf(i % 2 === 0 ? bgGray : white); sd(border); doc.setLineWidth(0.2);
        doc.rect(ML, y, CW, 9, 'FD');
        doc.setFont('helvetica', 'normal'); doc.setFontSize(9); st([220, 100, 0]);
        doc.text(u.email, ML + 3, y + 6.3);
        st(mid); doc.text(u.role, ML + Math.round(CW * 0.72) + 3, y + 6.3);
        y += 9;
      });
      y += 9;
    }

    // ── JFrog Pull Guide ──────────────────────────────────────────────────────
    y = newPage('AceMQ Onboarding Report', 'License', ['JFrog Pull Guide']);
    y = subHead('Pulling Tanzu RabbitMQ via the AceMQ JFrog Cache', y);
    y = para('As an AceMQ customer with active commercial Tanzu RabbitMQ entitlements, you pull Broadcom-published container images through AceMQ\'s JFrog Artifactory smart-remote repository. The repository fronts Broadcom\'s official registry (rabbitmq.packages.broadcom.com), caches images locally, and serves subsequent pulls from AceMQ\'s edge.', y);
    y += 2;
    y = para('This guide covers Docker, Podman, containerd, and Kubernetes pull workflows for commercial Tanzu RabbitMQ (4.2.x, 4.1.x, 4.0.x) and the community-edition maintenance series (3.13.x).', y);
    y += 4;

    // Repository facts panel — 3×2 grid
    const panelH = 30;
    sf([245, 245, 245]); sd(border); doc.setLineWidth(0.2);
    doc.roundedRect(ML, y, CW, panelH, 2, 2, 'FD');
    const col3 = CW / 3;
    [
      [ML + 5,          'REGISTRY',         'acemq.jfrog.io'],
      [ML + 5 + col3,   'REMOTE REPO',      'rabbitmq-docker-remote'],
      [ML + 5 + col3*2, 'IMAGE PATH',       'vmware-tanzu-rabbitmq'],
    ].forEach(([x, lbl, val]) => {
      doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); st(orange);
      doc.text(lbl, x, y + 8);
      doc.setFont('courier', 'normal'); doc.setFontSize(8.5); st(ink);
      doc.text(val, x, y + 16);
    });
    [
      [ML + 5,          'UPSTREAM',         'rabbitmq.packages.broadcom.com'],
      [ML + 5 + col3,   'TAG EXAMPLES',     '3.13.15  4.0.19  4.1.10  4.2.5'],
      [ML + 5 + col3*2, 'VARIANT SUFFIXES', '-arm64  -fips  -arm64-fips'],
    ].forEach(([x, lbl, val]) => {
      doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); st(orange);
      doc.text(lbl, x, y + 22);
      doc.setFont('courier', 'normal'); doc.setFontSize(8); st(ink);
      doc.text(val, x, y + 29);
    });
    y += panelH + 6;

    y = callBox('Supported release streams: 4.2.x (current GA, latest patch 4.2.5) · 4.1.x (maintenance, latest 4.1.10) · 4.0.x (maintenance, latest 4.0.19) · 3.13.x (community-edition with commercial support, latest 3.13.15). Always confirm your stream is covered by your active subscription before adopting a new major version.', y);

    // ── Step 1 ─────────────────────────────────────────────────────────────────
    if (y + 55 > H - 22) { y = newPage('AceMQ Onboarding Report', 'License', ['JFrog Pull Guide']); }
    y = stepBox(1, 'Generate a JFrog Access Token',
      '1. Log in to https://acemq.jfrog.io\n2. Click your username (upper-right corner) and select Edit Profile\n3. Open the Identity Tokens section and click Generate Token\n4. Set scope to Scoped Token with read permission on rabbitmq-docker-remote (least-privilege)\n5. Set an expiration that matches your organisation\'s secret-rotation policy\n6. Copy the token immediately — JFrog displays it only once', y);
    y = callBox('Token handling: Treat the token as a credential. Store it in a secrets manager (HashiCorp Vault, AWS Secrets Manager, Azure Key Vault, Kubernetes Secret) and never commit it to source control. For CI/CD pipelines, use a dedicated service-account user in JFrog rather than a personal account.', y);

    // ── Step 2 ─────────────────────────────────────────────────────────────────
    if (y + 50 > H - 22) { y = newPage('AceMQ Onboarding Report', 'License', ['JFrog Pull Guide']); }
    y = stepBox(2, 'Authenticate Your Container Client',
      'Use your JFrog username and the generated access token as the password. Credentials are stored in your client\'s standard config file (~/.docker/config.json or $XDG_RUNTIME_DIR/containers/auth.json) as a base64-encoded auth header.', y);
    y = codeBox('# Docker\ndocker login acemq.jfrog.io\n  Username: <your JFrog username>\n  Password: <paste the JFrog access token>\n\n# Podman\npodman login acemq.jfrog.io\n\n# containerd / nerdctl\nnerdctl login acemq.jfrog.io', y);

    // ── Step 3 ─────────────────────────────────────────────────────────────────
    if (y + 60 > H - 22) { y = newPage('AceMQ Onboarding Report', 'License', ['JFrog Pull Guide']); }
    y = stepBox(3, 'Pull a Tanzu RabbitMQ Image',
      'Always specify an explicit semver tag in production. Broadcom does not publish a stable "latest" tag that crosses major version streams — pulling :latest is unpredictable.', y);
    y = codeBox('# Standard (amd64)\ndocker pull acemq.jfrog.io/rabbitmq-docker-remote/vmware-tanzu-rabbitmq:3.13.15\n\n# ARM64 hosts\ndocker pull acemq.jfrog.io/rabbitmq-docker-remote/vmware-tanzu-rabbitmq:3.13.15-arm64\n\n# FIPS mode (amd64)\ndocker pull acemq.jfrog.io/rabbitmq-docker-remote/vmware-tanzu-rabbitmq:3.13.15-fips\n\n# FIPS on ARM64\ndocker pull acemq.jfrog.io/rabbitmq-docker-remote/vmware-tanzu-rabbitmq:3.13.15-arm64-fips', y);
    y = callBox('Smart-remote caching: The first pull of an uncached tag fetches from Broadcom and may take longer. Once cached, the image is served from AceMQ\'s edge to all downstream clients. The cache is shared at the repository level — if another customer has already pulled that tag, your first pull will be fast.', y);

    // ── Step 4 ─────────────────────────────────────────────────────────────────
    if (y + 55 > H - 22) { y = newPage('AceMQ Onboarding Report', 'License', ['Kubernetes Deployment']); }
    y = stepBox(4, 'Kubernetes — Create an imagePullSecret',
      'Required once per namespace that runs RabbitMQ workloads. Kubernetes requires this secret before any pod can pull from a private registry.', y);
    y = codeBox('kubectl create secret docker-registry acemq-jfrog-pull \\\n  --namespace rabbitmq-system \\\n  --docker-server=acemq.jfrog.io \\\n  --docker-username=<jfrog-username> \\\n  --docker-password=\'<access-token>\' \\\n  --docker-email=<your-email>', y);

    // ── Step 5 ─────────────────────────────────────────────────────────────────
    if (y + 55 > H - 22) { y = newPage('AceMQ Onboarding Report', 'License', ['Kubernetes Deployment']); }
    y = stepBox(5, 'Reference the Secret in Your Workload',
      'In a Pod, Deployment, or RabbitmqCluster CR, reference both the image and the pull secret.', y);
    y = codeBox('spec:\n  imagePullSecrets:\n    - name: acemq-jfrog-pull\n  containers:\n    - name: rabbitmq\n      image: acemq.jfrog.io/rabbitmq-docker-remote/vmware-tanzu-rabbitmq:3.13.15\n      imagePullPolicy: IfNotPresent', y);

    // ── Step 6 ─────────────────────────────────────────────────────────────────
    if (y + 50 > H - 22) { y = newPage('AceMQ Onboarding Report', 'License', ['Kubernetes Deployment']); }
    y = stepBox(6, 'Helm Values Override',
      'If you install Tanzu RabbitMQ via Helm, override the image and pull-secret values to point at the AceMQ cache.', y);
    y = codeBox('rabbitmqImage:\n  registry: acemq.jfrog.io\n  repository: rabbitmq-docker-remote/vmware-tanzu-rabbitmq\n  tag: "3.13.15"\n  pullSecrets:\n    - acemq-jfrog-pull', y);

    // ── Step 7 ─────────────────────────────────────────────────────────────────
    if (y + 60 > H - 22) { y = newPage('AceMQ Onboarding Report', 'License', ['Production Best Practices']); }
    y = stepBox(7, 'Production Best Practice — Pin by Digest',
      'Tags are mutable; digests are not. For audited or compliance-bound deployments, pin by SHA256 digest to guarantee bit-for-bit reproducibility.', y);
    y = codeBox('# Get the digest after pulling\ndocker pull acemq.jfrog.io/rabbitmq-docker-remote/vmware-tanzu-rabbitmq:3.13.15\ndocker inspect --format=\'{{index .RepoDigests 0}}\' \\\n  acemq.jfrog.io/rabbitmq-docker-remote/vmware-tanzu-rabbitmq:3.13.15\n\n# Use digest in a Kubernetes manifest (tag retained for readability)\nimage: acemq.jfrog.io/rabbitmq-docker-remote/vmware-tanzu-rabbitmq:3.13.15@sha256:<digest>', y);
    y = callBox('Tag-and-digest hybrid: For human-readability plus immutability, you can specify both — vmware-tanzu-rabbitmq:3.13.15@sha256:abc123.... The container runtime ignores the tag for pull purposes and uses only the digest, but tooling and humans can still read the version.', y);

    // ── Troubleshooting ────────────────────────────────────────────────────────
    if (y + 55 > H - 22) { y = newPage('AceMQ Onboarding Report', 'License', ['Troubleshooting']); }
    y = subHead('Troubleshooting', y);
    y = callBox('401 Unauthorized: Re-run docker login. Tokens expire if you set an expiration during creation. Confirm your AceMQ JFrog account has read permission on rabbitmq-docker-remote.\n\nmanifest unknown / not found: Verify the tag exists via the JFrog UI (Artifacts → rabbitmq-docker-remote → vmware-tanzu-rabbitmq). Tags are case-sensitive; Tanzu variant suffixes are lowercase.\n\nErrImagePull / ImagePullBackOff (Kubernetes): Confirm the imagePullSecret exists in the same namespace as the pod and is referenced in the pod spec. Run: kubectl describe pod <name> -n <namespace> to see the underlying registry error.\n\nEgress / firewall failures: Ensure outbound TCP/443 to acemq.jfrog.io is permitted. JFrog may serve image layers from a CDN endpoint distinct from the primary hostname — contact AceMQ if layer downloads fail after a successful manifest pull.\n\nSlow first pull, fast subsequent: Expected behaviour. The first pull of an uncached tag fetches from Broadcom; subsequent pulls hit the AceMQ-side cache.', y);
  }

  // ════════════════════════════════════════════════════════════════════════════
  // SUPPORT
  // ════════════════════════════════════════════════════════════════════════════
  if (services.support || services.engagement) {
    secN++;
    y = newPage('AceMQ Onboarding Report', 'Support Portal', ['Portals', 'Getting Started', 'Users']);
    y = secHead(secN, 'Support Portal Onboarding', y);
    y = para('Your AceMQ RabbitMQ support subscription provides access to two distinct portals. Invitation emails will be sent to each provisioned user within 1 business day.', y);
    y += 5;

    // Portal overview table
    y = tblHead(['Portal', 'URL', 'Purpose'], [55, 68, CW - 123], y);
    [
      ['AceMQ RabbitMQ Support Portal', 'rabbitmq-support.portal.acemq.com', 'Knowledge base, AI agent, healthcheck, training'],
      ['Jira Ticket Portal',            'support.acemq.com/rabbitmq',         'Create & track support tickets only'],
    ].forEach(([name, url, purpose], i) => {
      sf(i % 2 === 0 ? bgGray : white); sd(border); doc.setLineWidth(0.2);
      doc.rect(ML, y, CW, 11, 'FD');
      doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); st(ink);
      doc.text(name, ML + 3, y + 7.5);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); st([220, 100, 0]);
      doc.text(url, ML + 58, y + 7.5);
      st(body); doc.text(purpose, ML + 126, y + 7.5);
      y += 11;
    });
    y += 9;

    // Getting started
    y = subHead('Getting Started', y);
    y = stepBox(1, 'Receive Your Invitation Emails', 'Each provisioned user will receive emails from noreply@acemq.com — one per portal. Check spam if they don\'t arrive within 1 business day.', y);
    y = stepBox(2, 'Set Your Password', 'Click the secure link in each email and create a strong password (minimum 12 characters).', y);
    y = stepBox(3, 'Log In to the AceMQ RabbitMQ Support Portal', 'Navigate to rabbitmq-support.portal.acemq.com — your home for the knowledge base, AI agent, healthchecks, and training.', y);
    y = stepBox(4, 'Log In to the Jira Ticket Portal', 'Navigate to support.acemq.com/rabbitmq to raise and track support tickets.', y);
    y = stepBox(5, 'Search Before You Ticket', 'Use the knowledge base and AI agent to resolve common issues before raising a ticket.', y);
    y += 4;

    // Provisioned users
    const allUsers = [
      { firstName: submitter.firstName, lastName: submitter.lastName, email: submitter.email, role: 'Submitter' },
      ...(supportUsers || []).map(u => ({ ...u, role: 'Support User' })),
    ];
    if (y + 20 + allUsers.length * 9 > H - 22) {
      y = newPage('AceMQ Onboarding Report', 'Support Portal', ['Provisioned Users']);
    }
    y = subHead('Provisioned Support Users', y);
    y = para(`The following users have been granted access to the ${company} support portals.`, y);
    y += 2;
    y = tblHead(['#', 'Name', 'Email', 'Role'], [10, 44, 78, CW - 132], y);
    allUsers.forEach((u, i) => {
      sf(i % 2 === 0 ? bgGray : white); sd(border); doc.setLineWidth(0.2);
      doc.rect(ML, y, CW, 9, 'FD');
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9); st(mid);
      doc.text(String(i + 1), ML + 3, y + 6);
      st(ink); doc.text(`${u.firstName} ${u.lastName}`.trim(), ML + 13, y + 6);
      st([220, 100, 0]); doc.text(u.email, ML + 57, y + 6);
      st(mid); doc.text(u.role, ML + 135, y + 6);
      y += 9;
    });
  }

  // ════════════════════════════════════════════════════════════════════════════
  // CONTACT & NEXT STEPS
  // ════════════════════════════════════════════════════════════════════════════
  secN++;
  y = newPage('AceMQ Onboarding Report', 'Contact & Next Steps', []);
  y = secHead(secN, 'Contact & Next Steps', y);
  y = para('Your AceMQ team will be in touch within 1 business day of this submission. Use the contacts below for any immediate questions.', y);
  y += 6;
  y = tblHead(['Team', 'Contact'], [55, CW - 55], y);
  [
    ['Onboarding',     'onboarding@acemq.com'],
    ['Support Portal', 'rabbitmq-support.portal.acemq.com'],
    ['Raise a Ticket', 'support.acemq.com/rabbitmq'],
    ['Licensing',      'licensing@acemq.com'],
    ['General',        'support@acemq.com'],
    ['Phone',          '+1 305-204-2607'],
  ].forEach(([l, v], i) => { y = detRow(l, v, y, i % 2 === 0); });

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
  const [stepList, setStepList] = useState(['intro', 'contact', 'services']);
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
  const [engagementParticipants, setEngagementParticipants] = useState([]);
  const [kickoffDate, setKickoffDate] = useState('');
  const [teamTimezone, setTeamTimezone] = useState('');
  const [schedulingPref, setSchedulingPref] = useState('');
  const [timeSlotPref, setTimeSlotPref] = useState('');
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
  const isIntro = currentStep === 'intro';
  // Exclude 'intro' from step counting — form starts at contact
  const formStepList = stepList.filter(s => s !== 'intro');
  const formSteps = formStepList.filter(s => s !== 'contact' && s !== 'services');
  const totalFormSteps = 2 + formSteps.length;
  const formStepIdx = stepIdx - 1; // 0-based within form steps (contact = 0)
  const currentFormStepNum = formStepIdx + 1;
  const pct = formStepList.length > 1
    ? Math.round((formStepIdx / (formStepList.length - 1)) * 100)
    : 0;

  const scrollTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  const goNext = () => { setStepIdx(i => i + 1); scrollTop(); };
  const goBack = () => { setStepIdx(i => i - 1); scrollTop(); };

  const confirmServices = () => {
    const list = ['intro', ...buildStepList(services)];
    setStepList(list);
    setStepIdx(3); // intro(0) → contact(1) → services(2) → first dynamic(3)
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
        engagementParticipants,
        kickoffDate,
        teamTimezone,
        schedulingPref,
        timeSlotPref,
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
          engagementParticipants,
          kickoffDate,
          teamTimezone,
          schedulingPref,
          timeSlotPref,
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
      {!submitted && !isIntro && stepIdx > 0 && (
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
      <div className={`flex-1 flex items-start justify-center px-[1.5rem] sm:px-[5.6rem] pb-[8rem] relative z-[1] ${isIntro ? 'py-[7rem]' : 'py-[5.2rem]'}`}>
        <div className={`bg-white border border-[rgba(0,0,0,0.08)] rounded-[2rem] w-full relative overflow-hidden shadow-[0_2px_40px_rgba(0,0,0,0.06)] ${
          currentStep === 'support-users' ? 'max-w-[72rem]' : isIntro ? 'max-w-[66rem]' : 'max-w-[62rem]'
        }`}
          style={{ padding: isIntro ? 'clamp(4rem, 6vw, 6.4rem) clamp(3.2rem, 6vw, 7.2rem)' : 'clamp(3.2rem, 5vw, 5.2rem) clamp(2.4rem, 5vw, 5.6rem)' }}>

          {!submitted && !isIntro && (
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#FF6600]" />
          )}

          <div key={currentStep + (submitted ? '-success' : '')} className="animate-fade-slide">

            {/* ── INTRO ── */}
            {currentStep === 'intro' && !submitted && (
              <div className="text-center">
                {/* Rainbow top stripe */}
                <div className="absolute top-0 left-0 right-0 h-[5px] bg-gradient-to-r from-[#FF6600] via-[#FF8C40] to-[#8FD5CC]" />

                {/* Badge */}
                <div className="inline-flex items-center gap-[0.6rem] border border-[rgba(0,0,0,0.1)] rounded-full px-[1.4rem] py-[0.6rem] mb-[3.2rem]">
                  <span className="w-[0.7rem] h-[0.7rem] rounded-full bg-[#FF6600] inline-block" />
                  <span className="text-[1.2rem] tracking-[0.12em] text-[#444] uppercase font-[500]">AceMQ Onboarding</span>
                </div>

                {/* Headline */}
                <h1 className="text-[#000000] text-[4rem] leading-[1.15] font-[700] mb-[0.4rem]">
                  Your AceMQ
                </h1>
                <h1 className="text-[#8FD5CC] text-[4rem] leading-[1.15] font-[700] mb-[2.4rem]">
                  Onboarding Process
                </h1>

                {/* Subtitle */}
                <p className="text-[#666] text-[1.6rem] leading-[1.7] max-w-[46rem] mx-auto mb-[4rem]">
                  Complete your engagement, support portal, and license setup in a single guided experience. You'll receive a branded PDF report on completion.
                </p>

                {/* Feature tiles */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-[1.4rem] mb-[4.4rem]">
                  {[
                    { icon: '🤝', title: 'Engagement', desc: 'Professional services, migrations & architecture' },
                    { icon: '🎫', title: 'Support Portal', desc: 'Submit & track RabbitMQ issues 24/7' },
                    { icon: '🔑', title: 'License Onboarding', desc: 'JFrog image access & portal provisioning' },
                  ].map(({ icon, title, desc }) => (
                    <div key={title} className="border border-[rgba(0,0,0,0.08)] rounded-[1.4rem] bg-[#fafafa] px-[2rem] py-[2.4rem] flex flex-col items-center gap-[0.8rem]">
                      <span className="text-[2.8rem]">{icon}</span>
                      <p className="text-[1.5rem] font-[700] text-[#161616]">{title}</p>
                      <p className="text-[1.25rem] text-[#888] leading-[1.5]">{desc}</p>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <BtnOrange onClick={goNext} className="text-[1.9rem] px-[5.6rem] py-[1.6rem]">
                  Get Started →
                </BtnOrange>

                {/* Footer pills */}
                <div className="flex items-center justify-center flex-wrap gap-[2rem] mt-[2.4rem]">
                  {['~5 minutes', 'PDF report included', 'Select only what you need'].map(t => (
                    <span key={t} className="flex items-center gap-[0.5rem] text-[1.2rem] text-[#999]">
                      <svg className="w-[1.2rem] h-[1.2rem] stroke-[#27ae60] fill-none" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}

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
                <div className="flex items-center justify-between mt-[3rem] pt-[2.2rem] border-t border-[rgba(0,0,0,0.08)]">
                  <BtnGhost onClick={goBack}>← Back</BtnGhost>
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
                <SectionHeader
                  icon="🤝"
                  label="Engagement Onboarding"
                  accent="#FF6600"
                  stepLabel="Section — Engagement"
                  steps={['Engagement details', ...(services.license ? ['License config', 'License usage', 'License users'] : []), ...((services.support || services.engagement) ? ['Support users'] : [])]}
                />
                <QHead>Tell us about your engagement</QHead>
                <QSub>Help us understand your team, goals, and scheduling so we can hit the ground running.</QSub>

                <p className="text-[1.4rem] font-[600] text-[#161616] mb-[1rem]">Lead Stakeholder</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-[1rem]">
                  <TF placeholder="Lead Stakeholder Name" value={`${firstName} ${lastName}`.trim()} onChange={() => {}} />
                  <TF type="email" placeholder="Lead Stakeholder Email" value={workEmail} onChange={() => {}} />
                </div>
                <TF type="tel" placeholder="Lead Stakeholder Phone (optional)" value={phone} onChange={() => {}} />

                <p className="text-[1.4rem] font-[600] text-[#161616] mb-[1rem] mt-[1.6rem]">Engagement Participants *</p>
                <EngagementParticipantsEditor
                  participants={engagementParticipants}
                  setParticipants={setEngagementParticipants}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-[1rem] mt-[1.6rem]">
                  <div>
                    <p className="text-[1.4rem] font-[600] text-[#161616] mb-[1rem]">Estimated Kickoff Date</p>
                    <input type="date" value={kickoffDate} onChange={e => setKickoffDate(e.target.value)}
                      className="w-full bg-white border border-[rgba(0,0,0,0.12)] rounded-[1rem] px-[1.6rem] py-[1.3rem] text-[1.6rem] text-black outline-none focus:border-[#FF6600] focus:shadow-[0_0_0_3px_rgba(255,102,0,0.08)] transition-all mb-[1rem]" />
                  </div>
                  <div>
                    <p className="text-[1.4rem] font-[600] text-[#161616] mb-[1rem]">Team Time Zone</p>
                    <select value={teamTimezone} onChange={e => setTeamTimezone(e.target.value)}
                      className="w-full bg-white border border-[rgba(0,0,0,0.12)] rounded-[1rem] px-[1.6rem] py-[1.3rem] text-[1.6rem] text-black outline-none focus:border-[#FF6600] focus:shadow-[0_0_0_3px_rgba(255,102,0,0.08)] transition-all mb-[1rem] cursor-pointer">
                      <option value="">Select Timezone</option>
                      {TIMEZONE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>
                </div>

                <p className="text-[1.4rem] font-[600] text-[#161616] mb-[1rem]">Engagement Session — Scheduling Preference *</p>
                <select value={schedulingPref} onChange={e => setSchedulingPref(e.target.value)}
                  className="w-full bg-white border border-[rgba(0,0,0,0.12)] rounded-[1rem] px-[1.6rem] py-[1.3rem] text-[1.6rem] text-black outline-none focus:border-[#FF6600] focus:shadow-[0_0_0_3px_rgba(255,102,0,0.08)] transition-all mb-[1rem] cursor-pointer">
                  <option value="">Please Select</option>
                  {SCHEDULING_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>

                <p className="text-[1.4rem] font-[600] text-[#161616] mb-[1rem] mt-[1rem]">Engagement Session — Time Preference <span className="text-[#999] font-[400]">(optional)</span></p>
                <select value={timeSlotPref} onChange={e => setTimeSlotPref(e.target.value)}
                  className="w-full bg-white border border-[rgba(0,0,0,0.12)] rounded-[1rem] px-[1.6rem] py-[1.3rem] text-[1.6rem] text-black outline-none focus:border-[#FF6600] focus:shadow-[0_0_0_3px_rgba(255,102,0,0.08)] transition-all mb-[1rem] cursor-pointer">
                  <option value="">Please Select</option>
                  {TIME_SLOT_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>

                <p className="text-[1.4rem] font-[600] text-[#161616] mb-[1rem] mt-[1rem]">Other Comments or Details <span className="text-[#999] font-[400]">(optional)</span></p>
                <TA
                  placeholder="Any other context, constraints, or goals for this engagement…"
                  value={engagementDescription}
                  onChange={e => setEngagementDescription(e.target.value)}
                  rows={4}
                />

                <div className="flex items-center justify-between mt-[3rem] pt-[2.2rem] border-t border-[rgba(0,0,0,0.08)]">
                  <BtnGhost onClick={goBack}>← Back</BtnGhost>
                  <BtnOrange onClick={goNext} disabled={engagementParticipants.length === 0 || !schedulingPref}>
                    Continue →
                  </BtnOrange>
                </div>
              </div>
            )}

            {/* ── LICENSE TECHNICAL ── */}
            {currentStep === 'license-tech' && !submitted && (
              <div>
                <SectionHeader
                  icon="🔑"
                  label="License Onboarding"
                  accent="#5bb8ad"
                  stepLabel="Section — License"
                  steps={['Technical config', 'Usage & packaging', 'Portal users', ...((services.support || services.engagement) ? ['Support users'] : [])]}
                />
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

                {/* JFrog Pull Guide reference panel */}
                <div className="bg-[#f8f8f8] border border-[rgba(0,0,0,0.08)] rounded-[1.4rem] p-[2rem] mb-[2.8rem]">
                  <div className="flex items-start gap-[1.4rem]">
                    <span className="text-[2.4rem] mt-[0.2rem] flex-shrink-0">📦</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[1.5rem] font-[700] text-[#161616] mb-[0.5rem]">Your report includes a complete JFrog Pull Guide</p>
                      <p className="text-[1.3rem] text-[#666] leading-[1.6] mb-[1.4rem]">Once credentials are issued, your PDF onboarding report will contain step-by-step instructions for pulling Tanzu RabbitMQ images through AceMQ's JFrog Artifactory cache — including:</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-[1.5rem] gap-y-[0.5rem] mb-[1.6rem]">
                        {[
                          'Generate a scoped JFrog access token',
                          'Authenticate Docker, Podman & nerdctl',
                          'Pull with ARM64 & FIPS variant tags',
                          'Create Kubernetes imagePullSecrets',
                          'Helm values.yaml override for AceMQ cache',
                          'Pin images by SHA256 digest for compliance',
                        ].map(item => (
                          <div key={item} className="flex items-start gap-[0.7rem] text-[1.25rem] text-[#444]">
                            <span className="text-[#FF6600] font-[700] flex-shrink-0 mt-[0.1rem]">→</span>
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                      <div className="bg-white border border-[rgba(0,0,0,0.08)] rounded-[0.8rem] px-[1.4rem] py-[1rem]">
                        <p className="text-[1.1rem] font-[700] text-[#999] uppercase tracking-[0.06em] mb-[0.4rem]">Registry endpoint</p>
                        <code className="text-[1.35rem] text-[#161616] font-[600]">acemq.jfrog.io / rabbitmq-docker-remote / vmware-tanzu-rabbitmq</code>
                      </div>
                    </div>
                  </div>
                </div>

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
                <SectionHeader
                  icon="🎫"
                  label="Support Portal Onboarding"
                  accent="#161616"
                  stepLabel="Section — Support"
                  steps={['Support users']}
                />
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
                        <span>Our Program Manager will align a kickoff call.</span>
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
