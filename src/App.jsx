import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { createClient } from '@supabase/supabase-js'

// ── Supabase ──────────────────────────────────────────────────────
const SURL = import.meta.env.VITE_SUPABASE_URL
const SKEY = import.meta.env.VITE_SUPABASE_ANON
if (!SURL || !SKEY) throw new Error('Supabase environment variables missing. Check your .env file.')
const sb = createClient(SURL, SKEY)

// ── Backend API ───────────────────────────────────────────────────
const API = import.meta.env.VITE_API_URL || ''
async function callAPI(path, method = 'GET', body, token) {
  try {
    const res = await fetch(`${API}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}),
    })
    const d = await res.json().catch(() => { throw new Error('Invalid server response') })
    if (!res.ok) throw new Error(d.error || 'Server error')
    return d
  } catch (e) {
    if (e.message === 'Failed to fetch') throw new Error('No internet connection')
    throw e
  }
}

// ── Helpers ───────────────────────────────────────────────────────
const hydrate = (msg, c) =>
  msg.replace(/{name}/gi, c.name || '').replace(/{firstname}/gi, (c.name||'').split(' ')[0]).replace(/{phone}/gi, '+'+c.phone)

const cleanPhone = p => {
  const d = String(p).replace(/\D/g, '')
  if (d.startsWith('91') && d.length === 12) return d
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
  }[v] || {}
  return (
    <button onClick={disabled || loading ? undefined : onClick}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: small ? '8px 14px' : '13px 20px', borderRadius: 12, fontSize: small ? 12 : 14, fontWeight: 700, width: full ? '100%' : 'auto', cursor: disabled || loading ? 'not-allowed' : 'pointer', opacity: disabled ? .4 : 1, transition: 'all .15s', background: styles.bg, color: styles.color, border: styles.border, boxShadow: styles.shadow, ...sx }}>
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
          <div onClick={onClose} style={{ width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#6b7280', fontSize: 18, borderRadius: 8 }}>x</div>
        </div>
        <div style={{ padding: 20 }}>{children}</div>
      </div>
    </div>
  )
}

function Toast({ msg, type, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 3200); return () => clearTimeout(t) }, [])
  const col = type === 'err' ? '#ff6b6b' : type === 'warn' ? '#fbbf24' : G
  return (
    <div style={{ position: 'fixed', bottom: 90, left: '50%', transform: 'translateX(-50%)', background: CARD, border: `1px solid ${col}40`, borderRadius: 14, padding: '11px 18px', display: 'flex', alignItems: 'center', gap: 9, zIndex: 500, animation: 'up .2s ease', whiteSpace: 'nowrap', maxWidth: '88vw', boxShadow: '0 8px 32px rgba(0,0,0,.7)' }}>
      <div style={{ width: 7, height: 7, borderRadius: 4, background: col, boxShadow: `0 0 8px ${col}` }} />
      <span style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9', overflow: 'hidden', textOverflow: 'ellipsis' }}>{msg}</span>
    </div>
  )
}

function GlobalStyles() {
  useEffect(() => {
    const s = document.createElement('style')
    s.textContent = `
      * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
      body { margin: 0; background: #030712; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
      @keyframes spin  { to { transform: rotate(360deg) } }
      @keyframes pop   { from { opacity: 0; transform: scale(.96) translateY(6px) } to { opacity: 1; transform: none } }
      @keyframes sheet { from { transform: translateY(100%) } to { transform: none } }
      @keyframes up    { from { opacity: 0; transform: translateX(-50%) translateY(10px) } to { opacity: 1; transform: translateX(-50%) translateY(0) } }
      input::placeholder, textarea::placeholder { color: #374151 }
      input, textarea, button { font-family: inherit }
      ::-webkit-scrollbar { width: 4px } ::-webkit-scrollbar-track { background: transparent } ::-webkit-scrollbar-thumb { background: #1c2432; border-radius: 4px }
    `
    document.head.appendChild(s)
    return () => document.head.removeChild(s)
  }, [])
  return null
}

// ═══════════════════════════════════════════════════════════════════
// AUTH SCREEN
// ═══════════════════════════════════════════════════════════════════
function AuthScreen({ onLogin }) {
  const [mode,  setMode]  = useState('login')
  const [busy,  setBusy]  = useState(false)
  const [err,   setErr]   = useState('')
  const [showP, setShowP] = useState(false)
  const [f, setF] = useState({ name: '', email: '', pw: '', pw2: '' })
  const set = k => v => setF(p => ({ ...p, [k]: v }))

  async function submit() {
    setErr('')
    if (mode === 'signup') {
      if (!f.name.trim())         return setErr('Enter your full name')
      if (!f.email.includes('@')) return setErr('Enter a valid email address')
      if (f.pw.length < 6)        return setErr('Password must be at least 6 characters')
      if (f.pw !== f.pw2)         return setErr('Passwords do not match')
    } else {
      if (!f.email.trim() || !f.pw.trim()) return setErr('Please fill in all fields')
    }
    setBusy(true)
    try {
      if (mode === 'signup') {
        const { data, error } = await sb.auth.signUp({ email: f.email, password: f.pw, options: { data: { full_name: f.name } } })
        if (error) throw error
        if (data.user) {
          await sb.from('profiles').upsert({ id: data.user.id, email: f.email, full_name: f.name })
          const { data: profile } = await sb.from('profiles').select('*').eq('id', data.user.id).single()
          onLogin(data.user, profile || { full_name: f.name, email: f.email }, [])
        }
      } else {
        const { data, error } = await sb.auth.signInWithPassword({ email: f.email, password: f.pw })
        if (error) throw error
        const [{ data: profile }, { data: contactRow }] = await Promise.all([
          sb.from('profiles').select('*').eq('id', data.user.id).single(),
          sb.from('profiles').select('contacts').eq('id', data.user.id).single(),
        ])
        const contacts = (() => { try { return JSON.parse(contactRow?.contacts || '[]') } catch { return [] } })()
        onLogin(data.user, profile || {}, contacts)
      }
    } catch (e) {
      setErr(e.message?.includes('already') ? 'Account already exists — please sign in' : e.message || 'Something went wrong')
    }
    setBusy(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: `radial-gradient(ellipse at top,#0a1628 0%,${BG} 60%)`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <GlobalStyles />
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ width: 76, height: 76, background: `linear-gradient(135deg,${G},#16a34a)`, borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', boxShadow: `0 8px 40px ${G}60`, fontSize: 38 }}>💬</div>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: '#f1f5f9', margin: '0 0 6px', letterSpacing: -.5 }}>WaBroadcast</h1>
        <p style={{ fontSize: 13, color: '#4b5563', margin: 0 }}>Send WhatsApp messages to everyone — free</p>
      </div>

      <div style={{ width: '100%', maxWidth: 380, background: CARD, border: `1px solid ${BDR}`, borderRadius: 22, padding: 24, boxShadow: '0 24px 80px rgba(0,0,0,.6)' }}>
        <div style={{ display: 'flex', background: BG, borderRadius: 12, padding: 4, marginBottom: 22 }}>
          {['login','signup'].map(m => (
            <div key={m} onClick={() => { setMode(m); setErr('') }}
              style={{ flex: 1, textAlign: 'center', padding: '9px', borderRadius: 9, cursor: 'pointer', fontSize: 13, fontWeight: 700, transition: 'all .2s', background: mode === m ? G : 'transparent', color: mode === m ? '#fff' : '#6b7280' }}>
              {m === 'login' ? 'Sign In' : 'Sign Up'}
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {mode === 'signup' && <Field label="Full Name" placeholder="Rahul Sharma" value={f.name} onChange={set('name')} autoFocus />}
          <Field label="Email" placeholder="you@gmail.com" value={f.email} onChange={set('email')} type="email" />
          <Field label="Password" placeholder="Min 6 characters" value={f.pw} onChange={set('pw')} type={showP ? 'text' : 'password'}
            right={<span onClick={() => setShowP(p => !p)} style={{ fontSize: 17, userSelect: 'none' }}>{showP ? '🙈' : '👁️'}</span>} />
          {mode === 'signup' && <Field label="Confirm Password" placeholder="Same as above" value={f.pw2} onChange={set('pw2')} type="password" />}
          {err && <div style={{ background: '#ff444412', border: '1px solid #ff444430', borderRadius: 10, padding: '10px 13px', fontSize: 12, color: '#ff6b6b' }}>{err}</div>}
          <Btn full loading={busy} onClick={submit}>{mode === 'login' ? 'Sign In' : 'Create Free Account'}</Btn>
        </div>

        <div style={{ marginTop: 16, background: BG, borderRadius: 12, padding: '10px 14px', fontSize: 11.5, color: '#374151', lineHeight: 1.7 }}>
          100% Free. No subscription, no credit card, no limits.
        </div>
      </div>
      <p style={{ marginTop: 14, fontSize: 11, color: '#1f2937', textAlign: 'center' }}>By signing up you agree to our Terms and Privacy Policy</p>
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
          sb.from('broadcasts').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false }).limit(30),
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
    setProfile(p => ({ ...p, ...updates }))
    if (user?.id) await sb.from('profiles').update(updates).eq('id', user.id)
  }

  async function onBroadcastDone(entry, sent) {
    setHistory(h => [entry, ...h].slice(0, 30))
    if (user?.id) {
      await sb.from('broadcasts').insert({ user_id: user.id, ...entry }).catch(() => {})
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
      <GlobalStyles />
      <div style={{ width: 64, height: 64, background: `linear-gradient(135deg,${G},#16a34a)`, borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, boxShadow: `0 8px 32px ${G}50` }}>💬</div>
      <Spin size={24} color={G} />
    </div>
  )

  if (screen === 'auth') return <AuthScreen onLogin={onLogin} />

  const shared = { user, profile, contacts, history, notify, saveContacts, saveProfile, onBroadcastDone, logout, goTab: setTab }

  const TABS = [
    { id: 'home',     label: 'Home',     icon: '🏠' },
    { id: 'send',     label: 'Send',     icon: '💬' },
    { id: 'contacts', label: 'Contacts', icon: '👥' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ]

  return (
    <div style={{ width: '100%', height: '100vh', background: BG, display: 'flex', justifyContent: 'center' }}>
      <GlobalStyles />
      <div style={{ width: '100%', maxWidth: 430, height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ flexShrink: 0, padding: '11px 16px', borderBottom: `1px solid ${BDR}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: BG }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{ width: 34, height: 34, background: `linear-gradient(135deg,${G},#16a34a)`, borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, boxShadow: `0 4px 14px ${G}50` }}>💬</div>
            <span style={{ fontSize: 17, fontWeight: 900, color: '#f1f5f9', letterSpacing: -.3 }}>WaBroadcast</span>
          </div>
          {!profile?.wa_verified
            ? <div onClick={() => setTab('settings')} style={{ background: G+'15', border: `1px solid ${G}30`, borderRadius: 8, padding: '5px 11px', fontSize: 11, fontWeight: 700, color: G, cursor: 'pointer' }}>Connect WA</div>
            : <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: G+'12', border: `1px solid ${G}25`, borderRadius: 8, padding: '5px 11px' }}>
                <div style={{ width: 7, height: 7, borderRadius: 4, background: G, boxShadow: `0 0 6px ${G}` }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: G }}>Connected</span>
              </div>}
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {tab === 'home'     && <HomeTab     {...shared} />}
          {tab === 'send'     && <SendTab     {...shared} />}
          {tab === 'contacts' && <ContactsTab {...shared} />}
          {tab === 'settings' && <SettingsTab {...shared} />}
        </div>

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
function HomeTab({ profile, contacts, history, goTab }) {
  const totalSent = profile?.msg_used || 0
  const todayBc   = history.filter(h => h.created_at && new Date(h.created_at).toDateString() === new Date().toDateString()).length

  return (
    <div style={{ padding: '18px 16px 24px', display: 'flex', flexDirection: 'column', gap: 16, animation: 'pop .22s ease' }}>
      <div>
        <h2 style={{ fontSize: 22, fontWeight: 900, color: '#f1f5f9', margin: '0 0 3px' }}>Hello, {(profile?.full_name || 'there').split(' ')[0]} 👋</h2>
        <p style={{ fontSize: 12, color: '#4b5563', margin: 0 }}>Ready to broadcast? Let's go!</p>
      </div>

      {!profile?.wa_verified && (
        <div onClick={() => goTab('settings')} style={{ background: `linear-gradient(135deg,${G}15,#16a34a08)`, border: `1.5px solid ${G}35`, borderRadius: 16, padding: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 46, height: 46, background: G+'20', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>📱</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#f1f5f9', marginBottom: 3 }}>Connect WhatsApp API</div>
            <div style={{ fontSize: 12, color: '#4b5563', lineHeight: 1.5 }}>Tap here to enable automatic sending</div>
          </div>
          <span style={{ color: G, fontSize: 18 }}>→</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
        {[
          { icon: '👥', label: 'Contacts',  value: contacts.length, col: '#38bdf8' },
          { icon: '📤', label: 'Sent',      value: totalSent,       col: G         },
          { icon: '📅', label: 'Today',     value: todayBc,         col: '#a78bfa' },
        ].map(s => (
          <Card key={s.label} style={{ textAlign: 'center', padding: '14px 8px' }}>
            <div style={{ fontSize: 22, marginBottom: 5 }}>{s.icon}</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: s.col, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 10, color: '#4b5563', marginTop: 4, textTransform: 'uppercase', letterSpacing: .5 }}>{s.label}</div>
          </Card>
        ))}
      </div>

      <Btn full onClick={() => goTab('send')} icon="💬" style={{ padding: '16px', fontSize: 15, boxShadow: `0 6px 28px ${G}55` }}>
        Start New Broadcast
      </Btn>

      {history.length > 0 && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#374151', letterSpacing: .8, textTransform: 'uppercase', marginBottom: 10 }}>Recent Broadcasts</div>
          <Card noPad>
            {history.slice(0, 5).map((h, i, arr) => (
              <div key={h.id || i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', borderBottom: i < arr.length-1 ? `1px solid ${BDR}` : 'none' }}>
                <div style={{ width: 38, height: 38, background: G+'18', border: `1px solid ${G}25`, borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, flexShrink: 0 }}>📤</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#cbd5e1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.broadcast_name || 'Broadcast'}</div>
                  <div style={{ fontSize: 11, color: '#374151', marginTop: 1 }}>{h.sent_count || 0} sent</div>
                </div>
                <div style={{ fontSize: 11, color: '#374151', flexShrink: 0 }}>{h.created_at ? new Date(h.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : ''}</div>
              </div>
            ))}
          </Card>
        </div>
      )}

      {history.length === 0 && contacts.length === 0 && (
        <div style={{ textAlign: 'center', padding: '30px 20px' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🚀</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0', marginBottom: 6 }}>Welcome to WaBroadcast!</div>
          <div style={{ fontSize: 12, color: '#4b5563', lineHeight: 1.7 }}>Add contacts, then send your first broadcast.</div>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// SEND TAB
// ═══════════════════════════════════════════════════════════════════
function SendTab({ profile, contacts, onBroadcastDone, notify, goTab }) {
  const [step,   setStep]   = useState(0)
  const [msg,    setMsg]    = useState('')
  const [bName,  setBName]  = useState('')
  const [selIds, setSelIds] = useState([])
  const [search, setSearch] = useState('')
  const [busy,   setBusy]   = useState(false)
  const [waIdx,  setWaIdx]  = useState(0)
  const [result, setResult] = useState(null)
  const taRef = useRef()

  const selC     = useMemo(() => contacts.filter(c => selIds.includes(c.id)), [contacts, selIds])
  const filtered = useMemo(() => contacts.filter(c => (c.name+c.phone).toLowerCase().includes(search.toLowerCase())), [contacts, search])
  const apiReady = !!profile?.wa_verified && !!API

  function insertText(t) {
    const ta = taRef.current
    if (ta) { const s = ta.selectionStart ?? msg.length; setMsg(m => m.slice(0,s)+t+m.slice(s)) }
    else setMsg(m => m+t)
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
    } catch (e) { notify(e.message, 'err'); setStep(2) }
    setBusy(false)
  }

  function openWA() {
    if (waIdx >= selC.length) {
      const entry = { broadcast_name: bName || `Broadcast ${todayStr()}`, contact_count: selC.length, sent_count: waIdx, failed_count: 0, created_at: new Date().toISOString() }
      onBroadcastDone(entry, waIdx)
      setResult({ sent: waIdx, failed: 0, total: selC.length }); setStep(5); return
    }
    const c = selC[waIdx]
    window.open(`https://wa.me/${c.phone}?text=${encodeURIComponent(hydrate(msg, c))}`, '_blank', 'noopener')
    setWaIdx(i => i+1)
  }

  if (step === 0) return (
    <div style={{ padding: '16px 16px 24px', display: 'flex', flexDirection: 'column', gap: 16, animation: 'pop .22s ease' }}>
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 900, color: '#f1f5f9', margin: '0 0 3px' }}>New Broadcast</h2>
        <p style={{ fontSize: 12, color: '#4b5563', margin: 0 }}>Write your message and send to everyone</p>
      </div>

      <div style={{ background: apiReady ? G+'12' : '#fbbf2412', border: `1px solid ${apiReady ? G+'30' : '#fbbf2430'}`, borderRadius: 10, padding: '10px 14px', fontSize: 12, color: apiReady ? G : '#fbbf24', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 16 }}>{apiReady ? '⚡' : '📱'}</span>
        {apiReady ? 'Auto mode — sends in background instantly' : 'Manual mode — WhatsApp opens for each contact'}
        {!apiReady && <span onClick={() => goTab('settings')} style={{ marginLeft: 'auto', fontSize: 11, color: G, cursor: 'pointer', fontWeight: 700 }}>Connect API</span>}
      </div>

      <Field label="Broadcast Name (optional)" placeholder="e.g. Diwali Offer 2025" value={bName} onChange={setBName} />

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#4b5563', letterSpacing: .8, textTransform: 'uppercase' }}>Message</div>
          <div style={{ fontSize: 11, color: msg.length > 900 ? '#fbbf24' : '#374151' }}>{msg.length}/1000</div>
        </div>
        <div style={{ display: 'flex', gap: 7, marginBottom: 9, flexWrap: 'wrap' }}>
          {['{name}','{firstname}','{phone}'].map(v => (
            <div key={v} onClick={() => insertText(v)} style={{ background: G+'15', border: `1px solid ${G}30`, borderRadius: 8, padding: '4px 10px', fontSize: 11, fontWeight: 700, color: G, cursor: 'pointer' }}>{v}</div>
          ))}
          <div onClick={() => insertText('😊')} style={{ background: '#fbbf2415', border: '1px solid #fbbf2430', borderRadius: 8, padding: '4px 10px', fontSize: 11, fontWeight: 700, color: '#fbbf24', cursor: 'pointer' }}>Emoji</div>
        </div>
        <textarea ref={taRef} value={msg} onChange={e => setMsg(e.target.value)} maxLength={1000} rows={7}
          placeholder={'Hi {name}! 👋\n\nWe have a special offer for you.\n\nReply YES to know more!\n\nThanks'}
          style={{ width: '100%', background: CARD, border: `1.5px solid ${BDR}`, borderRadius: 12, padding: '12px 14px', color: '#e2e8f0', fontSize: 13, fontFamily: 'inherit', outline: 'none', resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.7 }} />
        <div style={{ fontSize: 11, color: '#374151', marginTop: 5 }}>Tip: {'{name}'} is replaced with each person's name automatically</div>
      </div>

      {contacts.length === 0
        ? <div style={{ background: '#fbbf2412', border: '1px solid #fbbf2430', borderRadius: 12, padding: '13px 16px', fontSize: 13, color: '#fbbf24', display: 'flex', alignItems: 'center', gap: 10 }}>
            No contacts yet.
            <span onClick={() => goTab('contacts')} style={{ fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}>Add contacts first</span>
          </div>
        : <Btn full onClick={() => { if (!msg.trim()) { notify('Please write a message first', 'warn'); return } setStep(1) }} icon="👥">Select Contacts</Btn>}
    </div>
  )

  if (step === 1) return (
    <div style={{ padding: '16px 16px 24px', display: 'flex', flexDirection: 'column', gap: 14, animation: 'pop .22s ease' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div onClick={() => setStep(0)} style={{ width: 36, height: 36, background: CARD, border: `1px solid ${BDR}`, borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 16 }}>←</div>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: '#f1f5f9', margin: 0 }}>Select Contacts</h2>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ background: G+'18', border: `1px solid ${G}30`, borderRadius: 9, padding: '5px 12px', fontSize: 12, fontWeight: 700, color: G }}>{selIds.length} selected</div>
        <div onClick={() => setSelIds(selIds.length === contacts.length ? [] : contacts.map(c => c.id))} style={{ fontSize: 12, color: G, cursor: 'pointer', fontWeight: 700 }}>
          {selIds.length === contacts.length ? 'Deselect All' : 'Select All'}
        </div>
      </div>
      <Field placeholder="Search contacts..." value={search} onChange={setSearch} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
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
      </div>
      {selIds.length > 0 && <Btn full onClick={() => setStep(2)} icon="✅">Review and Send to {selIds.length} people</Btn>}
    </div>
  )

  if (step === 2) return (
    <div style={{ padding: '16px 16px 24px', display: 'flex', flexDirection: 'column', gap: 16, animation: 'pop .22s ease' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div onClick={() => setStep(1)} style={{ width: 36, height: 36, background: CARD, border: `1px solid ${BDR}`, borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 16 }}>←</div>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: '#f1f5f9', margin: 0 }}>Ready to Send</h2>
      </div>
      <Card glow={G} style={{ background: `linear-gradient(135deg,${G}10,#16a34a06)` }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: '#f1f5f9', marginBottom: 6 }}>📤 {selIds.length} contacts selected</div>
        <div style={{ fontSize: 12, color: '#4b5563', lineHeight: 1.7 }}>
          {apiReady ? `Auto send — approx ${Math.ceil(selIds.length/50)} min` : 'Manual — WhatsApp opens per contact, tap Send each time'}
        </div>
      </Card>
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#374151', letterSpacing: .8, textTransform: 'uppercase', marginBottom: 9 }}>Preview</div>
        {selC.slice(0,2).map(c => (
          <Card key={c.id} style={{ marginBottom: 9 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 9 }}>
              <Av name={c.name} size={26} />
              <span style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0' }}>{c.name}</span>
            </div>
            <div style={{ background: '#071a0c', border: `1px solid ${G}20`, borderRadius: 10, borderTopLeftRadius: 2, padding: '10px 12px', fontSize: 12, color: '#e2e8f0', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
              {hydrate(msg, c)}
            </div>
          </Card>
        ))}
        {selC.length > 2 && <div style={{ textAlign: 'center', fontSize: 12, color: '#374151' }}>+ {selC.length-2} more contacts</div>}
      </div>
      {apiReady
        ? <Btn full loading={busy} onClick={autoSend} style={{ padding: 15, fontSize: 15 }}>Send to All {selIds.length} Now</Btn>
        : <Btn full onClick={() => { setWaIdx(0); setStep(4) }} style={{ padding: 15, fontSize: 15 }}>Start Manual Send</Btn>}
    </div>
  )

  if (step === 3) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24, padding: '80px 24px', textAlign: 'center' }}>
      <div style={{ width: 80, height: 80, background: G+'18', border: `2px solid ${G}40`, borderRadius: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spin size={36} color={G} />
      </div>
      <div>
        <h2 style={{ fontSize: 22, fontWeight: 900, color: '#f1f5f9', margin: '0 0 10px' }}>Sending Messages...</h2>
        <p style={{ fontSize: 13, color: '#4b5563', lineHeight: 1.8, margin: 0 }}>
          Sending to {selC.length} contacts.<br />Estimated: ~{Math.ceil(selC.length/50)} minute(s).<br />
          <span style={{ color: '#374151' }}>Keep this screen open.</span>
        </p>
      </div>
    </div>
  )

  if (step === 4) {
    const done = waIdx >= selC.length
    const curr = selC[waIdx]
    const pct  = Math.round((waIdx / Math.max(selC.length,1)) * 100)
    return (
      <div style={{ padding: '16px 16px 24px', display: 'flex', flexDirection: 'column', gap: 16, animation: 'pop .22s ease' }}>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: '#f1f5f9', margin: 0 }}>Sending...</h2>
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 13, color: '#6b7280' }}>Progress</span>
            <span style={{ fontSize: 14, fontWeight: 800, color: G }}>{waIdx} / {selC.length}</span>
          </div>
          <div style={{ background: BG, borderRadius: 8, height: 10, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg,${G},#22c55e)`, borderRadius: 8, transition: 'width .4s ease', boxShadow: `0 0 10px ${G}70` }} />
          </div>
          <div style={{ fontSize: 11, color: '#374151', marginTop: 7 }}>
            {waIdx === 0 ? 'Tap the button to begin' : done ? 'All done!' : `Sent to ${selC[waIdx-1]?.name} — tap Send in WhatsApp then come back`}
          </div>
        </Card>
        {!done && curr && (
          <Card glow={G} style={{ background: `linear-gradient(135deg,${G}10,#16a34a06)` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 13, marginBottom: 13 }}>
              <Av name={curr.name} size={52} />
              <div>
                <div style={{ fontSize: 17, fontWeight: 800, color: '#f1f5f9' }}>{curr.name}</div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>+{curr.phone}</div>
                <div style={{ fontSize: 11, color: '#374151', marginTop: 2 }}>Contact {waIdx+1} of {selC.length}</div>
              </div>
            </div>
            <div style={{ background: '#071a0c', border: `1px solid ${G}25`, borderRadius: 10, borderTopLeftRadius: 2, padding: '10px 12px', fontSize: 12, color: '#e2e8f0', lineHeight: 1.7, marginBottom: 13, whiteSpace: 'pre-wrap' }}>
              {hydrate(msg, curr)}
            </div>
            <Btn full onClick={openWA} style={{ padding: 14, fontSize: 15 }}>Open WhatsApp - Send ({waIdx+1}/{selC.length})</Btn>
          </Card>
        )}
        {done && (
          <Btn full onClick={() => {
            const entry = { broadcast_name: bName || `Broadcast ${todayStr()}`, contact_count: selC.length, sent_count: waIdx, failed_count: 0, created_at: new Date().toISOString() }
            onBroadcastDone(entry, waIdx); setResult({ sent: waIdx, failed: 0, total: selC.length }); setStep(5)
          }}>Mark as Complete</Btn>
        )}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 22, padding: '60px 24px', textAlign: 'center', animation: 'pop .25s ease' }}>
      <div style={{ width: 90, height: 90, background: G+'18', border: `2px solid ${G}`, borderRadius: 45, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 44, boxShadow: `0 0 40px ${G}40` }}>✓</div>
      <div>
        <h2 style={{ fontSize: 24, fontWeight: 900, color: '#f1f5f9', margin: '0 0 10px' }}>Broadcast Sent! 🎉</h2>
        {result && <div style={{ fontSize: 14, color: '#6b7280', lineHeight: 2 }}>
          <span style={{ color: G, fontWeight: 900, fontSize: 22 }}>{result.sent}</span> messages sent<br />
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
  const csvRef  = useRef()
  const fileRef = useRef()

  const filtered = useMemo(() => contacts.filter(c => (c.name+c.phone).toLowerCase().includes(search.toLowerCase())), [contacts, search])

  async function importPhone() {
    setLoading(true)
    try {
      if (!('contacts' in navigator)) { notify('Contact import is not supported on this browser. Please use the CSV import instead.', 'warn'); setLoading(false); return }
      const raw = await navigator.contacts.select(['name','tel'], { multiple: true })
      const exist = new Set(contacts.map(c => c.phone))
      const fresh = raw.flatMap(r => (r.tel||[]).map(t => ({ id: Date.now()+Math.random(), name: r.name?.[0]||'Unknown', phone: cleanPhone(t) }))).filter(c => c.phone && !exist.has(c.phone))
      await saveContacts([...contacts, ...fresh])
      notify(`${fresh.length} contacts imported`)
    } catch { notify('Could not import contacts', 'err') }
    setLoading(false)
  }

  function importCSV(e) {
    const file = e.target.files[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = async ev => {
      try {
        const lines = ev.target.result.split('\n').slice(1).filter(Boolean)
        const exist = new Set(contacts.map(c => c.phone))
        const fresh = lines.map(l => {
          const [name, phone] = l.split(',')
          return { id: Date.now()+Math.random(), name: (name||'').replace(/"/g,'').trim(), phone: cleanPhone((phone||'').replace(/"/g,'').trim()) }
        }).filter(c => c.name && c.phone.length >= 10 && !exist.has(c.phone))
        await saveContacts([...contacts, ...fresh])
        notify(`${fresh.length} contacts imported`)
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
        notify(`${fresh.length} contacts restored`)
      } catch { notify('Invalid backup file', 'err') }
    }
    reader.readAsText(file); e.target.value = ''
  }

  function exportCSV() {
    const rows = ['Name,Phone', ...contacts.map(c => `"${c.name}",${c.phone}`)].join('\n')
    const blob = new Blob([rows], { type: 'text/csv' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `contacts_${Date.now()}.csv`; a.click()
    notify('Contacts exported')
  }

  function validate() {
    const e = {}
    if (!form.name.trim()) e.name = 'Name is required'
    const p = form.phone.replace(/\D/g,'')
    if (p.length < 10 || p.length > 15) e.phone = 'Enter a valid phone number (10 digits)'
    return e
  }

  async function save() {
    const e = validate(); if (Object.keys(e).length) { setFerr(e); return }
    const phone = cleanPhone(form.phone)
    if (modal === 'new') {
      await saveContacts([...contacts, { id: Date.now(), name: form.name.trim(), phone }])
      notify('Contact added')
    } else {
      await saveContacts(contacts.map(c => c.id === modal ? { ...c, name: form.name.trim(), phone } : c))
      notify('Updated')
    }
    setModal(null); setFerr({})
  }

  const viewC = modal && modal !== 'new' ? contacts.find(c => c.id === modal) : null

  return (
    <div style={{ padding: '16px 16px 24px', display: 'flex', flexDirection: 'column', gap: 14, animation: 'pop .22s ease' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 900, color: '#f1f5f9', margin: '0 0 2px' }}>Contacts</h2>
          <p style={{ fontSize: 12, color: '#374151', margin: 0 }}>{contacts.length} total</p>
        </div>
        <Btn small onClick={() => { setForm({ name: '', phone: '' }); setFerr({}); setModal('new') }} icon="➕">Add</Btn>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
        {[
          { icon: '📱', label: 'From Phone',    sub: 'Import from your device', onClick: importPhone, loading },
          { icon: '📋', label: 'Import CSV',    sub: 'From Excel or Sheets',    onClick: () => csvRef.current?.click() },
          { icon: '📂', label: 'Restore',       sub: 'From backup file',        onClick: () => fileRef.current?.click() },
          { icon: '⬇️', label: 'Export CSV',    sub: 'Save to your device',     onClick: exportCSV },
        ].map(b => (
          <div key={b.label} onClick={b.onClick} style={{ background: CARD, border: `1px solid ${BDR}`, borderRadius: 13, padding: '13px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ fontSize: 22, flexShrink: 0 }}>{b.loading ? '⏳' : b.icon}</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0' }}>{b.label}</div>
              <div style={{ fontSize: 10, color: '#374151', marginTop: 2 }}>{b.sub}</div>
            </div>
          </div>
        ))}
      </div>
      <input ref={csvRef}  type="file" accept=".csv"  style={{ display: 'none' }} onChange={importCSV} />
      <input ref={fileRef} type="file" accept=".json" style={{ display: 'none' }} onChange={importJSON} />

      <Field placeholder="Search by name or number..." value={search} onChange={setSearch} />

      {filtered.length === 0
        ? <div style={{ textAlign: 'center', padding: '48px 20px', fontSize: 13, color: '#374151' }}>
            {contacts.length === 0 ? 'No contacts yet. Add manually or import from CSV.' : 'No contacts match your search.'}
          </div>
        : <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filtered.map(c => (
              <div key={c.id} onClick={() => { setForm({ name: c.name, phone: c.phone }); setFerr({}); setModal(c.id) }}
                style={{ display: 'flex', alignItems: 'center', gap: 12, background: CARD, border: `1.5px solid ${BDR}`, borderRadius: 14, padding: '12px 14px', cursor: 'pointer' }}>
                <Av name={c.name} size={44} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0' }}>{c.name}</div>
                  <div style={{ fontSize: 11, color: '#374151', marginTop: 1 }}>+{c.phone}</div>
                </div>
                <span style={{ color: '#1f2937', fontSize: 18 }}>›</span>
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
            <Field label="Name" placeholder="Full name" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} error={ferr.name} autoFocus />
            <Field label="Phone" placeholder="9876543210" value={form.phone} onChange={v => setForm(f => ({ ...f, phone: v }))} error={ferr.phone} hint="10-digit Indian number — 91 added automatically" type="tel" />
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
// FAQ ITEM — collapsible
// ═══════════════════════════════════════════════════════════════════
function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ background: CARD, border: `1.5px solid ${open ? '#38bdf840' : BDR}`, borderRadius: 14, overflow: 'hidden', transition: 'border .2s' }}>
      <div onClick={() => setOpen(o => !o)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', cursor: 'pointer' }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0', flex: 1, paddingRight: 10, lineHeight: 1.4 }}>{q}</span>
        <span style={{ color: open ? '#38bdf8' : '#374151', fontSize: 18, transition: 'transform .2s', transform: open ? 'rotate(90deg)' : 'none', flexShrink: 0 }}>›</span>
      </div>
      {open && (
        <div style={{ padding: '0 16px 14px', paddingTop: 12, fontSize: 12, color: '#6b7280', lineHeight: 1.7, borderTop: `1px solid ${BDR}` }}>
          {a}
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// SETTINGS TAB
// ═══════════════════════════════════════════════════════════════════
function SettingsTab({ user, profile, contacts, saveProfile, logout, notify }) {
  const [section,       setSection]       = useState('main')
  const [waTab,         setWaTab]         = useState('connect')
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
      notify(`Connected: ${result.phone}`)
      await saveProfile({ wa_phone_id: phoneId.trim(), wa_token: token.trim(), wa_number: result.phone, wa_verified: true })
      setSection('main')
    } catch (e) { notify(e.message, 'err') }
    setVerifying(false)
  }

  async function disconnectWA() {
    await saveProfile({ wa_phone_id: null, wa_token: null, wa_number: null, wa_verified: false })
    setPhoneId(''); setToken('')
    notify('WhatsApp disconnected')
  }

  async function saveProfileData() {
    await saveProfile(pf); setEditProfile(false); notify('Profile saved')
  }

  function exportContacts() {
    const blob = new Blob([JSON.stringify({ contacts, exportedAt: new Date().toISOString() }, null, 2)], { type: 'application/json' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `wab_backup_${Date.now()}.json`; a.click()
    notify('Backup downloaded')
  }

  function BackBtn({ label }) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
        <div onClick={() => setSection('main')} style={{ width: 34, height: 34, background: CARD, border: `1px solid ${BDR}`, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 16 }}>←</div>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: '#f1f5f9', margin: 0 }}>{label}</h2>
      </div>
    )
  }

  // ── About ──────────────────────────────────────────────────────
  if (section === 'about') return (
    <div style={{ padding: '16px 16px 32px', animation: 'pop .22s ease' }}>
      <BackBtn label="About WaBroadcast" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ textAlign: 'center', padding: '24px 16px', background: `linear-gradient(135deg,${G}15,#16a34a08)`, border: `1px solid ${G}25`, borderRadius: 18 }}>
          <div style={{ fontSize: 52, marginBottom: 10 }}>💬</div>
          <h2 style={{ fontSize: 22, fontWeight: 900, color: '#f1f5f9', margin: '0 0 8px' }}>WaBroadcast</h2>
          <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 12px', lineHeight: 1.7 }}>
            Send WhatsApp messages to hundreds of people at once. Completely free. No subscription needed ever.
          </p>
          <div style={{ display: 'inline-block', background: G+'20', border: `1px solid ${G}40`, borderRadius: 10, padding: '6px 16px', fontSize: 12, fontWeight: 700, color: G }}>
            100% Free
          </div>
        </div>

        <Card>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#f1f5f9', marginBottom: 12 }}>Who is this app for?</div>
          {[
            { icon: '🏪', text: 'Shop owners sending offers to customers' },
            { icon: '🏫', text: 'Teachers updating students and parents' },
            { icon: '💼', text: 'Small businesses doing promotions' },
            { icon: '🎉', text: 'Anyone sending event invitations' },
            { icon: '📢', text: 'Communities sharing news with members' },
          ].map(i => (
            <div key={i.text} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
              <span style={{ fontSize: 18, flexShrink: 0 }}>{i.icon}</span>
              <span style={{ fontSize: 12, color: '#9ca3af', lineHeight: 1.6 }}>{i.text}</span>
            </div>
          ))}
        </Card>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            { icon: '🆓', label: 'Always Free',  sub: 'No subscription' },
            { icon: '🔒', label: 'Private',      sub: 'Your data is yours' },
            { icon: '⚡', label: 'Fast',         sub: 'Send to 1000+ people' },
            { icon: '📱', label: 'Works on phone', sub: 'Android and Web' },
          ].map(f => (
            <Card key={f.label} style={{ textAlign: 'center', padding: '14px 10px' }}>
              <div style={{ fontSize: 26, marginBottom: 6 }}>{f.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9' }}>{f.label}</div>
              <div style={{ fontSize: 11, color: '#374151', marginTop: 3 }}>{f.sub}</div>
            </Card>
          ))}
        </div>

        <div style={{ background: '#0a1628', border: '1px solid #1e3a5f', borderRadius: 12, padding: '12px 14px', fontSize: 11, color: '#374151', lineHeight: 1.8, textAlign: 'center' }}>
          Made with love in India · Version 1.0
        </div>
      </div>
    </div>
  )

  // ── How to Use ─────────────────────────────────────────────────
  if (section === 'help') return (
    <div style={{ padding: '16px 16px 32px', animation: 'pop .22s ease' }}>
      <BackBtn label="How to Use" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Card>
          <div style={{ fontSize: 14, fontWeight: 800, color: G, marginBottom: 14 }}>5 Easy Steps to Get Started</div>
          {[
            { n:'1', t:'Create your account',      d:'Sign up free with your email and password.' },
            { n:'2', t:'Connect WhatsApp API',      d:'Settings → WhatsApp Connection → paste your API key. Without it you can still use manual mode.' },
            { n:'3', t:'Add your contacts',         d:'Contacts tab → Add manually, import from CSV, or import from your phone.' },
            { n:'4', t:'Write your message',        d:'Send tab → type your message. Use {name} to personalize each message automatically.' },
            { n:'5', t:'Select contacts and send!', d:'Choose who to send to, review, and tap Send. Done!' },
          ].map(s => (
            <div key={s.n} style={{ display: 'flex', gap: 12, marginBottom: 14, alignItems: 'flex-start' }}>
              <div style={{ width: 30, height: 30, background: G+'20', border: `1.5px solid ${G}40`, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 900, color: G, flexShrink: 0 }}>{s.n}</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9', marginBottom: 3 }}>{s.t}</div>
                <div style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.6 }}>{s.d}</div>
              </div>
            </div>
          ))}
        </Card>

        <Card>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#f1f5f9', marginBottom: 12 }}>Two Sending Modes</div>
          <div style={{ background: G+'10', border: `1px solid ${G}25`, borderRadius: 12, padding: '12px', marginBottom: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: G, marginBottom: 5 }}>Auto Mode (with API key)</div>
            <div style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.6 }}>Messages send automatically in background. You do not need to touch your phone. Needs WhatsApp Business API key.</div>
          </div>
          <div style={{ background: '#fbbf2410', border: '1px solid #fbbf2425', borderRadius: 12, padding: '12px' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#fbbf24', marginBottom: 5 }}>Manual Mode (no API needed)</div>
            <div style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.6 }}>WhatsApp opens per contact. You tap Send, come back, next person loads. Works with any normal WhatsApp number.</div>
          </div>
        </Card>

        {/* Safe usage warning for manual users */}
        <div style={{ background: '#1a0a00', border: '1.5px solid #f59e0b40', borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ background: 'linear-gradient(135deg,#f59e0b18,#d9770618)', padding: '13px 16px', borderBottom: '1px solid #f59e0b25', display: 'flex', alignItems: 'center', gap: 9 }}>
            <span style={{ fontSize: 20 }}>⚠️</span>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#fbbf24' }}>Important: Safe Usage Guide</div>
          </div>
          <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 12, color: '#9ca3af', lineHeight: 1.7 }}>
              If you are using <strong style={{ color: '#fbbf24' }}>Manual Mode</strong> (without a Business API), your messages are sent from your personal WhatsApp number. WhatsApp monitors all accounts for unusual activity. Please read this before sending.
            </div>
            {[
              { icon: '✅', col: G,         text: 'Send to 50 to 150 contacts per day for best safety' },
              { icon: '✅', col: G,         text: 'Only message people who know you or have agreed to receive messages' },
              { icon: '✅', col: G,         text: 'Spread your sends throughout the day — do not send all at once' },
              { icon: '✅', col: G,         text: 'Personalise messages using {name} so they feel individual' },
              { icon: '❌', col: '#ff6b6b', text: 'Do not send the exact same message to hundreds of people at once' },
              { icon: '❌', col: '#ff6b6b', text: 'Do not message unknown people who have not given you permission' },
              { icon: '❌', col: '#ff6b6b', text: 'Do not send promotional messages to purchased contact lists' },
            ].map(r => (
              <div key={r.text} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>{r.icon}</span>
                <span style={{ fontSize: 12, color: '#9ca3af', lineHeight: 1.5 }}>{r.text}</span>
              </div>
            ))}
            <div style={{ background: '#ff444412', border: '1px solid #ff444430', borderRadius: 10, padding: '10px 12px', fontSize: 11, color: '#ff6b6b', lineHeight: 1.7, marginTop: 4 }}>
              WhatsApp may temporarily restrict or ban accounts that are reported for spam. WaBroadcast is not responsible for account restrictions — you are sending from your own number. Use this app responsibly.
            </div>
          </div>
        </div>

        <Card>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#f1f5f9', marginBottom: 12 }}>Message Variables</div>
          <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 10, lineHeight: 1.6 }}>Use these to personalize each message automatically:</div>
          {[
            { v:'{name}',      d:'Full name — e.g. Rahul Sharma' },
            { v:'{firstname}', d:'First name — e.g. Rahul' },
            { v:'{phone}',     d:'Phone number — e.g. +919876543210' },
          ].map(r => (
            <div key={r.v} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 9 }}>
              <div style={{ background: G+'18', border: `1px solid ${G}30`, borderRadius: 8, padding: '4px 10px', fontSize: 11, fontWeight: 800, color: G, flexShrink: 0 }}>{r.v}</div>
              <span style={{ fontSize: 12, color: '#9ca3af' }}>{r.d}</span>
            </div>
          ))}
        </Card>

        <Card style={{ background: '#0a1628', border: '1px solid #1e3a5f' }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#38bdf8', marginBottom: 12 }}>How to Get WhatsApp API Key</div>
          <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 12, lineHeight: 1.6 }}>This is for Auto Mode. Free to apply but needs business verification.</div>
          {[
            { n:'1', t:'Go to developers.facebook.com',     s:'Sign in with your Facebook account' },
            { n:'2', t:'Create a new App, select Business', s:'Give it any name' },
            { n:'3', t:'Add WhatsApp product',              s:'Click + Add Product, then WhatsApp, then Set up' },
            { n:'4', t:'Verify your business',              s:'Upload GST or Udyam certificate. Takes 2 to 7 days.' },
            { n:'5', t:'Add a phone number',                s:'Must NOT already be on WhatsApp. New SIM works.' },
            { n:'6', t:'Copy your credentials',             s:'Phone Number ID and Token, paste in Settings' },
          ].map(s => (
            <div key={s.n} style={{ display: 'flex', gap: 10, marginBottom: 11, alignItems: 'flex-start' }}>
              <div style={{ width: 24, height: 24, background: '#38bdf820', border: '1px solid #38bdf830', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, color: '#38bdf8', flexShrink: 0 }}>{s.n}</div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0' }}>{s.t}</div>
                <div style={{ fontSize: 11, color: '#374151', marginTop: 2 }}>{s.s}</div>
              </div>
            </div>
          ))}
          <div style={{ background: '#38bdf810', border: '1px solid #38bdf820', borderRadius: 10, padding: '10px 12px', fontSize: 11, color: '#38bdf8', lineHeight: 1.6 }}>
            Free to get. Meta charges approximately Rs 0.88 per marketing conversation.
          </div>
        </Card>
      </div>
    </div>
  )

  // ── Privacy Policy ─────────────────────────────────────────────
  if (section === 'privacy') return (
    <div style={{ padding: '16px 16px 32px', animation: 'pop .22s ease' }}>
      <BackBtn label="Privacy Policy" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ background: G+'10', border: `1px solid ${G}25`, borderRadius: 12, padding: '12px 14px', fontSize: 12, color: G, lineHeight: 1.7 }}>
          Your privacy is important. WaBroadcast is built with a privacy-first approach.
        </div>
        {[
          { icon:'📋', title:'What data we collect', points:[
            'Your email address — used for login only',
            'Your contact list — stored in your own database',
            'Your broadcast history — stored in your account',
            'Your WhatsApp API key — stored securely, never shared',
          ]},
          { icon:'🚫', title:'What we do NOT do', points:[
            'We do not sell your data to anyone',
            'We do not read your messages',
            'We do not share your contacts with anyone',
            'We do not show ads inside the app',
            'We do not track your location or behaviour',
          ]},
          { icon:'🔐', title:'How your data is protected', points:[
            'All data stored with row-level security',
            'Your WhatsApp token is only used to send on your behalf',
            'HTTPS encryption on all connections',
            'You can delete everything at any time',
          ]},
          { icon:'👤', title:'Your rights', points:[
            'You own your data completely',
            'You can export all contacts any time',
            'You can delete your account by contacting us',
            'You can stop using the app any time',
          ]},
        ].map(sec => (
          <Card key={sec.title}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#f1f5f9', marginBottom: 10 }}>{sec.icon} {sec.title}</div>
            {sec.points.map(p => (
              <div key={p} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 7 }}>
                <span style={{ color: G, fontSize: 12, marginTop: 1, flexShrink: 0 }}>•</span>
                <span style={{ fontSize: 12, color: '#9ca3af', lineHeight: 1.6 }}>{p}</span>
              </div>
            ))}
          </Card>
        ))}
        <div style={{ background: '#0a1628', border: '1px solid #1e3a5f', borderRadius: 12, padding: '12px 14px', fontSize: 11, color: '#374151', lineHeight: 1.8, textAlign: 'center' }}>
          Last updated: March 2026
        </div>
      </div>
    </div>
  )

  // ── FAQ ────────────────────────────────────────────────────────
  if (section === 'faq') return (
    <div style={{ padding: '16px 16px 32px', animation: 'pop .22s ease' }}>
      <BackBtn label="FAQ" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[
          { q:'Is this app really free?',                   a:'Yes, 100% free. No subscription, no hidden charges, no limits.' },
          { q:'Do I need a WhatsApp Business account?',     a:'No. For manual mode any normal WhatsApp number works. For auto-sending you need a Meta API key but getting it is also free.' },
          { q:'How many people can I message at once?',     a:'There is no limit in WaBroadcast. However for manual mode we recommend sending to 50 to 150 contacts per day to keep your WhatsApp account safe. WhatsApp monitors personal accounts for spam activity.' },
          { q:'Will my WhatsApp account get banned?',       a:'Not if you use the app responsibly. Only message people who know you or have agreed to receive messages. Do not send to random or purchased contact lists. Spreading sends across the day is much safer than sending 500 messages all at once.' },
          { q:'Is my WhatsApp account safe?',               a:'Auto mode uses the official Meta API which is fully approved by WhatsApp. Manual mode opens WhatsApp normally using your personal number. Both are safe when used responsibly.' },
          { q:'What is auto mode vs manual mode?',          a:'Auto mode sends all messages in the background automatically. Manual mode opens WhatsApp for each contact and you tap Send yourself.' },
          { q:'How do I import from Excel?',                a:'Save your Excel file as CSV using File, Save As, CSV. Make sure column 1 is Name and column 2 is Phone. Then use Import CSV in Contacts.' },
          { q:'What happens to my data if I uninstall?',    a:'Your contacts and history are saved to the cloud. Sign back in on any device to restore everything.' },
          { q:'Can I use this without internet?',           a:'Internet is required to send messages and sync data.' },
          { q:'How do I delete my account?',                a:'Contact us and we will delete all your data within 7 days.' },
        ].map((item, i) => <FaqItem key={i} q={item.q} a={item.a} />)}
      </div>
    </div>
  )

  // ── WhatsApp Connect ───────────────────────────────────────────
  if (section === 'wa') return (
    <div style={{ padding: '16px 16px 32px', animation: 'pop .22s ease' }}>
      <BackBtn label="WhatsApp Connection" />
      {profile?.wa_verified
        ? <Card glow={G} style={{ background: `linear-gradient(135deg,${G}10,#16a34a06)` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <div style={{ width: 46, height: 46, background: G+'20', border: `1.5px solid ${G}35`, borderRadius: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>💬</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#f1f5f9' }}>WhatsApp Connected</div>
                <div style={{ fontSize: 12, color: '#4b5563', marginTop: 2 }}>{profile.wa_number || 'API active'}</div>
              </div>
              <div style={{ width: 10, height: 10, background: G, borderRadius: 5, boxShadow: `0 0 8px ${G}` }} />
            </div>
            <div style={{ background: G+'12', borderRadius: 10, padding: '9px 12px', fontSize: 12, color: G, marginBottom: 12, lineHeight: 1.6 }}>
              Auto mode active. Broadcasts send instantly without opening WhatsApp.
            </div>
            <Btn full v="danger" onClick={disconnectWA} icon="🔌">Disconnect</Btn>
          </Card>
        : <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Card style={{ border: '1.5px solid #fbbf2430', background: '#fbbf2408' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 28 }}>📱</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9' }}>Not Connected</div>
                  <div style={{ fontSize: 12, color: '#4b5563', lineHeight: 1.5, marginTop: 2 }}>Connect Meta API to send automatically. Manual mode works without it.</div>
                </div>
              </div>
            </Card>

            <div style={{ display: 'flex', background: BG, borderRadius: 11, padding: 4, gap: 4 }}>
              {[['connect','Enter API Key'],['guide','How to Get Key']].map(([id, label]) => (
                <div key={id} onClick={() => setWaTab(id)} style={{ flex: 1, textAlign: 'center', padding: '9px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 700, background: waTab === id ? G : 'transparent', color: waTab === id ? '#fff' : '#6b7280', transition: 'all .2s' }}>{label}</div>
              ))}
            </div>

            {waTab === 'connect' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <Field label="Phone Number ID" placeholder="123456789012345" value={phoneId} onChange={setPhoneId} hint="Meta Dashboard, WhatsApp, API Setup, Phone Number ID" />
                <Field label="Access Token" placeholder="EAAxxxxxxxxxxxxxxxxxx" value={token} onChange={setToken} hint="Meta Dashboard, WhatsApp, API Setup, Temporary or Permanent Token" type="password" />
                <Btn full loading={verifying} onClick={verifyAPI} icon="🔗">Verify and Connect</Btn>
                <div style={{ fontSize: 11, color: '#374151', textAlign: 'center', lineHeight: 1.6 }}>Your token is stored securely. We never share it.</div>
              </div>
            )}

            {waTab === 'guide' && (
              <Card style={{ background: '#0a1628', border: '1px solid #1e3a5f' }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#38bdf8', marginBottom: 12 }}>Steps to Get API Key</div>
                {[
                  { n:'1', t:'Go to developers.facebook.com', s:'Sign in with Facebook' },
                  { n:'2', t:'Create App, select Business',   s:'Any name works' },
                  { n:'3', t:'Add WhatsApp product',          s:'+ Add Product, WhatsApp, Set up' },
                  { n:'4', t:'Verify your business',          s:'GST or Udyam — takes 2 to 7 days' },
                  { n:'5', t:'Add phone number',              s:'Must not be on WhatsApp already' },
                  { n:'6', t:'Copy credentials',              s:'Phone Number ID and Token, paste above' },
                ].map(s => (
                  <div key={s.n} style={{ display: 'flex', gap: 10, marginBottom: 11, alignItems: 'flex-start' }}>
                    <div style={{ width: 24, height: 24, background: G+'18', border: `1px solid ${G}30`, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, color: G, flexShrink: 0 }}>{s.n}</div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0' }}>{s.t}</div>
                      <div style={{ fontSize: 11, color: '#374151', marginTop: 2 }}>{s.s}</div>
                    </div>
                  </div>
                ))}
                <div style={{ background: G+'10', border: `1px solid ${G}20`, borderRadius: 10, padding: '9px 12px', fontSize: 11, color: G, lineHeight: 1.6 }}>
                  Free to get. Meta charges Rs 0.88 per marketing conversation.
                </div>
              </Card>
            )}
          </div>}
    </div>
  )

  // ── Main Settings ──────────────────────────────────────────────
  return (
    <div style={{ padding: '16px 16px 32px', display: 'flex', flexDirection: 'column', gap: 16, animation: 'pop .22s ease' }}>
      <h2 style={{ fontSize: 20, fontWeight: 900, color: '#f1f5f9', margin: 0 }}>Settings</h2>

      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#374151', letterSpacing: .8, textTransform: 'uppercase', marginBottom: 10 }}>WhatsApp</div>
        <div onClick={() => setSection('wa')} style={{ background: CARD, border: `1.5px solid ${profile?.wa_verified ? G+'40' : BDR}`, borderRadius: 14, padding: '14px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, background: profile?.wa_verified ? G+'20' : '#1e293b', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>💬</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9' }}>WhatsApp Connection</div>
              <div style={{ fontSize: 11, color: profile?.wa_verified ? G : '#4b5563', marginTop: 2 }}>{profile?.wa_verified ? `Connected — ${profile.wa_number || 'API active'}` : 'Not connected — tap to connect'}</div>
            </div>
          </div>
          <span style={{ color: '#374151', fontSize: 18 }}>›</span>
        </div>
      </div>

      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#374151', letterSpacing: .8, textTransform: 'uppercase', marginBottom: 10 }}>Profile</div>
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: 13, marginBottom: 14 }}>
            <Av name={profile?.full_name || 'User'} size={52} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#f1f5f9' }}>{profile?.full_name || 'User'}</div>
              <div style={{ fontSize: 12, color: '#4b5563', marginTop: 2 }}>{user?.email}</div>
            </div>
            <div onClick={() => setEditProfile(p => !p)} style={{ width: 34, height: 34, background: editProfile ? G+'20' : CARD, border: `1px solid ${editProfile ? G+'40' : BDR}`, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 15 }}>
              {editProfile ? '✓' : '✏️'}
            </div>
          </div>
          {editProfile
            ? <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
                <Field label="Full Name"     value={pf.full_name}     onChange={v => setPf(p => ({ ...p, full_name: v }))}     placeholder="Your full name" />
                <Field label="Business Name" value={pf.business_name} onChange={v => setPf(p => ({ ...p, business_name: v }))} placeholder="Your shop or business name" />
                <Field label="Phone"         value={pf.phone}         onChange={v => setPf(p => ({ ...p, phone: v }))}         placeholder="+91 XXXXX XXXXX" type="tel" />
                <Btn full onClick={saveProfileData} icon="✅">Save Profile</Btn>
              </div>
            : <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {[['Business', profile?.business_name||'—'],['Phone', profile?.phone||'—']].map(([k,v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: '#4b5563' }}>{k}</span>
                    <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{v}</span>
                  </div>
                ))}
              </div>}
        </Card>
      </div>

      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#374151', letterSpacing: .8, textTransform: 'uppercase', marginBottom: 10 }}>Data and Backup</div>
        <Btn full v="ghost" onClick={exportContacts} icon="⬇️" style={{ marginBottom: 8 }}>Download Contacts Backup ({contacts.length})</Btn>
        <div style={{ background: '#0a1628', border: '1px solid #1e3a5f', borderRadius: 12, padding: '11px 14px', fontSize: 11, color: '#374151', lineHeight: 1.7 }}>
          Contacts and history saved to cloud. Sign in on any device to restore everything.
        </div>
      </div>

      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#374151', letterSpacing: .8, textTransform: 'uppercase', marginBottom: 10 }}>Help and Info</div>
        <Card noPad>
          {[
            { icon:'❓', label:'How to Use',         sub:'Step by step guide',     id:'help'    },
            { icon:'🏢', label:'About WaBroadcast',  sub:'What is this app',        id:'about'   },
            { icon:'🔒', label:'Privacy Policy',      sub:'How we handle your data', id:'privacy' },
            { icon:'💬', label:'FAQ',                 sub:'Common questions',        id:'faq'     },
          ].map((item, i, arr) => (
            <div key={item.id} onClick={() => setSection(item.id)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderBottom: i < arr.length-1 ? `1px solid ${BDR}` : 'none', cursor: 'pointer' }}>
              <div style={{ width: 38, height: 38, background: '#1e293b', borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{item.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9' }}>{item.label}</div>
                <div style={{ fontSize: 11, color: '#374151', marginTop: 1 }}>{item.sub}</div>
              </div>
              <span style={{ color: '#374151', fontSize: 18 }}>›</span>
            </div>
          ))}
        </Card>
      </div>

      <Btn full v="danger" onClick={() => setConfirmLogout(true)} icon="🚪">Sign Out</Btn>

      {confirmLogout && (
        <Sheet title="Sign Out?" onClose={() => setConfirmLogout(false)}>
          <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.7, marginBottom: 16 }}>
            Your contacts and history are saved in the cloud. Sign back in any time to restore everything.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            <Btn full v="danger" onClick={logout} icon="🚪">Yes, Sign Out</Btn>
            <Btn full v="ghost" onClick={() => setConfirmLogout(false)}>Cancel</Btn>
          </div>
        </Sheet>
      )}
    </div>
  )
}
