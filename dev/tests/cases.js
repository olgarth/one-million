const c = require('./harness.js');

function base(over) {
  const s = {
    mode: 'pay', pd: false, c: { date: '2026-10-26' },
    q: { citizen: 'ua', dob: '2001-05-10', path: 'mob', admDate: '2023-03-01', rank13: 'enlisted', st13: 'serving', stNow: 'serving_here', place2609: 'here', paid: 'no_conf', crim: 'none', admCount: '0', discCount: '0', g1: true, g2: true, g3: true, wound: 'no', captive: 'no' },
    units: [{ id: 'u1', name: 'А1234', from: '2023-03-01', to: '', current: true, d1: true, d2: false }],
    periods: [], interp: {}
  };
  return deepMerge(s, over || {});
}
function deepMerge(a, b) {
  for (const k of Object.keys(b)) {
    if (b[k] && typeof b[k] === 'object' && !Array.isArray(b[k]) && a[k] && typeof a[k] === 'object' && !Array.isArray(a[k])) deepMerge(a[k], b[k]);
    else a[k] = b[k];
  }
  return a;
}
function per(from, to, o) { return Object.assign({ id: 'p' + Math.random().toString(36).slice(2, 6), from, to, breaks: '', place: 'concrete', placeText: 'Донецька обл., н. п. Х', src: 'd1', task: 'combat', phrases: [], defects: [], decision: 'auto' }, o || {}); }

const CASES = [
  ['Базовий: 204 дні', base({ periods: [per('2023-06-01', '2023-12-31', { brk: [{ from: '2023-08-01', to: '2023-08-10' }] })] }), { verdict: 'full', amount: 1000000, days: 204 }],
  ['Пропорційно: 100 днів = 3 x 30', base({ periods: [per('2023-06-01', '2023-09-08')] }), { verdict: 'prop', amount: 500000, days: 100 }],
  ['Пропорційно: 179 днів = 5 x 30', base({ periods: [per('2023-06-01', '2023-11-26')] }), { verdict: 'prop', amount: 833333.33, days: 179 }],
  ['Рівно 180 днів = повна (межова)', base({ periods: [per('2023-06-01', '2023-11-27')] }), { verdict: 'full', days: 180, hasDoubt: 'sixMonths' }],
  ['Менше 30 днів', base({ periods: [per('2023-06-01', '2023-06-20')] }), { verdict: 'refuse', days: 20, failKey: 'lt30' }],
  ['Поранення, 100 днів', base({ q: { wound: 'yes', woundDate: '2023-09-01', woundDoc: 'travma', woundLink: 'zakhyst', woundArea: 'combat_area' }, periods: [per('2023-06-01', '2023-09-08')] }), { verdict: 'full', basis: 'wound' }],
  ['Поранення 13.02.2025 (В. 21)', base({ q: { wound: 'yes', woundDate: '2025-02-13', woundDoc: 'travma', woundLink: 'zakhyst', woundArea: 'combat_area' }, periods: [per('2024-12-01', '2025-02-13')] }), { verdict: 'full', basis: 'wound' }],
  ['Поранення 14.02.2025: не впливає', base({ q: { wound: 'yes', woundDate: '2025-02-14', woundDoc: 'travma', woundLink: 'zakhyst', woundArea: 'combat_area' }, periods: [per('2024-12-01', '2025-02-28')] }), { verdict: 'prop', days: 75 }],
  ['Поранення без зв\'язку із захистом', base({ q: { wound: 'yes', woundDate: '2023-09-01', woundDoc: 'svid', woundLink: 'ne_zakhyst' }, periods: [per('2023-06-01', '2023-09-08')] }), { verdict: 'prop' }],
  ['Поранення без документа', base({ q: { wound: 'yes', woundDate: '2023-09-01', woundDoc: 'none', woundLink: 'zakhyst' }, periods: [per('2023-06-01', '2023-09-08')] }), { verdict: 'incomplete' }],
  ['Полон, звільнений, 60 днів', base({ q: { captive: 'released', captivityDoc: true, captDate: '2023-08-01' }, periods: [per('2023-06-01', '2023-07-30')] }), { verdict: 'full', basis: 'captivity' }],
  ['Добровільна здача', base({ q: { captive: 'released', voluntary: true, captivityDoc: true, captDate: '2023-08-01' }, periods: [per('2023-06-01', '2023-07-30')] }), { verdict: 'prop' }],
  ['Вік 25 на дату призову', base({ q: { dob: '1998-03-01' }, periods: [per('2023-06-01', '2023-12-31')] }), { verdict: 'refuse', failKey: 'age' }],
  ['Вік: день до 25-річчя', base({ q: { dob: '1998-03-02' }, periods: [per('2023-06-01', '2023-12-31')] }), { verdict: 'full' }],
  ['Іноземець', base({ q: { citizen: 'foreign' }, periods: [per('2023-06-01', '2023-12-31')] }), { verdict: 'refuse', failKey: 'citizen' }],
  ['Контракт до війни', base({ q: { path: 'prewar' }, periods: [per('2023-06-01', '2023-12-31')] }), { verdict: 'refuse', failKey: 'prewar' }],
  ['Прийнятий після 13.02.2025', base({ q: { admDate: '2025-03-01' }, periods: [] }), { verdict: 'refuse', failKey: 'admAfter' }],
  ['Офіцер з інших підстав', base({ q: { rank13: 'officer_other' }, periods: [per('2023-06-01', '2023-12-31')] }), { verdict: 'refuse', failKey: 'officer' }],
  ['Атестований мол. лейтенант, 200 днів', base({ q: { rank13: 'officer_att' }, periods: [per('2023-06-01', '2023-12-17')] }), { verdict: 'full' }],
  ['Атестований мол. лейтенант, 100 днів (В. 22)', base({ q: { rank13: 'officer_att' }, periods: [per('2023-06-01', '2023-09-08')] }), { verdict: 'refuse', failKey: 'cat942' }],
  ['Строковик, 100 днів + поранення (В. 22)', base({ q: { path: 'strok_contract', admDate: '2022-05-01', wound: 'yes', woundDate: '2023-09-01', woundDoc: 'travma', woundLink: 'zakhyst', woundArea: 'combat_area' }, periods: [per('2023-06-01', '2023-09-08')] }), { verdict: 'refuse', failKey: 'cat942' }],
  ['Строковик, 100 днів, тлумачення «за текстом»', base({ q: { path: 'strok_contract', admDate: '2022-05-01' }, interp: { cat942: 'text' }, periods: [per('2023-06-01', '2023-09-08')] }), { verdict: 'prop', amount: 500000 }],
  ['Звання офіцера після 13.02.2025, 100 днів', base({ q: { officerAfter: true }, periods: [per('2023-06-01', '2023-09-08')] }), { verdict: 'prop' }],
  ['Курсант', base({ q: { path: 'cadet' }, periods: [per('2023-06-01', '2023-12-31')] }), { verdict: 'full' }],
  ['Вирок', base({ q: { crim: 'verdict', crimWhen: 'window' }, periods: [per('2023-06-01', '2023-12-31')] }), { verdict: 'refuse', failKey: 'crim' }],
  ['Підозра (типово відмова)', base({ q: { crim: 'suspicion', crimWhen: 'window' }, periods: [per('2023-06-01', '2023-12-31')] }), { verdict: 'refuse', failKey: 'crimSusp' }],
  ['Підозра, рішення відкласти', base({ q: { crim: 'suspicion', crimWhen: 'window' }, interp: { crimSusp: 'wait' }, periods: [per('2023-06-01', '2023-12-31')] }), { verdict: 'incomplete' }],
  ['Ч. 5 ст. 401 КК (типово відмова)', base({ q: { crim: 'released401', crimWhen: 'window' }, periods: [per('2023-06-01', '2023-12-31')] }), { verdict: 'refuse', failKey: 'crim401' }],
  ['Реабілітуюче закриття', base({ q: { crim: 'rehab', crimWhen: 'window' }, periods: [per('2023-06-01', '2023-12-31')] }), { verdict: 'full', hasDoubt: 'crimRehab' }],
  ['Кримінальна до прийняття на службу (УДЗ)', base({ q: { crim: 'verdict', crimWhen: 'outside' }, periods: [per('2023-06-01', '2023-12-31')] }), { verdict: 'full' }],
  ['ЄРДР без підозри', base({ q: { crim: 'erdr' }, periods: [per('2023-06-01', '2023-12-31')] }), { verdict: 'full' }],
  ['2 адміністративні', base({ q: { admCount: '2' }, periods: [per('2023-06-01', '2023-12-31')] }), { verdict: 'refuse', failKey: 'adm2' }],
  ['2 дисциплінарні', base({ q: { discCount: '2' }, periods: [per('2023-06-01', '2023-12-31')] }), { verdict: 'refuse', failKey: 'disc2' }],
  ['1 + 1 (типово окремо)', base({ q: { admCount: '1', discCount: '1' }, periods: [per('2023-06-01', '2023-12-31')] }), { verdict: 'full', hasDoubt: 'combo' }],
  ['1 + 1 за сукупністю', base({ q: { admCount: '1', discCount: '1' }, interp: { combo: 'cumulative' }, periods: [per('2023-06-01', '2023-12-31')] }), { verdict: 'refuse', failKey: 'combo' }],
  ['Вже отримував', base({ q: { paid: 'yes' }, periods: [per('2023-06-01', '2023-12-31')] }), { verdict: 'refuse', failKey: 'paid' }],
  ['Звільнений до 13.02.2025', base({ q: { st13: 'dismissed_before', dismReason: 'other' }, periods: [per('2023-06-01', '2023-12-31')] }), { verdict: 'refuse', failKey: 'dismBefore' }],
  ['Загинув до 13.02.2025', base({ q: { st13: 'dead_before' }, periods: [per('2023-06-01', '2023-12-31')] }), { verdict: 'refuse', failKey: 'deadBefore' }],
  ['Загинув після, звернення в строк', base({ q: { stNow: 'dead_after', deathDate: '2025-05-01', applyDate: '2026-01-10', recipient: 'parents', deathDocs: true }, periods: [per('2023-06-01', '2023-12-31')] }), { verdict: 'full' }],
  ['Загинув після, звернення після 3 років', base({ q: { stNow: 'dead_after', deathDate: '2025-05-01', applyDate: '2028-05-02', recipient: 'parents', deathDocs: true }, periods: [per('2023-06-01', '2023-12-31')] }), { verdict: 'refuse', failKey: 'threeYears' }],
  ['Звільнений після, без попередньої перевірки', base({ q: { stNow: 'dismissed_after' }, periods: [per('2023-06-01', '2023-12-31')] }), { verdict: 'full' }],
  ['Звільнений після, з перевіркою', base({ q: { stNow: 'dismissed_after', preCheck: true }, periods: [per('2023-06-01', '2023-12-31')] }), { verdict: 'full' }],
  ['Лише довідка УБД', base({ periods: [per('2023-06-01', '2023-12-31', { src: 'ubd' })] }), { verdict: 'incomplete', days: 0 }],
  ['Період після 13.02.2025', base({ periods: [per('2025-03-01', '2025-12-31')] }), { verdict: 'refuse', days: 0, failKey: 'lt30' }],
  ['Відсічення по 13.02.2025: 75 днів', base({ periods: [per('2024-12-01', '2025-03-31')] }), { verdict: 'prop', days: 75, amount: 333333.33 }],
  ['Накладання періодів', base({ periods: [per('2023-04-01', '2023-08-31'), per('2023-08-01', '2023-11-30')] }), { verdict: 'full', days: 244 }],
  ['Період до дати призову відсікається', base({ periods: [per('2023-01-01', '2023-04-30')] }), { verdict: 'prop', days: 61 }],
  ['Поза районом', base({ periods: [per('2023-06-01', '2023-12-31', { task: 'outside' })] }), { verdict: 'refuse', days: 0 }],
  ['Громада замість н. п.', base({ periods: [per('2023-06-01', '2023-12-31', { place: 'community' })] }), { verdict: 'incomplete' }],
  ['Громада, але комісія врахувала', base({ periods: [per('2023-06-01', '2023-12-31', { place: 'community', decision: 'count', note: 'уточнено листом' })] }), { verdict: 'full' }],
  ['Немає довідки Дод. 1 з попередньої частини', base({ units: [{ id: 'u1', name: 'А1234', from: '2024-01-01', to: '', current: true, d1: true }, { id: 'u2', name: 'А5678', from: '2023-03-01', to: '2023-12-31', current: false, d1: false }], periods: [per('2023-06-01', '2023-12-31')] }), { verdict: 'incomplete' }],
  ['Немає Дод. 2 з частини після 13.02.2025', base({ units: [{ id: 'u1', name: 'А1234', from: '2025-06-01', to: '', current: true, d1: true }, { id: 'u2', name: 'А5678', from: '2023-03-01', to: '2025-05-31', current: false, d1: true, d2: false }], periods: [per('2023-06-01', '2023-12-31')] }), { verdict: 'incomplete' }],
  ['Служить в іншій частині, 26.09.2025 теж не тут', base({ q: { stNow: 'serving_other', place2609: 'other' }, periods: [per('2023-06-01', '2023-12-31')] }), { verdict: 'redirect' }],
  ['На 26.09.2025 в іншій частині', base({ q: { place2609: 'other' }, periods: [per('2023-06-01', '2023-12-31')] }), { verdict: 'redirect' }],
  ['СЗЧ на 13.02.2025 (типово служив)', base({ q: { st13: 'szch', szchSusp: 'no' }, periods: [per('2023-06-01', '2023-12-31')] }), { verdict: 'full', hasDoubt: 'szch13' }],
  ['Повторний призов (В. 18)', base({ q: { dob: '1997-06-01', admDate: '2022-02-28', reAdmitted: true, wound: 'yes', woundDate: '2022-08-01', woundDoc: 'travma', woundLink: 'zakhyst', woundArea: 'combat_area' }, periods: [per('2022-03-15', '2022-09-20')] }), { verdict: 'full' }],
  ['Немає копії паспорта', base({ q: { g3: false }, periods: [per('2023-06-01', '2023-12-31')] }), { verdict: 'incomplete' }],
  ['Пропорційно подобово (тлумачення)', base({ interp: { blocks: 'daily' }, periods: [per('2023-06-01', '2023-09-08')] }), { verdict: 'prop', amount: 555555.56 }],
  ['Бойові документи, бракує групи «в»', base({ periods: [per('2023-06-01', '2023-12-31', { src: 'combat', gA: true, gB: true, gC: false })] }), { verdict: 'incomplete' }],
  ['Бойові документи, усі групи', base({ periods: [per('2023-06-01', '2023-12-31', { src: 'combat', gA: true, gB: true, gC: true })] }), { verdict: 'full' }],
  ['Новий контракт після довоєнного (типово право є)', base({ q: { path: 'prewar_new', admDate: '2023-01-10' }, periods: [per('2023-06-01', '2023-12-31')] }), { verdict: 'full', hasDoubt: 'prewarNew' }],
  ['Новий контракт після довоєнного, відмова', base({ q: { path: 'prewar_new', admDate: '2023-01-10' }, interp: { prewarNew: 'refuse' }, periods: [per('2023-06-01', '2023-12-31')] }), { verdict: 'refuse', failKey: 'prewarNew' }],
  ['Продовжений довоєнний контракт, позиція № 160/30467/25', base({ q: { path: 'prewar', admDate: '2022-03-25' }, interp: { prewarExt: 'allow' }, periods: [per('2023-06-01', '2023-12-31')] }), { verdict: 'full', hasDoubt: 'prewarExt' }],
  ['Рапорт до 07.08.2025, одна підозра, стара редакція', base({ c: { rapDate: '2025-05-10' }, q: { crim: 'suspicion', crimWhen: 'window' }, interp: { redaction: 'old' }, periods: [per('2023-06-01', '2023-12-31')] }), { verdict: 'full', hasDoubt: 'redaction' }],
  ['Рапорт до 07.08.2025, підозра + 1 дисц., стара редакція', base({ c: { rapDate: '2025-05-10' }, q: { crim: 'suspicion', crimWhen: 'window', discCount: '1' }, interp: { redaction: 'old' }, periods: [per('2023-06-01', '2023-12-31')] }), { verdict: 'refuse', failKey: 'redaction' }],
  ['Рапорт до 07.08.2025, підозра, чинна редакція', base({ c: { rapDate: '2025-05-10' }, q: { crim: 'suspicion', crimWhen: 'window' }, periods: [per('2023-06-01', '2023-12-31')] }), { verdict: 'refuse', failKey: 'crimSusp' }],
  ['Довідка форми 5 без ВЛК (типово досить)', base({ q: { wound: 'yes', woundDate: '2023-09-01', woundDoc: 'travma', woundLink: 'form5', woundArea: 'combat_area' }, periods: [per('2023-06-01', '2023-09-08')] }), { verdict: 'full', basis: 'wound', hasDoubt: 'woundProof' }],
  ['Довідка форми 5 без ВЛК, комісія вимагає ВЛК', base({ q: { wound: 'yes', woundDate: '2023-09-01', woundDoc: 'travma', woundLink: 'form5', woundArea: 'combat_area' }, interp: { woundProof: 'vlk' }, periods: [per('2023-06-01', '2023-09-08')] }), { verdict: 'incomplete' }],
  ['ВЛК: пов\'язане з проходженням служби', base({ q: { wound: 'yes', woundDate: '2023-09-01', woundDoc: 'vlk', woundLink: 'other' }, periods: [per('2023-06-01', '2023-09-08')] }), { verdict: 'prop' }],
  ['Стягнення: 2 суворі догани 2023 (строк минув до 13.02.2025)', base({ q: { discCount: '' }, disc: [{ date: '2023-05-01', type: 'sdog', written: true, inList: true }, { date: '2023-07-01', type: 'sdog', written: true, inList: true }], periods: [per('2023-06-01', '2023-12-31')] }), { verdict: 'full' }],
  ['Стягнення: 2 НСВ у січні 2025 (діють на 13.02.2025)', base({ q: { discCount: '' }, disc: [{ date: '2025-01-10', type: 'nsv', written: true, inList: true }, { date: '2025-01-20', type: 'nsv', written: true, inList: true }], periods: [per('2023-06-01', '2023-12-31')] }), { verdict: 'refuse', failKey: 'disc2' }],
  ['Стягнення: 2 догани в лютому 2025, одна усна', base({ q: { discCount: '' }, disc: [{ date: '2025-02-01', type: 'dog', written: true, inList: true }, { date: '2025-02-05', type: 'dog', written: false, inList: true }], periods: [per('2023-06-01', '2023-12-31')] }), { verdict: 'full' }],
  ['Стягнення: 2 догани, одна не з переліку дод. 12', base({ q: { discCount: '' }, disc: [{ date: '2025-02-01', type: 'dog', written: true, inList: true }, { date: '2025-02-05', type: 'dog', written: true, inList: false }], periods: [per('2023-06-01', '2023-12-31')] }), { verdict: 'full' }],
  ['Стягнення: 2 догани, одна достроково знята', base({ q: { discCount: '' }, disc: [{ date: '2025-02-01', type: 'dog', written: true, inList: true }, { date: '2025-02-05', type: 'dog', written: true, inList: true, removed: '2025-02-10' }], periods: [per('2023-06-01', '2023-12-31')] }), { verdict: 'full' }],
  ['Стягнення: 2 НСВ, перевірка на дату розгляду (діють до 07.2025)', base({ q: { discCount: '' }, interp: { discDate: 'decision' }, disc: [{ date: '2025-01-10', type: 'nsv', written: true, inList: true }, { date: '2025-01-20', type: 'nsv', written: true, inList: true }], periods: [per('2023-06-01', '2023-12-31')] }), { verdict: 'full', hasDoubt: 'discDate' }],
  ['Служить в іншій частині, 26.09.2025 служив тут', base({ q: { stNow: 'serving_other', place2609: 'here' }, periods: [per('2023-06-01', '2023-12-31')] }), { verdict: 'full' }],
  ['СЗЧ, служба призупинена', base({ q: { st13: 'szch', szchSusp: 'yes' }, periods: [per('2023-06-01', '2023-12-31')] }), { verdict: 'refuse', failKey: 'szchSusp' }],
  ['Поранення і полон не з\'ясовано, 100 днів (К1)', base({ q: { wound: '', captive: '' }, periods: [per('2023-06-01', '2023-09-08')] }), { verdict: 'incomplete' }],
  ['Поранення і полон не з\'ясовано, 200 днів', base({ q: { wound: '', captive: '' }, periods: [per('2023-06-01', '2023-12-17')] }), { verdict: 'full' }],
  ['25 днів, документ про поранення в дорозі (К2)', base({ q: { wound: 'yes', woundDate: '2023-06-20', woundDoc: 'none', woundLink: 'unk' }, periods: [per('2023-06-01', '2023-06-25')] }), { verdict: 'incomplete' }],
  ['Перерва поза врахованою частиною (К3)', base({ q: { admDate: '2023-03-01' }, periods: [per('2024-11-15', '2025-04-30', { brk: [{ from: '2025-04-01', to: '2025-04-20' }] })] }), { verdict: 'prop', days: 91, amount: 500000 }],
  ['Перерва до дати призову (К3)', base({ q: { admDate: '2023-03-01' }, periods: [per('2023-01-01', '2023-08-31', { brk: [{ from: '2023-01-01', to: '2023-01-30' }] })] }), { verdict: 'full', days: 184 }],
  ['Дві довідки на той самий період з тією ж відпусткою (К4)', base({ periods: [per('2023-06-01', '2023-12-17', { brk: [{ from: '2023-08-01', to: '2023-08-15' }] }), per('2023-06-01', '2023-12-17', { brk: [{ from: '2023-08-01', to: '2023-08-15' }] })] }), { verdict: 'full', days: 185 }],
  ['Вибуття в основній частині покрите відрядженням (К4)', base({ periods: [per('2023-06-01', '2023-12-17', { brk: [{ from: '2023-08-01', to: '2023-08-15' }] }), per('2023-08-01', '2023-08-15')] }), { verdict: 'full', days: 200 }],
  ['Полон з травня 2025 (К6)', base({ q: { captive: 'released', captivityDoc: true, captDate: '2025-05-10' }, periods: [per('2024-12-15', '2025-02-12')] }), { verdict: 'prop', days: 60 }],
  ['Вирок без дати події (К7)', base({ q: { crim: 'verdict', crimWhen: '' }, periods: [per('2023-06-01', '2023-12-31')] }), { verdict: 'incomplete' }],
  ['Строковик: участь до контракту рахується (К9)', base({ q: { path: 'strok_contract', admDate: '2022-12-01' }, periods: [per('2022-03-01', '2022-09-16'), per('2022-12-01', '2023-01-29')] }), { verdict: 'full', days: 260 }],
  ['Стара редакція: вирок + 1 стягнення з таблиці (К11)', base({ c: { rapDate: '2025-05-01' }, q: { crim: 'verdict', crimWhen: 'window', discCount: '' }, interp: { redaction: 'old' }, disc: [{ date: '2025-01-10', type: 'sdog', written: true, inList: true }], periods: [per('2023-06-01', '2023-12-31')] }), { verdict: 'refuse', failKey: 'redaction' }],
  ['Стара редакція: реабілітація + 1 адмін (К11)', base({ c: { rapDate: '2025-05-01' }, q: { crim: 'rehab', crimWhen: 'window', admCount: '1' }, interp: { redaction: 'old' }, periods: [per('2023-06-01', '2023-12-31')] }), { verdict: 'full', hasDoubt: 'redaction' }],
  ['Стара редакція: 1 адмін + 1 дисц без кримінальної (К11)', base({ c: { rapDate: '2025-05-01' }, q: { admCount: '1', discCount: '1' }, interp: { redaction: 'old' }, periods: [per('2023-06-01', '2023-12-31')] }), { verdict: 'refuse', failKey: 'redaction' }],
  ['Зниклий, виключений до 13.02.2025 (К12, типово відмова)', base({ q: { st13: 'missing_excl', stNow: 'missing_now' }, periods: [per('2023-06-01', '2023-12-31')] }), { verdict: 'refuse', failKey: 'missExcl' }],
  ['Категорія 942, тлумачення «за текстом», 20 днів (С5)', base({ q: { rank13: 'officer_att' }, interp: { cat942: 'text' }, periods: [per('2023-06-01', '2023-06-20')] }), { verdict: 'refuse', failKey: 'lt30' }],
  ['20 днів і незавершений період (С5)', base({ periods: [per('2023-06-01', '2023-06-20'), per('2023-07-01', '2023-07-10', { place: 'community' })] }), { verdict: 'incomplete' }],
  ['Частина з датою вибуття 13.02.2025 потребує Дод. 2 (С9)', base({ units: [{ id: 'u1', name: 'А1234', from: '2025-02-14', to: '', current: true, d1: true }, { id: 'u2', name: 'А5678', from: '2023-03-01', to: '2025-02-13', d1: true, d2: false }], periods: [per('2023-06-01', '2023-12-31')] }), { verdict: 'incomplete' }],
  ['Прийняття 13.02.2025 (С12, типово відмова)', base({ q: { admDate: '2025-02-13' }, periods: [] }), { verdict: 'refuse', failKey: 'adm13' }],
  ['Загибель 13.02.2025 (С19)', base({ q: { stNow: 'dead_after', deathDate: '2025-02-13', applyDate: '2026-01-10', recipient: 'parents', deathDocs: true }, periods: [per('2023-06-01', '2023-12-31')] }), { verdict: 'full', hasDoubt: 'death13' }],
  ['Три роки від рішення суду (С14)', base({ q: { stNow: 'dead_after', deathDate: '2025-05-01', courtDate: '2026-03-01', applyDate: '2028-06-01', recipient: 'parents', deathDocs: true }, periods: [per('2023-06-01', '2023-12-31')] }), { verdict: 'full' }],
  ['Поранення поза районом (С11, типово без винятку)', base({ q: { wound: 'yes', woundDate: '2023-09-01', woundDoc: 'vlk', woundLink: 'vlk', woundArea: 'outside' }, periods: [per('2023-06-01', '2023-09-08')] }), { verdict: 'prop' }],
  ['Поранення при 0 днях: період поза районом', base({ q: { wound: 'yes', woundDate: '2023-07-01', woundDoc: 'vlk', woundLink: 'vlk', woundArea: 'combat_area' }, periods: [per('2023-06-01', '2023-07-10', { task: 'outside' })] }), { verdict: 'refuse' }],
  ['Поранення при 0 днях: лише довідка УБД', base({ q: { wound: 'yes', woundDate: '2023-07-01', woundDoc: 'vlk', woundLink: 'vlk', woundArea: 'combat_area' }, periods: [per('2023-06-01', '2023-07-10', { src: 'ubd' })] }), { verdict: 'incomplete' }],
  ['Поранення при 0 днях: період не вирішено', base({ q: { wound: 'yes', woundDate: '2023-07-01', woundDoc: 'vlk', woundLink: 'vlk', woundArea: 'combat_area' }, periods: [per('2023-06-01', '2023-07-10', { task: '' })] }), { verdict: 'incomplete' }],
  ['Поранення, 40 днів + незавершений період: повна сума, але бракує', base({ q: { wound: 'yes', woundDate: '2023-07-01', woundDoc: 'vlk', woundLink: 'vlk', woundArea: 'combat_area' }, periods: [per('2023-06-01', '2023-07-10'), per('2023-08-01', '2023-08-10', { task: '' })] }), { verdict: 'incomplete' }],
  ['2 дисциплінарні, на дату розгляду діє 1', base({ q: { discCount: '2', discActive: '1' }, interp: { discDate: 'decision' }, periods: [per('2023-06-01', '2023-12-31')] }), { verdict: 'full', hasDoubt: 'discDate' }],
  ['Звільнений до 13.02.2025 за станом здоров\'я (типово відмова)', base({ q: { st13: 'dismissed_before', dismReason: 'health', stNow: 'dismissed_after', preCheck: true }, periods: [per('2023-06-01', '2023-08-31')] }), { verdict: 'refuse', failKey: 'dismHealth' }],
  ['Звільнений до 13.02.2025 за станом здоров\'я, позиція судів', base({ q: { st13: 'dismissed_before', dismReason: 'health', stNow: 'dismissed_after', preCheck: true, wound: 'yes', woundDate: '2023-08-20', woundDoc: 'vlk', woundLink: 'zakhyst', woundArea: 'combat_area' }, interp: { dismHealth: 'allow' }, periods: [per('2023-06-01', '2023-08-31')] }), { verdict: 'full', basis: 'wound' }],
  ['Захворювання після 13.02.2025 (типово не впливає)', base({ q: { wound: 'yes', woundDate: '2025-05-01', woundDoc: 'vlk', woundLink: 'zakhyst', woundArea: 'combat_area' }, periods: [per('2024-10-01', '2025-02-07')] }), { verdict: 'prop', days: 130 }],
  ['Захворювання після 13.02.2025, позиція суду № 300/8569/25', base({ q: { wound: 'yes', woundDate: '2025-05-01', woundDoc: 'vlk', woundLink: 'zakhyst', woundArea: 'combat_area' }, interp: { woundDate: 'any' }, periods: [per('2024-10-01', '2025-02-07')] }), { verdict: 'full', basis: 'wound' }]
];

/* режим довідки */
const certCases = [
  ['Довідка: строковик, участь до контракту', { mode: 'cert', pd: false, c: {}, q: { svcStart: '2021-11-20', crim: 'none', admCount: '0', discCount: '0', wound: 'no', captive: 'no' }, units: [], disc: [], interp: {}, periods: [per('2022-03-01', '2022-09-16', { gA: true, gB: true, gC: true }), per('2023-03-01', '2023-04-29', { gA: true, gB: true, gC: true })] }, 260],
  ['Довідка: перекриття періодів', { mode: 'cert', pd: false, c: {}, q: { crim: 'none', admCount: '0', discCount: '0', wound: 'no', captive: 'no' }, units: [], disc: [], interp: {}, periods: [per('2023-06-01', '2023-08-31', { gA: true, gB: true, gC: true }), per('2023-08-01', '2023-10-31', { gA: true, gB: true, gC: true, placeText: 'н. п. Б' })] }, 153]
];
let pass = 0, fail = 0;
for (const [name, s, expDays] of certCases) {
  const rc = c.evaluateCert(s);
  const html = c.docCert(s, rc);
  const sum = [...html.matchAll(/з (\d\d)\.(\d\d)\.(\d{4}) по (\d\d)\.(\d\d)\.(\d{4})/g)].reduce((t, m) => t + (Date.UTC(+m[6], +m[5] - 1, +m[4]) - Date.UTC(+m[3], +m[2] - 1, +m[1])) / 864e5 + 1, 0);
  if (rc.days !== expDays || sum !== expDays) { fail++; console.log('FAIL', name, rc.days, sum); } else pass++;
}
for (const [name, s, exp] of CASES) {
  const r = c.evaluate(s);
  const errs = [];
  if (exp.verdict && r.verdict !== exp.verdict) errs.push('verdict ' + r.verdict + ' != ' + exp.verdict);
  if (exp.amount !== undefined && Math.abs(r.amount - exp.amount) > 0.005) errs.push('amount ' + r.amount + ' != ' + exp.amount);
  if (exp.days !== undefined && r.days !== exp.days) errs.push('days ' + r.days + ' != ' + exp.days);
  if (exp.basis && r.basis !== exp.basis) errs.push('basis ' + r.basis + ' != ' + exp.basis);
  if (exp.failKey && !r.fails.some(f => f.key === exp.failKey)) errs.push('no fail ' + exp.failKey + ' (fails: ' + r.fails.map(f => f.key).join(',') + ')');
  if (exp.hasDoubt && !r.doubts.some(f => f.key === exp.hasDoubt)) errs.push('no doubt ' + exp.hasDoubt);
  // texts must not throw
  try { c.docChecklist(s, r); c.docConclusion(s, r); c.docOrder(s, r); c.docRefusal(s, r); c.docRequests(s, r); } catch (e) { errs.push('text error: ' + e.message); }
  if (errs.length) { fail++; console.log('FAIL', name, '|', errs.join('; '), '| missing:', r.missing.map(m => m.title).join(' / ')); }
  else pass++;
}
console.log('passed', pass, 'failed', fail);
