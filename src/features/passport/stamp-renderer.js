export function renderPassportStamps({
  container,
  sites,
  completedIds,
  placeholderImage = 'https://placehold.co/100x100/eee/ccc?text=?',
}) {
  if (!container) return;

  const completed = new Set((completedIds || []).map(String));
  container.innerHTML = '';

  (sites || []).forEach((site) => {
    const stamp = document.createElement('div');
    stamp.className = 'passport-stamp';

    const isCompleted = completed.has(String(site.id));
    if (!isCompleted) stamp.classList.add('grayscale');

    const img = document.createElement('img');
    img.src = site.image || placeholderImage;
    img.alt = site.name;
    stamp.appendChild(img);

    if (isCompleted) {
      requestAnimationFrame(() => img.classList.add('stamp-animate'));
    }

    const name = document.createElement('p');
    name.textContent = `${site.id}. ${site.name}`;
    stamp.appendChild(name);

    container.appendChild(stamp);
  });
}
