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

  /* ============ STYLES ============ */
  const style = document.createElement('style');
  style.textContent = `
    #dentivaChatRoot{
      position:fixed;bottom:24px;right:24px;z-index:9999;
      font-family:-apple-system,BlinkMacSystemFont,'Inter','Segoe UI',sans-serif;
    }
    #dentivaChatRoot *{box-sizing:border-box}

    /* Toggle button */
    .dc-btn{
      width:60px;height:60px;border-radius:50%;
      background:linear-gradient(135deg,${CFG.color},#095b5e);
      color:#fff;border:none;font-size:1.5rem;cursor:pointer;
      box-shadow:0 12px 30px -6px rgba(13,115,119,.55);
      transition:transform .3s cubic-bezier(.22,1,.36,1),box-shadow .3s;
      display:flex;align-items:center;justify-content:center;
      position:relative;
    }
    .dc-btn:hover{transform:scale(1.08) translateY(-3px);box-shadow:0 18px 38px -6px rgba(13,115,119,.7)}
    .dc-btn .dc-dot{
      position:absolute;top:2px;right:2px;width:14px;height:14px;
      background:#22c55e;border-radius:50%;border:3px solid #fff;
      animation:dcPulse 2s infinite;
    }
    @keyframes dcPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.2)}}

    /* Window */
    .dc-win{
      position:fixed;bottom:96px;right:24px;
      width:380px;max-width:calc(100vw - 32px);
      height:560px;max-height:calc(100vh - 140px);
      background:#fff;border-radius:24px;
      box-shadow:0 30px 60px -15px rgba(0,0,0,.3);
      display:none;flex-direction:column;overflow:hidden;
      border:1px solid #e2eef0;
    }
    .dc-win.open{display:flex;animation:dcOpen .35s cubic-bezier(.22,1,.36,1)}
    @keyframes dcOpen{from{opacity:0;transform:translateY(16px) scale(.96)}to{opacity:1;transform:translateY(0) scale(1)}}

    /* Header */
    .dc-head{
      background:linear-gradient(135deg,#0a2e33,#0d4d52);
      color:#fff;padding:18px 20px;flex-shrink:0;display:flex;align-items:center;gap:12px;
    }
    .dc-head .dc-av{
      width:42px;height:42px;border-radius:50%;
      background:rgba(255,255,255,.15);
      display:flex;align-items:center;justify-content:center;font-size:1.2rem;
      flex-shrink:0;
    }
    .dc-head .dc-info{flex:1;min-width:0}
    .dc-head .dc-info h4{
      font-size:1rem;margin:0 0 2px;font-weight:600;
      white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
      color:#ffffff;
    }
    .dc-head .dc-info span{
      font-size:.78rem;color:#a8e6cf;
      display:flex;align-items:center;gap:6px;
    }
    .dc-head .dc-info span::before{
      content:'';width:7px;height:7px;background:#22c55e;
      border-radius:50%;display:inline-block;flex-shrink:0;
    }
    .dc-close{
      background:none;border:none;color:#fff;font-size:1.3rem;
      cursor:pointer;opacity:.9;padding:4px;min-width:44px;min-height:44px;transition:opacity .2s;
    }
    .dc-close:hover{opacity:1}

    /* Messages */
    .dc-msgs{
      flex:1;min-height:0;padding:18px;overflow-y:auto;
      background:#f7fafb;display:flex;flex-direction:column;gap:14px;
      scroll-behavior:smooth;
    }
    .dc-msgs::-webkit-scrollbar{width:6px}
    .dc-msgs::-webkit-scrollbar-thumb{background:#cde3ed;border-radius:3px}
    .dc-msg{display:flex;gap:8px;max-width:88%;animation:dcMsg .3s ease}
    @keyframes dcMsg{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
    .dc-msg.bot{align-self:flex-start}
    .dc-msg.user{align-self:flex-end;flex-direction:row-reverse}
    .dc-bubble{
      padding:11px 15px;border-radius:16px;
      font-size:.9rem;line-height:1.5;white-space:pre-wrap;word-wrap:break-word;overflow-wrap:break-word;
    }
    .dc-msg.bot .dc-bubble{
      background:#fff;color:#0a2e33;
      border-bottom-left-radius:4px;
      box-shadow:0 4px 12px rgba(0,0,0,.05);
    }
    .dc-msg.user .dc-bubble{
      background:${CFG.color};color:#fff;
      border-bottom-right-radius:4px;
    }
    .dc-bubble a{color:${CFG.color};font-weight:600;text-decoration:underline}
    .dc-msg.user .dc-bubble a{color:#fff}
    .dc-bubble strong{font-weight:600}
    .dc-bubble br{display:block;content:'';margin:4px 0}

    /* Typing */
    .dc-typing{
      display:flex;gap:4px;align-items:center;
      padding:12px 16px;background:#fff;border-radius:16px;
      border-bottom-left-radius:4px;box-shadow:0 4px 12px rgba(0,0,0,.05);
    }
    .dc-typing span{
      width:7px;height:7px;background:${CFG.color};border-radius:50%;
      animation:dcType 1.4s infinite;
    }
    .dc-typing span:nth-child(2){animation-delay:.2s}
    .dc-typing span:nth-child(3){animation-delay:.4s}
    @keyframes dcType{0%,60%,100%{transform:translateY(0);opacity:.4}30%{transform:translateY(-5px);opacity:1}}

    /* Quick actions */
    .dc-quick{
      display:flex;flex-wrap:wrap;gap:6px;
      padding:8px 18px 12px;background:#f7fafb;max-height:108px;overflow-y:auto;flex-shrink:0;
    }
    .dc-quick button{
      background:#fff;border:1.5px solid #e2eef0;color:${CFG.color};
      padding:7px 12px;min-height:44px;border-radius:18px;font-size:.78rem;font-weight:500;
      cursor:pointer;transition:all .2s;font-family:inherit;
    }
    .dc-quick button:hover{background:${CFG.color};color:#fff;border-color:${CFG.color}}

    /* Input */
    .dc-input{
      display:flex;flex-shrink:0;padding:14px 18px;background:#fff;
      border-top:1px solid #e2eef0;gap:8px;
    }
    .dc-input input{
      flex:1;padding:11px 16px;border-radius:24px;
      border:1.5px solid #e2eef0;font-family:inherit;font-size:16px;
      background:#f7fafb;outline:none;color:#0a2e33;min-width:0;
    }
    .dc-input input:focus{border-color:${CFG.color};background:#fff}
    .dc-input button{
      width:42px;height:42px;border-radius:50%;border:none;
      background:${CFG.color};color:#fff;font-size:1rem;cursor:pointer;
      transition:transform .2s,background .2s;flex-shrink:0;
      display:flex;align-items:center;justify-content:center;
    }
    .dc-input button:hover{transform:scale(1.05);background:#095b5e}

    @media(max-width:640px){
      #dentivaChatRoot{right:12px;bottom:12px}
      .dc-btn{width:56px;height:56px;font-size:1.3rem}
      .dc-win{right:12px;bottom:84px;width:calc(100vw - 24px);height:calc(100vh - 110px);max-height:none}
    }
  `;
  style.textContent+=`.dc-sr{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}.dc-quick button:disabled,.dc-input button:disabled{opacity:.55;cursor:default}@media(prefers-reduced-motion:reduce){.dc-typing span,.dc-msg,.dc-win{animation:none!important;transition:none!important}}`;
  document.head.appendChild(style);

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
  document.body.appendChild(root);

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