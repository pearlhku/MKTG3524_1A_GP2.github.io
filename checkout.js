/* ═══════════════════════════════════════════════════════════
   Pretty Useless Club — One-Page Checkout
   Cart rendering · Free-shipping progress · Validation · Totals
   Reads cart from shared puc-cart localStorage (via PUCCart API).
   ═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ──────────────────────────────
     1. STORE CONFIG
     ────────────────────────────── */
  const CURRENCY = 'HKD';
  const FREE_SHIP_THRESHOLD = 274.48;
  const FLAT_SHIPPING = 30.00;

  // Image fallback map: product id → available image path
  const PRODUCT_IMAGES = {
    tram: 'assets/tram.jpg',
    workcat: 'assets/workcat.jpg',
    snack: 'assets/snack.jpg',
    clicker: 'assets/clicker.jpg'
  };

  // Promo codes
  const PROMOS = {
    'PUC10':   { type: 'percent', value: 10, label: '10% off' },
    'MEOW20':  { type: 'percent', value: 20, label: '20% off' },
    'CLICK15': { type: 'percent', value: 15, label: '15% off' },
    'FREESHIP':{ type: 'shipping', value: 100, label: 'Free shipping' },
    'HKD50':   { type: 'fixed', value: 50, label: 'HK$50 off' }
  };

  /* ──────────────────────────────
     2. STATE — reads from shared cart localStorage
     ────────────────────────────── */
  const state = {
    items: [],
    promo: null,
    payment: 'card'
  };

  function loadCart() {
    if (window.PUCCart) return window.PUCCart.read();
    try {
      return JSON.parse(localStorage.getItem('puc-cart') || '[]');
    } catch {
      return [];
    }
  }

  function saveCart(items) {
    if (window.PUCCart) {
      window.PUCCart.write(items);
    } else {
      try {
        localStorage.setItem('puc-cart', JSON.stringify(items));
      } catch { /* storage unavailable */ }
    }
  }

  function syncStateFromStorage() {
    state.items = loadCart();
  }

  /* ──────────────────────────────
     3. HELPERS
     ────────────────────────────── */
  const $  = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.prototype.slice.call((root || document).querySelectorAll(sel));

  const money = (n) =>
    'HK$ ' + Number(n).toLocaleString('en-US', {
      minimumFractionDigits: 2, maximumFractionDigits: 2
    });

  function unitPrice(item) {
    return item.price || 0;
  }

  function lineTotal(item) {
    return unitPrice(item) * item.qty;
  }

  function subtotal() {
    return state.items.reduce((s, i) => s + lineTotal(i), 0);
  }

  function itemCount() {
    return state.items.reduce((s, i) => s + i.qty, 0);
  }

  function itemImage(item) {
    if (item.image) return item.image;
    if (item.id && PRODUCT_IMAGES[item.id]) return PRODUCT_IMAGES[item.id];
    return '';
  }

  function discountAmount(sub) {
    if (!state.promo) return 0;
    const p = PROMOS[state.promo];
    if (!p) return 0;
    if (p.type === 'percent') return sub * (p.value / 100);
    if (p.type === 'fixed') return Math.min(p.value, sub);
    return 0;
  }

  function shippingFee(sub) {
    if (sub >= FREE_SHIP_THRESHOLD) return 0;
    if (state.promo && PROMOS[state.promo] && PROMOS[state.promo].type === 'shipping') return 0;
    return FLAT_SHIPPING;
  }

  function grandTotal() {
    const sub = subtotal();
    return Math.max(0, sub - discountAmount(sub) + shippingFee(sub));
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => (
      { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    ));
  }

  /* ──────────────────────────────
     4. RENDER — CART
     ────────────────────────────── */
  function renderCart() {
    const list = $('#cartList');
    const empty = $('#cartEmpty');
    const foot = $('#cartFoot');

    syncStateFromStorage();

    if (!state.items.length) {
      list.innerHTML = '';
      list.hidden = true;
      empty.hidden = false;
      foot.hidden = true;
      $('#cartCount').textContent = '';
      const navCount = $('#cartCountNav');
      if (navCount) {
        navCount.textContent = '0';
        navCount.classList.remove('visible');
      }
      return;
    }

    list.hidden = false;
    empty.hidden = true;
    foot.hidden = false;

    const count = itemCount();
    $('#cartCount').textContent = '(' + count + ')';
    const navCount = $('#cartCountNav');
    if (navCount) {
      navCount.textContent = count;
      navCount.classList.toggle('visible', count > 0);
    }

    list.innerHTML = state.items.map((item, idx) => {
      const unit = unitPrice(item);
      const total = unit * item.qty;
      const img = itemImage(item);
      const imgHtml = img
        ? `<img src="${escapeHtml(img)}" alt="${escapeHtml(item.name)}" loading="lazy" width="92" height="92">`
        : '<span class="cart-item__placeholder" aria-hidden="true">✿</span>';

      return `
        <li class="cart-item" data-idx="${idx}">
          <div class="cart-item__media">
            ${imgHtml}
          </div>
          <div class="cart-item__body">
            <h3 class="cart-item__title">${escapeHtml(item.name)}</h3>
            <div class="cart-item__controls">
              <div class="qty">
                <button type="button" class="qty__btn" data-act="dec" data-idx="${idx}"
                        aria-label="Decrease quantity of ${escapeHtml(item.name)}"${item.qty <= 1 ? ' disabled' : ''}>−</button>
                <span class="qty__val" aria-live="polite">${item.qty}</span>
                <button type="button" class="qty__btn" data-act="inc" data-idx="${idx}"
                        aria-label="Increase quantity of ${escapeHtml(item.name)}">+</button>
              </div>
              <button type="button" class="cart-item__remove" data-act="remove" data-idx="${idx}"
                      aria-label="Remove ${escapeHtml(item.name)}">
                <svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.6 8.2a1 1 0 0 0 1 .8h3.8a1 1 0 0 0 1-.8l.6-8.2" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
                Remove
              </button>
            </div>
          </div>
          <div class="cart-item__price">
            <div class="cart-item__total">${money(total)}</div>
          </div>
        </li>`;
    }).join('');
  }

  /* ──────────────────────────────
     5. RENDER — SUMMARY SIDEBAR
     ────────────────────────────── */
  function renderSummary() {
    const list = $('#summaryItems');
    const sub = subtotal();

    list.innerHTML = state.items.map((item) => {
      const img = itemImage(item);
      const imgHtml = img
        ? `<img src="${escapeHtml(img)}" alt="" loading="lazy" width="44" height="44">`
        : '<span aria-hidden="true">✿</span>';
      return `
        <li class="summary__item">
          <div class="summary__item__img">
            ${imgHtml}
          </div>
          <div class="summary__item__body">
            <div class="summary__item__name">${escapeHtml(item.name)}</div>
            <div class="summary__item__variant">× ${item.qty}</div>
          </div>
          <div class="summary__item__price">${money(lineTotal(item))}</div>
        </li>`;
    }).join('');

    $('#sumSubtotal').textContent = money(sub);

    const ship = shippingFee(sub);
    const shipEl = $('#sumShipping');
    shipEl.textContent = ship === 0 ? 'FREE' : money(ship);
    shipEl.classList.toggle('is-free', ship === 0);

    const disc = discountAmount(sub);
    const discRow = $('#sumDiscountRow');
    if (disc > 0) {
      discRow.hidden = false;
      $('#sumDiscount').textContent = '−' + money(disc);
    } else {
      discRow.hidden = true;
    }

    const total = grandTotal();
    const totalStr = money(total);
    $('#sumTotal').textContent = totalStr;
    $('#payBtnAmount').textContent = totalStr;
  }

  /* ──────────────────────────────
     6. RENDER — FREE SHIPPING PROGRESS
     ────────────────────────────── */
  function renderShippingProgress() {
    const sub = subtotal();
    const remaining = Math.max(0, FREE_SHIP_THRESHOLD - sub);
    const pct = Math.min(100, (sub / FREE_SHIP_THRESHOLD) * 100);
    const unlocked = remaining <= 0.001;

    const wrap = $('#shipProgress');
    const fill = $('#shipFill');
    const track = $('#shipTrack');

    fill.style.width = pct + '%';
    track.setAttribute('aria-valuenow', Math.round(pct));

    const msg = $('#shipMsg');
    if (unlocked) {
      wrap.classList.add('is-unlocked');
      msg.innerHTML = '🐾 <b>Free Global Shipping Unlocked!</b>';
      $('#shipbarFill').style.width = '100%';
      $('#shipbarText').innerHTML = '🐾 <b>Free Global Shipping Unlocked!</b>';
      $('#cartHint').innerHTML = '🎉 You\'ve unlocked <b>free global shipping</b>!';
    } else {
      wrap.classList.remove('is-unlocked');
      msg.innerHTML = 'Add <b>' + money(remaining) + '</b> more for free global shipping';
      $('#shipbarFill').style.width = pct + '%';
      $('#shipbarText').innerHTML = 'Add <b>' + money(remaining) + '</b> more for free shipping';
      $('#cartHint').innerHTML = '💡 You\'re <b>' + money(remaining) + '</b> away from free shipping';
    }
  }

  function renderAll() {
    renderCart();
    renderSummary();
    renderShippingProgress();
  }

  /* ──────────────────────────────
     7. TOAST
     ────────────────────────────── */
  let toastTimer = null;
  function toast(msg, type) {
    const el = $('#toast');
    if (!el) return;
    $('#toastMsg').textContent = msg;
    $('#toastIcon').textContent = type === 'err' ? '⚠️' : '🐾';
    el.classList.toggle('is-err', type === 'err');
    el.hidden = false;
    requestAnimationFrame(() => el.classList.add('is-open'));
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      el.classList.remove('is-open');
      setTimeout(() => { el.hidden = true; }, 320);
    }, 2600);
  }

  /* ──────────────────────────────
     8. VALIDATION
     ────────────────────────────── */
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function setError(id, msg) {
    const input = $('#' + id);
    const err = $('#' + id + 'Err');
    if (!input) return;
    const field = input.closest('.field');
    if (msg) {
      field.classList.add('has-error');
      if (err) err.textContent = msg;
      input.setAttribute('aria-invalid', 'true');
    } else {
      field.classList.remove('has-error');
      if (err) err.textContent = '';
      input.removeAttribute('aria-invalid');
    }
  }

  function luhn(num) {
    const s = num.replace(/\D/g, '');
    if (s.length < 13) return false;
    let sum = 0, alt = false;
    for (let i = s.length - 1; i >= 0; i--) {
      let d = parseInt(s[i], 10);
      if (alt) { d *= 2; if (d > 9) d -= 9; }
      sum += d; alt = !alt;
    }
    return sum % 10 === 0;
  }

  function detectBrand(num) {
    const s = num.replace(/\D/g, '');
    if (/^4/.test(s)) return 'VISA';
    if (/^(5[1-5]|2[2-7])/.test(s)) return 'MC';
    if (/^3[47]/.test(s)) return 'AMEX';
    if (/^62/.test(s)) return 'UNIONPAY';
    return 'CARD';
  }

  function validateAll() {
    let firstBad = null;
    const mark = (id, msg) => {
      setError(id, msg);
      if (msg && !firstBad) firstBad = $('#' + id);
    };

    const email = $('#email').value.trim();
    if (!email) mark('email', 'Please enter your email address');
    else if (!EMAIL_RE.test(email)) mark('email', 'That email address doesn\'t look right');
    else mark('email', '');

    const country = $('#country');
    if (!country.value) mark('country', 'Please select a country / region');
    else mark('country', '');

    const fn = $('#firstName').value.trim();
    mark('firstName', fn ? '' : 'Please enter your first name');
    const ln = $('#lastName').value.trim();
    mark('lastName', ln ? '' : 'Please enter your last name');
    const a1 = $('#address1').value.trim();
    mark('address1', a1 ? '' : 'Please enter your address');
    const city = $('#city').value.trim();
    mark('city', city ? '' : 'Please enter your city');

    const opt = country.options[country.selectedIndex];
    const postalRequired = opt && opt.dataset.postal === 'required';
    const postal = $('#postal').value.trim();
    if (postalRequired && !postal) mark('postal', 'A postal code is required for this country');
    else mark('postal', '');

    if (state.payment === 'card') {
      const cn = $('#cardNumber').value.replace(/\s/g, '');
      if (!cn) mark('cardNumber', 'Please enter your card number');
      else if (!luhn(cn)) mark('cardNumber', 'That card number doesn\'t look right');
      else mark('cardNumber', '');

      const exp = $('#cardExp').value.trim();
      if (!/^\d{2}\/\d{2}$/.test(exp)) mark('cardExp', 'Use MM/YY format');
      else {
        const mm = parseInt(exp.slice(0, 2), 10);
        const yy = parseInt(exp.slice(3, 5), 10);
        const now = new Date();
        const curY = now.getFullYear() % 100;
        const curM = now.getMonth() + 1;
        if (mm < 1 || mm > 12) mark('cardExp', 'That month isn\'t valid');
        else if (yy < curY || (yy === curY && mm < curM)) mark('cardExp', 'This card has expired');
        else mark('cardExp', '');
      }

      const cvc = $('#cardCvc').value.trim();
      if (!/^\d{3,4}$/.test(cvc)) mark('cardCvc', 'Security code must be 3–4 digits');
      else mark('cardCvc', '');

      const cname = $('#cardName').value.trim();
      mark('cardName', cname ? '' : 'Please enter the name on the card');

      if (!$('#sameBilling').checked) {
        const ba = $('#billAddress1').value.trim();
        mark('billAddress1', ba ? '' : 'Please enter your billing address');
        const bc = $('#billCity').value.trim();
        mark('billCity', bc ? '' : 'Please enter your billing city');
      } else {
        mark('billAddress1', '');
        mark('billCity', '');
      }
    }

    return firstBad;
  }

  function focusBad(el) {
    if (!el) return;
    const card = el.closest('.card');
    if (card) {
      const top = card.getBoundingClientRect().top + window.scrollY - 90;
      window.scrollTo({ top, behavior: 'smooth' });
    }
    setTimeout(() => {
      el.focus({ preventScroll: true });
      el.classList.add('is-shake');
      setTimeout(() => el.classList.remove('is-shake'), 500);
    }, 380);
  }

  /* ──────────────────────────────
     9. EVENTS
     ────────────────────────────── */

  // Cart interactions (delegated)
  $('#cartList').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-act]');
    if (!btn) return;
    const idx = parseInt(btn.dataset.idx, 10);
    const act = btn.dataset.act;
    syncStateFromStorage();

    if (!state.items[idx]) return;

    if (act === 'inc') {
      state.items[idx].qty = Math.min(99, state.items[idx].qty + 1);
      saveCart(state.items);
      renderAll();
    } else if (act === 'dec') {
      if (state.items[idx].qty > 1) {
        state.items[idx].qty -= 1;
        saveCart(state.items);
        renderAll();
      }
    } else if (act === 'remove') {
      const name = state.items[idx].name;
      state.items.splice(idx, 1);
      saveCart(state.items);
      renderAll();
      toast('Removed "' + name + '"');
    }
  });

  // Promo code
  $('#promoApply').addEventListener('click', () => {
    const input = $('#promo');
    const msg = $('#promoMsg');
    const code = input.value.trim().toUpperCase();

    if (!code) {
      msg.className = 'promo__msg is-err';
      msg.textContent = 'Please enter a promo code';
      return;
    }
    if (!PROMOS[code]) {
      msg.className = 'promo__msg is-err';
      msg.textContent = 'That promo code is invalid or has expired';
      state.promo = null;
      renderSummary();
      return;
    }
    state.promo = code;
    msg.className = 'promo__msg is-ok';
    msg.textContent = 'Applied "' + code + '" — ' + PROMOS[code].label;
    input.value = '';
    renderSummary();
    toast('Promo code ' + code + ' applied 🎉');
  });

  $('#promo').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); $('#promoApply').click(); }
  });

  // Payment method switching
  $$('input[name="payment"]').forEach((radio) => {
    radio.addEventListener('change', () => {
      state.payment = radio.value;
      const cardBox = $('.payopt[data-pay="card"]');
      if (radio.value === 'card') {
        cardBox.classList.add('is-open');
        cardBox.querySelector('.payopt__body').style.display = 'block';
      } else {
        cardBox.classList.remove('is-open');
        cardBox.querySelector('.payopt__body').style.display = 'none';
        ['cardNumber', 'cardExp', 'cardCvc', 'cardName'].forEach((id) => setError(id, ''));
      }
    });
  });

  // Billing address toggle
  $('#sameBilling').addEventListener('change', () => {
    const show = !$('#sameBilling').checked;
    $('#billingFields').hidden = !show;
  });

  // Card formatting
  $('#cardNumber').addEventListener('input', (e) => {
    const el = e.target;
    const digits = el.value.replace(/\D/g, '').slice(0, 19);
    el.value = digits.replace(/(.{4})/g, '$1 ').trim();
    $('#cardBrand').textContent = detectBrand(digits);
  });

  $('#cardExp').addEventListener('input', (e) => {
    const el = e.target;
    let v = el.value.replace(/\D/g, '').slice(0, 4);
    if (v.length >= 3) v = v.slice(0, 2) + '/' + v.slice(2);
    el.value = v;
  });

  $('#cardCvc').addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/\D/g, '').slice(0, 4);
  });

  // Country → postal requirement
  $('#country').addEventListener('change', (e) => {
    const opt = e.target.options[e.target.selectedIndex];
    const required = opt && opt.dataset.postal === 'required';
    $('#postalReq').hidden = !required;
    $('#postalOpt').hidden = required;
    $('#postal').placeholder = required ? 'Required' : 'If applicable';
  });

  // Clear error as user types
  $$('.input').forEach((input) => {
    input.addEventListener('input', () => {
      const field = input.closest('.field');
      if (field && field.classList.contains('has-error')) {
        field.classList.remove('has-error');
        const err = field.querySelector('.field__err');
        if (err) err.textContent = '';
      }
    });
  });

  // Pay now
  function payNow() {
    syncStateFromStorage();
    if (!state.items.length) {
      toast('Your cart is empty — add some companions first!', 'err');
      return;
    }
    const bad = validateAll();
    if (bad) {
      focusBad(bad);
      toast('Please complete all required fields', 'err');
      return;
    }
    const total = money(grandTotal());
    const ref = 'PUC-' + String(Math.floor(100000 + Math.random() * 899999));
    $('#successRef').textContent = ref;
    $('#successText').innerHTML =
      'Your order of <b>' + total + '</b> is confirmed. We\'re packing your companions now.';
    $('#success').hidden = false;
    $('#successClose').focus();

    // Clear cart after successful payment
    saveCart([]);
  }

  $('#payBtn').addEventListener('click', payNow);
  $('#sidePayBtn').addEventListener('click', () => {
    const bad = validateAll();
    if (bad) {
      focusBad(bad);
      $('#payBtn').scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    payNow();
  });

  $('#successClose').addEventListener('click', () => {
    $('#success').hidden = true;
    renderAll();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // Scroll-spy for the step indicator
  const STEP_ORDER = ['cart', 'shipping', 'payment'];
  const STEP_ANCHORS = {
    cart: '#section-cart',
    shipping: '#section-shipping',
    payment: '#section-payment'
  };

  function spy() {
    const vh = window.innerHeight;
    const line = Math.max(120, vh * 0.45);
    let current = 'cart';

    STEP_ORDER.forEach((id) => {
      const el = $(STEP_ANCHORS[id]);
      if (el && el.getBoundingClientRect().top <= line) current = id;
    });

    if (window.scrollY + vh >= document.documentElement.scrollHeight - 8) {
      current = 'payment';
    }

    $$('.steps__item').forEach((li) => {
      const s = li.dataset.step;
      li.classList.toggle('is-active', s === current);
      li.classList.toggle('is-done', s !== current && STEP_ORDER.indexOf(s) < STEP_ORDER.indexOf(current));
    });
  }
  window.addEventListener('scroll', spy, { passive: true });

  /* ──────────────────────────────
     10. SITE NAV
     ────────────────────────────── */
  function initNav() {
    const nav = $('#navbar');
    if (nav) {
      const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 30);
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
    }

    const toggle = $('#navToggle');
    const links = $('#navLinks');
    if (toggle && links) {
      toggle.addEventListener('click', () => {
        const open = links.classList.toggle('open');
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
    }

    // Cart button in nav → scroll to cart section
    const cartBtn = $('#cartBtn');
    if (cartBtn) {
      cartBtn.addEventListener('click', () => {
        const cartSection = $('#section-cart');
        if (cartSection) {
          cartSection.scrollIntoView({ behavior: 'smooth' });
        }
      });
    }
  }

  // Listen for cart changes from other tabs
  window.addEventListener('storage', (e) => {
    if (e.key === 'puc-cart') renderAll();
  });
  window.addEventListener('puc-cart-changed', renderAll);

  /* ──────────────────────────────
     11. INIT
     ────────────────────────────── */
  function init() {
    initNav();
    renderAll();
    spy();

    $('#cardBrand').textContent = 'CARD';

    // Pre-select Hong Kong to show postal-code nuance
    $('#country').value = 'HK';
    $('#country').dispatchEvent(new Event('change'));

    // entrance animation
    setTimeout(() => {
      $$('.card').forEach((c, i) => {
        c.style.opacity = '0';
        c.style.transform = 'translateY(14px)';
        c.style.transition = 'opacity .5s ease, transform .5s cubic-bezier(.22,1,.36,1)';
        setTimeout(() => {
          c.style.opacity = '1';
          c.style.transform = 'none';
        }, 90 * i + 60);
      });
    }, 30);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
