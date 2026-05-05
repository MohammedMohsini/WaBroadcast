import { useState, useRef, useMemo } from 'react'

// ─────────────────────────────────────────────────────
// THEME — clean light
// ─────────────────────────────────────────────────────
const C = {
  bg:      '#F5F7FA',
  card:    '#FFFFFF',
  border:  '#E4E8EF',
  text:    '#111827',
  sub:     '#6B7280',
  muted:   '#9CA3AF',
  green:   '#25D366',
  greenD:  '#128C7E',
  greenL:  '#EDFBF3',
  blue:    '#3B82F6',
  blueL:   '#EFF6FF',
  purple:  '#7C3AED',
  purpleL: '#F5F3FF',
  red:     '#EF4444',
  redL:    '#FEF2F2',
  yellow:  '#F59E0B',
  yellowL: '#FFFBEB',
}

const WA_LIMIT = 256

// ─────────────────────────────────────────────────────
// INJECT STYLES ONCE
// ─────────────────────────────────────────────────────
if (!document.getElementById('_wab')) {
  const s = document.createElement('style')
  s.id = '_wab'
  s.textContent = `
    *,*::before,*::after{box-sizing:border-box;-webkit-tap-highlight-color:transparent;margin:0;padding:0}
    html,body{width:100%;min-height:100%;background:${C.bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:${C.text}}
    input,textarea,button,select{font-family:inherit}
    input::placeholder,textarea::placeholder{color:${C.muted}}
    button{cursor:pointer;border:none;outline:none}
    textarea{resize:vertical;outline:none}
    input{outline:none}
    @keyframes spin{to{transform:rotate(360deg)}}
    @keyframes up{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
    @keyframes sheet{from{transform:translateY(50px);opacity:0}to{transform:none;opacity:1}}
    ::-webkit-scrollbar{width:4px}
    ::-webkit-scrollbar-thumb{background:${C.border};border-radius:4px}
  `
  document.head.appendChild(s)
}

// ─────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 9)

const cleanPhone = raw => {
  const d = String(raw).replace(/\D/g, '')
  if (d.startsWith('91') && d.length === 12) return d
  if (d.length === 10) return '91' + d
  if (d.length === 11 && d[0] === '0') return '91' + d.slice(1)
  return d
}

const personalize = (msg, c) =>
  msg
    .replace(/{name}/gi,      c.name  || '')
    .replace(/{firstname}/gi, (c.name || '').split(' ')[0])
    .replace(/{phone}/gi,     c.phone || c.email || '')

// ─────────────────────────────────────────────────────
// BASE COMPONENTS
// ─────────────────────────────────────────────────────
function Btn({ children, onClick, color = 'green', full, small, loading, disabled, icon, style: sx }) {
  const map = {
    green:  { bg: `linear-gradient(135deg,${C.green},${C.greenD})`, fg: '#fff', sh: `0 3px 14px ${C.green}30` },
    blue:   { bg: `linear-gradient(135deg,${C.blue},#1D4ED8)`,      fg: '#fff', sh: `0 3px 14px ${C.blue}30`  },
    purple: { bg: `linear-gradient(135deg,${C.purple},#5B21B6)`,    fg: '#fff', sh: `0 3px 14px ${C.purple}30`},
    ghost:  { bg: C.card,    fg: C.sub,    sh: 'none', bd: `1.5px solid ${C.border}` },
    red:    { bg: C.redL,    fg: C.red,    sh: 'none', bd: `1.5px solid ${C.red}25`  },
    yellow: { bg: C.yellowL, fg: C.yellow, sh: 'none', bd: `1.5px solid ${C.yellow}25` },
  }[color] || {}

  return (
    <button
      onClick={disabled || loading ? undefined : onClick}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
        width: full ? '100%' : 'auto',
        padding: small ? '8px 14px' : '13px 22px',
        fontSize: small ? 13 : 14, fontWeight: 700, borderRadius: 12,
        opacity: disabled ? .45 : 1, transition: 'opacity .15s, filter .15s',
        background: map.bg, color: map.fg, boxShadow: map.sh,
        ...(map.bd ? { border: map.bd } : {}),
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        ...sx,
      }}>
      {loading
        ? <span style={{ width: 15, height: 15, border: '2.5px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin .65s linear infinite', display: 'inline-block' }} />
        : icon ? <span style={{ fontSize: 17, lineHeight: 1 }}>{icon}</span> : null}
      {children}
    </button>
  )
}

function Field({ label, value, onChange, placeholder, type = 'text', hint, error, multiline, rows = 5, maxLen, right, autoFocus }) {
  const style = {
    width: '100%', background: C.card, color: C.text, fontSize: 14, lineHeight: 1.65,
    border: `1.5px solid ${error ? C.red : C.border}`, borderRadius: 12,
    padding: '11px 14px', transition: 'border-color .15s',
    ...(right ? { paddingRight: 44 } : {}),
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {label && <div style={{ fontSize: 11, fontWeight: 700, color: C.sub, letterSpacing: .7, textTransform: 'uppercase' }}>{label}</div>}
      <div style={{ position: 'relative' }}>
        {multiline
          ? <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows} maxLength={maxLen} autoFocus={autoFocus} style={style} />
          : <input    type={type}   value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} maxLength={maxLen} autoFocus={autoFocus} style={style} />}
        {right && <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)' }}>{right}</div>}
      </div>
      {error && <div style={{ fontSize: 11, color: C.red }}>{error}</div>}
      {hint && !error && <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.5 }}>{hint}</div>}
    </div>
  )
}

function Card({ children, style, border, onClick }) {
  return (
    <div onClick={onClick} style={{ background: C.card, borderRadius: 16, padding: 16, border: `1.5px solid ${border || C.border}`, boxShadow: '0 1px 5px rgba(0,0,0,.05)', cursor: onClick ? 'pointer' : 'default', ...style }}>
      {children}
    </div>
  )
}

function Banner({ text, type = 'yellow', icon }) {
  const map = {
    yellow: { bg: C.yellowL, left: C.yellow, icon: icon || '⚠️' },
    red:    { bg: C.redL,    left: C.red,    icon: icon || '🔴' },
    blue:   { bg: C.blueL,   left: C.blue,   icon: icon || 'ℹ️'  },
    green:  { bg: C.greenL,  left: C.green,  icon: icon || '✅' },
  }[type]
  return (
    <div style={{ background: map.bg, borderLeft: `4px solid ${map.left}`, borderRadius: '0 10px 10px 0', padding: '11px 14px', fontSize: 12, color: C.text, lineHeight: 1.7 }}>
      <span style={{ marginRight: 7 }}>{map.icon}</span>{text}
    </div>
  )
}

function Sheet({ title, children, onClose }) {
  return (
    <div onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.3)', zIndex: 300, display: 'flex', alignItems: 'flex-end', backdropFilter: 'blur(3px)' }}>
      <div style={{ background: C.card, width: '100%', maxHeight: '90vh', borderRadius: '20px 20px 0 0', overflowY: 'auto', animation: 'sheet .22s ease', borderTop: `3px solid ${C.green}` }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px 20px', borderBottom: `1px solid ${C.border}`, position: 'sticky', top: 0, background: C.card, zIndex: 1 }}>
          <span style={{ fontSize: 16, fontWeight: 800, color: C.text }}>{title}</span>
          <div onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 16, color: C.sub }}>✕</div>
        </div>
        <div style={{ padding: 20 }}>{children}</div>
      </div>
    </div>
  )
}

function Snack({ msg, color, onDone }) {
  return (
    <div style={{ position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)', background: color || C.text, color: '#fff', borderRadius: 12, padding: '10px 20px', fontSize: 13, fontWeight: 600, zIndex: 999, whiteSpace: 'nowrap', boxShadow: '0 4px 18px rgba(0,0,0,.18)', animation: 'up .2s ease', pointerEvents: 'none' }}>
      {msg}
    </div>
  )
}

function BackBar({ onBack, title, sub }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
      <div onClick={onBack} style={{ width: 38, height: 38, borderRadius: 11, background: C.card, border: `1.5px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 18, color: C.sub, flexShrink: 0 }}>←</div>
      <div>
        <div style={{ fontSize: 18, fontWeight: 800, color: C.text }}>{title}</div>
        {sub && <div style={{ fontSize: 12, color: C.sub, marginTop: 1 }}>{sub}</div>}
      </div>
    </div>
  )
}

function Wrap({ children }) {
  return (
    <div style={{ minHeight: '100vh', background: C.bg, animation: 'up .18s ease' }}>
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '20px 16px 56px' }}>{children}</div>
    </div>
  )
}

// ─────────────────────────────────────────────────────
// SCREEN 1 — DISCLAIMER
// ─────────────────────────────────────────────────────
function Disclaimer({ onAccept }) {
  return (
    <Wrap>
      <div style={{ textAlign: 'center', padding: '28px 0 26px' }}>
        <div style={{ width: 74, height: 74, background: `linear-gradient(135deg,${C.green},${C.greenD})`, borderRadius: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', fontSize: 36, boxShadow: `0 8px 28px ${C.green}40` }}>💬</div>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: C.text, marginBottom: 5 }}>WaBroadcast</h1>
        <p style={{ fontSize: 13, color: C.sub }}>Send messages to many people at once — free</p>
      </div>

      {/* Privacy promise */}
      <Card border={C.green} style={{ background: C.greenL, marginBottom: 14 }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: C.greenD, marginBottom: 10 }}>🔒 Your Privacy Promise</div>
        {[
          'Your data never leaves your device. Ever.',
          'No accounts, no login, no cloud storage of any kind.',
          'When you close the app everything is deleted automatically.',
          'If you uninstall the app there is nothing left anywhere.',
          'The app developer cannot see, access, or use your data.',
          'Contacts and messages live only in your phone memory while the app is open.',
        ].map((t, i) => (
          <div key={i} style={{ display: 'flex', gap: 9, marginBottom: 7, alignItems: 'flex-start' }}>
            <span style={{ color: C.green, fontSize: 13, flexShrink: 0, marginTop: 1 }}>✓</span>
            <span style={{ fontSize: 12, color: C.text, lineHeight: 1.6 }}>{t}</span>
          </div>
        ))}
      </Card>

      {/* Legal disclaimer */}
      <Card border={C.red} style={{ background: C.redL, marginBottom: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: C.red, marginBottom: 10 }}>⚠️ Legal Disclaimer</div>
        {[
          'You are fully responsible for every message you send.',
          'Only message people who have given you permission.',
          'Sending spam is illegal in many countries.',
          'WhatsApp or your carrier may restrict accounts that send spam.',
          'WaBroadcast and its developers are not liable for any consequence from your use of this tool.',
        ].map((t, i) => (
          <div key={i} style={{ display: 'flex', gap: 9, marginBottom: 7, alignItems: 'flex-start' }}>
            <div style={{ width: 18, height: 18, borderRadius: 9, background: `${C.red}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 900, color: C.red, flexShrink: 0, marginTop: 1 }}>{i + 1}</div>
            <span style={{ fontSize: 12, color: C.text, lineHeight: 1.6 }}>{t}</span>
          </div>
        ))}
      </Card>

      <Btn full onClick={onAccept}>I Understand — Open App</Btn>
      <p style={{ textAlign: 'center', fontSize: 11, color: C.muted, marginTop: 10 }}>By continuing you accept full responsibility for your use of this app.</p>
    </Wrap>
  )
}

// ─────────────────────────────────────────────────────
// SCREEN 2 — HOME (pick mode)
// ─────────────────────────────────────────────────────
function Home({ onSelect }) {
  const modes = [
    {
      id: 'normal', icon: '📱', color: C.green, bg: C.greenL,
      title: 'Normal User', sub: 'Personal WhatsApp, SMS, or Email',
      bullets: [
        '💬  WhatsApp — opens per contact (you tap Send)',
        '📱  SMS — opens SMS app per contact',
        '📧  Email — one click sends to all at once',
        '✓  No API key needed',
      ],
      warn: `⚠️  WhatsApp & SMS: ${WA_LIMIT} contacts/day (WhatsApp's own limit)`,
    },
    {
      id: 'business', icon: '🏢', color: C.blue, bg: C.blueL,
      title: 'Business User', sub: 'Meta WhatsApp Business API',
      bullets: [
        '⚡  One click — all messages send automatically',
        '✓  No manual tapping required at all',
        '✓  Higher limits based on your Meta tier',
        '✓  Needs Phone Number ID + Access Token',
      ],
      warn: null,
    },
  ]

  return (
    <Wrap>
      <div style={{ textAlign: 'center', padding: '24px 0 28px' }}>
        <div style={{ width: 62, height: 62, background: `linear-gradient(135deg,${C.green},${C.greenD})`, borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontSize: 30, boxShadow: `0 6px 22px ${C.green}40` }}>💬</div>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: C.text, marginBottom: 4 }}>WaBroadcast</h1>
        <p style={{ fontSize: 13, color: C.sub }}>Choose how you want to send</p>
      </div>

      {modes.map(m => (
        <div key={m.id} onClick={() => onSelect(m.id)}
          style={{ background: C.card, border: `2px solid ${m.color}20`, borderRadius: 18, padding: 18, marginBottom: 14, cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,.04)', transition: 'box-shadow .15s' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 13, marginBottom: 12 }}>
            <div style={{ width: 50, height: 50, background: m.bg, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>{m.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: C.text }}>{m.title}</div>
              <div style={{ fontSize: 12, color: C.sub, marginTop: 2 }}>{m.sub}</div>
            </div>
            <span style={{ fontSize: 20, color: m.color }}>›</span>
          </div>
          {m.bullets.map(b => <div key={b} style={{ fontSize: 12, color: C.sub, marginBottom: 5 }}>{b}</div>)}
          {m.warn && (
            <div style={{ marginTop: 10, background: C.yellowL, borderRadius: 9, padding: '7px 11px', fontSize: 11, color: C.yellow, fontWeight: 600 }}>{m.warn}</div>
          )}
        </div>
      ))}

      <p style={{ textAlign: 'center', fontSize: 11, color: C.muted }}>All data deleted when you close this app. Nothing saved anywhere.</p>
    </Wrap>
  )
}

// ─────────────────────────────────────────────────────
// SCREEN 3 — MESSAGE COMPOSER
// ─────────────────────────────────────────────────────
const EMOJIS = ['😊','👋','🙏','❤️','🔥','✅','⭐','🎉','💯','👍','😂','🤩','💪','🚀','🛒','📢','🏷️','💰','📞','🎁','📱','💬','✨','🌟','😍','👏','🤝','💼','🎯','💡','⚡','🌈','🍀','🎊','🥳','😎','🙌','🫶','💝','📣','🏅','🆓','🎀','🎪','🔔','📌','🗓️','✈️','🏖️','🎬','🍕','☕']

function Composer({ mode, onNext, onBack }) {
  const [msg,  setMsg]  = useState('')
  const [name, setName] = useState('')
  const [err,  setErr]  = useState('')
  const [tab,  setTab]  = useState('tools') // 'tools' | 'format' | 'emoji' | 'preview'
  const taRef = useRef()

  const insert = (text) => {
    const ta = taRef.current
    if (!ta) { setMsg(m => m + text); return }
    const s    = ta.selectionStart ?? msg.length
    const e    = ta.selectionEnd   ?? msg.length
    const next = msg.slice(0, s) + text + msg.slice(e)
    setMsg(next)
    setTimeout(() => { ta.focus(); ta.selectionStart = ta.selectionEnd = s + text.length }, 0)
  }

  const wrap = (before, after, sample = 'text') => {
    const ta = taRef.current
    if (!ta) { insert(before + sample + after); return }
    const s   = ta.selectionStart
    const e   = ta.selectionEnd
    const sel = msg.slice(s, e) || sample
    const next = msg.slice(0, s) + before + sel + after + msg.slice(e)
    setMsg(next)
    setTimeout(() => { ta.focus(); ta.selectionStart = s + before.length; ta.selectionEnd = s + before.length + sel.length }, 0)
  }

  const sample = { name: 'Rahul Sharma', phone: '919876543210', email: 'rahul@example.com' }

  const FORMATS = [
    { l: 'B',       title: 'Bold',          fn: () => wrap('*', '*', 'bold text'),          style: { fontWeight: 800 } },
    { l: 'I',       title: 'Italic',        fn: () => wrap('_', '_', 'italic text'),        style: { fontStyle: 'italic' } },
    { l: 'S̶',      title: 'Strikethrough', fn: () => wrap('~', '~', 'strikethrough'),      style: { textDecoration: 'line-through' } },
    { l: '</>',     title: 'Monospace',     fn: () => wrap('`', '`', 'code'),               style: { fontFamily: 'monospace' } },
    { l: '• Bullet',title: 'Bullet point',  fn: () => insert('\n• '),                        style: {} },
    { l: '↵ Break', title: 'Line break',    fn: () => insert('\n'),                          style: {} },
    { l: '─ Line',  title: 'Divider',       fn: () => insert('\n──────────\n'),              style: {} },
    { l: '👉 Arrow',title: 'Arrow',         fn: () => insert('👉 '),                        style: {} },
    { l: '✅ Tick', title: 'Tick',          fn: () => insert('✅ '),                        style: {} },
    { l: '⭐ Star', title: 'Star',          fn: () => insert('⭐ '),                        style: {} },
  ]

  const TABS = [
    { id: 'tools',   label: '🛠 Variables' },
    { id: 'format',  label: '✏️ Format'   },
    { id: 'emoji',   label: '😊 Emoji'    },
    { id: 'preview', label: '👁 Preview'  },
  ]

  return (
    <Wrap>
      <BackBar onBack={onBack} title="Write Your Message"
        sub={mode === 'normal' ? '📱 Normal — WhatsApp / SMS / Email' : '🏢 Business — API auto send'} />

      {/* Name */}
      <div style={{ marginBottom: 14 }}>
        <Field label="Broadcast Name (optional)" placeholder="e.g. Diwali Sale, Event Invite..." value={name} onChange={setName} />
      </div>

      {/* Tool tabs */}
      <Card style={{ marginBottom: 14, padding: 0, overflow: 'hidden' }}>
        {/* Tab bar */}
        <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}` }}>
          {TABS.map(t => (
            <div key={t.id} onClick={() => setTab(t.id)}
              style={{ flex: 1, textAlign: 'center', padding: '11px 4px', fontSize: 12, fontWeight: tab === t.id ? 700 : 400, color: tab === t.id ? C.green : C.sub, cursor: 'pointer', borderBottom: tab === t.id ? `2.5px solid ${C.green}` : '2.5px solid transparent', transition: 'all .15s' }}>
              {t.label}
            </div>
          ))}
        </div>

        {/* Tab content */}
        <div style={{ padding: 14 }}>
          {/* Variables */}
          {tab === 'tools' && (
            <div>
              <div style={{ fontSize: 12, color: C.sub, marginBottom: 10, lineHeight: 1.6 }}>Tap to insert — auto-replaced with each contact's real info when sending:</div>
              <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap' }}>
                {[
                  { v: '{name}',      d: 'Full name'   },
                  { v: '{firstname}', d: 'First name'   },
                  { v: '{phone}',     d: 'Phone / Email'},
                ].map(x => (
                  <div key={x.v} onClick={() => insert(x.v)}
                    style={{ background: C.greenL, border: `1.5px solid ${C.green}30`, borderRadius: 10, padding: '8px 13px', cursor: 'pointer', textAlign: 'center' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.greenD }}>{x.v}</div>
                    <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>{x.d}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 12, fontSize: 11, color: C.muted, lineHeight: 1.6 }}>
                Example: "Hi {'{name}'}! We have a special offer for you." → becomes "Hi Rahul! We have a special offer for you."
              </div>
            </div>
          )}

          {/* Format */}
          {tab === 'format' && (
            <div>
              <div style={{ fontSize: 12, color: C.sub, marginBottom: 10 }}>Select text in the message box first, then tap a format. Or tap to insert at cursor:</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {FORMATS.map(f => (
                  <div key={f.l} onClick={f.fn} title={f.title}
                    style={{ background: C.bg, border: `1.5px solid ${C.border}`, borderRadius: 9, padding: '7px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: C.text, whiteSpace: 'nowrap', ...f.style }}>
                    {f.l}
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 12, fontSize: 11, color: C.muted, lineHeight: 1.6 }}>
                WhatsApp supports: *bold* _italic_ ~strikethrough~ `monospace`
              </div>
            </div>
          )}

          {/* Emoji */}
          {tab === 'emoji' && (
            <div>
              <div style={{ fontSize: 12, color: C.sub, marginBottom: 10 }}>Tap any emoji to insert it at your cursor position:</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {EMOJIS.map(e => (
                  <span key={e} onClick={() => { insert(e); setTab('tools') }}
                    style={{ fontSize: 24, cursor: 'pointer', borderRadius: 6, padding: '2px 4px', transition: 'background .1s' }}>
                    {e}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Preview */}
          {tab === 'preview' && (
            <div>
              <div style={{ fontSize: 12, color: C.sub, marginBottom: 10 }}>Preview with sample name "Rahul Sharma":</div>
              {msg.trim()
                ? <div style={{ background: C.greenL, borderRadius: 10, borderTopLeftRadius: 2, padding: '12px 14px', fontSize: 13, color: C.text, lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>
                    {personalize(msg, sample)}
                  </div>
                : <div style={{ textAlign: 'center', color: C.muted, fontSize: 13, padding: '20px 0' }}>Write your message first to see preview</div>}
            </div>
          )}
        </div>
      </Card>

      {/* Message box */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.sub, letterSpacing: .7, textTransform: 'uppercase' }}>Message</div>
          <div style={{ fontSize: 11, color: msg.length > 850 ? C.red : C.muted }}>{msg.length} / 1000</div>
        </div>
        <textarea
          ref={taRef}
          value={msg}
          onChange={e => { setMsg(e.target.value); setErr('') }}
          maxLength={1000}
          rows={9}
          placeholder={'Hi {name}! 👋\n\nWe have something special for you today.\n\n✅ Great quality\n✅ Best price\n\nReply to know more! 🙏'}
          style={{ width: '100%', background: C.card, border: `1.5px solid ${err ? C.red : C.border}`, borderRadius: 12, padding: '13px 14px', color: C.text, fontSize: 14, fontFamily: 'inherit', lineHeight: 1.75, boxSizing: 'border-box' }}
        />
        {err && <div style={{ fontSize: 11, color: C.red, marginTop: 4 }}>{err}</div>}
      </div>

      <Btn full onClick={() => {
        if (!msg.trim()) { setErr('Please write a message before continuing'); return }
        onNext({ msg: msg.trim(), name: name.trim() })
      }}>
        Next — Add Contacts →
      </Btn>
    </Wrap>
  )
}

// ─────────────────────────────────────────────────────
// SCREEN 4a — PICK SEND METHOD (normal only)
// ─────────────────────────────────────────────────────
function MethodPicker({ onPick, onBack }) {
  const methods = [
    {
      id: 'whatsapp', icon: '💬', color: C.green, bg: C.greenL,
      title: 'WhatsApp', sub: 'Opens per contact — you tap Send arrow each time',
      tag: `${WA_LIMIT} contacts/day (WhatsApp limit)`, tagCol: C.yellow,
      needs: 'Phone number',
    },
    {
      id: 'sms', icon: '📱', color: C.blue, bg: C.blueL,
      title: 'SMS — Text Message', sub: 'Opens SMS app per contact — you tap Send each time',
      tag: 'Works on any phone, no app needed', tagCol: C.green,
      needs: 'Phone number',
    },
    {
      id: 'email', icon: '📧', color: C.purple, bg: C.purpleL,
      title: 'Email', sub: 'Opens email app once — tap Send once for all recipients',
      tag: '✅ True one-click to everyone', tagCol: C.green,
      needs: 'Email address',
    },
  ]

  return (
    <Wrap>
      <BackBar onBack={onBack} title="Choose Send Method" sub="How do you want to send?" />

      <Banner text="WhatsApp and SMS open one contact at a time — you tap Send each time. Email is the only true one-click send to everyone." />
      <div style={{ height: 16 }} />

      {methods.map(m => (
        <div key={m.id} onClick={() => onPick(m.id)}
          style={{ background: C.card, border: `2px solid ${m.color}20`, borderRadius: 16, padding: 16, marginBottom: 12, cursor: 'pointer', boxShadow: '0 1px 6px rgba(0,0,0,.04)', transition: 'box-shadow .15s' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 13, marginBottom: 10 }}>
            <div style={{ width: 46, height: 46, background: m.bg, borderRadius: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>{m.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: C.text }}>{m.title}</div>
              <div style={{ fontSize: 12, color: C.sub, marginTop: 2 }}>{m.sub}</div>
            </div>
            <span style={{ fontSize: 20, color: m.color }}>›</span>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <div style={{ background: m.bg, borderRadius: 8, padding: '4px 10px', fontSize: 11, color: m.tagCol, fontWeight: 600 }}>{m.tag}</div>
            <div style={{ background: C.bg, borderRadius: 8, padding: '4px 10px', fontSize: 11, color: C.muted }}>Needs: {m.needs}</div>
          </div>
        </div>
      ))}
    </Wrap>
  )
}

// ─────────────────────────────────────────────────────
// SCREEN 4b — CONTACT MANAGER
// ─────────────────────────────────────────────────────
function Contacts({ method, onSend, onBack }) {
  const [list,      setList]      = useState([])
  const [sel,       setSel]       = useState([])
  const [q,         setQ]         = useState('')
  const [sheet,     setSheet]     = useState(false)
  const [newName,   setNewName]   = useState('')
  const [newVal,    setNewVal]    = useState('')
  const [nerr,      setNerr]      = useState({})
  const [importing, setImporting] = useState(false)
  const [snack,     setSnack]     = useState(null)
  const csvRef = useRef()

  const isEmail  = method === 'email'
  const limit    = method === 'whatsapp' || method === 'sms' ? WA_LIMIT : Infinity
  const selC     = useMemo(() => list.filter(c => sel.includes(c.id)), [list, sel])
  const filtered = useMemo(() => list.filter(c => (c.name + (c.phone || '') + (c.email || '')).toLowerCase().includes(q.toLowerCase())), [list, q])
  const over     = isFinite(limit) && sel.length > limit

  const toast = (m, col) => { setSnack({ m, col }); setTimeout(() => setSnack(null), 2600) }

  async function fromPhone() {
    if (isEmail) { toast('Phone contacts do not have email. Add emails manually or import CSV.', C.yellow); return }
    setImporting(true)
    try {
      if (!('contacts' in navigator)) { toast('Contact picker not supported. Use CSV or add manually.', C.yellow); setImporting(false); return }
      const raw   = await navigator.contacts.select(['name', 'tel'], { multiple: true })
      const exist = new Set(list.map(c => c.phone))
      const fresh = raw
        .flatMap(r => (r.tel || []).map(t => ({ id: uid(), name: (r.name?.[0] || 'Unknown').trim(), phone: cleanPhone(t) })))
        .filter(c => c.phone.length >= 10 && !exist.has(c.phone))
      if (!fresh.length) { toast('No new contacts found', C.yellow); setImporting(false); return }
      setList(p => [...p, ...fresh])
      setSel(p  => [...p, ...fresh.map(c => c.id)])
      toast(`${fresh.length} contacts imported ✓`, C.green)
    } catch { toast('Could not access contacts. Allow permission when asked.', C.red) }
    setImporting(false)
  }

  function fromCSV(e) {
    const file = e.target.files[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      try {
        const rows  = ev.target.result.split('\n').filter(Boolean)
        const start = /[a-zA-Z]/.test(rows[0]?.split(',')?.[1] || '') ? 1 : 0
        const exist = new Set(list.map(c => c.phone || c.email))
        const fresh = rows.slice(start).map(l => {
          const p = l.split(',').map(x => x.replace(/"/g, '').trim())
          return isEmail
            ? { id: uid(), name: p[0] || 'Unknown', email: p[1] || '' }
            : { id: uid(), name: p[0] || 'Unknown', phone: cleanPhone(p[1] || '') }
        }).filter(c => isEmail ? (c.email.includes('@') && !exist.has(c.email)) : (c.phone.length >= 10 && !exist.has(c.phone)))
        if (!fresh.length) { toast('No new valid contacts found in CSV', C.yellow); return }
        setList(p => [...p, ...fresh])
        setSel(p  => [...p, ...fresh.map(c => c.id)])
        toast(`${fresh.length} contacts imported ✓`, C.green)
      } catch { toast(`Invalid CSV. Format: Name, ${isEmail ? 'Email' : 'Phone'}`, C.red) }
    }
    reader.readAsText(file); e.target.value = ''
  }

  function addOne() {
    const e = {}
    if (!newName.trim()) e.name = 'Name is required'
    if (isEmail) {
      if (!newVal.includes('@')) e.val = 'Enter a valid email address'
      else if (list.find(c => c.email === newVal.trim())) e.val = 'This email is already added'
    } else {
      if (newVal.replace(/\D/g,'').length < 10) e.val = 'Enter a valid phone number'
      else if (list.find(c => c.phone === cleanPhone(newVal))) e.val = 'This number is already added'
    }
    if (Object.keys(e).length) { setNerr(e); return }
    const nc = isEmail
      ? { id: uid(), name: newName.trim(), email: newVal.trim() }
      : { id: uid(), name: newName.trim(), phone: cleanPhone(newVal) }
    setList(p => [...p, nc])
    setSel(p  => [...p, nc.id])
    setNewName(''); setNewVal(''); setNerr({})
    setSheet(false)
    toast('Contact added ✓', C.green)
  }

  const mIcon = { whatsapp: '💬', sms: '📱', email: '📧' }[method]
  const mName = { whatsapp: 'WhatsApp', sms: 'SMS', email: 'Email' }[method]

  return (
    <Wrap>
      {snack && <Snack msg={snack.m} color={snack.col} />}

      <BackBar onBack={onBack} title="Add Contacts"
        sub={`${mIcon} ${mName} · ${list.length} contacts · ${sel.length} selected`} />

      {/* Import row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 9, marginBottom: 14 }}>
        {[
          { icon: importing ? '⏳' : '📲', label: 'From Phone', sub: isEmail ? 'Not for email' : 'Android only', fn: fromPhone, off: isEmail },
          { icon: '📋', label: 'Import CSV', sub: `Name, ${isEmail ? 'Email' : 'Phone'}`, fn: () => csvRef.current?.click() },
          { icon: '➕', label: 'Add Manually', sub: isEmail ? 'Enter email' : 'Enter number', fn: () => { setNewName(''); setNewVal(''); setNerr({}); setSheet(true) } },
        ].map(b => (
          <div key={b.label} onClick={b.off ? undefined : b.fn}
            style={{ background: C.card, border: `1.5px solid ${C.border}`, borderRadius: 12, padding: '12px 8px', cursor: b.off ? 'not-allowed' : 'pointer', textAlign: 'center', opacity: b.off ? .4 : 1 }}>
            <div style={{ fontSize: 22, marginBottom: 5 }}>{b.icon}</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{b.label}</div>
            <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>{b.sub}</div>
          </div>
        ))}
      </div>
      <input ref={csvRef} type="file" accept=".csv,.txt" style={{ display: 'none' }} onChange={fromCSV} />

      {/* CSV hint */}
      <div style={{ fontSize: 11, color: C.muted, background: C.bg, borderRadius: 9, padding: '7px 11px', marginBottom: 14 }}>
        {isEmail ? '📋 CSV format: Column 1 = Name, Column 2 = Email' : '📋 CSV format: Column 1 = Name, Column 2 = Phone. Save Excel as CSV first.'}
      </div>

      {/* Limit warning */}
      {isFinite(limit) && (
        <div style={{ marginBottom: 14 }}>
          <Banner type={over ? 'red' : 'yellow'}
            text={over
              ? `Over limit! ${mName} allows ${limit}/day. Deselect ${sel.length - limit} contacts.`
              : `${mName} limit: ${limit} contacts per day (WhatsApp's rule). Selected: ${sel.length}.`} />
        </div>
      )}

      {/* Search + select all */}
      {list.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          <Field placeholder="Search contacts..." value={q} onChange={setQ} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 9 }}>
            <span style={{ fontSize: 12, color: C.sub }}>{sel.length} of {list.length} selected</span>
            <span onClick={() => setSel(sel.length === list.length ? [] : list.map(c => c.id))}
              style={{ fontSize: 12, fontWeight: 700, color: C.green, cursor: 'pointer' }}>
              {sel.length === list.length ? 'Deselect All' : 'Select All'}
            </span>
          </div>
        </div>
      )}

      {/* List */}
      {list.length === 0
        ? <Card style={{ textAlign: 'center', padding: '44px 20px', marginBottom: 16 }}>
            <div style={{ fontSize: 42, marginBottom: 10 }}>👥</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 5 }}>No contacts yet</div>
            <div style={{ fontSize: 12, color: C.sub, lineHeight: 1.6 }}>
              {isEmail ? 'Add email addresses manually or import a CSV file.' : 'Import from your phone, upload a CSV, or add numbers manually.'}
            </div>
          </Card>
        : <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
            {filtered.map(c => {
              const on      = sel.includes(c.id)
              const nope    = isFinite(limit) && !on && sel.length >= limit
              return (
                <div key={c.id}
                  onClick={() => {
                    if (nope) { toast(`${mName} limit is ${limit}/day`, C.yellow); return }
                    setSel(p => on ? p.filter(x => x !== c.id) : [...p, c.id])
                  }}
                  style={{ display: 'flex', alignItems: 'center', gap: 11, background: C.card, border: `1.5px solid ${on ? C.green : C.border}`, borderRadius: 13, padding: '11px 13px', cursor: nope ? 'not-allowed' : 'pointer', opacity: nope ? .5 : 1, boxShadow: on ? `0 0 0 3px ${C.green}12` : 'none', transition: 'all .15s' }}>
                  <div style={{ width: 22, height: 22, borderRadius: 7, border: `2px solid ${on ? C.green : C.border}`, background: on ? C.green : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all .15s' }}>
                    {on && <span style={{ color: '#fff', fontSize: 12, fontWeight: 900 }}>✓</span>}
                  </div>
                  <div style={{ width: 40, height: 40, borderRadius: 20, background: C.greenL, border: `1.5px solid ${C.green}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: C.greenD, flexShrink: 0 }}>
                    {c.name.trim().split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
                    <div style={{ fontSize: 11, color: C.muted }}>{isEmail ? c.email : `+${c.phone}`}</div>
                  </div>
                  <div onClick={e => { e.stopPropagation(); setList(p => p.filter(x => x.id !== c.id)); setSel(p => p.filter(x => x !== c.id)) }}
                    style={{ width: 26, height: 26, borderRadius: 7, background: C.redL, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: C.red, cursor: 'pointer', flexShrink: 0 }}>✕</div>
                </div>
              )
            })}
          </div>}

      {/* Send button */}
      {sel.length > 0 && !over && (
        <Btn full onClick={() => onSend(selC)}>
          {mIcon} {isEmail ? `Send Email to All ${sel.length}` : `Start Sending to ${sel.length} →`}
        </Btn>
      )}
      {over && <div style={{ textAlign: 'center', fontSize: 12, color: C.red, fontWeight: 700 }}>Deselect {sel.length - limit} contacts to continue</div>}

      {/* Add sheet */}
      {sheet && (
        <Sheet title={isEmail ? 'Add Email Address' : 'Add Phone Number'} onClose={() => setSheet(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Field label="Full Name" placeholder="Rahul Sharma" value={newName} onChange={setNewName} error={nerr.name} autoFocus />
            <Field
              label={isEmail ? 'Email Address' : 'Phone Number'}
              placeholder={isEmail ? 'rahul@gmail.com' : '9876543210'}
              value={newVal} onChange={setNewVal} error={nerr.val}
              type={isEmail ? 'email' : 'tel'}
              hint={isEmail ? 'Enter a valid email address' : '10-digit Indian number — 91 added automatically'}
            />
            <Btn full onClick={addOne}>Add Contact ✓</Btn>
            <Btn full color="ghost" onClick={() => setSheet(false)}>Cancel</Btn>
          </div>
        </Sheet>
      )}
    </Wrap>
  )
}

// ─────────────────────────────────────────────────────
// SCREEN 5a — WHATSAPP SEND
// ─────────────────────────────────────────────────────
function WASend({ contacts, msg, name, onDone, onBack }) {
  const [idx, setIdx] = useState(-1)
  const done = idx >= contacts.length && idx >= 0
  const curr = idx >= 0 && idx < contacts.length ? contacts[idx] : null
  const pct  = idx <= 0 ? 0 : Math.round((idx / contacts.length) * 100)

  function open() {
    const c = idx < 0 ? contacts[0] : contacts[idx]
    if (!c) return
    window.open(`https://wa.me/${c.phone}?text=${encodeURIComponent(personalize(msg, c))}`, '_blank', 'noopener')
    setIdx(i => i < 0 ? 1 : i + 1)
  }

  if (done) return <Done sent={contacts.length} method="WhatsApp" onDone={onDone} />

  return (
    <Wrap>
      {idx < 0
        ? <BackBar onBack={onBack} title="Send via WhatsApp" sub={`${contacts.length} contacts ready`} />
        : <div style={{ fontSize: 18, fontWeight: 800, color: C.text, marginBottom: 24 }}>💬 Sending via WhatsApp</div>}

      {idx >= 0 && (
        <Card style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: C.sub }}>Progress</span>
            <span style={{ fontSize: 14, fontWeight: 800, color: C.green }}>{idx} / {contacts.length}</span>
          </div>
          <div style={{ background: C.bg, borderRadius: 8, height: 10, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg,${C.green},${C.greenD})`, borderRadius: 8, transition: 'width .3s' }} />
          </div>
          {idx > 0 && <div style={{ fontSize: 11, color: C.muted, marginTop: 6 }}>Sent to {contacts[idx - 1]?.name} — come back and tap next</div>}
        </Card>
      )}

      <div style={{ marginBottom: 14 }}>
        <Banner text={`WhatsApp limit: ${WA_LIMIT}/day. Sending to ${contacts.length}. WaBroadcast is not responsible for any account restrictions by WhatsApp.`} />
      </div>

      <Card border={C.green} style={{ marginBottom: 14, background: C.greenL }}>
        {curr && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div style={{ width: 46, height: 46, borderRadius: 23, background: C.green, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
              {curr.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: C.text }}>{curr.name}</div>
              <div style={{ fontSize: 12, color: C.sub }}>+{curr.phone} · {idx + 1} of {contacts.length}</div>
            </div>
          </div>
        )}
        <div style={{ background: C.card, borderRadius: 10, borderTopLeftRadius: 2, padding: '11px 13px', fontSize: 13, color: C.text, lineHeight: 1.75, whiteSpace: 'pre-wrap', marginBottom: 12 }}>
          {personalize(msg, curr || contacts[0])}
        </div>
        <Btn full onClick={open}>
          {idx < 0 ? `💬 Open WhatsApp — Start (1/${contacts.length})` : `💬 Open WhatsApp — Next (${idx + 1}/${contacts.length})`}
        </Btn>
      </Card>

      {idx < 0 && (
        <Card>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 10 }}>How it works</div>
          {['WhatsApp opens with your message ready', 'Tap the Send arrow inside WhatsApp', 'Come back here — next contact loads automatically', 'Repeat until all done'].map((t, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 8, alignItems: 'flex-start' }}>
              <div style={{ width: 20, height: 20, borderRadius: 10, background: C.greenL, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 900, color: C.green, flexShrink: 0 }}>{i + 1}</div>
              <span style={{ fontSize: 12, color: C.sub, lineHeight: 1.5 }}>{t}</span>
            </div>
          ))}
        </Card>
      )}
    </Wrap>
  )
}

// ─────────────────────────────────────────────────────
// SCREEN 5b — SMS SEND
// ─────────────────────────────────────────────────────
function SMSSend({ contacts, msg, name, onDone, onBack }) {
  const [idx, setIdx] = useState(-1)
  const done = idx >= contacts.length && idx >= 0
  const curr = idx >= 0 && idx < contacts.length ? contacts[idx] : null
  const pct  = idx <= 0 ? 0 : Math.round((idx / contacts.length) * 100)

  function open() {
    const c = idx < 0 ? contacts[0] : contacts[idx]
    if (!c) return
    window.open(`sms:${c.phone}?body=${encodeURIComponent(personalize(msg, c))}`, '_self')
    setIdx(i => i < 0 ? 1 : i + 1)
  }

  if (done) return <Done sent={contacts.length} method="SMS" onDone={onDone} />

  return (
    <Wrap>
      {idx < 0
        ? <BackBar onBack={onBack} title="Send via SMS" sub={`${contacts.length} contacts ready`} />
        : <div style={{ fontSize: 18, fontWeight: 800, color: C.text, marginBottom: 24 }}>📱 Sending via SMS</div>}

      {idx >= 0 && (
        <Card style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: C.sub }}>Progress</span>
            <span style={{ fontSize: 14, fontWeight: 800, color: C.blue }}>{idx} / {contacts.length}</span>
          </div>
          <div style={{ background: C.bg, borderRadius: 8, height: 10, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg,${C.blue},#1D4ED8)`, borderRadius: 8, transition: 'width .3s' }} />
          </div>
        </Card>
      )}

      <div style={{ marginBottom: 14 }}>
        <Banner type="blue" text="Normal SMS rates from your carrier apply. WaBroadcast is not responsible for any SMS charges on your bill." icon="ℹ️" />
      </div>

      <Card border={C.blue} style={{ marginBottom: 14, background: C.blueL }}>
        {curr && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div style={{ width: 46, height: 46, borderRadius: 23, background: C.blue, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
              {curr.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: C.text }}>{curr.name}</div>
              <div style={{ fontSize: 12, color: C.sub }}>+{curr.phone} · {idx + 1} of {contacts.length}</div>
            </div>
          </div>
        )}
        <div style={{ background: C.card, borderRadius: 10, padding: '11px 13px', fontSize: 13, color: C.text, lineHeight: 1.75, whiteSpace: 'pre-wrap', marginBottom: 12 }}>
          {personalize(msg, curr || contacts[0])}
        </div>
        <Btn full color="blue" onClick={open}>
          {idx < 0 ? `📱 Open SMS — Start (1/${contacts.length})` : `📱 Open SMS — Next (${idx + 1}/${contacts.length})`}
        </Btn>
      </Card>
    </Wrap>
  )
}

// ─────────────────────────────────────────────────────
// SCREEN 5c — EMAIL SEND
// ─────────────────────────────────────────────────────
function EmailSend({ contacts, msg, name, onDone, onBack }) {
  const [sent, setSent] = useState(false)

  function send() {
    const to      = contacts.map(c => encodeURIComponent(c.email)).join(',')
    const subject = encodeURIComponent(name || 'Message from WaBroadcast')
    const body    = encodeURIComponent(contacts.length === 1 ? personalize(msg, contacts[0]) : msg)
    window.open(`mailto:${to}?subject=${subject}&body=${body}`, '_self')
    setSent(true)
  }

  if (sent) return <Done sent={contacts.length} method="Email" onDone={onDone} />

  return (
    <Wrap>
      <BackBar onBack={onBack} title="Send via Email" sub={`${contacts.length} recipients ready`} />

      <Banner type="green" text="One click — your email app opens with all recipients and message ready. Just tap Send." />
      <div style={{ height: 10 }} />
      {contacts.length > 1 && <Banner type="blue" text="{name} personalisation works only when sending to one contact at a time. For bulk email, the same message goes to all." icon="ℹ️" />}
      <div style={{ height: 14 }} />

      {/* Summary */}
      <Card border={C.purple} style={{ marginBottom: 14, background: C.purpleL }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.purple, marginBottom: 10 }}>📋 Email Summary</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
          <span style={{ color: C.sub }}>Subject</span>
          <span style={{ fontWeight: 700, color: C.text }}>{name || '(No subject)'}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 12 }}>
          <span style={{ color: C.sub }}>Recipients</span>
          <span style={{ fontWeight: 700, color: C.text }}>{contacts.length}</span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {contacts.slice(0, 8).map(c => (
            <div key={c.id} style={{ background: C.card, borderRadius: 7, padding: '3px 9px', fontSize: 11, color: C.text, border: `1px solid ${C.border}` }}>{c.name}</div>
          ))}
          {contacts.length > 8 && <div style={{ background: C.card, borderRadius: 7, padding: '3px 9px', fontSize: 11, color: C.muted, border: `1px solid ${C.border}` }}>+{contacts.length - 8} more</div>}
        </div>
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.sub, marginBottom: 8, textTransform: 'uppercase', letterSpacing: .6 }}>Message Preview</div>
        <div style={{ fontSize: 13, color: C.text, lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>
          {personalize(msg, contacts[0])}
        </div>
      </Card>

      <Btn full color="purple" onClick={send} icon="📧">Open Email App — Send to All {contacts.length}</Btn>
      <div style={{ fontSize: 11, color: C.muted, textAlign: 'center', marginTop: 8 }}>Your email app opens. Tap Send inside it to send to everyone.</div>
    </Wrap>
  )
}

// ─────────────────────────────────────────────────────
// SCREEN 5d — BUSINESS SEND
// ─────────────────────────────────────────────────────
const BACKEND = import.meta.env.VITE_API_URL || ''

function BusinessSend({ contacts, msg, name, onDone, onBack }) {
  const [pid,    setPid]    = useState('')
  const [token,  setToken]  = useState('')
  const [showT,  setShowT]  = useState(false)
  const [stage,  setStage]  = useState('form') // form | sending | done
  const [result, setResult] = useState(null)
  const [err,    setErr]    = useState('')
  const [busy,   setBusy]   = useState(false)

  async function send() {
    if (!pid.trim())   { setErr('Enter your Phone Number ID'); return }
    if (!token.trim()) { setErr('Enter your Access Token'); return }
    setErr(''); setBusy(true); setStage('sending')
    try {
      const res = await fetch(`${BACKEND}/api/broadcast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contacts, message: msg, broadcastName: name, phoneId: pid.trim(), token: token.trim() }),
      })
      const d = await res.json().catch(() => { throw new Error('Server did not respond correctly') })
      if (!res.ok) throw new Error(d.error || 'Sending failed')
      setResult(d); setStage('done')
    } catch (e) {
      setErr(e.message || 'Something went wrong. Check your API credentials.'); setStage('form')
    }
    setBusy(false)
  }

  if (stage === 'sending') return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center' }}>
      <div style={{ width: 60, height: 60, border: `4px solid ${C.blue}25`, borderTopColor: C.blue, borderRadius: 30, animation: 'spin .75s linear infinite', marginBottom: 22 }} />
      <div style={{ fontSize: 20, fontWeight: 800, color: C.text, marginBottom: 8 }}>Sending Messages...</div>
      <div style={{ fontSize: 13, color: C.sub }}>Sending to {contacts.length} contacts via API.<br />Please keep this screen open.</div>
    </div>
  )

  if (stage === 'done') return <Done sent={result?.sent || contacts.length} failed={result?.failed} method="Business API" onDone={onDone} />

  return (
    <Wrap>
      <BackBar onBack={onBack} title="Business API" sub={`${contacts.length} contacts ready`} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
        <Banner text="Your API credentials are used only right now to send. They are never saved or stored anywhere." />
        <Banner type="red" text="WaBroadcast is not responsible for Meta API charges, account suspensions, or message failures. You are responsible for staying within Meta's limits." />
      </div>

      <Card border={C.blue} style={{ background: C.blueL, marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.blue, marginBottom: 8 }}>📋 Summary</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 5 }}>
          <span style={{ color: C.sub }}>Broadcast Name</span>
          <span style={{ fontWeight: 700 }}>{name || 'Unnamed'}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
          <span style={{ color: C.sub }}>Recipients</span>
          <span style={{ fontWeight: 700 }}>{contacts.length} contacts</span>
        </div>
      </Card>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 14 }}>
        <Field label="Phone Number ID" placeholder="123456789012345" value={pid} onChange={setPid}
          hint="Meta Developer Dashboard → WhatsApp → API Setup → Phone Number ID" />
        <Field label="Access Token" placeholder="EAAxxxxxxxxxxxxxxxxxxxxxxxx" value={token} onChange={setToken}
          type={showT ? 'text' : 'password'}
          hint="Temporary or permanent token from Meta Developer Dashboard"
          right={<span onClick={() => setShowT(t => !t)} style={{ fontSize: 17 }}>{showT ? '🙈' : '👁️'}</span>} />
      </div>

      <Card style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 10 }}>🔑 How to get API credentials</div>
        {[
          'Go to developers.facebook.com',
          'Create App → select Business type',
          'Add WhatsApp product to your app',
          'Verify your business (GST or Udyam)',
          'Add a phone number not already on WhatsApp',
          'Copy Phone Number ID and Access Token',
        ].map((t, i) => (
          <div key={i} style={{ display: 'flex', gap: 9, marginBottom: 7, alignItems: 'flex-start' }}>
            <div style={{ width: 20, height: 20, borderRadius: 10, background: C.blueL, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 900, color: C.blue, flexShrink: 0 }}>{i + 1}</div>
            <span style={{ fontSize: 12, color: C.sub, lineHeight: 1.5 }}>{t}</span>
          </div>
        ))}
      </Card>

      {err && <><Banner type="red" text={err} /><div style={{ height: 12 }} /></>}

      <Btn full color="blue" loading={busy} onClick={send} icon="⚡">Send to All {contacts.length} via API</Btn>
    </Wrap>
  )
}

// ─────────────────────────────────────────────────────
// DONE SCREEN
// ─────────────────────────────────────────────────────
function Done({ sent, failed, method, onDone }) {
  return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center' }}>
      <div style={{ width: 88, height: 88, background: C.greenL, border: `3px solid ${C.green}`, borderRadius: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 44, marginBottom: 22, boxShadow: `0 0 36px ${C.green}22` }}>✓</div>
      <div style={{ fontSize: 24, fontWeight: 900, color: C.text, marginBottom: 8 }}>All Done! 🎉</div>
      <div style={{ fontSize: 14, color: C.sub, marginBottom: 6, lineHeight: 1.7 }}>
        Sent via <strong style={{ color: C.text }}>{method}</strong><br />
        <span style={{ color: C.green, fontWeight: 800, fontSize: 22 }}>{sent}</span> messages sent
        {failed > 0 && <> · <span style={{ color: C.red }}>{failed} failed</span></>}
      </div>
      <div style={{ fontSize: 12, color: C.muted, marginBottom: 28 }}>All contact data cleared from memory.</div>
      <Btn onClick={onDone}>Send Another Broadcast</Btn>
    </div>
  )
}

// ─────────────────────────────────────────────────────
// ROOT — everything lives in memory only
// ─────────────────────────────────────────────────────
export default function App() {
  const [sc,  setSc]  = useState('disclaimer') // screen
  const [mode, setMode] = useState(null)
  const [meth, setMeth] = useState(null)
  const [msg,  setMsg]  = useState('')
  const [name, setName] = useState('')
  const [cts,  setCts]  = useState([])

  const reset = () => { setSc('home'); setMode(null); setMeth(null); setMsg(''); setName(''); setCts([]) }

  return (
    <>
      {sc === 'disclaimer' && <Disclaimer onAccept={() => setSc('home')} />}

      {sc === 'home' && (
        <Home onSelect={m => { setMode(m); setSc('compose') }} />
      )}

      {sc === 'compose' && (
        <Composer mode={mode} onBack={reset}
          onNext={({ msg: m, name: n }) => { setMsg(m); setName(n); setSc(mode === 'normal' ? 'method' : 'contacts') }} />
      )}

      {sc === 'method' && (
        <MethodPicker onBack={() => setSc('compose')} onPick={m => { setMeth(m); setSc('contacts') }} />
      )}

      {sc === 'contacts' && (
        <Contacts
          method={mode === 'business' ? 'whatsapp' : meth}
          onBack={() => setSc(mode === 'normal' ? 'method' : 'compose')}
          onSend={c => { setCts(c); setSc('send') }} />
      )}

      {sc === 'send' && mode === 'normal' && meth === 'whatsapp' && (
        <WASend contacts={cts} msg={msg} name={name} onDone={reset} onBack={() => setSc('contacts')} />
      )}
      {sc === 'send' && mode === 'normal' && meth === 'sms' && (
        <SMSSend contacts={cts} msg={msg} name={name} onDone={reset} onBack={() => setSc('contacts')} />
      )}
      {sc === 'send' && mode === 'normal' && meth === 'email' && (
        <EmailSend contacts={cts} msg={msg} name={name} onDone={reset} onBack={() => setSc('contacts')} />
      )}
      {sc === 'send' && mode === 'business' && (
        <BusinessSend contacts={cts} msg={msg} name={name} onDone={reset} onBack={() => setSc('contacts')} />
      )}
    </>
  )
}
