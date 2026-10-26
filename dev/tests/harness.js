const fs = require('fs'), vm = require('vm'), path = require('path');
const src = path.join(__dirname, '..', 'src');
const ctx = { console, module: undefined };
vm.createContext(ctx);
for (const f of ['data_refs.js', 'data_phrases.js', 'data_norms.js', 'engine.js', 'texts.js']) {
  const p = path.join(src, f);
  if (fs.existsSync(p)) vm.runInContext(fs.readFileSync(p, 'utf8'), ctx, { filename: f });
}
vm.runInContext('indexData()', ctx);
module.exports = ctx;
