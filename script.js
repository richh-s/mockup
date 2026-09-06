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
document.querySelector('.account-button').addEventListener('click', () => { window.location.hash = 'account'; });
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
