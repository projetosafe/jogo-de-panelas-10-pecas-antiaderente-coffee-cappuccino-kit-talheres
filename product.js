(() => {
  const hero = document.querySelector('.e3bgiU');
  hero.src = './product-images/br-11134207-820m6-ms42s3kelced28.jpg';
  const galleryItems = [...document.querySelectorAll('.qIctnQ')].slice(1);
  const galleryCount = document.createElement('span');
  galleryCount.className = 'mobile-gallery-count';
  galleryCount.textContent = `1/${galleryItems.length}`;
  document.querySelector('.BvNoX2')?.append(galleryCount);
  document.querySelectorAll('.qIctnQ').forEach((thumbnail, index) => {
    if (!index) return;
    thumbnail.tabIndex = 0;
    thumbnail.setAttribute('role', 'button');
    thumbnail.setAttribute('aria-label', `Foto ${index} do produto`);
    const select = () => {
      const source = thumbnail.querySelector('source');
      const img = thumbnail.querySelector('img');
      const imageId = (source?.srcset || img.src).match(/br-11134207-[a-z0-9]+-[a-z0-9]+/);
      hero.src = imageId ? `./product-images/${imageId[0]}.jpg` : img.src;
      hero.alt = document.querySelector('h1').textContent;
      document.querySelectorAll('.saved-selected').forEach(el => el.classList.remove('saved-selected'));
      thumbnail.classList.add('saved-selected');
      galleryCount.textContent = `${index}/${galleryItems.length}`;
    };
    thumbnail.addEventListener('click', select);
    thumbnail.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); select(); }
    });
  });
  hero.alt = document.querySelector('h1').textContent;
  if (location.hash === '#verify') {
    setTimeout(() => {
      const ancestors = [];
      for (let el = hero; el; el = el.parentElement) ancestors.push([el.className || el.tagName, el.getBoundingClientRect().width]);
      document.body.setAttribute('data-verification', JSON.stringify({ viewport: innerWidth, width: document.documentElement.scrollWidth, image: hero.naturalWidth, ancestors }));
    }, 1000);
  }
  const quantity = document.querySelector('.shopee-input-quantity input');
  quantity.disabled = false;
  quantity.type = 'number';
  quantity.min = '1';
  quantity.max = '99';
  const clamp = value => Math.min(99, Math.max(1, Number(value) || 1));
  quantity.addEventListener('change', () => { quantity.value = clamp(quantity.value); });
  document.querySelectorAll('.shopee-input-quantity button').forEach((button, index) => {
    button.disabled = false;
    button.onclick = () => { quantity.value = clamp(Number(quantity.value) + (index ? 1 : -1)); };
  });
  const openCheckout = () => {
    const checkout = new URL('checkout.html', location.href);
    checkout.searchParams.set('quantity', clamp(quantity.value));
    location.href = checkout.href;
  };
  document.querySelectorAll('.foiX0T button').forEach(button => { button.onclick = openCheckout; });
  document.querySelectorAll('img').forEach(img => img.addEventListener('error', () => {
    if (!img.closest('.C21rQm')) img.style.visibility = 'hidden';
  }));
})();
