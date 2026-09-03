/* SauSaWrap — shared site behavior (nav, reveal-on-scroll, FAQ, carousel) */

document.documentElement.classList.add('js-ready');

/* ---------- EmailJS config (reservation.html) ----------
   Fill these in from your EmailJS dashboard, then the reservation
   form will email both SauSaWrap and the customer automatically.
   Until they're filled in, the form falls back to a mailto: draft. */
const EMAILJS_PUBLIC_KEY = '_JzZ7MguyczisMG0u';
const EMAILJS_SERVICE_ID = 'service_yjvibr8';
const EMAILJS_BUSINESS_TEMPLATE_ID = 'template_i047pue';
const EMAILJS_CUSTOMER_TEMPLATE_ID = 'template_tcnj4bl';
const emailjsIsConfigured = EMAILJS_PUBLIC_KEY.indexOf('YOUR_') !== 0;

if (emailjsIsConfigured && typeof emailjs !== 'undefined') {
  emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
}

/* ---------- Toast notifications ---------- */
function showToast(message, type) {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    toast.innerHTML = '<span class="toast-icon"></span><span class="toast-msg"></span>';
    document.body.appendChild(toast);
  }
  toast.querySelector('.toast-icon').textContent = type === 'error' ? '!' : '✓';
  toast.querySelector('.toast-msg').textContent = message;
  toast.classList.toggle('error', type === 'error');
  toast.classList.add('show');
  clearTimeout(toast._hideTimer);
  toast._hideTimer = setTimeout(() => toast.classList.remove('show'), 5500);
}

/* ---------- Mobile nav toggle ---------- */
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');
const navOverlay = document.getElementById('navOverlay');

if (navToggle && navLinks && navOverlay) {
  const openNav = () => {
    navLinks.classList.add('open');
    navOverlay.classList.add('open');
    navToggle.classList.add('open');
    navToggle.setAttribute('aria-expanded', 'true');
    document.body.classList.add('nav-open');
  };
  const closeNav = () => {
    navLinks.classList.remove('open');
    navOverlay.classList.remove('open');
    navToggle.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('nav-open');
  };
  navToggle.addEventListener('click', () => {
    navLinks.classList.contains('open') ? closeNav() : openNav();
  });
  navOverlay.addEventListener('click', closeNav);
  navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', closeNav));
}

/* ---------- Header scroll shadow + top progress bar ---------- */
const header = document.querySelector('header');
const progressBar = document.querySelector('.scroll-progress');
const onScroll = () => {
  if (header) header.classList.toggle('scrolled', window.scrollY > 8);
  if (progressBar) {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const pct = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
    progressBar.style.width = pct + '%';
  }
};
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

/* ---------- Scroll reveal ---------- */
document.querySelectorAll('[data-reveal-group]').forEach(group => {
  Array.from(group.children).forEach((child, i) => {
    child.style.setProperty('--i', i);
    child.setAttribute('data-reveal', '');
  });
});

const revealTargets = document.querySelectorAll('[data-reveal]');
if ('IntersectionObserver' in window && revealTargets.length) {
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
  revealTargets.forEach(el => revealObserver.observe(el));
} else {
  revealTargets.forEach(el => el.classList.add('in-view'));
}

/* ---------- FAQ accordion ---------- */
document.querySelectorAll('.faq-item').forEach(item => {
  const q = item.querySelector('.faq-q');
  const a = item.querySelector('.faq-a');
  if (!q || !a) return;
  q.addEventListener('click', () => {
    const isOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item.open').forEach(o => {
      o.classList.remove('open');
      o.querySelector('.faq-a').style.maxHeight = null;
    });
    if (!isOpen) {
      item.classList.add('open');
      a.style.maxHeight = a.scrollHeight + 20 + 'px';
    }
  });
});

/* ---------- Reservation form ---------- */
const reservationForm = document.getElementById('reservationForm');
if (reservationForm) {
  const dateInput = document.getElementById('resDate');
  const timeSelect = document.getElementById('resTime');
  const slotGrid = document.getElementById('slotGrid');
  const nameInput = document.getElementById('resName');
  const phoneInput = document.getElementById('resPhone');
  const emailInput = document.getElementById('resEmail');
  const partySelect = document.getElementById('resParty');
  const statusEl = document.getElementById('resStatus');
  const submitBtn = reservationForm.querySelector('button[type="submit"]');

  const OPEN_HOUR = 8;     // store opens 8:00 AM
  const LAST_SLOT_HOUR = 19.5; // last bookable slot 7:30 PM (store closes 8:00 PM)

  const slots = [];
  for (let h = OPEN_HOUR; h <= LAST_SLOT_HOUR; h += 0.5) {
    slots.push({ hour24: Math.floor(h), min: h % 1 === 0 ? 0 : 30 });
  }

  const formatSlot = (hour24, min) => {
    const period = hour24 < 12 ? 'AM' : 'PM';
    let hour12 = hour24 % 12;
    if (hour12 === 0) hour12 = 12;
    return hour12 + ':' + String(min).padStart(2, '0') + ' ' + period;
  };

  const todayStr = () => {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  };

  dateInput.min = todayStr();
  dateInput.value = todayStr();

  const isPastSlot = (hour24, min) => {
    if (dateInput.value !== todayStr()) return false;
    const now = new Date();
    return (hour24 * 60 + min) <= (now.getHours() * 60 + now.getMinutes());
  };

  const buildTimeOptions = () => {
    const previous = timeSelect.value;
    timeSelect.innerHTML = '';
    slots.forEach(({ hour24, min }) => {
      const label = formatSlot(hour24, min);
      const opt = document.createElement('option');
      opt.value = label;
      opt.textContent = label + (isPastSlot(hour24, min) ? ' (past)' : '');
      opt.disabled = isPastSlot(hour24, min);
      timeSelect.appendChild(opt);
    });
    const stillValid = Array.from(timeSelect.options).some(o => o.value === previous && !o.disabled);
    if (stillValid) {
      timeSelect.value = previous;
    } else {
      const firstAvailable = Array.from(timeSelect.options).find(o => !o.disabled);
      if (firstAvailable) timeSelect.value = firstAvailable.value;
    }
  };

  const syncSelectedSlot = () => {
    slotGrid.querySelectorAll('.slot').forEach(btn => {
      btn.classList.toggle('selected', btn.dataset.label === timeSelect.value);
    });
  };

  const buildSlotGrid = () => {
    slotGrid.innerHTML = '';
    slots.forEach(({ hour24, min }) => {
      const label = formatSlot(hour24, min);
      const past = isPastSlot(hour24, min);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'slot';
      btn.textContent = label;
      btn.dataset.label = label;
      btn.disabled = past;
      btn.setAttribute('aria-pressed', String(label === timeSelect.value));
      btn.addEventListener('click', () => {
        timeSelect.value = label;
        syncSelectedSlot();
      });
      slotGrid.appendChild(btn);
    });
    syncSelectedSlot();
  };

  const refreshAll = () => {
    buildTimeOptions();
    buildSlotGrid();
  };

  dateInput.addEventListener('change', () => {
    if (dateInput.value < todayStr()) dateInput.value = todayStr();
    refreshAll();
  });
  timeSelect.addEventListener('change', syncSelectedSlot);

  refreshAll();

  const setStatus = (msg, isError) => {
    if (!statusEl) return;
    statusEl.textContent = msg;
    statusEl.classList.toggle('error', !!isError);
  };

  const sendViaMailto = () => {
    const partyLabel = partySelect.options[partySelect.selectedIndex].textContent;
    const subject = 'Table Reservation Request — ' + dateInput.value + ' ' + timeSelect.value;
    const body =
      'Name: ' + nameInput.value + '\n' +
      'Phone: ' + phoneInput.value + '\n' +
      'Email: ' + emailInput.value + '\n' +
      'Party size: ' + partyLabel + '\n' +
      'Date: ' + dateInput.value + '\n' +
      'Time: ' + timeSelect.value;
    window.location.href = 'mailto:sausawrap@gmail.com?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
  };

  reservationForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!reservationForm.checkValidity()) {
      reservationForm.reportValidity();
      return;
    }

    // EmailJS isn't configured yet (placeholder keys still in place) or its
    // SDK failed to load — fall back to a mailto: draft so the request
    // still goes somewhere instead of silently doing nothing.
    if (!emailjsIsConfigured || typeof emailjs === 'undefined') {
      sendViaMailto();
      showToast('Opening your email app — hit send there to submit your request.', 'success');
      return;
    }

    const partyLabel = partySelect.options[partySelect.selectedIndex].textContent;
    const params = {
      from_name: nameInput.value,
      from_phone: phoneInput.value,
      from_email: emailInput.value,
      to_name: nameInput.value,
      to_email: emailInput.value,
      party_size: partyLabel,
      res_date: dateInput.value,
      res_time: timeSelect.value
    };

    submitBtn.disabled = true;
    setStatus('Sending your request…', false);

    Promise.all([
      emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_BUSINESS_TEMPLATE_ID, params),
      emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_CUSTOMER_TEMPLATE_ID, params)
    ]).then(() => {
      setStatus('Request sent! Check ' + emailInput.value + ' for your confirmation.', false);
      showToast('Reservation request sent! Check your email for confirmation.', 'success');
      reservationForm.reset();
      dateInput.value = todayStr();
      refreshAll();
    }).catch((err) => {
      console.error('EmailJS error', err);
      setStatus('Something went wrong sending that automatically — opening your email app instead.', true);
      showToast('Could not send automatically — opening your email app instead.', 'error');
      sendViaMailto();
    }).finally(() => {
      submitBtn.disabled = false;
    });
  });
}

/* ---------- Promo carousel ---------- */
const viewport = document.querySelector('.promo-carousel-viewport');
const track = document.querySelector('.promo-carousel-track');

if (viewport && track && track.children.length) {
  track.style.position = 'relative'; // fixes offsetLeft as a stable reference frame
  const realSlides = Array.from(track.children); // the actual promo slides, before cloning
  const nextButton = document.querySelector('.carousel-btn.next');
  const prevButton = document.querySelector('.carousel-btn.prev');
  const dotsNav = document.querySelector('.carousel-dots');
  let currentIndex = 0;
  let autoPlayInterval;
  let isAnimating = false;

  // One dot per real slide (clones don't get their own dot)
  realSlides.forEach((slide, index) => {
    const dot = document.createElement('button');
    dot.classList.add('carousel-dot');
    dot.setAttribute('aria-label', 'Go to slide ' + (index + 1));
    dot.addEventListener('click', () => { setActive(index); resetAutoPlay(); });
    dotsNav.appendChild(dot);
  });
  const dots = Array.from(dotsNav.children);

  // Clone the last slide to the front and the first slide to the back, so
  // sliding past either end lands on a "clone" that looks identical, then
  // silently snaps onto the real slide behind it for a seamless loop.
  const leadClone = realSlides[realSlides.length - 1].cloneNode(true);
  const tailClone = realSlides[0].cloneNode(true);
  [leadClone, tailClone].forEach(clone => {
    clone.classList.add('clone-slide');
    clone.setAttribute('aria-hidden', 'true');
    clone.setAttribute('tabindex', '-1');
  });
  track.insertBefore(leadClone, track.firstChild);
  track.appendChild(tailClone);

  const highlight = (index) => {
    realSlides.forEach((slide, i) => slide.classList.toggle('active', i === index));
    leadClone.classList.toggle('active', index === realSlides.length - 1);
    tailClone.classList.toggle('active', index === 0);
    dots.forEach((dot, i) => dot.classList.toggle('active', i === index));
  };

  // Physically slides the track so `el`'s center lands on the viewport's center.
  const centerOn = (el, animate = true) => {
    const target = el.offsetLeft + el.offsetWidth / 2 - viewport.clientWidth / 2;
    track.style.transition = animate ? '' : 'none';
    track.style.transform = 'translateX(' + (-target) + 'px)';
    if (!animate) {
      void track.offsetHeight; // force reflow so the "none" transition actually applies
      track.style.transition = '';
    }
  };

  const afterTransition = (cb) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      track.removeEventListener('transitionend', handler);
      cb();
    };
    const handler = (e) => { if (e.target === track && e.propertyName === 'transform') finish(); };
    track.addEventListener('transitionend', handler);
    setTimeout(finish, 600); // safety fallback
  };

  const setActive = (index, animate = true) => {
    currentIndex = (index + realSlides.length) % realSlides.length;
    highlight(currentIndex);
    centerOn(realSlides[currentIndex], animate);
  };

  realSlides.forEach((slide, index) => {
    slide.addEventListener('click', () => { setActive(index); resetAutoPlay(); });
  });
  leadClone.addEventListener('click', () => { prevSlide(); resetAutoPlay(); });
  tailClone.addEventListener('click', () => { nextSlide(); resetAutoPlay(); });

  const nextSlide = () => {
    if (isAnimating) return;
    if (currentIndex === realSlides.length - 1) {
      isAnimating = true;
      highlight(0);
      centerOn(tailClone, true);
      afterTransition(() => {
        currentIndex = 0;
        centerOn(realSlides[0], false);
        isAnimating = false;
      });
    } else {
      setActive(currentIndex + 1);
    }
  };

  const prevSlide = () => {
    if (isAnimating) return;
    if (currentIndex === 0) {
      isAnimating = true;
      highlight(realSlides.length - 1);
      centerOn(leadClone, true);
      afterTransition(() => {
        currentIndex = realSlides.length - 1;
        centerOn(realSlides[currentIndex], false);
        isAnimating = false;
      });
    } else {
      setActive(currentIndex - 1);
    }
  };

  const startAutoPlay = () => {
    autoPlayInterval = setInterval(nextSlide, 5000); // 5 seconds
  };

  const resetAutoPlay = () => {
    clearInterval(autoPlayInterval);
    startAutoPlay();
  };

  if (nextButton) nextButton.addEventListener('click', () => { nextSlide(); resetAutoPlay(); });
  if (prevButton) prevButton.addEventListener('click', () => { prevSlide(); resetAutoPlay(); });

  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => centerOn(realSlides[currentIndex], false), 150);
  });

  setActive(0, false); // set initial state without animating
  startAutoPlay();
}

/* ---------- Photo lightbox (menu + gallery) ---------- */
const lightboxItems = [];

const registerPhoto = (el, src, caption, group) => {
  if (!src) return;
  const item = { el, src, caption, group, index: lightboxItems.length };
  lightboxItems.push(item);
  el.classList.add('zoomable');
  el.setAttribute('role', 'button');
  el.setAttribute('tabindex', '0');
  el.setAttribute('aria-label', 'View ' + caption + ' larger');
  el.addEventListener('click', () => openLightbox(item));
  el.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openLightbox(item);
    }
  });
};

// Gallery tiles: the whole tile opens, captioned by its label.
document.querySelectorAll('.g-tile.has-photo').forEach(tile => {
  const img = tile.querySelector('img');
  const label = tile.querySelector('.label');
  const grid = tile.closest('.gallery-grid');
  registerPhoto(tile, img && img.getAttribute('src'), label ? label.textContent.trim() : 'photo', grid);
});

// Menu tickets: the photo opens, captioned by the item name and price.
document.querySelectorAll('.ticket .ticket-photo').forEach(photo => {
  const ticket = photo.closest('.ticket');
  const name = ticket.querySelector('h3');
  const price = ticket.querySelector('.price');
  const caption = (name ? name.textContent.trim() : 'Menu item') + (price ? ' · ' + price.textContent.trim() : '');
  registerPhoto(photo, photo.getAttribute('src'), caption, photo.closest('.menu-grid'));
});

const menuHero = document.querySelector('.menu-hero');
if (menuHero) registerPhoto(menuHero, menuHero.getAttribute('src'), 'The three signature wraps', menuHero);

if (lightboxItems.length) {
  const box = document.createElement('div');
  box.className = 'lightbox';
  box.setAttribute('role', 'dialog');
  box.setAttribute('aria-modal', 'true');
  box.setAttribute('aria-label', 'Photo viewer');
  box.innerHTML =
    '<button class="lb-btn lb-close" type="button" aria-label="Close">&times;</button>' +
    '<button class="lb-btn lb-nav lb-prev" type="button" aria-label="Previous photo">&#8249;</button>' +
    '<button class="lb-btn lb-nav lb-next" type="button" aria-label="Next photo">&#8250;</button>' +
    '<figure class="lb-figure"><img class="lb-img" alt=""><figcaption class="lb-cap">' +
    '<span class="lb-cap-text"></span><span class="lb-count"></span></figcaption></figure>';
  document.body.appendChild(box);

  const lbImg = box.querySelector('.lb-img');
  const lbCapText = box.querySelector('.lb-cap-text');
  const lbCount = box.querySelector('.lb-count');
  const lbFigure = box.querySelector('.lb-figure');
  let current = null;
  let lastFocused = null;

  // Arrows step through the photos sharing a group (one grid / one section).
  const siblings = (item) => lightboxItems.filter(o => o.group === item.group);

  const show = (item, direction) => {
    current = item;
    const set = siblings(item);
    const pos = set.indexOf(item);
    lbImg.src = item.src;
    lbImg.alt = item.caption;
    lbCapText.textContent = item.caption;
    lbCount.textContent = set.length > 1 ? (pos + 1) + ' / ' + set.length : '';
    box.classList.toggle('solo', set.length < 2);
    lbFigure.classList.remove('pop', 'from-left', 'from-right');
    void lbFigure.offsetWidth; // restart the entrance animation
    lbFigure.classList.add(direction === 'prev' ? 'from-left' : direction === 'next' ? 'from-right' : 'pop');
  };

  const step = (delta) => {
    if (!current) return;
    const set = siblings(current);
    const next = set[(set.indexOf(current) + delta + set.length) % set.length];
    show(next, delta > 0 ? 'next' : 'prev');
  };

  window.openLightbox = (item) => {
    lastFocused = document.activeElement;
    show(item);
    box.classList.add('open');
    document.body.classList.add('lb-open'); // lock page scroll behind the viewer
    box.querySelector('.lb-close').focus();
  };

  const closeLightbox = () => {
    box.classList.remove('open');
    document.body.classList.remove('lb-open');
    current = null;
    if (lastFocused) lastFocused.focus();
  };

  box.querySelector('.lb-close').addEventListener('click', closeLightbox);
  box.querySelector('.lb-prev').addEventListener('click', () => step(-1));
  box.querySelector('.lb-next').addEventListener('click', () => step(1));
  box.addEventListener('click', (e) => { if (e.target === box) closeLightbox(); });

  document.addEventListener('keydown', (e) => {
    if (!box.classList.contains('open')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') step(-1);
    if (e.key === 'ArrowRight') step(1);
  });

  // Swipe left/right on touch.
  let touchX = null;
  box.addEventListener('touchstart', (e) => { touchX = e.changedTouches[0].clientX; }, { passive: true });
  box.addEventListener('touchend', (e) => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
    touchX = null;
  }, { passive: true });
}

/* ---------- Homepage intro animation ---------- */
const heroPhoto = document.querySelector('.hero-art .hero-photo');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let introAlreadyPlayed = false;
try { introAlreadyPlayed = sessionStorage.getItem('sw-intro-played') === '1'; } catch (e) {}

if (heroPhoto && !introAlreadyPlayed && !prefersReducedMotion) {
  const veil = document.createElement('div');
  veil.className = 'intro-veil';
  veil.setAttribute('aria-hidden', 'true');
  veil.innerHTML = '<div class="intro-shadow"></div><div class="intro-plate"><img src="' +
    heroPhoto.getAttribute('src') + '" alt=""></div>';
  document.body.appendChild(veil);
  document.body.classList.add('intro-lock');

  let ended = false;
  const endIntro = () => {
    if (ended) return;
    ended = true;
    veil.remove();
    document.body.classList.remove('intro-lock');
    try { sessionStorage.setItem('sw-intro-played', '1'); } catch (e) {}
    ['click', 'keydown', 'wheel', 'touchstart'].forEach(ev =>
      window.removeEventListener(ev, endIntro));
  };

  // Skip on any interaction, and always clear it once the roll-off finishes.
  ['click', 'keydown', 'wheel', 'touchstart'].forEach(ev =>
    window.addEventListener(ev, endIntro, { passive: true }));
  veil.addEventListener('animationend', (e) => {
    if (e.animationName === 'intro-veil-out') endIntro();
  });
  setTimeout(endIntro, 3000); // safety net if the animation never fires
}
