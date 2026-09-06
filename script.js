const form = document.querySelector('#search-form');
const specialtyInput = document.querySelector('#specialty-input');
const resultsTitle = document.querySelector('#results-title');
const resultCount = document.querySelector('#result-count');
const filterToggle = document.querySelector('#filter-toggle');
const filters = document.querySelector('#filters');
const clearFilters = document.querySelector('#clear-filters');
const resetResults = document.querySelector('#reset-results');
const emptyState = document.querySelector('#empty-state');
const cards = [...document.querySelectorAll('.provider-card')];
const mapPanel = document.querySelector('#map-panel');
const listView = document.querySelector('#list-view');
const mapView = document.querySelector('#map-view');
const providerDialog = document.querySelector('#provider-dialog');
const bookingDialog = document.querySelector('#booking-dialog');
const toast = document.querySelector('#toast');

function updateHeading() {
  const term = specialtyInput.value.trim() || 'providers';
  resultsTitle.innerHTML = `<span id="result-count">${cards.length}</span> ${term.toLowerCase()}${term.toLowerCase().endsWith('s') ? '' : 's'} near you`;
}

function applyFilters() {
  const selected = [...document.querySelectorAll('.filter-check:checked')].map((input) => input.value);
  let visible = 0;
  cards.forEach((card) => {
    const matches = selected.length === 0 || selected.every((tag) => card.dataset.tags.includes(tag));
    card.hidden = !matches;
    if (matches) visible += 1;
  });
  resultCount.textContent = visible;
  emptyState.hidden = visible !== 0;
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const term = specialtyInput.value.trim();
  updateHeading();
  form.classList.add('is-searching');
  setTimeout(() => form.classList.remove('is-searching'), 600);
  openMedicalSearchFor(term);
});

document.querySelectorAll('.filter-check').forEach((input) => input.addEventListener('change', applyFilters));
filterToggle.addEventListener('click', () => filters.classList.toggle('open'));
clearFilters.addEventListener('click', () => {
  document.querySelectorAll('.filter-check').forEach((input) => { input.checked = false; });
  applyFilters();
});
resetResults.addEventListener('click', () => clearFilters.click());
document.querySelectorAll('.save-button').forEach((button) => button.addEventListener('click', () => {
  button.classList.toggle('saved');
  button.textContent = button.classList.contains('saved') ? '♥' : '♡';
  button.setAttribute('aria-pressed', button.classList.contains('saved'));
}));
document.querySelectorAll('.popular-searches button').forEach((button) => button.addEventListener('click', () => {
  specialtyInput.value = button.textContent;
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
specialtyInput.addEventListener('change', updateHeading);
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
document.querySelectorAll('.faq-topic').forEach((topic) => topic.addEventListener('click', () => {
  document.querySelectorAll('.faq-topic').forEach((item) => item.classList.remove('active'));
  topic.classList.add('active');
  document.querySelector('.faq-group-label').textContent = topic.textContent.replace(/\d+/g, '').trim();
}));
document.querySelector('#faq-search').addEventListener('input', (event) => {
  const query = event.target.value.toLowerCase().trim();
  const questions = [...document.querySelectorAll('.faq-modern-layout details')];
  let matches = 0;
  questions.forEach((question) => {
    const visible = !query || question.dataset.faq.includes(query) || question.textContent.toLowerCase().includes(query);
    question.hidden = !visible;
    if (visible) matches += 1;
  });
  document.querySelector('#faq-empty').hidden = matches !== 0;
});
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
showRoute();
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

  reveal.addEventListener('click', () => {
    const shown = password.type === 'text';
    password.type = shown ? 'password' : 'text';
    reveal.textContent = shown ? 'Show' : 'Hide';
    reveal.setAttribute('aria-label', shown ? 'Show password' : 'Hide password');
    password.focus();
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const address = email.value.trim();
    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address);
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

  document.querySelector('#forgot-password').addEventListener('click', () => notify('Password reset links are not part of this prototype.'));
  document.querySelector('#create-account').addEventListener('click', () => notify('Account creation is not part of this prototype.'));
  document.querySelector('.account-edit').addEventListener('click', () => notify('Editing is not part of this prototype.'));
  render();
  guard();
})();

/* Location autocomplete for the hero and provider search fields. Reuses the
   .suggestion-list styles that were already in the sheet but unwired. */
(() => {
  const LOCATIONS = [
    { city: 'New York, NY', zip: '10024' },
    { city: 'Brooklyn, NY', zip: '11201' },
    { city: 'Queens, NY', zip: '11101' },
    { city: 'Jersey City, NJ', zip: '07302' },
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
    /* Match later words too ("york" -> New York), but not mid-word noise
       ("se" should not surface Jersey City). */
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
  const PROVIDERS = [
    { name: 'Harbor Health Chiropractic', detail: 'Chiropractic care · 0.8 mi', street: '218 West 79th Street', coords: [40.7829, -73.9787] },
    { name: 'Northstar Spine & Rehab', detail: 'Rehabilitation · 1.6 mi', street: '104 West 40th Street', coords: [40.7549, -73.984] },
    { name: 'The Motion Clinic', detail: 'Auto injury · 2.1 mi', street: '245 Tenth Avenue', coords: [40.7465, -74.0014] },
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

  const BOUNDS = () => L.latLngBounds(PROVIDERS.map((provider) => provider.coords));
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
    const markers = PROVIDERS.map((provider, index) => {
      const marker = L.marker(provider.coords, {
        icon: pin(index + 1, index === 0),
        title: provider.name,
        alt: provider.name,
      }).addTo(resultsMap);
      marker.bindPopup(`<strong>${provider.name}</strong><small>${provider.detail}</small>`);
      marker.on('click', () => markers.forEach((item, i) => item.setIcon(pin(i + 1, item === marker))));
      return marker;
    });
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
    L.control.zoom({ position: 'topright' }).addTo(profileMap);
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
    if (dialogAddress) dialogAddress.textContent = `${provider.street}, New York`;
  };

  const start = () => {
    if (typeof L === 'undefined') return;
    buildResultsMap();
    buildProfileMap();
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
