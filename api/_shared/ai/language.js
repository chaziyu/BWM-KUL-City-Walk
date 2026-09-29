const MALAY_HINTS = new Set([
  'apa', 'apakah', 'arkitek', 'awak', 'anda', 'berapa', 'bila', 'boleh', 'dalam', 'dan', 'dekat',
  'dibina', 'direka', 'harga', 'ini', 'itu', 'jam', 'lawat', 'melawat', 'mana', 'masuk', 'pukul',
  'percuma', 'siapa', 'tentang', 'tiket', 'untuk', 'waktu', 'yang',
]);

function getLanguage(text) {
  const value = String(text || '');
  if (/[\u3400-\u9fff]/.test(value)) return 'zh';

  const tokens = value
    .toLowerCase()
    .replace(/[^a-z]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  let hits = 0;
  for (const token of tokens) {
    if (MALAY_HINTS.has(token)) hits += 1;
  }

  return hits >= 2 ? 'ms' : 'en';
}

module.exports = {
  getLanguage,
};
