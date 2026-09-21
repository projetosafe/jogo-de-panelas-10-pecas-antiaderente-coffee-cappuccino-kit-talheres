(() => {
  const dialog = document.getElementById('address-dialog');
  const form = document.getElementById('address-form');
  const openButton = document.getElementById('open-address');
  const number = form.elements.number;
  const noNumber = form.elements.noNumber;
  const requestedQuantity = Number(new URLSearchParams(location.search).get('quantity'));
  const orderQuantity = Number.isInteger(requestedQuantity) && requestedQuantity > 0 ? Math.min(99, requestedQuantity) : 1;
  const cents = 5990 * orderQuantity;
  const total = (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  document.getElementById('order-quantity').textContent = orderQuantity;
  ['item-subtotal', 'products-total', 'payment-total'].forEach(id => { document.getElementById(id).textContent = total; });
  document.getElementById('generate-pix').addEventListener('click', () => {
    const payload = StaticPix.build({ key: '44769766000100', name: 'Shopee Online', city: 'RIO DE JANEIRO', cents });
    const qr = qrcode(0, 'M');
    qr.addData(payload, 'Byte');
    qr.make();
    document.getElementById('pix-qr').src = qr.createDataURL(6, 24);
    document.getElementById('pix-code').value = payload;
    document.getElementById('pix-amount').textContent = total;
    document.getElementById('pix-payment').hidden = false;
    document.getElementById('pix-title').focus({ preventScroll: true });
    document.getElementById('pix-payment').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  document.getElementById('copy-pix').addEventListener('click', async () => {
    const code = document.getElementById('pix-code');
    const status = document.getElementById('pix-copy-status');
    try {
      await navigator.clipboard.writeText(code.value);
      status.textContent = 'C\u00f3digo Pix copiado.';
    } catch {
      code.focus();
      code.select();
      status.textContent = 'Selecione Copiar para copiar o c\u00f3digo destacado.';
    }
  });
  openButton.addEventListener('click', () => dialog.showModal());
  document.getElementById('cancel-address').addEventListener('click', () => dialog.close());
  noNumber.addEventListener('change', () => {
    number.disabled = noNumber.checked;
  });
  let postalCodeRequest;
  form.elements.postalCode.addEventListener('input', async event => {
    const digits = event.target.value.replace(/\D/g, '').slice(0, 8);
    event.target.value = digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
    event.target.setCustomValidity('');
    const request = Symbol('postalCodeRequest');
    postalCodeRequest = request;
    if (digits.length !== 8) return;

    try {
      const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      if (!response.ok) throw new Error('CEP indisponível');
      const address = await response.json();
      if (postalCodeRequest !== request) return;
      if (address.erro) {
        event.target.setCustomValidity('CEP não encontrado.');
        event.target.reportValidity();
        return;
      }
      form.elements.street.value = address.logradouro || '';
      form.elements.district.value = address.bairro || '';
      form.elements.city.value = [address.uf, address.localidade].filter(Boolean).join(' - ');
      form.elements.number.focus();
    } catch {
      if (postalCodeRequest !== request) return;
      event.target.setCustomValidity('Não foi possível consultar o CEP. Tente novamente.');
      event.target.reportValidity();
    }
  });
  // This static view keeps the address in memory; nothing is sent or stored.
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const value = name => form.elements[name].value.trim();
    const summary = document.getElementById('address-summary');
    const recipient = document.createElement('strong');
    recipient.textContent = [value('fullName'), value('phone')].filter(Boolean).join(' | ');
    const address = document.createElement('div');
    address.textContent = [value('street'), noNumber.checked ? 'S/N' : value('number'), value('complement'), value('district'), value('city'), value('postalCode')].filter(Boolean).join(', ');
    summary.replaceChildren(recipient, address);
    openButton.textContent = 'Trocar';
    dialog.close();
    document.getElementById('payment-step').hidden = false;
    document.body.classList.add('payment-active');
    document.title = 'Finalizar pagamento | Achadinhos Online';
    history.replaceState(null, '', '#pagamento');
    window.scrollTo(0, 0);
  });
  dialog.showModal();
})();
