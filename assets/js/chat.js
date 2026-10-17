/* ============================================================
   Dentiva Universal AI Chat Widget v1.0
   Drop-in widget for any website. Powered by Gemini via Netlify.
   Usage:
   <script src="chat.js"
     data-site="dentiva"
     data-name="Dentiva Assistant"
     data-color="#0d7377"
     data-greeting="Hello! How can I help you today?">
   </script>
   ============================================================ */
(function () {
  'use strict';

  const s = document.currentScript;
  if (!s) return;

  const CFG = {
    siteId:   s.dataset.site   || 'default',
    name:     s.dataset.name   || 'Dentiva chat',
    color:    s.dataset.color  || '#0d7377',
    context:  s.dataset.context|| '',
    greeting: s.dataset.greeting|| 'Hello! How can I help you today?',
    endpoint: s.dataset.endpoint || '/api/chat'
  };

  // Prevent duplicate widget instances
  if (document.getElementById('dentivaChatRoot')) return;

  /* Styles live in the page stylesheet (assets/css) scoped under .dentiva-site;
     nothing is injected here so the site CSP (style-src 'self') allows them. */

  /* ============ DOM ============ */
  const root = document.createElement('div');
  root.id = 'dentivaChatRoot';
  root.innerHTML = `
    <button class="dc-btn" id="dcBtn" aria-label="Open chat">
      <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 3c-5 0-9 3-9 8 0 2 1 4 3 6l-1 4 4-3c1 1 2 1 3 1 5 0 9-3 9-8s-4-8-9-8Z"/></svg>
      <span class="dc-dot" aria-hidden="true"></span>
    </button>
    <div class="dc-win" id="dcWin" role="dialog" aria-label="${CFG.name}">
      <div class="dc-head">
        <div class="dc-av"><svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 3c-5 0-9 3-9 8 0 2 1 4 3 6l-1 4 4-3c1 1 2 1 3 1 5 0 9-3 9-8s-4-8-9-8Z"/></svg></div>
        <div class="dc-info">
          <h4>${CFG.name}</h4>
          <span id="dcMode">Website FAQ · Offline mode</span>
        </div>
        <button class="dc-close" id="dcClose" aria-label="Close chat">
          ×
        </button>
      </div>
      <div class="dc-msgs" id="dcMsgs" role="log" aria-live="off">
        <div class="dc-msg bot">
          <div class="dc-bubble">Hello! Ask a website question or choose a topic below. Website FAQ mode uses predefined answers. Please do not share private health information.</div>
        </div>
      </div>
      <div class="dc-sr" id="dcAnnouncement" role="status" aria-live="polite" aria-atomic="true"></div><div class="dc-quick" id="dcQuick">
        <button data-q="Book appointment">📅 Book appointment</button>
        <button data-q="What are your hours?">🕐 Hours</button>
        <button data-q="Your services">🦷 Services</button>
        <button data-q="Where are you located?">📍 Location</button>
      </div>
      <div class="dc-input">
        <input type="text" maxlength="500" id="dcInp" placeholder="Ask a website question..." aria-label="Chat message">
        <button id="dcSend" aria-label="Send message">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="m2 3 20 9-20 9 4-9-4-9Zm5 8-1 1 1 1h9v-2H7Z"/></svg>
        </button>
      </div>
    </div>
  `;
  (document.querySelector('.dentiva-site')||document.body).appendChild(root);

  const btn = document.getElementById('dcBtn');
  const win = document.getElementById('dcWin');
  const closeBtn = document.getElementById('dcClose');
  const msgs = document.getElementById('dcMsgs');
  const inp = document.getElementById('dcInp');
  const send = document.getElementById('dcSend');
  const quick = document.getElementById('dcQuick');

  /* ============ STATE ============ */
  let history = [];
  let busy = false;

  /* ============ ACTIONS ============ */
  btn.addEventListener('click', () => {
    win.classList.toggle('open');btn.setAttribute('aria-expanded',String(win.classList.contains('open')));
    if (win.classList.contains('open')) setTimeout(() => inp.focus(), 100);
  });
  closeBtn.addEventListener('click', () => {win.classList.remove('open');btn.focus();});
  win.addEventListener('keydown',e=>{if(e.key==='Escape'){win.classList.remove('open');btn.focus()}if(e.key==='Tab'){const els=[...win.querySelectorAll('button,input')].filter(x=>!x.disabled);if(e.shiftKey&&document.activeElement===els[0]){e.preventDefault();els.at(-1).focus()}else if(!e.shiftKey&&document.activeElement===els.at(-1)){e.preventDefault();els[0].focus()}}});

  function addMsg(text, who) {
    const m = document.createElement('div');
    m.className = 'dc-msg ' + who;
    const b = document.createElement('div');
    b.className = 'dc-bubble';
    b.textContent = text;
    m.appendChild(b);
    msgs.appendChild(m);
    msgs.scrollTop = msgs.scrollHeight;
    return b;
  }

  function showTyping() {
    const t = document.createElement('div');
    t.className = 'dc-msg bot';
    t.id = 'dcTyping';
    t.innerHTML = '<div class="dc-typing"><span></span><span></span><span></span></div>';
    msgs.appendChild(t);
    msgs.scrollTop = msgs.scrollHeight;
  }

  function hideTyping() {
    const t = document.getElementById('dcTyping');
    if (t) t.remove();
  }

  /* ============ FALLBACK (works without backend) ============ */
  function fallback(msg) { return window.DentivaFAQ.reply(msg); }
  /* ============ SEND TO BACKEND ============ */
  let mode='faq', endpointReady=false;
  const label=document.getElementById('dcMode');
  const setMode=(next,unavailable=false)=>{mode=next;label.textContent=next==='ai'?'AI mode · No live booking':unavailable?'Website FAQ · AI unavailable':'Website FAQ · Offline mode';};
  const initialization=fetch(CFG.endpoint,{headers:{Accept:'application/json'},signal:AbortSignal.timeout(4000)}).then(r=>{if(!r.ok)throw new Error();return r.json()}).then(data=>{endpointReady=true;setMode(data.mode==='ai'?'ai':'faq')}).catch(()=>setMode('faq'));
  quick.innerHTML='';window.DentivaFAQ.quick.forEach(topic=>{const b=document.createElement('button');b.textContent=topic;b.dataset.q=topic;quick.appendChild(b)});
  async function ask(msg) {
    if(busy)return;msg=String(msg||'').trim();if(!msg)return;
    busy=true;addMsg(msg,'user');inp.value='';send.disabled=true;inp.disabled=true;quick.querySelectorAll('button').forEach(b=>b.disabled=true);
    const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,start=Date.now();showTyping();document.getElementById('dcAnnouncement').textContent='Preparing reply';
    await initialization;
    let reply;
    try {
      if(!endpointReady||mode==='faq')reply=fallback(msg);
      else {
        const r=await fetch(CFG.endpoint,{method:'POST',headers:{'Content-Type':'application/json'},signal:AbortSignal.timeout(16000),body:JSON.stringify({message:msg,history:history.slice(-8)})});
        if(!r.ok)throw new Error();const data=await r.json();if(typeof data.reply!=='string'||!data.reply.trim())throw new Error();
        reply=data.reply;setMode(data.mode==='ai'?'ai':'faq',data.reason==='unavailable');
      }
    } catch {reply=fallback(msg);setMode('faq',true);}
    finally {await new Promise(r=>setTimeout(r,Math.max(0,(reduced?180:550)-(Date.now()-start))));hideTyping();const bubble=addMsg(reduced?reply:'','bot');if(!reduced){const chars=Array.from(reply),step=Math.max(3,Math.ceil(chars.length/35));for(let i=step;i<chars.length;i+=step){await new Promise(r=>setTimeout(r,28));bubble.textContent=chars.slice(0,i).join('');msgs.scrollTop=msgs.scrollHeight;}bubble.textContent=reply;}document.getElementById('dcAnnouncement').textContent=reply;quick.querySelectorAll('button').forEach(b=>b.disabled=false);history.push({role:'user',content:msg},{role:'assistant',content:reply});history=history.slice(-8);busy=false;send.disabled=false;inp.disabled=false;inp.focus();}
  }

  function escapeHtml(t) {
    return t.replace(/[&<>"']/g, c => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[c]));
  }

  /* ============ EVENTS ============ */
  send.addEventListener('click', () => ask(inp.value));
  inp.addEventListener('keypress', e => {
    if (e.key === 'Enter') { e.preventDefault(); ask(inp.value); }
  });
  quick.querySelectorAll('button').forEach(b => {
    b.addEventListener('click', () => ask(b.dataset.q));
  });

  /* ============ PUBLIC API ============ */
  window.DentivaChat = {
    open: () => win.classList.add('open'),
    close: () => win.classList.remove('open'),
    ask: ask
  };
})();