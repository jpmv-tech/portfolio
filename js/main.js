// Portfolio interactions: header nav, the sample-work viewer and copy-email.
// All sample data below is fictional.
(() => {
'use strict';

// ─── Data ─────────────────────────────────────────────────────────────────
const TX = [
  {id:1,date:'08/01',desc:'SYSCO FOODS #2231',amt:-1284.60,cat:'COGS: Food & Supplies'},
  {id:2,date:'08/02',desc:'SQUARE INC DEPOSIT',amt:3912.45,cat:'Sales: Café Revenue'},
  {id:3,date:'08/03',desc:'PG&E WEB ONLINE',amt:-412.18,cat:'Utilities: Gas & Electric'},
  {id:4,date:'08/05',desc:'GUSTO PAYROLL',amt:-6240.00,cat:'Payroll: Wages'},
  {id:5,date:'08/07',desc:'AMAZON MKTPLACE',amt:-86.39,cat:'Office Supplies',flag:'Receipt needed'},
  {id:6,date:'08/09',desc:'SQUARE INC DEPOSIT',amt:4108.20,cat:'Sales: Café Revenue'},
  {id:7,date:'08/12',desc:'LAKESIDE PROPERTY MGMT',amt:-3800.00,cat:'Rent'},
  {id:8,date:'08/15',desc:'RIDGELINE COFFEE ROASTERS',amt:-942.00,cat:'COGS: Coffee Beans'}];
const PAYEE = {1:'Sysco Foods',2:'Square deposit',3:'PG&E',4:'Gusto payroll',5:'Amazon',6:'Square deposit',7:'Lakeside Property Mgmt',8:'Ridgeline Coffee Roasters'};
const BEGIN = 17190.40, END = 12445.88;
const CHECK = [
  ['Bank and card feeds reviewed','Every transaction confirmed or flagged'],
  ['Checking ••4821 reconciled','Difference $0.00 against the 08/31 statement'],
  ['Receipts attached for expenses over $75','Missing items listed and requested'],
  ['Uncategorized balance is $0.00','Nothing left in suspense accounts'],
  ['Payroll matches the Gusto register','Wages and taxes tie to the payroll report'],
  ['Reports sent with notes','P&L and balance sheet, plus open questions']];
const EXP = [
  ['09/02','Adobe','Software',59.99,'Card ••1102',true],
  ['09/03','Shared desk day pass','Workspace',45.00,'Card ••1102',true],
  ['09/05','Staples','Office supplies',38.47,'Card ••1102',false],
  ['09/08','Comcast Business','Utilities',129.00,'ACH',true],
  ['09/10','Lyft','Travel',23.80,'Card ••1102',true],
  ['09/12','Figma','Software',45.00,'Card ••1102',true],
  ['09/15','Client lunch, Tartine','Meals',64.20,'Card ••1102',false],
  ['09/18','Printful','Supplies',212.35,'Card ••1102',true],
  ['09/22','Amtrak','Travel',88.00,'Card ••1102',false],
  ['09/26','Google Workspace','Software',28.80,'Card ••1102',true]];
const BUDGET = {Software:150,Workspace:100,'Office supplies':60,Utilities:130,Travel:120,Meals:80,Supplies:200};
const MONTHS = {
  Jun:{long:'June 2026',rev:29870,cogs:9710,pay:12480,rent:3800,util:780,other:1500},
  Jul:{long:'July 2026',rev:31420,cogs:10054,pay:12480,rent:3800,util:842,other:1610,note:'Revenue rose 5.2% on June with longer summer hours. Utilities are up $62 from air conditioning. Gross margin held at 68%.'},
  Aug:{long:'August 2026',rev:33185,cogs:10620,pay:12480,rent:3800,util:911,other:1442,note:'Best month of the quarter. Weekend catering orders added about $1,400 in sales. Food and coffee costs grew in line with sales, so gross margin stayed at 68%.'},
  Sep:{long:'September 2026',rev:30960,cogs:9907,pay:13020,rent:3800,util:798,other:1965,note:'Sales fell 6.7% as summer traffic ended. Payroll rose $540 after a part-time barista started on 09/15. Other expenses include a one-time $480 espresso machine service.'}};
const ORDER = ['Jun','Jul','Aug','Sep'];
const PROJECTS = [
  ['qb','01','QuickBooks bookkeeping workflow','Review a month of bank transactions, reconcile checking and close the month.'],
  ['sheets','02','Google Sheets expense tracker','Log expenses with formulas that total by category and flag missing receipts.'],
  ['summary','03','Monthly financial summary','A one-page P&L summary with month-over-month changes and plain notes.']];

// ─── Helpers ──────────────────────────────────────────────────────────────
const f2 = n => Math.abs(n).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
const m2 = n => (n<0?'−$':'$')+f2(n);
const m0 = n => (n<0?'−$':'$')+Math.abs(Math.round(n)).toLocaleString('en-US');
const calc = d => {const gp=d.rev-d.cogs, opex=d.pay+d.rent+d.util+d.other; return {gp,opex,net:gp-opex,exp:d.cogs+opex};};
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ink = 'var(--color-text)', acc = 'var(--color-accent)', warn = 'var(--color-accent-700)';

// ─── State ────────────────────────────────────────────────────────────────
const state = {
  project:'qb', qbView:'review', sheetView:'log', month:'Aug', cat:'All',
  reviewed:{1:true,2:true,3:true}, cleared:{1:true,2:true,3:true,4:true,6:true,7:true}, checks:{0:true}
};
const set = patch => { Object.assign(state, patch); render(); };

// ─── Rendering ────────────────────────────────────────────────────────────
const $tabs = document.getElementById('project-tabs');
const $viewer = document.getElementById('viewer');
const $rail = document.getElementById('viewer-rail');
const $main = document.getElementById('viewer-main');

function railButtons(list, cur, key) {
  return list.map(([id,label,sub]) =>
    `<button type="button" class="rail-btn" aria-pressed="${id===cur}" data-action="rail" data-key="${key}" data-val="${esc(id)}">
      <span class="l">${esc(label)}</span><span class="s">${esc(sub)}</span></button>`).join('');
}

function renderReview() {
  const n = TX.filter(t => state.reviewed[t.id]).length, allDone = n === TX.length;
  const rows = TX.map(t => {
    const d = !!state.reviewed[t.id];
    return `<tr style="opacity:${d?0.62:1}">
      <td class="pl muted">${t.date}</td>
      <td style="font-size:13px;letter-spacing:0.02em">${esc(t.desc)}</td>
      <td class="r">${t.amt<0?f2(t.amt):''}</td>
      <td class="r">${t.amt>0?f2(t.amt):''}</td>
      <td><div style="display:flex;flex-wrap:wrap;gap:6px;align-items:center"><span>${esc(t.cat)}</span>${t.flag?`<span class="tag tag-accent tag-sm">${esc(t.flag)}</span>`:''}</div></td>
      <td class="pr r"><button type="button" class="btn ${d?'btn-secondary':'btn-primary'}" data-action="review" data-id="${t.id}" aria-label="${d?'Undo confirm ':'Confirm '}${esc(t.desc)}" style="min-height:36px;min-width:96px;font-size:13px">${d?'Confirmed':'Confirm'}</button></td>
    </tr>`;}).join('');
  return `<div class="box">
    <div class="box-bar"><div><strong>Checking ••4821</strong> · For review · <span class="num">${n} of 8 confirmed</span></div>
      <button type="button" class="btn btn-secondary" data-action="confirm-all" style="min-height:40px">${allDone?'Reset':'Confirm all'}</button></div>
    <div class="scroll-x"><table class="table num" style="min-width:760px">
      <thead><tr><th scope="col" class="pl">Date</th><th scope="col">Bank description</th><th scope="col" class="r">Spent</th><th scope="col" class="r">Received</th><th scope="col">Category</th><th scope="col" class="pr" aria-label="Action"></th></tr></thead>
      <tbody>${rows}</tbody></table></div></div>`;
}

function renderReconcile() {
  const clearedBal = BEGIN + TX.reduce((a,t) => a+(state.cleared[t.id]?t.amt:0), 0);
  const diff = Math.round((END-clearedBal)*100)/100, ok = Math.abs(diff) < 0.005;
  const remaining = TX.filter(t => !state.cleared[t.id]).length;
  const stats = [['Beginning balance',m2(BEGIN),ink],['Statement ending balance',m2(END),ink],['Cleared balance',m2(clearedBal),ink],['Difference',m2(ok?0:diff),ok?ink:warn]];
  const hint = ok ? 'Difference is $0.00. Ready to finish and save the reconciliation report.'
                  : `${remaining} item${remaining===1?'':'s'} not yet ticked. Keep matching to the statement.`;
  const rows = TX.map(t => `<tr>
      <td class="pl"><input type="checkbox" id="rc${t.id}" data-action="clear" data-id="${t.id}"${state.cleared[t.id]?' checked':''}></td>
      <td class="muted"><label for="rc${t.id}" style="cursor:pointer">${t.date}</label></td>
      <td><label for="rc${t.id}" style="cursor:pointer">${esc(PAYEE[t.id])}</label></td>
      <td class="r pr">${(t.amt<0?'−':'+')+f2(t.amt)}</td></tr>`).join('');
  return `<div class="box">
    <div class="stats">${stats.map(([l,v,c]) => `<div><div class="stat-label">${l}</div><div class="stat-val" style="color:${c}">${v}</div></div>`).join('')}</div>
    <div class="rec-banner" role="status" style="background:${ok?'var(--color-neutral-200)':'var(--color-accent-100)'}"><strong>${ok?'Balanced.':'Not balanced.'}</strong><span class="body-text">${hint}</span></div>
    <div class="scroll-x"><table class="table num" style="min-width:560px">
      <thead><tr><th scope="col" class="pl" style="width:48px">Cleared</th><th scope="col">Date</th><th scope="col">Payee</th><th scope="col" class="r pr">Amount</th></tr></thead>
      <tbody>${rows}</tbody></table></div></div>`;
}

function renderChecklist() {
  const done = CHECK.filter((_,i) => state.checks[i]).length;
  return `<div class="box">
    <div style="padding:14px 16px;border-bottom:2px solid var(--color-divider);display:flex;flex-direction:column;gap:10px">
      <div style="display:flex;justify-content:space-between;font-size:14px"><strong>August 2026 close</strong><span class="num">${done} of ${CHECK.length} complete</span></div>
      <div class="progress"><div style="width:${done/CHECK.length*100}%"></div></div>
    </div>
    ${CHECK.map(([label,note],i) => `<label class="check-row">
      <input type="checkbox" data-action="check" data-id="${i}"${state.checks[i]?' checked':''}>
      <span style="display:flex;flex-direction:column;gap:2px"><span style="font-weight:600;font-size:15px">${esc(label)}</span><span class="muted" style="font-size:13px">${esc(note)}</span></span>
    </label>`).join('')}</div>`;
}

function renderSheets() {
  const v = state.sheetView;
  const rows = EXP.map((e,i) => ({row:i+2,date:e[0],vendor:e[1],cat:e[2],n:e[3],method:e[4],has:e[5]}));
  const total = rows.reduce((a,r) => a+r.n, 0);
  let formula, body;
  if (v === 'log') {
    formula = state.cat==='All' ? 'D12  =SUM(D2:D11)' : `D12  =SUMIFS(D2:D11, C2:C11, "${state.cat}")`;
    const shown = state.cat==='All' ? rows : rows.filter(r => r.cat===state.cat);
    const cats = ['All', ...Object.keys(BUDGET)];
    const colHdr = ['A','B','C','D','E','F'].map(c => `<th class="hdr">${c}</th>`).join('');
    body = `<div class="chips" role="group" aria-label="Filter by category">
        ${cats.map(c => `<button type="button" class="chip" aria-pressed="${c===state.cat}" data-action="cat" data-val="${esc(c)}">${esc(c)}</button>`).join('')}</div>
      <div class="scroll-x"><table class="sheet">
        <thead><tr><th class="rownum"></th>${colHdr}</tr>
          <tr style="font-weight:600;text-align:left"><td class="rownum">1</td><td>Date</td><td>Vendor</td><td>Category</td><td class="r">Amount</td><td>Paid with</td><td>Receipt</td></tr></thead>
        <tbody>${shown.map(r => `<tr><td class="rownum">${r.row}</td><td>${r.date}</td><td>${esc(r.vendor)}</td><td>${esc(r.cat)}</td><td class="r">${f2(r.n)}</td><td>${esc(r.method)}</td>
            <td style="color:${r.has?ink:warn};font-weight:${r.has?400:600}">${r.has?'Yes':'Missing'}</td></tr>`).join('')}
          <tr class="total" style="font-weight:800"><td class="rownum">12</td><td colspan="3">${state.cat==='All'?'Total, September':'Total, '+esc(state.cat)}</td>
            <td class="r" style="background:var(--color-accent-100)">${f2(shown.reduce((a,r) => a+r.n, 0))}</td><td colspan="2"></td></tr>
        </tbody></table></div>`;
  } else if (v === 'cats') {
    formula = '=SUMIFS(Expenses!D:D, Expenses!C:C, A2) − B2';
    body = `<div style="padding:8px 16px 16px">${Object.keys(BUDGET).map(c => {
        const a = rows.filter(r => r.cat===c).reduce((x,r) => x+r.n, 0), b = BUDGET[c], over = a > b;
        return `<div class="cat-row"><div style="font-weight:600;font-size:14px">${esc(c)}</div>
          <div class="bar-track"><div style="width:${Math.min(100,a/b*100)}%;background:${over?acc:ink}"></div></div>
          <div style="font-size:13px;text-align:right">${m2(a)} / ${m0(b)} <span style="color:${over?warn:'var(--color-neutral-700)'};font-weight:600">${over?('+'+m2(a-b)+' over'):(m2(b-a)+' left')}</span></div></div>`;
      }).join('')}
      <div style="display:flex;justify-content:space-between;padding-top:14px;font-weight:800;font-size:15px" class="num"><span>September total</span><span>${m2(total)}</span></div></div>`;
  } else {
    formula = '=FILTER(Expenses!A2:F11, Expenses!F2:F11 = "Missing")';
    const missing = rows.filter(r => !r.has);
    body = `<div style="padding:16px;display:flex;flex-direction:column;gap:12px">
      <div style="display:flex;flex-wrap:wrap;gap:24px" class="num">
        <div><div class="stat-label">Missing receipts</div><div style="font-size:24px;font-weight:800">${missing.length}</div></div>
        <div><div class="stat-label">Amount without support</div><div style="font-size:24px;font-weight:800">${m2(missing.reduce((a,r) => a+r.n, 0))}</div></div>
      </div>
      <div style="border-top:2px solid var(--color-text)">${missing.map(m => `<div class="missing-row">
        <span><strong>${esc(m.vendor)}</strong><br><span class="muted" style="font-size:13px">${m.date} · ${esc(m.cat)}</span></span>
        <span class="r">${m2(m.n)}</span>
        <span style="font-size:13px;color:var(--color-accent-700)">${m.cat==='Meals'?'Ask owner for itemized receipt and attendees':'Request emailed receipt'}</span></div>`).join('')}</div></div>`;
  }
  return `<div class="box" style="font-size:13px">
    <div class="fx"><div class="fx-label">fx</div><div class="fx-val">${esc(formula)}</div></div>${body}</div>`;
}

function renderSummary() {
  const mi = ORDER.indexOf(state.month), cur = MONTHS[state.month], prev = MONTHS[ORDER[mi-1]], pShort = ORDER[mi-1];
  const c = calc(cur), pc = calc(prev);
  const pct = (a,b) => {const v=(a-b)/Math.abs(b)*100; return (v>=0?'+':'−')+Math.abs(v).toFixed(1)+'% vs '+pShort;};
  const good = 'var(--color-neutral-800)';
  const kpis = [
    ['Revenue', m0(cur.rev), pct(cur.rev,prev.rev), cur.rev>=prev.rev?good:warn],
    ['Gross margin', (c.gp/cur.rev*100).toFixed(1)+'%', m0(c.gp)+' gross profit', 'var(--color-neutral-700)'],
    ['Operating expenses', m0(c.opex), pct(c.opex,pc.opex), c.opex>pc.opex?warn:good],
    ['Net income', m0(c.net), (c.net-pc.net>=0?'+':'−')+m0(Math.abs(c.net-pc.net))+' vs '+pShort, c.net>=pc.net?good:warn]];
  const MAX = 36000;
  const bars = ORDER.map(k => {
    const d = MONTHS[k], cc = calc(d), sel = k===state.month, clickable = k!=='Jun';
    return `<button type="button" class="chart-col${sel?' sel':''}" data-action="month" data-val="${k}"${clickable?'':' disabled'} aria-pressed="${sel}" aria-label="${d.long}: revenue ${m0(d.rev)}, expenses ${m0(cc.exp)}">
      <span style="height:${d.rev/MAX*100}%;background:var(--color-text)"></span><span style="height:${cc.exp/MAX*100}%;background:var(--color-neutral-400)"></span></button>`;
  }).join('');
  const pl = [
    ['Revenue', m0(cur.rev), 600, 0, '2px solid var(--color-text)'],
    ['Cost of goods sold', m0(-cur.cogs), 400, 0],
    ['Gross profit', m0(c.gp), 800, 0],
    ['Payroll', m0(-cur.pay), 400, 12],
    ['Rent', m0(-cur.rent), 400, 12],
    ['Utilities', m0(-cur.util), 400, 12],
    ['Other operating', m0(-cur.other), 400, 12],
    ['Net income', m0(c.net), 800, 0, '2px solid var(--color-text)']];
  return `<div style="display:flex;flex-direction:column;gap:16px">
    <div class="box kpis">${kpis.map(([l,v,ch,col]) => `<div><div class="stat-label">${l}</div><div class="kpi-val">${v}</div><div style="font-size:12px;color:${col};font-weight:600">${ch}</div></div>`).join('')}</div>
    <div class="two-up">
      <div class="box" style="padding:16px">
        <div class="legend"><strong>Revenue vs. total expenses</strong><span class="keys"><span><span class="swatch" style="background:var(--color-text)"></span>Revenue</span><span><span class="swatch" style="background:var(--color-neutral-400)"></span>Expenses</span></span></div>
        <div class="chart">${bars}</div>
        <div class="chart-labels" aria-hidden="true">${ORDER.map(k => `<span class="${k===state.month?'sel':''}">${k}</span>`).join('')}</div>
      </div>
      <div class="box num" style="padding:16px">
        <div style="font-size:13px;margin-bottom:8px"><strong>Profit &amp; loss · ${cur.long}</strong></div>
        ${pl.map(([l,v,fw,ind,rule]) => `<div class="pl-row" style="padding-left:${ind}px;border-top:${rule||'1px solid var(--color-divider)'};font-weight:${fw}"><span>${l}</span><span>${v}</span></div>`).join('')}
      </div>
    </div>
    <div class="box" style="border-left:0"><div class="notes">
      <div class="eyebrow" style="font-size:12px;margin-bottom:4px">Notes for the owner</div>
      <p>${esc(cur.note)}</p></div></div></div>`;
}

function render() {
  const p = state.project;

  $tabs.innerHTML = PROJECTS.map(([id,n,title,blurb]) =>
    `<button type="button" role="tab" class="project-tab" id="tab-${id}" aria-selected="${id===p}" aria-controls="viewer" data-action="project" data-val="${id}">
      <span class="top"><span class="muted" style="font-size:12px">${n} · Practice project</span><span class="tag tag-outline tag-sm">Fictional data</span></span>
      <span class="title">${esc(title)}</span><span class="blurb">${esc(blurb)}</span></button>`).join('');
  $viewer.setAttribute('aria-labelledby', 'tab-'+p);

  let railTitle, rail, explain, company, title, panel;
  if (p === 'qb') {
    const v = state.qbView;
    railTitle = 'Workflow steps'; company = 'Harbor Lane Coffee Co. · QuickBooks Online (practice file)';
    rail = railButtons([['review','1. Review bank feed','Categorize each transaction'],['reconcile','2. Reconcile','Match to the bank statement'],['checklist','3. Close the month','Month-end checklist']], v, 'qbView');
    title = {review:'Bank feed · August 2026',reconcile:'Reconcile Checking ••4821 · Statement ending 08/31/2026',checklist:'Month-end checklist'}[v];
    explain = {review:'Each transaction gets a category before it posts. Anything without support, like the Amazon purchase, is flagged for a receipt instead of guessed. Click Confirm to accept a row.',
      reconcile:'Tick each item that appears on the bank statement. The reconciliation is only finished when the difference is exactly $0.00. Two items are still unticked.',
      checklist:'The same checklist every month, so nothing depends on memory and anyone can see where the close stands.'}[v];
    panel = {review:renderReview,reconcile:renderReconcile,checklist:renderChecklist}[v]();
  } else if (p === 'sheets') {
    const v = state.sheetView;
    railTitle = 'Sheet tabs'; company = 'Northfield Design Studio · Google Sheets (practice file)';
    rail = railButtons([['log','Expense log','Filter by category'],['cats','By category','Actual vs. budget'],['receipts','Missing receipts','Follow-up list']], v, 'sheetView');
    title = {log:'Expenses · September 2026',cats:'Spending by category · September 2026',receipts:'Receipts to collect'}[v];
    explain = {log:'Filter the log by category and watch the formula bar. Totals come from SUMIFS on the log, so they update as rows are added.',
      cats:'Each category is compared against its monthly budget. Overages are marked so they can be discussed before month-end.',
      receipts:'A FILTER formula pulls every row with no receipt into one list, so follow-up is a single message.'}[v];
    panel = renderSheets();
  } else {
    railTitle = 'Reporting month'; company = 'Harbor Lane Coffee Co. · Monthly summary (practice report)';
    rail = railButtons([['Jul','July 2026','Q3 · month 1'],['Aug','August 2026','Q3 · month 2'],['Sep','September 2026','Q3 · month 3']], state.month, 'month');
    title = 'Monthly financial summary · ' + MONTHS[state.month].long;
    explain = 'Switch months to see how the summary changes. Each figure is compared to the prior month, and the notes explain the largest movements in plain language.';
    panel = renderSummary();
  }

  $rail.innerHTML = `<div><div class="eyebrow" style="margin-bottom:10px">${railTitle}</div><div class="rail-list">${rail}</div></div>
    <div class="explain"><div class="eyebrow" style="margin-bottom:6px">What this shows</div><p>${esc(explain)}</p></div>`;
  $main.innerHTML = `<div class="panel-head"><div><div class="muted" style="font-size:12px">${esc(company)}</div><h3>${esc(title)}</h3></div>
    <span class="tag tag-accent">Illustrative mockup · fictional data</span></div>${panel}`;
}

// Re-rendering replaces the viewer's DOM, so put keyboard focus back on the matching control.
function focusKey(el) {
  return el && el.dataset && el.dataset.action ? [el.dataset.action, el.dataset.id||'', el.dataset.val||'', el.dataset.key||''].join('|') : null;
}
function restoreFocus(key) {
  if (!key) return;
  for (const el of document.querySelectorAll('#work [data-action]')) {
    if (focusKey(el) === key) { el.focus({preventScroll:true}); return; }
  }
}

function handle(el) {
  const {action, id, val, key} = el.dataset;
  switch (action) {
    case 'project': {
      set({project:val});
      const r = $viewer.getBoundingClientRect();
      if (r.top > window.innerHeight*0.6) window.scrollTo({top:r.top+window.scrollY-240, behavior:'smooth'});
      break;
    }
    case 'rail': set({[key]:val}); break;
    case 'review': set({reviewed:{...state.reviewed,[id]:!state.reviewed[id]}}); break;
    case 'confirm-all': {
      const allDone = TX.every(t => state.reviewed[t.id]);
      set({reviewed: allDone ? {} : Object.fromEntries(TX.map(t => [t.id,true]))});
      break;
    }
    case 'clear': set({cleared:{...state.cleared,[id]:el.checked}}); break;
    case 'check': set({checks:{...state.checks,[id]:el.checked}}); break;
    case 'cat': set({cat:val}); break;
    case 'month': set({month:val}); break;
  }
}

const $work = document.getElementById('work');
$work.addEventListener('click', e => {
  const el = e.target.closest('[data-action]');
  if (!el || el.type === 'checkbox') return;
  const k = focusKey(el); handle(el); restoreFocus(k);
});
$work.addEventListener('change', e => {
  const el = e.target;
  if (el.type !== 'checkbox' || !el.dataset.action) return;
  const k = focusKey(el); handle(el); restoreFocus(k);
});

render();

// ─── Header: smooth-scroll nav and mobile menu ────────────────────────────
const header = document.getElementById('site-header');
const toggle = document.getElementById('menu-toggle');
const setMenu = open => {
  header.classList.toggle('open', open);
  toggle.setAttribute('aria-expanded', String(open));
  document.getElementById('menu-label').textContent = open ? 'Close' : 'Menu';
  document.getElementById('menu-icon').setAttribute('d', open ? 'M18 6 6 18M6 6l12 12' : 'M4 7h16M4 12h16M4 17h16');
};
toggle.addEventListener('click', () => setMenu(!header.classList.contains('open')));
window.addEventListener('resize', () => { if (window.innerWidth >= 820) setMenu(false); });

document.querySelectorAll('[data-nav]').forEach(a => a.addEventListener('click', e => {
  e.preventDefault();
  setMenu(false);
  const id = a.dataset.nav, el = document.getElementById(id);
  if (!el) return;
  const top = id === 'top' ? 0 : el.getBoundingClientRect().top + window.scrollY - 64;
  window.scrollTo({top, behavior:'smooth'});
  history.replaceState(null, '', '#'+id);
}));

// ─── Copy email ───────────────────────────────────────────────────────────
const copyBtn = document.getElementById('copy-email');
let copyTimer;
copyBtn.addEventListener('click', () => {
  try { navigator.clipboard && navigator.clipboard.writeText('velasco.johnmarkm@gmail.com'); } catch (e) {}
  copyBtn.textContent = 'Copied';
  clearTimeout(copyTimer);
  copyTimer = setTimeout(() => { copyBtn.textContent = 'Copy email'; }, 2000);
});
})();
