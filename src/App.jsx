import { useState, useRef, useMemo, useEffect } from 'react'

// ─────────────────────────────────────────────────────
// DESIGN SYSTEM — futuristic navy + cyan + violet
// ─────────────────────────────────────────────────────
const D = {
  // backgrounds
  bg:       '#080C14',
  surface:  '#0E1521',
  card:     '#131C2B',
  cardHov:  '#172035',

  // borders
  border:   '#1E2D44',
  borderL:  '#263549',

  // text
  text:     '#F0F4FF',
  textSub:  '#8896B3',
  textMut:  '#4A5A78',

  // brand colors
  cyan:     '#00D4FF',
  cyanD:    '#0099CC',
  cyanL:    '#00D4FF18',
  violet:   '#7B61FF',
  violetD:  '#5A45CC',
  violetL:  '#7B61FF18',

  // status
  green:    '#00E676',
  greenL:   '#00E67614',
  red:      '#FF4D6A',
  redL:     '#FF4D6A14',
  yellow:   '#FFB020',
  yellowL:  '#FFB02014',
  blue:     '#4D8EFF',
  blueL:    '#4D8EFF14',
}

const WA_LIMIT = 256

// ─────────────────────────────────────────────────────
// GLOBAL STYLES
// ─────────────────────────────────────────────────────
if (!document.getElementById('_bfy')) {
  const s = document.createElement('style')
  s.id = '_bfy'
  s.textContent = `
    *, *::before, *::after { box-sizing: border-box; -webkit-tap-highlight-color: transparent; margin: 0; padding: 0; }
    html, body { width: 100%; min-height: 100%; background: ${D.bg}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: ${D.text}; }
    input, textarea, button, select { font-family: inherit; }
    input::placeholder, textarea::placeholder { color: ${D.textMut}; }
    textarea { resize: vertical; }
    input, textarea { outline: none; }
    button { border: none; cursor: pointer; outline: none; }
    @keyframes spin    { to { transform: rotate(360deg); } }
    @keyframes fadeUp  { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
    @keyframes slideUp { from { transform: translateY(100%); } to { transform: none; } }
    @keyframes pulse   { 0%,100% { opacity: 1; } 50% { opacity: .5; } }
    @keyframes glow    { 0%,100% { box-shadow: 0 0 20px #00D4FF30; } 50% { box-shadow: 0 0 40px #00D4FF60; } }
    ::-webkit-scrollbar { width: 4px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: ${D.border}; border-radius: 4px; }
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
    .replace(/{name}/gi,      c?.name  || '')
    .replace(/{firstname}/gi, (c?.name || '').split(' ')[0])
    .replace(/{phone}/gi,     c?.phone || c?.email || '')

// ─────────────────────────────────────────────────────
// BROADIFY LOGO SVG
// ─────────────────────────────────────────────────────
function Logo({ size = 48 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <defs>
        <linearGradient id="lg1" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#00D4FF" />
          <stop offset="100%" stopColor="#7B61FF" />
        </linearGradient>
        <linearGradient id="lg2" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#7B61FF" />
          <stop offset="100%" stopColor="#00D4FF" />
        </linearGradient>
      </defs>
      {/* Hexagon */}
      <path d="M24 2L42 12.5V33.5L24 44L6 33.5V12.5L24 2Z" fill="url(#lg1)" opacity="0.15" />
      <path d="M24 2L42 12.5V33.5L24 44L6 33.5V12.5L24 2Z" stroke="url(#lg1)" strokeWidth="1.5" fill="none" />
      {/* Signal waves */}
      <path d="M16 24 Q20 18 24 24 Q28 30 32 24" stroke="url(#lg2)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <path d="M12 24 Q18 14 24 24 Q30 34 36 24" stroke="#00D4FF" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.5" />
      {/* Center dot */}
      <circle cx="24" cy="24" r="2.5" fill="url(#lg1)" />
    </svg>
  )
}

// ─────────────────────────────────────────────────────
// BASE COMPONENTS
// ─────────────────────────────────────────────────────
function Btn({ children, onClick, variant = 'primary', full, small, loading, disabled, icon, style: sx }) {
  const V = {
    primary: {
      background: 'linear-gradient(135deg, #00D4FF, #7B61FF)',
      color: '#fff',
      boxShadow: '0 4px 24px #00D4FF30',
      border: 'none',
    },
    secondary: {
      background: 'transparent',
      color: D.cyan,
      border: `1.5px solid ${D.cyan}50`,
      boxShadow: 'none',
    },
    ghost: {
      background: D.card,
      color: D.textSub,
      border: `1.5px solid ${D.border}`,
      boxShadow: 'none',
    },
    danger: {
      background: D.redL,
      color: D.red,
      border: `1.5px solid ${D.red}30`,
      boxShadow: 'none',
    },
    green: {
      background: D.greenL,
      color: D.green,
      border: `1.5px solid ${D.green}30`,
      boxShadow: 'none',
    },
    violet: {
      background: 'linear-gradient(135deg, #7B61FF, #5A45CC)',
      color: '#fff',
      boxShadow: '0 4px 20px #7B61FF30',
      border: 'none',
    },
    blue: {
      background: D.blueL,
      color: D.blue,
      border: `1.5px solid ${D.blue}30`,
      boxShadow: 'none',
    },
  }[variant] || {}

  return (
    <button
      onClick={disabled || loading ? undefined : onClick}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        width: full ? '100%' : 'auto',
        padding: small ? '8px 16px' : '13px 24px',
        fontSize: small ? 12 : 14, fontWeight: 700,
        borderRadius: 14, transition: 'opacity .15s, transform .1s',
        opacity: disabled ? .35 : 1,
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        letterSpacing: .3,
        ...V, ...sx,
      }}>
      {loading
        ? <span style={{ width: 16, height: 16, border: '2.5px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin .65s linear infinite', display: 'inline-block', flexShrink: 0 }} />
        : icon ? <span style={{ fontSize: 18, lineHeight: 1, flexShrink: 0 }}>{icon}</span> : null}
      {children}
    </button>
  )
}

function Field({ label, value, onChange, placeholder, type = 'text', hint, error, multiline, rows = 5, maxLen, right, autoFocus }) {
  const base = {
    width: '100%', background: D.surface, color: D.text, fontSize: 14, lineHeight: 1.7,
    border: `1.5px solid ${error ? D.red : D.border}`, borderRadius: 12,
    padding: right ? '12px 44px 12px 16px' : '12px 16px',
    transition: 'border-color .15s',
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && (
        <div style={{ fontSize: 11, fontWeight: 700, color: D.textSub, letterSpacing: 1, textTransform: 'uppercase' }}>{label}</div>
      )}
      <div style={{ position: 'relative' }}>
        {multiline
          ? <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows} maxLength={maxLen} autoFocus={autoFocus} style={base} />
          : <input    type={type}   value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} maxLength={maxLen} autoFocus={autoFocus} style={base} />}
        {right && <div style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)' }}>{right}</div>}
      </div>
      {error && <div style={{ fontSize: 11, color: D.red }}>{error}</div>}
      {hint && !error && <div style={{ fontSize: 11, color: D.textMut, lineHeight: 1.6 }}>{hint}</div>}
    </div>
  )
}

function Card({ children, style, border, glow, onClick }) {
  return (
    <div onClick={onClick} style={{
      background: D.card, borderRadius: 18,
      border: `1.5px solid ${border || D.border}`,
      padding: 18,
      boxShadow: glow ? `0 0 30px ${glow}20` : '0 2px 12px rgba(0,0,0,.3)',
      cursor: onClick ? 'pointer' : 'default',
      transition: 'border-color .2s, box-shadow .2s',
      ...style,
    }}>
      {children}
    </div>
  )
}

function Pill({ text, color, bg }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: bg || `${color}18`, border: `1px solid ${color}30`, borderRadius: 20, padding: '4px 10px', fontSize: 11, fontWeight: 700, color: color, whiteSpace: 'nowrap' }}>
      {text}
    </div>
  )
}

function Banner({ text, type = 'yellow', icon }) {
  const M = {
    yellow: { bg: D.yellowL, left: D.yellow, icon: icon || '⚠️', tc: D.yellow },
    red:    { bg: D.redL,    left: D.red,    icon: icon || '🔴', tc: D.red    },
    blue:   { bg: D.blueL,   left: D.blue,   icon: icon || 'ℹ️',  tc: D.blue  },
    green:  { bg: D.greenL,  left: D.green,  icon: icon || '✅', tc: D.green  },
    cyan:   { bg: D.cyanL,   left: D.cyan,   icon: icon || '💡', tc: D.cyan   },
  }[type]
  return (
    <div style={{ background: M.bg, borderLeft: `4px solid ${M.left}`, borderRadius: '0 12px 12px 0', padding: '12px 16px', fontSize: 12, color: D.text, lineHeight: 1.7 }}>
      <span style={{ marginRight: 8, fontSize: 14 }}>{M.icon}</span>{text}
    </div>
  )
}

function Drawer({ title, children, onClose }) {
  return (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', zIndex: 300, display: 'flex', alignItems: 'flex-end', backdropFilter: 'blur(6px)' }}>
      <div style={{ background: D.surface, width: '100%', maxHeight: '92vh', borderRadius: '24px 24px 0 0', overflowY: 'auto', animation: 'slideUp .25s ease', borderTop: `2px solid ${D.cyan}40` }}>
        {/* handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 0' }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: D.border }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px 14px' }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: D.text }}>{title}</div>
          <div onClick={onClose} style={{ width: 32, height: 32, borderRadius: 10, background: D.card, border: `1px solid ${D.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: D.textSub, fontSize: 16 }}>✕</div>
        </div>
        <div style={{ padding: '0 20px 28px' }}>{children}</div>
      </div>
    </div>
  )
}

function Toast({ msg, color }) {
  return (
    <div style={{ position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)', background: color || D.cyan, color: color === D.red ? '#fff' : D.bg, borderRadius: 14, padding: '10px 22px', fontSize: 13, fontWeight: 700, zIndex: 999, whiteSpace: 'nowrap', boxShadow: `0 4px 24px ${color || D.cyan}40`, animation: 'fadeUp .2s ease', pointerEvents: 'none' }}>
      {msg}
    </div>
  )
}

function BackBar({ onBack, title, sub }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
      <div onClick={onBack} style={{ width: 40, height: 40, borderRadius: 12, background: D.card, border: `1.5px solid ${D.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 18, color: D.textSub, flexShrink: 0, transition: 'border-color .15s' }}>←</div>
      <div>
        <div style={{ fontSize: 20, fontWeight: 800, color: D.text }}>{title}</div>
        {sub && <div style={{ fontSize: 12, color: D.textSub, marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  )
}

function Page({ children }) {
  return (
    <div style={{ minHeight: '100vh', background: D.bg, animation: 'fadeUp .2s ease' }}>
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '20px 16px 64px' }}>
        {children}
      </div>
    </div>
  )
}

function Divider({ label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '4px 0' }}>
      <div style={{ flex: 1, height: 1, background: D.border }} />
      {label && <div style={{ fontSize: 11, color: D.textMut, fontWeight: 600 }}>{label}</div>}
      <div style={{ flex: 1, height: 1, background: D.border }} />
    </div>
  )
}

// Avatar
function Av({ name, size = 42 }) {
  const init = (name || '?').trim().split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  return (
    <div style={{ width: size, height: size, borderRadius: size / 2, background: `linear-gradient(135deg,${D.cyan}30,${D.violet}30)`, border: `1.5px solid ${D.cyan}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * .32, fontWeight: 800, color: D.cyan, flexShrink: 0 }}>
      {init}
    </div>
  )
}

// Progress bar
function ProgressBar({ value, color = D.cyan }) {
  return (
    <div style={{ background: D.surface, borderRadius: 8, height: 8, overflow: 'hidden', border: `1px solid ${D.border}` }}>
      <div style={{ height: '100%', width: `${Math.min(value, 100)}%`, background: `linear-gradient(90deg,${color},${color}99)`, borderRadius: 8, transition: 'width .4s ease', boxShadow: `0 0 10px ${color}60` }} />
    </div>
  )
}

// ─────────────────────────────────────────────────────
// SCREEN — DISCLAIMER
// ─────────────────────────────────────────────────────
function Disclaimer({ onAccept }) {
  return (
    <Page>
      {/* Header */}
      <div style={{ textAlign: 'center', padding: '32px 0 28px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <div style={{ width: 80, height: 80, borderRadius: 24, background: 'linear-gradient(135deg,#00D4FF18,#7B61FF18)', border: '2px solid #00D4FF40', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'glow 3s ease infinite' }}>
            <Logo size={52} />
          </div>
        </div>
        <h1 style={{ fontSize: 30, fontWeight: 900, background: 'linear-gradient(135deg,#00D4FF,#7B61FF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', marginBottom: 6, letterSpacing: -1 }}>Broadify</h1>
        <p style={{ fontSize: 13, color: D.textSub }}>Broadcast messages — free, private, instant</p>
      </div>

      {/* Privacy */}
      <Card border={D.cyan} glow={D.cyan} style={{ background: D.cyanL, marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: D.cyan, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>🔒</span> Your Privacy Promise
        </div>
        {[
          'Your data never leaves your device — ever',
          'No accounts, no login, no cloud storage of any kind',
          'When you close the app everything is instantly deleted',
          'Uninstall the app and there is nothing left anywhere',
          'The developer cannot see, access, or use your data',
          'Contacts and messages exist only in your device memory while the app is open',
        ].map((t, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 8, alignItems: 'flex-start' }}>
            <span style={{ color: D.cyan, fontSize: 12, flexShrink: 0, marginTop: 2 }}>✓</span>
            <span style={{ fontSize: 12, color: D.text, lineHeight: 1.6 }}>{t}</span>
          </div>
        ))}
      </Card>

      {/* Legal */}
      <Card border={D.red} style={{ background: D.redL, marginBottom: 24 }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: D.red, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>⚠️</span> Legal Disclaimer
        </div>
        {[
          'You are fully responsible for every message you send',
          'Only send to people who have given you permission',
          'Sending spam may be illegal in your country',
          'WhatsApp or your carrier may restrict accounts that send unsolicited messages',
          'Broadify and its developers are not liable for any consequences from your use of this app',
        ].map((t, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 8, alignItems: 'flex-start' }}>
            <div style={{ width: 18, height: 18, borderRadius: 9, background: `${D.red}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 900, color: D.red, flexShrink: 0, marginTop: 2 }}>{i + 1}</div>
            <span style={{ fontSize: 12, color: D.text, lineHeight: 1.6 }}>{t}</span>
          </div>
        ))}
      </Card>

      <Btn full onClick={onAccept}>I Understand — Open Broadify</Btn>
      <p style={{ textAlign: 'center', fontSize: 11, color: D.textMut, marginTop: 12 }}>
        By continuing you accept full responsibility for your use of this app.
      </p>
    </Page>
  )
}

// ─────────────────────────────────────────────────────
// SCREEN — HOME
// ─────────────────────────────────────────────────────
function Home({ onSelect }) {
  return (
    <Page>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32, paddingTop: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Logo size={32} />
          <span style={{ fontSize: 18, fontWeight: 900, background: 'linear-gradient(135deg,#00D4FF,#7B61FF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Broadify</span>
        </div>
        <Pill text="Free Forever" color={D.cyan} />
      </div>

      {/* Hero */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 28, fontWeight: 900, color: D.text, lineHeight: 1.2, marginBottom: 10, letterSpacing: -.5 }}>
          Broadcast to<br />
          <span style={{ background: 'linear-gradient(135deg,#00D4FF,#7B61FF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>everyone instantly</span>
        </h2>
        <p style={{ fontSize: 14, color: D.textSub, lineHeight: 1.7 }}>
          Send one message to hundreds of people via WhatsApp, SMS, or Email. No account needed. Nothing saved.
        </p>
      </div>

      {/* Mode cards */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: D.textSub, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>Choose Your Mode</div>

        {/* Normal */}
        <div onClick={() => onSelect('normal')}
          style={{ background: D.card, border: `1.5px solid ${D.border}`, borderRadius: 20, padding: 20, marginBottom: 12, cursor: 'pointer', transition: 'border-color .2s, box-shadow .2s', position: 'relative', overflow: 'hidden' }}>
          {/* glow top left */}
          <div style={{ position: 'absolute', top: -40, left: -40, width: 120, height: 120, borderRadius: 60, background: `${D.cyan}08`, pointerEvents: 'none' }} />

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 14 }}>
            <div style={{ width: 52, height: 52, borderRadius: 16, background: D.cyanL, border: `1.5px solid ${D.cyan}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0 }}>📱</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 17, fontWeight: 800, color: D.text, marginBottom: 2 }}>Normal User</div>
              <div style={{ fontSize: 12, color: D.textSub }}>Personal WhatsApp · SMS · Email</div>
            </div>
            <div style={{ width: 30, height: 30, borderRadius: 10, background: D.cyanL, display: 'flex', alignItems: 'center', justifyContent: 'center', color: D.cyan, fontSize: 16, flexShrink: 0 }}>›</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
            {[
              { icon: '💬', label: 'WhatsApp', detail: 'Per contact' },
              { icon: '📱', label: 'SMS',      detail: 'One click all' },
              { icon: '📧', label: 'Email',    detail: 'One click all' },
              { icon: '✓',  label: 'No API key needed', detail: '' },
            ].map(f => (
              <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <span style={{ fontSize: 14 }}>{f.icon}</span>
                <div>
                  <div style={{ fontSize: 12, color: D.text, fontWeight: 600 }}>{f.label}</div>
                  {f.detail && <div style={{ fontSize: 10, color: D.textMut }}>{f.detail}</div>}
                </div>
              </div>
            ))}
          </div>

          <div style={{ background: D.yellowL, border: `1px solid ${D.yellow}25`, borderRadius: 10, padding: '8px 12px', fontSize: 11, color: D.yellow, fontWeight: 600 }}>
            ⚠️ WhatsApp: {WA_LIMIT} contacts/day limit (WhatsApp's own rule)
          </div>
        </div>

        {/* Business */}
        <div onClick={() => onSelect('business')}
          style={{ background: D.card, border: `1.5px solid ${D.border}`, borderRadius: 20, padding: 20, cursor: 'pointer', transition: 'border-color .2s, box-shadow .2s', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -40, right: -40, width: 120, height: 120, borderRadius: 60, background: `${D.violet}08`, pointerEvents: 'none' }} />

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 14 }}>
            <div style={{ width: 52, height: 52, borderRadius: 16, background: D.violetL, border: `1.5px solid ${D.violet}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0 }}>🏢</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 17, fontWeight: 800, color: D.text, marginBottom: 2 }}>Business User</div>
              <div style={{ fontSize: 12, color: D.textSub }}>Meta WhatsApp Business API</div>
            </div>
            <div style={{ width: 30, height: 30, borderRadius: 10, background: D.violetL, display: 'flex', alignItems: 'center', justifyContent: 'center', color: D.violet, fontSize: 16, flexShrink: 0 }}>›</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
            {[
              { icon: '⚡', label: 'Auto send all', detail: 'One click' },
              { icon: '∞', label: 'Higher limits', detail: 'Meta tier based' },
              { icon: '🔑', label: 'API key needed', detail: 'Meta approved' },
              { icon: '✓', label: 'Background send', detail: 'No tapping' },
            ].map(f => (
              <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <span style={{ fontSize: 14 }}>{f.icon}</span>
                <div>
                  <div style={{ fontSize: 12, color: D.text, fontWeight: 600 }}>{f.label}</div>
                  {f.detail && <div style={{ fontSize: 10, color: D.textMut }}>{f.detail}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ textAlign: 'center', fontSize: 11, color: D.textMut }}>
        🔒 All data deleted when you close this app. Nothing saved anywhere.
      </div>
    </Page>
  )
}

// ─────────────────────────────────────────────────────
// SCREEN — MESSAGE COMPOSER
// ─────────────────────────────────────────────────────
const EMOJIS = ['😊','👋','🙏','❤️','🔥','✅','⭐','🎉','💯','👍','😂','🤩','💪','🚀','🛒','📢','🏷️','💰','📞','🎁','📱','💬','✨','🌟','😍','👏','🤝','💼','🎯','💡','⚡','🌈','🍀','🎊','🥳','😎','🙌','🫶','💝','📣','🏅','🆓','🎀','🎪','🔔','📌','✈️','🎬','🍕','☕','🎁','🌺','🏆','💎']

function Composer({ mode, onNext, onBack }) {
  const [msg,    setMsg]    = useState('')
  const [bName,  setBName]  = useState('')
  const [err,    setErr]    = useState('')
  const [tab,    setTab]    = useState('var') // var | fmt | emoji | preview
  const taRef = useRef()

  const insert = text => {
    const ta = taRef.current
    if (!ta) { setMsg(m => m + text); return }
    const s    = ta.selectionStart ?? msg.length
    const e    = ta.selectionEnd   ?? msg.length
    const next = msg.slice(0, s) + text + msg.slice(e)
    setMsg(next)
    setErr('')
    setTimeout(() => { ta.focus(); ta.selectionStart = ta.selectionEnd = s + text.length }, 0)
  }

  const wrap = (before, after, sample = 'text') => {
    const ta = taRef.current
    if (!ta) { insert(before + sample + after); return }
    const s   = ta.selectionStart
    const e   = ta.selectionEnd
    const sel = msg.slice(s, e) || sample
    setMsg(msg.slice(0, s) + before + sel + after + msg.slice(e))
    setErr('')
    setTimeout(() => {
      ta.focus()
      ta.selectionStart = s + before.length
      ta.selectionEnd   = s + before.length + sel.length
    }, 0)
  }

  const TABS = [
    { id: 'var',     label: '{ } Variables' },
    { id: 'fmt',     label: '✏️ Format'      },
    { id: 'emoji',   label: '😊 Emoji'       },
    { id: 'preview', label: '👁 Preview'     },
  ]

  const FMTS = [
    { l: 'B',        fn: () => wrap('*', '*', 'bold'),          s: { fontWeight: 800 } },
    { l: 'I',        fn: () => wrap('_', '_', 'italic'),        s: { fontStyle: 'italic' } },
    { l: 'S̶',       fn: () => wrap('~', '~', 'strikethrough'), s: { textDecoration: 'line-through' } },
    { l: '</>',      fn: () => wrap('`', '`', 'code'),          s: { fontFamily: 'monospace' } },
    { l: '• Bullet', fn: () => insert('\n• '),                   s: {} },
    { l: '↵ Break',  fn: () => insert('\n'),                     s: {} },
    { l: '──────',   fn: () => insert('\n──────────\n'),         s: {} },
    { l: '👉 Arrow', fn: () => insert('👉 '),                   s: {} },
    { l: '✅ Tick',  fn: () => insert('✅ '),                   s: {} },
    { l: '⭐ Star',  fn: () => insert('⭐ '),                   s: {} },
  ]

  const preview = { name: 'Rahul Sharma', phone: '919876543210', email: 'rahul@example.com' }

  return (
    <Page>
      <BackBar onBack={onBack} title="Write Message"
        sub={mode === 'normal' ? '📱 Normal mode' : '🏢 Business API mode'} />

      {/* Broadcast name */}
      <div style={{ marginBottom: 16 }}>
        <Field label="Broadcast Name (optional)" placeholder="e.g. Diwali Sale, Event Update..." value={bName} onChange={setBName} />
      </div>

      {/* Tool panel */}
      <Card style={{ marginBottom: 16, padding: 0, overflow: 'hidden' }}>
        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: `1px solid ${D.border}` }}>
          {TABS.map(t => (
            <div key={t.id} onClick={() => setTab(t.id)}
              style={{ flex: 1, textAlign: 'center', padding: '12px 4px', fontSize: 11, fontWeight: tab === t.id ? 800 : 500, color: tab === t.id ? D.cyan : D.textSub, cursor: 'pointer', borderBottom: `2.5px solid ${tab === t.id ? D.cyan : 'transparent'}`, transition: 'all .15s', whiteSpace: 'nowrap' }}>
              {t.label}
            </div>
          ))}
        </div>

        <div style={{ padding: 16 }}>
          {/* Variables */}
          {tab === 'var' && (
            <div>
              <div style={{ fontSize: 12, color: D.textSub, marginBottom: 12, lineHeight: 1.6 }}>
                Tap to insert — automatically replaced with each contact's real info when sending:
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
                {[
                  { v: '{name}',      d: 'Full name',   ex: 'Rahul Sharma' },
                  { v: '{firstname}', d: 'First name',  ex: 'Rahul' },
                  { v: '{phone}',     d: 'Phone/Email', ex: '+91...' },
                ].map(x => (
                  <div key={x.v} onClick={() => insert(x.v)}
                    style={{ background: D.cyanL, border: `1.5px solid ${D.cyan}30`, borderRadius: 12, padding: '10px 14px', cursor: 'pointer', minWidth: 100 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: D.cyan, marginBottom: 3 }}>{x.v}</div>
                    <div style={{ fontSize: 10, color: D.textMut }}>{x.d}</div>
                    <div style={{ fontSize: 10, color: D.textSub, marginTop: 2 }}>→ {x.ex}</div>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 11, color: D.textMut, background: D.surface, borderRadius: 10, padding: '8px 12px', lineHeight: 1.6 }}>
                Example: "Hi {'{name}'}, special offer for you!" becomes "Hi Rahul Sharma, special offer for you!"
              </div>
            </div>
          )}

          {/* Format */}
          {tab === 'fmt' && (
            <div>
              <div style={{ fontSize: 12, color: D.textSub, marginBottom: 12 }}>
                Select text in the box first then tap format. Or tap to insert at cursor:
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {FMTS.map(f => (
                  <div key={f.l} onClick={f.fn}
                    style={{ background: D.surface, border: `1.5px solid ${D.border}`, borderRadius: 10, padding: '8px 13px', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: D.text, whiteSpace: 'nowrap', ...f.s }}>
                    {f.l}
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 11, color: D.textMut, marginTop: 12, lineHeight: 1.6 }}>
                WhatsApp formatting: *bold* _italic_ ~strikethrough~ `monospace`
              </div>
            </div>
          )}

          {/* Emoji */}
          {tab === 'emoji' && (
            <div>
              <div style={{ fontSize: 12, color: D.textSub, marginBottom: 12 }}>Tap any emoji to insert at cursor:</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {EMOJIS.map(e => (
                  <span key={e} onClick={() => { insert(e); setTab('var') }}
                    style={{ fontSize: 26, cursor: 'pointer', borderRadius: 8, padding: '2px 4px' }}>
                    {e}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Preview */}
          {tab === 'preview' && (
            <div>
              <div style={{ fontSize: 12, color: D.textSub, marginBottom: 12 }}>
                How message looks for "Rahul Sharma":
              </div>
              {msg.trim()
                ? <div style={{ background: D.surface, border: `1px solid ${D.border}`, borderRadius: 12, borderTopLeftRadius: 2, padding: '12px 14px', fontSize: 13, color: D.text, lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>
                    {personalize(msg, preview)}
                  </div>
                : <div style={{ textAlign: 'center', color: D.textMut, padding: '24px 0', fontSize: 13 }}>
                    Write your message first to see preview
                  </div>}
            </div>
          )}
        </div>
      </Card>

      {/* Message box */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: D.textSub, letterSpacing: 1, textTransform: 'uppercase' }}>Your Message</div>
          <div style={{ fontSize: 11, color: msg.length > 850 ? D.red : D.textMut }}>{msg.length} / 1000</div>
        </div>
        <textarea
          ref={taRef}
          value={msg}
          onChange={e => { setMsg(e.target.value); setErr('') }}
          maxLength={1000}
          rows={9}
          placeholder={'Hi {name}! 👋\n\nWe have something special for you.\n\n✅ Best quality\n✅ Best price\n\nReply to know more! 🙏\n\nThanks & regards'}
          style={{ width: '100%', background: D.surface, border: `1.5px solid ${err ? D.red : D.border}`, borderRadius: 14, padding: '14px 16px', color: D.text, fontSize: 14, lineHeight: 1.75, boxSizing: 'border-box', transition: 'border-color .15s' }}
        />
        {err && <div style={{ fontSize: 11, color: D.red, marginTop: 5 }}>{err}</div>}
      </div>

      <Btn full onClick={() => {
        if (!msg.trim()) { setErr('Please write a message before continuing'); return }
        onNext({ msg: msg.trim(), bName: bName.trim() })
      }}>
        Next — Add Contacts →
      </Btn>
    </Page>
  )
}

// ─────────────────────────────────────────────────────
// SCREEN — METHOD PICKER (normal mode only)
// ─────────────────────────────────────────────────────
function MethodPicker({ onPick, onBack }) {
  const methods = [
    {
      id: 'whatsapp', icon: '💬', color: D.green, grad: `linear-gradient(135deg,${D.green}20,${D.green}08)`,
      title: 'WhatsApp', sub: 'Opens per contact — you tap Send arrow each time',
      tags: [`${WA_LIMIT}/day limit`, 'Needs phone number'],
    },
    {
      id: 'sms', icon: '📱', color: D.cyan, grad: `linear-gradient(135deg,${D.cyan}20,${D.cyan}08)`,
      title: 'SMS — Text Message', sub: 'One click — all contacts added, tap Send once',
      tags: ['One click to all', 'Needs phone number'],
    },
    {
      id: 'email', icon: '📧', color: D.violet, grad: `linear-gradient(135deg,${D.violet}20,${D.violet}08)`,
      title: 'Email', sub: 'One click — email app opens with all recipients ready',
      tags: ['One click to all', 'Needs email address'],
    },
  ]

  return (
    <Page>
      <BackBar onBack={onBack} title="Send Method" sub="Choose how to send your message" />

      <Banner type="cyan" text="WhatsApp opens one contact at a time. SMS and Email are true one-click sends to everyone at once." />
      <div style={{ height: 16 }} />

      {methods.map(m => (
        <div key={m.id} onClick={() => onPick(m.id)}
          style={{ background: D.card, border: `1.5px solid ${D.border}`, borderRadius: 20, padding: 18, marginBottom: 12, cursor: 'pointer', transition: 'border-color .2s', overflow: 'hidden', position: 'relative' }}>
          <div style={{ position: 'absolute', inset: 0, background: m.grad, opacity: .5 }} />
          <div style={{ position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
              <div style={{ width: 50, height: 50, borderRadius: 16, background: `${m.color}20`, border: `1.5px solid ${m.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>{m.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: D.text }}>{m.title}</div>
                <div style={{ fontSize: 12, color: D.textSub, marginTop: 3 }}>{m.sub}</div>
              </div>
              <span style={{ fontSize: 20, color: m.color }}>›</span>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {m.tags.map(t => (
                <Pill key={t} text={t} color={m.color} />
              ))}
            </div>
          </div>
        </div>
      ))}
    </Page>
  )
}

// ─────────────────────────────────────────────────────
// SCREEN — CONTACT MANAGER
// ─────────────────────────────────────────────────────
function Contacts({ method, onSend, onBack }) {
  const [list,      setList]      = useState([])
  const [sel,       setSel]       = useState([])
  const [q,         setQ]         = useState('')
  const [drawer,    setDrawer]    = useState(false)
  const [newName,   setNewName]   = useState('')
  const [newVal,    setNewVal]    = useState('')
  const [nerr,      setNerr]      = useState({})
  const [importing, setImporting] = useState(false)
  const [snack,     setSnack]     = useState(null)
  const csvRef = useRef()

  const isEmail = method === 'email'
  const limit   = (method === 'whatsapp') ? WA_LIMIT : Infinity
  const selC    = useMemo(() => list.filter(c => sel.includes(c.id)), [list, sel])
  const shown   = useMemo(() => list.filter(c => (c.name + (c.phone || '') + (c.email || '')).toLowerCase().includes(q.toLowerCase())), [list, q])
  const over    = isFinite(limit) && sel.length > limit

  const toast = (m, col) => { setSnack({ m, col }); setTimeout(() => setSnack(null), 2800) }

  // Request phone contacts — proper permission handling
  async function fromPhone() {
    if (isEmail) {
      toast('Phone contacts do not have email addresses. Add emails manually or import CSV.', D.yellow)
      return
    }
    setImporting(true)
    try {
      // Check if Contact Picker API is available
      if (!('contacts' in navigator) || !('ContactsManager' in window)) {
        toast('Contact picker not supported on this browser. Please use CSV import or add manually.', D.yellow)
        setImporting(false)
        return
      }

      // Check available properties
      const supported = await navigator.contacts.getProperties()
      if (!supported.includes('tel')) {
        toast('Phone number access not supported on this device.', D.yellow)
        setImporting(false)
        return
      }

      const raw   = await navigator.contacts.select(['name', 'tel'], { multiple: true })
      const exist = new Set(list.map(c => c.phone))
      const fresh = raw
        .flatMap(r =>
          (r.tel || [])
            .filter(t => t && t.trim())
            .map(t => ({
              id:    uid(),
              name:  (r.name?.[0] || 'Unknown').trim(),
              phone: cleanPhone(t.trim()),
            }))
        )
        .filter(c => c.phone.length >= 10 && !exist.has(c.phone))

      if (fresh.length === 0) {
        toast('No new contacts found or all already added.', D.yellow)
      } else {
        setList(p => [...p, ...fresh])
        setSel(p  => [...p, ...fresh.map(c => c.id)])
        toast(`${fresh.length} contacts imported ✓`, D.cyan)
      }
    } catch (e) {
      if (e.name === 'SecurityError' || e.message?.includes('permission')) {
        toast('Permission denied. Please allow contact access when asked.', D.red)
      } else if (e.name === 'AbortError') {
        // User cancelled — do nothing
      } else {
        toast('Could not import contacts. Try CSV import instead.', D.red)
      }
    }
    setImporting(false)
  }

  // CSV import — works on all devices
  function fromCSV(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      try {
        const text  = ev.target.result
        const lines = text.split('\n').filter(l => l.trim())

        // Skip header row if first cell looks like a header word
        const firstCell = lines[0]?.split(',')?.[0]?.replace(/"/g, '').trim().toLowerCase()
        const start = ['name','names','contact','full name','fullname'].includes(firstCell) ? 1 : 0

        const exist = new Set(list.map(c => c.phone || c.email))
        const fresh = lines.slice(start)
          .map(line => {
            const cols  = line.split(',').map(x => x.replace(/"/g, '').trim())
            const name  = cols[0] || 'Unknown'
            const value = cols[1] || ''
            return isEmail
              ? { id: uid(), name, email: value }
              : { id: uid(), name, phone: cleanPhone(value) }
          })
          .filter(c => {
            if (isEmail) return c.email.includes('@') && !exist.has(c.email)
            return c.phone.length >= 10 && !exist.has(c.phone)
          })

        if (fresh.length === 0) {
          toast('No new valid contacts found. Check CSV format: Name, ' + (isEmail ? 'Email' : 'Phone'), D.yellow)
        } else {
          setList(p => [...p, ...fresh])
          setSel(p  => [...p, ...fresh.map(c => c.id)])
          toast(`${fresh.length} contacts imported ✓`, D.cyan)
        }
      } catch {
        toast('Could not read file. Make sure it is a valid CSV file.', D.red)
      }
    }
    reader.onerror = () => toast('Failed to read file. Please try again.', D.red)
    reader.readAsText(file)
    e.target.value = ''
  }

  // Add single contact
  function addOne() {
    const e = {}
    if (!newName.trim()) { e.name = 'Name is required' }
    if (isEmail) {
      if (!newVal.trim())           e.val = 'Email address is required'
      else if (!newVal.includes('@')) e.val = 'Enter a valid email (must contain @)'
      else if (list.find(c => c.email === newVal.trim())) e.val = 'This email is already in your list'
    } else {
      const digits = newVal.replace(/\D/g, '')
      if (!newVal.trim())       e.val = 'Phone number is required'
      else if (digits.length < 10) e.val = 'Enter a valid phone number (at least 10 digits)'
      else if (list.find(c => c.phone === cleanPhone(newVal))) e.val = 'This number is already in your list'
    }
    if (Object.keys(e).length) { setNerr(e); return }

    const nc = isEmail
      ? { id: uid(), name: newName.trim(), email: newVal.trim() }
      : { id: uid(), name: newName.trim(), phone: cleanPhone(newVal) }

    setList(p => [...p, nc])
    setSel(p  => [...p, nc.id])
    setNewName(''); setNewVal(''); setNerr({})
    setDrawer(false)
    toast('Contact added ✓', D.cyan)
  }

  const mIcon = { whatsapp: '💬', sms: '📱', email: '📧', whatsapp_biz: '⚡' }[method] || '💬'
  const mName = { whatsapp: 'WhatsApp', sms: 'SMS', email: 'Email', whatsapp_biz: 'API' }[method] || 'WhatsApp'

  return (
    <Page>
      {snack && <Toast msg={snack.m} color={snack.col} />}

      <BackBar onBack={onBack} title="Add Contacts"
        sub={`${mIcon} ${mName} · ${list.length} total · ${sel.length} selected`} />

      {/* Import options */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
        {[
          {
            icon: importing ? '⏳' : '📲',
            label: 'From Phone',
            sub: isEmail ? 'Not available' : 'Android only',
            fn: fromPhone,
            off: isEmail,
          },
          {
            icon: '📋',
            label: 'Import CSV',
            sub: isEmail ? 'Name, Email' : 'Name, Phone',
            fn: () => csvRef.current?.click(),
          },
          {
            icon: '➕',
            label: 'Add Manually',
            sub: isEmail ? 'Enter email' : 'Enter number',
            fn: () => { setNewName(''); setNewVal(''); setNerr({}); setDrawer(true) },
          },
        ].map(b => (
          <div key={b.label} onClick={b.off ? undefined : b.fn}
            style={{ background: D.card, border: `1.5px solid ${D.border}`, borderRadius: 14, padding: '13px 8px', cursor: b.off ? 'not-allowed' : 'pointer', textAlign: 'center', opacity: b.off ? .35 : 1, transition: 'border-color .15s' }}>
            <div style={{ fontSize: 24, marginBottom: 6 }}>{b.icon}</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: D.text }}>{b.label}</div>
            <div style={{ fontSize: 10, color: D.textMut, marginTop: 3 }}>{b.sub}</div>
          </div>
        ))}
      </div>
      <input ref={csvRef} type="file" accept=".csv,.txt" style={{ display: 'none' }} onChange={fromCSV} />

      {/* CSV format hint */}
      <div style={{ fontSize: 11, color: D.textMut, background: D.surface, borderRadius: 10, padding: '8px 12px', marginBottom: 14, lineHeight: 1.6 }}>
        {isEmail
          ? '📋 CSV format — Column 1: Name   Column 2: Email address'
          : '📋 CSV format — Column 1: Name   Column 2: Phone number. Save your Excel file as CSV first.'}
      </div>

      {/* Limit warning */}
      {isFinite(limit) && (
        <div style={{ marginBottom: 14 }}>
          <Banner type={over ? 'red' : 'yellow'}
            text={over
              ? `You selected ${sel.length} but ${mName} allows ${limit} per day. Deselect ${sel.length - limit} contacts to continue.`
              : `${mName} daily limit: ${limit} contacts (WhatsApp's own rule). Selected: ${sel.length}.`} />
        </div>
      )}

      {/* Search + select all */}
      {list.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <Field placeholder="Search by name or number..." value={q} onChange={setQ} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
            <span style={{ fontSize: 12, color: D.textSub }}>{sel.length} of {list.length} selected</span>
            <span onClick={() => setSel(sel.length === list.length ? [] : list.map(c => c.id))}
              style={{ fontSize: 12, fontWeight: 700, color: D.cyan, cursor: 'pointer' }}>
              {sel.length === list.length ? 'Deselect All' : 'Select All'}
            </span>
          </div>
        </div>
      )}

      {/* Contact list */}
      {list.length === 0
        ? <Card style={{ textAlign: 'center', padding: '48px 20px', marginBottom: 16 }}>
            <div style={{ fontSize: 44, marginBottom: 12 }}>👥</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: D.text, marginBottom: 6 }}>No contacts yet</div>
            <div style={{ fontSize: 12, color: D.textSub, lineHeight: 1.7 }}>
              {isEmail
                ? 'Add email addresses manually or import a CSV file.'
                : 'Import from your phone, upload a CSV file, or add numbers manually above.'}
            </div>
          </Card>
        : <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
            {shown.map(c => {
              const on   = sel.includes(c.id)
              const nope = isFinite(limit) && !on && sel.length >= limit
              return (
                <div key={c.id}
                  onClick={() => {
                    if (nope) { toast(`${mName} limit is ${limit}/day`, D.yellow); return }
                    setSel(p => on ? p.filter(x => x !== c.id) : [...p, c.id])
                  }}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, background: D.card, border: `1.5px solid ${on ? D.cyan : D.border}`, borderRadius: 14, padding: '12px 14px', cursor: nope ? 'not-allowed' : 'pointer', opacity: nope ? .4 : 1, boxShadow: on ? `0 0 0 3px ${D.cyan}15` : 'none', transition: 'all .15s' }}>
                  {/* Checkbox */}
                  <div style={{ width: 22, height: 22, borderRadius: 7, border: `2px solid ${on ? D.cyan : D.border}`, background: on ? D.cyan : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all .15s' }}>
                    {on && <span style={{ color: D.bg, fontSize: 12, fontWeight: 900, lineHeight: 1 }}>✓</span>}
                  </div>
                  <Av name={c.name} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: D.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
                    <div style={{ fontSize: 11, color: D.textSub, marginTop: 1 }}>{isEmail ? c.email : `+${c.phone}`}</div>
                  </div>
                  <div onClick={e => {
                    e.stopPropagation()
                    setList(p => p.filter(x => x.id !== c.id))
                    setSel(p  => p.filter(x => x !== c.id))
                  }} style={{ width: 28, height: 28, borderRadius: 8, background: D.redL, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: D.red, cursor: 'pointer', flexShrink: 0 }}>✕</div>
                </div>
              )
            })}
          </div>}

      {/* Send button */}
      {sel.length > 0 && !over && (
        <Btn full onClick={() => onSend(selC)}>
          {mIcon} {isEmail
            ? `Send Email to All ${sel.length}`
            : method === 'sms'
              ? `Send SMS to All ${sel.length}`
              : `Start Sending to ${sel.length} →`}
        </Btn>
      )}
      {over && (
        <div style={{ textAlign: 'center', fontSize: 13, color: D.red, fontWeight: 700 }}>
          Deselect {sel.length - limit} contacts to continue
        </div>
      )}

      {/* Add drawer */}
      {drawer && (
        <Drawer title={isEmail ? 'Add Email Address' : 'Add Phone Number'} onClose={() => setDrawer(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Field label="Full Name" placeholder="Rahul Sharma" value={newName} onChange={setNewName} error={nerr.name} autoFocus />
            <Field
              label={isEmail ? 'Email Address' : 'Phone Number'}
              placeholder={isEmail ? 'rahul@gmail.com' : '9876543210'}
              value={newVal} onChange={v => { setNewVal(v); setNerr({}) }}
              error={nerr.val}
              type={isEmail ? 'email' : 'tel'}
              hint={isEmail
                ? 'Must be a valid email address with @'
                : '10-digit Indian number — country code 91 added automatically'}
            />
            <Btn full onClick={addOne}>Add Contact ✓</Btn>
            <Btn full variant="ghost" onClick={() => setDrawer(false)}>Cancel</Btn>
          </div>
        </Drawer>
      )}
    </Page>
  )
}

// ─────────────────────────────────────────────────────
// SCREEN — WHATSAPP SEND (per contact)
// ─────────────────────────────────────────────────────
function WASend({ contacts, msg, bName, onDone, onBack }) {
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
    <Page>
      {idx < 0
        ? <BackBar onBack={onBack} title="Send via WhatsApp" sub={`${contacts.length} contacts ready`} />
        : <div style={{ fontSize: 20, fontWeight: 800, color: D.text, marginBottom: 24 }}>💬 Sending via WhatsApp</div>}

      {idx >= 0 && (
        <Card style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 13, color: D.textSub }}>Progress</span>
            <span style={{ fontSize: 14, fontWeight: 800, color: D.cyan }}>{idx} / {contacts.length}</span>
          </div>
          <ProgressBar value={pct} color={D.cyan} />
          {idx > 0 && <div style={{ fontSize: 11, color: D.textMut, marginTop: 8 }}>Sent to {contacts[idx - 1]?.name} — come back and tap next</div>}
        </Card>
      )}

      <div style={{ marginBottom: 16 }}>
        <Banner text={`WhatsApp limit: ${WA_LIMIT}/day for personal accounts. Sending to ${contacts.length}. Broadify is not responsible for any WhatsApp account restrictions.`} />
      </div>

      {/* Current contact */}
      <Card border={D.green} glow={D.green} style={{ marginBottom: 16 }}>
        {curr && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
            <Av name={curr.name} size={52} />
            <div>
              <div style={{ fontSize: 17, fontWeight: 800, color: D.text }}>{curr.name}</div>
              <div style={{ fontSize: 12, color: D.textSub, marginTop: 2 }}>+{curr.phone} · Contact {idx + 1} of {contacts.length}</div>
            </div>
          </div>
        )}
        <div style={{ background: D.surface, border: `1px solid ${D.border}`, borderRadius: 12, borderTopLeftRadius: 2, padding: '12px 14px', fontSize: 13, color: D.text, lineHeight: 1.75, whiteSpace: 'pre-wrap', marginBottom: 14 }}>
          {personalize(msg, curr || contacts[0])}
        </div>
        <Btn full variant="green" onClick={open}>
          {idx < 0 ? `💬 Open WhatsApp — Start (1/${contacts.length})` : `💬 Open WhatsApp — Next (${idx + 1}/${contacts.length})`}
        </Btn>
      </Card>

      {idx < 0 && (
        <Card>
          <div style={{ fontSize: 13, fontWeight: 700, color: D.text, marginBottom: 12 }}>How it works</div>
          {[
            'Tap the button — WhatsApp opens with your message ready',
            'Tap the green Send arrow inside WhatsApp',
            'Come back here — the next contact loads automatically',
            'Repeat until all contacts are done',
          ].map((t, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 10, alignItems: 'flex-start' }}>
              <div style={{ width: 22, height: 22, borderRadius: 11, background: D.cyanL, border: `1px solid ${D.cyan}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, color: D.cyan, flexShrink: 0 }}>{i + 1}</div>
              <span style={{ fontSize: 12, color: D.textSub, lineHeight: 1.6 }}>{t}</span>
            </div>
          ))}
        </Card>
      )}
    </Page>
  )
}

// ─────────────────────────────────────────────────────
// SCREEN — SMS SEND (one click to all)
// ─────────────────────────────────────────────────────
function SMSSend({ contacts, msg, bName, onDone, onBack }) {
  const [sent, setSent] = useState(false)

  function sendAll() {
    // Comma-separated numbers — SMS app opens with all recipients
    const numbers = contacts.map(c => c.phone).join(',')
    const body    = encodeURIComponent(msg)
    window.open(`sms:${numbers}?body=${body}`, '_self')
    setSent(true)
  }

  if (sent) return <Done sent={contacts.length} method="SMS" onDone={onDone} />

  return (
    <Page>
      <BackBar onBack={onBack} title="Send via SMS" sub={`${contacts.length} contacts ready`} />

      <Banner type="green" text="One click — your SMS app opens with all contacts added. Tap Send once to message everyone." />
      <div style={{ height: 10 }} />
      <Banner type="blue" text="Normal SMS rates from your carrier apply for each message sent. Broadify is not responsible for any charges on your bill." icon="ℹ️" />
      <div style={{ height: 16 }} />

      {/* Summary */}
      <Card border={D.cyan} glow={D.cyan} style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: D.cyan, marginBottom: 12 }}>📋 SMS Summary</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 12 }}>
          <span style={{ color: D.textSub }}>Recipients</span>
          <span style={{ fontWeight: 800, color: D.text }}>{contacts.length} contacts</span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
          {contacts.slice(0, 10).map(c => (
            <div key={c.id} style={{ background: D.surface, border: `1px solid ${D.border}`, borderRadius: 8, padding: '4px 10px', fontSize: 11, color: D.text }}>
              {c.name}
            </div>
          ))}
          {contacts.length > 10 && (
            <div style={{ background: D.surface, border: `1px solid ${D.border}`, borderRadius: 8, padding: '4px 10px', fontSize: 11, color: D.textMut }}>
              +{contacts.length - 10} more
            </div>
          )}
        </div>
      </Card>

      {/* Message preview */}
      <Card style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: D.textSub, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Message</div>
        <div style={{ fontSize: 13, color: D.text, lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>{msg}</div>
      </Card>

      <Btn full onClick={sendAll} icon="📱">Open SMS App — Send to All {contacts.length}</Btn>
      <div style={{ textAlign: 'center', fontSize: 11, color: D.textMut, marginTop: 10 }}>
        Your SMS app opens with all contacts added. Tap Send once inside it.
      </div>
    </Page>
  )
}

// ─────────────────────────────────────────────────────
// SCREEN — EMAIL SEND (one click to all)
// ─────────────────────────────────────────────────────
function EmailSend({ contacts, msg, bName, onDone, onBack }) {
  const [sent, setSent] = useState(false)

  function sendAll() {
    const to      = contacts.map(c => encodeURIComponent(c.email)).join(',')
    const subject = encodeURIComponent(bName || 'Message from Broadify')
    const body    = encodeURIComponent(
      contacts.length === 1 ? personalize(msg, contacts[0]) : msg
    )
    window.open(`mailto:${to}?subject=${subject}&body=${body}`, '_self')
    setSent(true)
  }

  if (sent) return <Done sent={contacts.length} method="Email" onDone={onDone} />

  return (
    <Page>
      <BackBar onBack={onBack} title="Send via Email" sub={`${contacts.length} recipients ready`} />

      <Banner type="green" text="One click — your email app opens with all recipients and message ready. Tap Send once for everyone." />
      <div style={{ height: 10 }} />
      {contacts.length > 1 && (
        <Banner type="blue" text="When sending to multiple people, {name} shows the same for all. For personalised emails send to one contact at a time." icon="ℹ️" />
      )}
      <div style={{ height: 16 }} />

      {/* Summary */}
      <Card border={D.violet} glow={D.violet} style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: D.violet, marginBottom: 12 }}>📋 Email Summary</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 8 }}>
          <span style={{ color: D.textSub }}>Subject</span>
          <span style={{ fontWeight: 700, color: D.text }}>{bName || '(No subject)'}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 14 }}>
          <span style={{ color: D.textSub }}>Recipients</span>
          <span style={{ fontWeight: 800, color: D.text }}>{contacts.length}</span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
          {contacts.slice(0, 8).map(c => (
            <div key={c.id} style={{ background: D.surface, border: `1px solid ${D.border}`, borderRadius: 8, padding: '4px 10px', fontSize: 11, color: D.text }}>
              {c.name}
            </div>
          ))}
          {contacts.length > 8 && (
            <div style={{ background: D.surface, border: `1px solid ${D.border}`, borderRadius: 8, padding: '4px 10px', fontSize: 11, color: D.textMut }}>
              +{contacts.length - 8} more
            </div>
          )}
        </div>
      </Card>

      <Card style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: D.textSub, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Message Preview</div>
        <div style={{ fontSize: 13, color: D.text, lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>
          {personalize(msg, contacts[0])}
        </div>
      </Card>

      <Btn full variant="violet" onClick={sendAll} icon="📧">
        Open Email App — Send to All {contacts.length}
      </Btn>
      <div style={{ textAlign: 'center', fontSize: 11, color: D.textMut, marginTop: 10 }}>
        Your email app opens. Tap Send inside it to send to everyone.
      </div>
    </Page>
  )
}

// ─────────────────────────────────────────────────────
// SCREEN — BUSINESS API SEND
// ─────────────────────────────────────────────────────
const BACKEND = import.meta.env.VITE_API_URL || ''

function BusinessSend({ contacts, msg, bName, onDone, onBack }) {
  const [pid,   setPid]   = useState('')
  const [tok,   setTok]   = useState('')
  const [showT, setShowT] = useState(false)
  const [stage, setStage] = useState('form') // form | sending | done
  const [res,   setRes]   = useState(null)
  const [err,   setErr]   = useState('')
  const [busy,  setBusy]  = useState(false)

  async function send() {
    if (!pid.trim()) { setErr('Phone Number ID is required'); return }
    if (!tok.trim()) { setErr('Access Token is required'); return }
    setErr(''); setBusy(true); setStage('sending')
    try {
      const resp = await fetch(`${BACKEND}/api/broadcast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contacts,
          message:       msg,
          broadcastName: bName,
          phoneId:       pid.trim(),
          token:         tok.trim(),
        }),
      })
      const d = await resp.json().catch(() => { throw new Error('Server did not respond correctly') })
      if (!resp.ok) throw new Error(d.error || 'Sending failed — check your API credentials')
      setRes(d); setStage('done')
    } catch (e) {
      setErr(e.message || 'Something went wrong. Please check your credentials and try again.')
      setStage('form')
    }
    setBusy(false)
  }

  if (stage === 'sending') return (
    <div style={{ minHeight: '100vh', background: D.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center' }}>
      <div style={{ width: 70, height: 70, border: `4px solid ${D.violet}30`, borderTopColor: D.violet, borderRadius: 35, animation: 'spin .75s linear infinite', marginBottom: 24 }} />
      <div style={{ fontSize: 22, fontWeight: 800, color: D.text, marginBottom: 10 }}>Sending Messages...</div>
      <div style={{ fontSize: 13, color: D.textSub, lineHeight: 1.7 }}>
        Sending to {contacts.length} contacts via API.<br />Please keep this screen open.
      </div>
    </div>
  )

  if (stage === 'done') return (
    <Done sent={res?.sent || contacts.length} failed={res?.failed} method="Business API" onDone={onDone} />
  )

  return (
    <Page>
      <BackBar onBack={onBack} title="Business API" sub={`${contacts.length} contacts ready`} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 18 }}>
        <Banner type="cyan" text="Your API credentials are used only right now to send. They are never saved or stored anywhere on any server." />
        <Banner type="red" text="Broadify is not responsible for Meta API charges, account suspensions, or message failures. Stay within Meta's approved limits." />
      </div>

      {/* Summary */}
      <Card border={D.violet} style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: D.violet, marginBottom: 10 }}>📋 Broadcast Summary</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 7 }}>
          <span style={{ color: D.textSub }}>Name</span>
          <span style={{ fontWeight: 700, color: D.text }}>{bName || 'Unnamed'}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
          <span style={{ color: D.textSub }}>Recipients</span>
          <span style={{ fontWeight: 700, color: D.text }}>{contacts.length} contacts</span>
        </div>
      </Card>

      {/* Credentials */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 18 }}>
        <Field
          label="Phone Number ID"
          placeholder="123456789012345"
          value={pid}
          onChange={setPid}
          hint="Find in Meta Developer Dashboard → WhatsApp → API Setup"
        />
        <Field
          label="Access Token"
          placeholder="EAAxxxxxxxxxxxxxxxxxxxxxxxx"
          value={tok}
          onChange={setTok}
          type={showT ? 'text' : 'password'}
          hint="Temporary or permanent token from Meta Developer Dashboard"
          right={
            <span onClick={() => setShowT(t => !t)} style={{ fontSize: 18, cursor: 'pointer', color: D.textSub }}>
              {showT ? '🙈' : '👁️'}
            </span>
          }
        />
      </div>

      {/* How to get key */}
      <Card style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: D.text, marginBottom: 12 }}>🔑 How to get API credentials</div>
        {[
          'Go to developers.facebook.com',
          'Create new App — select Business type',
          'Add WhatsApp product to your app',
          'Verify your business (GST or Udyam certificate)',
          'Add a phone number not already on WhatsApp',
          'Copy Phone Number ID and Access Token from API Setup page',
        ].map((t, i) => (
          <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 9, alignItems: 'flex-start' }}>
            <div style={{ width: 22, height: 22, borderRadius: 11, background: D.violetL, border: `1px solid ${D.violet}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, color: D.violet, flexShrink: 0 }}>{i + 1}</div>
            <span style={{ fontSize: 12, color: D.textSub, lineHeight: 1.6 }}>{t}</span>
          </div>
        ))}
      </Card>

      {err && (
        <div style={{ marginBottom: 16 }}>
          <Banner type="red" text={err} />
        </div>
      )}

      <Btn full loading={busy} onClick={send} icon="⚡">
        Send to All {contacts.length} via API
      </Btn>
    </Page>
  )
}

// ─────────────────────────────────────────────────────
// SCREEN — DONE
// ─────────────────────────────────────────────────────
function Done({ sent, failed, method, onDone }) {
  return (
    <div style={{ minHeight: '100vh', background: D.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center' }}>
      {/* Success ring */}
      <div style={{ width: 100, height: 100, borderRadius: 50, background: `linear-gradient(135deg,${D.cyan}20,${D.violet}20)`, border: `2px solid ${D.cyan}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 50, marginBottom: 24, boxShadow: `0 0 60px ${D.cyan}25` }}>
        ✓
      </div>

      <h2 style={{ fontSize: 26, fontWeight: 900, color: D.text, marginBottom: 8, letterSpacing: -.5 }}>All Done! 🎉</h2>

      <div style={{ fontSize: 14, color: D.textSub, marginBottom: 8, lineHeight: 1.8 }}>
        Sent via <strong style={{ color: D.text }}>{method}</strong><br />
        <span style={{ fontSize: 28, fontWeight: 900, background: 'linear-gradient(135deg,#00D4FF,#7B61FF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{sent}</span>
        <span style={{ color: D.textSub }}> messages sent</span>
        {failed > 0 && <><br /><span style={{ color: D.red }}>{failed} failed</span></>}
      </div>

      <div style={{ fontSize: 11, color: D.textMut, marginBottom: 32 }}>
        All contact data has been cleared from memory.
      </div>

      <Btn onClick={onDone}>Send Another Broadcast</Btn>
    </div>
  )
}

// ─────────────────────────────────────────────────────
// ROOT — no storage, fresh every session
// ─────────────────────────────────────────────────────
export default function App() {
  const [sc,    setSc]    = useState('disclaimer')
  const [mode,  setMode]  = useState(null)
  const [meth,  setMeth]  = useState(null)
  const [msg,   setMsg]   = useState('')
  const [bName, setBName] = useState('')
  const [cts,   setCts]   = useState([])

  const reset = () => {
    setSc('home'); setMode(null); setMeth(null)
    setMsg(''); setBName(''); setCts([])
  }

  return (
    <>
      {sc === 'disclaimer' && (
        <Disclaimer onAccept={() => setSc('home')} />
      )}

      {sc === 'home' && (
        <Home onSelect={m => { setMode(m); setSc('compose') }} />
      )}

      {sc === 'compose' && (
        <Composer
          mode={mode}
          onBack={reset}
          onNext={({ msg: m, bName: b }) => {
            setMsg(m); setBName(b)
            setSc(mode === 'normal' ? 'method' : 'contacts')
          }}
        />
      )}

      {sc === 'method' && (
        <MethodPicker
          onBack={() => setSc('compose')}
          onPick={m => { setMeth(m); setSc('contacts') }}
        />
      )}

      {sc === 'contacts' && (
        <Contacts
          method={mode === 'business' ? 'whatsapp_biz' : meth}
          onBack={() => setSc(mode === 'normal' ? 'method' : 'compose')}
          onSend={c => { setCts(c); setSc('send') }}
        />
      )}

      {sc === 'send' && mode === 'normal' && meth === 'whatsapp' && (
        <WASend contacts={cts} msg={msg} bName={bName} onDone={reset} onBack={() => setSc('contacts')} />
      )}
      {sc === 'send' && mode === 'normal' && meth === 'sms' && (
        <SMSSend contacts={cts} msg={msg} bName={bName} onDone={reset} onBack={() => setSc('contacts')} />
      )}
      {sc === 'send' && mode === 'normal' && meth === 'email' && (
        <EmailSend contacts={cts} msg={msg} bName={bName} onDone={reset} onBack={() => setSc('contacts')} />
      )}
      {sc === 'send' && mode === 'business' && (
        <BusinessSend contacts={cts} msg={msg} bName={bName} onDone={reset} onBack={() => setSc('contacts')} />
      )}
    </>
  )
}
