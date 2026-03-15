import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'

// ── Supabase ──────────────────────────────────────────────────────
const sb = createClient(
  import.meta.env.VITE_SUPABASE_URL  || 'https://YOUR.supabase.co',
  import.meta.env.VITE_SUPABASE_ANON || 'your_anon_key'
)

// ── Backend API ───────────────────────────────────────────────────
const API = import.meta.env.VITE_API_URL || ''

async function callAPI(path, method = 'GET', body, token) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  const d = await res.json()
  if (!res.ok) throw new Error(d.error || 'Server error')
  return d
}

// ── Plans — Netflix style: pay to access, no message limits ──────
const PLANS = [
  {
    id: 'free',
    name: 'Free',
    subtitle: 'Try the platform',
    emoji: '🌿',
    gradient: 'linear-gradient(145deg,#0f172a 0%,#1e293b 100%)',
    accent: '#64748b',
    accentLight: '#94a3b8',
    price: 0,
    highlight: false,
    badge: null,
    tagline: 'No credit card needed',
    features: [
      { text: 'Manual WhatsApp broadcast (wa.me)', ok: true  },
      { text: 'Up to 50 contacts',                ok: true  },
      { text: 'Basic contact manager',            ok: true  },
      { text: 'Auto API sending',                 ok: false },
      { text: 'Broadcast history',                ok: false },
      { text: 'CSV import',                       ok: false },
      { text: 'Cloud contact sync',               ok: false },
    ],
  },
  {
    id: 'starter',
    name: 'Starter',
    subtitle: 'For small businesses',
    emoji: '⚡',
    gradient: 'linear-gradient(145deg,#0c2340 0%,#1b4f8a 100%)',
    accent: '#38bdf8',
    accentLight: '#7dd3fc',
    price: 149,
    highlight: false,
    badge: null,
    tagline: 'Everything you need to start',
    features: [
      { text: 'Auto WhatsApp API sending',        ok: true },
      { text: 'Unlimited contacts',               ok: true },
      { text: 'Broadcast history & stats',        ok: true },
      { text: 'Message personalisation {name}',   ok: true },
      { text: 'Cloud contact sync',               ok: true },
      { text: 'CSV bulk import',                  ok: false },
      { text: 'Priority sending speed',           ok: false },
    ],
  },
  {
    id: 'business',
    name: 'Business',
    subtitle: 'For growing businesses',
    emoji: '🚀',
    gradient: 'linear-gradient(145deg,#2d1b69 0%,#5b21b6 50%,#7c3aed 100%)',
    accent: '#a78bfa',
    accentLight: '#c4b5fd',
    price: 299,
    highlight: true,
    badge: 'Most Popular',
    tagline: '⚡ Most businesses choose this plan',
    features: [
      { text: 'Everything in Starter',            ok: true },
      { text: 'CSV bulk contact import',          ok: true },
      { text: 'Priority sending speed',           ok: true },
      { text: 'Delivery & failure reports',       ok: true },
      { text: 'Advanced message variables',       ok: true },
      { text: 'Broadcast analytics dashboard',    ok: true },
      { text: 'Priority support',                 ok: false },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    subtitle: 'For high-volume senders',
    emoji: '💎',
    gradient: 'linear-gradient(145deg,#1a0505 0%,#7f1d1d 50%,#b91c1c 100%)',
    accent: '#f87171',
    accentLight: '#fca5a5',
    price: 499,
    highlight: false,
    badge: null,
    tagline: 'Maximum power, zero limits',
    features: [
      { text: 'Everything in Business',           ok: true },
      { text: 'Faster broadcast processing',      ok: true },
      { text: 'Priority support',                 ok: true },
      { text: 'First access to new features',     ok: true },
      { text: 'Dedicated onboarding help',        ok: true },
      { text: 'Broadcast history — unlimited',    ok: true },
      { text: 'Multiple API key management',      ok: true },
    ],
  },
]

// Fixed monthly price
function planPrice(plan) { return plan.price }

const getPlan    = id => PLANS.find(p => p.id === id) || PLANS[0]
const isExpired  = p  => p?.plan_expires && new Date(p.plan_expires) < new Date()
const isPaidPlan = p  => p?.plan && p.plan !== 'free' && !isExpired(p)

// ── Helpers ───────────────────────────────────────────────────────
const hydrate = (msg, c) =>
  msg.replace(/{name}/gi, c.name || '').replace(/{firstname}/gi, (c.name||'').split(' ')[0]).replace(/{phone}/gi, '+'+c.phone)

const cleanPhone = p => {
  const d = String(p).replace(/\D/g, '')
  if (d.length === 10) return '91' + d
  if (d.length === 11 && d[0] === '0') return '91' + d.slice(1)
  return d
}

const todayStr = () => new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

// ── Theme ─────────────────────────────────────────────────────────
const G    = '#25d366'
const BG   = '#030712'
const CARD = '#0d1117'
const BDR  = '#1c2432'

// ═══════════════════════════════════════════════════════════════════
// ATOMS
// ═══════════════════════════════════════════════════════════════════
function Av({ name = '?', size = 40 }) {
  const init = name.trim().split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const pal  = [G,'#22c55e','#818cf8','#f59e0b','#e879f9','#38bdf8','#fb7185']
  const col  = pal[(name.charCodeAt(0) || 0) % pal.length]
  return (
    <div style={{ width: size, height: size, borderRadius: size/2, background: col+'22', border: `1.5px solid ${col}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size*.32, fontWeight: 800, color: col, flexShrink: 0 }}>
      {init}
    </div>
  )
}

function Spin({ size = 18, color = '#fff' }) {
  return <span style={{ display: 'inline-block', width: size, height: size, border: `2px solid ${color}30`, borderTopColor: color, borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
}

function Btn({ children, onClick, v = 'primary', icon, small, full, loading, disabled, style: sx }) {
  const styles = {
    primary: { bg: `linear-gradient(135deg,${G},#16a34a)`, color: '#fff', border: 'none', shadow: `0 4px 20px ${G}40` },
    ghost:   { bg: 'transparent', color: '#6b7280', border: `1px solid ${BDR}`, shadow: 'none' },
    danger:  { bg: '#ff444415', color: '#ff6b6b', border: '1px solid #ff444430', shadow: 'none' },
    soft:    { bg: G+'18', color: G, border: `1px solid ${G}35`, shadow: 'none' },
    white:   { bg: '#fff', color: '#0f172a', border: 'none', shadow: '0 4px 20px rgba(0,0,0,.3)' },
  }[v] || {}

  return (
    <button
      onClick={disabled || loading ? undefined : onClick}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
        padding: small ? '8px 14px' : '13px 20px', borderRadius: 12,
        fontSize: small ? 12 : 14, fontWeight: 700,
        width: full ? '100%' : 'auto',
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: disabled ? .4 : 1, transition: 'all .15s',
        background: styles.bg, color: styles.color, border: styles.border, boxShadow: styles.shadow,
        ...sx,
      }}>
      {loading ? <Spin size={14} /> : icon && <span>{icon}</span>}
      {children}
    </button>
  )
}

function Field({ label, value, onChange, placeholder, type = 'text', error, hint, multiline, rows = 4, maxLen, right, readOnly, autoFocus }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {label && <div style={{ fontSize: 11, fontWeight: 700, color: '#4b5563', letterSpacing: .8, textTransform: 'uppercase' }}>{label}</div>}
      <div style={{ position: 'relative' }}>
        {multiline
          ? <textarea value={value} onChange={e => onChange?.(e.target.value)} placeholder={placeholder} rows={rows} maxLength={maxLen} readOnly={readOnly} autoFocus={autoFocus}
              style={{ width: '100%', background: CARD, border: `1.5px solid ${error ? '#ff4444' : BDR}`, borderRadius: 12, padding: '12px 14px', color: '#e2e8f0', fontSize: 13, fontFamily: 'inherit', outline: 'none', resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.7 }} />
          : <input type={type} value={value} onChange={e => onChange?.(e.target.value)} placeholder={placeholder} maxLength={maxLen} readOnly={readOnly} autoFocus={autoFocus}
              style={{ width: '100%', background: CARD, border: `1.5px solid ${error ? '#ff4444' : BDR}`, borderRadius: 12, padding: right ? '12px 42px 12px 14px' : '12px 14px', color: '#e2e8f0', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', opacity: readOnly ? .7 : 1 }} />}
        {right && <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', cursor: 'pointer' }}>{right}</div>}
      </div>
      {error && <div style={{ fontSize: 11, color: '#ff6b6b' }}>{error}</div>}
      {hint && !error && <div style={{ fontSize: 11, color: '#374151', lineHeight: 1.6 }}>{hint}</div>}
    </div>
  )
}

function Card({ children, style, onClick, glow, noPad }) {
  return (
    <div onClick={onClick} style={{ background: CARD, border: `1.5px solid ${glow || BDR}`, borderRadius: 16, padding: noPad ? 0 : 16, cursor: onClick ? 'pointer' : 'default', transition: 'all .2s', boxShadow: glow ? `0 0 28px ${glow}18` : 'none', overflow: 'hidden', ...style }}>
      {children}
    </div>
  )
}

function Sheet({ title, children, onClose }) {
  return (
    <div onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.8)', zIndex: 200, display: 'flex', alignItems: 'flex-end', backdropFilter: 'blur(6px)' }}>
      <div style={{ background: '#0a0f1e', borderRadius: '20px 20px 0 0', width: '100%', maxHeight: '92vh', overflowY: 'auto', animation: 'sheet .25s ease', border: `1px solid ${BDR}`, borderBottom: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: `1px solid ${BDR}`, position: 'sticky', top: 0, background: '#0a0f1e', zIndex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#f1f5f9' }}>{title}</div>
          <div onClick={onClose} style={{ width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#6b7280', fontSize: 18, borderRadius: 8 }}>✕</div>
        </div>
        <div style={{ padding: 20 }}>{children}</div>
      </div>
    </div>
  )
}

function Toast({ msg, type, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 3000); return () => clearTimeout(t) }, [])
  const col = type === 'err' ? '#ff6b6b' : type === 'warn' ? '#fbbf24' : G
  return (
    <div style={{ position: 'fixed', bottom: 90, left: '50%', transform: 'translateX(-50%)', background: CARD, border: `1px solid ${col}40`, borderRadius: 14, padding: '11px 18px', display: 'flex', alignItems: 'center', gap: 9, zIndex: 500, animation: 'up .2s ease', whiteSpace: 'nowrap', maxWidth: '88vw', boxShadow: '0 8px 32px rgba(0,0,0,.7)' }}>
      <div style={{ width: 7, height: 7, borderRadius: 4, background: col, boxShadow: `0 0 8px ${col}` }} />
      <span style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9', overflow: 'hidden', textOverflow: 'ellipsis' }}>{msg}</span>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// AUTH SCREEN
// ═══════════════════════════════════════════════════════════════════
function AuthScreen({ onLogin }) {
  const [mode, setMode]   = useState('login')
  const [busy, setBusy]   = useState(false)
  const [err,  setErr]    = useState('')
  const [showP, setShowP] = useState(false)
  const [f, setF]         = useState({ name: '', phone: '', email: '', pw: '', pw2: '' })
  const set = k => v => setF(p => ({ ...p, [k]: v }))

  async function submit() {
    setErr('')
    if (mode === 'signup') {
      if (!f.name.trim())           return setErr('Enter your full name')
      if (!f.email.includes('@'))   return setErr('Enter a valid email')
      if (f.pw.length < 6)          return setErr('Password must be 6+ characters')
      if (f.pw !== f.pw2)           return setErr('Passwords do not match')
    } else {
      if (!f.email.trim() || !f.pw.trim()) return setErr('Fill in all fields')
    }
    setBusy(true)
    try {
      if (mode === 'signup') {
        const { data, error } = await sb.auth.signUp({ email: f.email, password: f.pw, options: { data: { full_name: f.name } } })
        if (error) throw error
        if (data.user) {
          await sb.from('profiles').upsert({ id: data.user.id, email: f.email, full_name: f.name, phone: f.phone })
          const { data: profile } = await sb.from('profiles').select('*').eq('id', data.user.id).single()
          onLogin(data.user, profile || { full_name: f.name, email: f.email, plan: 'free' }, [])
        }
      } else {
        const { data, error } = await sb.auth.signInWithPassword({ email: f.email, password: f.pw })
        if (error) throw error
        const [{ data: profile }, { data: contactRow }] = await Promise.all([
          sb.from('profiles').select('*').eq('id', data.user.id).single(),
          sb.from('profiles').select('contacts').eq('id', data.user.id).single(),
        ])
        const parsed = (() => { try { return JSON.parse(contactRow?.contacts || '[]') } catch { return [] } })()
        onLogin(data.user, profile || {}, parsed)
      }
    } catch (e) {
      setErr(e.message?.includes('already') ? 'Account already exists — sign in instead' : e.message || 'Something went wrong')
    }
    setBusy(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: `radial-gradient(ellipse at top,#0a1628 0%,${BG} 60%)`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ width: 72, height: 72, background: `linear-gradient(135deg,${G},#16a34a)`, borderRadius: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: `0 8px 40px ${G}60`, fontSize: 36 }}>💬</div>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: '#f1f5f9', margin: '0 0 6px', letterSpacing: -.5 }}>WaBroadcast</h1>
        <p style={{ fontSize: 13, color: '#4b5563', margin: 0 }}>Reach 1000+ people on WhatsApp — instantly</p>
      </div>

      <div style={{ width: '100%', maxWidth: 370, background: CARD, border: `1px solid ${BDR}`, borderRadius: 22, padding: 24, boxShadow: '0 24px 80px rgba(0,0,0,.6)' }}>
        <div style={{ display: 'flex', background: BG, borderRadius: 12, padding: 4, marginBottom: 22 }}>
          {['login', 'signup'].map(m => (
            <div key={m} onClick={() => { setMode(m); setErr('') }}
              style={{ flex: 1, textAlign: 'center', padding: '9px', borderRadius: 9, cursor: 'pointer', fontSize: 13, fontWeight: 700, transition: 'all .2s', background: mode === m ? G : 'transparent', color: mode === m ? '#fff' : '#6b7280' }}>
              {m === 'login' ? 'Sign In' : 'Sign Up'}
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {mode === 'signup' && (
            <>
              <Field label="Full Name" placeholder="Arjun Sharma" value={f.name} onChange={set('name')} />
              <Field label="Phone (optional)" placeholder="9876543210" value={f.phone} onChange={set('phone')} type="tel" hint="Helps recover your account" />
            </>
          )}
          <Field label="Email" placeholder="you@gmail.com" value={f.email} onChange={set('email')} type="email" />
          <Field label="Password" placeholder="Min 6 characters" value={f.pw} onChange={set('pw')} type={showP ? 'text' : 'password'}
            right={<span onClick={() => setShowP(p => !p)} style={{ fontSize: 17, userSelect: 'none' }}>{showP ? '🙈' : '👁️'}</span>} />
          {mode === 'signup' && <Field label="Confirm Password" placeholder="Same as above" value={f.pw2} onChange={set('pw2')} type="password" />}

          {err && <div style={{ background: '#ff444412', border: '1px solid #ff444430', borderRadius: 10, padding: '10px 13px', fontSize: 12, color: '#ff6b6b' }}>{err}</div>}
          <Btn full loading={busy} onClick={submit}>{mode === 'login' ? 'Sign In →' : 'Create Account →'}</Btn>
        </div>

        <div style={{ marginTop: 16, background: BG, borderRadius: 12, padding: '11px 14px', fontSize: 11.5, color: '#374151', lineHeight: 1.7 }}>
          ☁️ <strong style={{ color: G }}>Data saved to cloud.</strong> Delete the app, sign back in — contacts, subscription, everything restored.
        </div>
      </div>

      <p style={{ marginTop: 16, fontSize: 11, color: '#1f2937', textAlign: 'center' }}>By signing up you agree to our Terms &amp; Privacy Policy</p>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// ROOT APP
// ═══════════════════════════════════════════════════════════════════
export default function App() {
  const [screen,   setScreen]   = useState('loading')
  const [user,     setUser]     = useState(null)
  const [profile,  setProfile]  = useState(null)
  const [contacts, setContacts] = useState([])
  const [history,  setHistory]  = useState([])
  const [tab,      setTab]      = useState('home')
  const [toast,    setToast]    = useState(null)

  const notify = useCallback((msg, type = 'ok') => setToast({ msg, type, id: Date.now() }), [])

  useEffect(() => {
    sb.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const [{ data: p }, { data: bc }] = await Promise.all([
          sb.from('profiles').select('*').eq('id', session.user.id).single(),
          sb.from('broadcasts').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false }).limit(50),
        ])
        const parsed = (() => { try { return JSON.parse(p?.contacts || '[]') } catch { return [] } })()
        setUser(session.user); setProfile(p || {}); setContacts(parsed); setHistory(bc || [])
        setScreen('app')
      } else setScreen('auth')
    }).catch(() => setScreen('auth'))
  }, [])

  function onLogin(u, p, c) { setUser(u); setProfile(p); setContacts(c || []); setScreen('app') }

  async function saveContacts(next) {
    setContacts(next)
    if (user?.id) sb.from('profiles').update({ contacts: JSON.stringify(next) }).eq('id', user.id).then(() => {})
  }

  async function saveProfile(updates) {
    const next = { ...profile, ...updates }
    setProfile(next)
    if (user?.id) await sb.from('profiles').update(updates).eq('id', user.id)
  }

  async function onPlanActivate(planData) {
    await saveProfile(planData)
    notify(`${getPlan(planData.plan)?.name} plan activated! 🎉`)
  }

  async function onBroadcastDone(entry, sent) {
    setHistory(h => [entry, ...h].slice(0, 50))
    if (user?.id) {
      await sb.from('broadcasts').insert({ user_id: user.id, ...entry })
      await sb.from('profiles').update({ msg_used: (profile?.msg_used || 0) + sent }).eq('id', user.id)
      setProfile(p => ({ ...p, msg_used: (p?.msg_used || 0) + sent }))
    }
  }

  async function logout() {
    await sb.auth.signOut()
    setUser(null); setProfile(null); setContacts([]); setHistory([]); setScreen('auth')
  }

  if (screen === 'loading') return (
    <div style={{ height: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 20 }}>
      <div style={{ width: 64, height: 64, background: `linear-gradient(135deg,${G},#16a34a)`, borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, boxShadow: `0 8px 32px ${G}50` }}>💬</div>
      <Spin size={24} color={G} />
    </div>
  )

  if (screen === 'auth') return <AuthScreen onLogin={onLogin} />

  const expired = isExpired(profile)
  const plan    = getPlan(profile?.plan)

  const shared = { user, profile, contacts, history, expired, plan, notify, saveContacts, saveProfile, onPlanActivate, onBroadcastDone, logout, goTab: setTab }

  const TABS = [
    { id: 'home',     label: 'Home',     icon: '🏠' },
    { id: 'send',     label: 'Send',     icon: '💬' },
    { id: 'contacts', label: 'Contacts', icon: '👥' },
    { id: 'plans',    label: 'Plans',    icon: '⭐' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ]

  return (
    <div style={{ width: '100%', height: '100vh', background: BG, display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: 430, height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Top bar */}
        <div style={{ flexShrink: 0, padding: '11px 16px', borderBottom: `1px solid ${BDR}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: BG }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{ width: 34, height: 34, background: `linear-gradient(135deg,${G},#16a34a)`, borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, boxShadow: `0 4px 14px ${G}50` }}>💬</div>
            <span style={{ fontSize: 17, fontWeight: 900, color: '#f1f5f9', letterSpacing: -.3 }}>WaBroadcast</span>
          </div>
          <div style={{ display: 'flex', gap: 7 }}>
            {expired && (
              <div onClick={() => setTab('plans')} style={{ background: '#ff444415', border: '1px solid #ff444430', borderRadius: 8, padding: '5px 11px', fontSize: 11, fontWeight: 700, color: '#ff6b6b', cursor: 'pointer' }}>Plan Expired ↗</div>
            )}
            {!profile?.wa_verified && (
              <div onClick={() => setTab('settings')} style={{ background: G+'15', border: `1px solid ${G}30`, borderRadius: 8, padding: '5px 11px', fontSize: 11, fontWeight: 700, color: G, cursor: 'pointer' }}>Connect WA ↗</div>
            )}
          </div>
        </div>

        {/* Screen */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {tab === 'home'     && <HomeTab     {...shared} />}
          {tab === 'send'     && <SendTab     {...shared} />}
          {tab === 'contacts' && <ContactsTab {...shared} />}
          {tab === 'plans'    && <PlansTab    {...shared} />}
          {tab === 'settings' && <SettingsTab {...shared} />}
        </div>

        {/* Bottom nav */}
        <div style={{ flexShrink: 0, borderTop: `1px solid ${BDR}`, display: 'flex', paddingBottom: 'env(safe-area-inset-bottom,0px)', background: BG }}>
          {TABS.map(t => {
            const a = tab === t.id
            return (
              <div key={t.id} onClick={() => setTab(t.id)} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '8px 4px 10px', cursor: 'pointer', background: a ? G+'12' : 'transparent', transition: 'background .2s' }}>
                <span style={{ fontSize: 19 }}>{t.icon}</span>
                <span style={{ fontSize: 9, fontWeight: a ? 800 : 500, color: a ? G : '#374151', letterSpacing: .5, textTransform: 'uppercase' }}>{t.label}</span>
                {a && <div style={{ width: 16, height: 2, background: G, borderRadius: 2, boxShadow: `0 0 6px ${G}` }} />}
              </div>
            )
          })}
        </div>
      </div>

      {toast && <Toast key={toast.id} msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// HOME TAB
// ═══════════════════════════════════════════════════════════════════
function HomeTab({ profile, contacts, history, expired, plan, goTab }) {
  const totalSent = profile?.msg_used || 0

  return (
    <div style={{ padding: '18px 16px 24px', display: 'flex', flexDirection: 'column', gap: 16, animation: 'pop .22s ease' }}>
      {/* Greeting */}
      <div>
        <h2 style={{ fontSize: 22, fontWeight: 900, color: '#f1f5f9', margin: '0 0 3px' }}>
          Hello, {(profile?.full_name || 'there').split(' ')[0]} 👋
        </h2>
        <p style={{ fontSize: 12, color: '#4b5563', margin: 0 }}>{profile?.business_name || 'Welcome to WaBroadcast'}</p>
      </div>

      {/* Connect WA prompt */}
      {!profile?.wa_verified && (
        <div onClick={() => goTab('settings')} style={{ background: G+'10', border: `1.5px solid ${G}30`, borderRadius: 14, padding: '14px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, background: G+'18', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>📱</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#f1f5f9', marginBottom: 3 }}>Connect WhatsApp API</div>
            <div style={{ fontSize: 12, color: '#4b5563', lineHeight: 1.5 }}>Paste your Meta API key to start sending messages automatically</div>
          </div>
          <span style={{ color: G, fontSize: 16 }}>→</span>
        </div>
      )}

      {/* Plan card */}
      <Card glow={plan?.accent || G} style={{ background: plan?.id !== 'free' ? plan?.gradient : `linear-gradient(135deg,${G}10,#16a34a06)`, padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 16px 14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>
                {expired ? '⚠️ Plan Expired' : `${plan?.emoji} ${plan?.name} Plan`}
              </div>
              {profile?.plan_expires && !expired && (
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>
                  Renews {new Date(profile.plan_expires).toLocaleDateString('en-IN')}
                </div>
              )}
            </div>
            <div onClick={() => goTab('plans')} style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', padding: '6px 14px', borderRadius: 9, fontSize: 12, fontWeight: 700, cursor: 'pointer', flexShrink: 0, backdropFilter: 'blur(4px)' }}>
              {isPaidPlan(profile) && !expired ? 'Manage' : 'Upgrade ↗'}
            </div>
          </div>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#fff' }}>{totalSent.toLocaleString()}</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>Total messages sent</div>
        </div>
      </Card>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {[
          { label: 'Contacts', value: contacts.length, col: '#38bdf8', icon: '👥' },
          { label: 'Broadcasts', value: history.length, col: '#818cf8', icon: '📤' },
        ].map(s => (
          <Card key={s.label}>
            <div style={{ fontSize: 24, marginBottom: 6 }}>{s.icon}</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: s.col, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: '#4b5563', marginTop: 5 }}>{s.label}</div>
          </Card>
        ))}
      </div>

      <Btn full onClick={() => goTab('send')} icon="💬" style={{ padding: '15px', fontSize: 15, boxShadow: `0 6px 28px ${G}55` }}>
        Start New Broadcast
      </Btn>

      {/* Recent history */}
      {history.length > 0 && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#1f2937', letterSpacing: .8, textTransform: 'uppercase', marginBottom: 10 }}>Recent Broadcasts</div>
          <Card noPad>
            {history.slice(0, 5).map((h, i, arr) => (
              <div key={h.id || i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: i < arr.length - 1 ? `1px solid ${BDR}` : 'none' }}>
                <div style={{ width: 36, height: 36, background: G+'18', border: `1px solid ${G}25`, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>📤</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#cbd5e1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.broadcast_name || 'Broadcast'}</div>
                  <div style={{ fontSize: 11, color: '#374151' }}>{h.contact_count || 0} contacts · {h.sent_count || 0} sent</div>
                </div>
                <div style={{ fontSize: 11, color: '#374151', flexShrink: 0 }}>{h.created_at ? new Date(h.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : ''}</div>
              </div>
            ))}
          </Card>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// SEND TAB
// ═══════════════════════════════════════════════════════════════════
function SendTab({ profile, contacts, onBroadcastDone, notify }) {
  const [step,   setStep]   = useState(0)
  const [msg,    setMsg]    = useState('')
  const [bName,  setBName]  = useState('')
  const [selIds, setSelIds] = useState([])
  const [search, setSearch] = useState('')
  const [busy,   setBusy]   = useState(false)
  const [waIdx,  setWaIdx]  = useState(0)
  const [result, setResult] = useState(null)
  const taRef = useRef()

  const selC     = contacts.filter(c => selIds.includes(c.id))
  const filtered = contacts.filter(c => (c.name + c.phone).toLowerCase().includes(search.toLowerCase()))
  const apiReady = !!profile?.wa_verified && !!API

  function insertText(t) {
    const ta = taRef.current
    if (ta) { const s = ta.selectionStart ?? msg.length; setMsg(m => m.slice(0, s) + t + m.slice(s)) }
    else setMsg(m => m + t)
  }

  function reset() { setStep(0); setMsg(''); setBName(''); setSelIds([]); setSearch(''); setWaIdx(0); setBusy(false); setResult(null) }

  async function autoSend() {
    setBusy(true); setStep(3)
    try {
      const { data: { session } } = await sb.auth.getSession()
      const data = await callAPI('/api/broadcast', 'POST', { contacts: selC, message: msg, broadcastName: bName }, session?.access_token)
      const entry = { broadcast_name: bName || `Broadcast ${todayStr()}`, contact_count: selC.length, sent_count: data.sent, failed_count: data.failed, created_at: new Date().toISOString() }
      await onBroadcastDone(entry, data.sent)
      setResult({ sent: data.sent, failed: data.failed, total: selC.length })
      setStep(5)
    } catch (e) {
      notify(e.message, 'err'); setStep(2)
    }
    setBusy(false)
  }

  function openWA() {
    if (waIdx >= selC.length) {
      const entry = { broadcast_name: bName || `Broadcast ${todayStr()}`, contact_count: selC.length, sent_count: waIdx, failed_count: 0, created_at: new Date().toISOString() }
      onBroadcastDone(entry, waIdx)
      setResult({ sent: waIdx, failed: 0, total: selC.length }); setStep(5); return
    }
    const c = selC[waIdx]
    window.open(`https://wa.me/${c.phone}?text=${encodeURIComponent(hydrate(msg, c) + '\n\n_Reply STOP to unsubscribe._')}`, '_blank', 'noopener')
    setWaIdx(i => i + 1)
  }

  // Step 0: Compose
  if (step === 0) return (
    <div style={{ padding: '16px 16px 24px', display: 'flex', flexDirection: 'column', gap: 16, animation: 'pop .22s ease' }}>
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 900, color: '#f1f5f9', margin: '0 0 3px' }}>New Broadcast</h2>
        <p style={{ fontSize: 12, color: '#4b5563', margin: 0 }}>Write once — send to everyone</p>
      </div>

      <div style={{ background: apiReady ? G+'12' : '#fbbf2412', border: `1px solid ${apiReady ? G+'30' : '#fbbf2430'}`, borderRadius: 10, padding: '9px 13px', fontSize: 12, color: apiReady ? G : '#fbbf24', fontWeight: 600 }}>
        {apiReady ? '⚡ Auto mode — messages send in background instantly' : '📱 Manual mode — WhatsApp opens per contact, you tap Send'}
      </div>

      <Field label="Broadcast Name (optional)" placeholder="e.g. Diwali Sale 2025" value={bName} onChange={setBName} />

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#4b5563', letterSpacing: .8, textTransform: 'uppercase' }}>Message</div>
          <div style={{ fontSize: 11, color: '#374151' }}>{msg.length}/1000</div>
        </div>
        <div style={{ display: 'flex', gap: 7, marginBottom: 9, flexWrap: 'wrap' }}>
          {['{name}', '{firstname}', '{phone}'].map(v => (
            <div key={v} onClick={() => insertText(v)} style={{ background: G+'15', border: `1px solid ${G}30`, borderRadius: 8, padding: '4px 10px', fontSize: 11, fontWeight: 700, color: G, cursor: 'pointer' }}>{v}</div>
          ))}
          <div onClick={() => insertText('😊')} style={{ background: '#fbbf2415', border: '1px solid #fbbf2430', borderRadius: 8, padding: '4px 10px', fontSize: 11, fontWeight: 700, color: '#fbbf24', cursor: 'pointer' }}>😊 Emoji</div>
        </div>
        <textarea ref={taRef} value={msg} onChange={e => setMsg(e.target.value)} maxLength={1000} rows={8}
          placeholder={'Hi {name}! 👋\n\nWe have a special offer this week.\n\nReply YES to know more!\n\nThanks 🙏'}
          style={{ width: '100%', background: CARD, border: `1.5px solid ${BDR}`, borderRadius: 12, padding: '12px 14px', color: '#e2e8f0', fontSize: 13, fontFamily: 'inherit', outline: 'none', resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.7 }} />
        <div style={{ fontSize: 11, color: '#374151', marginTop: 5 }}>💡 {'{name}'} is replaced with each person's name automatically.</div>
      </div>

      <Btn full onClick={() => { if (!msg.trim()) { notify('Please type a message', 'warn'); return } setStep(1) }} icon="👥">
        Select Contacts →
      </Btn>
    </div>
  )

  // Step 1: Select contacts
  if (step === 1) return (
    <div style={{ padding: '16px 16px 24px', display: 'flex', flexDirection: 'column', gap: 14, animation: 'pop .22s ease' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div onClick={() => setStep(0)} style={{ width: 36, height: 36, background: CARD, border: `1px solid ${BDR}`, borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>←</div>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: '#f1f5f9', margin: 0 }}>Select Contacts</h2>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ background: G+'18', border: `1px solid ${G}30`, borderRadius: 9, padding: '5px 12px', fontSize: 12, fontWeight: 700, color: G }}>{selIds.length} selected</div>
        <div onClick={() => setSelIds(selIds.length === contacts.length ? [] : contacts.map(c => c.id))} style={{ fontSize: 12, color: G, cursor: 'pointer', fontWeight: 700 }}>
          {selIds.length === contacts.length ? 'Deselect All' : 'Select All'}
        </div>
      </div>
      <Field placeholder="Search contacts…" value={search} onChange={setSearch} />
      {contacts.length === 0
        ? <div style={{ textAlign: 'center', padding: '48px 20px', color: '#374151', fontSize: 13 }}>No contacts yet. Add them in the Contacts tab.</div>
        : <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filtered.map(c => {
              const sel = selIds.includes(c.id)
              return (
                <div key={c.id} onClick={() => setSelIds(p => sel ? p.filter(x => x !== c.id) : [...p, c.id])}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, background: CARD, border: `1.5px solid ${sel ? G : BDR}`, borderRadius: 14, padding: '12px 14px', cursor: 'pointer', transition: 'all .18s', boxShadow: sel ? `0 0 14px ${G}18` : 'none' }}>
                  <div style={{ width: 22, height: 22, borderRadius: 7, border: `2px solid ${sel ? G : BDR}`, background: sel ? G : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all .18s' }}>
                    {sel && <span style={{ color: '#fff', fontSize: 11, fontWeight: 900 }}>✓</span>}
                  </div>
                  <Av name={c.name} size={40} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0' }}>{c.name}</div>
                    <div style={{ fontSize: 11, color: '#374151' }}>+{c.phone}</div>
                  </div>
                </div>
              )
            })}
          </div>}
      {selIds.length > 0 && <Btn full onClick={() => setStep(2)} icon="✅">Review — Send to {selIds.length} people</Btn>}
    </div>
  )

  // Step 2: Confirm
  if (step === 2) return (
    <div style={{ padding: '16px 16px 24px', display: 'flex', flexDirection: 'column', gap: 16, animation: 'pop .22s ease' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div onClick={() => setStep(1)} style={{ width: 36, height: 36, background: CARD, border: `1px solid ${BDR}`, borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>←</div>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: '#f1f5f9', margin: 0 }}>Ready to Send</h2>
      </div>
      <Card glow={G} style={{ background: `linear-gradient(135deg,${G}10,#16a34a06)` }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: '#f1f5f9', marginBottom: 6 }}>📤 {selIds.length} contacts selected</div>
        <div style={{ fontSize: 12, color: '#4b5563', lineHeight: 1.7 }}>
          {apiReady
            ? `⚡ All ${selIds.length} messages will be sent automatically in the background. Takes about ${Math.ceil(selIds.length / 50)} minute(s).`
            : '📱 WhatsApp will open for each contact. You tap ➤ Send, come back, next loads.'}
        </div>
      </Card>
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#1f2937', letterSpacing: .8, textTransform: 'uppercase', marginBottom: 9 }}>Message Preview</div>
        {selC.slice(0, 2).map(c => (
          <Card key={c.id} style={{ marginBottom: 9 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 9 }}>
              <Av name={c.name} size={26} />
              <span style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0' }}>{c.name}</span>
            </div>
            <div style={{ background: '#071a0c', border: `1px solid ${G}20`, borderRadius: 10, borderTopLeftRadius: 2, padding: '10px 12px', fontSize: 12, color: '#e2e8f0', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
              {hydrate(msg, c)}
              <div style={{ color: '#374151', marginTop: 5, fontSize: 11 }}>_Reply STOP to unsubscribe._</div>
            </div>
          </Card>
        ))}
        {selC.length > 2 && <div style={{ textAlign: 'center', fontSize: 12, color: '#374151' }}>+ {selC.length - 2} more</div>}
      </div>
      {apiReady
        ? <Btn full loading={busy} onClick={autoSend} style={{ padding: 15, fontSize: 15 }}>⚡ Send Automatically</Btn>
        : <Btn full onClick={() => { setWaIdx(0); setStep(4) }} style={{ padding: 15, fontSize: 15 }}>📱 Start Manual Send</Btn>}
    </div>
  )

  // Step 3: Auto sending spinner
  if (step === 3) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24, padding: '80px 24px', textAlign: 'center' }}>
      <div style={{ width: 80, height: 80, background: G+'18', border: `2px solid ${G}40`, borderRadius: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spin size={36} color={G} />
      </div>
      <div>
        <h2 style={{ fontSize: 22, fontWeight: 900, color: '#f1f5f9', margin: '0 0 10px' }}>Sending Messages…</h2>
        <p style={{ fontSize: 13, color: '#4b5563', lineHeight: 1.8, margin: 0 }}>
          Sending to {selC.length} contacts automatically.<br />
          Estimated time: ~{Math.ceil(selC.length / 50)} minute(s).<br />
          <span style={{ color: '#374151' }}>Please keep this screen open.</span>
        </p>
      </div>
    </div>
  )

  // Step 4: Manual WA cycle
  if (step === 4) {
    const done = waIdx >= selC.length
    const curr = selC[waIdx]
    const pct  = Math.round((waIdx / Math.max(selC.length, 1)) * 100)
    return (
      <div style={{ padding: '16px 16px 24px', display: 'flex', flexDirection: 'column', gap: 16, animation: 'pop .22s ease' }}>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: '#f1f5f9', margin: 0 }}>Sending…</h2>
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 13, color: '#6b7280' }}>Progress</span>
            <span style={{ fontSize: 14, fontWeight: 800, color: G }}>{waIdx} / {selC.length}</span>
          </div>
          <div style={{ background: BG, borderRadius: 8, height: 10, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg,${G},#22c55e)`, borderRadius: 8, transition: 'width .4s ease', boxShadow: `0 0 10px ${G}70` }} />
          </div>
          <div style={{ fontSize: 11, color: '#374151', marginTop: 7 }}>
            {waIdx === 0 ? 'Tap button to begin' : done ? '✓ All done!' : `Sent to ${selC[waIdx - 1]?.name} — tap ➤ in WhatsApp then come back`}
          </div>
        </Card>
        {!done && curr && (
          <Card glow={G} style={{ background: `linear-gradient(135deg,${G}10,#16a34a06)` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 13, marginBottom: 13 }}>
              <Av name={curr.name} size={52} />
              <div>
                <div style={{ fontSize: 17, fontWeight: 800, color: '#f1f5f9' }}>{curr.name}</div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>+{curr.phone}</div>
                <div style={{ fontSize: 11, color: '#374151', marginTop: 3 }}>Contact {waIdx + 1} of {selC.length}</div>
              </div>
            </div>
            <div style={{ background: '#071a0c', border: `1px solid ${G}25`, borderRadius: 10, borderTopLeftRadius: 2, padding: '10px 12px', fontSize: 12, color: '#e2e8f0', lineHeight: 1.7, marginBottom: 13, whiteSpace: 'pre-wrap' }}>
              {hydrate(msg, curr)}
              <div style={{ color: '#374151', marginTop: 5, fontSize: 11 }}>_Reply STOP to unsubscribe._</div>
            </div>
            <Btn full onClick={openWA} style={{ padding: 14, fontSize: 15 }}>💬 Open WhatsApp → Send ({waIdx + 1}/{selC.length})</Btn>
          </Card>
        )}
        {waIdx > 0 && (
          <Card noPad>
            {selC.slice(Math.max(0, waIdx - 3), waIdx).reverse().map((c, i, arr) => (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderBottom: i < arr.length - 1 ? `1px solid ${BDR}` : 'none' }}>
                <span style={{ color: G, fontSize: 15 }}>✓</span>
                <Av name={c.name} size={28} />
                <span style={{ fontSize: 13, fontWeight: 600, color: '#6b7280' }}>{c.name}</span>
              </div>
            ))}
          </Card>
        )}
        {done && (
          <Btn full onClick={() => {
            const entry = { broadcast_name: bName || `Broadcast ${todayStr()}`, contact_count: selC.length, sent_count: waIdx, failed_count: 0, created_at: new Date().toISOString() }
            onBroadcastDone(entry, waIdx); setResult({ sent: waIdx, failed: 0, total: selC.length }); setStep(5)
          }}>✅ Mark Complete</Btn>
        )}
      </div>
    )
  }

  // Step 5: Done
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 22, padding: '60px 24px', textAlign: 'center', animation: 'pop .25s ease' }}>
      <div style={{ width: 90, height: 90, background: G+'18', border: `2px solid ${G}`, borderRadius: 45, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 44, boxShadow: `0 0 40px ${G}40` }}>✓</div>
      <div>
        <h2 style={{ fontSize: 24, fontWeight: 900, color: '#f1f5f9', margin: '0 0 10px' }}>Broadcast Sent! 🎉</h2>
        {result && <div style={{ fontSize: 14, color: '#6b7280', lineHeight: 2 }}>
          <span style={{ color: G, fontWeight: 900, fontSize: 20 }}>{result.sent}</span> messages sent<br />
          {result.failed > 0 && <><span style={{ color: '#ff6b6b' }}>{result.failed} failed</span><br /></>}
          {result.total} contacts total
        </div>}
      </div>
      <Btn onClick={reset} icon="💬">New Broadcast</Btn>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// CONTACTS TAB
// ═══════════════════════════════════════════════════════════════════
function ContactsTab({ contacts, saveContacts, notify }) {
  const [search,  setSearch]  = useState('')
  const [modal,   setModal]   = useState(null)
  const [form,    setForm]    = useState({ name: '', phone: '' })
  const [ferr,    setFerr]    = useState({})
  const [loading, setLoading] = useState(false)
  const fileRef = useRef()
  const csvRef  = useRef()

  const filtered = contacts.filter(c => (c.name + c.phone).toLowerCase().includes(search.toLowerCase()))

  async function importPhone() {
    setLoading(true)
    try {
      if (!('contacts' in navigator)) { notify('Use Chrome on Android to import from phone', 'warn'); setLoading(false); return }
      const raw = await navigator.contacts.select(['name','tel'],{ multiple: true })
      const exist = new Set(contacts.map(c => c.phone))
      const fresh = raw.flatMap(r => (r.tel || []).map(t => ({ id: Date.now() + Math.random(), name: r.name?.[0] || 'Unknown', phone: cleanPhone(t) }))).filter(c => c.phone && !exist.has(c.phone))
      await saveContacts([...contacts, ...fresh])
      notify(`${fresh.length} contacts imported ✓`)
    } catch (e) { notify('Could not import contacts', 'err') }
    setLoading(false)
  }

  function importCSV(e) {
    const file = e.target.files[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = async ev => {
      try {
        const lines = ev.target.result.split('\n').slice(1).filter(Boolean)
        const exist = new Set(contacts.map(c => c.phone))
        const fresh = lines.map(l => { const [name, phone] = l.split(','); return { id: Date.now() + Math.random(), name: (name||'').replace(/"/g,'').trim(), phone: cleanPhone((phone||'').replace(/"/g,'').trim()) } }).filter(c => c.name && c.phone && !exist.has(c.phone))
        await saveContacts([...contacts, ...fresh])
        notify(`${fresh.length} contacts imported ✓`)
      } catch { notify('Invalid CSV file', 'err') }
    }
    reader.readAsText(file); e.target.value = ''
  }

  function importJSON(e) {
    const file = e.target.files[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = async ev => {
      try {
        const raw  = JSON.parse(ev.target.result)
        const arr  = Array.isArray(raw) ? raw : (raw.contacts || [])
        const exist = new Set(contacts.map(c => c.phone))
        const fresh = arr.filter(c => c.phone && !exist.has(c.phone))
        await saveContacts([...contacts, ...fresh])
        notify(`${fresh.length} contacts restored ✓`)
      } catch { notify('Invalid file', 'err') }
    }
    reader.readAsText(file); e.target.value = ''
  }

  function exportJSON() {
    const blob = new Blob([JSON.stringify(contacts, null, 2)], { type: 'application/json' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `contacts_${Date.now()}.json`; a.click()
    notify('Exported ✓')
  }

  function exportCSV() {
    const rows = ['Name,Phone', ...contacts.map(c => `"${c.name}",${c.phone}`)].join('\n')
    const blob = new Blob([rows], { type: 'text/csv' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `contacts_${Date.now()}.csv`; a.click()
    notify('Exported as CSV ✓')
  }

  function validate() {
    const e = {}
    if (!form.name.trim()) e.name = 'Name required'
    const p = form.phone.replace(/\D/g, '')
    if (p.length < 10 || p.length > 15) e.phone = 'Enter valid phone (10–15 digits)'
    return e
  }

  async function save() {
    const e = validate(); if (Object.keys(e).length) { setFerr(e); return }
    const phone = cleanPhone(form.phone)
    if (modal === 'new') {
      await saveContacts([...contacts, { id: Date.now(), name: form.name.trim(), phone }])
      notify('Contact added ✓')
    } else {
      await saveContacts(contacts.map(c => c.id === modal ? { ...c, name: form.name.trim(), phone } : c))
      notify('Updated ✓')
    }
    setModal(null); setFerr({})
  }

  const viewC = modal && modal !== 'new' ? contacts.find(c => c.id === modal) : null

  return (
    <div style={{ padding: '16px 16px 24px', display: 'flex', flexDirection: 'column', gap: 14, animation: 'pop .22s ease' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ fontSize: 20, fontWeight: 900, color: '#f1f5f9', margin: 0 }}>Contacts <span style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>({contacts.length})</span></h2>
        <Btn small onClick={() => { setForm({ name: '', phone: '' }); setFerr({}); setModal('new') }} icon="➕">Add</Btn>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
        {[
          { icon: '📱', label: 'Phone Contacts', sub: 'Chrome on Android', onClick: importPhone, loading },
          { icon: '📋', label: 'Import CSV',      sub: 'Name,Phone columns', onClick: () => csvRef.current?.click() },
          { icon: '📂', label: 'Restore JSON',    sub: 'Previous backup',   onClick: () => fileRef.current?.click() },
          { icon: '⬇️', label: 'Export',          sub: 'JSON or CSV',       onClick: exportJSON },
        ].map(b => (
          <div key={b.label} onClick={b.onClick} style={{ background: CARD, border: `1px solid ${BDR}`, borderRadius: 13, padding: '12px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ fontSize: 22, flexShrink: 0 }}>{b.loading ? '⏳' : b.icon}</div>
            <div><div style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0' }}>{b.label}</div><div style={{ fontSize: 10, color: '#374151', marginTop: 2 }}>{b.sub}</div></div>
          </div>
        ))}
      </div>
      <input ref={csvRef}  type="file" accept=".csv"  style={{ display: 'none' }} onChange={importCSV} />
      <input ref={fileRef} type="file" accept=".json" style={{ display: 'none' }} onChange={importJSON} />

      <Field placeholder="Search contacts…" value={search} onChange={setSearch} />

      {filtered.length === 0
        ? <div style={{ textAlign: 'center', padding: '48px 20px', fontSize: 13, color: '#374151' }}>No contacts yet. Import from your phone or add manually.</div>
        : <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filtered.map(c => (
              <div key={c.id} onClick={() => { setForm({ name: c.name, phone: c.phone }); setFerr({}); setModal(c.id) }}
                style={{ display: 'flex', alignItems: 'center', gap: 12, background: CARD, border: `1.5px solid ${BDR}`, borderRadius: 14, padding: '12px 14px', cursor: 'pointer' }}>
                <Av name={c.name} size={44} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0' }}>{c.name}</div>
                  <div style={{ fontSize: 11, color: '#374151' }}>+{c.phone}</div>
                </div>
                <span style={{ color: '#1f2937' }}>›</span>
              </div>
            ))}
          </div>}

      {modal && (
        <Sheet title={modal === 'new' ? 'Add Contact' : 'Edit Contact'} onClose={() => setModal(null)}>
          {viewC && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
              <Av name={viewC.name} size={52} />
              <div>
                <div style={{ fontSize: 17, fontWeight: 800, color: '#f1f5f9' }}>{viewC.name}</div>
                <div style={{ fontSize: 13, color: '#6b7280' }}>+{viewC.phone}</div>
              </div>
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Field label="Name *" placeholder="Full name" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} error={ferr.name} autoFocus />
            <Field label="Phone *" placeholder="9876543210" value={form.phone} onChange={v => setForm(f => ({ ...f, phone: v }))} error={ferr.phone} hint="10-digit Indian number — 91 added automatically" type="tel" />
            <Btn full onClick={save} icon="✅">{modal === 'new' ? 'Add Contact' : 'Save Changes'}</Btn>
            {modal !== 'new' && <>
              <Btn full v="ghost" icon="💬" onClick={() => { window.open(`https://wa.me/${viewC?.phone}`, '_blank', 'noopener'); setModal(null) }}>Open in WhatsApp</Btn>
              <Btn full v="danger" icon="🗑" onClick={async () => { await saveContacts(contacts.filter(c => c.id !== modal)); setModal(null); notify('Deleted') }}>Delete</Btn>
            </>}
          </div>
        </Sheet>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// PLANS TAB — Production SaaS pricing
// NOTE: Payment is simulated. For production, integrate Razorpay:
// https://razorpay.com/docs/payments/payment-gateway/web-integration/
// ═══════════════════════════════════════════════════════════════════
function PlansTab({ profile, onPlanActivate, notify }) {
  const [pay,    setPay]    = useState(null)  // plan id being purchased
  const [payTab, setPayTab] = useState('upi') // upi | card | netbank
  const [busy,   setBusy]   = useState(false)
  const [done,   setDone]   = useState(null)
  const [upiId,  setUpiId]  = useState('')
  const [card,   setCard]   = useState({ name: '', no: '', exp: '', cvv: '' })
  const [bank,   setBank]   = useState('')
  const [perr,   setPerr]   = useState('')

  const expired      = isExpired(profile)
  const activePlanId = (!expired && profile?.plan && profile.plan !== 'free') ? profile.plan : null
  const activePlan   = activePlanId ? getPlan(activePlanId) : null

  const fmtNo  = v => v.replace(/\D/g,'').slice(0,16).replace(/(.{4})/g,'$1 ').trim()
  const fmtExp = v => { const d = v.replace(/\D/g,'').slice(0,4); return d.length > 2 ? d.slice(0,2)+'/'+d.slice(2) : d }

  const BANKS = ['State Bank of India','HDFC Bank','ICICI Bank','Axis Bank','Kotak Mahindra Bank','Bank of Baroda','Punjab National Bank','Canara Bank','Union Bank of India','IndusInd Bank']

  function openPay(planId) {
    setPay(planId); setPayTab('upi'); setPerr('')
    setUpiId(''); setCard({ name:'',no:'',exp:'',cvv:'' }); setBank('')
  }

  function validatePay() {
    if (payTab === 'upi') {
      if (!upiId.trim())         return 'Enter your UPI ID'
      if (!upiId.includes('@'))  return 'UPI ID must contain @ — e.g. name@upi'
    } else if (payTab === 'card') {
      if (card.no.replace(/\s/g,'').length !== 16) return 'Enter valid 16-digit card number'
      if (!card.exp.match(/^\d{2}\/\d{2}$/))       return 'Enter expiry in MM/YY format'
      if (card.cvv.length < 3)                      return 'Enter valid CVV (3–4 digits)'
      if (!card.name.trim())                        return 'Enter the name on your card'
    } else {
      if (!bank) return 'Select your bank to continue'
    }
    return ''
  }

  async function doPay() {
    const err = validatePay()
    if (err) { setPerr(err); return }
    setPerr(''); setBusy(true)
    try {
      // NOTE: Replace this simulation with real Razorpay integration in production
      await new Promise(r => setTimeout(r, 2400))
      const plan = getPlan(pay)
      const exp  = new Date(); exp.setDate(exp.getDate() + 30) // 30-day subscription
      await onPlanActivate({ plan: pay, plan_months: 1, plan_expires: exp.toISOString(), msg_used: 0 })
      setDone({ plan, exp, price: planPrice(plan) })
      setPay(null)
    } catch (e) {
      setPerr('Payment failed. Please try again.')
    }
    setBusy(false)
  }

  // ── Success screen ──────────────────────────────────────────────
  if (done) return (
    <div style={{ minHeight: '70vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, padding: '40px 24px', textAlign: 'center', animation: 'pop .3s ease' }}>
      {/* Glow ring */}
      <div style={{ width: 100, height: 100, borderRadius: 50, background: done.plan.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48, boxShadow: `0 0 60px ${done.plan.accent}50, 0 0 120px ${done.plan.accent}20` }}>
        {done.plan.emoji}
      </div>
      <div>
        <h2 style={{ fontSize: 26, fontWeight: 900, color: '#f1f5f9', margin: '0 0 8px', letterSpacing: -.5 }}>You're all set! 🎉</h2>
        <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.9, margin: 0 }}>
          <strong style={{ color: done.plan.accentLight }}>{done.plan.name} Plan</strong> is now active<br />
          ₹{done.price}/month · Valid for 30 days<br />
          <span style={{ fontSize: 12, color: '#374151' }}>Expires {new Date(done.exp).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
        </p>
      </div>
      {/* What's unlocked */}
      <div style={{ background: done.plan.gradient, borderRadius: 16, padding: '16px 20px', width: '100%', maxWidth: 320, border: `1px solid ${done.plan.accent}40` }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: done.plan.accentLight, marginBottom: 10, letterSpacing: .5, textTransform: 'uppercase' }}>What's unlocked</div>
        {done.plan.features.filter(f => f.ok).slice(0, 4).map(f => (
          <div key={f.text} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
            <span style={{ color: done.plan.accent, fontSize: 13 }}>✓</span>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>{f.text}</span>
          </div>
        ))}
      </div>
      <Btn onClick={() => setDone(null)} style={{ background: done.plan.accent, color: '#fff', border: 'none', boxShadow: `0 4px 20px ${done.plan.accent}50` }}>
        Start Broadcasting →
      </Btn>
    </div>
  )

  // ── Main plans page ─────────────────────────────────────────────
  return (
    <div style={{ padding: '16px 16px 32px', display: 'flex', flexDirection: 'column', gap: 14, animation: 'pop .22s ease' }}>

      {/* Header */}
      <div style={{ marginBottom: 4 }}>
        <h2 style={{ fontSize: 22, fontWeight: 900, color: '#f1f5f9', margin: '0 0 4px', letterSpacing: -.3 }}>Choose Your Plan</h2>
        <p style={{ fontSize: 12, color: '#4b5563', margin: 0 }}>🇮🇳 Built for Indian businesses · Cancel anytime</p>
      </div>

      {/* Expired banner */}
      {expired && (
        <div style={{ background: 'linear-gradient(135deg,#ff444412,#ff6b6b08)', border: '1px solid #ff444430', borderRadius: 12, padding: '13px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 20 }}>⚠️</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#ff6b6b' }}>Your plan has expired</div>
            <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>Renew below to continue sending broadcasts automatically.</div>
          </div>
        </div>
      )}

      {/* Active plan status */}
      {activePlan && !expired && (
        <div style={{ background: `linear-gradient(135deg,${activePlan.accent}12,${activePlan.accent}06)`, border: `1px solid ${activePlan.accent}30`, borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 20 }}>{activePlan.emoji}</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: activePlan.accentLight }}>Active: {activePlan.name} Plan</div>
              {profile?.plan_expires && (
                <div style={{ fontSize: 11, color: '#6b7280', marginTop: 1 }}>
                  Expires {new Date(profile.plan_expires).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </div>
              )}
            </div>
          </div>
          <div style={{ background: activePlan.accent+'20', border: `1px solid ${activePlan.accent}40`, borderRadius: 8, padding: '4px 10px', fontSize: 10, fontWeight: 800, color: activePlan.accent, letterSpacing: .5 }}>ACTIVE</div>
        </div>
      )}

      {/* Conversion nudge */}
      <div style={{ background: 'linear-gradient(135deg,#a78bfa15,#7c3aed08)', border: '1px solid #a78bfa25', borderRadius: 12, padding: '11px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 18 }}>⚡</span>
        <span style={{ fontSize: 12, color: '#c4b5fd', fontWeight: 600 }}>Most businesses choose the <strong style={{ color: '#a78bfa' }}>Business Plan</strong> — best value for daily broadcasts</span>
      </div>

      {/* Plan cards */}
      {PLANS.map(plan => {
        const price    = planPrice(plan)
        const isActive = activePlanId === plan.id
        const isFree   = plan.price === 0
        const isPopular = plan.highlight

        return (
          <div key={plan.id} style={{
            background: plan.gradient,
            borderRadius: 20,
            overflow: 'hidden',
            position: 'relative',
            border: `2px solid ${isActive ? plan.accent : isPopular ? plan.accent+'70' : plan.accent+'18'}`,
            boxShadow: isActive
              ? `0 0 40px ${plan.accent}35, 0 8px 32px rgba(0,0,0,.4)`
              : isPopular
                ? `0 0 32px ${plan.accent}25, 0 8px 24px rgba(0,0,0,.3)`
                : '0 4px 16px rgba(0,0,0,.25)',
            transform: isPopular ? 'scale(1.01)' : 'scale(1)',
            transition: 'transform .2s',
          }}>

            {/* Top badge */}
            {(plan.badge || isActive) && (
              <div style={{
                position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
                background: isActive ? plan.accent : `linear-gradient(90deg,${plan.accent},${plan.accentLight})`,
                color: '#fff', fontSize: 10, fontWeight: 800,
                padding: '5px 22px', borderRadius: '0 0 14px 14px',
                letterSpacing: .8, whiteSpace: 'nowrap',
                boxShadow: `0 4px 12px ${plan.accent}50`,
              }}>
                {isActive ? '✓  YOUR CURRENT PLAN' : `⭐  ${plan.badge}`}
              </div>
            )}

            {/* Header area */}
            <div style={{ padding: `${plan.badge || isActive ? '28px' : '20px'} 20px 16px` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 20, fontWeight: 900, color: '#fff', marginBottom: 3, letterSpacing: -.3 }}>
                    {plan.emoji}  {plan.name}
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginBottom: 6 }}>{plan.subtitle}</div>
                  {/* Tagline */}
                  <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.08)', borderRadius: 8, padding: '3px 9px', fontSize: 10, color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>
                    {plan.tagline}
                  </div>
                </div>
                {/* Price */}
                <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 12 }}>
                  {isFree
                    ? <>
                        <div style={{ fontSize: 28, fontWeight: 900, color: '#fff', lineHeight: 1 }}>₹0</div>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 3 }}>forever</div>
                      </>
                    : <>
                        <div style={{ fontSize: 28, fontWeight: 900, color: '#fff', lineHeight: 1 }}>₹{price}</div>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 3 }}>per month</div>
                        <div style={{ fontSize: 10, color: plan.accentLight, marginTop: 4, fontWeight: 700 }}>30-day access</div>
                      </>}
                </div>
              </div>
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: `linear-gradient(90deg,transparent,${plan.accent}40,transparent)`, marginInline: 0 }} />

            {/* Features list */}
            <div style={{ padding: '14px 20px 6px', display: 'flex', flexDirection: 'column', gap: 9 }}>
              {plan.features.map(f => (
                <div key={f.text} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: 10, flexShrink: 0,
                    background: f.ok ? plan.accent+'28' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${f.ok ? plan.accent+'50' : 'rgba(255,255,255,0.08)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span style={{ fontSize: 10, fontWeight: 900, color: f.ok ? plan.accentLight : 'rgba(255,255,255,0.18)' }}>
                      {f.ok ? '✓' : '✕'}
                    </span>
                  </div>
                  <span style={{ fontSize: 12, color: f.ok ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.25)', lineHeight: 1.4 }}>
                    {f.text}
                  </span>
                </div>
              ))}
            </div>

            {/* CTA button */}
            <div style={{ padding: '16px 20px 20px' }}>
              {isActive ? (
                <div style={{ textAlign: 'center', padding: '12px', background: plan.accent+'18', borderRadius: 12, border: `1px solid ${plan.accent}30` }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: plan.accentLight }}>✓  Active Plan</span>
                  {profile?.plan_expires && (
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 3 }}>
                      Renews {new Date(profile.plan_expires).toLocaleDateString('en-IN')}
                    </div>
                  )}
                </div>
              ) : isFree ? (
                <div style={{ textAlign: 'center', padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: 12 }}>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>Your current free tier</span>
                </div>
              ) : (
                <button
                  onClick={() => openPay(plan.id)}
                  style={{
                    width: '100%', border: 'none', borderRadius: 13, padding: '14px',
                    fontSize: 14, fontWeight: 800, cursor: 'pointer', transition: 'all .15s',
                    background: isPopular
                      ? `linear-gradient(135deg,${plan.accent},${plan.accentLight})`
                      : plan.accent,
                    color: '#fff',
                    boxShadow: `0 6px 24px ${plan.accent}55`,
                    letterSpacing: .2,
                  }}>
                  {activePlanId ? `Switch to ${plan.name}` : `Get ${plan.name}`} · ₹{price}/mo
                </button>
              )}
            </div>
          </div>
        )
      })}

      {/* Trust badges */}
      <div style={{ background: '#0a1628', border: '1px solid #1e3a5f', borderRadius: 14, padding: '14px 16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            { icon: '🔒', text: 'Secure payment' },
            { icon: '🔄', text: 'No auto-renewal' },
            { icon: '💳', text: 'Card never stored' },
            { icon: '❌', text: 'Cancel anytime' },
          ].map(b => (
            <div key={b.text} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <span style={{ fontSize: 14 }}>{b.icon}</span>
              <span style={{ fontSize: 11, color: '#4b5563', fontWeight: 600 }}>{b.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Payment Sheet */}
      {pay && (() => {
        const plan  = getPlan(pay)
        const price = planPrice(plan)
        return (
          <Sheet title="Complete Payment" onClose={() => !busy && setPay(null)}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

              {/* Order summary */}
              <div style={{ background: plan.gradient, borderRadius: 16, padding: '16px 18px', border: `1px solid ${plan.accent}40` }}>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: .8, marginBottom: 10 }}>Order Summary</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 20 }}>{plan.emoji}</span>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>{plan.name} Plan</div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>30-day access · Full features</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 20, fontWeight: 900, color: '#fff' }}>₹{price}</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>incl. taxes</div>
                  </div>
                </div>
                {/* Features reminder */}
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 10, marginTop: 4 }}>
                  {plan.features.filter(f => f.ok).slice(0, 3).map(f => (
                    <div key={f.text} style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginBottom: 3 }}>
                      ✓ {f.text}
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment method selector */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#4b5563', letterSpacing: .8, textTransform: 'uppercase', marginBottom: 8 }}>Payment Method</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
                  {[
                    { id: 'upi',     label: 'UPI',        icon: '📲' },
                    { id: 'card',    label: 'Card',        icon: '💳' },
                    { id: 'netbank', label: 'Net Banking', icon: '🏦' },
                  ].map(t => (
                    <div key={t.id} onClick={() => { setPayTab(t.id); setPerr('') }}
                      style={{
                        background: payTab === t.id ? plan.accent+'22' : CARD,
                        border: `2px solid ${payTab === t.id ? plan.accent : BDR}`,
                        borderRadius: 12, padding: '11px 6px', textAlign: 'center', cursor: 'pointer', transition: 'all .2s',
                      }}>
                      <div style={{ fontSize: 22, marginBottom: 4 }}>{t.icon}</div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: payTab === t.id ? plan.accentLight : '#6b7280' }}>{t.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* UPI */}
              {payTab === 'upi' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
                  <Field label="Your UPI ID" placeholder="yourname@upi" value={upiId} onChange={setUpiId}
                    hint="e.g. 9876543210@paytm  ·  name@oksbi  ·  name@ybl" />
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#4b5563', letterSpacing: .8, textTransform: 'uppercase', marginBottom: 8 }}>Quick Pay</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
                      {[
                        { name: 'GPay',    color: '#4285f4', bg: '#e8f0fe' },
                        { name: 'PhonePe', color: '#5f259f', bg: '#f3e8ff' },
                        { name: 'Paytm',   color: '#00b9f1', bg: '#e0f7fd' },
                        { name: 'BHIM',    color: '#e67e22', bg: '#fef3e2' },
                      ].map(app => (
                        <div key={app.name}
                          onClick={() => notify(`Enter your ${app.name} UPI ID above`, 'ok')}
                          style={{ background: app.color+'12', border: `1.5px solid ${app.color}25`, borderRadius: 12, padding: '10px 4px', textAlign: 'center', cursor: 'pointer', transition: 'all .15s' }}>
                          <div style={{ fontSize: 10, fontWeight: 800, color: app.color, letterSpacing: .3 }}>{app.name}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Card */}
              {payTab === 'card' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
                  <Field label="Name on Card" placeholder="Rahul Sharma" value={card.name} onChange={v => setCard(c => ({ ...c, name: v }))} />
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#4b5563', letterSpacing: .8, textTransform: 'uppercase', marginBottom: 6 }}>Card Number</div>
                    <input value={card.no} onChange={e => setCard(c => ({ ...c, no: fmtNo(e.target.value) }))}
                      placeholder="1234  5678  9012  3456" maxLength={19}
                      style={{ width: '100%', background: CARD, border: `1.5px solid ${BDR}`, borderRadius: 12, padding: '12px 14px', color: '#e2e8f0', fontSize: 16, fontFamily: 'monospace', outline: 'none', boxSizing: 'border-box', letterSpacing: 3 }} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#4b5563', letterSpacing: .8, textTransform: 'uppercase', marginBottom: 6 }}>Expiry</div>
                      <input value={card.exp} onChange={e => setCard(c => ({ ...c, exp: fmtExp(e.target.value) }))}
                        placeholder="MM / YY" maxLength={5}
                        style={{ width: '100%', background: CARD, border: `1.5px solid ${BDR}`, borderRadius: 12, padding: '12px 14px', color: '#e2e8f0', fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#4b5563', letterSpacing: .8, textTransform: 'uppercase', marginBottom: 6 }}>CVV</div>
                      <input value={card.cvv} onChange={e => setCard(c => ({ ...c, cvv: e.target.value.replace(/\D/g,'').slice(0,4) }))}
                        placeholder="•••" type="password" maxLength={4}
                        style={{ width: '100%', background: CARD, border: `1.5px solid ${BDR}`, borderRadius: 12, padding: '12px 14px', color: '#e2e8f0', fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 7 }}>
                    {['Visa','Mastercard','RuPay','Amex'].map(c => (
                      <div key={c} style={{ background: '#1e293b', border: `1px solid ${BDR}`, borderRadius: 7, padding: '4px 9px', fontSize: 10, color: '#64748b', fontWeight: 700 }}>{c}</div>
                    ))}
                  </div>
                </div>
              )}

              {/* Net Banking */}
              {payTab === 'netbank' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#4b5563', letterSpacing: .8, textTransform: 'uppercase', marginBottom: 2 }}>Select Your Bank</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 240, overflowY: 'auto', paddingRight: 2 }}>
                    {BANKS.map(b => (
                      <div key={b} onClick={() => setBank(b)}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          background: bank === b ? G+'15' : CARD,
                          border: `1.5px solid ${bank === b ? G : BDR}`,
                          borderRadius: 12, padding: '11px 14px', cursor: 'pointer', transition: 'all .18s',
                        }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 32, height: 32, background: bank === b ? G+'20' : BG, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🏦</div>
                          <span style={{ fontSize: 13, fontWeight: 600, color: bank === b ? G : '#e2e8f0' }}>{b}</span>
                        </div>
                        {bank === b && <span style={{ color: G, fontSize: 16, fontWeight: 900 }}>✓</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Error message */}
              {perr && (
                <div style={{ background: '#ff444412', border: '1px solid #ff444435', borderRadius: 10, padding: '10px 13px', fontSize: 12, color: '#ff6b6b', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>⚠️</span><span>{perr}</span>
                </div>
              )}

              {/* Pay button */}
              <button
                onClick={doPay} disabled={busy}
                style={{
                  width: '100%', border: 'none', borderRadius: 13, padding: '15px',
                  fontSize: 15, fontWeight: 800, cursor: busy ? 'not-allowed' : 'pointer',
                  background: busy ? '#1e293b' : `linear-gradient(135deg,${plan.accent},${plan.accentLight})`,
                  color: busy ? '#4b5563' : '#fff',
                  boxShadow: busy ? 'none' : `0 6px 24px ${plan.accent}50`,
                  transition: 'all .2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}>
                {busy
                  ? <><Spin size={16} color="#6b7280" /> Processing payment…</>
                  : <>🔒 Pay ₹{price} · Activate {plan.name}</>}
              </button>

              <div style={{ textAlign: 'center', fontSize: 11, color: '#374151', lineHeight: 1.7 }}>
                🔒 Secured · Card details never stored · No auto-renewal
              </div>
            </div>
          </Sheet>
        )
      })()}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// SETTINGS TAB
// ═══════════════════════════════════════════════════════════════════
function SettingsTab({ user, profile, contacts, saveProfile, logout, notify }) {
  const [waSection,     setWaSection]     = useState('connect')
  const [phoneId,       setPhoneId]       = useState(profile?.wa_phone_id || '')
  const [token,         setToken]         = useState(profile?.wa_token    || '')
  const [verifying,     setVerifying]     = useState(false)
  const [editProfile,   setEditProfile]   = useState(false)
  const [pf,            setPf]            = useState({ full_name: profile?.full_name || '', business_name: profile?.business_name || '', phone: profile?.phone || '' })
  const [confirmLogout, setConfirmLogout] = useState(false)

  async function verifyAPI() {
    if (!phoneId.trim() || !token.trim()) { notify('Enter both Phone Number ID and Access Token', 'warn'); return }
    setVerifying(true)
    try {
      const { data: { session } } = await sb.auth.getSession()
      const result = await callAPI('/api/verify-wa', 'POST', { phoneId: phoneId.trim(), token: token.trim() }, session?.access_token)
      notify(`✓ Connected: ${result.phone}`)
      await saveProfile({ wa_phone_id: phoneId.trim(), wa_token: token.trim(), wa_number: result.phone, wa_verified: true })
      setWaSection('connected')
    } catch (e) { notify(e.message, 'err') }
    setVerifying(false)
  }

  async function disconnectWA() {
    await saveProfile({ wa_phone_id: null, wa_token: null, wa_number: null, wa_verified: false })
    setPhoneId(''); setToken(''); setWaSection('connect')
    notify('WhatsApp API disconnected')
  }

  async function saveProfileData() {
    await saveProfile(pf); setEditProfile(false); notify('Profile saved ✓')
  }

  function exportContacts() {
    const blob = new Blob([JSON.stringify({ contacts, exportedAt: new Date().toISOString() }, null, 2)], { type: 'application/json' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `wab_backup_${Date.now()}.json`; a.click()
    notify('Backup downloaded ✓')
  }

  // Show connected view if wa_verified
  const isConnected = !!profile?.wa_verified

  return (
    <div style={{ padding: '16px 16px 24px', display: 'flex', flexDirection: 'column', gap: 20, animation: 'pop .22s ease' }}>

      {/* ── WhatsApp API ────────────────────────────────── */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#374151', letterSpacing: .8, textTransform: 'uppercase', marginBottom: 12 }}>WhatsApp Connection</div>

        {isConnected
          ? <Card glow={G} style={{ background: `linear-gradient(135deg,${G}10,#16a34a06)` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <div style={{ width: 44, height: 44, background: G+'18', border: `1.5px solid ${G}35`, borderRadius: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>💬</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#f1f5f9' }}>WhatsApp Connected ✓</div>
                  <div style={{ fontSize: 12, color: '#4b5563', marginTop: 2 }}>{profile.wa_number || 'API active'}</div>
                </div>
                <div style={{ width: 10, height: 10, background: G, borderRadius: 5, boxShadow: `0 0 8px ${G}` }} />
              </div>
              <div style={{ background: G+'12', borderRadius: 10, padding: '9px 12px', fontSize: 12, color: G, marginBottom: 12 }}>
                ⚡ Automatic sending is active. Broadcasts send instantly from your number.
              </div>
              <Btn full v="danger" onClick={disconnectWA} icon="🔌">Disconnect API</Btn>
            </Card>

          : <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Card style={{ border: '1.5px solid #fbbf2430', background: '#fbbf2408' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ fontSize: 28 }}>📱</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9' }}>WhatsApp Not Connected</div>
                    <div style={{ fontSize: 12, color: '#4b5563', lineHeight: 1.5, marginTop: 3 }}>Connect your Meta API key to send messages automatically from your own WhatsApp number</div>
                  </div>
                </div>
              </Card>

              <div style={{ display: 'flex', background: BG, borderRadius: 11, padding: 4, gap: 4 }}>
                {[['connect', '🔑 Enter API Key'], ['guide', '📖 How to Get Key']].map(([id, label]) => (
                  <div key={id} onClick={() => setWaSection(id)}
                    style={{ flex: 1, textAlign: 'center', padding: '8px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 700, background: waSection === id ? G : 'transparent', color: waSection === id ? '#fff' : '#6b7280', transition: 'all .2s' }}>
                    {label}
                  </div>
                ))}
              </div>

              {waSection === 'connect' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <Field label="Phone Number ID" placeholder="123456789012345" value={phoneId} onChange={setPhoneId}
                    hint="Meta Dashboard → WhatsApp → API Setup → Phone Number ID" />
                  <Field label="Access Token" placeholder="EAAxxxxxxxxxxxxxxxxxxxxxxxx" value={token} onChange={setToken}
                    hint="Meta Dashboard → WhatsApp → API Setup → Temporary or Permanent Token" type="password" />
                  <Btn full loading={verifying} onClick={verifyAPI} icon="🔗">Verify & Connect</Btn>
                  <div style={{ fontSize: 11, color: '#374151', textAlign: 'center', lineHeight: 1.6 }}>
                    Your token is encrypted and stored securely. We never share it.
                  </div>
                </div>
              )}

              {waSection === 'guide' && (
                <Card style={{ background: '#0a1628', border: '1px solid #1e3a5f' }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#38bdf8', marginBottom: 12 }}>📋 Steps to Get Your Meta API Key</div>
                  {[
                    { step: '1', text: 'Go to developers.facebook.com', sub: 'Sign in with your Facebook account' },
                    { step: '2', text: 'Create New App → type "Business"', sub: 'Give it any name, e.g. "My Business WA"' },
                    { step: '3', text: 'Add WhatsApp product to your app', sub: 'Click "+ Add Product" → WhatsApp → Set up' },
                    { step: '4', text: 'Verify your business', sub: 'Upload GST certificate or Udyam/MSME cert — takes 2–7 days' },
                    { step: '5', text: 'Add phone number', sub: 'Must be a number NOT already on WhatsApp (new SIM = ₹20)' },
                    { step: '6', text: 'Copy Phone Number ID and Token', sub: 'WhatsApp → API Setup page → paste here' },
                  ].map(s => (
                    <div key={s.step} style={{ display: 'flex', gap: 12, marginBottom: 12, alignItems: 'flex-start' }}>
                      <div style={{ width: 26, height: 26, background: G+'18', border: `1px solid ${G}30`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, color: G, flexShrink: 0 }}>{s.step}</div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0' }}>{s.text}</div>
                        <div style={{ fontSize: 11, color: '#374151', marginTop: 2 }}>{s.sub}</div>
                      </div>
                    </div>
                  ))}
                  <div style={{ background: G+'10', border: `1px solid ${G}20`, borderRadius: 10, padding: '10px 12px', fontSize: 12, color: G, lineHeight: 1.6 }}>
                    💡 <strong>Free to get approved.</strong> You only pay Meta ₹0.88 per marketing conversation when sending.
                  </div>
                </Card>
              )}
            </div>}
      </div>

      {/* ── Profile ─────────────────────────────────────── */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#374151', letterSpacing: .8, textTransform: 'uppercase', marginBottom: 12 }}>Your Profile</div>
        <Card style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 13, marginBottom: 14 }}>
            <Av name={profile?.full_name || 'User'} size={52} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 17, fontWeight: 800, color: '#f1f5f9' }}>{profile?.full_name || 'User'}</div>
              <div style={{ fontSize: 12, color: '#4b5563', marginTop: 2 }}>{user?.email}</div>
            </div>
            <div onClick={() => setEditProfile(p => !p)}
              style={{ width: 34, height: 34, background: editProfile ? G+'20' : CARD, border: `1px solid ${editProfile ? G+'40' : BDR}`, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 16 }}>
              {editProfile ? '✓' : '✏️'}
            </div>
          </div>
          {editProfile
            ? <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
                <Field label="Full Name" value={pf.full_name} onChange={v => setPf(p => ({ ...p, full_name: v }))} placeholder="Your full name" />
                <Field label="Business Name" value={pf.business_name} onChange={v => setPf(p => ({ ...p, business_name: v }))} placeholder="Your business name" />
                <Field label="Phone" value={pf.phone} onChange={v => setPf(p => ({ ...p, phone: v }))} placeholder="+91 XXXXX XXXXX" type="tel" />
                <Btn full onClick={saveProfileData} icon="✅">Save Profile</Btn>
              </div>
            : <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[['Business', profile?.business_name || '—'], ['Phone', profile?.phone || '—'], ['Email', user?.email || '—']].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: '#4b5563' }}>{k}</span>
                    <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{v}</span>
                  </div>
                ))}
              </div>}
        </Card>
      </div>

      {/* ── Data & Backup ────────────────────────────────── */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#374151', letterSpacing: .8, textTransform: 'uppercase', marginBottom: 12 }}>Data &amp; Backup</div>
        <Card style={{ background: '#0a1628', border: '1px solid #1e3a5f', marginBottom: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#38bdf8', marginBottom: 10 }}>☁️ Cloud Sync Status</div>
          {[
            { icon: '👥', label: 'Contacts',     detail: 'Saved to cloud — restored on sign in' },
            { icon: '⭐', label: 'Subscription', detail: 'Synced — survives app deletion' },
            { icon: '📤', label: 'Broadcasts',   detail: 'History saved per account' },
          ].map(r => (
            <div key={r.label} style={{ display: 'flex', gap: 10, marginBottom: 9, alignItems: 'center' }}>
              <span style={{ fontSize: 18 }}>{r.icon}</span>
              <div>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0' }}>{r.label} </span>
                <span style={{ fontSize: 12, color: '#374151' }}>— {r.detail}</span>
              </div>
            </div>
          ))}
          <div style={{ fontSize: 11, color: '#1e3a5f', marginTop: 4 }}>Sign in on any device to restore everything.</div>
        </Card>
        <Btn full v="ghost" onClick={exportContacts} icon="⬇️">Download Contacts Backup ({contacts.length})</Btn>
      </div>

      {/* ── Sign Out ─────────────────────────────────────── */}
      <Btn full v="danger" onClick={() => setConfirmLogout(true)} icon="🚪">Sign Out</Btn>

      {confirmLogout && (
        <Sheet title="Sign Out?" onClose={() => setConfirmLogout(false)}>
          <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.7, marginBottom: 16 }}>Your contacts, subscription, and broadcast history are saved in the cloud. Sign back in any time to restore everything.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            <Btn full v="danger" onClick={logout} icon="🚪">Yes, Sign Out</Btn>
            <Btn full v="ghost" onClick={() => setConfirmLogout(false)}>Cancel</Btn>
          </div>
        </Sheet>
      )}
    </div>
  )
}
