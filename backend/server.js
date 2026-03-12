// ================================================================
// WaBroadcast Backend — Express server
// Each user's WhatsApp API key is stored in Supabase.
// This server fetches the key and sends on their behalf.
// Deploy FREE on render.com
// ================================================================
import express from 'express'
import cors    from 'cors'
import fetch   from 'node-fetch'
import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const app = express()
app.use(express.json())
app.use(cors({ origin: '*' }))

const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
const WA = 'https://graph.facebook.com/v19.0'

// ── Auth middleware ─────────────────────────────────────────────
async function auth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Not logged in' })
  const { data: { user }, error } = await sb.auth.getUser(token)
  if (error || !user) return res.status(401).json({ error: 'Session expired' })
  req.userId = user.id
  next()
}

// ================================================================
// POST /api/verify-wa  — test if user's WhatsApp API key works
// Body: { phoneId, token }
// ================================================================
app.post('/api/verify-wa', auth, async (req, res) => {
  const { phoneId, token } = req.body
  if (!phoneId || !token) return res.status(400).json({ error: 'Phone ID and token required' })

  try {
    const r = await fetch(`${WA}/${phoneId}?fields=display_phone_number,verified_name,quality_rating`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const d = await r.json()
    if (d.error) return res.status(400).json({ error: d.error.message, code: d.error.code })

    // Save verified credentials to Supabase
    await sb.from('profiles').update({
      wa_phone_id: phoneId,
      wa_token:    token,
      wa_number:   d.display_phone_number,
      wa_verified: true,
    }).eq('id', req.userId)

    res.json({ ok: true, phone: d.display_phone_number, name: d.verified_name })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// ================================================================
// POST /api/broadcast  — send to all contacts using user's own key
// Body: { contacts, message, broadcastName }
// ================================================================
app.post('/api/broadcast', auth, async (req, res) => {
  const { contacts, message, broadcastName } = req.body
  if (!message?.trim())  return res.status(400).json({ error: 'Message is empty' })
  if (!contacts?.length) return res.status(400).json({ error: 'No contacts selected' })

  // Load user profile (need their WA credentials + plan)
  const { data: profile } = await sb.from('profiles').select('*').eq('id', req.userId).single()
  if (!profile)            return res.status(404).json({ error: 'Profile not found' })
  if (!profile.wa_token || !profile.wa_phone_id)
    return res.status(400).json({ error: 'WhatsApp API not connected. Please add your API key in Settings.' })

  // Check subscription limits
  const expired   = profile.plan_expires && new Date(profile.plan_expires) < new Date()
  const onFree    = !profile.plan || profile.plan === 'free' || expired
  const limit     = onFree ? 30 : (profile.msg_limit === -1 ? Infinity : profile.msg_limit)
  const used      = profile.msg_used || 0
  const remaining = limit === Infinity ? Infinity : Math.max(0, limit - used)

  if (remaining <= 0) return res.status(403).json({ error: 'Message limit reached. Please upgrade.' })

  const toSend = remaining === Infinity ? contacts : contacts.slice(0, remaining)

  // Send in batches
  let sent = 0, failed = 0
  const failures = []

  for (let i = 0; i < toSend.length; i += 50) {
    const batch = toSend.slice(i, i + 50)
    const results = await Promise.allSettled(
      batch.map(c => sendMsg(profile.wa_phone_id, profile.wa_token, c, message))
    )
    results.forEach((r, idx) => {
      if (r.status === 'fulfilled' && r.value.ok) { sent++ }
      else { failed++; failures.push({ name: batch[idx].name, reason: r.value?.err || 'Failed' }) }
    })
    if (i + 50 < toSend.length) await sleep(600)
  }

  // Save broadcast + update usage
  await sb.from('broadcasts').insert({
    user_id: req.userId, broadcast_name: broadcastName || 'Broadcast',
    contact_count: contacts.length, sent_count: sent, failed_count: failed,
  })
  await sb.from('profiles').update({ msg_used: used + sent }).eq('id', req.userId)

  res.json({ ok: true, sent, failed, total: contacts.length, failures: failures.slice(0, 10) })
})

// ── Send one message ────────────────────────────────────────────
async function sendMsg(phoneId, token, contact, template) {
  const text = template
    .replace(/{name}/gi, contact.name || '')
    .replace(/{firstname}/gi, (contact.name || '').split(' ')[0])
    .replace(/{phone}/gi, '+' + contact.phone)
    + '\n\n_Reply STOP to unsubscribe._'

  try {
    const r = await fetch(`${WA}/${phoneId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        messaging_product: 'whatsapp', recipient_type: 'individual',
        to: contact.phone, type: 'text',
        text: { preview_url: false, body: text }
      })
    })
    const d = await r.json()
    if (!r.ok) {
      const code = d.error?.code
      let err = d.error?.message || 'API error'
      if (code === 131026) err = 'Not on WhatsApp'
      if (code === 131021) err = 'Invalid number'
      if (code === 131047) err = 'Inactive number'
      return { ok: false, err }
    }
    return { ok: true }
  } catch (e) { return { ok: false, err: e.message } }
}

// ── Webhook (Meta delivery receipts) ───────────────────────────
app.get('/webhook', (req, res) => {
  if (req.query['hub.mode'] === 'subscribe' &&
      req.query['hub.verify_token'] === process.env.WA_WEBHOOK_TOKEN) {
    return res.send(req.query['hub.challenge'])
  }
  res.sendStatus(403)
})
app.post('/webhook', (req, res) => res.sendStatus(200))

app.get('/health', (_, res) => res.json({ ok: true, time: new Date().toISOString() }))

const sleep = ms => new Promise(r => setTimeout(r, ms))
app.listen(process.env.PORT || 3001, () => console.log('WaBroadcast backend running ✓'))
