const { getLanguage } = require('./language');
const { normalizeText } = require('./retrieve-sites');

function verifiedValue(value) {
  const text = String(value || '').trim();
  return text && text.toLowerCase() !== 'n/a' ? text : '';
}

function faqValue(site, key) {
  return verifiedValue(site?.faq?.[key]);
}

function formatAnswer(language, type, site, value) {
  if (language === 'zh') {
    const templates = {
      built: `**${site.name}** 的建造或相关年代资料为 **${value}**。`,
      architects: `**${site.name}** 的设计者是 **${value}**。`,
      openingHours: `**${site.name}** 的开放时间：**${value}**`,
      ticketFee: `**${site.name}** 的门票或入场费用：**${value}**`,
      visitTime: `参观 **${site.name}** 建议预留约 **${value} 分钟**。`,
      tips: `**${site.name}** 参观提示：${value}`,
    };
    return templates[type];
  }

  if (language === 'ms') {
    const templates = {
      built: `**${site.name}**: rekod tarikh pembinaan/berkaitan ialah **${value}**.`,
      architects: `**${site.name}** direka oleh **${value}**.`,
      openingHours: `Waktu buka **${site.name}**: **${value}**`,
      ticketFee: `Tiket atau bayaran masuk **${site.name}**: **${value}**`,
      visitTime: `Peruntukkan kira-kira **${value} minit** untuk melawat ${site.name}.`,
      tips: `Tip untuk **${site.name}**: ${value}`,
    };
    return templates[type];
  }

  const templates = {
    built: `**${site.name}**: ${value}.`,
    architects: `**${site.name}** was designed by **${value}**.`,
    openingHours: `**${site.name}** opening hours: **${value}**`,
    ticketFee: `**${site.name}** ticket or entry fee: **${value}**`,
    visitTime: `Allow about **${value} minutes** for ${site.name}.`,
    tips: `**${site.name}** tip: ${value}`,
  };
  return templates[type];
}

function result(site, language, type, value) {
  return {
    answer: formatAnswer(language, type, site, value),
    sourceSiteIds: [site.id],
    confidence: 'high',
    notFound: false,
  };
}

function getDeterministicAnswer(question, sites) {
  if (!Array.isArray(sites) || !sites.length) return null;

  const site = sites[0];
  const query = normalizeText(question);
  const language = getLanguage(question);

  if (sites.length > 1 && (/\b(it|this|that|these|they)\b/.test(query) || /\b(ini|itu|mereka)\b/.test(query))) {
    return null;
  }

  const asksWhenBuilt =
    /\bwhen\b.*\b(built|constructed|completed|opened|founded|rebuilt)\b/.test(query)
    || /\bwhat year\b.*\b(built|constructed|completed|opened|founded|rebuilt)\b/.test(query)
    || /\b(bila|tahun)\b.*\b(dibina|dibuka|diasaskan|dibangunkan)\b/.test(query)
    || /(什么时候|什麼時候|哪一年).*(建|建成|落成|成立|重建)/.test(query);

  if (asksWhenBuilt) {
    const built = verifiedValue(site.built);
    if (built) return result(site, language, 'built', built);
  }

  const asksArchitect =
    /\b(who|which person)\b.*\b(designed|architect|designer)\b/.test(query)
    || /\b(architect|designer)\b/.test(query)
    || /\bsiapa\b.*\b(reka|direka|arkitek)\b/.test(query)
    || /\barkitek\b/.test(query)
    || /(谁|誰).*(设计|設計)|建筑师|建築師|设计者|設計者/.test(query);

  if (asksArchitect) {
    const architects = verifiedValue(site.architects);
    if (architects) return result(site, language, 'architects', architects);
  }

  const asksOpeningHours =
    /\b(open|opening|close|closing|hours)\b/.test(query)
    || /\b(waktu buka|jam buka|buka pukul)\b/.test(query)
    || /(开放时间|開放時間|营业时间|營業時間|几点开|幾點開)/.test(query);

  if (asksOpeningHours) {
    const openingHours = faqValue(site, 'openingHours');
    if (openingHours) return result(site, language, 'openingHours', openingHours);
  }

  const asksTicketFee =
    /\b(ticket|entry fee|admission|cost|price|free)\b/.test(query)
    || /\b(tiket|bayaran masuk|percuma|harga)\b/.test(query)
    || /(门票|門票|票价|票價|免费|免費|多少钱|多少錢)/.test(query);

  if (asksTicketFee) {
    const ticketFee = faqValue(site, 'ticketFee');
    if (ticketFee) return result(site, language, 'ticketFee', ticketFee);
  }

  const asksVisitTime =
    /\bhow long\b.*\b(visit|spend|explore)\b/.test(query)
    || /\bminutes?\b.*\b(visit|spend|explore)\b/.test(query)
    || /\bberapa lama\b.*\b(lawat|melawat)\b/.test(query)
    || /\bberapa minit\b/.test(query)
    || /(多久|几分钟|幾分鐘|参观.*时间|參觀.*時間)/.test(query);

  if (asksVisitTime && Number.isFinite(Number(site.estimatedVisitMinutes))) {
    return result(site, language, 'visitTime', Number(site.estimatedVisitMinutes));
  }

  const asksTip =
    /\b(tip|tips|advice|know before|should know)\b/.test(query)
    || /\b(tip|nasihat)\b/.test(query)
    || /(提示|注意事项|注意事項|建议|建議)/.test(query);

  if (asksTip) {
    const tips = faqValue(site, 'tips');
    if (tips) return result(site, language, 'tips', tips);
  }

  return null;
}

module.exports = {
  getDeterministicAnswer,
};
