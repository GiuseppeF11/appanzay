{
/* =====================================================================
   Appanzay — logica dell'app
   ===================================================================== */

/* ---------- Utilità ---------- */
function ymd(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0') }
function parse(s) { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d) }
function wdOf(s) { return (parse(s).getDay() + 6) % 7 }
function addDays(s, n) { const d = parse(s); d.setDate(d.getDate() + n); return ymd(d) }
const clone = o => JSON.parse(JSON.stringify(o));
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const norm = s => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’']/g, ' ').trim();
const fmt = n => Math.round(n).toLocaleString('it-IT');
const fmtQ = n => (+n).toLocaleString('it-IT', { maximumFractionDigits: 2 });
const uidGen = () => Math.random().toString(36).slice(2, 9);
const $ = id => document.getElementById(id);

/* ---------- Alimenti ---------- */
const parseUnits = s => (s || '').split(';').filter(Boolean).map(x => {
  const i = x.lastIndexOf(':'); const [one, many] = x.slice(0, i).split('/');
  return { one, many: many || one, g: +x.slice(i + 1) };
});
const CATS = ['Latticini', 'Cereali', 'Carne e uova', 'Pesce', 'Verdure', 'Legumi', 'Frutta', 'Condimenti', 'Bevande', 'Dolci e altro', 'Piatti pronti', 'Personali'];
const ST = { ok: 'Previsto', warn: 'Sconsigliato', no: 'Vietato', none: 'Non indicato', custom: 'Aggiunto da te' };
const STATO = { previsto: 'ok', sconsigliato: 'warn', vietato: 'no' };
const GIORNI = ['lunedi', 'martedi', 'mercoledi', 'giovedi', 'venerdi', 'sabato', 'domenica'];
const DEFAULT_MEALS = [{ id: 'colazione', name: 'Colazione', type: 'colazione' }, { id: 'spuntino_mattina', name: 'Spuntino mattina', type: 'spuntino' }, { id: 'pranzo', name: 'Pranzo', type: 'pranzo' }, { id: 'spuntino_pomeriggio', name: 'Spuntino pomeriggio', type: 'spuntino' }, { id: 'cena', name: 'Cena', type: 'cena' }];
// Frutta e verdura di stagione (mesi), per scegliere le alternative e i consigli della spesa
const SEASON = { mandarini: [11, 12, 1, 2, 3], clementine: [11, 12, 1, 2], arance: [12, 1, 2, 3, 4], kiwi: [11, 12, 1, 2, 3, 4], 'melone giallo': [6, 7, 8, 9], nespole: [4, 5, 6], fragole: [4, 5, 6], ciliegie: [5, 6, 7], pesche: [6, 7, 8, 9], albicocche: [6, 7], 'cocomero / anguria': [7, 8], uva: [8, 9, 10], fichi: [8, 9], cachi: [10, 11, 12], 'prugne fresche / susine': [7, 8, 9], melagrana: [10, 11, 12] };
const inSeason = (name, month) => { const m = SEASON[norm(name)]; return !m || m.includes(month) };

/* ---------- Piano dell'utente (caricato dal file "appanzay-piano") ---------- */
let PL = null; // piano compilato
let FOODS = []; // enciclopedia + stati del piano + alimenti nuovi del piano
/* Catalogo comune = righe di js/foods.js + modifiche pubblicate dall'amministratore
   (Firestore catalogo/modifiche: { righe: [riga intera], rimossi: [nome] }). Uguale per tutti. */
const CAT_CATS = CATS.slice(0, -1);
const UNIT_RE = /^[^/:;|]+(\/[^/:;|]+)?:\d+(\.\d+)?$/;
function parseRow(l) {
  const [n, c, k, u, a, nota] = String(l).split('|').map(x => (x || '').trim());
  if (!n || !CAT_CATS.includes(c) || k === '' || !(+k >= 0)) return null;
  return { n, c, k: +k, units: parseUnits((u || '').split(';').map(x => x.trim()).filter(x => UNIT_RE.test(x)).join(';')), alias: (a || '').split(',').map(x => x.trim()).filter(Boolean), nota: nota || '' };
}
const rowOf = f => [f.n, f.c, f.k, f.units.map(x => `${x.one}${x.many && x.many !== x.one ? '/' + x.many : ''}:${x.g}`).join(';'), f.alias.join(','), f.nota].join('|');
const BASE_CAT = window.APZ_FOODS_RAW.trim().split('\n').map(parseRow).filter(Boolean);
const BASE_BY = new Map(BASE_CAT.map(f => [norm(f.n), f]));
let CAT_EDIT = { righe: [], rimossi: [] };
let CATALOG = [];
const catByNorm = new Map();
function buildCatalog() {
  const del = new Set((CAT_EDIT.rimossi || []).map(norm)), over = new Map();
  (CAT_EDIT.righe || []).forEach(l => { const f = parseRow(l); if (f) over.set(norm(f.n), f) });
  CATALOG = BASE_CAT.filter(f => !del.has(norm(f.n))).map(f => over.get(norm(f.n)) || f)
    .concat([...over.entries()].filter(([k]) => !BASE_BY.has(k)).map(([, f]) => f));
  catByNorm.clear();
  CATALOG.forEach(f => catByNorm.set(norm(f.n), f));
  CATALOG.forEach(f => f.alias.forEach(a => { if (!catByNorm.has(norm(a))) catByNorm.set(norm(a), f) }));
}
try { const c = JSON.parse(localStorage.getItem('apz:catalogo') || 'null'); if (c && Array.isArray(c.righe)) CAT_EDIT = c } catch (e) { }
buildCatalog();

/* Liste comuni per condizione = js/patologie.js + modifiche dell'amministratore
   (Firestore catalogo/condizioni: { blocchi: {id: testo del blocco}, rimossi: [id] }). Dati generici, uguali per tutti. */
const COND_GROUPS = ['Intolleranze e allergie', 'Apparato digerente', 'Rene', 'Metabolismo e cuore', 'Condizioni particolari'];
const COND_ST = { vietato: 'no', sconsigliato: 'warn' }, COND_WORD = { no: 'vietato', warn: 'sconsigliato' };
const RANK = { none: 0, custom: 0, ok: 1, warn: 2, no: 3 };
function splitBlocks(raw) {
  const out = []; let cur = null;
  String(raw || '').split('\n').forEach(l => { l = l.trim(); if (!l || l.startsWith('#')) return; if (l[0] === '@') { cur = [l]; out.push(cur) } else if (cur) cur.push(l) });
  return out.map(b => b.join('\n'));
}
function parseCond(text) {
  const lines = String(text || '').split('\n').map(x => x.trim()).filter(Boolean);
  if (!lines.length || lines[0][0] !== '@') return null;
  const [id, g, n, nota] = lines[0].slice(1).split('|').map(x => (x || '').trim());
  if (!/^[a-z0-9_]+$/.test(id || '') || !n) return null;
  const righe = [], bad = [];
  lines.slice(1).forEach(l => {
    const [st, why, fs] = l.split('|').map(x => (x || '').trim()), s = COND_ST[norm(st)];
    if (!s || !fs) { bad.push(l); return }
    righe.push({ s, why: why || (s === 'no' ? 'Vietato' : 'Sconsigliato'), foods: fs.split(';').map(x => x.trim()).filter(Boolean) });
  });
  return { id, g: COND_GROUPS.includes(g) ? g : COND_GROUPS[COND_GROUPS.length - 1], n, nota: nota || '', righe, bad };
}
const condText = c => [`@${c.id}|${c.g}|${c.n}|${c.nota}`].concat(c.righe.map(r => `${COND_WORD[r.s]}|${r.why}|${r.foods.join(';')}`)).join('\n');
const BASE_COND = splitBlocks(window.APZ_CONDIZIONI_RAW).map(parseCond).filter(Boolean);
const BASE_COND_BY = new Map(BASE_COND.map(c => [c.id, c]));
let COND_EDIT = { blocchi: {}, rimossi: [] };
try { const c = JSON.parse(localStorage.getItem('apz:condizioni') || 'null'); if (c && c.blocchi) COND_EDIT = c } catch (e) { }
let CONDS = [];
const condById = new Map();
function buildConds() {
  const del = new Set(COND_EDIT.rimossi || []), over = new Map();
  Object.entries(COND_EDIT.blocchi || {}).forEach(([id, t]) => { const c = parseCond(t); if (c && c.id === id) over.set(id, c) });
  CONDS = BASE_COND.filter(c => !del.has(c.id)).map(c => over.get(c.id) || c).concat([...over.values()].filter(c => !BASE_COND_BY.has(c.id) && !del.has(c.id)));
  condById.clear(); CONDS.forEach(c => condById.set(c.id, c));
}
buildConds();
/* Salute dell'utente (solo nel suo account): condizioni scelte e alimenti segnati a mano { chiave normalizzata: {n, s, nota} } */
let SALUTE = { cond: [], man: {} };
function condHits() {
  const m = new Map();
  (SALUTE.cond || []).forEach(id => {
    const c = condById.get(id); if (!c) return;
    c.righe.forEach(r => r.foods.forEach(nm => {
      const f = catByNorm.get(norm(nm)), k = norm(f ? f.n : nm);
      if (!m.has(k)) m.set(k, []);
      m.get(k).push({ s: r.s, why: r.why, c: c.n });
    }));
  });
  return m;
}
const lc1 = t => t ? t[0].toLowerCase() + t.slice(1) : t;
/* Stato finale: vince la scelta manuale, poi il più restrittivo tra piano e condizioni; i disaccordi si dicono. */
function finalize(o, hits) {
  const k = norm(o.n), h = hits.get(k) || [], man = SALUTE.man && SALUTE.man[k];
  const base = o.s === 'custom' ? 'none' : o.s;
  const top = h.reduce((a, x) => RANK[x.s] > RANK[a] ? x.s : a, 'none');
  const reasonOf = st => [...new Map(h.filter(x => x.s === st).map(x => [x.c, `${x.c}: ${lc1(x.why)}`])).values()].join(' · ');
  const notes = [];
  o.conds = h; o.ps = o.s;
  let s = o.s, r = o.r;
  if (RANK[top] > RANK[base]) {
    if (base === 'ok') { o.conf = true; notes.push(`Il tuo piano lo prevede, ma per le tue condizioni è ${COND_WORD[top]}: chiedi a chi ti segue.`) }
    else if (base === 'warn') notes.push('Nel piano: sconsigliato' + (o.r && o.r !== ST.warn ? ' (' + lc1(o.r) + ')' : '') + '.');
    s = top; r = reasonOf(top);
  } else if (h.length) notes.push('Anche: ' + [...new Map(h.map(x => [x.c, `${x.c} (${COND_WORD[x.s]})`])).values()].join(', ') + '.');
  if (man && ['ok', 'warn', 'no'].includes(man.s)) {
    o.man = man;
    const was = ST[s === 'custom' ? 'none' : s].toLowerCase();
    if (man.s !== s) notes.unshift(r && norm(r).startsWith(norm(was)) ? `Senza la tua scelta: ${lc1(r)}.` : `Senza la tua scelta sarebbe ${was}${r ? ': ' + lc1(r) : ''}.`);
    s = man.s; r = 'Segnato da te' + (man.nota ? ': ' + man.nota : '');
  }
  o.s = s; o.r = r;
  if (notes.length) o.note = [o.note].concat(notes).filter(Boolean).join(' ');
  return o;
}
function resolveName(n, extra) {
  const k = norm(n);
  if (extra && extra.has(k)) return extra.get(k).n;
  const f = catByNorm.get(k); return f ? f.n : String(n).trim();
}
function rebuildFoods() {
  const rules = PL ? PL.rules : new Map();
  FOODS = CATALOG.map(f => {
    const r = rules.get(norm(f.n));
    return { n: f.n, c: f.c, k: f.k, units: f.units, alias: f.alias, cat: true, s: r && r.s ? r.s : 'none', r: r && r.r ? r.r : (r && r.s ? ST[r.s] : (PL ? 'Non indicato dal piano' : 'Nessun piano caricato')), note: [r && r.note, f.nota].filter(Boolean).join(' '), p: r && r.p ? r.p : '' };
  }).concat(PL ? PL.extraFoods.map(f => Object.assign({}, f)) : []);
  const hits = condHits();
  FOODS.forEach(f => finalize(f, hits));
}
const toIt = x => { const o = { f: x.f, g: x.g }; if (x.q && x.u) { o.q = x.q; o.u = x.u } return o };
function compilePlan(raw) {
  if (!raw || raw.formato !== 'appanzay-piano') return null;
  const extra = new Map(), rules = new Map();
  (raw.alimenti || []).forEach(a => {
    if (!a || !a.nome) return;
    const s = STATO[norm(a.stato || '')] || '';
    if (!catByNorm.has(norm(a.nome)) && a.kcal_100g != null) {
      const units = (a.unita || []).filter(u => u && u.nome && +u.grammi > 0).map(u => ({ one: u.nome, many: u.plurale || u.nome, g: +u.grammi }));
      extra.set(norm(a.nome), { n: String(a.nome).trim(), c: CATS.includes(a.categoria) ? a.categoria : 'Personali', k: +a.kcal_100g || 0, units, alias: [], s: s || 'none', r: a.motivo || (s ? ST[s] : 'Dal tuo piano'), note: a.nota || '', p: a.porzione || '' });
    } else rules.set(norm(resolveName(a.nome)), { s, r: a.motivo || '', note: a.nota || '', p: a.porzione || '' });
  });
  const item = x => ({ f: resolveName(x.alimento, extra), g: +x.grammi || 0, q: +x.quantita || 0, u: x.unita || '' });
  const meals = (raw.pasti || []).filter(m => m && m.id).map(m => ({ id: String(m.id), name: m.nome || String(m.id), type: ['colazione', 'spuntino', 'pranzo', 'cena'].includes(m.tipo) ? m.tipo : 'spuntino' }));
  const menu = GIORNI.map(g => meals.map(m => {
    const v = raw.menu && raw.menu[g] ? raw.menu[g][m.id] : null;
    const list = Array.isArray(v) ? v : v && Array.isArray(v.alimenti) ? v.alimenti : [];
    const meal = { id: m.id, name: m.name, type: m.type, items: list.filter(x => x && x.alimento).map(x => toIt(item(x))) };
    if (v && (v.formato === 'primo' || v.formato === 'secondo')) meal.fmt = v.formato;
    return meal;
  }));
  const equiv = {};
  Object.entries(raw.equivalenze || {}).forEach(([t, comps]) => {
    if (!Array.isArray(comps)) return;
    equiv[t] = comps.filter(c => c && Array.isArray(c.opzioni)).map(c => ({ role: c.ruolo || 'altro', options: c.opzioni.filter(Array.isArray).map(o => o.filter(x => x && x.alimento).map(item)).filter(o => o.length) })).filter(c => c.options.length);
  });
  const freq = (raw.frequenze || []).filter(f => f && Array.isArray(f.alimenti)).map(f => ({ label: f.nome || 'Frequenza', names: new Set(f.alimenti.map(x => norm(resolveName(x, extra)))), n: +f.volte || 0, rule: ['almeno', 'massimo', 'esatto'].includes(f.regola) ? f.regola : 'esatto', min: +f.grammi_minimi || 0 }));
  const o = raw.obiettivi || {};
  return { raw, info: raw.info || {}, meals, menu, equiv, freq, rules, extraFoods: [...extra.values()], regole: raw.regole || {}, obj: { kcal: +o.kcal || 0, water: o.acqua_litri && o.bicchiere_ml ? Math.round(o.acqua_litri * 1000 / o.bicchiere_ml) : o.acqua_litri ? Math.round(o.acqua_litri * 5) : 0, glass: +o.bicchiere_ml || 200 } };
}
function setPlan(raw) { PL = compilePlan(raw); S.plan = PL ? raw : null; rebuildFoods() }
rebuildFoods();
const emptyWeek = () => GIORNI.map(() => (PL ? PL.meals : DEFAULT_MEALS).map(m => ({ id: m.id, name: m.name, type: m.type, items: [] })));
const defaultWeek = () => PL ? clone(PL.menu) : emptyWeek();
const WD = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];
const WDS = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];
const WATER_SLOTS = [[1, 'al risveglio'], [2, 'a colazione'], [3, 'a metà mattina'], [4, 'a pranzo'], [6, 'nel pomeriggio'], [7, 'a cena'], [10, 'in serata']];

/* ---------- Ricerca: parole contenute, singolare/plurale, sinonimi ---------- */
const STOP = new Set(['di', 'da', 'del', 'della', 'dei', 'delle', 'al', 'alla', 'alle', 'con', 'il', 'lo', 'la', 'le', 'gli', 'un', 'una', 'uno', 'e', 'o', 'in', 'per']);
function stem(w) { const s = w.replace(/[aeiou]+$/, '').replace(/h$/, ''); return s.length >= 3 ? s : w }
const words = s => norm(s).split(/[^a-z0-9]+/).filter(w => w && !STOP.has(w));
function tokensOf(f) {
  if (!f._t) {
    f._t = [...new Set([f.n, ...f.alias].flatMap(words).map(stem))];
    f._c = words(f.c).map(stem).join(' ');
    f._p = [f.n, ...f.alias].map(x => words(x).map(stem).join(' '));
  }
  return f._t;
}
function matches(f, q) {
  const qs = words(q).map(stem); if (!qs.length) return true;
  const t = tokensOf(f);
  if (f._c && f._c === qs.join(' ')) return true;
  return qs.every(s => t.some(x => x.startsWith(s))) || norm(f.n + ' ' + f.alias.join(' ')).includes(norm(q));
}
const exactOf = (q, list) => { const p = words(q).map(stem).join(' '); return list.find(f => { tokensOf(f); return f._p.includes(p) }) };

/* ---------- Stato ---------- */
const S = { settings: { kcal: 1800, water: 10, glass: 200 }, plan: null, week: null, custom: [], library: [], shop: { checked: {}, extra: [] }, days: {}, date: ymd(new Date()), wd: wdOf(ymd(new Date())), filter: 'all' };
let undoStack = null;

function allFoods() {
  return FOODS.concat(S.custom.map(c => SALUTE.man[norm(c.n)] ? finalize({ n: c.n, c: 'Personali', s: 'custom', k: +c.k || 0, r: c.src === 'off' ? 'Prodotto confezionato' : 'Aggiunto da te', note: c.src === 'off' ? 'Da Open Food Facts: non verificato con il tuo piano.' : 'Non verificato con il tuo piano.', p: '', units: c.pg ? [{ one: 'porzione', many: 'porzioni', g: +c.pg }] : [], alias: [] }, new Map()) : ({ n: c.n, c: 'Personali', s: 'custom', k: +c.k || 0, r: c.src === 'off' ? 'Prodotto confezionato' : 'Aggiunto da te', note: c.src === 'off' ? 'Da Open Food Facts: non verificato con il tuo piano.' : 'Non verificato con il tuo piano.', p: '', units: c.pg ? [{ one: 'porzione', many: 'porzioni', g: +c.pg }] : [], alias: [] })));
}
function foodBy(name) {
  const k = norm(name), all = allFoods(), f = all.find(x => norm(x.n) === k); if (f) return f;
  const c = catByNorm.get(k); return c ? all.find(x => x.cat && x.n === c.n) : undefined;
}
function unitOf(f, u) { return f && u ? f.units.find(x => x.one === u) : null }
function itemKcal(it) { if (it.k != null && it.k !== '') return +it.k; const f = foodBy(it.f); return f ? Math.round(it.g * f.k / 100) : 0 }
function itemQty(it) {
  if (it.q && it.u) return `${fmtQ(it.q)} ${it.q == 1 ? it.u : (unitOf(foodBy(it.f), it.u)?.many || it.u)} · ${fmt(it.g)} g`;
  return `${fmt(it.g)} g`;
}
const mealKcal = m => m.items.reduce((a, it) => a + itemKcal(it), 0);

/* ---------- Formato di pranzo e cena: primo (piatto unico) o secondo con contorno ---------- */
const PRIMO_FAM = ['riso', 'pasta', 'cous', 'polenta', 'gnocchi', 'farro', 'quinoa'];
const isMain = m => ['pranzo', 'cena'].includes(mealType(m));
const starchIdx = m => m.items.findIndex(it => ['amido', 'patate'].includes(kindOf(it)));
function fmtOf(m) {
  if (!isMain(m)) return null;
  if (m.fmt) return m.fmt;
  const i = starchIdx(m);
  return i >= 0 && PRIMO_FAM.includes(fam(m.items[i].f)) ? 'primo' : 'secondo';
}
function dishName(m) {
  const f = fmtOf(m); if (!f) return '';
  const st = m.items[starchIdx(m)];
  const pr = m.items.find(it => PROT_KINDS.includes(kindOf(it)) && !(kindOf(it) === 'formaggio' && it.g < 40)) || m.items.find(it => PROT_KINDS.includes(kindOf(it)));
  const low = x => x ? x.f.toLowerCase() : '';
  if (f === 'primo') return st ? st.f + (pr ? ' con ' + low(pr) : '') + ' · piatto unico' : 'Piatto unico';
  return (pr ? pr.f : 'Secondo') + ' con contorno' + (st ? ' e ' + low(st) : '');
}
// Opzioni di un ruolo nelle equivalenze del piano per un tipo di pasto
const equivOf = type => (PL && PL.equiv[type]) || [];
const roleOpts = (type, role) => { const c = equivOf(type).find(x => x.role === role); return c ? c.options : [] };
// Cambia formato sostituendo solo l'amido, con la prima equivalenza del piano adatta al formato.
function switchFmt(m, to) {
  const i = starchIdx(m), cur = i >= 0 ? m.items[i] : null;
  const fits = name => (to === 'primo') === PRIMO_FAM.includes(fam(name));
  let next = cur && fits(cur.f) ? cur : null;
  if (!next) { const o = roleOpts(mealType(m), 'amido').find(o => o.length === 1 && fits(o[0].f)); if (o) next = toIt(o[0]) }
  if (next) { if (i >= 0) m.items[i] = next; else m.items.splice(Math.min(1, m.items.length), 0, next) }
  m.fmt = to;
}
// Riporta le grammature al pasto di destinazione secondo le equivalenze del piano.
function adaptItems(items, type) {
  const comps = equivOf(type); if (!comps.length) return items;
  const singles = new Map();
  comps.forEach(c => c.options.forEach(o => { if (o.length === 1 && !singles.has(norm(o[0].f))) singles.set(norm(o[0].f), o[0]) }));
  return items.map(it => {
    if (it.q && it.u) return Object.assign({}, it); // porzioni a pezzi (es. 1 uovo) restano uguali
    if (kindOf(it) === 'formaggio' && it.g < 40) return Object.assign({}, it); // formaggio come condimento
    const e = singles.get(norm(it.f));
    return e ? toIt(e) : Object.assign({}, it);
  });
}
// Scambia pranzo e cena (contenuto e formato), adattando le grammature.
function swapMeals(a, b) {
  const ia = clone(a.items), ib = clone(b.items), fa = fmtOf(a), fb = fmtOf(b);
  a.items = adaptItems(ib, mealType(a)); a.fmt = fb;
  b.items = adaptItems(ia, mealType(b)); b.fmt = fa;
}
const dayObj = d => S.days[d] || (S.days[d] = { water: 0, eaten: {}, sym: null, note: '' });
const mealsOf = d => dayObj(d).meals || S.week[wdOf(d)];
// Pasti di un ambito: giorno (Oggi), modello settimanale, pasto salvato
function mealsFor(scope, key) {
  if (scope === 'day') return mealsOf(key);
  if (scope === 'lib') { const L = S.library.find(x => x.id === key); return L ? [L] : [] }
  return S.week[+key];
}
const TYPE_LABEL = { colazione: 'Colazione', spuntino: 'Spuntino', pranzo: 'Pranzo', cena: 'Cena' };

/* =====================================================================
   Salvataggio: Claude (artifact) · Firebase · solo browser
   ===================================================================== */
function lsGet(k) { try { const v = localStorage.getItem('apz:' + k); return v ? JSON.parse(v) : null } catch (e) { return null } }
function lsSet(k, v) { try { localStorage.setItem('apz:' + k, JSON.stringify(v)) } catch (e) { } }
function lsDays() {
  const out = {};
  try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.startsWith('apz:day:')) out[k.slice(8)] = JSON.parse(localStorage.getItem(k)) } } catch (e) { }
  return out;
}
const LOCAL = { kind: 'local', get: async k => lsGet(k), set: async () => { }, listDays: async () => lsDays() };
let B = LOCAL;           // adapter attivo
let FB = null, fbUser = null; // Firebase

function dataFor(key) {
  if (key === 'settings') return S.settings; if (key === 'week') return { days: S.week }; if (key === 'foods') return { list: S.custom };
  if (key === 'meals') return { list: S.library }; if (key === 'shop') return S.shop; if (key === 'plan') return S.plan; if (key === 'salute') return SALUTE;
  return S.days[key.slice(4)];
}
function applyDoc(key, v) {
  if (!v) return;
  if (key === 'settings') Object.assign(S.settings, v);
  else if (key === 'week' && Array.isArray(v.days) && v.days.length === 7) S.week = v.days;
  else if (key === 'foods' && Array.isArray(v.list)) S.custom = v.list;
  else if (key === 'meals' && Array.isArray(v.list)) S.library = v.list;
  else if (key === 'shop') S.shop = Object.assign({ checked: {}, extra: [] }, v);
  else if (key === 'plan') setPlan(v);
  else if (key === 'salute') { SALUTE = { cond: Array.isArray(v.cond) ? v.cond : [], man: v.man && typeof v.man === 'object' ? v.man : {} }; rebuildFoods() }
  else if (key.startsWith('day:')) S.days[key.slice(4)] = Object.assign({ water: 0, eaten: {}, sym: null, note: '' }, v);
}
const chains = {}, timers = {};
let lastSync = '';
function syncLevel(t) {
  if (/non salvato|non raggiungibile|esaurito|offline/i.test(t)) return 'err';
  if (/salvataggio…|sincronizzazione|aggiornamento/i.test(t)) return 'busy';
  return B.kind === 'local' ? 'warn' : 'ok';
}
function setSync(t) {
  lastSync = t; const lv = syncLevel(t);
  const el = $('syncTxt'); if (el) el.textContent = t;
  const d = $('syncDot'); if (d) { d.className = 'sdot ' + lv; d.title = t }
  const d2 = $('syncDot2'); if (d2) d2.className = 'sdot ' + lv;
}
function syncLabel() {
  if (B.kind === 'claude') return 'Salvato nel tuo account Claude';
  if (B.kind === 'firebase') return 'Salvato nel database';
  if (window.APZ_FIREBASE) return 'Accedi per salvare nel database';
  return 'Salvataggio solo su questo browser';
}
/* Chiavi non ancora salvate online: servono a non perdere dati all'uscita dall'account */
const unsynced = new Set();
function pushKey(key, adapter) {
  delete timers[key];
  const body = clone(dataFor(key));
  setSync('Salvataggio…');
  return chains[key] = (chains[key] || Promise.resolve())
    .then(() => adapter.set(key, body))
    .then(() => { if (adapter === B) { unsynced.delete(key); setSync(syncLabel()) } })
    .catch(e => setSync(e && e.code === 'quota_exceeded' ? 'Spazio esaurito: salvato solo su questo browser' : 'Non salvato online: riprovo alla prossima modifica'));
}
function save(key) {
  lsSet(key, dataFor(key));
  if (B.kind === 'local') return;
  unsynced.add(key);
  clearTimeout(timers[key]);
  const adapter = B;
  timers[key] = setTimeout(() => pushKey(key, adapter), 500);
}
/* Prima di uscire: manda subito i salvataggi in attesa e riprova quelli falliti */
async function flushSaves() {
  if (B.kind === 'local') return;
  Object.keys(timers).forEach(k => clearTimeout(timers[k]));
  await Promise.all([...unsynced].map(k => pushKey(k, B)));
}
const KEY_NAME = { plan: 'il piano', week: 'il menù della settimana', settings: 'obiettivi e dati personali', foods: 'i tuoi alimenti', meals: 'i pasti salvati', shop: 'la spesa', salute: 'condizioni e alimenti segnati' };
async function doLogout() { resetLocal(); unsynced.clear(); await FB.logout(); location.hash = 'oggi' }
async function fetchDoc(key) {
  if (B.kind !== 'local') {
    try { const v = await B.get(key); if (v) { applyDoc(key, v); lsSet(key, v) } return } catch (e) { }
  }
  applyDoc(key, lsGet(key));
}
const loaded = new Set();
async function loadDay(d) { if (loaded.has(d)) return; loaded.add(d); await fetchDoc('day:' + d) }
async function loadAll() {
  await Promise.all(['plan', 'settings', 'week', 'foods', 'meals', 'shop', 'salute'].map(fetchDoc).concat(loadCatalog()));
  refreshCatalog();
  if (!S.week) S.week = defaultWeek();
  loaded.clear(); await loadDay(S.date);
  renderDatalist(); afterData();
}

/* Claude: db dell'artifact, privato per utente */
function claudeAdapter(db, uid) {
  const ref = key => key.startsWith('day:')
    ? db.doc('data/users/' + uid + '/log').collection('days').doc(key.slice(4))
    : db.doc('data/users/' + uid + '/' + key);
  return {
    kind: 'claude',
    async get(key) { const s = await ref(key).get(); return s.exists ? s.data() : null },
    set: (key, data) => ref(key).set(data),
    async listDays() { const qs = await db.doc('data/users/' + uid + '/log').collection('days').get(); const o = {}; qs.docs.forEach(d => o[d.id] = d.data()); return o }
  };
}
/* Firebase */
function firebaseAdapter(fb, uid) {
  return { kind: 'firebase', get: key => fb.get(uid, key), set: (key, data) => fb.set(uid, key, data), listDays: () => fb.listDays(uid) };
}
/* Al primo accesso porta nel database i dati già inseriti in questo browser */
async function migrateLocal() {
  for (const key of ['plan', 'settings', 'week', 'foods', 'meals', 'shop', 'salute']) {
    const local = lsGet(key); if (!local) continue;
    try { const remote = await B.get(key); if (!remote) await B.set(key, local) } catch (e) { }
  }
  const days = lsDays();
  for (const d of Object.keys(days)) {
    try { const remote = await B.get('day:' + d); if (!remote) await B.set('day:' + d, days[d]) } catch (e) { }
  }
}

/* ---------- Catalogo alimenti comune (modificabile dall'amministratore) ---------- */
const ADMIN = { known: false, exists: false, me: false };
function refreshCatalog() { buildCatalog(); buildConds(); if (S.plan) PL = compilePlan(S.plan); rebuildFoods() }
async function loadCatalog() {
  const c = lsGet('catalogo'); if (c && Array.isArray(c.righe)) CAT_EDIT = c;
  const cc = lsGet('condizioni'); if (cc && cc.blocchi) COND_EDIT = cc;
  if (!FB || !fbUser) return;
  await Promise.all([
    FB.getShared('condizioni').then(v => { COND_EDIT = v ? { blocchi: v.blocchi || {}, rimossi: v.rimossi || [], aggiornato: v.aggiornato || '' } : { blocchi: {}, rimossi: [] }; lsSet('condizioni', COND_EDIT) }).catch(() => { }),
    FB.getShared('modifiche').then(v => { CAT_EDIT = v ? { righe: v.righe || [], rimossi: v.rimossi || [], aggiornato: v.aggiornato || '' } : { righe: [], rimossi: [] }; lsSet('catalogo', CAT_EDIT) }).catch(() => { }),
    FB.getShared('amministratori').then(a => { const u = a && Array.isArray(a.uids) ? a.uids : []; Object.assign(ADMIN, { known: true, exists: u.length > 0, me: u.includes(fbUser.uid) }) }).catch(() => { ADMIN.known = false }),
  ]);
}
const rowName = l => { const f = parseRow(l); return f ? norm(f.n) : '' };
function catUpsert(st, f, oldName) {
  const k = norm(f.n), ok = oldName ? norm(oldName) : k;
  const righe = st.righe.filter(l => { const x = rowName(l); return x && x !== k && x !== ok });
  const rimossi = st.rimossi.filter(n => norm(n) !== k && norm(n) !== ok);
  if (ok !== k && BASE_BY.has(ok)) rimossi.push(BASE_BY.get(ok).n);
  const b = BASE_BY.get(k); if (!(b && rowOf(b) === rowOf(f))) righe.push(rowOf(f));
  return { righe, rimossi };
}
function catRemove(st, name) {
  const k = norm(name);
  return { righe: st.righe.filter(l => rowName(l) !== k), rimossi: st.rimossi.filter(n => norm(n) !== k).concat(BASE_BY.has(k) ? [BASE_BY.get(k).n] : []) };
}
const catRestore = (st, name) => ({ righe: st.righe.filter(l => rowName(l) !== norm(name)), rimossi: st.rimossi.filter(n => norm(n) !== norm(name)) });
async function publishCatalog(next, msg) {
  if (!FB || !fbUser || !ADMIN.me) { toast('Solo l\'amministratore può modificare il catalogo', false); return false }
  const body = { righe: next.righe, rimossi: next.rimossi, aggiornato: new Date().toISOString() };
  toast('Pubblicazione…', false);
  try { await FB.setShared('modifiche', body) }
  catch (e) { toast(e && e.code === 'permission-denied' ? 'Non salvato: Firestore rifiuta la modifica. Controlla di aver pubblicato le regole nuove.' : 'Non salvato: controlla la connessione e riprova.', false); return false }
  CAT_EDIT = body; lsSet('catalogo', body); refreshCatalog(); renderDatalist(); render();
  toast(msg + '. Gli altri lo vedono al prossimo avvio dell\'app.', false); return true;
}
async function publishConds(next, msg) {
  if (!FB || !fbUser || !ADMIN.me) { toast('Solo l\'amministratore può modificare le liste', false); return false }
  const body = { blocchi: next.blocchi, rimossi: next.rimossi, aggiornato: new Date().toISOString() };
  toast('Pubblicazione…', false);
  try { await FB.setShared('condizioni', body) }
  catch (e) { toast(e && e.code === 'permission-denied' ? 'Non salvato: Firestore rifiuta la modifica. Controlla di aver pubblicato le regole nuove.' : 'Non salvato: controlla la connessione e riprova.', false); return false }
  COND_EDIT = body; lsSet('condizioni', body); refreshCatalog(); render();
  toast(msg + '. Gli altri lo vedono al prossimo avvio dell\'app.', false); return true;
}
/* ---------- Salute e preferenze (utente) ---------- */
function saveSalute(msg) { rebuildFoods(); renderDatalist(); save('salute'); render(); if (msg) toast(msg, false) }
function saluteCard() {
  const sel = (SALUTE.cond || []).map(id => condById.get(id)).filter(Boolean);
  const man = Object.entries(SALUTE.man || {}).sort((a, b) => a[1].n.localeCompare(b[1].n, 'it'));
  return `<div class="card salute"><h3>Salute e preferenze</h3>
   <p class="small muted">Restano solo nel tuo account. Lo stato di un alimento: vince la tua scelta, poi il più restrittivo tra piano e condizioni.</p>
   <h4>Condizioni</h4>
   ${sel.length ? `<div class="chips">${sel.map(c => `<span class="chip">${esc(c.n)}</span>`).join('')}</div>` : '<p class="small muted">Nessuna condizione scelta.</p>'}
   <button class="btn" type="button" data-act="condpick">${sel.length ? 'Modifica condizioni' : 'Scegli condizioni'}</button>
   <h4>Alimenti segnati da te</h4>
   ${man.length ? `<ul class="manlist">${man.map(([k, m]) => `<li><span class="mn">${esc(m.n)}${m.nota ? `<small>${esc(m.nota)}</small>` : ''}</span><span class="badge ${m.s}">${ST[m.s]}</span><button class="icon small" type="button" data-act="markedit" data-n="${esc(m.n)}" aria-label="Modifica ${esc(m.n)}">✎</button><button class="icon small" type="button" data-act="markdel" data-k="${esc(k)}" aria-label="Togli ${esc(m.n)}">×</button></li>`).join('')}</ul>` : '<p class="small muted">Nessuno. Puoi segnare un alimento anche dalla sezione Alimenti.</p>'}
   <button class="btn" type="button" data-act="markfood">+ Segna un alimento</button></div>`;
}
function openCondPick() {
  dlg = { type: 'conds' };
  const on = new Set(SALUTE.cond || []);
  showDlg(`<h2>Le tue condizioni</h2>
   <p class="small muted">Gli alimenti da evitare o limitare vengono segnati in tutta l'app. Sono indicazioni generali: il piano di chi ti segue resta il riferimento.</p>
   ${COND_GROUPS.map(g => { const cs = CONDS.filter(c => c.g === g); return cs.length ? `<fieldset class="condg"><legend>${esc(g)}</legend>${cs.map(c => `<label class="condrow"><input type="checkbox" name="cond" value="${esc(c.id)}"${on.has(c.id) ? ' checked' : ''}><span>${esc(c.n)}${c.nota ? `<small>${esc(c.nota)}</small>` : ''}</span></label>`).join('')}</fieldset>` : '' }).join('')}`, {});
}
function markList() {
  const q = $('mkQ').value.trim(), all = allFoods();
  const res = q ? all.filter(f => matches(f, q)).slice(0, 8) : [];
  const ex = q ? exactOf(q, all) : null;
  if (ex && !res.includes(ex)) res.unshift(ex);
  $('mkList').innerHTML = res.map(f => `<li><button type="button" class="mkpick${dlg.n === f.n ? ' on' : ''}" data-act="mkpick" data-n="${esc(f.n)}">${esc(f.n)} <span class="badge ${f.s}">${ST[f.s]}</span></button></li>`).join('');
}
function openMark(name) {
  const k = name ? norm(name) : '', m = k && SALUTE.man[k];
  dlg = { type: 'mark', n: name || '' };
  showDlg(`<h2>Segna un alimento</h2>
   <label for="mkQ">Alimento</label><input type="text" id="mkQ" value="${esc(name || '')}" placeholder="Es. kiwi, pane, latte" autocomplete="off" autocapitalize="off" spellcheck="false">
   <ul id="mkList" class="mklist"></ul>
   <fieldset class="segr"><legend>Per me è</legend>${[['no', 'Vietato'], ['warn', 'Sconsigliato'], ['ok', 'Previsto']].map(([v, l]) => `<label><input type="radio" name="mkS" value="${v}"${(m ? m.s : 'no') === v ? ' checked' : ''}><span>${l}</span></label>`).join('')}</fieldset>
   <label for="mkN">Nota (facoltativa)</label><input type="text" id="mkN" maxlength="120" value="${esc(m && m.nota || '')}" placeholder="Es. mi dà gonfiore" autocomplete="off">
   <p class="bad small" id="mkErr" hidden></p>`, { del: !!m });
  $('mkQ').addEventListener('input', () => { dlg.n = ''; markList() });
  markList();
}
function condCardAdmin() {
  if (!ADMIN.me) return '';
  const nMod = Object.keys(COND_EDIT.blocchi || {}).length + (COND_EDIT.rimossi || []).length;
  return `<div class="card"><h3>Liste per condizione</h3><p>Sei l'amministratore: le liste valgono per tutti gli utenti.</p>
   <p class="small muted">${CONDS.length} condizioni · ${nMod ? nMod + (nMod === 1 ? ' modifica' : ' modifiche') + ' rispetto alla base' : 'nessuna modifica rispetto alla base'}${COND_EDIT.aggiornato ? ' · ultima il ' + esc(new Date(COND_EDIT.aggiornato).toLocaleDateString('it-IT')) : ''}.</p>
   <details class="condadm"><summary>Mostra le condizioni</summary>${COND_GROUPS.map(g => { const cs = CONDS.filter(c => c.g === g); return cs.length ? `<p class="small muted cg">${esc(g)}</p><ul>${cs.map(c => `<li><button class="linkbtn" type="button" data-act="condedit" data-id="${esc(c.id)}">${esc(c.n)}</button> <span class="small muted">${c.righe.reduce((a, r) => a + r.foods.length, 0)} alimenti${COND_EDIT.blocchi && COND_EDIT.blocchi[c.id] ? ' · modificata' : ''}</span></li>`).join('')}</ul>` : '' }).join('')}</details>
   <div class="row2"><button class="btn" type="button" data-act="condnew">+ Nuova condizione</button></div></div>`;
}
function condRulesCheck() {
  const lines = $('ceR').value.split('\n').map(x => x.trim()).filter(Boolean), bad = [], unk = new Set();
  let n = 0;
  lines.forEach(l => {
    const [st, , fs] = l.split('|').map(x => (x || '').trim());
    if (!COND_ST[norm(st || '')] || !fs) { bad.push(l); return }
    fs.split(';').map(x => x.trim()).filter(Boolean).forEach(f => { n++; if (!catByNorm.has(norm(f))) unk.add(f) });
  });
  $('ceChk').innerHTML = `<span class="small">${n} alimenti in ${lines.length - bad.length} righe.</span>${bad.length ? `<br><span class="bad small">Righe non valide: ${bad.slice(0, 3).map(x => '«' + esc(x.slice(0, 40)) + '»').join(', ')}</span>` : ''}${unk.size ? `<br><span class="bad small">Non nel catalogo (ignorati): ${[...unk].slice(0, 8).map(esc).join(', ')}${unk.size > 8 ? '…' : ''}</span>` : ''}`;
  return { bad, n };
}
function openCondEdit(id) {
  const c = id ? condById.get(id) : null, base = c && BASE_COND_BY.get(c.id);
  dlg = { type: 'condedit', id: c ? c.id : null };
  showDlg(`<h2>${c ? 'Modifica condizione' : 'Nuova condizione'}</h2>
   <p class="small muted">Vale per tutti gli utenti che la scelgono. Una riga per gruppo di alimenti: <code>vietato|motivo|Alimento;Alimento</code> oppure <code>sconsigliato|…</code></p>
   ${c ? '' : '<label for="ceI">Codice (minuscole, numeri e _ ; non si cambia più)</label><input type="text" id="ceI" maxlength="30" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="es. all_kiwi" required>'}
   <label for="ceN">Nome</label><input type="text" id="ceN" maxlength="60" value="${esc(c ? c.n : '')}" required autocomplete="off">
   <label for="ceG">Gruppo</label><select id="ceG">${COND_GROUPS.map(g => `<option${c && c.g === g ? ' selected' : ''}>${g}</option>`).join('')}</select>
   <label for="ceO">Nota per l'utente</label><input type="text" id="ceO" maxlength="200" value="${esc(c ? c.nota : '')}" autocomplete="off">
   <label for="ceR">Alimenti</label><textarea id="ceR" rows="8" spellcheck="false" autocapitalize="off">${esc(c ? c.righe.map(r => `${COND_WORD[r.s]}|${r.why}|${r.foods.join(';')}`).join('\n') : 'vietato||')}</textarea>
   <p id="ceChk"></p><p class="bad small" id="ceErr" hidden></p>
   ${c && base && condText(base) !== condText(c) ? '<button class="linkbtn" type="button" data-act="condrestore">Ripristina la lista originale</button>' : ''}`, { del: !!c });
  $('dDel').textContent = 'Elimina';
  $('ceR').addEventListener('input', condRulesCheck); condRulesCheck();
}
const condClean = v => String(v || '').replace(/[|\n\r`@]/g, ' ').replace(/\s+/g, ' ').trim();
function submitCondEdit(D) {
  const id = D.id || $('ceI').value.trim(), n = condClean($('ceN').value), err = t => { $('ceErr').textContent = t; $('ceErr').hidden = false };
  if (!/^[a-z0-9_]{2,30}$/.test(id)) return err('Codice non valido: solo lettere minuscole, numeri e _.');
  if (!D.id && condById.has(id)) return err('Esiste già una condizione con questo codice.');
  if (!n) return err('Scrivi il nome.');
  const chk = condRulesCheck(); if (chk.bad.length) return err('Correggi le righe non valide.'); if (!chk.n) return err('Inserisci almeno un alimento.');
  const righe = $('ceR').value.split('\n').map(x => x.trim()).filter(Boolean).map(l => { const [st, why, fs] = l.split('|'); return `${norm(st).trim()}|${condClean(why)}|${fs.split(';').map(x => condClean(x)).filter(Boolean).join(';')}` });
  const text = [`@${id}|${$('ceG').value}|${n}|${condClean($('ceO').value)}`].concat(righe).join('\n');
  const c = parseCond(text); if (!c) return err('Dati non validi.');
  const blocchi = Object.assign({}, COND_EDIT.blocchi), rimossi = (COND_EDIT.rimossi || []).filter(x => x !== id), base = BASE_COND_BY.get(id);
  if (base && condText(base) === condText(c)) delete blocchi[id]; else blocchi[id] = condText(c);
  publishConds({ blocchi, rimossi }, D.id ? `${n} aggiornata` : `${n} aggiunta`).then(ok => { if (ok) closeDlg() });
}
const clean = v => String(v || '').replace(/[|\n\r`]/g, ' ').replace(/\s+/g, ' ').trim();
function readCatForm() {
  const n = clean($('cN').value), c = $('cC').value, kv = $('cK').value;
  if (!n) return { err: 'Scrivi il nome.' };
  if (kv === '' || !(+kv >= 0 && +kv <= 950)) return { err: 'Le kcal per 100 g devono essere un numero tra 0 e 950.' };
  const parts = clean($('cU').value).split(';').map(x => x.trim().replace(/\s*([/:])\s*/g, '$1')).filter(Boolean);
  const badU = parts.find(x => !UNIT_RE.test(x)); if (badU) return { err: `Porzione non valida: «${badU}». Usa singolare/plurale:grammi, per esempio fetta/fette:30.` };
  const alias = clean($('cA').value.replace(/[;]/g, ',')).split(',').map(x => x.trim()).filter(Boolean);
  const old = dlg.old;
  const other = catByNorm.get(norm(n)); if (other && other.n !== old) return { err: norm(other.n) === norm(n) ? `«${other.n}» è già nel catalogo.` : `«${n}» è già un sinonimo di «${other.n}».` };
  if (old && norm(old) !== norm(n) && !alias.some(a => norm(a) === norm(old))) alias.push(old); // i menù con il vecchio nome restano validi
  const f = parseRow([n, c, Math.round(+kv), parts.join(';'), alias.filter(a => norm(a) !== norm(n)).join(','), clean($('cNo').value)].join('|'));
  return f ? { f } : { err: 'Dati non validi.' };
}
function openCatEdit(name) {
  const f = name ? CATALOG.find(x => x.n === name) : null;
  const base = f && BASE_BY.get(norm(f.n)), changed = f && base && rowOf(base) !== rowOf(f);
  dlg = { type: 'cat', old: f ? f.n : null };
  const u = f ? f.units.map(x => `${x.one}${x.many !== x.one ? '/' + x.many : ''}:${x.g}`).join('; ') : '';
  showDlg(`<h2>${f ? 'Modifica nel catalogo' : 'Nuovo alimento nel catalogo'}</h2>
   <p class="small muted">Vale per tutti gli utenti. Solo dati neutri: kcal, porzioni, sinonimi. Previsto, sconsigliato e vietato li decide il piano di ognuno.</p>
   <label for="cN">Nome</label><input type="text" id="cN" value="${esc(f ? f.n : $('q').value.trim())}" maxlength="80" autocomplete="off" required>
   <div class="two"><div><label for="cC">Categoria</label><select id="cC">${CAT_CATS.map(c => `<option${f && f.c === c ? ' selected' : ''}>${c}</option>`).join('')}</select></div>
   <div><label for="cK">kcal per 100 g</label><input type="number" id="cK" min="0" max="950" step="1" inputmode="numeric" value="${f ? f.k : ''}" required></div></div>
   <label for="cU">Porzioni</label><input type="text" id="cU" value="${esc(u)}" placeholder="fetta/fette:30; vasetto/vasetti:125" autocomplete="off" autocapitalize="off">
   <p class="small muted hint">singolare/plurale:grammi, separate da «;»</p>
   <label for="cA">Sinonimi</label><input type="text" id="cA" value="${esc(f ? f.alias.join(', ') : '')}" placeholder="separati da virgola" autocomplete="off" autocapitalize="off">
   <label for="cNo">Nota</label><input type="text" id="cNo" value="${esc(f ? f.nota : '')}" placeholder="Solo informazioni oggettive, es. Peso secco." autocomplete="off">
   ${f ? `<p class="small muted">Se cambi il nome, quello vecchio resta come sinonimo: i menù che lo usano continuano a funzionare.</p>` : ''}
   <p class="bad small" id="cErr" hidden></p>
   ${changed ? '<button class="linkbtn" type="button" data-act="catrestore">Ripristina i valori originali</button>' : ''}`, { del: !!f });
  $('dDel').textContent = 'Elimina';
}
function catImportPreview() {
  const lines = $('cImp').value.split('\n').map(x => x.trim()).filter(x => x && !/^(#|\/\/|\/\*|\*|window\.|`)/.test(x));
  const ok = [], bad = [];
  lines.forEach(l => { const f = parseRow(l); (f ? ok : bad).push(f || l) });
  const nuovi = ok.filter(f => !catByNorm.has(norm(f.n))).length;
  dlg.rows = ok;
  $('cImpRes').innerHTML = lines.length ? `<p class="small">${ok.length === 1 ? '1 riga valida' : ok.length + ' righe valide'}: <strong>${nuovi}</strong> ${nuovi === 1 ? 'nuova' : 'nuove'}, <strong>${ok.length - nuovi}</strong> ${ok.length - nuovi === 1 ? 'aggiorna un alimento esistente' : 'aggiornano alimenti esistenti'}.</p>${bad.length ? `<p class="bad small">${bad.length === 1 ? '1 riga non valida (ignorata)' : bad.length + ' righe non valide (ignorate)'}:<br>${bad.slice(0, 5).map(x => esc(x.slice(0, 60))).join('<br>')}${bad.length > 5 ? '<br>…' : ''}</p>` : ''}` : '';
  $('cImpGo').disabled = !ok.length;
}
function openCatImport() {
  dlg = { type: 'catimp', rows: [] };
  showDlg(`<h2>Importa nel catalogo</h2>
   <p class="small muted">Incolla una riga per alimento, nel formato di <code>js/foods.js</code>:<br><code>nome|categoria|kcal per 100 g|porzioni|sinonimi|nota</code><br>Se il nome esiste già, l'alimento viene aggiornato. Categorie: ${CAT_CATS.join(', ')}.</p>
   <textarea id="cImp" rows="7" placeholder="Kefir|Latticini|52|bicchiere/bicchieri:200|kefir bianco|" autocomplete="off" autocapitalize="off" spellcheck="false"></textarea>
   <div id="cImpRes"></div>
   <div class="acts"><span class="sp"></span><button class="btn ghost" type="button" data-act="closedlg">Annulla</button><button class="btn pri" type="button" data-act="catimpgo" id="cImpGo" disabled>Pubblica per tutti</button></div>`, { noActs: true });
  $('cImp').addEventListener('input', catImportPreview);
}
function downloadText(txt, name, type) {
  try { const url = URL.createObjectURL(new Blob([txt], { type })); const l = document.createElement('a'); l.href = url; l.download = name; document.body.appendChild(l); l.click(); l.remove(); setTimeout(() => URL.revokeObjectURL(url), 5000); return true } catch (e) { return false }
}
const catalogText = () => '# Catalogo alimenti di Appanzay · ' + CATALOG.length + ' alimenti · ' + new Date().toLocaleDateString('it-IT') + '\n# nome|categoria|kcal per 100 g|porzioni|sinonimi|nota\n' + CATALOG.map(rowOf).join('\n') + '\n';
function catalogCard() {
  if (!fbUser || !ADMIN.known) return '';
  const nMod = (CAT_EDIT.righe || []).length + (CAT_EDIT.rimossi || []).length;
  if (ADMIN.me) return `<div class="card"><h3>Catalogo alimenti comune</h3><p>Sei l'amministratore: le modifiche valgono per tutti gli utenti.</p>
   <p class="small muted">${CATALOG.length} alimenti · ${nMod ? nMod + (nMod === 1 ? ' modifica' : ' modifiche') + ' rispetto alla base' : 'nessuna modifica rispetto alla base'}${CAT_EDIT.aggiornato ? ' · ultima il ' + esc(new Date(CAT_EDIT.aggiornato).toLocaleDateString('it-IT')) : ''}.</p>
   <div class="row2"><button class="btn" type="button" data-act="gocat">Modifica alimenti</button><button class="btn" type="button" data-act="catimport">Importa righe</button><button class="btn" type="button" data-act="catexport">Scarica catalogo</button></div></div>`;
  if (!ADMIN.exists) return `<div class="card"><h3>Catalogo alimenti comune</h3><p>Il catalogo non ha ancora un amministratore. Chi lo diventa può aggiungere, modificare ed eliminare alimenti per tutti gli utenti.</p><p class="small muted">Si fa una volta sola: dopo, il pulsante sparisce per tutti.</p><button class="btn pri" type="button" data-act="catadmin">Diventa amministratore</button></div>`;
  return '';
}

/* ---------- Modifiche con annulla ---------- */
function mutate(scope, key, fn, label) {
  if (scope === 'day') {
    const d = dayObj(key); undoStack = { scope, key, prev: clone(d) };
    if (!d.meals) d.meals = clone(S.week[wdOf(key)]);
    fn(d.meals); save('day:' + key);
  } else if (scope === 'lib') {
    undoStack = { scope, key, prev: clone(S.library) };
    const L = S.library.find(x => x.id === key); if (L) fn([L]); save('meals');
  } else {
    undoStack = { scope, key, prev: clone(S.week) };
    fn(S.week[+key]); save('week');
  }
  render(); if (label) toast(label, true);
}
function undo() {
  if (!undoStack) return; const u = undoStack; undoStack = null;
  if (u.scope === 'day') { S.days[u.key] = u.prev; save('day:' + u.key) } else if (u.scope === 'lib') { S.library = u.prev; save('meals') } else { S.week = u.prev; save('week') }
  $('toast').hidden = true; render();
}
let tt;
function toast(t, canUndo) { $('toastTxt').textContent = t; $('toastUndo').hidden = !canUndo; $('toast').hidden = false; clearTimeout(tt); tt = setTimeout(() => $('toast').hidden = true, 6000) }

/* ---------- Selezione multipla (tieni premuto su un alimento) ---------- */
let SEL = null; // { scope, key, mid, set }
let longPressed = false, lpTimer = null, lpStart = null;
const selFor = (scope, key, mid) => SEL && SEL.scope === scope && String(SEL.key) === String(key) && SEL.mid === mid;
function clearSel() { if (SEL) { SEL = null; render() } }
document.addEventListener('pointerdown', e => {
  const r = e.target.closest('.row[data-act="item"]'); if (!r || (e.pointerType === 'mouse' && e.button !== 0)) return;
  longPressed = false; lpStart = { x: e.clientX, y: e.clientY };
  clearTimeout(lpTimer);
  lpTimer = setTimeout(() => {
    const { s, k, m, i } = r.dataset;
    if (!selFor(s, k, m)) SEL = { scope: s, key: k, mid: m, set: new Set() };
    SEL.set.add(+i); longPressed = true;
    try { navigator.vibrate && navigator.vibrate(15) } catch (err) { }
    render();
  }, 450);
});
const cancelLp = () => { clearTimeout(lpTimer); lpTimer = null };
document.addEventListener('pointerup', cancelLp);
document.addEventListener('pointercancel', cancelLp);
document.addEventListener('pointermove', e => { if (lpTimer && lpStart && Math.hypot(e.clientX - lpStart.x, e.clientY - lpStart.y) > 10) cancelLp() });
document.addEventListener('contextmenu', e => { if (e.target.closest('.row[data-act="item"]')) e.preventDefault() });

const OPENLIB = new Set();
document.addEventListener('toggle', e => { const d = e.target; if (d.classList && d.classList.contains('libmeal')) { d.open ? OPENLIB.add(d.dataset.id) : OPENLIB.delete(d.dataset.id) } }, true);

/* ---------- Componenti ---------- */
function mealsHTML(scope, key, meals, eaten) {
  return '<div class="meals">' + meals.map(m => {
    const isE = eaten && eaten[m.id];
    const flags = m.items.map(it => foodBy(it.f)).filter(f => f && (f.s === 'no' || f.s === 'warn'));
    const flag = flags.some(f => f.s === 'no') ? '<span class="flag no">Contiene un vietato</span>' : flags.length ? '<span class="flag warn">Contiene uno sconsigliato</span>' : '';
    return `<article class="meal${isE ? ' eaten' : ''}">
    <div class="mhead"><h3>${esc(m.name)}</h3>${flag}<span class="kc">${fmt(mealKcal(m))} kcal</span>
    ${eaten ? `<button class="eat" data-act="eat" data-m="${esc(m.id)}" aria-pressed="${!!isE}">${isE ? '✓ Mangiato' : 'Segna mangiato'}</button>` : ''}
    <button class="icon" data-act="meal" data-s="${scope}" data-k="${key}" data-m="${esc(m.id)}" aria-label="Opzioni di ${esc(m.name)}">⋯</button></div>
    ${fmtOf(m) ? `<div class="fmtrow"><div class="fmtseg" role="group" aria-label="Formato del pasto">${[['primo', 'Primo'], ['secondo', 'Secondo']].map(([v, l]) => `<button type="button" data-act="fmt" data-v="${v}" data-s="${scope}" data-k="${key}" data-m="${esc(m.id)}" aria-pressed="${fmtOf(m) === v}">${l}</button>`).join('')}</div><span class="dish">${esc(dishName(m))}</span></div>` : ''}
    <ul class="items">${m.items.map((it, i) => {
      const f = foodBy(it.f), on = selFor(scope, key, m.id), sel = on && SEL.set.has(i);
      return `<li><button class="row${on ? ' selmode' : ''}${sel ? ' sel' : ''}" data-act="item" data-s="${scope}" data-k="${key}" data-m="${esc(m.id)}" data-i="${i}"${on ? ` aria-pressed="${sel}"` : ''}>
      <span class="dot ${f ? f.s : ''}" title="${f ? ST[f.s] : 'Non in elenco'}"></span><span>${esc(it.f)}</span><span class="g">${esc(itemQty(it))}</span><span class="k">${fmt(itemKcal(it))} kcal</span></button></li>`
    }).join('')}</ul>
    ${selFor(scope, key, m.id) ? `<div class="selbar"><button class="btn ghost" type="button" data-act="selcancel">Annulla</button><button class="btn ghost" type="button" data-act="selall">Tutti</button><span></span><button class="btn delbtn" type="button" data-act="seldel" aria-label="Elimina ${SEL.set.size} selezionati">Elimina (${SEL.set.size})</button></div>` : `<div class="addrow"><button class="add" data-act="additem" data-s="${scope}" data-k="${key}" data-m="${esc(m.id)}">+ Aggiungi alimento</button>${scope === 'day' ? `<button class="add alt" data-act="alt" data-m="${esc(m.id)}">⇄ Alternativa</button>` : scope === 'lib' ? `<button class="add alt" data-act="libapply" data-id="${esc(m.id)}">Inserisci nel menù</button>` : ''}</div>`}</article>`
  }).join('') +
    (scope === 'lib' ? '</div>' : `<button class="btn" data-act="addmeal" data-s="${scope}" data-k="${key}">+ Aggiungi pasto</button></div>`);
}
const glassSVG = '<svg viewBox="0 0 24 34" aria-hidden="true"><path d="M3 2h18l-2.2 29a2 2 0 0 1-2 1.8H7.2a2 2 0 0 1-2-1.8z"/><path class="w" d="M4.6 12h14.8l-1.6 18.8a1.2 1.2 0 0 1-1.2 1H7.4a1.2 1.2 0 0 1-1.2-1z" style="stroke:none"/></svg>';

/* ---------- Vista Oggi ---------- */
function renderToday() {
  const d = S.date, day = dayObj(d), meals = mealsOf(d), st = S.settings;
  const planned = meals.reduce((a, m) => a + mealKcal(m), 0);
  const eaten = meals.filter(m => day.eaten[m.id]).reduce((a, m) => a + mealKcal(m), 0);
  const C = 2 * Math.PI * 44, pct = Math.min(1, eaten / st.kcal), pPct = Math.min(1, planned / st.kcal);
  const today = ymd(new Date());
  const dt = parse(d).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' });
  const ml = day.water * st.glass;
  let hint = '';
  if (day.water >= st.water) hint = 'Obiettivo raggiunto. Con caldo o sudorazione bevi di più.';
  else if (st.water === 10) { const s = WATER_SLOTS.find(x => x[0] > day.water); hint = 'Prossimo: ' + (s[0] - day.water > 1 ? (s[0] - day.water) + ' bicchieri ' : 'un bicchiere ') + s[1] + '.' }
  else hint = 'Mancano ' + (st.water - day.water) + ' bicchieri.';
  const glasses = Array.from({ length: st.water }, (_, i) => `<button class="glass${i < day.water ? ' full' : ''}" data-act="glass" data-i="${i}" aria-label="Bicchiere ${i + 1}">${glassSVG}</button>`).join('');
  const L = v => (v / 1000).toLocaleString('it-IT', { maximumFractionDigits: 1 });
  $('v-oggi').innerHTML = `
  <div class="daynav"><button class="icon" data-act="prev" aria-label="Giorno precedente">‹</button>
   <div class="dayname"><h2>${esc(dt.charAt(0).toUpperCase() + dt.slice(1))}</h2>${d !== today ? '<button class="linkbtn" type="button" data-act="today">Torna a oggi</button>' : '<span class="small muted">Oggi</span>'}</div>
   <button class="icon" data-act="next" aria-label="Giorno successivo">›</button></div>
  <div class="hero">
   <div class="card ring">
    <div class="ringbox"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="44" fill="none" stroke="var(--soft)" stroke-width="10"/>
     <circle cx="50" cy="50" r="44" fill="none" stroke="var(--line)" stroke-width="10" stroke-dasharray="${pPct * C} ${C}"/>
     <circle cx="50" cy="50" r="44" fill="none" stroke="var(--acc)" stroke-width="10" stroke-linecap="round" stroke-dasharray="${pct * C} ${C}"/></svg>
     <div class="val"><span class="big">${fmt(eaten)}</span><span class="small muted">kcal mangiate</span></div></div>
    <div><h3 style="margin-bottom:8px">Calorie</h3><div class="kv">
     <span class="muted">Obiettivo</span><b>${fmt(st.kcal)} kcal</b>
     <span class="muted">Nel menù di oggi</span><b>${fmt(planned)} kcal</b>
     <span class="muted">Ancora da mangiare</span><b>${fmt(Math.max(0, planned - eaten))} kcal</b>
     <span class="muted">Differenza menù</span><b class="${Math.abs(planned - st.kcal) > 150 ? 'bad' : 'good'}">${planned - st.kcal > 0 ? '+' : ''}${fmt(planned - st.kcal)}</b></div></div>
   </div>
   <div class="card"><div class="wrow"><h3 style="flex:1">Acqua</h3><span class="big">${L(ml)} L</span><span class="muted">di ${L(st.water * st.glass)} L</span></div>
    <div class="glasses">${glasses}</div>
    <div class="wrow"><button class="icon" data-act="wminus" aria-label="Togli un bicchiere">−</button><button class="icon" data-act="wplus" aria-label="Aggiungi un bicchiere">+</button><span class="muted" style="flex:1 1 180px">${day.water} bicchieri da ${st.glass} ml. ${hint}</span></div>
   </div>
  </div>
  <div class="cols"><div>
   ${day.meals ? `<div class="notice"><span style="flex:1">Hai modificato i pasti di oggi. Il menù settimanale resta com'era.</span><button class="btn" data-act="reset">Ripristina dal menù</button></div>` : ''}
   ${mealsHTML('day', d, meals, day.eaten)}
  </div><aside class="side">
   <div class="card">${PL && PL.regole.diario_sintomi ? `<h3>Sintomi</h3><p class="small muted" style="margin:4px 0 10px">0 nessuno · 3 forti.</p>
    <div class="seg">${[0, 1, 2, 3].map(v => `<button data-act="sym" data-v="${v}" aria-pressed="${day.sym === v}">${v}</button>`).join('')}</div>
    <label for="note">Note del giorno</label>` : '<h3><label for="note" style="margin:0;font-size:inherit">Note del giorno</label></h3>'}<textarea id="note" placeholder="Es. come ti sei sentito, cosa hai cambiato">${esc(day.note)}</textarea></div>
   <p class="small muted">Le calorie sono stime con valori medi per 100 g (margine circa 10 %). Puoi correggerle alimento per alimento.</p>
  </aside></div>`;
}

/* ---------- Vista Settimana ---------- */
function renderWeek() {
  const wd = S.wd, meals = S.week[wd];
  const monday = addDays(ymd(new Date()), -wdOf(ymd(new Date())));
  const rows = WDS.map((n, i) => {
    const d = addDays(monday, i), day = S.days[d] || { water: 0, eaten: {} }, ms = (S.days[d] && S.days[d].meals) || S.week[i];
    const eat = ms.filter(m => day.eaten && day.eaten[m.id]).reduce((a, m) => a + mealKcal(m), 0);
    return `<tr><td>${n}</td><td class="n">${fmt(S.week[i].reduce((a, m) => a + mealKcal(m), 0))}</td><td class="n">${eat ? fmt(eat) : '–'}</td><td class="wcell"><div class="bar" title="${day.water || 0} bicchieri su ${S.settings.water}" aria-label="Acqua: ${day.water || 0} bicchieri su ${S.settings.water}"><i style="width:${Math.min(100, (day.water || 0) / S.settings.water * 100)}%"></i></div></td></tr>`
  }).join('');
  const freq = (PL ? PL.freq : []).map(fq => {
    const n = S.week.reduce((a, day) => a + day.filter(m => freqHits(m.items).includes(fq)).length, 0);
    return `<li><span>${esc(fq.label)}</span><span class="${freqOk(fq, n) ? 'good' : 'bad'}">${n} <span class="muted" style="font-weight:400">/ ${fq.rule === 'almeno' ? 'almeno ' : fq.rule === 'massimo' ? 'max ' : ''}${fq.n}</span></span></li>`
  }).join('');
  const oldWds = document.querySelector('#v-settimana .wds'), keepX = oldWds ? oldWds.scrollLeft : 0;
  $('v-settimana').innerHTML = `
  <h2>Menù settimanale</h2>
  <p class="muted">È il modello che si ripete ogni settimana. Le modifiche qui valgono per tutti i giorni con quel nome; per cambiare un solo giorno usa la vista Oggi.</p>
  <div class="wds">${WDS.map((n, i) => `<button data-act="wd" data-i="${i}" aria-pressed="${i === wd}">${n}<small>${fmt(S.week[i].reduce((a, m) => a + mealKcal(m), 0))} kcal</small></button>`).join('')}</div>
  <div class="cols"><div><h3 style="margin:0 0 10px">${WD[wd]}</h3>${mealsHTML('tpl', wd, meals, null)}
   <section class="libsec"><div class="libhead"><h3>I miei pasti</h3><button class="btn" type="button" data-act="libnew">+ Nuovo</button></div>
    <p class="small muted">Pasti da riusare: inseriscili nei giorni che vuoi, anche tutti insieme. Le modifiche al menù si vedono subito in Oggi; quello che cambi in Oggi resta solo per quel giorno. Per salvare un pasto del menù usa ⋯ sul pasto.</p>
    ${S.library.length ? S.library.map(L => `<details class="libmeal" data-id="${esc(L.id)}"${OPENLIB.has(L.id) ? ' open' : ''}><summary><span class="ln">${esc(L.name)}</span><span class="lt">${TYPE_LABEL[mealType(L)] || ''} · ${fmt(mealKcal(L))} kcal</span></summary>${mealsHTML('lib', L.id, [L], null)}</details>`).join('') : '<p class="muted">Non hai ancora pasti salvati.</p>'}
   </section>
   <p>${PL ? '<button class="btn ghost" data-act="resetweek">Ripristina il menù del piano</button>' : ''}</p></div>
  <aside class="side">
   <div class="card"><h3>Questa settimana</h3><div class="scroll"><table><thead><tr><th>Giorno</th><th class="n">Menù</th><th class="n">Mangiate</th><th>Acqua</th></tr></thead><tbody>${rows}</tbody></table></div>
    <p class="small muted">kcal del menù e kcal dei pasti segnati come mangiati.</p></div>
   ${freq ? `<div class="card"><h3>Frequenze del menù</h3><ul class="freq">${freq}</ul><p class="small muted">Obiettivi del tuo piano. Conta un pasto per voce.</p></div>` : ''}
  </aside></div>`;
  // Lo slider dei giorni resta dov'era e il giorno scelto resta visibile.
  const w = document.querySelector('#v-settimana .wds'), sel = w && w.querySelector('[aria-pressed=true]');
  if (w) {
    w.scrollLeft = keepX;
    if (sel) { const l = sel.offsetLeft, r = l + sel.offsetWidth; if (l < w.scrollLeft) w.scrollLeft = l - 8; else if (r > w.scrollLeft + w.clientWidth) w.scrollLeft = r - w.clientWidth + 8 }
  }
}
// Carica i giorni della settimana corrente che non sono ancora in memoria, poi aggiorna la tabella.
async function loadWeekDays() {
  const monday = addDays(ymd(new Date()), -wdOf(ymd(new Date())));
  const missing = Array.from({ length: 7 }, (_, i) => addDays(monday, i)).filter(d => !loaded.has(d));
  if (!missing.length) return;
  await Promise.all(missing.map(loadDay));
  if (currentTab() === 'settimana') renderWeek();
}

/* ---------- Ricerca online: Open Food Facts (prodotti confezionati di tutto il mondo) ---------- */
// Limite del servizio: 10 ricerche al minuto. Si cerca solo su richiesta, mai mentre si scrive.
const OFF_URL = 'https://world.openfoodfacts.org/cgi/search.pl';
const offTimes = [];
const OFF = { q: '', list: null, err: '', loading: false, where: '' };
const offAvailable = () => !(window.claude && window.claude.use);
async function offSearch(q) {
  const now = Date.now(); while (offTimes.length && now - offTimes[0] > 60000) offTimes.shift();
  if (offTimes.length >= 8) throw { code: 'rate' };
  offTimes.push(now);
  const params = new URLSearchParams({ search_terms: q, search_simple: 1, action: 'process', json: 1, page_size: 24, lc: 'it', app_name: 'Appanzay', fields: 'code,product_name,product_name_it,brands,nutriments,serving_quantity,serving_size' });
  let r;
  try { r = await fetch(OFF_URL + '?' + params, { headers: { Accept: 'application/json' } }) } catch (e) { throw { code: 'net' } }
  if (!r.ok) throw { code: r.status === 429 || r.status === 503 ? 'busy' : 'http' };
  const j = await r.json();
  const seen = new Set();
  return (j.products || []).map(p => {
    const n = String(p.product_name_it || p.product_name || '').trim(), nu = p.nutriments || {};
    let k = nu['energy-kcal_100g']; if (k == null && nu.energy_100g != null) k = nu.energy_100g / 4.184;
    const pg = +p.serving_quantity || 0, brand = String(p.brands || '').split(',')[0].trim();
    return { n, brand, k: k == null || isNaN(+k) ? null : Math.round(+k), pg: pg > 0 && pg < 2000 ? Math.round(pg) : 0, code: p.code };
  }).filter(p => { const key = norm(p.n + p.brand); if (!p.n || p.k == null || seen.has(key)) return false; seen.add(key); return true }).slice(0, 12);
}
const offMsg = c => ({ rate: 'Troppe ricerche in un minuto: aspetta qualche secondo e riprova.', busy: 'Open Food Facts è occupato in questo momento: riprova tra poco.', net: 'Connessione assente o servizio non raggiungibile.' }[c] || 'Ricerca non riuscita.');
async function runOff(q, where) {
  Object.assign(OFF, { q, where, list: null, err: '', loading: true }); paintOff();
  try { OFF.list = await offSearch(q) } catch (e) { OFF.err = offMsg(e && e.code) }
  OFF.loading = false; paintOff();
}
const offName = p => p.brand && !norm(p.n).includes(norm(p.brand)) ? `${p.n} (${p.brand})` : p.n;
function offListHTML(pickAct) {
  if (OFF.loading) return '<p class="muted small">Cerco tra i prodotti confezionati…</p>';
  if (OFF.err) return `<p class="bad small">${esc(OFF.err)}</p>`;
  if (!OFF.list) return '';
  if (!OFF.list.length) return '<p class="muted small">Nessun prodotto trovato con le calorie indicate.</p>';
  return `<ul class="offlist">${OFF.list.map((p, i) => `<li><div><strong>${esc(p.n)}</strong>${p.brand ? ` <span class="muted">· ${esc(p.brand)}</span>` : ''}<div class="small muted">${fmt(p.k)} kcal/100 g${p.pg ? ` · 1 porzione = ${fmt(p.pg)} g (${fmt(p.pg * p.k / 100)} kcal)` : ''}</div></div><button class="btn" type="button" data-act="${pickAct}" data-i="${i}">${pickAct === 'offadd' ? 'Aggiungi' : 'Usa'}</button></li>`).join('')}</ul>
   <p class="small muted">Dati di <a href="https://world.openfoodfacts.org" target="_blank" rel="noopener">Open Food Facts</a> (licenza ODbL), inseriti dagli utenti: controlla l'etichetta.</p>`;
}
function paintOff() {
  if (OFF.where === 'alimenti' && $('offres')) $('offres').innerHTML = offListHTML('offadd');
  if (OFF.where === 'dlg' && $('fOff')) $('fOff').innerHTML = offListHTML('offpick');
}
function addOffFood(p) {
  const n = offName(p);
  if (!foodBy(n)) { S.custom.push({ n, k: p.k, pg: p.pg, src: 'off', code: p.code }); save('foods'); renderDatalist() }
  return n;
}

/* ---------- Vista Alimenti ---------- */
function unitsLine(f) { return f.units.slice(0, 2).map(u => `1 ${esc(u.one)} = ${fmtQ(u.g)} g · ${fmt(u.g * f.k / 100)} kcal`).join(' · ') }
function foodCard(f) {
  const ed = ADMIN.me && f.cat;
  const tag = f.man ? '<span class="tag">da te</span>' : f.conf ? '<span class="tag warn">in disaccordo col piano</span>' : '';
  return `<div class="food ${f.s}${ed ? ' editable' : ''}"${ed ? ` data-act="catedit" data-n="${esc(f.n)}" role="button" tabindex="0" aria-label="Modifica ${esc(f.n)} nel catalogo"` : ''}><div class="t"><strong>${esc(f.n)}</strong><span class="badge ${f.s}">${ST[f.s]}</span></div>
 <div class="small">${esc(f.r)}${f.p ? ' · <span class="muted">' + esc(f.p) + '</span>' : ''}</div>${f.note ? `<div class="small muted">${esc(f.note)}</div>` : ''}
 <div class="small muted fline"><span>${fmt(f.k)} kcal/100 g${f.units.length ? ' · ' + unitsLine(f) : ''}</span>${tag}<button class="linkbtn small mk" type="button" data-act="markfood" data-n="${esc(f.n)}">Segna</button></div></div>`
}
function menuHits(q) {
  const hits = [];
  const scan = (label, meals) => meals.forEach(m => m.items.forEach(it => { const f = foodBy(it.f) || { n: it.f, alias: [], c: '' }; if (matches(f, q)) hits.push(`${label} · ${esc(m.name)}: <strong>${esc(it.f)}</strong> ${esc(itemQty(it))}`) }));
  if (S.days[S.date] && S.days[S.date].meals) scan('Oggi', S.days[S.date].meals);
  S.week.forEach((meals, i) => scan(WDS[i], meals));
  return hits;
}
function renderFoods() {
  const q = $('q').value.trim(), all = allFoods();
  const found = q ? all.filter(f => matches(f, q)) : all;
  const byCond = f => f.conds && f.conds.length, byMan = f => !!f.man;
  if ((S.filter === 'cond' && !(SALUTE.cond || []).length) || (S.filter === 'man' && !Object.keys(SALUTE.man || {}).length)) S.filter = 'all';
  const shown = found.filter(f => S.filter === 'all' || f.s === S.filter || (S.filter === 'ok' && f.s === 'custom') || (S.filter === 'cond' && byCond(f)) || (S.filter === 'man' && byMan(f)));
  const cnt = s => found.filter(f => f.s === s).length;
  $('fchips').innerHTML = [['all', 'Tutti', found.length], ['ok', 'Previsti', cnt('ok') + cnt('custom')], ['warn', 'Sconsigliati', cnt('warn')], ['no', 'Vietati', cnt('no')], ['none', 'Non indicati', cnt('none')]]
    .concat((SALUTE.cond || []).length ? [['cond', 'Per le mie condizioni', found.filter(byCond).length]] : [])
    .concat(Object.keys(SALUTE.man || {}).length ? [['man', 'Segnati da me', found.filter(byMan).length]] : [])
    .map(([k, l, n]) => `<button data-act="filter" data-f="${k}" aria-pressed="${S.filter === k}">${l} · ${n}</button>`).join('');
  let v = '';
  if (q) {
    const ex = exactOf(q, all) || (found.length === 1 ? found[0] : null);
    if (ex) v = `<div class="verdict ${ex.s === 'custom' ? 'none' : ex.s}"><strong>${esc(ex.n)}: ${ST[ex.s].toLowerCase()}</strong>${esc(ex.r)}${ex.p ? '. Porzione nel piano: ' + esc(ex.p) : ''}${ex.note ? '<br><span class="small">' + esc(ex.note) + '</span>' : ''}${ex.s === 'none' ? `<br><span class="small">${PL ? 'Il tuo piano non lo indica: chiedi a chi ti segue.' : 'Carica il tuo piano per vedere se è previsto.'}</span>` : ''}<br><button class="btn small" type="button" data-act="markfood" data-n="${esc(ex.n)}">${ex.man ? 'Cambia la tua scelta' : 'Segna per me'}</button></div>`;
    else if (!found.length) v = `<div class="verdict none"><strong>Non è nel tuo piano né nell'enciclopedia</strong>Chiedi a chi ti segue se puoi mangiarlo. Puoi comunque aggiungerlo a un pasto con le sue kcal.</div>`;
    else v = `<p class="muted" style="margin:0">${found.length} alimenti contengono "${esc(q)}".</p>`;
    const hits = menuHits(q);
    if (hits.length) v += `<details class="card inmenu"${hits.length <= 6 ? ' open' : ''}><summary>Nel tuo menù · ${hits.length}</summary><ul>${hits.map(h => `<li>${h}</li>`).join('')}</ul></details>`;
  }
  if (q.length >= 2 && offAvailable()) v += `<div class="offbox"><button class="btn" type="button" data-act="off">Cerca «${esc(q)}» tra i prodotti confezionati</button><div id="offres">${OFF.where === 'alimenti' && OFF.q === q ? offListHTML('offadd') : ''}</div></div>`;
  $('verdict').innerHTML = v;
  $('flist').innerHTML = (ADMIN.me ? `<div class="adminbar"><p class="small"><strong>Amministratore del catalogo.</strong> Tocca un alimento per modificarlo per tutti.</p><button class="btn pri" type="button" data-act="catnew">+ Nuovo alimento</button><button class="btn" type="button" data-act="catimport">Importa righe</button></div>` : '') + CATS.map(c => { const fs = shown.filter(f => f.c === c); return fs.length ? `<h3 class="cat">${c} · ${fs.length}</h3><div class="flist">${fs.map(foodCard).join('')}</div>` : '' }).join('') || '<p class="muted">Nessun alimento con questo filtro.</p>';
}

/* =====================================================================
   Alternativa: propone un pasto equivalente usando solo le equivalenze del piano
   ===================================================================== */
const SAL = new Set(['Prosciutto cotto', 'Prosciutto crudo', 'Bresaola', 'Mortadella', 'Salame', 'Speck', 'Fesa di tacchino', 'Coppa'].map(norm));
const PROT_KINDS = ['carne', 'pesce', 'tonno', 'uova', 'formaggio', 'salumi', 'legumi'];
const GREEDY = ['verdura', 'frutta'];
const fam = n => norm(n).split(' ')[0];
function mealType(m) {
  if (m.type) return m.type;
  const n = norm(m.name);
  if (n.includes('colazion')) return 'colazione';
  if (n.includes('pranzo')) return 'pranzo';
  if (n.includes('cena')) return 'cena';
  return 'spuntino';
}
function kindOf(it) {
  const f = foodBy(it.f), n = norm(it.f); if (!f) return null;
  if (n.startsWith('tonno')) return 'tonno';
  if (n === 'uovo' || n === 'albume') return 'uova';
  if (SAL.has(n)) return 'salumi';
  if (f.c === 'Pesce') return 'pesce';
  if (f.c === 'Carne e uova') return 'carne';
  if (f.c === 'Legumi') return 'legumi';
  if (f.c === 'Latticini') return /latte|yogurt|bevanda|gelato|panna|kefir|skyr/.test(n) ? 'latte' : 'formaggio';
  if (n.startsWith('patate') || n.startsWith('gnocchi') || n.startsWith('patata')) return 'patate';
  if (f.c === 'Cereali' || f.c === 'Piatti pronti') return /fette|grissini|crackers|gallette|biscotti|taralli|muesli/.test(n) ? 'snack' : 'amido';
  if (f.c === 'Verdure') return 'verdura';
  if (f.c === 'Frutta') return 'frutta';
  return 'altro';
}
function mealKinds(m) {
  const ks = new Set();
  m.items.forEach(it => { const k = kindOf(it); if (!k || (k === 'formaggio' && it.g < 40)) return; ks.add(k) });
  return ks;
}
// Gruppi di frequenza del piano presenti in un pasto
const freqHits = items => PL ? PL.freq.filter(fq => items.some(it => fq.names.has(norm(it.f)) && (+it.g || 0) >= fq.min)) : [];
function weekCounts(date, mealId) {
  const monday = addDays(date, -wdOf(date)), c = new Map();
  for (let i = 0; i < 7; i++) {
    const d = addDays(monday, i), ms = (S.days[d] && S.days[d].meals) || S.week[i] || [];
    ms.forEach(m => { if (d === date && m.id === mealId) return; freqHits(m.items).forEach(fq => c.set(fq, (c.get(fq) || 0) + 1)) });
  }
  return c;
}
const freqOk = (fq, n) => fq.rule === 'almeno' ? n >= fq.n : fq.rule === 'massimo' ? n <= fq.n : n === fq.n;
function proposals(date, mealId) {
  const meals = mealsOf(date), idx = meals.findIndex(m => m.id === mealId), meal = meals[idx], type = mealType(meal);
  const comps = equivOf(type);
  const prev = meals.slice(0, idx), next = meals.slice(idx + 1);
  const prevK = prev.reduce((a, m) => a + mealKcal(m), 0), nextK = next.reduce((a, m) => a + mealKcal(m), 0);
  const budget = S.settings.kcal - prevK - nextK;
  const ctxBase = { meal, type, budget, fmt: fmtOf(meal) };
  if (!comps.length) return { list: [], ctx: Object.assign(ctxBase, { noEquiv: true }) };
  const prevNames = {}; prev.forEach(m => m.items.forEach(it => { const n = norm(it.f); prevNames[n] = (prevNames[n] || 0) + 1 }));
  const prevFam = new Set(prev.flatMap(m => m.items.filter(it => ['amido', 'patate'].includes(kindOf(it))).map(it => fam(it.f))));
  const orig = new Set(meal.items.map(it => norm(it.f)));
  const protMissing = ['pranzo', 'cena'].includes(type) && prev.filter(m => ['pranzo', 'cena'].includes(mealType(m))).some(m => ![...mealKinds(m)].some(k => PROT_KINDS.includes(k)));
  const wc = weekCounts(date, mealId), month = parse(date).getMonth() + 1, F = fmtOf(meal);
  const jit = () => Math.random() * 0.6;
  const rep = (name, w) => (prevNames[norm(name)] || 0) * w;
  const kcalOf = items => items.reduce((a, it) => a + itemKcal(it), 0);
  const fit = k => budget > 0 ? Math.abs(k - budget) / 60 : k / 200;
  const freqScore = items => freqHits(items).reduce((a, fq) => {
    const c = wc.get(fq) || 0;
    if (fq.rule === 'massimo') return a + (c >= fq.n ? 6 : 0);
    if (fq.rule === 'almeno') return a - (c < fq.n ? 0.8 * Math.min(2, fq.n - c) : 0);
    return a + (c >= fq.n ? 3 * (c - fq.n + 1) : -0.7 * Math.min(2, fq.n - c));
  }, 0);
  // Componenti a scelta (combinati), verdura e frutta (scelte senza ripetizioni), condimenti (fissi)
  const stOf = n => (foodBy(n) || {}).s, dropped = [];
  let filtered = false;
  const choice = comps.map((c, ci) => {
    let opts = c.options.map((o, oi) => ({ o, oi }));
    const allowed = opts.filter(x => x.o.every(it => stOf(it.f) !== 'no'));
    if (allowed.length < opts.length) filtered = true;
    if (!allowed.length) { dropped.push(c.label || c.role); return null }
    opts = allowed;
    if (c.role === 'amido' && F) { const f = opts.filter(x => x.o.length !== 1 || (F === 'primo') === PRIMO_FAM.includes(fam(x.o[0].f))); if (f.length) opts = f }
    if (c.role === 'frutta' || c.role === 'spuntino') { const f = opts.filter(x => x.o.every(it => inSeason(it.f, month))); if (f.length) opts = f }
    return { c, ci, opts };
  }).filter(Boolean);
  const warnN = items => items.filter(it => stOf(it.f) === 'warn').length;
  const combos = [[]];
  choice.filter(x => !GREEDY.includes(x.c.role) && x.c.role !== 'condimento').forEach(x => {
    const nxt = []; combos.forEach(cb => x.opts.forEach(op => { if (nxt.length < 3000) nxt.push(cb.concat([[x.ci, op]])) }));
    combos.splice(0, combos.length, ...nxt);
  });
  const best = (opts) => opts.map(op => ({ op, s: op.o.reduce((a, it) => a + rep(it.f, 0.8) + (orig.has(norm(it.f)) ? 0.4 : 0), 0) + op.oi * 0.05 + warnN(op.o) * 2 + jit() })).sort((a, b) => a.s - b.s)[0].op;
  const out = [];
  combos.forEach(cb => {
    const pick = new Map(cb);
    choice.forEach(x => { if (pick.has(x.ci)) return; if (x.c.role === 'condimento') pick.set(x.ci, x.opts[0]); else if (GREEDY.includes(x.c.role)) pick.set(x.ci, best(x.opts)) });
    const items = choice.flatMap(x => pick.get(x.ci).o.map(toIt));
    const kcal = kcalOf(items);
    const chosen = cb.map(([, op]) => op);
    let s = fit(kcal) + freqScore(items) + jit() + chosen.reduce((a, op) => a + op.oi * 0.15, 0) + warnN(items) * 2;
    chosen.forEach(op => op.o.forEach(it => { s += rep(it.f, 2.5) + (orig.has(norm(it.f)) ? 1.5 : 0) }));
    const am = items.find(it => ['amido', 'patate'].includes(kindOf(it)));
    if (am && prevFam.has(fam(am.f))) s += 1.5;
    const pr = items.find(it => PROT_KINDS.includes(kindOf(it)) && !(kindOf(it) === 'formaggio' && it.g < 40));
    if (protMissing) s += pr && ['carne', 'pesce', 'tonno', 'uova', 'legumi'].includes(kindOf(pr)) ? -1.5 : 1;
    out.push({ items, kcal, s, sig: chosen.map(op => op.o.map(it => it.f).join('+')).join('|'), pr: pr ? pr.f : '', am: am ? am.f : '', hits: freqHits(items) });
  });
  const seen = new Set(), list = [];
  out.sort((a, b) => a.s - b.s).forEach(p => {
    if (seen.has(p.sig)) return; seen.add(p.sig);
    if (p.items.every(it => orig.has(norm(it.f))) && p.items.length === meal.items.length) return;
    list.push(p);
  });
  const minKcal = out.reduce((a, p) => Math.min(a, p.kcal), Infinity);
  return { list: list.slice(0, 12), ctx: Object.assign(ctxBase, { protMissing, wc, prevFam, minKcal, filtered, dropped }) };
}
function reasons(p, ctx) {
  const r = [];
  if (ctx.budget > 0) r.push(`Per questo pasto restano circa ${fmt(ctx.budget)} kcal (obiettivo meno gli altri pasti di oggi). La proposta ne ha ${fmt(p.kcal)}.`);
  else r.push(`Gli altri pasti di oggi arrivano già all'obiettivo: ho scelto una combinazione leggera.`);
  if (ctx.budget > 0 && p.kcal - ctx.budget > 120) r.push(p.kcal - ctx.minKcal <= 60 ? 'Con le grammature del piano non si scende di più: è tra gli abbinamenti più leggeri.' : `Sei sopra le kcal rimaste: con le grammature del piano il minimo per questo pasto è circa ${fmt(ctx.minKcal)} kcal.`);
  if (ctx.protMissing && p.pr) r.push('Oggi in un pasto principale è mancata la proteina: qui c\'è ' + p.pr.toLowerCase() + '.');
  p.hits.forEach(fq => { const c = (ctx.wc.get(fq) || 0) + 1; r.push(`${fq.label}: con questa sono ${c} questa settimana (${fq.rule === 'almeno' ? 'almeno' : fq.rule === 'massimo' ? 'al massimo' : 'obiettivo'} ${fq.n}).`) });
  if (p.am && ctx.prevFam.size && !ctx.prevFam.has(fam(p.am))) r.push('Cambia il tipo di amido rispetto a quello già mangiato oggi.');
  if (ctx.fmt) r.push(ctx.fmt === 'primo' ? 'Formato primo: piatto unico con pasta, riso o cereali.' : 'Formato secondo: proteina con contorno, pane o patate.');
  if (ctx.filtered) r.push('Ho escluso le opzioni con alimenti vietati per te.');
  if (ctx.dropped && ctx.dropped.length) r.push('Nessuna opzione consentita per: ' + ctx.dropped.join(', ') + '. Chiedi a chi ti segue con cosa sostituirla.');
  const w = p.items.filter(it => (foodBy(it.f) || {}).s === 'warn').map(it => it.f);
  if (w.length) r.push('Contiene alimenti sconsigliati per te: ' + w.join(', ') + '.');
  r.push('Solo alternative indicate dal tuo piano, con le sue grammature.');
  return r;
}
let ALT = null;
async function openAlt(mealId) {
  const date = S.date;
  const monday = addDays(date, -wdOf(date));
  await Promise.all(Array.from({ length: 7 }, (_, i) => loadDay(addDays(monday, i))));
  const r = proposals(date, mealId);
  ALT = { date, mealId, list: r.list, ctx: r.ctx, i: 0 };
  dlg = { type: 'alt' }; showAlt();
}
function showAlt() {
  const p = ALT.list[ALT.i], meal = ALT.ctx.meal;
  if (!p) { showDlg(`<h2>Alternativa</h2><p>${ALT.ctx.noEquiv ? 'Il tuo piano non ha equivalenze per questo tipo di pasto: aggiungile nel file del piano (sezione "equivalenze").' : 'Non trovo alternative valide per questo pasto.'}</p><div class="acts"><span class="sp"></span><button class="btn" type="button" data-act="altno">Chiudi</button></div>`, { noActs: true }); return }
  const n = ALT.list.length;
  showDlg(`<div class="althead"><h2>Alternativa per ${esc(meal.name.toLowerCase())}</h2>
    <div class="pager"><button class="icon" type="button" data-act="altprev" aria-label="Proposta precedente"${ALT.i === 0 ? ' disabled' : ''}>‹</button><span>${ALT.i + 1} di ${n}</span><button class="icon" type="button" data-act="altnext" aria-label="Proposta successiva">›</button></div></div>
   <ul class="altlist">${p.items.map(it => { const f = foodBy(it.f); return `<li><span class="dot ${f ? f.s : ''}"></span><span>${esc(it.f)}</span><span class="g">${esc(itemQty(it))}</span><span class="k">${fmt(itemKcal(it))} kcal</span></li>` }).join('')}</ul>
   <p class="alttot"><strong>${fmt(p.kcal)} kcal</strong> <span class="muted">· quello previsto: ${fmt(mealKcal(meal))} kcal</span></p>
   <details class="whybox"><summary>Perché questa proposta</summary><ul class="why">${reasons(p, ALT.ctx).map(x => `<li>${esc(x)}</li>`).join('')}</ul></details>
   <div class="altfoot"><button class="btn pri wide" type="button" data-act="altok">Usa questa proposta</button>
    <div class="altrow"><button class="btn" type="button" data-act="altnext">↻ Un'altra</button><button class="btn ghost" type="button" data-act="altno">Scarta</button></div></div>`, { noActs: true });
}

/* ---------- Dialoghi ---------- */
let dlg = null;
function showDlg(html, opts) {
  $('dlgBody').innerHTML = html;
  $('dActs').hidden = !!opts.noActs;
  $('dDel').hidden = !opts.del;
  $('modal').hidden = false;
}
function openItem(scope, key, mid, idx) {
  const meals = mealsFor(scope, key); const m = meals.find(x => x.id === mid);
  const it = idx != null ? m.items[idx] : { f: '', g: '' };
  dlg = { type: 'item', scope, key, mid, idx };
  showDlg(`<h2>${idx != null ? 'Modifica alimento' : 'Aggiungi a ' + esc(m.name)}</h2>
   <label for="fN">Alimento</label><input type="text" id="fN" value="${esc(it.f)}" placeholder="Es. kiwi, pane, uovo" required autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" role="combobox" aria-autocomplete="list" aria-controls="fSug" aria-expanded="false">
   <ul id="fSug" class="sug" role="listbox" hidden></ul>
   <div id="fH" class="small" style="margin-top:6px"></div>
   <div class="qty"><div><label for="fQ">Quantità</label><input type="number" id="fQ" min="0" step="any" inputmode="decimal" value="${it.q || it.g || ''}" required></div>
   <div><label for="fU">Unità</label><select id="fU"></select></div></div>
   <div id="fNew" hidden><div class="two"><div><label for="fK100">kcal per 100 g</label><input type="number" id="fK100" min="0" step="1"></div>
    <div><label for="fPG">1 porzione pesa (g)</label><input type="number" id="fPG" min="0" step="1" placeholder="facoltativo"></div></div>
    <p class="small muted">Lo salvo tra i tuoi alimenti, così la prossima volta lo trovi.</p></div>
   <p class="calc" id="fCalc"></p>
   <details id="fKd"${it.k != null ? ' open' : ''}><summary class="small">Correggi le kcal</summary><input type="number" id="fK" min="0" step="1" value="${it.k ?? ''}" placeholder="automatico" aria-label="kcal"></details>`, { del: idx != null });
  sugPicked = it.f || ''; fillUnits(it.u || (idx != null ? 'g' : null)); itemHint();
  if (idx == null) setTimeout(() => $('fN').focus(), 30); // modifica: nessun focus, così la tastiera non si apre da sola
}
let unitsFor = null;
function fillUnits(sel) {
  const f = foodBy($('fN').value); const key = f ? f.n : '';
  if (unitsFor === key && sel == null) return;
  unitsFor = key;
  const us = f ? f.units : [];
  const pick = sel ?? (us[0] ? us[0].one : 'g');
  $('fU').innerHTML = `<option value="g">grammi</option>` + us.map(u => `<option value="${esc(u.one)}">${esc(u.many)} (${fmtQ(u.g)} g)</option>`).join('');
  $('fU').value = us.some(u => u.one === pick) ? pick : 'g';
  if (sel == null && pick !== 'g' && $('fU').value !== 'g') $('fQ').value = 1;
}
function computeItem() {
  const f = foodBy($('fN').value), q = +$('fQ').value || 0, uv = $('fU').value;
  let g = q, unit = null;
  if (uv !== 'g') { unit = unitOf(f, uv); if (unit) g = q * unit.g }
  const k100 = f ? f.k : (+$('fK100').value || 0);
  return { f, q, uv, g: Math.round(g * 10) / 10, kcal: Math.round(g * k100 / 100), unit };
}
/* Suggerimenti sotto il campo alimento (il datalist nativo sui telefoni finisce sopra la tastiera) */
let sugList = [], sugActive = -1, sugPicked = '';
const STATUS_ORDER = { ok: 0, custom: 1, none: 2, warn: 3, no: 4 };
function suggest(q) {
  const nq = norm(q); if (!nq) return [];
  const out = [];
  allFoods().forEach(f => {
    if (!matches(f, q)) return;
    const nn = norm(f.n);
    const al = f.alias.map(norm);
    const sc = nn === nq || al.includes(nq) ? 0 : nn.startsWith(nq) ? 1 : al.some(a => a.startsWith(nq)) ? 2 : words(f.n).some(w => w.startsWith(nq)) ? 3 : 4;
    const plan = f.p ? 0 : 1; // prima gli alimenti con una porzione nel piano
    out.push([sc, STATUS_ORDER[f.s] ?? 3, plan, nn.length, f]);
  });
  return out.sort((a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2] || a[3] - b[3]).slice(0, 8).map(x => x[4]);
}
function renderSug() {
  const el = $('fSug'), inp = $('fN'); if (!el) return;
  const q = inp.value.trim(), f = foodBy(q);
  sugList = q && q !== sugPicked ? suggest(q) : [];
  sugActive = -1;
  const off = q.length >= 2 && !f && offAvailable();
  if (!sugList.length && !off) { el.hidden = true; inp.setAttribute('aria-expanded', 'false'); return }
  el.innerHTML = sugList.map((x, i) => {
    const u = x.units[0];
    const info = u ? `1 ${esc(u.one)} = ${fmt(u.g * x.k / 100)} kcal` : `${fmt(x.k)} kcal/100 g`;
    return `<li role="option" id="sug${i}" data-act="sug" data-i="${i}"><span class="dot ${x.s}"></span><span class="sn">${esc(x.n)}</span><span class="si">${ST[x.s]} · ${info}</span></li>`;
  }).join('') + (off ? `<li class="sugoff" data-act="offdlg">Cerca «${esc(q)}» tra i prodotti confezionati</li>` : '');
  el.hidden = false; inp.setAttribute('aria-expanded', 'true');
}
function pickSug(i) {
  const f = sugList[i]; if (!f) return;
  $('fN').value = f.n; sugPicked = f.n; $('fSug').hidden = true; $('fN').setAttribute('aria-expanded', 'false');
  unitsFor = null; fillUnits(null); itemHint();
  $('fN').blur(); // chiude la tastiera: la quantità parte già da 1 porzione
}

function itemHint() {
  const n = $('fN').value.trim(), f = n && foodBy(n);
  $('fNew').hidden = !n || !!f;
  if (!n) $('fH').innerHTML = '';
  else if (!f) {
    if (!$('fH').querySelector('#fOff') || $('fH').dataset.q !== n) {
      $('fH').dataset.q = n;
      $('fH').innerHTML = '<span class="badge none">Non è nell\'enciclopedia.</span> Inserisci le kcal per 100 g' + (offAvailable() ? ', oppure <button class="linkbtn" type="button" data-act="offdlg">cercalo tra i prodotti confezionati</button>.<div id="fOff"></div>' : '.');
    }
  }
  else { $('fH').dataset.q = ''; $('fH').innerHTML = `<span class="badge ${f.s}">● ${ST[f.s]}</span> ${esc(f.r)}${f.p ? ' · nel piano: ' + esc(f.p) : ''}` }
  const c = computeItem();
  $('fCalc').innerHTML = n ? `= <strong>${fmtQ(c.g)} g</strong> · <strong>${fmt(c.kcal)} kcal</strong>` : '';
}
const typeSelect = (sel) => `<label for="mT">Tipo di pasto</label><select id="mT">${Object.entries(TYPE_LABEL).map(([v, l]) => `<option value="${v}"${v === sel ? ' selected' : ''}>${l}</option>`).join('')}</select>`;
function openMeal(scope, key, mid) {
  const meals = mealsFor(scope, key); const m = mid ? meals.find(x => x.id === mid) : null;
  dlg = { type: 'meal', scope, key, mid };
  let extra = '';
  if (m && scope === 'lib') extra = typeSelect(mealType(m)) + `<div class="dlgacts"><button class="btn wide" type="button" data-act="libapply" data-id="${esc(m.id)}">Inserisci nel menù</button></div>`;
  else if (m) extra = `<div class="dlgacts"><p class="small muted">Pasti personalizzati</p>
    <button class="btn wide" type="button" data-act="libsave">★ Salva tra i miei pasti</button>
    ${S.library.length ? `<button class="btn wide" type="button" data-act="libpick">⇄ Sostituisci con un pasto salvato</button>` : ''}</div>`;
  showDlg(`<h2>${m ? (scope === 'lib' ? 'Pasto salvato' : 'Pasto') : 'Nuovo pasto'}</h2><label for="mN">Nome</label><input type="text" id="mN" value="${esc(m ? m.name : '')}" placeholder="Es. Spuntino sera" required maxlength="40">${extra}`, { del: !!m });
}
function openLibNew() {
  dlg = { type: 'libnew' };
  showDlg(`<h2>Nuovo pasto personalizzato</h2><label for="mN">Nome</label><input type="text" id="mN" placeholder="Es. Colazione latte e fette" required maxlength="40">${typeSelect('colazione')}<p class="small muted">Dopo averlo creato aggiungi gli alimenti, poi inseriscilo nei giorni che vuoi.</p>`, { del: false });
  setTimeout(() => $('mN').focus(), 30);
}
// Scegli un pasto salvato per sostituire quello aperto
function openLibPick(scope, key, mid) {
  const m = mealsFor(scope, key).find(x => x.id === mid), t = mealType(m);
  const list = [...S.library].sort((a, b) => (mealType(b) === t) - (mealType(a) === t));
  dlg = { type: 'libpick', scope, key, mid };
  showDlg(`<h2>Sostituisci ${esc(m.name.toLowerCase())}</h2><p class="small muted">Scegli uno dei tuoi pasti. Le grammature si adattano al pasto (pranzo o cena) secondo il piano.</p>
   <ul class="piclist">${list.map(L => `<li><button type="button" data-act="libchoose" data-id="${esc(L.id)}"><strong>${esc(L.name)}</strong><span class="small muted">${TYPE_LABEL[mealType(L)] || ''} · ${fmt(mealKcal(L))} kcal · ${esc(L.items.map(it => it.f).join(', '))}</span></button></li>`).join('')}</ul>
   <div class="acts"><span class="sp"></span><button class="btn" type="button" data-act="closedlg">Annulla</button></div>`, { noActs: true });
}
const slotList = () => PL ? PL.meals : DEFAULT_MEALS;
// Inserisci un pasto salvato nel menù settimanale, su uno o più giorni
function openApply(libId, preset) {
  const L = S.library.find(x => x.id === libId); if (!L) return;
  const days = preset && preset.days ? preset.days : [S.wd];
  const sl = slotList(), slot = preset && preset.slot ? preset.slot : (sl.find(x => x.type === mealType(L)) || sl[0]).id;
  dlg = { type: 'apply', libId };
  showDlg(`<h2>Inserisci «${esc(L.name)}»</h2>
   <p class="small muted">Vale per il menù settimanale: Oggi si aggiorna da solo nei giorni che non hai modificato a mano.</p>
   <label>Giorni</label><div class="daypick">${WDS.map((n, i) => `<label><input type="checkbox" name="apd" value="${i}"${days.includes(i) ? ' checked' : ''}><span>${n}</span></label>`).join('')}</div>
   <button class="linkbtn" type="button" data-act="apall">Seleziona tutti</button>
   <label>Come</label>
   <div class="radios"><label><input type="radio" name="apm" value="replace" checked> Sostituisci il pasto</label>
    <select id="apSlot" aria-label="Pasto da sostituire">${slotList().map(x => `<option value="${esc(x.id)}"${x.id === slot ? ' selected' : ''}>${esc(x.name)}</option>`).join('')}</select>
    <label><input type="radio" name="apm" value="add"> Aggiungi come pasto in più</label></div>
   <div class="acts"><span class="sp"></span><button class="btn ghost" type="button" data-act="closedlg">Annulla</button><button class="btn pri" type="button" data-act="applylib">Applica</button></div>`, { noActs: true });
}
function applyItems(target, L) {
  target.items = adaptItems(clone(L.items), mealType(target));
  if (isMain(target)) { if (L.fmt) target.fmt = L.fmt; else delete target.fmt }
}
function applyLib(libId, days, mode, slot) {
  const L = S.library.find(x => x.id === libId); if (!L || !days.length) return;
  undoStack = { scope: 'tpl', key: S.wd, prev: clone(S.week) };
  days.forEach(d => {
    const ms = S.week[d];
    if (mode === 'add') { ms.push({ id: uidGen(), name: L.name, type: mealType(L), items: clone(L.items), ...(L.fmt ? { fmt: L.fmt } : {}) }); return }
    let t = ms.find(x => x.id === slot);
    if (!t) { const sl = slotList(), idx = sl.findIndex(x => x.id === slot), def = sl[idx] || { id: slot, name: slot, type: 'spuntino' }; t = { id: def.id, name: def.name, type: def.type, items: [] }; const pos = ms.findIndex(x => sl.findIndex(y => y.id === x.id) > idx); ms.splice(pos < 0 ? ms.length : pos, 0, t) }
    applyItems(t, L);
  });
  save('week'); render();
  toast(`«${L.name}» inserito in ${days.length === 1 ? WD[days[0]].toLowerCase() : days.length + ' giorni'}`, true);
}
function closeDlg() { $('modal').hidden = true; dlg = null; unitsFor = null; $('dDel').textContent = 'Elimina' }
$('dlg').addEventListener('submit', e => {
  e.preventDefault(); if (!dlg || ['alt', 'libpick', 'apply', 'catimp', 'prompt', 'logout'].includes(dlg.type)) return; const D = dlg;
  if (D.type === 'item') {
    const n = $('fN').value.trim(), kOver = $('fK').value; if (!n) return;
    let f = foodBy(n);
    if (!f) {
      if ($('fK100').value === '' && kOver === '') { $('fK100').focus(); return }
      if ($('fK100').value !== '') { S.custom.push({ n, k: +$('fK100').value, pg: +$('fPG').value || 0 }); save('foods'); renderDatalist(); f = foodBy(n); fillUnits(null) }
    }
    const c = computeItem(); const name = f ? f.n : n;
    const it = { f: name, g: c.g }; if (c.unit) { it.q = c.q; it.u = c.unit.one } if (kOver !== '') it.k = +kOver;
    mutate(D.scope, D.key, ms => { const m = ms.find(x => x.id === D.mid); if (D.idx != null) m.items[D.idx] = it; else m.items.push(it) }, null);
    if (f && f.s === 'no') toast(name + ' è vietato: controlla la sezione Alimenti.', true);
    else if (f && f.s === 'warn') toast(name + ' è sconsigliato: ' + f.r.toLowerCase() + '.', true);
  } else if (D.type === 'meal') {
    const n = $('mN').value.trim(); if (!n) return;
    const ty = $('mT') ? $('mT').value : null;
    mutate(D.scope, D.key, ms => { if (D.mid) { const x = ms.find(y => y.id === D.mid); x.name = n; if (ty) x.type = ty } else ms.push({ id: uidGen(), name: n, items: [] }) }, null);
  } else if (D.type === 'conds') {
    SALUTE.cond = [...document.querySelectorAll('#dlgBody input[name=cond]:checked')].map(x => x.value);
    closeDlg(); saveSalute(SALUTE.cond.length ? 'Condizioni salvate: ' + SALUTE.cond.length : 'Nessuna condizione attiva'); return;
  } else if (D.type === 'mark') {
    const all = allFoods(), f = D.n ? all.find(x => x.n === D.n) : exactOf($('mkQ').value.trim(), all);
    if (!f) { $('mkErr').textContent = 'Scegli un alimento dall\'elenco.'; $('mkErr').hidden = false; return }
    const sv = (document.querySelector('#dlgBody input[name=mkS]:checked') || {}).value || 'no';
    SALUTE.man[norm(f.n)] = { n: f.n, s: sv, nota: clean($('mkN').value).slice(0, 120) };
    closeDlg(); saveSalute(`${f.n}: ${ST[sv].toLowerCase()} per te`); return;
  } else if (D.type === 'condedit') { submitCondEdit(D); return;
  } else if (D.type === 'cat') {
    const r = readCatForm(); if (r.err) { $('cErr').textContent = r.err; $('cErr').hidden = false; return }
    publishCatalog(catUpsert(CAT_EDIT, r.f, D.old), D.old ? `${r.f.n} aggiornato` : `${r.f.n} aggiunto al catalogo`).then(ok => { if (ok) closeDlg() });
    return;
  } else if (D.type === 'libnew') {
    const n = $('mN').value.trim(); if (!n) return;
    const L = { id: 'l' + uidGen(), name: n, type: $('mT').value, items: [] };
    S.library.push(L); save('meals'); OPENLIB.add(L.id); closeDlg(); render();
    toast('Pasto creato: aggiungi gli alimenti', false); return;
  }
  closeDlg();
});
$('dDel').addEventListener('click', () => {
  if (!dlg) return; const D = dlg;
  if (D.type === 'mark') { const k = norm(D.n || $('mkQ').value); if (SALUTE.man[k]) { const n = SALUTE.man[k].n; delete SALUTE.man[k]; closeDlg(); saveSalute(n + ': scelta tolta') } return }
  if (D.type === 'condedit') {
    if (!D.confirm) { D.confirm = true; $('dDel').textContent = 'Elimina per tutti?'; return }
    const blocchi = Object.assign({}, COND_EDIT.blocchi); delete blocchi[D.id];
    const rimossi = (COND_EDIT.rimossi || []).filter(x => x !== D.id).concat(BASE_COND_BY.has(D.id) ? [D.id] : []);
    const n = (condById.get(D.id) || {}).n || D.id;
    publishConds({ blocchi, rimossi }, n + ' eliminata').then(ok => { if (ok) closeDlg() }); return;
  }
  if (D.type === 'cat') {
    if (!D.confirm) { D.confirm = true; $('dDel').textContent = 'Elimina per tutti?'; return }
    publishCatalog(catRemove(CAT_EDIT, D.old), `${D.old} eliminato dal catalogo`).then(ok => { if (ok) closeDlg() }); return;
  }
  if (D.type === 'item') mutate(D.scope, D.key, ms => ms.find(x => x.id === D.mid).items.splice(D.idx, 1), 'Alimento rimosso');
  else if (D.scope === 'lib') { undoStack = { scope: 'lib', key: D.key, prev: clone(S.library) }; S.library = S.library.filter(x => x.id !== D.key); save('meals'); render(); toast('Pasto salvato eliminato', true) }
  else mutate(D.scope, D.key, ms => ms.splice(ms.findIndex(x => x.id === D.mid), 1), 'Pasto eliminato');
  closeDlg();
});
$('dClose').addEventListener('click', closeDlg);
$('modal').addEventListener('click', e => { if (e.target.id === 'modal') closeDlg() });
document.addEventListener('keydown', e => { if (e.key !== 'Escape') return; if (!$('modal').hidden) closeDlg(); else clearSel() });
$('dlg').addEventListener('input', e => {
  if (!dlg || dlg.type !== 'item') return;
  if (e.target.id === 'fN') { fillUnits(null); renderSug() }
  if (['fN', 'fQ', 'fU', 'fK100', 'fPG'].includes(e.target.id)) itemHint();
});
$('dlg').addEventListener('change', e => { if (dlg && dlg.type === 'item' && e.target.id === 'fU') itemHint() });
$('toastUndo').addEventListener('click', undo);
document.addEventListener('keydown', e => { if (e.target.id === 'shopNew' && e.key === 'Enter') { e.preventDefault(); document.querySelector('[data-act=shopadd]').click() } });
$('dlg').addEventListener('pointerdown', e => { if (e.target.closest('#fSug')) e.preventDefault() });
$('dlg').addEventListener('keydown', e => {
  if (e.target.id !== 'fN' || !$('fSug') || $('fSug').hidden || !sugList.length) return;
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    e.preventDefault(); sugActive = (sugActive + (e.key === 'ArrowDown' ? 1 : -1) + sugList.length) % sugList.length;
    [...$('fSug').querySelectorAll('[role=option]')].forEach((li, i) => li.classList.toggle('on', i === sugActive));
    $('fN').setAttribute('aria-activedescendant', 'sug' + sugActive);
  } else if (e.key === 'Enter') { e.preventDefault(); pickSug(Math.max(0, sugActive)) }
  else if (e.key === 'Escape') { e.stopPropagation(); $('fSug').hidden = true }
});
$('dlg').addEventListener('focusout', e => { if (e.target.id === 'fN') setTimeout(() => { if ($('fSug') && document.activeElement !== $('fN')) $('fSug').hidden = true }, 150) });

/* ---------- Versione e aggiornamenti ---------- */
const VER = window.APZ_VERSION || { version: '?', date: '' };
let remoteVer = null, verChecked = 0, verErr = '';
const verDate = d => { if (!d) return ''; const [a, b] = d.split('T'); return parse(a).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' }) + (b ? ', ' + b : '') };
const newer = () => !!(remoteVer && remoteVer.version && remoteVer.version !== VER.version);
async function checkVersion(manual) {
  verChecked = Date.now(); verErr = '';
  try {
    const r = await fetch('version.json?t=' + Date.now(), { cache: 'no-store' });
    if (!r.ok) throw 0;
    remoteVer = await r.json();
  } catch (e) { if (manual) verErr = 'Non riesco a controllare: sei offline?' }
  paintUpdate();
}
function paintUpdate() {
  const bar = $('upd');
  if (newer()) { bar.innerHTML = `<span>È disponibile la versione <strong>${esc(remoteVer.version)}</strong> (hai la ${esc(VER.version)}).</span><button class="btn" type="button" data-act="update">Aggiorna</button>`; bar.hidden = false }
  else bar.hidden = true;
  if (currentTab() === 'account') renderAccount();
}
async function doUpdate() {
  setSync('Aggiornamento…');
  try { if (navigator.serviceWorker && navigator.serviceWorker.getRegistrations) { const rs = await navigator.serviceWorker.getRegistrations(); await Promise.all(rs.map(r => r.unregister())) } } catch (e) { }
  try { if (window.caches) { const ks = await caches.keys(); await Promise.all(ks.map(k => caches.delete(k))) } } catch (e) { }
  location.reload();
}

/* ---------- Piano: controllo del file, caricamento, primo accesso ---------- */
const AI_PROMPT = `Ti allego la mia dieta e un file di esempio (piano-esempio.json) dell'app Appanzay.
Trasforma la mia dieta in un unico file JSON con la stessa struttura dell'esempio
("formato": "appanzay-piano", "versione": 1).

Regole:
- Riporta solo quello che c'è nella mia dieta: non inventare grammature, stati o frequenze.
  Se un dato manca, omettilo e scrivilo in "info.note".
- "pasti": i pasti del giorno in ordine, con "id" senza spazi, "nome" e "tipo"
  (colazione, spuntino, pranzo o cena).
- "menu": 7 giorni scritti senza accenti (lunedi, martedi, mercoledi, giovedi, venerdi,
  sabato, domenica); ogni giorno ha una voce per ogni "id" dei pasti, con l'elenco degli
  alimenti. Ogni alimento ha "alimento" e "grammi" (solo il numero, parte edibile).
- "alimenti": lo stato di ogni alimento citato dalla dieta. "stato" vale solo "previsto",
  "sconsigliato" o "vietato"; il perché va in "motivo".
- "equivalenze": per ogni tipo di pasto i componenti ("ruolo": amido, proteina, verdura,
  frutta, condimento, latte, cereale, spuntino) con le alternative e le loro grammature.
- "frequenze": quante volte a settimana ("regola": almeno, massimo o esatto).
- Per gli alimenti usa i nomi dell'elenco in fondo. Se un alimento non c'è, aggiungilo in
  "alimenti" con "kcal_100g" e "categoria".
- Rispondi solo con il JSON, senza testo prima o dopo.`;
const aiPrompt = () => AI_PROMPT + '\n\nNomi degli alimenti che l\'app conosce:\n' + CATALOG.map(f => f.n).join('; ');
const TIPI = ['colazione', 'spuntino', 'pranzo', 'cena'], RUOLI = ['amido', 'proteina', 'verdura', 'frutta', 'condimento', 'latte', 'cereale', 'spuntino', 'altro'];
// Controlla un piano: errori (bloccano il caricamento) e avvisi
function validatePlan(text) {
  const E = [], W = [];
  let raw;
  try { raw = typeof text === 'string' ? JSON.parse(text.trim().replace(/^```(?:json)?\s*|\s*```$/g, '')) : text }
  catch (e) { return { errors: ['Il file non è un JSON valido: ' + e.message + '. Controlla che inizi con { e finisca con }, senza testo prima o dopo.'], warnings: [] } }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { errors: ['Il file deve contenere un oggetto JSON ({ … }).'], warnings: [] };
  if (raw.formato !== 'appanzay-piano') E.push('"formato" deve valere "appanzay-piano".');
  if (raw.versione !== 1) E.push('"versione" deve valere 1.');
  const extra = new Set((Array.isArray(raw.alimenti) ? raw.alimenti : []).filter(a => a && a.nome && a.kcal_100g != null).map(a => norm(a.nome)));
  const known = n => catByNorm.has(norm(n)) || extra.has(norm(n));
  const unknown = new Set();
  const checkItem = (x, where) => {
    if (!x || typeof x !== 'object') { E.push(`${where}: ogni alimento deve essere un oggetto { "alimento": …, "grammi": … }.`); return }
    if (!x.alimento || typeof x.alimento !== 'string') E.push(`${where}: manca "alimento".`);
    if (typeof x.grammi !== 'number' || !(x.grammi > 0)) E.push(`${where} (${x.alimento || '?'}): "grammi" deve essere un numero maggiore di 0${typeof x.grammi === 'string' ? ' (scrivi solo il numero, senza "g")' : ''}.`);
    if (x.quantita != null && (typeof x.quantita !== 'number' || !x.unita)) W.push(`${where} (${x.alimento}): "quantita" va con "unita" e deve essere un numero.`);
    if (x.alimento && !known(x.alimento)) unknown.add(x.alimento);
  };
  // pasti
  const ids = new Set();
  if (!Array.isArray(raw.pasti) || !raw.pasti.length) E.push('"pasti" deve essere un elenco con almeno un pasto.');
  else raw.pasti.forEach((m, i) => {
    if (!m || !m.id) { E.push(`pasti[${i}]: manca "id".`); return }
    if (/\s/.test(m.id)) E.push(`pasti[${i}]: l'id "${m.id}" non può contenere spazi.`);
    if (ids.has(m.id)) E.push(`pasti: l'id "${m.id}" è ripetuto.`); ids.add(m.id);
    if (!TIPI.includes(m.tipo)) W.push(`pasti «${m.id}»: "tipo" deve essere colazione, spuntino, pranzo o cena; lo considero uno spuntino.`);
  });
  // obiettivi
  const o = raw.obiettivi;
  if (o != null) {
    if (o.kcal != null && (typeof o.kcal !== 'number' || o.kcal < 800 || o.kcal > 6000)) W.push('obiettivi.kcal: valore insolito (atteso un numero tra 800 e 6000).');
    if (o.acqua_litri != null && typeof o.acqua_litri !== 'number') E.push('obiettivi.acqua_litri deve essere un numero.');
  }
  // menu
  if (raw.menu != null) {
    if (typeof raw.menu !== 'object' || Array.isArray(raw.menu)) E.push('"menu" deve essere un oggetto con i giorni da "lunedi" a "domenica".');
    else {
      Object.keys(raw.menu).forEach(g => {
        if (!GIORNI.includes(g)) { const n = norm(g); E.push(GIORNI.includes(n) ? `menu: scrivi "${n}" senza accento (non "${g}").` : `menu: "${g}" non è un giorno valido.`) }
      });
      GIORNI.forEach(g => {
        const d = raw.menu[g]; if (!d) { W.push(`menu: manca "${g}".`); return }
        Object.entries(d).forEach(([mid, v]) => {
          if (ids.size && !ids.has(mid)) W.push(`menu.${g}: il pasto "${mid}" non è in "pasti" e verrà ignorato.`);
          const list = Array.isArray(v) ? v : v && Array.isArray(v.alimenti) ? v.alimenti : null;
          if (!list) { E.push(`menu.${g}.${mid}: deve essere un elenco di alimenti o un oggetto con "alimenti".`); return }
          if (v.formato && !['primo', 'secondo'].includes(v.formato)) W.push(`menu.${g}.${mid}: "formato" vale "primo" o "secondo".`);
          list.forEach((x, i) => checkItem(x, `menu.${g}.${mid}[${i + 1}]`));
        });
      });
    }
  } else W.push('Il piano non ha un "menu": la settimana resterà vuota.');
  // alimenti
  if (raw.alimenti != null) {
    if (!Array.isArray(raw.alimenti)) E.push('"alimenti" deve essere un elenco.');
    else raw.alimenti.forEach((a, i) => {
      if (!a || !a.nome) { E.push(`alimenti[${i + 1}]: manca "nome".`); return }
      if (a.stato != null && !STATO[norm(a.stato)]) E.push(`alimenti «${a.nome}»: "stato" vale solo previsto, sconsigliato o vietato (non "${a.stato}").`);
      if (a.kcal_100g != null && typeof a.kcal_100g !== 'number') E.push(`alimenti «${a.nome}»: "kcal_100g" deve essere un numero.`);
      if (!catByNorm.has(norm(a.nome)) && a.kcal_100g == null) W.push(`alimenti «${a.nome}»: non è nell'enciclopedia; aggiungi "kcal_100g" per calcolarne le calorie.`);
    });
  }
  // equivalenze
  if (raw.equivalenze != null) {
    if (typeof raw.equivalenze !== 'object' || Array.isArray(raw.equivalenze)) E.push('"equivalenze" deve essere un oggetto (colazione, spuntino, pranzo, cena).');
    else Object.entries(raw.equivalenze).forEach(([t, comps]) => {
      if (!TIPI.includes(t)) W.push(`equivalenze: "${t}" non è un tipo di pasto (colazione, spuntino, pranzo, cena).`);
      if (!Array.isArray(comps)) { E.push(`equivalenze.${t}: deve essere un elenco di componenti.`); return }
      comps.forEach((c, ci) => {
        if (!c || !Array.isArray(c.opzioni)) { E.push(`equivalenze.${t}[${ci + 1}]: manca "opzioni".`); return }
        if (c.ruolo && !RUOLI.includes(c.ruolo)) W.push(`equivalenze.${t}[${ci + 1}]: ruolo "${c.ruolo}" sconosciuto, lo tratto come "altro".`);
        c.opzioni.forEach((op, oi) => { if (!Array.isArray(op)) E.push(`equivalenze.${t}[${ci + 1}].opzioni[${oi + 1}]: ogni opzione è un elenco di alimenti.`); else op.forEach((x, xi) => checkItem(x, `equivalenze.${t} (${c.ruolo || 'componente'}) opzione ${oi + 1}`)) });
      });
    });
  }
  // frequenze
  if (raw.frequenze != null) {
    if (!Array.isArray(raw.frequenze)) E.push('"frequenze" deve essere un elenco.');
    else raw.frequenze.forEach((f, i) => {
      if (!f || !Array.isArray(f.alimenti)) { E.push(`frequenze[${i + 1}]: manca l'elenco "alimenti".`); return }
      if (typeof f.volte !== 'number') E.push(`frequenze «${f.nome || i + 1}»: "volte" deve essere un numero.`);
      if (f.regola && !['almeno', 'massimo', 'esatto'].includes(f.regola)) E.push(`frequenze «${f.nome || i + 1}»: "regola" vale almeno, massimo o esatto.`);
      f.alimenti.forEach(n => { if (!known(n)) unknown.add(n) });
    });
  }
  if (unknown.size) W.push(`Alimenti non riconosciuti (kcal non calcolabili): ${[...unknown].slice(0, 12).join(', ')}${unknown.size > 12 ? ` e altri ${unknown.size - 12}` : ''}. Usa i nomi dell'enciclopedia o aggiungili in "alimenti" con "kcal_100g".`);
  return { errors: E, warnings: W, raw: E.length ? null : raw };
}
function planSummary(raw) {
  const P = compilePlan(raw); if (!P) return '';
  const nItems = P.menu.reduce((a, d) => a + d.reduce((b, m) => b + m.items.length, 0), 0);
  const kc = P.menu.map(d => d.reduce((a, m) => a + m.items.reduce((b, it) => { const f = catByNorm.get(norm(it.f)) || P.extraFoods.find(x => norm(x.n) === norm(it.f)); return b + (f ? it.g * f.k / 100 : 0) }, 0), 0));
  const avg = kc.length ? kc.reduce((a, b) => a + b, 0) / kc.length : 0;
  return `<ul class="plansum"><li><strong>${esc(P.info.nome || 'Piano senza nome')}</strong>${P.info.autore ? ' · ' + esc(P.info.autore) : ''}</li>
   <li>${P.meals.length} pasti al giorno · ${nItems ? `menù di 7 giorni (≈ ${fmt(avg)} kcal al giorno)` : 'nessun menù'}</li>
   <li>${P.rules.size + P.extraFoods.length} alimenti con indicazioni · ${(n => n ? `equivalenze per ${n} ${n === 1 ? 'tipo' : 'tipi'} di pasto` : 'nessuna equivalenza')(Object.keys(P.equiv).length)} · ${P.freq.length} frequenze</li>
   ${P.obj.kcal ? `<li>Obiettivo: ${fmt(P.obj.kcal)} kcal${P.obj.water ? ` · ${(P.obj.water * P.obj.glass / 1000).toLocaleString('it-IT', { maximumFractionDigits: 1 })} L d'acqua` : ''}</li>` : ''}</ul>`;
}
let pendingPlan = null;
function checkHTML(res, where) {
  const list = (arr, cls) => arr.length ? `<ul class="chk ${cls}">${arr.slice(0, 25).map(x => `<li>${esc(x)}</li>`).join('')}${arr.length > 25 ? `<li>…e altri ${arr.length - 25}</li>` : ''}</ul>` : '';
  if (res.errors.length) return `<div class="planchk bad"><strong>Il file ha ${res.errors.length === 1 ? 'un errore' : res.errors.length + ' errori'}: correggilo e ricaricalo.</strong>${list(res.errors, 'err')}${res.warnings.length ? '<p class="small">Avvisi:</p>' + list(res.warnings, 'warn') : ''}</div>`;
  const hasPlan = !!PL;
  return `<div class="planchk ok"><strong>File valido.</strong>${planSummary(res.raw)}${res.warnings.length ? `<p class="small">${res.warnings.length === 1 ? 'Un avviso' : res.warnings.length + ' avvisi'} (puoi caricarlo lo stesso):</p>` + list(res.warnings, 'warn') : ''}
   ${hasPlan ? `<label class="chkline"><input type="checkbox" id="planMenu"> Sostituisci anche il mio menù settimanale con quello del piano</label>` : ''}
   <button class="btn pri wide" type="button" data-act="planapply" data-where="${where}">Usa questo piano</button></div>`;
}
function checkPlanText(text, where) {
  const res = validatePlan(String(text)); pendingPlan = res.raw;
  const box = $(where === 'onboard' ? 'obCheck' : 'planCheck'); if (box) { box.innerHTML = checkHTML(res, where); box.scrollIntoView({ block: 'nearest', behavior: 'smooth' }) }
}
function readPlanFile(file, where) {
  const r = new FileReader();
  r.onload = () => checkPlanText(r.result, where);
  r.readAsText(file);
}
function applyPlan(raw, replaceMenu) {
  const first = !PL;
  setPlan(raw); save('plan');
  if (first || replaceMenu || !S.week || S.week.every(d => d.every(m => !m.items.length))) { S.week = defaultWeek(); save('week') }
  if (PL.obj.kcal) S.settings.kcal = PL.obj.kcal;
  if (PL.obj.water) { S.settings.water = Math.min(20, PL.obj.water); S.settings.glass = PL.obj.glass }
  save('settings'); pendingPlan = null; renderDatalist();
}
async function loadExample() {
  try { const r = await fetch('modello/piano-esempio.json', { cache: 'no-cache' }); if (!r.ok) throw 0; return await r.json() } catch (e) { return null }
}
function planSteps(where) {
  const on = where === 'onboard';
  return `<ol class="steps">
    <li><strong>Scarica l'esempio.</strong> Mostra alla tua AI come deve essere il file.
     <a class="btn wide" href="modello/piano-esempio.json" download="piano-esempio.json" target="_blank" rel="noopener">Scarica l'esempio</a></li>
    <li><strong>Copia il prompt.</strong>
     <button class="btn wide" type="button" data-act="copyprompt">Copia il prompt</button>
     <details class="moddet"><summary>Leggi il prompt</summary><pre class="prompt">${esc(AI_PROMPT)}\n\n(segue l'elenco degli alimenti dell'app)</pre></details></li>
    <li><strong>Chiedi alla tua AI.</strong> Apri ChatGPT, Claude, Gemini o un'altra AI, allega la tua dieta (PDF o foto) e l'esempio, poi incolla il prompt.</li>
    <li><strong>Carica la risposta.</strong> Salvala come file <code>.json</code> oppure copiala e incollala qui. L'app controlla tutto e ti dice cosa correggere.
     <div class="row2"><label class="btn ${on ? 'pri' : ''} filebtn">Carica file<input type="file" id="${on ? 'obFile' : 'planFile'}" accept="application/json,.json,.txt" hidden></label><button class="btn" type="button" data-act="planpaste" data-w="${where}">Incolla testo</button></div>
     <div class="pastebox" id="${on ? 'obPaste' : 'planPaste'}" hidden><textarea rows="6" spellcheck="false" autocapitalize="off" placeholder="Incolla qui la risposta dell'AI"></textarea><button class="btn pri" type="button" data-act="plancheck" data-w="${where}">Controlla</button></div></li>
   </ol>`;
}
function renderOnboard() {
  $('obBody').innerHTML = `${planSteps('onboard')}
   <div id="obCheck"></div>
   <div class="obalt"><button class="btn ghost wide" type="button" data-act="planexample">Prova con il piano di esempio</button>
   ${fbUser ? `<button class="linkbtn" type="button" data-act="logout">Esci da ${esc(fbUser.email || 'questo account')}</button>` : ''}</div>`;
}
function planCard() {
  if (!PL) return `<div class="card"><h3>Il mio piano</h3><p>Non hai ancora caricato un piano.</p>${planSteps('account')}<div id="planCheck"></div></div>`;
  return `<div class="card"><h3>Il mio piano</h3>${planSummary(S.plan)}${PL.info.data ? `<p class="small muted">Data del piano: ${esc(PL.info.data)}</p>` : ''}${PL.info.note ? `<p class="small muted">${esc(PL.info.note)}</p>` : ''}
   <div class="row2"><button class="btn" type="button" data-act="planexport">Scarica il mio piano</button></div>
   <details class="moddet"><summary>Carica un nuovo piano</summary>${planSteps('account')}</details>
   <div id="planCheck"></div></div>`;
}
function afterData() {
  if (!PL) setGate('noplan');
  else if (document.body.classList.contains('gate-noplan') || document.body.classList.contains('gate-loading')) setGate('in');
  render();
}

/* ---------- Vista Account: versione, account, dati personali, obiettivi, backup ---------- */
function renderAccount() {
  const st = S.settings;
  let acc;
  if (B.kind === 'claude') acc = `<p>I dati sono salvati nel tuo account Claude e li ritrovi su ogni dispositivo.</p>`;
  else if (fbUser) acc = `<p>Connesso come <strong>${esc(fbUser.email || fbUser.displayName || 'utente')}</strong></p><button class="btn" type="button" data-act="logout">Esci</button>`;
  else if (window.APZ_FIREBASE) acc = `<p>Stai usando l'app offline: i dati restano in questo browser finché non accedi.</p><button class="btn pri" type="button" data-act="gologin">Accedi</button>`;
  else acc = `<p>Il database non è collegato: i dati restano solo in questo browser. Fai un backup ogni tanto.</p>`;
  let upd = '';
  if (verErr) upd = `<p class="bad small">${esc(verErr)}</p>`;
  else if (newer()) upd = `<p class="msg">È disponibile la versione <strong>${esc(remoteVer.version)}</strong> del ${esc(verDate(remoteVer.date))}.</p><button class="btn pri" type="button" data-act="update">Aggiorna ora</button>`;
  else if (remoteVer) upd = `<p class="good small">Sei all'ultima versione (controllato alle ${new Date(verChecked).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}).</p>`;
  $('v-account').innerHTML = `
  <div class="card acchead"><img src="icons/icon.svg" alt="" width="60" height="60"><div><h2>Appanzay</h2><p class="small muted" style="margin:2px 0 0">Versione <strong>${esc(VER.version)}</strong> · ${esc(verDate(VER.date))}</p></div></div>
  <div class="setgrid">
   <div class="card"><h3>Account</h3><div class="syncline"><i class="sdot" id="syncDot2"></i><span id="syncTxt">${esc(lastSync)}</span></div>${acc}</div>
   ${planCard()}
   ${saluteCard()}
   ${catalogCard()}
   ${condCardAdmin()}
   <div class="card"><h3>Dati personali</h3>
    <div class="three"><div><label for="sP">Peso (kg)</label><input type="number" id="sP" min="30" max="300" step="0.1" inputmode="decimal" value="${st.peso ?? ''}"></div>
    <div><label for="sH">Altezza (cm)</label><input type="number" id="sH" min="100" max="230" step="1" inputmode="numeric" value="${st.altezza ?? ''}"></div>
    <div><label for="sA">Età (anni)</label><input type="number" id="sA" min="10" max="110" step="1" inputmode="numeric" value="${st.eta ?? ''}"></div></div>
    ${st.peso && st.altezza ? `<p class="bmi">Indice di massa corporea: <strong>${(st.peso / (st.altezza / 100) ** 2).toLocaleString('it-IT', { maximumFractionDigits: 1 })}</strong></p>` : ''}
    <p class="small muted">${st.pesoData ? 'Peso aggiornato il ' + esc(parse(st.pesoData).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })) + '.' : ''}</p></div>
   <div class="card"><h3>Obiettivi giornalieri</h3>
    <label for="sK">Calorie al giorno</label><input type="number" id="sK" min="800" max="5000" step="10" value="${st.kcal}">
    <div class="two"><div><label for="sW">Bicchieri d'acqua</label><input type="number" id="sW" min="1" max="20" value="${st.water}"></div>
    <div><label for="sG">ml per bicchiere</label><input type="number" id="sG" min="50" max="500" step="10" value="${st.glass}"></div></div>
    <p class="small muted">${PL && PL.obj.kcal ? `Il tuo piano: ${fmt(PL.obj.kcal)} kcal${PL.obj.water ? ` e ${(PL.obj.water * PL.obj.glass / 1000).toLocaleString('it-IT', { maximumFractionDigits: 1 })} L d'acqua` : ''}. ` : ''}Le modifiche si salvano da sole.</p></div>
   <div class="card"><h3>Condividi Appanzay</h3><p class="small muted" style="margin-top:4px">Manda il link a chi vuole usarla: si registra e carica il piano della sua dieta.</p>
    <input type="text" id="shareUrl" value="${esc(appUrl())}" readonly aria-label="Link dell'app">
    <div class="row2">${navigator.share ? '<button class="btn pri" type="button" data-act="share">Condividi</button>' : ''}<button class="btn" type="button" data-act="copylink">Copia link</button></div></div>
   <div class="card"><h3>Aggiornamenti</h3><p class="small muted" style="margin-top:4px">Installata: versione ${esc(VER.version)}.</p>${upd}
    ${newer() ? '' : '<button class="btn" type="button" data-act="checkver">Controlla aggiornamenti</button>'}</div>
   <div class="card"><h3>Backup</h3>
    <p class="small muted">Un file con obiettivi, piano, condizioni, menù, pasti salvati, alimenti tuoi e tutti i giorni registrati.</p>
    <div class="row2"><button class="btn" type="button" data-act="export">Scarica backup</button><button class="btn" type="button" data-act="copy">Copia backup</button>
    <label class="btn filebtn">Importa backup<input type="file" id="imp" accept="application/json,.json" hidden></label></div>
    <div id="impBox"></div></div>
   <div class="card"><h3>Informazioni</h3>
    <p class="small muted">Stati, menù, equivalenze e frequenze vengono dal tuo piano; le kcal dall'enciclopedia di Appanzay (valori medi indicativi). Appanzay non sostituisce chi ti segue.</p></div>
  </div>`;
  setSync(lastSync);
}
/* Link pubblico dell'app: quello della pagina se è pubblicata (es. GitHub Pages), altrimenti quello ufficiale */
const APP_URL = 'https://giuseppef11.github.io/appanzay/';
function appUrl() {
  const h = location.hostname;
  if (!h || h === 'localhost' || h === '127.0.0.1' || /claude|anthropic|usercontent/.test(h) || location.protocol === 'file:') return APP_URL;
  return location.origin + location.pathname.replace(/[^/]*$/, '');
}
/* ---------- Accesso (Firebase) ---------- */
function setGate(state, msg, offline) {
  document.body.classList.remove('gate-loading', 'gate-out', 'gate-in', 'gate-noplan');
  document.body.classList.add('gate-' + state);
  $('splash').hidden = state !== 'loading';
  $('login').hidden = state !== 'out';
  $('onboard').hidden = state !== 'noplan';
  if (state === 'noplan') renderOnboard();
  const m = $('loginMsg'); m.hidden = !msg; m.textContent = msg || '';
  $('loginOffline').hidden = !offline;
  $('loginVer').textContent = 'Versione ' + VER.version;
  if (state === 'out') { window.scrollTo(0, 0); if (typeof setLoginMode === 'function') { const keep = m.textContent; setLoginMode('in'); showAuthMsg(keep) } ['aP', 'aP2'].forEach(id => { const x = $(id); if (x) x.value = '' }) }
}
function showAuthMsg(m) { const el = $('loginMsg'); el.hidden = !m; el.textContent = m || '' }
let loginMode = 'in';
function setLoginMode(v) {
  loginMode = v; showAuthMsg('');
  document.querySelectorAll('.lmode [data-act=lmode]').forEach(x => x.setAttribute('aria-selected', String(x.dataset.v === v)));
  [['upOnly', v === 'up'], ['inOnly', v === 'in']].forEach(([id, on]) => { const el = $(id); el.setAttribute('aria-hidden', String(!on)); el.inert = !on });
  $('aP2').disabled = v !== 'up';
  $('aP').placeholder = v === 'up' ? 'Almeno 6 caratteri' : '';
  $('authBtn').textContent = v === 'up' ? 'Crea account' : 'Accedi';
  $('aP').setAttribute('autocomplete', v === 'up' ? 'new-password' : 'current-password');
}
$('authForm').addEventListener('submit', async e => {
  e.preventDefault(); if (!FB) return;
  const em = $('aE').value.trim(), pw = $('aP').value;
  if (!em) { showAuthMsg('Inserisci la tua email.'); return }
  if (loginMode === 'up') {
    if (pw.length < 6) { showAuthMsg('La password deve avere almeno 6 caratteri.'); return }
    if (pw !== $('aP2').value) { showAuthMsg('Le due password non coincidono.'); return }
  }
  const btn = $('authBtn'); btn.disabled = true; showAuthMsg('');
  try { await (loginMode === 'up' ? FB.emailSignup(em, pw) : FB.emailLogin(em, pw)) } catch (err) { showAuthMsg(authMsg(err)) }
  btn.disabled = false;
});
// All'uscita: via i dati in cache su questo dispositivo, si riparte dal login.
function resetLocal() {
  try { Object.keys(localStorage).filter(k => k.startsWith('apz:')).forEach(k => localStorage.removeItem(k)) } catch (e) { }
  S.settings = { kcal: 1800, water: 10, glass: 200 }; setPlan(null); S.week = defaultWeek(); S.custom = []; S.library = []; S.shop = { checked: {}, extra: [] }; S.days = {}; SALUTE = { cond: [], man: {} }; rebuildFoods();
  loaded.clear(); undoStack = null; Object.assign(ADMIN, { known: false, exists: false, me: false });
}
async function startFirebase() {
  setGate('loading');
  try {
    const mod = await import('./firebase.js?v=' + VER.version);
    FB = await mod.connect(window.APZ_FIREBASE);
  } catch (e) { FB = null; setGate('out', 'Non riesco a collegarmi al database: controlla la connessione.', true); return }
  FB.onUser(async user => {
    fbUser = user;
    if (user) {
      B = firebaseAdapter(FB, user.uid); setGate('loading'); setSync('Sincronizzazione…');
      await migrateLocal(); await loadAll(); setSync(syncLabel());
    } else { B = LOCAL; setSync(syncLabel()); setGate('out') }
  });
}
async function buildBackup() {
  let days = lsDays();
  if (B.kind !== 'local') { try { days = Object.assign(days, await B.listDays()) } catch (e) { } }
  Object.assign(days, S.days);
  return JSON.stringify({ app: 'appanzay', version: 2, exportedAt: new Date().toISOString(), settings: S.settings, plan: S.plan, week: S.week, custom: S.custom, library: S.library, shop: S.shop, salute: SALUTE, days }, null, 1);
}
let pendingImport = null;
function readImport(file) {
  const r = new FileReader();
  r.onload = () => {
    try {
      const j = JSON.parse(r.result);
      if (j.app !== 'appanzay' || !Array.isArray(j.week) || j.week.length !== 7) throw 0;
      pendingImport = j;
      $('impBox').innerHTML = `<div class="notice"><span style="flex:1">Backup del ${esc(new Date(j.exportedAt).toLocaleDateString('it-IT'))} con ${Object.keys(j.days || {}).length === 1 ? '1 giorno' : Object.keys(j.days || {}).length + ' giorni'}. Sostituisce menù e obiettivi e aggiunge i giorni.</span><button class="btn pri" type="button" data-act="doimport">Importa</button></div>`;
    } catch (e) { $('impBox').innerHTML = '<p class="bad">Il file non è un backup di Appanzay.</p>' }
  };
  r.readAsText(file);
}
function doImport() {
  const j = pendingImport; if (!j) return; pendingImport = null;
  if (j.settings) S.settings = Object.assign(S.settings, j.settings); save('settings');
  S.week = j.week; save('week');
  if (Array.isArray(j.custom)) { S.custom = j.custom; save('foods') }
  if (Array.isArray(j.library)) { S.library = j.library; save('meals') }
  if (j.plan) { setPlan(j.plan); save('plan') }
  if (j.shop) { S.shop = Object.assign({ checked: {}, extra: [] }, j.shop); save('shop') }
  if (j.salute) { applyDoc('salute', j.salute); save('salute') }
  Object.entries(j.days || {}).forEach(([d, v]) => { S.days[d] = Object.assign({ water: 0, eaten: {}, sym: null, note: '' }, v); loaded.add(d); save('day:' + d) });
  pendingImport = null; renderDatalist(); render(); toast('Backup importato', false);
}
const authMsg = e => ({ 'auth/invalid-email': 'Email non valida.', 'auth/missing-password': 'Inserisci la password.', 'auth/weak-password': 'Password troppo corta: almeno 6 caratteri.', 'auth/email-already-in-use': 'Esiste già un account con questa email: passa ad Accedi.', 'auth/invalid-credential': 'Email o password sbagliate.', 'auth/wrong-password': 'Email o password sbagliate.', 'auth/user-not-found': 'Nessun account con questa email: passa a Registrati.', 'auth/popup-blocked': 'Il browser ha bloccato la finestra di Google: riprova o usa l\'email.', 'auth/popup-closed-by-user': 'Accesso annullato.', 'auth/unauthorized-domain': 'Questo indirizzo non è autorizzato in Firebase (Authentication → Impostazioni → Domini autorizzati).', 'auth/operation-not-allowed': 'Questo metodo di accesso non è attivo in Firebase.', 'auth/network-request-failed': 'Connessione assente.' }[e && e.code] || 'Accesso non riuscito.');

/* ---------- Eventi ---------- */
document.addEventListener('click', async e => {
  const b = e.target.closest('[data-act]'); if (!b) return; const a = b.dataset.act, s = b.dataset.s, k = b.dataset.k, m = b.dataset.m;
  const day = dayObj(S.date);
  if (a === 'prev' || a === 'next' || a === 'today' || a === 'wd') SEL = null;
  if (a === 'prev' || a === 'next' || a === 'today') { S.date = a === 'today' ? ymd(new Date()) : addDays(S.date, a === 'prev' ? -1 : 1); render(); await loadDay(S.date); render() }
  else if (a === 'glass') { const i = +b.dataset.i; day.water = day.water === i + 1 ? i : i + 1; save('day:' + S.date); render() }
  else if (a === 'wplus') { day.water = Math.min(30, day.water + 1); save('day:' + S.date); render() }
  else if (a === 'wminus') { day.water = Math.max(0, day.water - 1); save('day:' + S.date); render() }
  else if (a === 'eat') { day.eaten[m] = !day.eaten[m]; if (!day.eaten[m]) delete day.eaten[m]; save('day:' + S.date); render() }
  else if (a === 'item') {
    if (longPressed) { longPressed = false; return }
    if (SEL) {
      if (selFor(s, k, m)) { const i = +b.dataset.i; SEL.set.has(i) ? SEL.set.delete(i) : SEL.set.add(i); if (!SEL.set.size) SEL = null; render() }
      else clearSel();
      return;
    }
    openItem(s, k, m, +b.dataset.i);
  }
  else if (a === 'selcancel') clearSel();
  else if (a === 'selall') { const ms = mealsFor(SEL.scope, SEL.key); const mm = ms.find(x => x.id === SEL.mid); mm.items.forEach((_, i) => SEL.set.add(i)); render() }
  else if (a === 'seldel') {
    const { scope, key, mid, set } = SEL, n = set.size; SEL = null;
    mutate(scope, key, ms => { const mm = ms.find(x => x.id === mid); if (mm) mm.items = mm.items.filter((_, i) => !set.has(i)) }, n === 1 ? '1 alimento eliminato' : n + ' alimenti eliminati');
  }
  else if (a === 'additem') openItem(s, k, m, null);
  else if (a === 'meal') openMeal(s, k, m);
  else if (a === 'addmeal') openMeal(s, k, null);
  else if (a === 'reset') { undoStack = { scope: 'day', key: S.date, prev: clone(day) }; delete day.meals; save('day:' + S.date); render(); toast('Pasti di oggi ripristinati dal menù', true) }
  else if (a === 'resetweek') { undoStack = { scope: 'tpl', key: S.wd, prev: clone(S.week) }; S.week = defaultWeek(); save('week'); render(); toast('Menù del piano ripristinato', true) }
  else if (a === 'sym') { const v = +b.dataset.v; day.sym = day.sym === v ? null : v; save('day:' + S.date); render() }
  else if (a === 'wd') { S.wd = +b.dataset.i; render() }
  else if (a === 'filter') { S.filter = b.dataset.f; renderFoods() }
  else if (a === 'account') location.hash = 'account';
  else if (a === 'gologin') setGate('out', FB ? '' : 'Non riesco a collegarmi al database: controlla la connessione.', !FB);
  else if (a === 'offline') { B = LOCAL; setGate('in'); setSync('Offline: salvo su questo browser'); afterData() }
  else if (a === 'retryfb') startFirebase();
  else if (a === 'off') runOff($('q').value.trim(), 'alimenti');
  else if (a === 'offadd') { const p = OFF.list[+b.dataset.i]; const n = addOffFood(p); toast(n + ': aggiunto ai tuoi alimenti', false); renderFoods() }
  else if (a === 'sug') pickSug(+b.dataset.i);
  else if (a === 'offdlg') { if ($('fSug')) $('fSug').hidden = true; runOff($('fN').value.trim(), 'dlg') }
  else if (a === 'offpick') { const p = OFF.list[+b.dataset.i]; $('fN').value = addOffFood(p); unitsFor = null; fillUnits(null); itemHint(); if (!$('fQ').value) $('fQ').focus() }
  else if (a === 'checkver') checkVersion(true);
  else if (a === 'update') doUpdate();
  else if (a === 'libnew') openLibNew();
  else if (a === 'libsave') {
    const D = dlg, mm = mealsFor(D.scope, D.key).find(x => x.id === D.mid); if (!mm) return;
    let n = ($('mN').value.trim() || mm.name); if (S.library.some(x => x.name === n)) n += ' ' + (S.library.length + 1);
    S.library.push({ id: 'l' + uidGen(), name: n, type: mealType(mm), ...(isMain(mm) ? { fmt: fmtOf(mm) } : {}), items: clone(mm.items) });
    save('meals'); closeDlg(); render(); toast(`«${n}» salvato tra i tuoi pasti`, false);
  }
  else if (a === 'libpick') { const D = dlg; openLibPick(D.scope, D.key, D.mid) }
  else if (a === 'libchoose') {
    const D = dlg, id = b.dataset.id;
    if (D.scope === 'day') { const L = S.library.find(x => x.id === id); closeDlg(); mutate('day', D.key, ms => { const t = ms.find(x => x.id === D.mid); if (t) applyItems(t, L) }, `${L.name}: inserito solo per oggi`) }
    else openApply(id, { days: [+D.key], slot: D.mid });
  }
  else if (a === 'libapply') { const id = b.dataset.id; closeDlg(); openApply(id) }
  else if (a === 'apall') { const bs = [...document.querySelectorAll('input[name=apd]')], all = bs.every(x => x.checked); bs.forEach(x => x.checked = !all) }
  else if (a === 'applylib') {
    const days = [...document.querySelectorAll('input[name=apd]:checked')].map(x => +x.value);
    if (!days.length) { toast('Scegli almeno un giorno', false); return }
    const mode = document.querySelector('input[name=apm]:checked').value, slot = $('apSlot').value, id = dlg.libId;
    closeDlg(); applyLib(id, days, mode, slot);
  }
  else if (a === 'shopper') { S.shop.period = b.dataset.v; save('shop'); renderShop() }
  else if (a === 'shopclear') { S.shop.checked = {}; save('shop'); renderShop() }
  else if (a === 'shopadd') { const v = $('shopNew').value.trim(); if (!v) return; S.shop.extra = (S.shop.extra || []).filter(x => x.n !== v).concat({ n: v, q: '' }); save('shop'); renderShop() }
  else if (a === 'shopsugg') { const x = SHOP_SUGG[+b.dataset.i]; if (!x) return; S.shop.extra = (S.shop.extra || []).filter(y => y.n !== x.n).concat({ n: x.n, q: x.q }); save('shop'); renderShop(); toast(x.n + ': aggiunto alla lista', false) }
  else if (a === 'shopdel') { const n = b.dataset.n; S.shop.extra = (S.shop.extra || []).filter(x => x.n !== n); delete S.shop.checked['x:' + n]; save('shop'); renderShop() }
  else if (a === 'shopcopy') { try { await navigator.clipboard.writeText(shopText()); toast('Lista copiata: incollala dove vuoi', false) } catch (err) { toast('Copia non riuscita in questa vista', false) } }
  else if (a === 'planapply') { if (!pendingPlan) return; const rep = $('planMenu') ? $('planMenu').checked : true; const w = b.dataset.where; applyPlan(pendingPlan, rep); toast('Piano caricato: ' + (PL.info.nome || 'senza nome'), false); if (w === 'onboard') afterData(); else render() }
  else if (a === 'planexample') { const raw = await loadExample(); if (!raw) { toast('Non riesco a scaricare il piano di esempio', false); return } applyPlan(raw, true); toast('Piano di esempio attivo: sostituiscilo con il tuo da Account', false); afterData() }
  else if (a === 'planexport') {
    const txt = JSON.stringify(S.plan, null, 2);
    try { const url = URL.createObjectURL(new Blob([txt], { type: 'application/json' })); const l = document.createElement('a'); l.href = url; l.download = 'il-mio-piano.json'; document.body.appendChild(l); l.click(); l.remove(); setTimeout(() => URL.revokeObjectURL(url), 5000) }
    catch (err) { try { await navigator.clipboard.writeText(txt); toast('Piano copiato negli appunti', false) } catch (e2) { toast('Download non disponibile qui', false) } }
  }
  else if (a === 'copyprompt') {
    const txt = aiPrompt();
    try { await navigator.clipboard.writeText(txt); toast('Prompt copiato: incollalo nella tua AI insieme alla dieta e all\'esempio', false) }
    catch (err) { dlg = { type: 'prompt' }; showDlg(`<h2>Copia il prompt</h2><p class="small muted">La copia automatica non funziona qui: tieni premuto il testo, seleziona tutto e copia.</p><textarea id="promptTxt" rows="10" readonly>${esc(txt)}</textarea><div class="acts"><span class="sp"></span><button class="btn" type="button" data-act="closedlg">Chiudi</button></div>`, { noActs: true }); $('promptTxt').select() }
  }
  else if (a === 'share') { try { await navigator.share({ title: 'Appanzay', text: 'Appanzay: menù, calorie, acqua e alimenti del tuo piano alimentare.', url: appUrl() }) } catch (err) { if (err && err.name !== 'AbortError') toast('Condivisione non riuscita: usa "Copia link"', false) } }
  else if (a === 'copylink') { try { await navigator.clipboard.writeText(appUrl()); toast('Link copiato', false) } catch (err) { const i = $('shareUrl'); if (i) { i.focus(); i.select() } toast('Seleziona il link e copialo', false) } }
  else if (a === 'planpaste') { const box = $(b.dataset.w === 'onboard' ? 'obPaste' : 'planPaste'); if (box) { box.hidden = !box.hidden; if (!box.hidden) box.querySelector('textarea').focus() } }
  else if (a === 'plancheck') { const box = $(b.dataset.w === 'onboard' ? 'obPaste' : 'planPaste'), t = box && box.querySelector('textarea').value.trim(); if (!t) { toast('Incolla prima il testo dell\'AI', false); return } checkPlanText(t, b.dataset.w) }
  else if (a === 'closedlg') closeDlg();
  else if (a === 'catedit') openCatEdit(b.dataset.n);
  else if (a === 'catnew') openCatEdit(null);
  else if (a === 'condpick') openCondPick();
  else if (a === 'markfood') openMark(b.dataset.n || $('q').value.trim() && (exactOf($('q').value.trim(), allFoods()) || {}).n || '');
  else if (a === 'markedit') openMark(b.dataset.n);
  else if (a === 'markdel') { const m = SALUTE.man[b.dataset.k]; if (m) { delete SALUTE.man[b.dataset.k]; saveSalute(m.n + ': scelta tolta') } }
  else if (a === 'mkpick') { dlg.n = b.dataset.n; $('mkQ').value = b.dataset.n; const m = SALUTE.man[norm(b.dataset.n)]; if (m) { const r = document.querySelector(`#dlgBody input[name=mkS][value=${m.s}]`); if (r) r.checked = true; $('mkN').value = m.nota || '' } $('dDel').hidden = !m; markList() }
  else if (a === 'condedit') openCondEdit(b.dataset.id);
  else if (a === 'condnew') openCondEdit(null);
  else if (a === 'condrestore') { if (!dlg || !dlg.id) return; const blocchi = Object.assign({}, COND_EDIT.blocchi); delete blocchi[dlg.id]; const n = (condById.get(dlg.id) || {}).n; if (await publishConds({ blocchi, rimossi: (COND_EDIT.rimossi || []).filter(x => x !== dlg.id) }, n + ': lista originale ripristinata')) closeDlg() }
  else if (a === 'gocat') { location.hash = 'alimenti'; window.scrollTo(0, 0) }
  else if (a === 'catimport') openCatImport();
  else if (a === 'catimpgo') { if (!dlg || !dlg.rows.length) return; const rows = dlg.rows; b.disabled = true; const st = rows.reduce((acc, f) => catUpsert(acc, f, null), CAT_EDIT); if (await publishCatalog(st, rows.length + (rows.length === 1 ? ' alimento importato' : ' alimenti importati'))) closeDlg(); else b.disabled = false }
  else if (a === 'catrestore') { if (!dlg || !dlg.old) return; const n = dlg.old; if (await publishCatalog(catRestore(CAT_EDIT, n), n + ' riportato ai valori originali')) closeDlg() }
  else if (a === 'catexport') { if (!downloadText(catalogText(), 'catalogo-alimenti.txt', 'text/plain')) toast('Download non disponibile qui', false) }
  else if (a === 'catadmin') {
    if (!FB || !fbUser) return; b.disabled = true;
    try { await FB.setShared('amministratori', { uids: [fbUser.uid] }); Object.assign(ADMIN, { exists: true, me: true }); toast('Ora sei l\'amministratore del catalogo', false) }
    catch (err) { toast(err && err.code === 'permission-denied' ? 'Non riuscito: c\'è già un amministratore, oppure le regole di Firestore non sono aggiornate.' : 'Non riuscito: controlla la connessione.', false); ADMIN.exists = true }
    render();
  }
  else if (a === 'alt') openAlt(m);
  else if (a === 'fmt') {
    const to = b.dataset.v, ms = mealsFor(s, k), mm = ms.find(x => x.id === m);
    if (!mm || fmtOf(mm) === to) return;
    const other = ms.find(x => x !== mm && isMain(x) && fmtOf(x) === to);
    const opp = to === 'primo' ? 'secondo' : 'primo';
    if (other) mutate(s, k, list => { const x = list.find(y => y.id === m), y = list.find(z => z.id === other.id); if (x && y) swapMeals(x, y) }, `Invertiti: ${mm.name.toLowerCase()} ${to}, ${other.name.toLowerCase()} ${opp}`);
    else mutate(s, k, list => { const x = list.find(y => y.id === m); if (x) switchFmt(x, to) }, `${mm.name}: ${to}`);
  }
  else if (a === 'altno') closeDlg();
  else if (a === 'altnext') { ALT.i = (ALT.i + 1) % ALT.list.length; showAlt() }
  else if (a === 'altprev') { if (ALT.i > 0) { ALT.i--; showAlt() } }
  else if (a === 'altok') { const p = ALT.list[ALT.i], name = ALT.ctx.meal.name, id = ALT.mealId; closeDlg(); mutate('day', ALT.date, ms => { const mm = ms.find(x => x.id === id); if (mm) mm.items = clone(p.items) }, name + ': alternativa applicata') }
  else if (a === 'google') { if (!FB) return; showAuthMsg(''); try { await FB.google() } catch (err) { showAuthMsg(authMsg(err)) } }
  else if (a === 'lmode') setLoginMode(b.dataset.v);
  else if (a === 'ereset') { const em = $('aE').value.trim(); try { await FB.resetPassword(em); showAuthMsg('Ti ho inviato un\'email per reimpostare la password.') } catch (err) { showAuthMsg(authMsg(err)) } }
  else if (a === 'logout') {
    b.disabled = true; await flushSaves(); b.disabled = false;
    if (unsynced.size) {
      const names = [...new Set([...unsynced].map(k => k.startsWith('day:') ? 'alcuni giorni registrati' : KEY_NAME[k] || k))];
      dlg = { type: 'logout' };
      showDlg(`<h2>Dati non ancora online</h2><p>Non riesco a salvare online ${esc(names.join(', '))}. Se esci adesso, su questo dispositivo vanno persi.</p><p class="small muted">Controlla la connessione e riprova, oppure scarica un backup prima di uscire.</p>
       <div class="acts col"><button class="btn pri" type="button" data-act="export">Scarica backup</button><button class="btn" type="button" data-act="closedlg">Resta collegato</button><button class="btn ghost bad" type="button" data-act="logoutforce">Esci comunque</button></div>`, { noActs: true });
      return;
    }
    await doLogout();
  }
  else if (a === 'logoutforce') { closeDlg(); await doLogout() }
  else if (a === 'export') {
    const txt = await buildBackup();
    try { const url = URL.createObjectURL(new Blob([txt], { type: 'application/json' })); const l = document.createElement('a'); l.href = url; l.download = 'appanzay-backup-' + ymd(new Date()) + '.json'; document.body.appendChild(l); l.click(); l.remove(); setTimeout(() => URL.revokeObjectURL(url), 5000); toast('Backup scaricato. Se non parte, usa "Copia backup".', false) }
    catch (err) { toast('Download non disponibile qui: usa "Copia backup".', false) }
  }
  else if (a === 'copy') { const txt = await buildBackup(); try { await navigator.clipboard.writeText(txt); toast('Backup copiato: incollalo in un file .json', false) } catch (err) { toast('Copia non riuscita in questa vista.', false) } }
  else if (a === 'doimport') doImport();
});
let nt;
document.addEventListener('input', e => {
  const t = e.target;
  if (t.id === 'note') { dayObj(S.date).note = t.value; clearTimeout(nt); nt = setTimeout(() => save('day:' + S.date), 400) }
  else if (t.id === 'q') renderFoods();
});
document.addEventListener('change', e => {
  const t = e.target, st = S.settings;
  if (t.id === 'sK' && +t.value >= 800) { st.kcal = +t.value; save('settings'); render() }
  if (t.id === 'sW' && +t.value >= 1) { st.water = Math.min(20, Math.round(+t.value)); save('settings'); render() }
  if (t.id === 'sG' && +t.value >= 50) { st.glass = +t.value; save('settings'); render() }
  const num = v => +String(v).replace(',', '.');
  if (t.id === 'sP') { const v = num(t.value); if (t.value === '') delete st.peso; else if (v >= 30 && v <= 300) { st.peso = Math.round(v * 10) / 10; st.pesoData = ymd(new Date()) } else { render(); return } save('settings'); render() }
  if (t.id === 'sH') { const v = num(t.value); if (t.value === '') delete st.altezza; else if (v >= 100 && v <= 230) st.altezza = Math.round(v); else { render(); return } save('settings'); render() }
  if (t.id === 'sA') { const v = num(t.value); if (t.value === '') delete st.eta; else if (v >= 10 && v <= 110) st.eta = Math.round(v); else { render(); return } save('settings'); render() }
  if (t.id === 'imp' && t.files[0]) readImport(t.files[0]);
  if ((t.id === 'obFile' || t.id === 'planFile') && t.files[0]) { readPlanFile(t.files[0], t.id === 'obFile' ? 'onboard' : 'account'); t.value = '' }
  if (t.dataset && t.dataset.shop != null) { const k = t.dataset.shop; S.shop.checked = S.shop.checked || {}; if (t.checked) S.shop.checked[k] = true; else delete S.shop.checked[k]; save('shop'); renderShop() }
});

/* ---------- Vista Spesa: lista calcolata dal menù ---------- */
const SHOP_PERIODS = [['7', 'Prossimi 7 giorni'], ['resto', 'Fino a domenica'], ['next', 'Settimana prossima']];
const AISLES = [['Frutta e verdura', ['Frutta', 'Verdure']], ['Carne, pesce e uova', ['Carne e uova', 'Pesce']], ['Latticini e frigo', ['Latticini']], ['Pane, pasta e cereali', ['Cereali', 'Legumi']], ['Dispensa e condimenti', ['Condimenti', 'Dolci e altro', 'Piatti pronti']], ['Bevande', ['Bevande']], ['Altro', ['Personali']]];
const NONCOUNT = new Set(['porzione', 'porzione secca', 'ciotola', 'manciata', 'cucchiaio', 'cucchiaino', 'pizzico', 'cucchiaio grattugiato', 'cucchiaino grattugiato', 'scaglia', 'foglia', 'ciuffo', 'bustina', 'spicchio', 'tazza', 'bicchiere', 'fetta', 'fettina', 'filetto', 'scatoletta sgocciolata', 'cucchiaio di succo']);
function shopDates() {
  const t = ymd(new Date()), p = S.shop.period || '7';
  if (p === 'resto') return Array.from({ length: 7 - wdOf(t) }, (_, i) => addDays(t, i));
  if (p === 'next') { const mon = addDays(t, 7 - wdOf(t)); return Array.from({ length: 7 }, (_, i) => addDays(mon, i)) }
  return Array.from({ length: 7 }, (_, i) => addDays(t, i));
}
function shopAgg(dates) {
  const agg = {};
  dates.forEach(d => ((S.days[d] && S.days[d].meals) || S.week[wdOf(d)]).forEach(m => m.items.forEach(it => {
    const f = foodBy(it.f), key = f ? f.n : it.f;
    const a = agg[key] || (agg[key] = { n: key, f, g: 0, times: 0 });
    a.g += +it.g || 0; a.times++;
  })));
  return Object.values(agg);
}
const kg = g => g >= 1000 ? (g / 1000).toLocaleString('it-IT', { maximumFractionDigits: 1 }) + ' kg' : fmt(Math.ceil(g / 10) * 10) + ' g';
function shopQty(a) {
  const f = a.f, n = norm(a.n);
  if (n.startsWith('olio')) return `≈ ${fmt(Math.ceil(a.g / 0.92 / 10) * 10)} ml`;
  if ((f && f.c === 'Bevande') || n.startsWith('latte') || n.startsWith('bevanda')) return `${(a.g / 1000).toLocaleString('it-IT', { maximumFractionDigits: 1 })} L`;
  const u = f && f.units[0];
  if (u && (!NONCOUNT.has(u.one) || n === 'fette biscottate')) { const c = Math.ceil(a.g / u.g - 0.15); return `≈ ${c} ${c === 1 ? u.one : u.many}<small>${kg(a.g)}</small>` }
  return kg(a.g);
}
const shopQtyText = a => shopQty(a).replace(/<small>(.*?)<\/small>/, ' ($1)').replace(/<[^>]+>/g, '');
function shopExtras(dates, names) {
  const has = n => names.has(norm(n)), days = dates.length, out = [];
  const st = n => { const f = foodBy(n); return f ? f.s : 'none' };
  const litres = days * S.settings.water * S.settings.glass / 1000;
  out.push({ n: 'Acqua', q: `${litres.toLocaleString('it-IT', { maximumFractionDigits: 1 })} L ≈ ${Math.ceil(litres / 1.5)} bottiglie da 1,5 L`, why: `Il tuo obiettivo è ${(S.settings.water * S.settings.glass / 1000).toLocaleString('it-IT', { maximumFractionDigits: 1 })} L al giorno.` });
  const herbs = ['Erba cipollina', 'Basilico', 'Origano', 'Rosmarino / salvia / timo'].filter(x => !has(x) && st(x) !== 'no' && st(x) !== 'warn').slice(0, 3);
  if (herbs.length) out.push({ n: herbs.join(', ').replace(' / salvia / timo', ''), q: '1 confezione', why: 'Per insaporire usando meno sale.' });
  if (!has('Limone') && st('Limone') !== 'no') out.push({ n: 'Limone', q: '2-3', why: 'Condimento leggero per pesce e verdure.' });
  const month = new Date().getMonth() + 1;
  const snackOpts = roleOpts('spuntino', 'spuntino').map(o => o[0].f);
  const scorta = snackOpts.filter(n => !has(n) && foodBy(n) && foodBy(n).c !== 'Frutta').slice(0, 2);
  if (scorta.length) out.push({ n: scorta.join(' o '), q: '1 confezione', why: 'Spuntino di scorta del tuo piano, anche fuori casa.' });
  const fruits = [...new Set(snackOpts.concat(roleOpts('pranzo', 'frutta').concat(roleOpts('cena', 'frutta')).map(o => o[0].f)))].filter(n => { const f = foodBy(n); return f && f.c === 'Frutta' && !has(n) && SEASON[norm(n)] && inSeason(n, month) });
  if (fruits.length) out.push({ n: fruits.slice(0, 3).join(' o '), q: 'qualche frutto in più', why: 'Frutta di stagione prevista dal tuo piano, per variare.' });
  if (days >= 7 && PL && PL.regole.pasto_libero) out.push({ n: 'Pasto libero', q: '1', why: PL.regole.pasto_libero });
  return out;
}
let shopLoading = false;
async function loadShopDays() {
  const missing = shopDates().filter(d => !loaded.has(d));
  if (!missing.length || shopLoading) return;
  shopLoading = true; await Promise.all(missing.map(loadDay)); shopLoading = false;
  if (currentTab() === 'spesa') renderShop();
}
function renderShop() {
  const dates = shopDates(), list = shopAgg(dates), ck = S.shop.checked || {};
  const names = new Set(list.map(a => norm(a.n)).concat((S.shop.extra || []).map(x => norm(x.n))));
  const first = parse(dates[0]), last = parse(dates[dates.length - 1]);
  const range = `${first.toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' })} – ${last.toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' })}`;
  const total = list.length + (S.shop.extra || []).length, done = list.filter(a => ck[a.n]).length + (S.shop.extra || []).filter(x => ck['x:' + x.n]).length;
  const row = (key, name, qty, f, del) => `<li class="shrow${ck[key] ? ' done' : ''}"><label><input type="checkbox" data-shop="${esc(key)}"${ck[key] ? ' checked' : ''}><span class="shn">${esc(name)}${f && (f.s === 'warn' || f.s === 'no') ? ` <span class="flag ${f.s}">${ST[f.s]}</span>` : ''}</span><span class="shq">${qty}</span></label>${del ? `<button class="icon small" type="button" data-act="shopdel" data-n="${esc(name)}" aria-label="Togli ${esc(name)}">×</button>` : ''}</li>`;
  const groups = AISLES.map(([label, cats]) => {
    const items = list.filter(a => cats.includes(a.f ? a.f.c : 'Personali')).sort((x, y) => x.n.localeCompare(y.n, 'it'));
    return items.length ? `<div class="card shgroup"><h3>${label} <span class="muted small">· ${items.length}</span></h3><ul>${items.map(a => row(a.n, a.n, shopQty(a), a.f)).join('')}</ul></div>` : '';
  }).join('');
  const extra = S.shop.extra || [];
  const sugg = shopExtras(dates, names);
  $('v-spesa').innerHTML = `
  <h2>Spesa</h2>
  <p class="muted">Calcolata dal menù dei giorni scelti, comprese le modifiche fatte in Oggi. Le quantità sono quelle del piano, arrotondate per eccesso.</p>
  <div class="chips">${SHOP_PERIODS.map(([k, l]) => `<button type="button" data-act="shopper" data-v="${k}" aria-pressed="${(S.shop.period || '7') === k}">${l}</button>`).join('')}</div>
  <div class="shopbar"><span><strong>${range}</strong> · ${done}/${total} presi</span><button class="btn" type="button" data-act="shopcopy">Copia lista</button>${done ? '<button class="btn ghost" type="button" data-act="shopclear">Togli spunte</button>' : ''}</div>
  <div class="shopgrid">${groups || '<p class="muted">Il menù di questi giorni è vuoto.</p>'}
   <div class="card shgroup"><h3>Extra</h3>
    ${extra.length ? `<ul>${extra.map(x => row('x:' + x.n, x.n, esc(x.q || ''), foodBy(x.n), true)).join('')}</ul>` : '<p class="small muted">Qui finiscono le voci che aggiungi tu o dai consigli.</p>'}
    <div class="shadd"><input type="text" id="shopNew" placeholder="Aggiungi alla lista (es. detersivo)" maxlength="60" aria-label="Voce da aggiungere"><button class="btn" type="button" data-act="shopadd">Aggiungi</button></div></div>
   <div class="card shgroup sugg"><h3>Consigliati</h3><ul>${sugg.map((x, i) => `<li><div><strong>${esc(x.n)}</strong> <span class="muted small">· ${esc(x.q)}</span><div class="small muted">${esc(x.why)}</div></div><button class="btn" type="button" data-act="shopsugg" data-i="${i}">Aggiungi</button></li>`).join('')}</ul></div>
  </div>`;
  SHOP_SUGG = sugg;
  loadShopDays();
}
let SHOP_SUGG = [];
function shopText() {
  const dates = shopDates(), list = shopAgg(dates);
  const lines = [`Spesa ${parse(dates[0]).toLocaleDateString('it-IT')} – ${parse(dates[dates.length - 1]).toLocaleDateString('it-IT')}`];
  AISLES.forEach(([label, cats]) => {
    const items = list.filter(a => cats.includes(a.f ? a.f.c : 'Personali')).sort((x, y) => x.n.localeCompare(y.n, 'it'));
    if (items.length) { lines.push('', label.toUpperCase()); items.forEach(a => lines.push(`${S.shop.checked[a.n] ? '✓' : '•'} ${a.n}: ${shopQtyText(a)}`)) }
  });
  if ((S.shop.extra || []).length) { lines.push('', 'EXTRA'); S.shop.extra.forEach(x => lines.push(`${S.shop.checked['x:' + x.n] ? '✓' : '•'} ${x.n}${x.q ? ': ' + x.q : ''}`)) }
  return lines.join('\n');
}

/* ---------- Navigazione ---------- */
const TABS = ['oggi', 'settimana', 'spesa', 'alimenti', 'account'];
function currentTab() { let h = location.hash.slice(1); if (h === 'impostazioni') h = 'account'; return TABS.includes(h) ? h : 'oggi' }
function render() {
  const t = currentTab();
  TABS.forEach(x => { $('v-' + x).hidden = x !== t; const a = document.querySelector(`nav a[data-tab="${x}"]`); if (x === t) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current') });
  if (t === 'oggi') renderToday(); else if (t === 'settimana') { renderWeek(); loadWeekDays() } else if (t === 'account') renderAccount(); else if (t === 'spesa') renderShop(); else renderFoods();
}
window.addEventListener('hashchange', () => { SEL = null; render() });
document.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.classList && e.target.classList.contains('editable')) { e.preventDefault(); e.target.click() } });
function renderDatalist() { $('foodlist').innerHTML = allFoods().map(f => `<option value="${esc(f.n)}"></option>`).join('') }

/* ---------- Avvio ---------- */
if (window.APZ_FIREBASE && !(window.claude && window.claude.use)) setGate('loading'); else setGate('in');
['plan', 'settings', 'week', 'foods', 'meals', 'shop', 'salute'].forEach(k => applyDoc(k, lsGet(k)));
applyDoc('day:' + S.date, lsGet('day:' + S.date));
if (!S.week) S.week = defaultWeek();
renderDatalist(); render(); setSync(syncLabel());
if (!window.APZ_FIREBASE && !(window.claude && window.claude.use)) afterData();

(async () => {
  const c = window.claude;
  if (c && c.use) {
    // Aperta come artifact su claude.ai: salvataggio nell'account Claude.
    const to = setTimeout(() => { if (B.kind === 'local') setSync('Account non raggiungibile: salvo su questo browser') }, 10000);
    try {
      const [d, u] = await Promise.all([c.use('db'), c.use('user')]);
      const id = u ? await u.id() : null;
      if (d && id) { B = claudeAdapter(d, id); await loadAll(); clearTimeout(to); setSync(syncLabel()) } else afterData();
    } catch (e) { afterData() }
    return;
  }
  if (window.APZ_FIREBASE) await startFirebase();
  try { if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => { }) } catch (e) { }
})();
setTimeout(() => checkVersion(false), 1500);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && Date.now() - verChecked > 5 * 60000) checkVersion(false) });
document.addEventListener('visibilitychange', async () => {
  if (document.visibilityState === 'visible' && B.kind !== 'local') { loaded.delete(S.date); await loadDay(S.date); render() }
});
}
