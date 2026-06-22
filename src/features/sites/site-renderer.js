export function buildMoreInfoHtml(site) {
  const bwImageHtml = site.flyer_image?.trim()
    ? `<img src="${site.flyer_image}" class="w-full h-auto rounded-lg mb-4 shadow-md border border-gray-200" alt="Historical view">`
    : '';

  const flyerTextHtml = site.flyer_text
    ? `<p class="text-gray-700 mb-4">${site.flyer_text}</p>`
    : '';

  const faqHtml = site.faq
    ? `
      <div class="mt-4 pt-4 border-t border-gray-200">
        <h4 class="font-bold text-gray-900 text-sm">📍 Visitor Quick Facts</h4>
        <ul class="text-sm text-gray-700">
          <li><strong>🕒 Hours:</strong> ${site.faq.opening_hours || 'Exterior view 24/7'}</li>
          <li><strong>🎟️ Fee:</strong> ${site.faq.ticket_fee || 'Free Admission'}</li>
          <li><strong>💡 Tip:</strong> ${site.faq.tips || 'Great for photography!'}</li>
        </ul>
      </div>
    `
    : '';

  return {
    hasExtraInfo: Boolean(bwImageHtml || flyerTextHtml || faqHtml),
    html: `${bwImageHtml}${flyerTextHtml}${faqHtml}`,
  };
}

export function renderQuizOptions({ container, options, onSelect }) {
  container.innerHTML = '';
  options.forEach((opt) => {
    const btn = document.createElement('button');
    btn.className =
      'w-full bg-white text-gray-800 font-bold py-3 px-4 rounded-lg border-2 border-gray-200 hover:bg-blue-50 hover:border-blue-400 transition text-center shadow-sm';
    btn.textContent = opt;
    btn.addEventListener('click', () => onSelect(opt, btn));
    container.appendChild(btn);
  });
}

export function renderSiteBasics({ elements, site }) {
  elements.label.textContent = site.id ? `${site.id}.` : '';
  elements.title.textContent = site.name;
  elements.info.textContent = site.info;
  elements.image.src = site.image || 'https://placehold.co/600x400/eee/ccc?text=Site+Image';
}
