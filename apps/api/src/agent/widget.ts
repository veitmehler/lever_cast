/**
 * Chat-widget surfaces (.plans/chat-agent-v1.implementation-plan.md §4 C1).
 *
 * Two artifacts, both served by routes/agent.ts:
 *  - buildAgentPanelHtml(token): the chat PANEL — a self-contained page the
 *    loader iframes from svc.omniply.io, so /boot + /chat calls are
 *    same-origin (no CORS surface; same decision as the Spine Check).
 *    Themed at boot from the account's composed palette.
 *  - AGENT_LOADER_JS: the one-line-install loader —
 *    <script async src=".../api/agent/widget.js" data-omniply="TOKEN"></script>
 *    Injects the launcher bubble + iframe, toggles open/close, goes
 *    full-screen on mobile. One static file for every clinic (cacheable);
 *    the token rides on the script tag's data attribute.
 *
 * Tokens are validated server-side against [A-Za-z0-9_-]{16,64} before they
 * reach the template, so direct interpolation is safe.
 */

export function buildAgentPanelHtml(token: string): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Chat assistant</title>
<style>
  :root { --header:#0b2545; --btn:#2a6f97; --btnText:#fff; --accent:#2a6f97; }
  * { box-sizing: border-box; margin: 0; }
  html, body { height: 100%; }
  body { font: 15px/1.45 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: #fff; display: flex; flex-direction: column; color: #1c2430; }
  #hd { background: var(--header); color: #fff; padding: 14px 16px; display: flex; align-items: center; gap: 10px; flex: 0 0 auto; }
  #hd .t { font-weight: 600; font-size: 15px; flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  #hd .ai { font-size: 11px; opacity: .75; display: block; font-weight: 400; }
  #x { background: none; border: 0; color: #fff; font-size: 22px; line-height: 1; cursor: pointer; opacity: .8; padding: 4px; }
  #log { flex: 1 1 auto; overflow-y: auto; padding: 16px 14px; display: flex; flex-direction: column; gap: 10px; }
  .m { max-width: 85%; padding: 10px 13px; border-radius: 14px; white-space: pre-wrap; overflow-wrap: break-word; }
  .m.a { background: #f0f2f5; border-bottom-left-radius: 4px; align-self: flex-start; }
  .m.v { background: var(--btn); color: var(--btnText); border-bottom-right-radius: 4px; align-self: flex-end; }
  .m.card a { display: inline-block; background: var(--btn); color: var(--btnText); text-decoration: none; font-weight: 600; padding: 10px 16px; border-radius: 10px; }
  .m.card { background: none; padding: 4px 0; }
  #chips { display: flex; flex-wrap: wrap; gap: 8px; padding: 0 14px 10px; flex: 0 0 auto; }
  #chips button { border: 1.5px solid var(--btn); color: var(--btn); background: #fff; border-radius: 999px; padding: 7px 13px; font-size: 13px; cursor: pointer; }
  #bar { display: flex; gap: 8px; padding: 10px 14px; border-top: 1px solid #e6e9ee; flex: 0 0 auto; }
  #in { flex: 1; border: 1.5px solid #d5dae2; border-radius: 10px; padding: 10px 12px; font: inherit; outline: none; resize: none; max-height: 90px; }
  #in:focus { border-color: var(--btn); }
  #send { background: var(--btn); color: var(--btnText); border: 0; border-radius: 10px; padding: 0 16px; font-weight: 600; cursor: pointer; }
  #send:disabled { opacity: .5; cursor: default; }
  #foot { font-size: 11px; color: #7a8494; text-align: center; padding: 6px 14px 10px; flex: 0 0 auto; }
  .dots::after { content: '…'; animation: d 1.2s infinite; } @keyframes d { 0% { content: '.' } 33% { content: '..' } 66% { content: '...' } }
</style>
</head>
<body>
<div id="hd"><div class="t" id="pn">Chat<span class="ai">AI assistant</span></div><button id="x" aria-label="Close">×</button></div>
<div id="log" aria-live="polite"></div>
<div id="chips"></div>
<div id="bar"><textarea id="in" rows="1" placeholder="Type a message…" maxlength="600"></textarea><button id="send">Send</button></div>
<div id="foot"></div>
<script>
(function () {
  var TOKEN = '${token}';
  var API = '/api/agent';
  var log = document.getElementById('log'), chips = document.getElementById('chips');
  var input = document.getElementById('in'), send = document.getElementById('send');
  var vk = null;
  try {
    vk = localStorage.getItem('op-agent-vk');
    if (!vk) { vk = 'v' + Array.from(crypto.getRandomValues(new Uint8Array(12))).map(function (b) { return b.toString(16).padStart(2, '0'); }).join(''); localStorage.setItem('op-agent-vk', vk); }
  } catch (e) { vk = 'v' + Math.random().toString(36).slice(2, 14) + Math.random().toString(36).slice(2, 14); }
  var convKey = 'op-agent-conv-' + TOKEN.slice(0, 8);
  var conv = null;
  try { conv = sessionStorage.getItem(convKey); } catch (e) {}
  var busy = false, dead = false, cfg = null;

  function bubble(cls, text) {
    var d = document.createElement('div');
    d.className = 'm ' + cls;
    d.textContent = text;
    log.appendChild(d);
    log.scrollTop = log.scrollHeight;
    return d;
  }
  function bookingCard(url) {
    var d = document.createElement('div');
    d.className = 'm card';
    var a = document.createElement('a');
    a.href = url; a.target = '_blank'; a.rel = 'noopener';
    a.textContent = 'Open the booking page →';
    d.appendChild(a); log.appendChild(d); log.scrollTop = log.scrollHeight;
  }

  function setBusy(b) { busy = b; send.disabled = b || dead; input.disabled = dead; }

  function submit(text, isRetry) {
    text = (text || '').trim();
    if (!text || (busy && !isRetry) || dead) return;
    if (!isRetry) {
      chips.innerHTML = '';
      bubble('v', text);
      input.value = '';
      setBusy(true);
    }
    var typing = bubble('a dots', '');
    fetch(API + '/chat', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: TOKEN, visitorKey: vk, conversationId: conv, message: text })
    }).then(function (r) {
        if (r.status === 409 && !isRetry) {
          // Stale conversation reference (e.g. server-side reset) — drop it
          // and retry this message once on a fresh conversation.
          typing.remove();
          conv = null;
          try { sessionStorage.removeItem(convKey); } catch (e) {}
          submit(text, true);
          return null;
        }
        if (!r.ok) throw new Error('http ' + r.status);
        return r.json();
      })
      .then(function (t) {
        if (!t) return;
        typing.remove();
        conv = t.conversationId;
        try { sessionStorage.setItem(convKey, conv); } catch (e) {}
        bubble('a', t.reply);
        if (t.action && t.action.type === 'send_booking_link' && t.bookingUrl) bookingCard(t.bookingUrl);
        if (t.ended === 'turn-cap' || t.ended === 'abuse-ceiling') { dead = true; }
        setBusy(false);
      })
      .catch(function () {
        typing.remove();
        bubble('a', "Sorry — something went wrong. Please try again, or contact the practice directly.");
        setBusy(false);
      });
  }

  send.addEventListener('click', function () { submit(input.value); });
  input.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(input.value); } });
  document.getElementById('x').addEventListener('click', function () {
    if (window.parent !== window) window.parent.postMessage({ type: 'op-agent-close' }, '*');
  });

  fetch(API + '/boot?token=' + encodeURIComponent(TOKEN))
    .then(function (r) { if (!r.ok) throw new Error('boot ' + r.status); return r.json(); })
    .then(function (c) {
      cfg = c;
      var s = document.documentElement.style;
      s.setProperty('--header', c.theme.headerBg);
      s.setProperty('--btn', c.theme.buttonColor);
      s.setProperty('--btnText', c.theme.buttonTextColor);
      s.setProperty('--accent', c.theme.accent);
      document.getElementById('pn').innerHTML = '';
      var t = document.createTextNode(c.practiceName);
      var ai = document.createElement('span'); ai.className = 'ai'; ai.textContent = 'AI assistant';
      var pn = document.getElementById('pn'); pn.appendChild(t); pn.appendChild(ai);
      document.getElementById('foot').textContent = c.disclosure;
      bubble('a', c.greeting);
      c.chips.forEach(function (label) {
        var b = document.createElement('button');
        b.textContent = label;
        b.addEventListener('click', function () { submit(label); });
        chips.appendChild(b);
      });
      if (window.parent !== window) window.parent.postMessage({ type: 'op-agent-theme', headerBg: c.theme.headerBg }, '*');
    })
    .catch(function () { bubble('a', 'This assistant is not available right now. Please contact the practice directly.'); dead = true; setBusy(false); });
})();
</script>
</body>
</html>`
}

export const AGENT_LOADER_JS = `(function () {
  var s = document.currentScript;
  if (!s) return;
  var token = s.getAttribute('data-omniply');
  if (!token || !/^[A-Za-z0-9_-]{16,64}$/.test(token)) return;
  if (window.__opAgentLoaded) return; window.__opAgentLoaded = true;
  var base = new URL(s.src).origin;
  var open = false;

  var bub = document.createElement('button');
  bub.setAttribute('aria-label', 'Open chat assistant');
  bub.style.cssText = 'position:fixed;right:20px;bottom:20px;width:58px;height:58px;border-radius:50%;border:0;cursor:pointer;z-index:2147483000;background:#0b2545;box-shadow:0 4px 16px rgba(0,0,0,.25);display:flex;align-items:center;justify-content:center;padding:0;';
  bub.innerHTML = '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';

  var frame = document.createElement('iframe');
  frame.title = 'Chat assistant';
  frame.src = base + '/api/agent/w/' + token;
  frame.style.cssText = 'position:fixed;right:20px;bottom:90px;width:380px;height:600px;max-height:calc(100vh - 110px);border:0;border-radius:16px;box-shadow:0 8px 40px rgba(0,0,0,.28);z-index:2147483000;display:none;background:#fff;';

  function mobile() { return window.innerWidth < 480; }
  function layout() {
    if (!open) return;
    if (mobile()) frame.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;border:0;z-index:2147483001;display:block;background:#fff;';
    else frame.style.cssText = 'position:fixed;right:20px;bottom:90px;width:380px;height:600px;max-height:calc(100vh - 110px);border:0;border-radius:16px;box-shadow:0 8px 40px rgba(0,0,0,.28);z-index:2147483000;display:block;background:#fff;';
  }
  function toggle(to) {
    open = typeof to === 'boolean' ? to : !open;
    if (open) { layout(); bub.style.display = mobile() ? 'none' : 'flex'; }
    else { frame.style.display = 'none'; bub.style.display = 'flex'; }
  }
  bub.addEventListener('click', function () { toggle(); });
  window.addEventListener('resize', layout);
  window.addEventListener('message', function (e) {
    if (!e.data || e.source !== frame.contentWindow) return;
    if (e.data.type === 'op-agent-close') toggle(false);
    if (e.data.type === 'op-agent-theme' && e.data.headerBg) bub.style.background = String(e.data.headerBg).slice(0, 20);
  });

  function mount() { document.body.appendChild(bub); document.body.appendChild(frame); }
  if (document.body) mount(); else document.addEventListener('DOMContentLoaded', mount);
})();
`
