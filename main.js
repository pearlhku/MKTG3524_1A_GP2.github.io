// ==================== NAVIGATION ====================
const navbar = document.getElementById('navbar');
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');

if (navbar) {
  window.addEventListener('scroll', () => {
    if (window.scrollY > 30) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }, { passive: true });

  // Set initial state
  navbar.classList.toggle('scrolled', window.scrollY > 30);
}

if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => {
    navLinks.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', navLinks.classList.contains('open'));
  });

  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });
}

// ==================== CART (shared via cart-store.js / window.PUCCart) ====================
const CART_KEY = 'puc-cart';

// Use the shared PUCCart API if cart-store.js is loaded; otherwise fall back to direct localStorage
function getCart() {
  if (window.PUCCart) return window.PUCCart.read();
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch {
    return [];
  }
}

function saveCart(cart) {
  if (window.PUCCart) {
    window.PUCCart.write(cart);
    return;
  }
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  } catch {
    /* storage unavailable */
  }
}

function updateCartCount() {
  const cart = getCart();
  const total = cart.reduce((sum, item) => sum + (item.qty || 0), 0);

  // Some pages use #cartCount, the checkout page uses #cartCountNav
  const cartCountEl = document.getElementById('cartCount') || document.getElementById('cartCountNav');
  if (cartCountEl) {
    cartCountEl.textContent = total;
    cartCountEl.classList.toggle('visible', total > 0);
  }
}

function addToCart(name, price) {
  const cart = getCart();
  const existing = cart.find(item => item.name === name);
  if (existing) {
    existing.qty = (existing.qty || 0) + 1;
  } else {
    cart.push({ name, price, qty: 1 });
  }
  saveCart(cart);
  updateCartCount();
}

// Wire up Add to Cart buttons (generic .add-to-cart elements on home page)
function initAddToCartButtons() {
  document.querySelectorAll('.add-to-cart').forEach(btn => {
    btn.addEventListener('click', () => {
      const name = btn.dataset.name;
      const price = parseFloat(btn.dataset.price) || 0;
      if (!name) return;

      addToCart(name, price);

      const originalHTML = btn.innerHTML;
      btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Added';
      btn.style.background = 'var(--color-mint)';
      setTimeout(() => {
        btn.innerHTML = originalHTML;
        btn.style.background = '';
      }, 1200);
    });
  });
}

// Cart button — redirect to checkout (contact.html) if items exist
function initCartButton() {
  const cartBtn = document.getElementById('cartBtn');
  if (!cartBtn) return;

  cartBtn.addEventListener('click', () => {
    const cart = getCart();
    if (cart.length === 0) {
      // If there's a cart dialog on this page (products page), let products.js handle it
      if (document.getElementById('cartDialog')) return;
      window.location.href = 'products.html';
      return;
    }
    // If we're not already on the checkout page, go there
    if (!document.querySelector('.checkout-header')) {
      window.location.href = 'checkout.html';
    }
  });
}

// ==================== SCROLL REVEAL ====================
function initReveal() {
  const revealElements = document.querySelectorAll('.reveal');
  if (!revealElements.length || !('IntersectionObserver' in window)) {
    revealElements.forEach(el => el.classList.add('active'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -50px 0px' });

  revealElements.forEach(el => observer.observe(el));
}

// ==================== CROSS-TAB CART SYNC ====================
// Update nav count when cart changes in another tab or via PUCCart
window.addEventListener('storage', (e) => {
  if (e.key === CART_KEY) updateCartCount();
});
window.addEventListener('puc-cart-changed', updateCartCount);

// ==================== INIT ====================
document.addEventListener('DOMContentLoaded', () => {
  updateCartCount();
  initAddToCartButtons();
  initCartButton();
  initReveal();
});
