const form = document.querySelector('#search-form');
const specialtyInput = document.querySelector('#specialty-input');
const resultsTitle = document.querySelector('#results-title');
const resultCount = document.querySelector('#result-count');
const resultNoun = document.querySelector('#result-noun');
const mapCount = document.querySelector('#map-count');
const sortSelect = document.querySelector('#sort-providers');
const providerList = document.querySelector('#provider-list');
const loadMore = document.querySelector('.load-more');
const collapseResults = document.querySelector('#collapse-results');
const emptyMessage = document.querySelector('#empty-message');
const filterToggle = document.querySelector('#filter-toggle');
const filters = document.querySelector('#filters');
const clearFilters = document.querySelector('#clear-filters');
const resetResults = document.querySelector('#reset-results');
const emptyState = document.querySelector('#empty-state');
const cards = [...document.querySelectorAll('#provider-list .provider-card')];
const mapPanel = document.querySelector('#map-panel');
const listView = document.querySelector('#list-view');
const mapView = document.querySelector('#map-view');
const providerDialog = document.querySelector('#provider-dialog');
const bookingDialog = document.querySelector('#booking-dialog');
const toast = document.querySelector('#toast');

const PAGE_SIZE = 3;
let shown = PAGE_SIZE;

/* Specialty labels mix agent nouns ("Chiropractor"), already-plural phrases
   ("Imaging centers") and mass nouns ("Physical therapy"). Bolting on an "s"
   produced "physical therapys", so build the head noun first and inflect that. */
function specialtyNoun(term, count) {
  const word = term.trim().toLowerCase();
  let phrase;
  if (!word) phrase = 'provider';
  else if (/(or|er|ist|ian)$/.test(word)) phrase = word;
  else if (word.endsWith('s')) phrase = word.replace(/s$/, '');
  else phrase = `${word} provider`;
  return count === 1 ? phrase : `${phrase}s`;
}

function updateHeading(count) {
  /* Only the noun is rewritten. The previous version replaced the whole
     heading's innerHTML, which detached #result-count and froze the number. */
  resultNoun.textContent = specialtyNoun(specialtyInput.value, count);
}

const distanceLimit = () => {
  const picked = document.querySelector('input[name="distance"]:checked');
  return !picked || picked.value === 'any' ? Infinity : Number(picked.value);
};
const ratingFloor = () => {
  const picked = document.querySelector('input[name="rating"]:checked');
  return picked ? Number(picked.value) : 0;
};

function sortMatches(matches) {
  const mode = sortSelect ? sortSelect.value : 'recommended';
  const ordered = [...matches];
  if (mode === 'rating') ordered.sort((a, b) => Number(b.dataset.rating) - Number(a.dataset.rating));
  else if (mode === 'distance') ordered.sort((a, b) => Number(a.dataset.distance) - Number(b.dataset.distance));
  else ordered.sort((a, b) => cards.indexOf(a) - cards.indexOf(b));
  ordered.forEach((card) => providerList.insertBefore(card, emptyState));
  return ordered;
}

/* Availability counts used to be hardcoded ("8", "12") and drifted from the
   list. Derive them from the cards that pass every *other* active filter. */
function refreshTagCounts() {
  const maxDistance = distanceLimit();
  const minRating = ratingFloor();
  const specialty = specialtyInput.value.trim().toLowerCase();
  document.querySelectorAll('[data-count-for]').forEach((badge) => {
    const tag = badge.dataset.countFor;
    badge.textContent = cards.filter((card) => card.dataset.tags.split(' ').includes(tag)
      && Number(card.dataset.distance) <= maxDistance
      && Number(card.dataset.rating) >= minRating
      && (!specialty || card.dataset.specialty === specialty)).length;
  });
}

function applyFilters({ resetPage = true } = {}) {
  if (resetPage) shown = PAGE_SIZE;
  const tags = [...document.querySelectorAll('.filter-check:checked')].map((input) => input.value);
  const maxDistance = distanceLimit();
  const minRating = ratingFloor();
  const specialty = specialtyInput.value.trim().toLowerCase();

  const matches = cards.filter((card) => tags.every((tag) => card.dataset.tags.split(' ').includes(tag))
    && Number(card.dataset.distance) <= maxDistance
    && Number(card.dataset.rating) >= minRating
    && (!specialty || card.dataset.specialty === specialty));

  const ordered = sortMatches(matches);
  cards.forEach((card) => { card.hidden = true; });
  ordered.slice(0, shown).forEach((card) => { card.hidden = false; });

  resultCount.textContent = matches.length;
  updateHeading(matches.length);
  /* "No providers match these filters" is wrong when the category simply has
     no clinics listed yet — say which case the user is actually in. */
  if (matches.length === 0 && emptyMessage) {
    const noneInSpecialty = specialty && !cards.some((card) => card.dataset.specialty === specialty);
    emptyMessage.textContent = noneInSpecialty
      ? `No ${specialty} providers are listed in this area yet. Try another category, or `
      : 'No providers match these filters. ';
  }
  if (mapCount) mapCount.textContent = matches.length;
  emptyState.hidden = matches.length !== 0;
  loadMore.hidden = matches.length <= shown;
  if (collapseResults) collapseResults.hidden = shown <= PAGE_SIZE || matches.length <= PAGE_SIZE;
  loadMore.textContent = '';
  const remaining = Math.min(PAGE_SIZE, matches.length - shown);
  loadMore.append(`Show ${remaining} more ${remaining === 1 ? 'provider' : 'providers'} `);
  const arrow = document.createElement('span');
  arrow.textContent = '\u2193';
  loadMore.append(arrow);
  refreshTagCounts();
  document.dispatchEvent(new CustomEvent('results:change', { detail: { matches: ordered } }));
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  applyFilters();
  form.classList.add('is-searching');
  setTimeout(() => form.classList.remove('is-searching'), 600);
  /* Searching used to jump to the Medical providers page, which threw away the
     results it had just filtered and showed a different, unfiltered list. Stay
     put and take the user down to their results. */
  if (window.location.hash && window.location.hash !== '#home') window.location.hash = '#home';
  requestAnimationFrame(() => {
    document.querySelector('#providers')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

document.querySelectorAll('.filter-check').forEach((input) => input.addEventListener('change', () => applyFilters()));
document.querySelectorAll('input[name="distance"], input[name="rating"]').forEach((input) => input.addEventListener('change', () => applyFilters()));
if (sortSelect) sortSelect.addEventListener('change', () => applyFilters());
loadMore.addEventListener('click', () => {
  shown += PAGE_SIZE;
  applyFilters({ resetPage: false });
});
collapseResults?.addEventListener('click', () => {
  shown = PAGE_SIZE;
  applyFilters({ resetPage: false });
  /* Collapsing from the bottom of a long list would otherwise leave the user
     staring at whatever is now below the list. */
  providerList.scrollIntoView({ behavior: 'smooth', block: 'start' });
});
filterToggle.addEventListener('click', () => filters.classList.toggle('open'));
clearFilters.addEventListener('click', () => {
  document.querySelectorAll('.filter-check').forEach((input) => { input.checked = false; });
  const anyDistance = document.querySelector('input[name="distance"][value="any"]');
  const anyRating = document.querySelector('input[name="rating"][value="0"]');
  if (anyDistance) anyDistance.checked = true;
  if (anyRating) anyRating.checked = true;
  applyFilters();
});
resetResults.addEventListener('click', () => clearFilters.click());
document.querySelectorAll('.save-button').forEach((button) => button.addEventListener('click', () => {
  button.classList.toggle('saved');
  button.textContent = button.classList.contains('saved') ? '\u2665' : '\u2661';
  button.setAttribute('aria-pressed', button.classList.contains('saved'));
}));
document.querySelectorAll('.popular-searches button').forEach((button) => button.addEventListener('click', () => {
  const label = button.textContent.trim().toLowerCase();
  const option = [...specialtyInput.options].find((item) => item.textContent.trim().toLowerCase() === label);
  specialtyInput.value = option ? option.value : '';
  specialtyInput.dispatchEvent(new Event('change'));
  form.dispatchEvent(new Event('submit'));
}));

function setView(view) {
  const showMap = view === 'map';
  mapPanel.classList.toggle('visible', showMap);
  listView.classList.toggle('active', !showMap);
  mapView.classList.toggle('active', showMap);
}

listView.addEventListener('click', () => setView('list'));
mapView.addEventListener('click', () => setView('map'));
document.querySelectorAll('.map-pin').forEach((pin) => pin.addEventListener('click', () => {
  document.querySelectorAll('.map-pin').forEach((item) => item.classList.remove('active'));
  pin.classList.add('active');
}));
document.querySelectorAll('.view-button').forEach((button) => button.addEventListener('click', () => {
  const card = button.closest('.provider-card');
  document.querySelector('#dialog-provider-name').textContent = card.dataset.name;
  providerDialog.showModal();
}));
document.querySelectorAll('.dialog-close').forEach((button) => button.addEventListener('click', () => button.closest('dialog').close()));
document.querySelector('#book-button').addEventListener('click', () => { providerDialog.close(); bookingDialog.showModal(); });
document.querySelector('#submit-booking').addEventListener('click', () => { bookingDialog.close(); toast.classList.add('show'); setTimeout(() => toast.classList.remove('show'), 3200); });
document.querySelector('#appointment-button').addEventListener('click', () => bookingDialog.showModal());
document.addEventListener('click', (event) => {
  const link = event.target.closest('a[href="#contact-us"], a[href="#providers"]');
  if (!link) return;
  event.preventDefault();
  if (link.getAttribute('href') === '#contact-us') {
    bookingDialog.showModal();
    return;
  }
  window.location.hash = 'medical-providers';
});
/* .account-button is wired in the auth block at the end of this file. */
document.querySelectorAll('.account-action').forEach((button) => button.addEventListener('click', () => { toast.textContent = `${button.textContent.replace(' →', '')} is ready for the full account flow.`; toast.classList.add('show'); setTimeout(() => toast.classList.remove('show'), 3200); }));
document.querySelectorAll('.language-button').forEach((button) => button.addEventListener('click', () => {
  document.querySelectorAll('.language-button').forEach((item) => item.classList.remove('active'));
  button.classList.add('active');
  toast.textContent = `Language set to ${button.textContent}.`;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2200);
}));
const specialtyCopy = {
  'Chiropractic care': 'Support for mobility, spine health, sports injuries, and collision recovery.',
  'Physical therapy': 'Movement-focused care to rebuild strength, confidence, and everyday function.',
  'Imaging centers': 'Diagnostic support that helps qualified professionals understand your injury.',
  'Pain management': 'Personalized plans designed to help you understand and manage persistent pain.',
  Orthopedics: 'Bone, joint, and muscle specialists for evaluation, treatment, and recovery.',
  'More specialties': 'Browse the wider provider network and find the kind of care that fits your needs.'
};
document.querySelectorAll('.specialty-link').forEach((link) => link.addEventListener('click', (event) => {
  event.preventDefault();
  const specialty = link.dataset.specialty;
  document.querySelector('#specialty-name').textContent = specialty;
  document.querySelector('#specialty-copy').textContent = specialtyCopy[specialty];
  document.querySelector('#specialty-detail').hidden = false;
  document.querySelectorAll('.specialty-link').forEach((item) => item.classList.toggle('selected', item === link));
}));
const medicalSearch = document.querySelector('#medical-search');
function openMedicalSearchFor(term) {
  document.querySelector('#medical-specialty').value = term;
  if (window.location.hash !== '#medical-providers') {
    window.location.hash = 'medical-providers';
    setTimeout(() => revealMedicalSearch(), 80);
  } else {
    revealMedicalSearch();
  }
}
function revealMedicalSearch() {
  medicalSearch.hidden = false;
  medicalSearch.classList.remove('is-entering');
  void medicalSearch.offsetWidth;
  medicalSearch.classList.add('is-entering');
  medicalSearch.scrollIntoView({ behavior: 'smooth', block: 'center' });
}
specialtyInput.addEventListener('change', () => applyFilters());
document.querySelectorAll('.medical-search-trigger').forEach((button) => button.addEventListener('click', () => {
  document.querySelector('#provider-directory-panel').hidden = false;
  document.querySelector('#provider-directory-panel').scrollIntoView({ behavior: 'smooth', block: 'start' });
}));
document.querySelector('.medical-search-close').addEventListener('click', () => {
  medicalSearch.hidden = true;
  document.querySelector('#medical-providers').scrollIntoView({ behavior: 'smooth', block: 'start' });
});
document.querySelector('#medical-search-form').addEventListener('submit', (event) => {
  event.preventDefault();
  toast.textContent = `Showing providers for ${document.querySelector('#medical-specialty').value.trim() || 'all specialties'}.`;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2400);
});
/* Topic chips used to only relabel a heading. They now filter, and they stay
   in sync with the search box rather than fighting it. */
const faqSearchInput = document.querySelector('#faq-search');
let faqTopic = 'all';

function applyFaqFilter() {
  const query = (faqSearchInput ? faqSearchInput.value : '').toLowerCase().trim();
  let matches = 0;
  document.querySelectorAll('.faq-page-list details').forEach((item) => {
    const onTopic = faqTopic === 'all' || item.dataset.topic === faqTopic;
    const onQuery = !query || item.dataset.faq.includes(query) || item.textContent.toLowerCase().includes(query);
    const visible = onTopic && onQuery;
    item.hidden = !visible;
    if (visible) matches += 1;
  });
  /* Hide a group heading once every question under it is filtered out. */
  document.querySelectorAll('.faq-group').forEach((group) => {
    group.hidden = ![...group.querySelectorAll('details')].some((item) => !item.hidden);
  });
  document.querySelector('#faq-empty').hidden = matches !== 0;
}

document.querySelectorAll('.faq-topic').forEach((topic) => topic.addEventListener('click', () => {
  document.querySelectorAll('.faq-topic').forEach((item) => item.classList.remove('active'));
  topic.classList.add('active');
  faqTopic = topic.dataset.topic || 'all';
  applyFaqFilter();
}));
if (faqSearchInput) faqSearchInput.addEventListener('input', applyFaqFilter);
document.querySelector('#faq-support-button').addEventListener('click', () => bookingDialog.showModal());

const pageViews = [...document.querySelectorAll('.page-view')];
const homeMain = document.querySelector('main');
const providerDirectory = document.querySelector('#provider-directory-panel');
function showRoute() {
  const route = window.location.hash.slice(1) || 'home';
  const page = pageViews.find((view) => view.dataset.page === route);
  pageViews.forEach((view) => view.classList.toggle('active', view === page));
  providerDirectory.hidden = route !== 'medical-providers';
  homeMain.style.display = page ? 'none' : '';
  document.querySelectorAll('.main-nav a').forEach((link) => link.classList.toggle('active', link.getAttribute('href') === `#${route}`));
  if (page) requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'auto' }));
  else if (route !== 'home') document.querySelector(`#${route}`)?.scrollIntoView({ behavior: 'smooth' });
}
window.addEventListener('hashchange', showRoute);
/* A cold load with a route hash lets the browser jump to the anchor, which
   scrolls the header off screen. Pin routed pages back to the top. */
window.addEventListener('load', () => {
  if (document.querySelector('.page-view.active')) window.scrollTo(0, 0);
});

document.querySelector('#directory-specialty').addEventListener('change', (event) => {
  toast.textContent = `Showing ${event.target.value} providers.`;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2200);
});
document.querySelectorAll('.directory-profile').forEach((button) => button.addEventListener('click', () => {
  document.querySelector('#dialog-provider-name').textContent = button.closest('article').querySelector('h3').textContent;
  providerDialog.showModal();
}));
document.querySelectorAll('.directory-filter').forEach((button) => button.addEventListener('click', () => {
  document.querySelectorAll('.directory-filter').forEach((item) => item.classList.remove('active'));
  button.classList.add('active');
  const filter = button.dataset.filter;
  const cards = [...document.querySelectorAll('.directory-results .provider-card')];
  let visible = 0;
  cards.forEach((card) => {
    const matches = filter === 'all' || card.dataset.directoryTags.includes(filter);
    card.hidden = !matches;
    if (matches) visible += 1;
  });
  document.querySelector('.directory-empty').hidden = visible !== 0;
}));
const specialtyKeywords = {
  chiropractor: 'chiropract',
  'physical therapy': 'rehab',
  'imaging centers': 'imaging',
  'pain management': 'pain',
  orthopedics: 'orthoped',
};
document.querySelector('#directory-specialty').addEventListener('change', (event) => {
  const isAll = event.target.value === 'All providers';
  const keyword = specialtyKeywords[event.target.value.toLowerCase()] || event.target.value.toLowerCase();
  document.querySelectorAll('.directory-results .provider-card').forEach((card) => { card.hidden = !isAll && !card.textContent.toLowerCase().includes(keyword); });
});

document.querySelector('#provider-search-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const specialty = document.querySelector('#provider-search-specialty').value.trim();
  const location = document.querySelector('#provider-search-location').value.trim();
  const directorySelect = document.querySelector('#directory-specialty');
  const match = [...directorySelect.options].find((option) => option.textContent.toLowerCase().includes(specialty.toLowerCase()));
  directorySelect.value = specialty && match ? match.value : 'All providers';
  document.querySelectorAll('.directory-filter').forEach((item) => item.classList.toggle('active', item.dataset.filter === 'all'));
  document.querySelector('#provider-directory-panel').hidden = false;
  directorySelect.dispatchEvent(new Event('change'));
  const visible = document.querySelectorAll('.directory-results .provider-card:not([hidden])').length;
  document.querySelector('.directory-empty').hidden = visible !== 0;
  toast.textContent = `Showing ${directorySelect.value.toLowerCase()} providers near ${location || 'your area'}.`;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2400);
  document.querySelector('#provider-directory-panel').scrollIntoView({ behavior: 'smooth', block: 'start' });
});
/* Replace native select popups with a styled, scrollable listbox. The original
   select stays in the DOM and in sync, so existing value/change code keeps working. */
(() => {
  let open = null;
  let seq = 0;

  const enhance = (select) => {
    const id = `cs-${seq += 1}`;
    const wrap = document.createElement('div');
    wrap.className = 'cs';
    select.parentNode.insertBefore(wrap, select);
    wrap.appendChild(select);
    select.classList.add('cs-native');
    select.tabIndex = -1;
    select.setAttribute('aria-hidden', 'true');
    wrap.parentElement.querySelectorAll(':scope > span[aria-hidden="true"]').forEach((span) => { span.hidden = true; });

    const button = document.createElement('button');
    button.type = 'button';
    button.id = `${id}-button`;
    button.className = 'cs-button';
    button.setAttribute('aria-haspopup', 'listbox');
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-controls', `${id}-panel`);
    if (select.getAttribute('aria-label')) button.setAttribute('aria-label', select.getAttribute('aria-label'));
    const value = document.createElement('span');
    value.className = 'cs-value';
    const caret = document.createElement('span');
    caret.className = 'cs-caret';
    caret.setAttribute('aria-hidden', 'true');
    caret.textContent = '⌄';
    button.append(value, caret);

    const panel = document.createElement('ul');
    panel.id = `${id}-panel`;
    panel.className = 'cs-panel';
    panel.setAttribute('role', 'listbox');
    panel.hidden = true;
    const options = [...select.options].map((option, index) => {
      const item = document.createElement('li');
      item.id = `${id}-option-${index}`;
      item.className = 'cs-option';
      item.setAttribute('role', 'option');
      item.dataset.index = String(index);
      const check = document.createElement('span');
      check.className = 'cs-check';
      check.setAttribute('aria-hidden', 'true');
      check.textContent = '✓';
      const text = document.createElement('span');
      text.textContent = option.textContent;
      item.append(check, text);
      panel.appendChild(item);
      return item;
    });
    wrap.append(button, panel);

    if (select.id) {
      const label = document.querySelector(`label[for="${select.id}"]`);
      if (label) label.setAttribute('for', button.id);
    }

    let active = select.selectedIndex;

    const paint = () => {
      const current = select.options[select.selectedIndex];
      value.textContent = current ? current.textContent : '';
      value.classList.toggle('is-placeholder', Boolean(current) && current.value === '');
      options.forEach((item, index) => {
        item.setAttribute('aria-selected', String(index === select.selectedIndex));
        item.classList.toggle('is-active', index === active);
      });
    };

    const setActive = (index) => {
      active = Math.max(0, Math.min(options.length - 1, index));
      button.setAttribute('aria-activedescendant', options[active].id);
      paint();
      options[active].scrollIntoView({ block: 'nearest' });
    };

    let lifted = [];

    const close = (focus) => {
      if (panel.hidden) return;
      panel.hidden = true;
      lifted.forEach((node) => node.classList.remove('cs-lift'));
      lifted = [];
      wrap.classList.remove('is-open', 'is-up');
      button.setAttribute('aria-expanded', 'false');
      button.removeAttribute('aria-activedescendant');
      open = null;
      if (focus) button.focus();
    };

    const show = () => {
      if (open && open !== close) open(false);
      panel.hidden = false;
      /* Sibling sections create stacking contexts (filling page-in animations),
         so lift this menu's ancestors while it is open. */
      for (let node = wrap.parentElement; node && node !== document.body; node = node.parentElement) {
        node.classList.add('cs-lift');
        lifted.push(node);
      }
      wrap.classList.add('is-open');
      button.setAttribute('aria-expanded', 'true');
      open = close;
      const box = button.getBoundingClientRect();
      const height = panel.offsetHeight;
      wrap.classList.toggle('is-up', box.bottom + height + 16 > window.innerHeight && box.top > height + 16);
      setActive(select.selectedIndex);
    };

    const choose = (index) => {
      const changed = index !== select.selectedIndex;
      select.selectedIndex = index;
      active = index;
      paint();
      close(true);
      if (changed) select.dispatchEvent(new Event('change', { bubbles: true }));
    };

    wrap.addEventListener('click', (event) => event.preventDefault());
    button.addEventListener('click', () => (panel.hidden ? show() : close(true)));
    panel.addEventListener('mousedown', (event) => {
      const item = event.target.closest('.cs-option');
      if (item) choose(Number(item.dataset.index));
    });
    panel.addEventListener('mousemove', (event) => {
      const item = event.target.closest('.cs-option');
      if (item) setActive(Number(item.dataset.index));
    });
    button.addEventListener('keydown', (event) => {
      const key = event.key;
      if (panel.hidden) {
        if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(key)) { event.preventDefault(); show(); }
        return;
      }
      if (key === 'Escape' || key === 'Tab') { close(key === 'Escape'); return; }
      if (key === 'ArrowDown') { event.preventDefault(); setActive(active + 1); }
      else if (key === 'ArrowUp') { event.preventDefault(); setActive(active - 1); }
      else if (key === 'Home') { event.preventDefault(); setActive(0); }
      else if (key === 'End') { event.preventDefault(); setActive(options.length - 1); }
      else if (key === 'Enter' || key === ' ') { event.preventDefault(); choose(active); }
      else if (key.length === 1) {
        const match = [...select.options].findIndex((option) => option.textContent.toLowerCase().startsWith(key.toLowerCase()));
        if (match > -1) setActive(match);
      }
    });
    button.addEventListener('blur', () => close(false));
    select.addEventListener('change', paint);
    paint();
  };

  document.querySelectorAll('select').forEach(enhance);
  document.addEventListener('click', (event) => { if (open && !event.target.closest('.cs')) open(false); }, true);
})();

/* Mobile navigation drawer — the ☰ button had no behaviour, leaving the site
   unnavigable on phones. Builds the drawer from the existing nav links. */
(() => {
  const header = document.querySelector('.site-header');
  const menuButton = document.querySelector('.menu-button');
  const mainNav = document.querySelector('.main-nav');
  if (!header || !menuButton || !mainNav) return;

  const drawer = document.createElement('nav');
  drawer.className = 'mobile-nav';
  drawer.setAttribute('aria-label', 'Mobile navigation');
  drawer.hidden = true;
  mainNav.querySelectorAll('a').forEach((link) => drawer.appendChild(link.cloneNode(true)));
  const providerLink = document.querySelector('.provider-link');
  if (providerLink) drawer.appendChild(providerLink.cloneNode(true));

  const scrim = document.createElement('div');
  scrim.className = 'mobile-nav-scrim';
  scrim.hidden = true;
  header.after(drawer);
  drawer.after(scrim);

  const setOpen = (isOpen) => {
    drawer.hidden = !isOpen;
    scrim.hidden = !isOpen;
    menuButton.setAttribute('aria-expanded', String(isOpen));
    menuButton.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
    menuButton.textContent = isOpen ? '✕' : '☰';
    document.body.style.overflow = isOpen ? 'hidden' : '';
  };

  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-controls', 'mobile-nav');
  drawer.id = 'mobile-nav';
  menuButton.addEventListener('click', () => setOpen(drawer.hidden));
  scrim.addEventListener('click', () => setOpen(false));
  drawer.addEventListener('click', (event) => { if (event.target.closest('a,button')) setOpen(false); });
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') setOpen(false); });
  const syncActive = () => {
    const links = [...mainNav.querySelectorAll('a')];
    drawer.querySelectorAll('a').forEach((link, index) => {
      if (links[index]) link.classList.toggle('active', links[index].classList.contains('active'));
    });
  };
  window.addEventListener('hashchange', () => { setOpen(false); setTimeout(syncActive, 0); });
  window.addEventListener('resize', () => { if (window.innerWidth > 800) setOpen(false); });
})();

/* Sign in — the header button used to drop people straight onto the logged-in
   account page. It now routes through a real sign-in screen and carries the
   entered email into the account view. */
(() => {
  const accountButton = document.querySelector('.account-button');
  const form = document.querySelector('#signin-form');
  const email = document.querySelector('#signin-email');
  const password = document.querySelector('#signin-password');
  const error = document.querySelector('#signin-error');
  const reveal = document.querySelector('.auth-reveal');
  if (!accountButton || !form) return;

  const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  let session = null;

  const notify = (message) => {
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2400);
  };

  const nameFromEmail = (address) => address.split('@')[0].replace(/[._-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  const render = () => {
    accountButton.textContent = session ? 'My account' : 'Sign in';
    document.querySelector('#account-email').textContent = session ? session.email : 'your email will appear here';
    document.querySelector('#account-email-detail').textContent = session ? session.email : 'your email will appear here';
    document.querySelector('#account-name').textContent = session ? session.name : 'Your account';
    document.querySelector('#account-avatar').textContent = session
      ? session.name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase()
      : 'IN';
  };

  accountButton.addEventListener('click', () => { window.location.hash = session ? 'account' : 'signin'; });

  document.querySelectorAll('.auth-reveal').forEach((button) => button.addEventListener('click', () => {
    const field = button.previousElementSibling;
    const shown = field.type === 'text';
    field.type = shown ? 'password' : 'text';
    button.textContent = shown ? 'Show' : 'Hide';
    button.setAttribute('aria-label', shown ? 'Show password' : 'Hide password');
    field.focus();
  }));

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const address = email.value.trim();
    const emailValid = EMAIL.test(address);
    if (!emailValid || !password.value) {
      error.hidden = false;
      error.textContent = !emailValid
        ? (address ? 'Enter a valid email address.' : 'Enter your email address to continue.')
        : 'Enter your password to continue.';
      (emailValid ? password : email).focus();
      return;
    }
    error.hidden = true;
    session = { email: address, name: nameFromEmail(address) };
    render();
    password.value = '';
    window.location.hash = 'account';
    notify(`Signed in as ${address}.`);
  });

  document.querySelector('#sign-out').addEventListener('click', () => {
    session = null;
    render();
    window.location.hash = 'signin';
    notify('You have been signed out.');
  });

  /* The account route is only meaningful once signed in. */
  const guard = () => {
    if (!session && window.location.hash === '#account') {
      window.location.replace('#signin');
      notify('Sign in to view your account.');
    }
  };
  window.addEventListener('hashchange', guard);

  /* Create account */
  const signupForm = document.querySelector('#signup-form');
  const signupName = document.querySelector('#signup-name');
  const signupEmail = document.querySelector('#signup-email');
  const signupPassword = document.querySelector('#signup-password');
  const signupTerms = document.querySelector('#signup-terms');
  const signupError = document.querySelector('#signup-error');

  signupForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const name = signupName.value.trim();
    const address = signupEmail.value.trim();
    const problem = !name ? [signupName, 'Enter your name to continue.']
      : !EMAIL.test(address) ? [signupEmail, address ? 'Enter a valid email address.' : 'Enter your email address to continue.']
      : signupPassword.value.length < 8 ? [signupPassword, 'Use a password of at least 8 characters.']
      : !signupTerms.checked ? [signupTerms, 'Please accept the Terms of Use to continue.']
      : null;
    if (problem) {
      signupError.hidden = false;
      signupError.textContent = problem[1];
      problem[0].focus();
      return;
    }
    signupError.hidden = true;
    session = { email: address, name };
    render();
    signupForm.reset();
    window.location.hash = 'account';
    notify(`Welcome to Injurvia, ${name.split(' ')[0]}.`);
  });

  document.querySelector('#create-account').addEventListener('click', () => { window.location.hash = 'signup'; });
  document.querySelector('#go-signin').addEventListener('click', () => { window.location.hash = 'signin'; });

  /* Forgot password */
  const resetDialog = document.querySelector('#reset-dialog');
  const resetForm = document.querySelector('#reset-form');
  const resetEmail = document.querySelector('#reset-email');
  const resetError = document.querySelector('#reset-error');
  const resetSent = document.querySelector('#reset-sent');

  document.querySelector('#forgot-password').addEventListener('click', () => {
    resetEmail.value = email.value.trim();
    resetError.hidden = true;
    resetSent.hidden = true;
    resetForm.hidden = false;
    resetDialog.showModal();
    resetEmail.focus();
  });

  resetForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const address = resetEmail.value.trim();
    if (!EMAIL.test(address)) {
      resetError.hidden = false;
      resetEmail.focus();
      return;
    }
    resetError.hidden = true;
    resetForm.hidden = true;
    resetSent.hidden = false;
    notify(`Reset link sent to ${address}.`);
  });

  document.querySelector('#reset-back').addEventListener('click', () => resetDialog.close());
  document.querySelector('.account-edit').addEventListener('click', () => notify('Editing is not part of this prototype.'));
  render();
  guard();
})();

/* Location autocomplete for the hero and provider search fields. Reuses the
   .suggestion-list styles that were already in the sheet but unwired. */
(() => {
  const LOCATIONS = [
    { city: 'Seattle, WA', zip: '98101' },
    { city: 'Bellevue, WA', zip: '98004' },
    { city: 'Edmonds, WA', zip: '98020' },
    { city: 'Redmond, WA', zip: '98052' },
    { city: 'Mill Creek, WA', zip: '98012' },
    { city: 'Everett, WA', zip: '98201' },
    { city: 'Tacoma, WA', zip: '98402' },
    { city: 'Renton, WA', zip: '98055' },
    { city: 'Spokane, WA', zip: '99201' },
    { city: 'Portland, OR', zip: '97205' },
    { city: 'Los Angeles, CA', zip: '90012' },
    { city: 'Chicago, IL', zip: '60601' },
  ];
  const LIMIT = 6;

  const matches = (term) => {
    const needle = term.trim().toLowerCase();
    if (!needle) return LOCATIONS.slice(0, 5);
    const starts = LOCATIONS.filter((place) => place.city.toLowerCase().startsWith(needle) || place.zip.startsWith(needle));
    /* Match later words too ("creek" -> Mill Creek), but not mid-word noise
       ("ver" should not surface Everett). */
    const words = LOCATIONS.filter((place) => !starts.includes(place)
      && place.city.toLowerCase().split(/[\s,]+/).some((word) => word.startsWith(needle)));
    return [...starts, ...words].slice(0, LIMIT);
  };

  const attach = (input, id) => {
    if (!input) return;
    const list = document.createElement('div');
    list.className = 'suggestion-list';
    list.id = `${id}-suggestions`;
    list.setAttribute('role', 'listbox');
    list.hidden = true;
    input.parentElement.appendChild(list);
    input.setAttribute('role', 'combobox');
    input.setAttribute('aria-autocomplete', 'list');
    input.setAttribute('aria-expanded', 'false');
    input.setAttribute('aria-controls', list.id);
    input.setAttribute('autocomplete', 'off');

    let options = [];
    let active = -1;
    let silent = false;

    let lifted = [];

    const close = () => {
      list.hidden = true;
      lifted.forEach((node) => node.classList.remove('suggest-lift'));
      lifted = [];
      input.setAttribute('aria-expanded', 'false');
      input.removeAttribute('aria-activedescendant');
      active = -1;
    };

    const setActive = (index) => {
      active = index;
      options.forEach((option, i) => option.classList.toggle('is-active', i === index));
      if (index > -1) {
        input.setAttribute('aria-activedescendant', options[index].id);
        options[index].scrollIntoView({ block: 'nearest' });
      } else {
        input.removeAttribute('aria-activedescendant');
      }
    };

    const choose = (place) => {
      input.value = place.city;
      /* Let listeners see the change without the event reopening the list. */
      silent = true;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      silent = false;
      close();
    };

    const open = () => {
      const found = matches(input.value);
      if (!found.length) { close(); return; }
      list.textContent = '';
      options = found.map((place, index) => {
        const option = document.createElement('button');
        option.type = 'button';
        option.id = `${id}-suggestion-${index}`;
        option.setAttribute('role', 'option');
        option.innerHTML = `<span></span><small></small>`;
        option.firstChild.textContent = place.city;
        option.lastChild.textContent = place.zip;
        option.addEventListener('mousedown', (event) => { event.preventDefault(); choose(place); });
        list.appendChild(option);
        return option;
      });
      list.hidden = false;
      /* Neighbouring sections create stacking contexts, so lift the ancestors
         while the list is open (same reason as the select menus). */
      for (let node = list.parentElement; node && node !== document.body; node = node.parentElement) {
        node.classList.add('suggest-lift');
        lifted.push(node);
      }
      input.setAttribute('aria-expanded', 'true');
      setActive(-1);
    };

    input.addEventListener('focus', open);
    input.addEventListener('input', () => { if (!silent) open(); });
    input.addEventListener('blur', () => setTimeout(close, 120));
    input.addEventListener('keydown', (event) => {
      if (list.hidden) {
        if (event.key === 'ArrowDown') { event.preventDefault(); open(); }
        return;
      }
      if (event.key === 'ArrowDown') { event.preventDefault(); setActive((active + 1) % options.length); }
      else if (event.key === 'ArrowUp') { event.preventDefault(); setActive(active <= 0 ? options.length - 1 : active - 1); }
      else if (event.key === 'Escape') { close(); }
      else if (event.key === 'Enter' && active > -1) { event.preventDefault(); options[active].dispatchEvent(new MouseEvent('mousedown', { bubbles: true })); }
      else if (event.key === 'Tab') { close(); }
    });
  };

  attach(document.querySelector('#search-form input[aria-label="Location"]'), 'hero-location');
  attach(document.querySelector('#provider-search-location'), 'provider-location');
})();

/* Real maps via Leaflet + OpenStreetMap tiles. The hand-drawn map markup is
   left in place and only replaced once the library has actually loaded, so a
   blocked CDN or offline session still shows the stylised fallback. */
(() => {
  /* Seattle, to match the network's stated Pacific Northwest footprint and the
     Washington clinics in the featured strip. */
  /* Seattle, matching the network's Pacific Northwest footprint. Names and
     order mirror the cards in #provider-list so the map can follow the list. */
  const PROVIDERS = [
    { name: 'Harbor Health Chiropractic', detail: 'Chiropractic care · 0.8 mi', street: '218 Pine Street', city: 'Seattle', coords: [47.6101, -122.3379] },
    { name: 'Northstar Spine & Rehab', detail: 'Chiropractic care · 1.6 mi', street: '1420 Fifth Avenue', city: 'Seattle', coords: [47.6088, -122.3352] },
    { name: 'The Motion Clinic', detail: 'Chiropractic care · 2.1 mi', street: '500 Denny Way', city: 'Seattle', coords: [47.6188, -122.3407] },
    { name: 'Cascade Injury & Spine', detail: 'Chiropractic care · 3.4 mi', street: '2200 Westlake Avenue', city: 'Seattle', coords: [47.6175, -122.3385] },
    { name: 'Northwest Urgent Care', detail: 'Urgent care · 1.9 mi', street: '900 Third Avenue', city: 'Seattle', coords: [47.6045, -122.3336] },
    { name: 'Emerald City Acupuncture', detail: 'Acupuncture · 2.8 mi', street: '720 Broadway E', city: 'Seattle', coords: [47.6280, -122.3208] },
    { name: 'Anchor Behavioral Health', detail: 'Licensed mental health · 3.1 mi', street: '300 Elliott Avenue W', city: 'Seattle', coords: [47.6205, -122.3593] },
    { name: 'Sound Imaging Center', detail: 'Radiology · 4.7 mi', street: '1101 Madison Street', city: 'Seattle', coords: [47.6089, -122.3255] },
    { name: 'Puget Sound Physical Therapy', detail: 'Physical therapy · 5.2 mi', street: '10655 NE 4th Street', city: 'Bellevue', coords: [47.6157, -122.2010] },
    { name: 'Evergreen Motion Therapy', detail: 'Physical therapy · 6.1 mi', street: '1407 116th Avenue NE', city: 'Bellevue', coords: [47.6236, -122.1889] },
    { name: 'Lakeside Neuro & TBI Clinic', detail: 'Traumatic brain injury · 5.9 mi', street: '1750 112th Avenue NE', city: 'Bellevue', coords: [47.6191, -122.1955] },
    { name: 'Rainier Massage & Recovery', detail: 'Massage therapy · 7.8 mi', street: '3223 Rainier Avenue S', city: 'Seattle', coords: [47.5735, -122.2895] },
    { name: 'Summit Orthopedic Associates', detail: 'Orthopedic surgery · 9.3 mi', street: '1600 116th Avenue NE', city: 'Bellevue', coords: [47.6270, -122.1875] },
  ];
  const TILES = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

  const pin = (label, active) => L.divIcon({
    className: '',
    html: `<div class="map-marker${active ? ' active' : ''}"><span>${label}</span></div>`,
    iconSize: [31, 31],
    iconAnchor: [15, 30],
    popupAnchor: [0, -28],
  });

  /* The map mirrors whatever the list is currently showing, so a filtered-out
     clinic cannot linger as a pin. */
  let activeNames = PROVIDERS.map((provider) => provider.name);
  const shownProviders = () => {
    const picked = PROVIDERS.filter((provider) => activeNames.includes(provider.name));
    return picked.length ? picked : PROVIDERS;
  };
  const BOUNDS = () => L.latLngBounds(shownProviders().map((provider) => provider.coords));
  let resultsMap = null;
  let profileMap = null;
  let profileMarker = null;
  let profileAddress = null;

  /* Fitting while the panel is hidden gives a 0x0 container and a max-zoom
     view, so refit whenever it becomes visible. */
  const fitResults = () => {
    if (!resultsMap) return;
    resultsMap.invalidateSize();
    resultsMap.fitBounds(BOUNDS(), { padding: [45, 45] });
  };

  const buildResultsMap = () => {
    const canvas = document.querySelector('.map-canvas');
    if (!canvas) return;
    canvas.textContent = '';
    resultsMap = L.map(canvas, { scrollWheelZoom: false, attributionControl: true });
    L.tileLayer(TILES, { attribution: ATTRIBUTION, maxZoom: 19 }).addTo(resultsMap);
    const markers = new Map();
    const drawMarkers = () => {
      markers.forEach((marker) => resultsMap.removeLayer(marker));
      markers.clear();
      shownProviders().forEach((provider, index) => {
        const marker = L.marker(provider.coords, {
          icon: pin(index + 1, index === 0),
          title: provider.name,
          alt: provider.name,
        }).addTo(resultsMap);
        marker.bindPopup(`<strong>${provider.name}</strong><small>${provider.detail}</small>`);
        marker.on('click', () => {
          let position = 0;
          markers.forEach((item) => { position += 1; item.setIcon(pin(position, item === marker)); });
        });
        markers.set(provider.name, marker);
      });
    };
    drawMarkers();
    document.addEventListener('results:change', () => { drawMarkers(); fitResults(); });
    fitResults();
  };

  const buildProfileMap = () => {
    const container = document.querySelector('.profile-map');
    if (!container) return;
    profileAddress = container.querySelector('.profile-map-address');
    const address = profileAddress;
    container.textContent = '';
    const canvas = document.createElement('div');
    canvas.style.cssText = 'position:absolute;inset:0';
    container.appendChild(canvas);
    if (address) container.appendChild(address);
    profileMap = L.map(canvas, { scrollWheelZoom: false, zoomControl: false }).setView(PROVIDERS[0].coords, 15);
    L.control.zoom({ position: 'topleft' }).addTo(profileMap);
    L.tileLayer(TILES, { attribution: ATTRIBUTION, maxZoom: 19 }).addTo(profileMap);
    profileMarker = L.marker(PROVIDERS[0].coords, { icon: pin('●', true), alt: PROVIDERS[0].name }).addTo(profileMap);
  };

  const focusProfile = (name) => {
    const provider = PROVIDERS.find((item) => item.name === name) || PROVIDERS[0];
    if (!profileMap) return;
    profileMap.setView(provider.coords, 15);
    if (profileMarker) profileMarker.setLatLng(provider.coords);
    if (profileAddress) {
      profileAddress.querySelector('strong').textContent = provider.name;
      profileAddress.querySelector('span').textContent = provider.street;
    }
    const dialogAddress = document.querySelector('#dialog-provider-address');
    if (dialogAddress) dialogAddress.textContent = `${provider.street}, ${provider.city}, WA`;
  };

  document.addEventListener('results:change', (event) => {
    activeNames = event.detail.matches.map((card) => card.dataset.name);
  });

  /* The detail page gets its own small map, rebuilt whenever a different
     provider is rendered. */
  let detailMap = null;
  let detailMarker = null;
  let lastDetail = null;
  const drawDetailMap = (data) => {
    lastDetail = data;
    if (typeof L === 'undefined') return;
    const canvas = document.querySelector('#detail-map');
    if (!canvas) return;
    if (!detailMap) {
      canvas.textContent = '';
      detailMap = L.map(canvas, { scrollWheelZoom: false, zoomControl: false });
      L.control.zoom({ position: 'topright' }).addTo(detailMap);
      L.tileLayer(TILES, { attribution: ATTRIBUTION, maxZoom: 19 }).addTo(detailMap);
    }
    detailMap.setView(data.coords, 14);
    if (detailMarker) detailMap.removeLayer(detailMarker);
    detailMarker = L.marker(data.coords, { icon: pin('●', true), alt: data.name }).addTo(detailMap);
    detailMarker.bindPopup(`<strong>${data.name}</strong><small>${data.street}</small>`);
    setTimeout(() => detailMap.invalidateSize(), 80);
  };
  document.addEventListener('provider:detail', (event) => drawDetailMap(event.detail));

  const start = () => {
    if (typeof L === 'undefined') return;
    buildResultsMap();
    buildProfileMap();
    /* The detail map is built inside a closed <dialog>, so its container is
       0x0 until the dialog opens. Re-measure and re-centre on open. */
    const detailDialog = document.querySelector('#provider-detail-dialog');
    if (detailDialog) new MutationObserver(() => {
      if (!detailDialog.open) return;
      if (!detailMap && lastDetail) drawDetailMap(lastDetail);
      setTimeout(() => {
        if (!detailMap) return;
        detailMap.invalidateSize();
        if (lastDetail) detailMap.setView(lastDetail.coords, 14);
      }, 70);
    }).observe(detailDialog, { attributes: true, attributeFilter: ['open'] });

    /* Leaflet needs a resize nudge whenever a hidden container is revealed. */
    [listView, mapView].forEach((button) => button.addEventListener('click', () => setTimeout(fitResults, 60)));
    new MutationObserver(() => {
      if (!providerDialog.open || !profileMap) return;
      focusProfile(document.querySelector('#dialog-provider-name').textContent.trim());
      setTimeout(() => profileMap.invalidateSize(), 60);
    }).observe(providerDialog, { attributes: true, attributeFilter: ['open'] });
    window.addEventListener('resize', () => { if (resultsMap) resultsMap.invalidateSize(); });
  };

  if (document.readyState === 'complete') start();
  else window.addEventListener('load', start);
})();

/* Paint the results panel once on boot so the count, the availability badges
   and the "show more" button start out describing the real list. */
applyFilters();

/* Prototype affordances that had no destination. They were href="#", which
   cleared the hash route and bounced the user to the home page. */
document.querySelector('.provider-link')?.addEventListener('click', () => {
  toast.textContent = 'Provider enrolment opens in the full build.';
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2400);
});
document.querySelector('.insurance-link')?.addEventListener('click', () => {
  toast.textContent = 'Insurance coverage check opens in the full build.';
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2400);
});

/* ---- Category tiles route into the real search ---------------------------
   Every tile on #all-categories (and the homepage specialty tiles) selects the
   matching option in the specialty dropdown, re-runs the filters, and drops the
   user on the results list. Previously they all pointed at #medical-providers
   regardless of which category was clicked. */
function searchSpecialty(slug) {
  const option = [...specialtyInput.options].find((item) => item.textContent.trim().toLowerCase() === slug.toLowerCase());
  specialtyInput.value = option ? option.value : '';
  applyFilters();

  if (window.location.hash !== '#home') window.location.hash = '#home';
  else showRoute();
  requestAnimationFrame(() => {
    document.querySelector('#providers')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

document.querySelectorAll('.cat-tile').forEach((tile) => tile.addEventListener('click', () => {
  searchSpecialty(tile.dataset.specialty);
}));

/* The homepage "smart search categories" tiles carry the same labels. */
document.querySelectorAll('.specialty-grid a[href="#medical-providers"]').forEach((tile) => {
  const label = tile.querySelector('strong')?.textContent.trim();
  if (!label) return;
  const known = [...specialtyInput.options].some((item) => item.textContent.trim().toLowerCase() === label.toLowerCase());
  if (!known) return;
  tile.addEventListener('click', (event) => { event.preventDefault(); searchSpecialty(label); });
});


/* ---- Prototype affordances on the new provider-facing page ---- */
const notifyProto = (message) => {
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2600);
};
['#provider-join', '#provider-join-2'].forEach((id) => document.querySelector(id)
  ?.addEventListener('click', () => notifyProto('Provider applications open in the full build.')));
document.querySelector('#partner-enquiry')?.addEventListener('click', () => notifyProto('Partnership enquiries open in the full build.'));
document.querySelectorAll('.ccc-partner, .ccc-cta').forEach((button) => button
  .addEventListener('click', () => notifyProto('CCC course catalogue opens in the full build.')));

applyFaqFilter();

/* Footer placeholders were <a> with no href: styled like links but not
   focusable and not announced as links. Now buttons with honest feedback. */
document.querySelectorAll('.legal-link, .social-link, .directions-link').forEach((button) => {
  button.addEventListener('click', () => {
    const label = button.textContent.replace(' ↗', '').trim();
    notifyProto(`${label} opens in the full build.`);
  });
});

/* ---- Provider detail pages -------------------------------------------------
   Each featured clinic gets its own route (#provider/<slug>) so the page is
   linkable and the back button works, rather than being a modal. */
const PROVIDER_PROFILES = {
  'nu-star': {
    name: 'Nu-Star Chiropractic Clinic', city: 'Edmonds', zip: '98020', initials: 'NS', logo: 'logo-one',
    phone: '(425) 712-0307', street: '18904 Hwy 99 Suite K', region: 'Edmonds, WA 98020',
    coords: [47.8107, -122.3774], rankNote: 'Chiropractor in 98020',
    rating: 4.9, reviews: 18, years: 12, languages: ['English', 'French', 'Spanish'],
    services: ['Chiropractic', 'Massage therapy', 'Physical therapy', 'Traumatic brain injury'],
    doctor: {
      name: 'Dr. Justin McCormick, D.C.', meta: '52 years old · 24 years in practice',
      school: 'Central and Western Washington University',
      bio: [
        'Dr. McCormick was born and raised in the Seattle area. His interest in chiropractic care started young, in large part because two of his uncles practised it, and he went on to study at Central and Western Washington University.',
        'After completing his prerequisites he earned his doctorate at Palmer College of Chiropractic in Iowa. He opened his first practice in 2001, sold it four years later, and returned to the Pacific Northwest.',
        'He has since performed well over 90,000 treatments, working with patients whose pain ranges from minimal and acute to chronic and unresolved. He speaks regularly at community events about chronic pain, prevention and long-term wellness.',
      ],
    },
    about: [
      'Nu-Star Chiropractic Clinic has treated collision-injured patients across Snohomish County since 2013. The clinic handles the documentation an insurance claim depends on, so treatment notes, imaging referrals and progress reports arrive in the form adjusters and attorneys expect.',
      'Same-week appointments are typically available for new collision patients, and the clinic coordinates directly with physical therapy and imaging partners in the network.',
    ],
    reviewList: [
      { author: 'Marisol R.', stars: 5, text: 'They got me in two days after my accident and handled every piece of paperwork my insurer asked for. I never had to chase anything.' },
      { author: 'Devon T.', stars: 5, text: 'Straightforward about how long recovery would take. No upselling, no endless treatment plan.' },
      { author: 'Priya N.', stars: 4, text: 'Great care and very thorough notes. Parking is tight at peak times.' },
    ],
  },
  'impact-physical-therapy': {
    name: 'Impact Physical Therapy', city: 'Lynnwood', zip: '98036', initials: 'IP', logo: 'logo-five',
    phone: '(425) 640-9112', street: '19031 33rd Ave W Suite 210', region: 'Lynnwood, WA 98036',
    coords: [47.8209, -122.3151], rankNote: 'Physical therapist in 98036',
    rating: 4.8, reviews: 64, years: 9, languages: ['English', 'Korean', 'Spanish'],
    services: ['Physical therapy', 'Post-collision rehab', 'Manual therapy', 'Return-to-work programmes'],
    doctor: {
      name: 'Dr. Alina Vargas, DPT', meta: '41 years old · 16 years in practice',
      school: 'University of Washington, Doctor of Physical Therapy',
      bio: [
        'Dr. Vargas built her practice around people recovering from motor vehicle collisions, where the injury is often soft-tissue and the recovery is measured in months rather than weeks.',
        'Her programmes start with restoring range of motion, then rebuild strength and load tolerance in stages, with objective measurements at each visit so progress is documented rather than described.',
        'She works closely with chiropractors and pain management specialists in the network when a patient needs more than movement therapy alone.',
      ],
    },
    about: [
      'Impact Physical Therapy focuses on collision recovery, from whiplash and lower back injury through to post-surgical rehabilitation. Every plan of care is written with the insurance claim in mind.',
      'The clinic runs extended morning hours so patients can attend before work, and offers a home programme with video guidance between visits.',
    ],
    reviewList: [
      { author: 'Chris B.', stars: 5, text: 'Measured everything at every visit, so I could actually see I was improving instead of guessing.' },
      { author: 'Hana S.', stars: 5, text: 'They explained exactly which parts of my treatment my PIP would cover before we started.' },
      { author: 'Owen D.', stars: 4, text: 'Very good therapists. Booking the early slots takes some planning.' },
    ],
  },
  'dynamic-chiros': {
    name: 'Dynamic Chiros', city: 'Redmond', zip: '98052', initials: 'DA', logo: 'logo-two',
    phone: '(425) 883-4460', street: '8195 166th Ave NE Suite 210', region: 'Redmond, WA 98052',
    coords: [47.6795, -122.1214], rankNote: 'Chiropractor in 98052',
    rating: 4.9, reviews: 132, years: 15, languages: ['English', 'Mandarin', 'Hindi'],
    services: ['Chiropractic', 'Whiplash recovery', 'Spinal decompression', 'Massage therapy'],
    doctor: {
      name: 'Dr. Priya Raghavan, D.C.', meta: '46 years old · 19 years in practice',
      school: 'Palmer College of Chiropractic, West Campus',
      bio: [
        'Dr. Raghavan has spent most of her career treating collision injuries on the Eastside, and is a frequent speaker on whiplash-associated disorders.',
        'She favours a conservative, staged approach: settle the acute inflammation, restore joint motion, then rebuild the supporting musculature, escalating only when imaging or symptoms call for it.',
        'Outside the clinic she coaches a youth football team and is a keen long-distance cyclist.',
      ],
    },
    about: [
      'Dynamic Chiros is one of the longest-running collision injury practices in Redmond, with on-site digital X-ray and spinal decompression.',
      'The team routinely coordinates with attorneys and adjusters, and can provide narrative reports on request.',
    ],
    reviewList: [
      { author: 'Sam K.', stars: 5, text: 'Fifteen years in the same place for a reason. They know exactly what a claim needs.' },
      { author: 'Leah M.', stars: 5, text: 'The X-ray on site saved me a separate trip to an imaging centre.' },
      { author: 'Tom A.', stars: 5, text: 'Honest about when I no longer needed to come in. That earned my trust.' },
    ],
  },
  'core-accident-injury': {
    name: 'Core Accident Injury', city: 'Tacoma', zip: '98402', initials: 'CC', logo: 'logo-three',
    phone: '(253) 507-2288', street: '1201 Pacific Ave Suite 600', region: 'Tacoma, WA 98402',
    coords: [47.2529, -122.4443], rankNote: 'Chiropractor in 98402',
    rating: 4.7, reviews: 89, years: 7, languages: ['English', 'Spanish', 'Vietnamese'],
    services: ['Chiropractic', 'Pain management', 'Imaging referrals', 'Massage therapy'],
    doctor: {
      name: 'Dr. Marcus Ellery, D.C.', meta: '38 years old · 11 years in practice',
      school: 'Life Chiropractic College West',
      bio: [
        'Dr. Ellery opened Core Accident Injury to serve South Sound drivers who were being turned away by clinics unwilling to handle collision paperwork.',
        'The practice takes patients on a lien basis where appropriate, so treatment can begin before a claim settles.',
        'He is a CCC-certified provider and sits on the network’s provider advisory group.',
      ],
    },
    about: [
      'Core Accident Injury treats collision patients exclusively, and is set up for people who are uninsured or waiting on a settlement.',
      'Interpreters are available for Spanish and Vietnamese speakers without advance notice.',
    ],
    reviewList: [
      { author: 'Rosa L.', stars: 5, text: 'I had no insurance and they still started treatment. That mattered more than I can say.' },
      { author: 'Jerome W.', stars: 5, text: 'Interpreter was there the same day. My mother could follow her own appointment.' },
      { author: 'Katie P.', stars: 4, text: 'Very good clinic. Waiting room can be busy on Mondays.' },
    ],
  },
  'planet-chiropractic': {
    name: 'Planet Chiropractic', city: 'Mill Creek', zip: '98012', initials: 'PC', logo: 'logo-four',
    phone: '(425) 337-1900', street: '15111 Main St Suite 104', region: 'Mill Creek, WA 98012',
    coords: [47.8601, -122.2043], rankNote: 'Chiropractor in 98012',
    rating: 4.8, reviews: 76, years: 20, languages: ['English', 'Spanish'],
    services: ['Chiropractic', 'Sports injury', 'Massage therapy', 'Wellness care'],
    doctor: {
      name: 'Dr. Ryan Whitfield, D.C.', meta: '55 years old · 24 years in practice',
      school: 'Palmer College of Chiropractic',
      bio: [
        'Dr. Whitfield opened his first practice in Salt Lake City in 2001, then returned to the Pacific Northwest and founded Planet Chiropractic of Mill Creek in 2005.',
        'Two decades on, much of the practice is collision work, alongside the sports and wellness patients who have been with him since the beginning.',
        'He is a purple belt in Kempo martial arts and spends his weekends hiking with his two dogs.',
      ],
    },
    about: [
      'Planet Chiropractic has served Mill Creek since 2005 and is among the longest-established practices in the network.',
      'The clinic offers evening appointments twice a week for patients who cannot attend during working hours.',
    ],
    reviewList: [
      { author: 'Nina G.', stars: 5, text: 'Twenty years of experience shows. He found the problem in one visit.' },
      { author: 'Aaron F.', stars: 5, text: 'Evening appointments meant I did not have to take time off work.' },
      { author: 'Beth C.', stars: 4, text: 'Warm, unhurried appointments. Reception could be quicker to answer the phone.' },
    ],
  },
};

const HOURS = [['Mon', '9am – 5pm'], ['Tues', '9am – 5pm'], ['Weds', '9am – 5pm'], ['Thurs', '9am – 5pm'], ['Fri', '9am – 5pm'], ['Sat', 'Closed'], ['Sun', 'Closed']];

function renderProviderDetail(slug) {
  const data = PROVIDER_PROFILES[slug];
  if (!data) return false;
  const set = (id, value) => { const el = document.querySelector(id); if (el) el.textContent = value; };

  set('#crumb-city', data.city);
  set('#crumb-name', data.name);
  set('#detail-name', data.name);
  set('#detail-phone', data.phone);
  set('#detail-rank-note', data.rankNote);
  set('#detail-years', `${data.years} yrs in business`);
  set('#detail-langs', data.languages.join(', '));

  const logo = document.querySelector('#detail-logo');
  logo.textContent = data.initials;
  logo.className = `detail-logo provider-logo ${data.logo}`;

  document.querySelector('#detail-address').innerHTML = `${data.street}<br>${data.region}`;

  const full = Math.round(data.rating);
  document.querySelector('#detail-stars').innerHTML =
    `<b aria-hidden="true">${'★'.repeat(full)}${'☆'.repeat(5 - full)}</b> <span>${data.rating} (${data.reviews})</span>`;
  document.querySelector('#detail-stars').setAttribute('aria-label', `${data.rating} out of 5 from ${data.reviews} reviews`);

  const doc = data.doctor;
  set('#doc-name', doc.name);
  set('#doc-meta', doc.meta);
  set('#doc-school', doc.school);
  document.querySelector('#doc-avatar').textContent = doc.name.replace(/^Dr\.\s*/, '').split(' ').map((w) => w[0]).slice(0, 2).join('');
  document.querySelector('#doc-bio').innerHTML = doc.bio.map((para) => `<p>${para}</p>`).join('');
  document.querySelector('#about-body').innerHTML = data.about.map((para) => `<p>${para}</p>`).join('');

  document.querySelector('#detail-hours').innerHTML = HOURS
    .map(([day, time]) => `<div><dt>${day}</dt><dd${time === 'Closed' ? ' class="closed"' : ''}>${time}</dd></div>`).join('');
  document.querySelector('#detail-services').innerHTML = data.services.map((s) => `<li>${s}</li>`).join('');

  document.querySelector('#media-grid').innerHTML = ['Reception', 'Treatment room', 'Equipment', 'Team', 'Exterior', 'Waiting area']
    .map((label, i) => `<figure class="media-tile media-${(i % 3) + 1}"><figcaption>${label}</figcaption></figure>`).join('');

  document.querySelector('#review-list').innerHTML = data.reviewList.map((r) => `
    <article class="review">
      <div class="review-top"><b>${r.author}</b><span class="review-stars" aria-label="${r.stars} out of 5">${'★'.repeat(r.stars)}${'☆'.repeat(5 - r.stars)}</span></div>
      <p>${r.text}</p>
    </article>`).join('');

  /* Reset to the first tab so a second provider does not inherit the last one's open tab. */
  document.querySelectorAll('.detail-tab').forEach((tab, i) => {
    tab.classList.toggle('active', i === 0);
    tab.setAttribute('aria-selected', String(i === 0));
  });
  document.querySelectorAll('.detail-panel').forEach((panel, i) => {
    panel.classList.toggle('active', i === 0);
    panel.hidden = i !== 0;
  });

  setExplainer(false);
  document.dispatchEvent(new CustomEvent('provider:detail', { detail: data }));
  return true;
}

document.querySelectorAll('.detail-tab').forEach((tab) => tab.addEventListener('click', () => {
  document.querySelectorAll('.detail-tab').forEach((item) => {
    const on = item === tab;
    item.classList.toggle('active', on);
    item.setAttribute('aria-selected', String(on));
  });
  document.querySelectorAll('.detail-panel').forEach((panel) => {
    const on = panel.dataset.panel === tab.dataset.tab;
    panel.classList.toggle('active', on);
    panel.hidden = !on;
  });
}));

/* Clinic name -> that provider's page. The rest of the card, and "What's This?",
   still open the ranking explainer. */
const providerDetailDialog = document.querySelector('#provider-detail-dialog');
const cicExplainer = document.querySelector('#cic-explainer');
const detailCicToggle = document.querySelector('#provider-detail-dialog .cic-what');

function setExplainer(open) {
  if (!cicExplainer) return;
  cicExplainer.hidden = !open;
  detailCicToggle?.setAttribute('aria-expanded', String(open));
}

/* One modal now. The ranking explainer is a disclosure inside the provider
   detail dialog, so "What's This?" opens that modal with the explainer already
   expanded instead of stacking a second dialog on top. */
function openProviderDetail(slug, explain) {
  if (!renderProviderDetail(slug)) return;
  providerDetailDialog?.showModal();
  setExplainer(Boolean(explain));
  if (explain) requestAnimationFrame(() => cicExplainer?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }));
}

detailCicToggle?.addEventListener('click', () => setExplainer(cicExplainer.hidden));

document.querySelectorAll('[data-cic-info]').forEach((card) => {
  const slug = card.querySelector('.featured-name')?.dataset.provider;
  if (!slug) return;
  card.addEventListener('click', () => openProviderDetail(slug, false));
  card.querySelector('.featured-name')?.addEventListener('click', (event) => {
    event.stopPropagation();
    openProviderDetail(slug, false);
  });
  card.querySelector('.cic-what')?.addEventListener('click', (event) => {
    event.stopPropagation();
    openProviderDetail(slug, true);
  });
});
document.querySelectorAll('.detail-link, #detail-more-langs').forEach((button) => button.addEventListener('click', () => {
  notifyProto(`${button.dataset.proto || 'More languages'} opens in the full build.`);
}));
document.querySelector('#detail-book')?.addEventListener('click', () => bookingDialog.showModal());

/* Boot the router last: it can render a provider detail page, which needs
   PROVIDER_PROFILES to be initialised first. */
showRoute();

/* ---- Patient stories --------------------------------------------------------
   Every account follows the same five beats: impact, symptoms, the search,
   the turning point, where they landed. The reader renders those beats as a
   vertical arc so the shape of a recovery is legible at a glance. */
const STORIES = [
  {
    slug: 'thought-i-was-fine', category: 'Recovery', minutes: 4,
    title: 'I thought I was fine — until I wasn’t.',
    excerpt: 'No ER visit, no fuss. Then the headaches started and would not stop.',
    name: 'Maya R.', where: 'Everett, WA · rear-ended on I-5',
    beats: [
      ['The collision', 'I got rear-ended on I-5 during stop-and-go traffic and honestly thought it wasn’t a big deal. I didn’t go to the ER and I told everyone I felt okay.'],
      ['A couple of days later', 'My neck stiffened up and I started getting headaches that wouldn’t go away. Then my lower back started hurting in a way that felt deeper than just soreness.'],
      ['Nowhere obvious to turn', 'I didn’t have a primary doctor, and urgent care made it sound like they don’t really deal with collision injuries beyond basic checks. That’s when I found Injurvia.'],
      ['The turning point', 'They connected me with a provider who immediately understood what I was describing. They explained how symptoms can show up days later and why it matters to track everything properly. The care felt intentional, not rushed.'],
      ['Looking back', 'I realise how easy it would have been to ignore it, or to go somewhere that didn’t take it seriously. Getting on the right path early made a real difference to my recovery and to how everything was documented.'],
    ],
    takeaway: 'Collision symptoms often surface days later. Being seen by someone who expects that — and documents it — changes both the treatment and the claim.',
  },
  {
    slug: 'wrong-start', category: 'Documentation', minutes: 5,
    title: 'The wrong start almost cost me everything.',
    excerpt: 'The first clinic was kind. It was also, it turned out, keeping almost no record of me.',
    name: 'Andre W.', where: 'Tacoma, WA · side-impact collision',
    beats: [
      ['The nearest clinic', 'After my collision I went to the closest clinic I could find. They were nice, but everything felt surface-level. No imaging, minimal notes, and I was told to rest and come back if it didn’t improve.'],
      ['It didn’t improve', 'Weeks went by and I was still in pain. More than that, nothing was really being tracked. There was no record of what I was actually going through.'],
      ['What the attorney said', 'When I eventually spoke with an attorney, they told me my records didn’t reflect my injury at all. Months of pain, and almost nothing on paper to show for it.'],
      ['A different approach', 'That’s when I found Injurvia. They connected me with a provider who asked detailed questions about the collision, ordered the right tests, and documented everything clearly from the start.'],
      ['Where I landed', 'My recovery improved, but just as importantly I felt like my situation was finally being taken seriously. I just wish I had started there.'],
    ],
    takeaway: 'Treatment and documentation are the same job. A clinic that treats you well but records nothing leaves you with no way to show what you went through.',
  },
  {
    slug: 'knew-what-to-ask', category: 'Preparedness', minutes: 3,
    title: 'I knew what to ask at my first appointment.',
    excerpt: 'Ten minutes of reading beforehand changed how the whole appointment went.',
    name: 'Priya S.', where: 'Bellevue, WA · low-speed rear impact',
    beats: [
      ['The collision', 'It was a low-speed hit in a car park. Barely a scratch on the bumper, which is exactly why I nearly talked myself out of being seen at all.'],
      ['The doubt', 'My shoulder ached for a week. Everyone kept telling me it was nothing because the car was fine. I started to believe them.'],
      ['Doing the reading', 'Before booking I went through the questions Injurvia suggests asking: how collision injuries are documented, whether imaging is available on site, how the clinic works with insurers.'],
      ['The turning point', 'I asked all of them at my first appointment. The provider answered every one without hesitating, and I could tell straight away this was routine for them rather than an inconvenience.'],
      ['Where I am now', 'I finished my course of treatment in eight weeks. Knowing what to ask meant I never had that feeling of being talked past.'],
    ],
    takeaway: 'Damage to the car is a poor proxy for damage to a person. Walking in with the right questions puts you on equal footing.',
  },
  {
    slug: 'keep-moving', category: 'Community', minutes: 5,
    title: 'The right care team helped me keep moving.',
    excerpt: 'Three providers, one plan, and nobody making me repeat the story from scratch.',
    name: 'Daniel K.', where: 'Seattle, WA · T-bone collision',
    beats: [
      ['The collision', 'I was T-boned turning onto Rainier Avenue. I walked away from it, which everyone treated as good news, and mostly it was.'],
      ['The scattered months', 'The problem was that my chiropractor, my physio and my imaging centre had no idea the others existed. I was the only thing joining them up, and I was in no state to be a project manager.'],
      ['Finding one network', 'Through Injurvia I found providers who already worked together. My chiropractor knew my physio. The imaging came back to both of them.'],
      ['The turning point', 'I stopped repeating my story at every appointment. That sounds small. When you are tired and sore and frightened about money, it is not small at all.'],
      ['Where I am now', 'I am back to cycling to work. My care took about five months and I never once had to chase a record between two clinics.'],
    ],
    takeaway: 'Recovery stalls in the gaps between providers. A connected care team removes the coordination work from the person least able to do it.',
  },
  {
    slug: 'paperwork-mattered', category: 'Claims', minutes: 4,
    title: 'Nobody told me the paperwork mattered this much.',
    excerpt: 'I was focused on getting better. Nobody mentioned that how it was written down mattered too.',
    name: 'Elena M.', where: 'Lynnwood, WA · multi-car collision',
    beats: [
      ['The collision', 'A four-car chain on the freeway in the rain. I was in the middle, which meant two impacts rather than one.'],
      ['Getting on with it', 'I did what I thought you were supposed to do. Went to appointments, did the exercises, kept my head down and tried to get better.'],
      ['The letter', 'Eight months later a letter arrived questioning whether my injuries came from the collision at all. I had been in pain the entire time and had no idea how thin the record looked.'],
      ['The turning point', 'I moved to an Injurvia provider who walked me through what their notes actually said and why. It was the first time anyone had shown me my own file.'],
      ['Where I am now', 'The claim was settled. What stays with me is how close I came to losing it while doing everything I was told.'],
    ],
    takeaway: 'Doing everything right clinically is not enough on its own. Ask to see how your care is being recorded, early.',
  },
];

const storyDialog = document.querySelector('#story-dialog');
let storyIndex = 0;

const storyInitials = (name) => name.split(' ').map((part) => part[0]).join('').replace(/[^A-Z]/g, '').slice(0, 2);
const arcDots = (active) => Array.from({ length: 5 },
  (_, i) => `<span class="arc-dot${i === 4 ? ' arc-dot-end' : ''}${active ? ' arc-on' : ''}"></span>`).join('');

function storyCard(story, index, featured) {
  return `<article class="story-card${featured ? ' story-card-featured' : ''}">
    <div class="story-card-top">
      <span class="story-chip">${story.category}</span>
      <span class="story-read-time">${story.minutes} min read</span>
    </div>
    <h3>&ldquo;${story.title}&rdquo;</h3>
    <p class="story-card-excerpt">${story.excerpt}</p>
    <div class="story-arc" aria-hidden="true">${arcDots(featured)}<b>${story.beats.length} beats</b></div>
    <div class="story-card-foot">
      <span class="story-avatar">${storyInitials(story.name)}</span>
      <div><strong>${story.name}</strong><span>${story.where}</span></div>
      <button class="story-read" type="button" data-story="${index}">Read story <b>&rarr;</b></button>
    </div>
  </article>`;
}

function renderStories() {
  const featured = document.querySelector('#story-featured');
  const grid = document.querySelector('#story-grid');
  if (!featured || !grid) return;
  featured.innerHTML = storyCard(STORIES[0], 0, true);
  grid.innerHTML = STORIES.slice(1).map((story, i) => storyCard(story, i + 1, false)).join('');
  const count = document.querySelector('#story-count');
  if (count) count.textContent = String(STORIES.length).padStart(2, '0');
  document.querySelectorAll('.story-read').forEach((button) => button.addEventListener('click', () => {
    openStory(Number(button.dataset.story));
  }));
}

let beatObserver = null;

function openStory(index) {
  const story = STORIES[index];
  if (!story) return;
  storyIndex = index;
  const set = (id, value) => { const el = document.querySelector(id); if (el) el.textContent = value; };
  set('#story-chip', story.category);
  set('#story-time', `${story.minutes} min read`);
  set('#story-title', `“${story.title}”`);
  set('#story-avatar', storyInitials(story.name));
  set('#story-name', story.name);
  set('#story-where', story.where);
  set('#story-takeaway', story.takeaway);

  document.querySelector('#story-beats').innerHTML = story.beats.map(([label, text], i) => `
    <li class="story-beat${i === story.beats.length - 1 ? ' story-beat-end' : ''}">
      <span class="beat-marker" aria-hidden="true"></span>
      <h3>${label}</h3>
      <p>${text}</p>
    </li>`).join('');

  /* Light up each beat as it comes into view, so the arc reads as progress. */
  beatObserver?.disconnect();
  const beats = [...document.querySelectorAll('.story-beat')];
  beatObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => entry.target.classList.toggle('beat-active', entry.isIntersecting));
  }, { root: document.querySelector('.story-scroll'), rootMargin: '-20% 0px -55% 0px' });
  beats.forEach((beat) => beatObserver.observe(beat));

  const prev = STORIES[(index - 1 + STORIES.length) % STORIES.length];
  const next = STORIES[(index + 1) % STORIES.length];
  document.querySelector('#story-prev span').textContent = prev.name;
  document.querySelector('#story-next span').textContent = next.name;

  if (!storyDialog.open) storyDialog.showModal();
  document.querySelector('.story-scroll').scrollTop = 0;
}

document.querySelector('#story-prev')?.addEventListener('click', () => openStory((storyIndex - 1 + STORIES.length) % STORIES.length));
document.querySelector('#story-next')?.addEventListener('click', () => openStory((storyIndex + 1) % STORIES.length));
storyDialog?.addEventListener('close', () => beatObserver?.disconnect());
renderStories();
