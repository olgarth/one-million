/* ===== Стан ===== */
var S, LAST = null, LASTV = '';
var SKEY = 'vynagoroda153_v1';
function pad(n) { return String(n).padStart(2, '0'); }
function today() { var d = new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
function uid() { return Math.random().toString(36).slice(2, 9); }
function blank() {
  return { v: 1, mode: 'pay', pd: false, c: { unit: '', date: today(), head: '', members: '', rapDate: '', rapNo: '', pib: '', pibGen: '', pibDat: '', rank: '', position: '', rnokpp: '', milDoc: '', recipientName: '', dismissOrder: '' }, q: {}, units: [], periods: [], disc: [], interp: {} };
}
function newPeriod() { return { id: uid(), from: '', to: '', brk: [], placeText: '', place: 'concrete', src: '', gA: false, gB: false, gC: false, gAt: '', gBt: '', gCt: '', task: '', phrases: [], defects: [], quote: '', decision: 'auto', note: '', d1unit: '' }; }
function newDisc() { return { id: uid(), date: '', type: '', written: true, inList: false, removed: '', order: '' }; }
function newUnit() { return { id: uid(), name: '', from: '', to: '', current: false, d1: false, d2: false }; }

function getPath(o, path) { return path.split('.').reduce(function (a, k) { return a == null ? undefined : a[k]; }, o); }
function setPath(o, path, v) {
  var ks = path.split('.'), last = ks.pop();
  var t = ks.reduce(function (a, k) { if (a[k] == null) a[k] = {}; return a[k]; }, o);
  t[last] = v;
}
function $(sel, root) { return (root || document).querySelector(sel); }
function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

/* ===== Конструктори полів ===== */
function chips(refs) {
  if (!refs || !refs.length) return '';
  return '<span class="refs">' + refs.map(function (k) {
    var r = REFS[k]; if (!r) return '';
    return '<button type="button" class="ref ' + SRC_KIND[r.k].c + '" data-ref="' + k + '" title="' + esc(r.f) + '">' + esc(r.s) + '</button>';
  }).join('') + '</span>';
}
function attrs(o) {
  o = o || {};
  return (o.show ? ' data-show="' + o.show + '"' : '') + (o.modes ? ' data-modes="' + o.modes + '"' : '');
}
function radio(key, legend, opts, o) {
  o = o || {};
  return '<fieldset class="q"' + attrs(o) + '><legend>' + esc(legend) + chips(o.refs) + '</legend>' + (o.hint ? '<p class="hint">' + o.hint + '</p>' : '') +
    opts.map(function (op) {
      return '<label class="opt"><input type="radio" name="' + key + '" value="' + op.v + '" data-k="' + key + '"><span><b>' + esc(op.l) + '</b>' + chips(op.r) + '</span>' + (op.h ? '<span class="hint">' + esc(op.h) + '</span>' : '') + '</label>';
    }).join('') + '</fieldset>';
}
function check(key, label, o) {
  o = o || {};
  return '<label class="chk"' + attrs(o) + '><input type="checkbox" data-k="' + key + '"><span>' + label + chips(o.refs) + (o.hint ? '<br><span class="hint">' + o.hint + '</span>' : '') + '</span></label>';
}
function field(key, label, type, o) {
  o = o || {};
  var inp = type === 'textarea'
    ? '<textarea data-k="' + key + '" placeholder="' + esc(o.ph || '') + '"></textarea>'
    : '<input type="' + type + '" data-k="' + key + '"' + (type === 'number' ? ' min="0" step="1" inputmode="numeric"' : '') + ' placeholder="' + esc(o.ph || '') + '">';
  return '<label class="fld"' + attrs(o) + '><span>' + esc(label) + chips(o.refs) + '</span>' + inp + (o.hint ? '<span class="hint">' + o.hint + '</span>' : '') + '</label>';
}

/* ===== Розділи ===== */
var SECTIONS = [
  { id: 's-case', t: 'Справа', modes: 'pay cert', areas: [] },
  { id: 's-person', t: 'Особа і вік', modes: 'pay cert', areas: ['person'] },
  { id: 's-cat', t: 'Склад і категорія', modes: 'pay', areas: ['cat'] },
  { id: 's-status', t: 'Статус і попередні виплати', modes: 'pay', areas: ['status', 'proc', 'paid'] },
  { id: 's-units', t: 'Місця служби і довідки', modes: 'pay', areas: [] },
  { id: 's-part', t: 'Участь у бойових діях', modes: 'pay cert', areas: ['part'] },
  { id: 's-wound', t: 'Поранення і полон', modes: 'pay cert', areas: ['wound'] },
  { id: 's-resp', t: 'Відповідальність', modes: 'pay cert', areas: ['resp'] },
  { id: 's-docs', t: 'Документи для наказу', modes: 'pay', areas: ['docs'] },
  { id: 's-interp', t: 'Тлумачення', modes: 'pay cert', areas: [] },
  { id: 's-checks', t: 'Перевірка умов', modes: 'pay', areas: [] },
  { id: 's-out', t: 'Рішення', tc: 'Довідка', modes: 'pay cert', areas: [] }
];

var SHOW = {
  pd: function (s) { return s.pd; },
  pay: function (s) { return s.mode === 'pay'; },
  readm: function (s) { return s.q.path && s.q.path !== 'prewar'; },
  enlisted: function (s) { return s.q.rank13 === 'enlisted'; },
  dismAfter: function (s) { return s.q.stNow === 'dismissed_after'; },
  dismBefore: function (s) { return s.q.st13 === 'dismissed_before'; },
  szch: function (s) { return s.q.st13 === 'szch'; },
  deadAfter: function (s) { return s.q.stNow === 'dead_after'; },
  deadAfterPd: function (s) { return s.q.stNow === 'dead_after' && s.pd; },
  here: function (s) { return s.q.stNow === 'serving_here' || s.q.stNow === 'serving_other'; },
  wound: function (s) { return s.q.wound === 'yes'; },
  woundCausal: function (s) { return s.q.wound === 'yes' && interpValue(s, 'woundCause') === 'causal'; },
  capt: function (s) { return s.q.captive === 'released' || s.q.captive === 'still'; },
  crimAny: function (s) { return s.q.crim && s.q.crim !== 'none'; },
  q17: function (s) { return s.mode === 'pay' && (s.q.wound === 'yes' || s.q.captive === 'released'); },
  admAny: function (s) { return parseInt(s.q.admCount, 10) > 0; },
  discDecision: function (s) { return !(s.disc && s.disc.length) && parseInt(s.q.discCount, 10) > 0 && interpValue(s, 'discDate') === 'decision'; },
  discAny: function (s) { return !(s.disc && s.disc.length) && parseInt(s.q.discCount, 10) > 0; },
  discManual: function (s) { return !(s.disc && s.disc.length); }
};

function secHead(i, sec, lead) {
  return '<h2><span class="n">' + (i + 1) + '</span><span class="st-title">' + esc(sec.t) + '</span></h2>' + (lead ? '<p class="lead">' + lead + '</p>' : '');
}

function buildApp() {
  var h = [];
  /* 1 Справа */
  h.push('<section class="sec" id="s-case" data-modes="pay cert">' + secHead(0, SECTIONS[0], 'Реквізити для тексту рішення. Персональні дані особи вводяться лише при увімкненому перемикачі «Персональні дані» вгорі; інакше в документах будуть поля для заповнення.') +
    '<div class="grid3">' + field('c.unit', 'Військова частина', 'text', { ph: 'А0000' }) + field('c.date', 'Дата висновку (довідки)', 'date') + field('c.rank', 'Військове звання особи', 'text', { ph: 'солдат' }) + '</div>' +
    '<div class="grid2" style="margin-top:12px">' + field('c.position', 'Посада особи', 'text', { ph: 'стрілець 1 стрілецького відділення ...' }) +
    field('c.pib', 'Прізвище, власне ім\'я, по батькові', 'text', { show: 'pd' }) + '</div>' +
    '<div class="grid2" style="margin-top:12px" data-show="pd">' + field('c.rnokpp', 'РНОКПП (особистий номер)', 'text') + field('c.milDoc', 'Військово-обліковий документ (назва, серія, номер)', 'text') + '</div>' +
    '<div class="grid2" style="margin-top:12px" data-show="pd">' + field('c.pibGen', 'Звання і ПІБ у родовому відмінку (кого)', 'text', { ph: 'солдата ПЕТРЕНКА Івана Івановича', hint: 'Необов\'язково. Без нього речення будується як «військовослужбовця (солдат ...)».' }) + field('c.pibDat', 'Звання і ПІБ у давальному відмінку (кому)', 'text', { ph: 'солдату ПЕТРЕНКУ Івану Івановичу' }) + '</div>' +
    '<div class="grid2" style="margin-top:12px" data-modes="pay">' + field('c.rapDate', 'Дата рапорту (звернення)', 'date') + field('c.rapNo', 'Номер рапорту (звернення)', 'text') + '</div>' +
    '<div class="grid2" style="margin-top:12px" data-modes="pay">' + field('c.head', 'Голова комісії', 'text', { ph: 'майор О. ПРІЗВИЩЕ' }) + field('c.members', 'Члени комісії', 'text', { ph: 'капітан ...; старший лейтенант ...' }) + '</div>' +
    '</section>');

  /* 2 Особа */
  h.push('<section class="sec" id="s-person" data-modes="pay cert">' + secHead(1, SECTIONS[1], 'Громадянство, дата народження і дата першого прийняття (призову) на службу під час воєнного стану.') +
    radio('q.citizen', 'Громадянство', [
      { v: 'ua', l: 'Громадянин України, документ є', r: ['D_1d'] },
      { v: 'ua_nodoc', l: 'Громадянин України, копії документа ще немає' },
      { v: 'foreign', l: 'Іноземець або особа без громадянства', h: 'Права на Винагороду немає.', r: ['R15'] }
    ], { modes: 'pay', refs: ['P4_main', 'D_intro'] }) +
    '<div class="grid2">' + field('q.dob', 'Дата народження', 'date', { hint: 'Потрібна для розрахунку віку навіть без персональних даних.' }) + field('q.admDate', 'Дата прийняття (призову) на службу під час воєнного стану', 'date', { modes: 'pay', hint: 'Перше прийняття (призов) після 24.02.2022. Для колишнього строковика: дата укладення контракту.' }) + field('q.svcStart', 'Дата початку військової служби', 'date', { modes: 'cert', hint: 'Дата призову чи прийняття, для колишнього строковика - дата призову на строкову службу. Участь рахується з цієї дати, але не раніше 24.02.2022.' }) + '</div>' +
    '<div style="margin-top:16px" data-modes="pay">' + radio('q.path', 'Як особу прийнято (призвано) на службу', [
      { v: 'mob', l: 'Призов під час мобілізації' },
      { v: 'contract', l: 'Контракт під час воєнного стану' },
      { v: 'cadet', l: 'Курсант ВВНЗ (військового навчального підрозділу ЗВО)', r: ['R11'] },
      { v: 'strok_contract', l: 'На 24.02.2022 проходив строкову службу, потім уклав контракт', h: 'Категорія, додана постановою № 942.', r: ['R10', 'R22'] },
      { v: 'prewar_new', l: 'Контракт до 24.02.2022, новий контракт під час воєнного стану до 13.02.2025', h: 'Спірна категорія, суди переважно визнають право. Датою прийняття вкажіть дату нового контракту.' },
      { v: 'prewar', l: 'Контракт до 24.02.2022 лише продовжено (до демобілізації), нового не укладав', h: 'Практика розділена, типово права немає. Якщо особа звільнялась і знову прийнята після 24.02.2022, оберіть «Контракт» або «Призов» і вкажіть нову дату.' }
    ], { refs: ['P4_main', 'D_intro'] }) +
    check('q.reAdmitted', 'Особа звільнялась і була повторно прийнята (призвана)', { show: 'readm', refs: ['R18'], hint: 'Право визначається за першим прийняттям під час воєнного стану, якщо особа служила станом на 13.02.2025.' }) + '</div>' +
    '</section>');

  /* 3 Склад */
  h.push('<section class="sec" id="s-cat" data-modes="pay">' + secHead(2, SECTIONS[2], 'Склад станом на 13.02.2025. Від категорії залежить, чи можлива пропорційна виплата і виняток для поранених.') +
    radio('q.rank13', 'Склад (звання) станом на 13.02.2025', [
      { v: 'enlisted', l: 'Рядовий, сержантський або старшинський склад', h: 'Включно з курсантами в цих званнях.' },
      { v: 'officer_att', l: 'Атестований до присвоєння первинного звання «молодший лейтенант»', h: 'Категорія постанови № 942.', r: ['R3', 'R22'] },
      { v: 'officer_reatt', l: 'Мав спеціальне звання (класний чин) і переатестований до офіцерського', h: 'Категорія постанови № 942.', r: ['R3', 'R22'] },
      { v: 'officer_other', l: 'Офіцер з інших підстав (випускник ВВНЗ, офіцер запасу тощо)', h: 'Права немає.', r: ['R3'] }
    ], { refs: ['P4_main', 'D_intro'] }) +
    check('q.officerAfter', 'Після 13.02.2025 особі присвоєно офіцерське звання', { show: 'enlisted', refs: ['D_intro', 'R3'], hint: 'Право зберігається.' }) +
    '</section>');

  /* 4 Статус */
  h.push('<section class="sec" id="s-status" data-modes="pay">' + secHead(3, SECTIONS[3]) +
    radio('q.st13', 'Статус станом на 13.02.2025', [
      { v: 'serving', l: 'Проходив службу (у списках частини)' },
      { v: 'szch', l: 'Перебував у СЗЧ (зі списків не виключений)' },
      { v: 'captive', l: 'Перебував у полоні', r: ['R7'] },
      { v: 'missing', l: 'Вважався зниклим безвісти (у списках частини)', r: ['R7'] },
      { v: 'missing_excl', l: 'Зниклий безвісти, виключений зі списків до 13.02.2025', r: ['R7'] },
      { v: 'dismissed_before', l: 'Звільнений з військової служби до 13.02.2025' },
      { v: 'dead_before', l: 'Загинув (помер) до 13.02.2025' }
    ], { refs: ['P4_main', 'D_intro'] }) +
    '<div class="sub" data-show="dismBefore">' + radio('q.dismReason', 'Підстава звільнення до 13.02.2025', [
      { v: 'health', l: 'За станом здоров\'я внаслідок поранення (захворювання), пов\'язаного із захистом Батьківщини' },
      { v: 'other', l: 'Інша підстава' }
    ]) + '</div>' +
    '<div class="sub" data-show="szch">' + radio('q.szchSusp', 'Чи була військова служба призупинена станом на 13.02.2025', [
      { v: 'no', l: 'Ні, не призупинялась (зі списків не виключений)' },
      { v: 'yes', l: 'Так, призупинена з дня внесення відомостей до ЄРДР', h: 'До набрання чинності Законом від 30.04.2025 № 4392-IX так діяла ч. 2 ст. 24 Закону «Про військовий обов\'язок і військову службу».' }
    ]) + '</div>' +
    radio('q.stNow', 'Поточний статус', [
      { v: 'serving_here', l: 'Проходить службу в нашій частині' },
      { v: 'serving_other', l: 'Проходить службу в іншій частині', h: 'Рішення приймає частина за місцем служби.', r: ['D_1d', 'R12'] },
      { v: 'dismissed_after', l: 'Звільнений після 13.02.2025', r: ['D_4', 'R13'] },
      { v: 'dead_after', l: 'Загинув (помер) після 13.02.2025', r: ['D_6'] },
      { v: 'missing_now', l: 'Зник безвісти після 13.02.2025', r: ['D_5'] },
      { v: 'captive_now', l: 'Перебуває в полоні', r: ['D_5'] }
    ]) +
    '<div class="sub" data-show="here">' + radio('q.place2609', 'Місце служби станом на 26.09.2025 (дата видання доручення)', [
      { v: 'here', l: 'Наша частина', h: 'Виплату проводить наша частина, навіть якщо особа вже переведена.' },
      { v: 'other', l: 'Інша частина', r: ['D_1d', 'R12'] }
    ]) + '</div>' +
    '<div class="sub" data-show="dismAfter">' + field('c.dismissOrder', 'Наказ про виключення зі списків (від ... № ...)', 'text') + check('q.preCheck', 'Є повідомлення (довідка) про проведення попередньої перевірки', { refs: ['D_3', 'D_4'] }) + '</div>' +
    '<div class="sub" data-show="deadAfter"><div class="grid2">' + field('q.deathDate', 'Дата смерті (загибелі)', 'date') + field('q.applyDate', 'Дата звернення члена сім\'ї', 'date', { hint: 'Не пізніше трьох років з дня смерті або набрання законної сили рішенням суду.' }) + '</div>' +
    field('q.courtDate', 'Дата набрання законної сили рішенням суду про визнання безвісно відсутнім (оголошення померлим), якщо є', 'date') +
    radio('q.recipient', 'Отримувач (у визначеній дорученням черговості)', [
      { v: 'spouse', l: 'Дружина (чоловік)' },
      { v: 'children', l: 'Повнолітні діти, які проживали разом' },
      { v: 'guardian', l: 'Законні представники (усиновлювачі) неповнолітніх дітей' },
      { v: 'dependents', l: 'Особи на утриманні' },
      { v: 'parents', l: 'Батьки рівними частками (якщо не в шлюбі і без дітей)' },
      { v: 'heirs', l: 'Спадкоємці (за відсутності зазначених осіб)' }
    ], { refs: ['D_6'] }) + field('c.recipientName', 'ПІБ отримувача (отримувачів)', 'text', { show: 'deadAfterPd' }) +
    check('q.deathDocs', 'Є документи про смерть, родинні зв\'язки (утримання) і заява отримувача', { refs: ['D_6'] }) + '</div>' +
    radio('q.paid', 'Чи отримував Винагороду раніше', [
      { v: 'no_conf', l: 'Не отримував, підтверджено довідками за Додатком 2', h: 'З усіх попередніх місць служби після 13.02.2025, або таких місць немає.' },
      { v: 'no_unconf', l: 'Не отримував за словами особи, довідок ще немає' },
      { v: 'yes', l: 'Вже отримував', h: 'Виплата одноразова.' }
    ], { refs: ['D_1d', 'R5'] }) +
    '</section>');

  /* 5 Місця служби */
  h.push('<section class="sec" id="s-units" data-modes="pay">' + secHead(4, SECTIONS[4], 'Усі частини з дня прийняття на службу, включно з поточною. Довідка за Додатком 1 потрібна з кожної; довідка за Додатком 2 потрібна з кожної попередньої частини, де особа служила після 13.02.2025. За цим переліком формуються запити.') +
    '<div class="tablewrap"><table class="utab"><thead><tr><th style="min-width:110px">Військова частина</th><th>З</th><th>По</th><th class="c">Поточна</th><th class="c">Дод. 1 є</th><th class="c">Дод. 2 є</th><th></th></tr></thead><tbody id="units"></tbody></table></div>' +
    '<p><button type="button" class="btn" data-act="addu">Додати частину</button></p>' +
    '<p class="hint">Дод. 2 не потрібна для поточної частини і для частин, звідки особа вибула до 13.02.2025 (поле «По» раніше 13.02.2025).' + chips(['R4', 'D_1d']) + '</p>' +
    '</section>');

  /* 6 Участь */
  h.push('<section class="sec" id="s-part" data-modes="pay cert">' + secHead(5, SECTIONS[5]) +
    '<p class="lead" data-modes="pay">Внесіть кожен період окремо (зміна району або перерва = новий період). Основне джерело для комісії: довідки за Додатком 1. Копії бойових документів дорученням вимагати заборонено, але якщо вони є, їх можна проаналізувати по формулюваннях.' + chips(['D_groups', 'D_1d']) + '</p>' +
    '<p class="lead" data-modes="cert">Для кожного періоду потрібен щонайменше один документ з кожної групи: бойовий наказ (розпорядження), ЖБД (журнал ведення оперативної обстановки, бойове донесення), рапорт командира про участь кожного. Відмічайте формулювання, які трапляються в документах.' + chips(['D_groups']) + '</p>' +
    '<div class="legend"><span><span class="v yes">підтверджує</span> за наявності документів усіх груп</span><span><span class="v no">не підтверджує</span> сам по собі</span><span><span class="v doubt">двозначно</span> потрібне рішення комісії</span></div>' +
    '<div id="periods"></div><p><button type="button" class="btn primary" data-act="addp">Додати період</button></p>' +
    '<div class="note">Район ведення воєнних (бойових) дій визначає рішення Головнокомандувача ЗСУ, і такі рішення видавались помісячно: населений пункт звіряйте за місяцем. Перелік територій бойових дій (наказ Мінрозвитку № 376) постанова № 153 не згадує, він лише допоміжний. Постанова № 153 вужча за постанову № 168: дні, оплачені за № 168 як участь у «заходах», не обов\'язково є безпосередньою участю у бойових діях.' + chips(['OBOR_1', 'R19', 'R2']) + '</div>' +
    '<div class="note">Враховується лише участь станом на 13.02.2025 (включно). Періоди, що перекриваються, рахуються один раз. Відпустки, лікування, ВЛК, СЗЧ, вибуття з району в межах періоду внесіть кнопкою «Додати перерву» з датами.' + chips(['P4_main', 'R5', 'R21']) + '</div>' +
    '</section>');

  /* 7 Поранення */
  h.push('<section class="sec" id="s-wound" data-modes="pay cert">' + secHead(6, SECTIONS[6], 'Якщо участь менше 6 місяців, поранення (захворювання), одержане під час захисту Вітчизни, або звільнення з полону дає право на виплату в повному обсязі. Для категорій постанови № 942 за позицією МОУ цей виняток не діє.') +
    radio('q.wound', 'Поранення (травма, контузія, каліцтво) або захворювання, одержане під час захисту Вітчизни', [
      { v: 'no', l: 'Немає' },
      { v: 'yes', l: 'Є' }
    ], { refs: ['P4_exc', 'R14'] }) +
    '<div class="sub" data-show="wound"><div class="grid2">' + field('q.woundDate', 'Дата поранення (виникнення захворювання)', 'date', { hint: 'Дата події, а не документа. Постанова ВЛК може бути пізнішою.', refs: ['R21'] }) +
    '<label class="fld"><span>Документ</span><select data-k="q.woundDoc"><option value="">не обрано</option><option value="travma">Довідка про обставини травми (поранення)</option><option value="vlk">Постанова ВЛК</option><option value="svid">Свідоцтво про хворобу</option><option value="other">Інший документ</option><option value="none">Документа немає</option></select></label></div>' +
    field('q.woundDocText', 'Реквізити документа (назва, дата, номер, орган)', 'text', { modes: 'cert pay' }) +
    radio('q.woundLink', 'Чим підтверджено зв\'язок із захистом Батьківщини', [
      { v: 'vlk', l: 'Постанова ВЛК: «ТАК, пов\'язане із захистом Батьківщини»', h: 'Підпункт «а» (поранення) або «д» (захворювання) п. 21.5 Положення про ВЛЕ.' },
      { v: 'form5', l: 'Довідка про обставини травми (додаток 5), постанови ВЛК ще немає', h: 'З довідки видно, що поранення одержано під час виконання бойового (спеціального) завдання.' },
      { v: 'other', l: 'ВЛК: інше формулювання', h: '«Пов\'язане з виконанням обов\'язків військової служби», «з проходженням служби», нещасний випадок, «не пов\'язане». Виняток не діє.' },
      { v: 'unk', l: 'Документа про зв\'язок немає' }
    ], { refs: ['R14', 'VLK_21_5'] }) +
    radio('q.woundArea', 'Де отримано', [
      { v: 'combat_area', l: 'Під час виконання завдань у районі бойових дій', h: 'Зокрема другий рубіж оборони, логістика в межах 15 км від лінії зіткнення.', r: ['R20'] },
      { v: 'outside', l: 'Поза районом бойових дій (полігон, ППД, удар по тилу)' },
      { v: 'unk', l: 'Не встановлено' }
    ], { modes: 'pay' }) +
    radio('q.woundCaused', 'Чи стало поранення причиною участі менше 6 місяців', [
      { v: 'yes', l: 'Так (лікування, ВЛК, звільнення)' },
      { v: 'no', l: 'Ні, після поранення повернувся до виконання завдань' }
    ], { show: 'woundCausal', refs: ['R17'] }) + '</div>' +
    radio('q.captive', 'Полон', [
      { v: 'no', l: 'Не перебував' },
      { v: 'released', l: 'Перебував і звільнений з полону' },
      { v: 'still', l: 'Перебуває в полоні досі' }
    ], { refs: ['P4_exc', 'R7'] }) +
    '<div class="sub" data-show="capt">' + field('q.captDate', 'Дата потрапляння в полон', 'date', { hint: 'Виняток діє для полону, що почався до 13.02.2025 включно.' }) + check('q.voluntary', 'Добровільно здався в полон', { hint: 'Виняток не застосовується.' }) + check('q.captivityDoc', 'Є документ про перебування (звільнення) з полону', { modes: 'pay' }) + field('q.captivityDocText', 'Реквізити документа', 'text') + '</div>' +
    '<div data-show="q17">' + check('q.q17', 'У частині, в списках якої особа була станом на 13.02.2025, вже є всі необхідні документи', { refs: ['R17'], hint: 'Тоді довідки з попередніх місць служби можна не витребувати.' }) + '</div>' +
    '</section>');

  /* 8 Відповідальність */
  h.push('<section class="sec" id="s-resp" data-modes="pay cert">' + secHead(7, SECTIONS[7], 'Враховуються лише випадки з дня прийняття (призову) після 24.02.2022 до 13.02.2025. Випадки після 13.02.2025 до уваги не беруться. Джерело: розділ 2 довідок за Додатком 1.') +
    radio('q.crim', 'Кримінальна відповідальність', [
      { v: 'none', l: 'Не притягувався' },
      { v: 'erdr', l: 'Відомості внесено до ЄРДР (матеріали передано до ДБР), але підозру не повідомлено', h: 'Притягнення ще не почалось (№ 380/22759/25, № 280/10174/25).', r: ['KPK_3_14'] },
      { v: 'szch_simple', l: 'Повернувся із СЗЧ, підозру не повідомлено', h: 'Спрощене повернення (п. 7-2 розд. XII Закону «Про військовий обов\'язок і військову службу») не закриває кримінального провадження. Перевірте, чи не повідомлено про підозру згодом.' },
      { v: 'suspicion', l: 'Повідомлено про підозру, провадження триває', r: ['KPK_3_14'] },
      { v: 'verdict', l: 'Обвинувальний вирок' },
      { v: 'released401', l: 'Звільнений від кримінальної відповідальності (ч. 5 ст. 401 КК тощо)', r: ['KK_401_5'] },
      { v: 'rehab', l: 'Провадження закрито з реабілітуючих підстав', h: 'Відсутність події, складу правопорушення, недоведеність.' }
    ], { refs: ['P4_resp', 'D_resp', 'R9'] }) +
    '<div class="sub" data-show="crimAny">' + radio('q.crimWhen', 'Коли повідомлено про підозру (настала подія)', [
      { v: 'window', l: 'Між прийняттям на службу (після 24.02.2022) і 13.02.2025' },
      { v: 'outside', l: 'До прийняття на службу або після 13.02.2025', h: 'До уваги не береться.', r: ['R1', 'R9'] }
    ]) + field('q.crimDetails', 'Підстави, реквізити (для довідки)', 'text') + '</div>' +
    '<div class="grid2">' + field('q.admCount', 'Адміністративна відповідальність за військові правопорушення, випадків', 'number', { refs: ['KUPAP'], hint: 'Статті 172-10 - 172-20 КУпАП. Якщо немає, 0.' }) +
    field('q.discCount', 'Дисциплінарні стягнення, що враховуються, кількість', 'number', { show: 'discManual', refs: ['N604'], hint: 'Лише письмові накази, порушення з додатка 12 до Інструкції № 604, строк дії станом на 13.02.2025 не закінчився. Якщо немає, 0. Точніше: внесіть стягнення поіменно нижче.' }) + '</div>' +
    '<div style="margin-top:14px"><div class="fld"><span>Дисциплінарні стягнення поіменно (з дня прийняття до 13.02.2025)' + chips(['DS_26_1', 'N604']) + '</span></div>' +
    '<div class="tablewrap"><table class="utab"><thead><tr><th>Дата оголошення</th><th style="min-width:150px">Вид</th><th class="c">Письмовий наказ</th><th class="c">З переліку дод. 12</th><th>Знято достроково або нагорода (дата)</th><th></th></tr></thead><tbody id="discs"></tbody></table></div>' +
    '<p><button type="button" class="btn" data-act="addd">Додати стягнення</button> <span class="hint">Строк дії рахується автоматично за ст. 26-1 Дисциплінарного статуту.</span></p>' +
    '<details class="ph"><summary>Порушення, що враховуються (додаток 12 до Інструкції № 604)</summary><div class="phb"><ol>' + DOD12.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ol><p class="hint">Чинна редакція після наказу МОУ від 06.08.2025 № 527. Редакцію станом на 13.02.2025 (з колишнім пунктом 1) перевірити не вдалося.</p></div></details>' +
    '<details class="ph"><summary>Військові адміністративні правопорушення (глава 13-Б КУпАП)</summary><div class="phb"><ul>' + KUPAP13B.map(function (t) { return '<li>Ст. ' + esc(t) + '</li>'; }).join('') + '</ul><p class="hint">Рахуються постанови про накладення стягнення. Протокол без накладеного стягнення не рахується.</p></div></details></div>' +
    '<div style="margin-top:10px" data-show="discDecision">' + field('q.discActive', 'З них діють на дату розгляду (не минув рік, не зняті)', 'number', { hint: 'Потрібно, якщо в розділі «Тлумачення» обрано перевірку на дату розгляду.' }) + '</div>' +
    '<div class="grid2" style="margin-top:10px">' + field('q.admDetails', 'Підстави (адміністративні)', 'text', { show: 'admAny' }) + field('q.discDetails', 'Підстави (дисциплінарні)', 'text', { show: 'discAny' }) + '</div>' +
    '<div style="margin-top:10px" data-modes="pay" data-show="discManual">' + field('q.discOther', 'Інші стягнення, що не враховуються (зняті, строк минув, не з переліку, усні)', 'number', { hint: 'Лише для повноти висновку.' }) + '</div>' +
    '</section>');

  /* 9 Документи */
  h.push('<section class="sec" id="s-docs" data-modes="pay">' + secHead(8, SECTIONS[8], 'П\'ять груп документів, на підставі яких видається наказ. Копії бойових наказів, ЖБД, рапортів командирів і рапортів самих військовослужбовців вимагати не можна.') +
    check('q.g1', 'Група 1. Витяг з послужного списку, копія обліково-послужної картки або довідка про проходження служби (додаток 10 до Інструкції № 170)', { refs: ['D_1d', 'I170'] }) +
    check('q.g2', 'Група 2. Копія послужної картки', { refs: ['D_1d'] }) +
    check('q.g3', 'Група 3. Копія документа, що підтверджує громадянство', { refs: ['D_1d'] }) +
    '<p class="hint" style="margin:6px 0 4px">Групи 4 і 5 (довідки за Додатками 1 і 2) визначаються за таблицею місць служби.</p>' +
    '<details class="ph"><summary>Дефекти довідок за Додатком 1 <span class="cnt" id="d1cnt"></span></summary><div class="phb" id="d1def"></div></details>' +
    '</section>');

  /* 10 Тлумачення */
  h.push('<section class="sec" id="s-interp" data-modes="pay cert">' + secHead(9, SECTIONS[9], 'Тут комісія фіксує свою позицію щодо норм, які можна прочитати по-різному. Вгорі ті, що впливають на поточну справу; обране тлумачення потрапляє у висновок.') +
    '<div id="interps"></div></section>');

  /* 11 Перевірка */
  h.push('<section class="sec" id="s-checks" data-modes="pay">' + secHead(10, SECTIONS[10], 'Повний перелік умов з результатом і джерелом.') + '<ul class="checks" id="checks"></ul></section>');

  /* 12 Рішення */
  h.push('<section class="sec" id="s-out" data-modes="pay cert">' + '<h2><span class="n">12</span><span id="outTitle">Рішення</span></h2><p class="lead">Тексти формуються автоматично. Жовтим позначено поля для заповнення. Текст можна редагувати прямо тут перед копіюванням або збереженням.</p>' +
    '<div class="tabs" role="tablist" id="tabs"></div>' +
    '<div class="note warn" id="dirty" hidden>Текст змінено вручну, тому він не оновлюється автоматично. <button type="button" class="btn small" data-act="regen">Оновити з даних справи</button></div>' +
    '<div class="docbar"><button type="button" class="btn" data-act="copy">Копіювати текст</button><button type="button" class="btn" data-act="select">Виділити з форматуванням</button><button type="button" class="btn noframe" data-act="word">Зберегти у Word (.doc)</button><button type="button" class="btn noframe" data-act="print">Друкувати</button></div>' +
    '<p class="hint inframe">Щоб перенести текст у Word або Pages з форматуванням, натисніть «Виділити з форматуванням» і скопіюйте виділене. Друк і збереження у Word доступні, якщо відкрити завантажений HTML-файл у браузері комп\'ютера.</p>' +
    '<div class="doc" id="doc" contenteditable="true" spellcheck="false"></div></section>');

  $('#main').innerHTML = h.join('');
  /* дефекти довідки Дод. 1 */
  $('#d1def').innerHTML = D1DEFECTS.map(function (d) {
    return '<label class="chk"><input type="checkbox" data-d1="' + d.id + '"><span>' + esc(d.t) + chips(d.refs) + (d.why ? '<br><span class="hint">' + esc(d.why) + '</span>' : '') + '</span></label>';
  }).join('');
  /* навігація */
  $('#rail').innerHTML = '<ol>' + SECTIONS.map(function (sc) { return '<li data-modes="' + sc.modes + '"><a href="#' + sc.id + '" data-sec="' + sc.id + '"><span>' + esc(sc.t) + '</span><span class="dot" id="dot-' + sc.id + '"></span></a></li>'; }).join('') + '</ol>';
}

/* ===== Місця служби ===== */
function renderUnits() {
  var tb = $('#units');
  if (!S.units.length) { tb.innerHTML = '<tr><td colspan="7" class="hint">Додайте поточну частину і всі попередні.</td></tr>'; return; }
  tb.innerHTML = S.units.map(function (u) {
    var need2 = unitAfter(u) && !u.current;
    return '<tr><td><input type="text" data-u="' + u.id + '.name" placeholder="А0000"></td><td><input type="date" data-u="' + u.id + '.from"></td><td><input type="date" data-u="' + u.id + '.to"></td>' +
      '<td class="c"><input type="checkbox" data-u="' + u.id + '.current" aria-label="Поточна"></td><td class="c"><input type="checkbox" data-u="' + u.id + '.d1" aria-label="Довідка Додаток 1 є"></td>' +
      '<td class="c">' + (need2 ? '<input type="checkbox" data-u="' + u.id + '.d2" aria-label="Довідка Додаток 2 є">' : '<span class="hint">не потрібна</span>') + '</td>' +
      '<td><button type="button" class="btn small ghost danger" data-act="delu" data-id="' + u.id + '" aria-label="Видалити">Видалити</button></td></tr>';
  }).join('');
  fillList('u', S.units);
}

/* ===== Дисциплінарні стягнення ===== */
function renderDiscs() {
  var tb = $('#discs'); if (!tb) return;
  if (!S.disc.length) { tb.innerHTML = '<tr><td colspan="6" class="hint">Стягнень не внесено. Якщо їх немає, у полі вище вкажіть 0.</td></tr>'; return; }
  var opts = '<option value="">вид</option>' + Object.keys(DISC_TYPES).map(function (k) { return '<option value="' + k + '">' + esc(DISC_TYPES[k].l) + '</option>'; }).join('');
  tb.innerHTML = S.disc.map(function (d) {
    return '<tr class="dc1"><td><input type="date" data-dc="' + d.id + '.date"></td><td><select data-dc="' + d.id + '.type">' + opts + '</select></td>' +
      '<td class="c"><input type="checkbox" data-dc="' + d.id + '.written" aria-label="Письмовий наказ"></td><td class="c"><input type="checkbox" data-dc="' + d.id + '.inList" aria-label="Порушення з переліку додатка 12"></td>' +
      '<td><input type="date" data-dc="' + d.id + '.removed"></td><td><button type="button" class="btn small ghost danger" data-act="deld" data-id="' + d.id + '">Видалити</button></td></tr>' +
      '<tr class="dc2"><td colspan="6"><div class="dcrow"><input type="text" data-dc="' + d.id + '.order" placeholder="Наказ: № ..., дата, порушення"><span id="dcr-' + d.id + '" class="hint"></span></div></td></tr>';
  }).join('');
  fillList('dc', S.disc);
}
function renderDiscStatus() {
  if (!S.disc.length) return;
  var da = discAnalysis(S);
  da.rows.forEach(function (r) {
    var el = $('#dcr-' + r.x.id); if (!el) return;
    el.innerHTML = '<span class="v ' + (r.counted ? 'no' : 'yes') + '">' + (r.counted ? 'враховується' : 'не враховується') + '</span> ' + esc(r.reason);
  });
}

/* ===== Періоди ===== */
function phraseList(pid) {
  var h = [];
  PHRASE_CATS.forEach(function (c) {
    var items = PHRASES.filter(function (p) { return p.cat === c.k; });
    if (!items.length) return;
    h.push('<div class="phcat" data-cat="' + c.k + '">' + esc(c.l) + '</div>');
    items.forEach(function (p) {
      h.push('<label class="phi" data-cat="' + c.k + '" data-v="' + p.v + '" data-txt="' + esc((p.t + ' ' + (p.w || '') + ' ' + (p.a || '') + ' ' + (p.docs || '')).toLowerCase()) + '"><input type="checkbox" data-pp="' + pid + '" value="' + p.id + '"><span class="t">' + esc(p.t) + (p.docs ? ' <span class="hint" style="font-family:var(--body)">' + esc(p.docs) + '</span>' : '') + '</span><span class="v ' + p.v + '">' + ({ yes: 'підтверджує', no: 'не підтверджує', doubt: 'двозначно' })[p.v] + '</span><span class="w">' + esc(p.w || '') + (p.a ? ' Що з\'ясувати: ' + esc(p.a) : '') + chips(p.r) + '</span></label>');
    });
  });
  return h.join('');
}
function renderPeriods() {
  var box = $('#periods');
  if (!S.periods.length) { box.innerHTML = '<p class="hint">Періодів ще немає. Додайте перший період з довідки або бойових документів.</p>'; return; }
  var cert = S.mode === 'cert';
  box.innerHTML = S.periods.map(function (p, i) {
    var id = p.id;
    var showGroups = cert || p.src === 'combat';
    return '<div class="per" id="per-' + id + '">' +
      '<div class="per-h"><span class="num">Період ' + (i + 1) + '</span><span class="dd" id="pdd-' + id + '"></span><span class="st" id="pst-' + id + '"></span><span class="sp"></span>' +
      '<button type="button" class="btn small ghost" data-act="dupp" data-id="' + id + '">Копіювати</button><button type="button" class="btn small ghost danger" data-act="delp" data-id="' + id + '">Видалити</button></div>' +
      '<div class="per-b">' +
      '<div class="grid3 row"><label class="fld"><span>З</span><input type="date" data-p="' + id + '.from"></label><label class="fld"><span>По</span><input type="date" data-p="' + id + '.to"></label><div class="fld"><span>Перерви в межах періоду</span><button type="button" class="btn" data-act="addbr" data-id="' + id + '">Додати перерву</button></div></div>' +
      '<div class="row brk" id="brk-' + id + '">' + (p.brk || []).map(function (b) { return '<div class="brow"><input class="inp" type="date" data-pb="' + id + '.' + b.id + '.from" aria-label="Перерва з"><span>-</span><input class="inp" type="date" data-pb="' + id + '.' + b.id + '.to" aria-label="Перерва по"><input class="inp" type="text" data-pb="' + id + '.' + b.id + '.why" placeholder="відпустка, лікування, ВЛК, СЗЧ, вибуття з району"><button type="button" class="btn small ghost danger" data-act="delbr" data-id="' + id + '" data-b="' + b.id + '">Видалити</button></div>'; }).join('') + ((p.brk || []).length ? '<p class="hint">Перерви віднімаються лише в межах врахованої частини періоду. Якщо ці дні покриває інший період (наприклад, відрядження), вони рахуються за тим періодом.</p>' : '') + '</div>' +
      '<div class="row"><label class="fld"><span>Район: області, райони, населені пункти' + chips(['R16']) + '</span><input type="text" data-p="' + id + '.placeText" placeholder="н. п. Кліщіївка Бахмутського р-ну Донецької обл."></label>' +
      '<div class="inline-opts" style="margin-top:6px">' + [['concrete', 'Конкретні населені пункти (райони)'], ['community', 'Лише територіальна громада'], ['none', 'Район не зазначено']].map(function (o) { return '<label><input type="radio" name="pl-' + id + '" value="' + o[0] + '" data-p="' + id + '.place">' + o[1] + '</label>'; }).join('') + '</div></div>' +
      (cert ? '' : '<div class="row"><div class="fld"><span>Чим підтверджено період</span></div><div class="inline-opts">' + [['d1', 'Довідка за Додатком 1'], ['combat', 'Бойові документи (групи а, б, в)'], ['ubd', 'Лише довідка УБД (Дод. 6)'], ['5718', 'Лише довідка за 5718/з'], ['other', 'Інше (наказ по стройовій, рапорт особи)']].map(function (o) { return '<label><input type="radio" name="src-' + id + '" value="' + o[0] + '" data-p="' + id + '.src" data-rerender="1">' + o[1] + '</label>'; }).join('') + '</div>' +
        (p.src === 'd1' ? '<label class="fld" style="margin-top:8px"><span>Яка частина видала довідку</span><input type="text" data-p="' + id + '.d1unit" placeholder="А0000"></label>' : '') + '</div>') +
      (showGroups ? '<div class="row groups">' +
        '<div class="grp"><label class="chk"><input type="checkbox" data-p="' + id + '.gA"><span>а) Бойовий наказ (розпорядження)</span></label><input class="inp" type="text" data-p="' + id + '.gAt" placeholder="№, дата"></div>' +
        '<div class="grp"><label class="chk"><input type="checkbox" data-p="' + id + '.gB"><span>б) ЖБД, журнал ведення оперативної обстановки або бойове донесення</span></label><input class="inp" type="text" data-p="' + id + '.gBt" placeholder="інв. №, аркуші"></div>' +
        '<div class="grp"><label class="chk"><input type="checkbox" data-p="' + id + '.gC"><span>в) Рапорт (донесення) командира про участь кожного</span></label><input class="inp" type="text" data-p="' + id + '.gCt" placeholder="вх. №, дата"></div>' +
        '</div>' : '') +
      '<div class="row"><div class="fld"><span>Характер завдання</span></div><div class="inline-opts">' + [['combat', 'Бойові дії в районі (оборона, штурм, позиції, вогневе ураження)'], ['support', 'Забезпечувальні (спеціальні) завдання в районі бойових дій'], ['outside', 'Поза районом бойових дій'], ['doubt', 'Неможливо визначити']].map(function (o) { return '<label><input type="radio" name="tk-' + id + '" value="' + o[0] + '" data-p="' + id + '.task">' + o[1] + '</label>'; }).join('') + '</div></div>' +
      '<details class="ph"><summary>Формулювання з документів <span class="cnt" id="pcnt-' + id + '"></span></summary><div class="phb">' +
      '<div class="phtools"><input class="inp" type="search" placeholder="Пошук: резерв, ВОП, ППД, евакуація..." data-ps="' + id + '"><select class="inp" data-pf="' + id + '" style="max-width:200px"><option value="">усі оцінки</option><option value="yes">підтверджує</option><option value="no">не підтверджує</option><option value="doubt">двозначно</option><option value="sel">відмічені</option></select></div>' +
      '<div class="phlist" id="pl-' + id + '">' + phraseList(id) + '</div></div></details>' +
      '<div class="row"><label class="fld"><span>Дослівний запис з документа (потрапить в обґрунтування)</span><textarea data-p="' + id + '.quote" placeholder="Наприклад: «2 мсв утримує рубіж в районі н. п. ...»"></textarea></label></div>' +
      '<details class="ph"><summary>Дефекти документів <span class="cnt" id="pdc-' + id + '"></span></summary><div class="phb">' +
      DEFECT_GROUPS.map(function (g) {
        var items = DEFECTS.filter(function (d) { return d.g === g.k; });
        if (!items.length) return '';
        return '<div class="phcat">' + esc(g.l) + '</div>' + items.map(function (d) { return '<label class="chk"><input type="checkbox" data-pdf="' + id + '" value="' + d.id + '"><span>' + esc(d.t) + ' <span class="v ' + (d.e === 'reject' ? 'no' : d.e === 'clarify' ? 'doubt' : 'yes') + '">' + ({ reject: 'неприйнятно', clarify: 'уточнити', none: 'не впливає' })[d.e] + '</span>' + chips(d.r) + '<br><span class="hint">' + esc(d.w) + (d.src ? ' Джерело: ' + esc(d.src) : '') + '</span></span></label>'; }).join('');
      }).join('') +
      '</div></details>' +
      '<div class="per-res" id="pres-' + id + '"></div>' +
      '<div class="row" style="margin-top:10px"><div class="fld"><span>Рішення комісії щодо періоду</span></div><div class="inline-opts">' + [['auto', 'За результатами перевірки'], ['count', 'Врахувати'], ['exclude', 'Не враховувати']].map(function (o) { return '<label><input type="radio" name="dc-' + id + '" value="' + o[0] + '" data-p="' + id + '.decision">' + o[1] + '</label>'; }).join('') + '</div>' +
      '<label class="fld" style="margin-top:6px"><span>Обґрунтування рішення комісії</span><input type="text" data-p="' + id + '.note" placeholder="Чому період враховано (не враховано) всупереч автоматичній оцінці"></label></div>' +
      '</div></div>';
  }).join('');
  fillList('p', S.periods);
  S.periods.forEach(function (p) {
    (p.brk || []).forEach(function (b) {
      ['from', 'to', 'why'].forEach(function (k) { var el = $('[data-pb="' + p.id + '.' + b.id + '.' + k + '"]'); if (el) el.value = b[k] || ''; });
    });
    $$('[data-pp="' + p.id + '"]').forEach(function (cb) { cb.checked = p.phrases.indexOf(cb.value) >= 0; });
    $$('[data-pdf="' + p.id + '"]').forEach(function (cb) { cb.checked = p.defects.indexOf(cb.value) >= 0; });
  });
}
function filterPhrases(pid) {
  var q = ($('[data-ps="' + pid + '"]').value || '').toLowerCase().trim();
  var f = $('[data-pf="' + pid + '"]').value;
  var list = $('#pl-' + pid);
  var visibleCats = {};
  $$('.phi', list).forEach(function (el) {
    var ok = (!q || el.getAttribute('data-txt').indexOf(q) >= 0);
    if (f === 'sel') ok = ok && $('input', el).checked;
    else if (f) ok = ok && el.getAttribute('data-v') === f;
    el.hidden = !ok;
    if (ok) visibleCats[el.getAttribute('data-cat')] = 1;
  });
  $$('.phcat', list).forEach(function (el) { el.hidden = !visibleCats[el.getAttribute('data-cat')]; });
}

function fillList(kind, arr) {
  arr.forEach(function (o) {
    $$('[data-' + kind + '^="' + o.id + '."]').forEach(function (el) {
      var key = el.getAttribute('data-' + kind).split('.')[1];
      var v = o[key];
      if (el.type === 'checkbox') el.checked = !!v;
      else if (el.type === 'radio') el.checked = (el.value === v);
      else el.value = v == null ? '' : v;
    });
  });
}

/* ===== Заповнення полів зі стану ===== */
function fillAll() {
  $$('[data-k]').forEach(function (el) {
    var v = getPath(S, el.getAttribute('data-k'));
    if (el.type === 'checkbox') el.checked = !!v;
    else if (el.type === 'radio') el.checked = (el.value === v);
    else el.value = v == null ? '' : v;
  });
  $$('[data-d1]').forEach(function (el) { el.checked = (S.q.d1defects || []).indexOf(el.getAttribute('data-d1')) >= 0; });
  $('#pd').checked = S.pd;
  setMode(S.mode, true);
  renderUnits();
  renderDiscs();
  renderPeriods();
}

/* ===== Режим ===== */
function setMode(m, silent) {
  S.mode = m;
  $$('.mode button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-mode') === m)); });
  $$('[data-modes]').forEach(function (el) { el.hidden = el.getAttribute('data-modes').split(' ').indexOf(m) < 0; });
  $('#outTitle').textContent = m === 'cert' ? 'Довідка' : 'Рішення';
  var a = $('[data-sec="s-out"] span'); if (a) a.textContent = m === 'cert' ? 'Довідка' : 'Рішення';
  OUT_TAB = m === 'cert' ? 'cert' : 'concl';
  var n = 0;
  SECTIONS.forEach(function (sc) {
    var el = document.getElementById(sc.id); if (!el) return;
    var span = el.querySelector('h2 .n');
    if (sc.modes.split(' ').indexOf(m) >= 0) { n++; if (span) span.textContent = n; }
  });
  if (!silent) { renderPeriods(); update(); }
}

/* ===== Оновлення ===== */
function update() {
  LAST = S.mode === 'cert' ? evaluateCert(S) : evaluate(S);
  $$('[data-show]').forEach(function (el) {
    var f = SHOW[el.getAttribute('data-show')];
    if (f) el.hidden = !f(S);
  });
  /* повторно застосувати фільтр режимів до елементів з обома атрибутами */
  $$('[data-modes]').forEach(function (el) { if (el.getAttribute('data-modes').split(' ').indexOf(S.mode) < 0) el.hidden = true; });
  renderAside();
  renderPeriodStatus();
  renderDiscStatus();
  renderInterps();
  renderChecks();
  renderRail();
  renderOut();
  var c = (S.q.d1defects || []).length; $('#d1cnt').textContent = c ? 'відмічено: ' + c : '';
  save();
}

function renderPeriodStatus() {
  var res = LAST.periods || [];
  res.forEach(function (r) {
    var st = $('#pst-' + r.id), dd = $('#pdd-' + r.id), box = $('#pres-' + r.id), cnt = $('#pcnt-' + r.id), dc = $('#pdc-' + r.id);
    if (!st) return;
    st.className = 'st ' + r.status;
    st.textContent = ST_LABEL[r.status] + (r.overridden ? ' (рішення комісії)' : '');
    dd.textContent = r.from && r.to ? fd(r.from) + ' - ' + fd(r.to) + (r.status === 'count' ? ', ' + r.days + ' дн.' : (r.rawDays ? ', ' + r.rawDays + ' дн. календарних' : '')) : '';
    var h = '';
    if (r.reasons.length) h += '<b>Не враховано:</b><ul class="reasons">' + r.reasons.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul>';
    if (r.needs.length) h += '<b>Потребує вирішення:</b><ul class="needs">' + r.needs.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul>';
    if (r.agg && r.agg.list.length) h += '<b>Відмічені формулювання:</b><ul class="notes">' + r.agg.list.map(function (f) { return '<li><span class="v ' + f.v + '">' + ({ yes: 'підтверджує', no: 'не підтверджує', doubt: 'двозначно' })[f.v] + '</span> ' + esc(f.t) + '</li>'; }).join('') + '</ul>';
    if (r.notes.length) h += '<ul class="notes">' + r.notes.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul>';
    if (r.refs.length) h += '<div>' + chips(r.refs.filter(function (v, i, a) { return a.indexOf(v) === i; })) + '</div>';
    if (!h) h = '<span class="hint">Зауважень немає.</span>';
    box.innerHTML = h;
    if (cnt) {
      var a = r.agg || { yes: 0, no: 0, doubt: 0 };
      var n = a.yes + a.no + a.doubt;
      cnt.innerHTML = n ? 'відмічено ' + n + ': <span class="v yes">' + a.yes + '</span> <span class="v no">' + a.no + '</span> <span class="v doubt">' + a.doubt + '</span>' : '';
    }
    if (dc) { var p = r.p; dc.textContent = p.defects && p.defects.length ? 'відмічено: ' + p.defects.length : ''; }
  });
}

var VERD = {
  full: { t: 'Підлягає виплаті' },
  prop: { t: 'Підлягає виплаті пропорційно' },
  refuse: { t: 'Не підлягає виплаті' },
  incomplete: { t: 'Рішення неможливе' },
  redirect: { t: 'Вирішує інша частина' }
};
function isEmptyCase() {
  return !Object.keys(S.q).some(function (k) { var v = S.q[k]; return v !== '' && v != null && v !== false && !(Array.isArray(v) && !v.length); }) && !S.periods.length && !S.units.length && !(S.disc || []).length;
}
function renderAside() {
  var r = LAST, h = '', cls, label, sub = '', amt = '';
  if (S.mode === 'cert') {
    if (!S.periods.length && isEmptyCase()) { cls = 'empty'; label = 'Внесіть відомості для довідки'; }
    else if (r.ready) { cls = 'full'; label = 'Довідку можна оформити'; amt = r.days + ' ' + plural(r.days, ['день', 'дні', 'днів']); sub = 'безпосередньої участі станом на 13.02.2025'; }
    else { cls = 'incomplete'; label = 'Не вистачає даних'; sub = 'пунктів: ' + r.gaps.length; }
    h += '<div class="stamp ' + cls + '" id="stamp">' + esc(label) + (amt ? '<span class="amt">' + esc(amt) + '</span>' : '') + (sub ? '<small>' + esc(sub) + '</small>' : '') + '</div>';
    h += '<div class="kpis"><div class="kpi"><b>' + r.days + '</b><span>днів враховано</span></div><div class="kpi"><b>' + r.counted.length + ' / ' + r.periods.length + '</b><span>періодів враховано</span></div></div>';
    if (r.gaps.length) h += '<div class="glist"><h3><span class="dot missing"></span>Що доопрацювати</h3><ul class="missing">' + r.gaps.map(function (g) { return '<li data-go="s-part">' + esc(g) + '</li>'; }).join('') + '</ul></div>';
  } else {
    if (isEmptyCase()) { cls = 'empty'; label = 'Внесіть відомості про особу'; }
    else {
      cls = r.verdict; label = VERD[r.verdict].t;
      if (r.verdict === 'full' || r.verdict === 'prop') { amt = fmtMoney(r.amount); sub = r.basis === 'six' ? 'не менше 6 місяців участі' : r.basis === 'wound' ? 'у зв\'язку з пораненням' : r.basis === 'captivity' ? 'у зв\'язку з полоном' : (r.blocksMode === 'daily' ? r.days + ' дн.' : r.blocks + ' x 30 днів'); }
      else if (r.verdict === 'refuse') sub = 'підстав: ' + r.fails.length;
      else if (r.verdict === 'redirect') sub = 'матеріали направити за належністю';
      else sub = 'бракує: ' + r.missing.length;
    }
    h += '<div class="stamp ' + cls + '" id="stamp">' + esc(label) + (amt ? '<span class="amt">' + esc(amt) + '</span>' : '') + (sub ? '<small>' + esc(sub) + '</small>' : '') + '</div>';
    h += '<div class="kpis"><div class="kpi"><b>' + r.days + '</b><span>днів участі враховано</span></div><div class="kpi"><b>' + (r.cat === '942' ? 'пост. 942' : r.cat === 'base' ? 'загальна' : '-') + '</b><span>категорія</span></div></div>';
    if (r.verdict === 'incomplete' && r.provisional && !isEmptyCase()) h += '<div class="prov">Попередньо, якщо документи підтвердяться: ' + (r.provisional === 'full' ? 'в повному обсязі, ' + fmtMoney(C.FULL) : 'пропорційно, ' + fmtMoney(r.propAmount)) + '.</div>';
    if (r.pending.length) h += '<div class="prov">Не вирішено періодів: ' + r.pending.length + '. Разом з ними могло б бути ' + r.potentialDays + ' дн.</div>';
    var areaSec = {};
    SECTIONS.forEach(function (sc) { sc.areas.forEach(function (a) { areaSec[a] = sc.id; }); });
    function list(arr, kind, title) {
      if (!arr.length) return '';
      return '<div class="glist"><h3><span class="dot ' + kind + '"></span>' + title + '</h3><ul class="' + kind + '">' + arr.map(function (x) { return '<li data-go="' + (areaSec[x.area] || 's-checks') + '">' + esc(x.title) + (x.note ? '<span class="nt">' + esc(x.note) + '</span>' : '') + '</li>'; }).join('') + '</ul></div>';
    }
    if (!isEmptyCase()) {
      h += list(r.stops || [], 'stop', 'Компетенція');
      h += list(r.fails, 'fail', 'Підстави для відмови');
      h += list(r.missing, 'missing', 'Бракує документів (відомостей)');
      h += list(r.doubts, 'doubt', 'Двозначні положення: рішення комісії');
    }
  }
  h += '<div class="actions"><button type="button" class="btn primary" data-go="s-out">До тексту ' + (S.mode === 'cert' ? 'довідки' : 'рішення') + '</button></div>';
  var box = $('#verdict');
  var key = S.mode + (S.mode === 'cert' ? (r.ready ? 'r' : 'n') : r.verdict + r.amount);
  box.innerHTML = h;
  if (key !== LASTV && LASTV) { var st = $('#stamp'); st.classList.add('press'); }
  LASTV = key;
}

function renderRail() {
  SECTIONS.forEach(function (sc) {
    var d = $('#dot-' + sc.id); if (!d) return;
    var cls = '';
    if (S.mode === 'pay' && sc.areas.length && LAST.items && !isEmptyCase()) {
      var its = LAST.items.filter(function (x) { return sc.areas.indexOf(x.area) >= 0; });
      if (its.some(function (x) { return x.status === 'fail' || x.status === 'stop'; })) cls = 'fail';
      else if (its.some(function (x) { return x.status === 'missing'; })) cls = 'missing';
      else if (its.some(function (x) { return x.status === 'doubt'; })) cls = 'doubt';
      else if (its.some(function (x) { return x.status === 'ok'; })) cls = 'ok';
    }
    if (sc.id === 's-part' && LAST.periods && LAST.periods.length) {
      if (LAST.pending && LAST.pending.length) cls = cls || 'doubt';
    }
    d.className = 'dot ' + cls;
  });
}

function renderInterps() {
  var used = (LAST && LAST.interps) || [];
  var ids = Object.keys(INTERPS);
  ids.sort(function (a, b) { return (used.indexOf(b) >= 0) - (used.indexOf(a) >= 0); });
  var box = $('#interps');
  var html = ids.map(function (id, i) {
    var d = INTERPS[id], v = interpValue(S, id), on = used.indexOf(id) >= 0;
    var head = (!on && (i === 0 || used.indexOf(ids[i - 1]) >= 0)) ? '<p class="hint" style="margin:14px 0 8px">Зараз у справі не застосовуються:</p>' : '';
    return head + '<div class="ip' + (on ? ' active' : '') + '"><h3>' + esc(d.t) + '</h3><p>' + esc(d.q) + '</p><div>' + d.o.map(function (o) {
      return '<label class="opt"><input type="radio" name="ip-' + id + '" value="' + o.v + '" data-i="' + id + '"' + (o.v === v ? ' checked' : '') + '><span><b>' + esc(o.l) + '</b>' + (o.v === d.def ? ' <span class="hint">(типово)</span>' : '') + '</span><span class="hint">' + esc(o.h) + '</span></label>';
    }).join('') + '</div></div>';
  }).join('');
  if (box.getAttribute('data-h') !== html) { box.innerHTML = html; box.setAttribute('data-h', html); }
}

var AREA_T = { person: 'Особа', cat: 'Категорія', status: 'Статус', proc: 'Порядок виплати', paid: 'Попередня виплата', part: 'Участь', wound: 'Поранення, полон', resp: 'Відповідальність', docs: 'Документи' };
var TAG_T = { ok: 'виконано', fail: 'відмова', missing: 'бракує', doubt: 'тлумачення', info: 'до відома', stop: 'компетенція' };
function renderChecks() {
  if (S.mode !== 'pay') return;
  var items = LAST.items || [];
  $('#checks').innerHTML = items.length ? items.map(function (x) {
    return '<li><span class="tag ' + x.status + '">' + TAG_T[x.status] + '</span><span><b>' + esc(x.title) + '</b>' + (x.text ? '<br><span class="x">' + esc(x.text) + '</span>' : '') + (x.note ? '<br><span class="x nt">' + esc(x.note) + '</span>' : '') + ' ' + chips(x.refs) + '</span></li>';
  }).join('') : '<li class="hint">Внесіть відомості.</li>';
}

var OUT_TAB = 'concl';
var TABS = {
  pay: [['list', 'Перелік документів для засідання'], ['concl', 'Висновок комісії'], ['order', 'Проєкт наказу'], ['refusal', 'Відповідь з відмовою'], ['req', 'Запити до частин']],
  cert: [['cert', 'Довідка (Додаток 1)'], ['memo', 'Довідка-обґрунтування']]
};
var DOC_DIRTY = false;
function renderOut() {
  var tabs = TABS[S.mode];
  if (!tabs.some(function (t) { return t[0] === OUT_TAB; })) OUT_TAB = tabs[0][0];
  if (S.mode === 'pay' && !DOC_TAB_CHOSEN) {
    if (LAST.verdict === 'refuse') OUT_TAB = 'refusal';
    else if (LAST.verdict === 'full' || LAST.verdict === 'prop') OUT_TAB = 'concl';
  }
  $('#tabs').innerHTML = tabs.map(function (t) { return '<button type="button" role="tab" data-tab="' + t[0] + '" aria-selected="' + (t[0] === OUT_TAB) + '">' + t[1] + '</button>'; }).join('');
  var html = '';
  if (OUT_TAB === 'list') html = docChecklist(S, LAST);
  else if (OUT_TAB === 'concl') html = docConclusion(S, LAST);
  else if (OUT_TAB === 'order') html = docOrder(S, LAST);
  else if (OUT_TAB === 'refusal') html = docRefusal(S, LAST);
  else if (OUT_TAB === 'req') html = docRequests(S, LAST);
  else if (OUT_TAB === 'cert') html = docCert(S, LAST);
  else if (OUT_TAB === 'memo') html = docMemo(S, LAST);
  var doc = $('#doc');
  $('#dirty').hidden = !DOC_DIRTY;
  if (DOC_DIRTY) return;
  if (document.activeElement !== doc) doc.innerHTML = html;
}
var DOC_TAB_CHOSEN = false;

/* ===== Збереження ===== */
function stripPD(o, deep) {
  var c = JSON.parse(JSON.stringify(o));
  ['pib', 'pibGen', 'pibDat', 'rnokpp', 'milDoc', 'recipientName'].forEach(function (k) { c.c[k] = ''; });
  if (deep) {
    ['dob', 'crimDetails', 'admDetails', 'discDetails', 'woundDocText', 'captivityDocText'].forEach(function (k) { if (c.q) c.q[k] = ''; });
    c.c.dismissOrder = '';
  }
  return c;
}
function save() {
  try { localStorage.setItem(SKEY, JSON.stringify(stripPD(S, true))); } catch (e) { }
}
function load() {
  try { var t = localStorage.getItem(SKEY); if (t) { var o = JSON.parse(t); if (o && o.v === 1) return normalize(o); } } catch (e) { }
  return blank();
}
function normalize(o) {
  var b = blank();
  o.c = Object.assign(b.c, o.c || {});
  o.q = o.q || {}; o.units = o.units || []; o.disc = o.disc || []; o.periods = (o.periods || []).map(function (p) { var n = Object.assign(newPeriod(), p); n.brk = n.brk || []; return n; }); o.interp = o.interp || {};
  return o;
}
function download(name, text, type) {
  var blob = new Blob([text], { type: type });
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click();
  setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}
function toast(t) {
  var el = document.createElement('div'); el.className = 'toast'; el.textContent = t;
  document.body.appendChild(el); setTimeout(function () { el.remove(); }, 2200);
}
function caseName() {
  var n = (S.pd && S.c.pib) ? S.c.pib.split(' ')[0] : 'sprava';
  return 'vynagoroda_' + n + '_' + (S.c.date || today());
}

/* ===== Довідник норм ===== */
function openRefs(focus) {
  var d = $('#refdlg');
  var groups = [['P', 'Постанова КМУ № 153'], ['D', 'Доручення Міністра оборони № 5601/уд'], ['R', 'Роз\'яснення ДСЗ МОУ від 08.12.2025 № 220/13/28126'], ['L', 'Закони та інші акти']];
  var h = '<p class="hint">Колір позначки показує вагу джерела: <span class="ref k-p">постанова</span> <span class="ref k-d">доручення</span> <span class="ref k-r">роз\'яснення МОУ</span> <span class="ref k-l">закон</span>. Роз\'яснення МОУ не є нормативним актом: це позиція відомства, яку застосовує фінансовий контроль, але суд може з нею не погодитися.</p>';
  if (typeof NORMS !== 'undefined' && NORMS.length) {
    h += '<h3>Ключові норми</h3>' + NORMS.map(function (n) { return '<p><b>' + esc(n.t) + '</b></p><blockquote class="norm">' + n.x + '</blockquote>' + (n.s ? '<p class="hint">' + esc(n.s) + '</p>' : ''); }).join('');
  }
  groups.forEach(function (g) {
    h += '<h3>' + g[1] + '</h3><dl class="reflist">';
    Object.keys(REFS).forEach(function (k) {
      var r = REFS[k]; if (r.k !== g[0]) return;
      h += '<div id="ref-' + k + '"' + (k === focus ? ' class="hl"' : '') + '><dt>' + esc(r.s) + '</dt><dd>' + esc(r.f) + (r.t ? '. Зміст: ' + esc(r.t) : '') + (r.x ? '<br>' + r.x : '') + '</dd></div>';
    });
    h += '</dl>';
  });
  if (typeof PRACTICE !== 'undefined' && PRACTICE.length) {
    h += '<h3>Судова практика і практика застосування</h3>' + PRACTICE.map(function (p) { return '<p><b>' + esc(p.t) + '</b><br><span class="hint">' + p.x + '</span></p>'; }).join('');
  }
  $('#refbody').innerHTML = h;
  if (!d.open) d.showModal();
  if (focus) { var el = $('#ref-' + focus); if (el) el.scrollIntoView({ block: 'center' }); }
}

/* ===== Підтвердження в самій сторінці (вбудований діалог) ===== */
var IN_FRAME = (function () { try { return window.self !== window.top; } catch (e) { return true; } })();
var DL = null;
if (IN_FRAME) { try { if (window.claude && window.claude.use) window.claude.use('downloads').then(function (d) { DL = d; }, function () { DL = null; }); } catch (e) { } }
function askConfirm(msg, yesLabel, onYes) {
  var d = $('#cfmdlg');
  $('#cfmtext').textContent = msg;
  $('#cfmyes').textContent = yesLabel || 'Так';
  d._onYes = onYes;
  d.showModal();
}

/* ===== Події ===== */
function onInput(e) {
  var el = e.target;
  var k = el.getAttribute('data-k');
  if (k) {
    var v = el.type === 'checkbox' ? el.checked : el.value;
    if (el.type === 'radio' && !el.checked) return;
    setPath(S, k, v);
    update(); return;
  }
  var u = el.getAttribute('data-u');
  if (u) {
    var parts = u.split('.'), unit = S.units.filter(function (x) { return x.id === parts[0]; })[0];
    if (!unit) return;
    unit[parts[1]] = el.type === 'checkbox' ? el.checked : el.value;
    if (parts[1] === 'current' && el.checked) S.units.forEach(function (x) { if (x !== unit) x.current = false; });
    if ((parts[1] === 'to' || parts[1] === 'current') && e.type === 'change') { renderUnits(); }
    update(); return;
  }
  var pb = el.getAttribute('data-pb');
  if (pb) {
    var bp = pb.split('.'), bper = S.periods.filter(function (x) { return x.id === bp[0]; })[0];
    if (!bper) return;
    var bb = (bper.brk || []).filter(function (x) { return x.id === bp[1]; })[0];
    if (!bb) return;
    bb[bp[2]] = el.value;
    update(); return;
  }
  var dc = el.getAttribute('data-dc');
  if (dc) {
    var dp = dc.split('.'), dd = S.disc.filter(function (x) { return x.id === dp[0]; })[0];
    if (!dd) return;
    dd[dp[1]] = el.type === 'checkbox' ? el.checked : el.value;
    update(); return;
  }
  var p = el.getAttribute('data-p');
  if (p) {
    var pp = p.split('.'), per = S.periods.filter(function (x) { return x.id === pp[0]; })[0];
    if (!per) return;
    if (el.type === 'radio' && !el.checked) return;
    per[pp[1]] = el.type === 'checkbox' ? el.checked : el.value;
    if (el.getAttribute('data-rerender') && e.type === 'change') { renderPeriods(); }
    update(); return;
  }
  var pr = el.getAttribute('data-pp');
  if (pr) {
    var pe = S.periods.filter(function (x) { return x.id === pr; })[0];
    if (!pe) return;
    var i = pe.phrases.indexOf(el.value);
    if (el.checked && i < 0) pe.phrases.push(el.value);
    if (!el.checked && i >= 0) pe.phrases.splice(i, 1);
    update(); return;
  }
  var pdf = el.getAttribute('data-pdf');
  if (pdf) {
    var pq = S.periods.filter(function (x) { return x.id === pdf; })[0];
    if (!pq) return;
    var j = pq.defects.indexOf(el.value);
    if (el.checked && j < 0) pq.defects.push(el.value);
    if (!el.checked && j >= 0) pq.defects.splice(j, 1);
    update(); return;
  }
  var d1 = el.getAttribute('data-d1');
  if (d1) {
    var arr = S.q.d1defects || (S.q.d1defects = []);
    var m = arr.indexOf(d1);
    if (el.checked && m < 0) arr.push(d1);
    if (!el.checked && m >= 0) arr.splice(m, 1);
    update(); return;
  }
  var ip = el.getAttribute('data-i');
  if (ip && el.checked) { S.interp[ip] = el.value; update(); return; }
  var ps = el.getAttribute('data-ps') || el.getAttribute('data-pf');
  if (ps) { filterPhrases(ps); return; }
}

function onClick(e) {
  var t = e.target.closest('[data-act],[data-ref],[data-go],[data-tab],[data-mode]');
  if (!t) return;
  var ref = t.getAttribute('data-ref');
  if (ref) { e.preventDefault(); openRefs(ref); return; }
  var go = t.getAttribute('data-go');
  if (go) { var sec = document.getElementById(go); if (sec) sec.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' }); return; }
  var tab = t.getAttribute('data-tab');
  if (tab) {
    var go2 = function () { DOC_DIRTY = false; OUT_TAB = tab; DOC_TAB_CHOSEN = true; renderOut(); };
    if (DOC_DIRTY) askConfirm('Ручні правки в цьому тексті буде втрачено.', 'Перейти', go2); else go2();
    return;
  }
  var mode = t.getAttribute('data-mode');
  if (mode) { setMode(mode); return; }
  var a = t.getAttribute('data-act'), id = t.getAttribute('data-id');
  if (a === 'addp') { S.periods.push(newPeriod()); renderPeriods(); update(); var last = S.periods[S.periods.length - 1]; var el = $('#per-' + last.id + ' input[type=date]'); if (el) el.focus(); }
  else if (a === 'delp') { askConfirm('Видалити період ' + (S.periods.map(function (x) { return x.id; }).indexOf(id) + 1) + '?', 'Видалити', function () { S.periods = S.periods.filter(function (x) { return x.id !== id; }); renderPeriods(); update(); }); }
  else if (a === 'dupp') { var src = S.periods.filter(function (x) { return x.id === id; })[0]; if (src) { var cp = JSON.parse(JSON.stringify(src)); cp.id = uid(); cp.from = ''; cp.to = ''; S.periods.splice(S.periods.indexOf(src) + 1, 0, cp); renderPeriods(); update(); } }
  else if (a === 'addbr') { var pr1 = S.periods.filter(function (x) { return x.id === id; })[0]; if (pr1) { (pr1.brk = pr1.brk || []).push({ id: uid(), from: '', to: '', why: '' }); renderPeriods(); update(); } }
  else if (a === 'delbr') { var pr2 = S.periods.filter(function (x) { return x.id === id; })[0]; if (pr2) { var bid = t.getAttribute('data-b'); pr2.brk = (pr2.brk || []).filter(function (x) { return x.id !== bid; }); renderPeriods(); update(); } }
  else if (a === 'addd') { S.disc.push(newDisc()); renderDiscs(); update(); }
  else if (a === 'deld') { S.disc = S.disc.filter(function (x) { return x.id !== id; }); renderDiscs(); update(); }
  else if (a === 'addu') { var nu = newUnit(); if (!S.units.length) nu.current = true; S.units.push(nu); renderUnits(); update(); }
  else if (a === 'delu') { S.units = S.units.filter(function (x) { return x.id !== id; }); renderUnits(); update(); }
  else if (a === 'new') { askConfirm('Почати нову справу? Поточні відомості буде очищено. Якщо вони потрібні, спершу збережіть справу.', 'Почати нову', function () { var m = S.mode, p = S.pd; S = blank(); S.mode = m; S.pd = p; DOC_TAB_CHOSEN = false; DOC_DIRTY = false; fillAll(); update(); window.scrollTo(0, 0); }); }
  else if (a === 'save') {
    var js = JSON.stringify(S.pd ? S : stripPD(S), null, 1);
    var showCopy = function () { $('#jsontext').value = js; $('#savedlg').showModal(); };
    if (IN_FRAME && DL) {
      DL.save({ filename: caseName() + '.json', data: js }).then(function () { toast('Справу збережено у файл'); }, function (err) { if (err && (err.code === 'declined' || err.code === 'rate_limited')) return; showCopy(); });
    }
    else if (IN_FRAME) showCopy();
    else { download(caseName() + '.json', js, 'application/json'); toast(S.pd ? 'Справу збережено у файл (з персональними даними)' : 'Справу збережено у файл без персональних даних'); }
  }
  else if (a === 'open') { $('#pastetext').value = ''; $('#opendlg').showModal(); }
  else if (a === 'refs') { openRefs(); }
  else if (a === 'help') { $('#helpdlg').showModal(); }
  else if (a === 'closedlg') { t.closest('dialog').close(); }
  else if (a === 'copy') { copyDoc(); }
  else if (a === 'regen') { askConfirm('Ручні правки буде втрачено. Оновити текст з даних справи?', 'Оновити', function () { DOC_DIRTY = false; renderOut(); }); }
  else if (a === 'cfmyes') { var dlg = $('#cfmdlg'); dlg.close(); if (dlg._onYes) { var f = dlg._onYes; dlg._onYes = null; f(); } }
  else if (a === 'select') { var rg = document.createRange(); rg.selectNodeContents($('#doc')); var sl = getSelection(); sl.removeAllRanges(); sl.addRange(rg); toast('Текст виділено: скопіюйте його з форматуванням'); }
  else if (a === 'copyjson') { var ta = $('#jsontext'); ta.select(); var txt = ta.value; if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(function () { toast('Справу скопійовано'); }, function () { try { document.execCommand('copy'); toast('Справу скопійовано'); } catch (e) { toast('Виділіть текст і скопіюйте вручну'); } }); else { try { document.execCommand('copy'); toast('Справу скопійовано'); } catch (e) { toast('Виділіть текст і скопіюйте вручну'); } } }
  else if (a === 'pastejson') { try { var o2 = JSON.parse($('#pastetext').value); if (!o2 || o2.v !== 1) throw new Error(); S = normalize(o2); DOC_TAB_CHOSEN = false; DOC_DIRTY = false; fillAll(); update(); $('#opendlg').close(); toast('Справу відкрито'); } catch (e) { toast('Це не текст збереженої справи'); } }
  else if (a === 'pickfile') { $('#openfile').click(); }
  else if (a === 'word') { var html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"><style>body{font-family:"Times New Roman";font-size:14pt;line-height:1.3} p{margin:0 0 6pt;text-align:justify;text-indent:1.25cm} p.c{text-align:center;text-indent:0} p.r{text-align:right;text-indent:0} p.l{text-align:left;text-indent:0} .b{font-weight:bold} p.sig{text-indent:0} table{border-collapse:collapse;width:100%;font-size:12pt} td,th{border:1px solid #000;padding:2pt 4pt;vertical-align:top} .ph{background:#fff3c4}</style></head><body>' + $('#doc').innerHTML + '</body></html>'; download(caseName() + '_' + OUT_TAB + '.doc', '﻿' + html, 'application/msword'); }
  else if (a === 'print') { $('#s-out').classList.add('print-me'); window.print(); setTimeout(function () { $('#s-out').classList.remove('print-me'); }, 500); }
  else if (a === 'theme') { var r = document.documentElement; var cur = r.getAttribute('data-theme'); var dark = cur ? cur === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches; r.setAttribute('data-theme', dark ? 'light' : 'dark'); }
}
function copyDoc() {
  var el = $('#doc');
  var txt = el.innerText;
  function done() { toast('Текст скопійовано'); }
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(done, fallback);
  else fallback();
  function fallback() {
    var r = document.createRange(); r.selectNodeContents(el);
    var sel = getSelection(); sel.removeAllRanges(); sel.addRange(r);
    try { document.execCommand('copy'); done(); } catch (e) { toast('Виділіть текст і скопіюйте вручну'); }
    sel.removeAllRanges();
  }
}

function initSpy() {
  if (!('IntersectionObserver' in window)) return;
  var links = {};
  $$('[data-sec]').forEach(function (a) { links[a.getAttribute('data-sec')] = a; });
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (en) {
      if (en.isIntersecting) { $$('.rail a.on').forEach(function (a) { a.classList.remove('on'); }); var a = links[en.target.id]; if (a) a.classList.add('on'); }
    });
  }, { rootMargin: '-90px 0px -65% 0px' });
  SECTIONS.forEach(function (sc) { var el = document.getElementById(sc.id); if (el) io.observe(el); });
}

function init() {
  indexData();
  if (IN_FRAME) document.documentElement.classList.add('framed');
  S = load();
  buildApp();
  fillAll();
  document.addEventListener('input', onInput);
  document.addEventListener('change', onInput);
  document.addEventListener('click', onClick);
  $('#pd').addEventListener('change', function () { S.pd = this.checked; update(); });
  $('#doc').addEventListener('input', function () { DOC_DIRTY = true; });
  $('#openfile').addEventListener('change', function () {
    var f = this.files[0]; if (!f) return;
    var rd = new FileReader();
    rd.onload = function () {
      try { var o = JSON.parse(rd.result); if (!o || o.v !== 1) throw new Error(); S = normalize(o); DOC_TAB_CHOSEN = false; DOC_DIRTY = false; fillAll(); update(); var od = $('#opendlg'); if (od.open) od.close(); toast('Справу відкрито'); }
      catch (e) { toast('Файл не є збереженою справою'); }
    };
    rd.readAsText(f, 'utf-8');
    this.value = '';
  });
  update();
  initSpy();
}
document.addEventListener('DOMContentLoaded', init);
