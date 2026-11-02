'use strict';

const WHATSAPP = '77079010382';
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

/* ---------- Header: scroll state, burger, active link ---------- */
const header = $('#header');
const nav = $('#nav');
const burger = $('#burger');

window.addEventListener('scroll', () => header.classList.toggle('scrolled', scrollY > 20), { passive: true });

burger.addEventListener('click', () => {
  burger.classList.toggle('open');
  nav.classList.toggle('open');
});
$$('a', nav).forEach(a => a.addEventListener('click', () => {
  burger.classList.remove('open');
  nav.classList.remove('open');
}));

const sections = $$('main section[id]');
const links = $$('a', nav);
const spy = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      links.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + e.target.id));
    }
  });
}, { rootMargin: '-45% 0px -50% 0px' });
sections.forEach(s => spy.observe(s));

/* ---------- Reveal on scroll ---------- */
const revealObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('in');
      revealObs.unobserve(e.target);
    }
  });
}, { threshold: 0.12 });
$$('.reveal').forEach((el, i) => {
  el.style.transitionDelay = (i % 4) * 70 + 'ms';
  revealObs.observe(el);
});

/* ---------- Gallery: filter + lightbox ---------- */
const filters = $('#filters');
const items = $$('.g-item');

filters.addEventListener('click', e => {
  const chip = e.target.closest('.chip');
  if (!chip) return;
  $$('.chip', filters).forEach(c => c.classList.remove('active'));
  chip.classList.add('active');
  const f = chip.dataset.filter;
  items.forEach(it => {
    const show = f === 'all' || it.dataset.cat === f;
    it.classList.toggle('hide', !show);
    if (show) {
      it.classList.remove('pop');
      void it.offsetWidth;
      it.classList.add('pop');
    }
  });
});

const lightbox = document.createElement('div');
lightbox.className = 'lightbox';
document.body.appendChild(lightbox);
lightbox.addEventListener('click', () => lightbox.classList.remove('open'));
document.addEventListener('keydown', e => { if (e.key === 'Escape') lightbox.classList.remove('open'); });

items.forEach(it => it.addEventListener('click', () => {
  const img = $('img', it);
  if (!img) return;
  lightbox.innerHTML = '';
  const big = new Image();
  big.src = img.src;
  big.alt = img.alt;
  lightbox.appendChild(big);
  lightbox.classList.add('open');
}));

/* ---------- Booking: calendar ---------- */
const MONTHS = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
const calTitle = $('#calTitle');
const calDays = $('#calDays');
const dateField = $('#dateField');
const timesBox = $('#times');

const today = new Date();
today.setHours(0, 0, 0, 0);
let view = new Date(today.getFullYear(), today.getMonth(), 1);
let selectedDate = null;
let selectedTime = null;

function renderCalendar() {
  calTitle.textContent = `${MONTHS[view.getMonth()]} ${view.getFullYear()}`;
  calDays.innerHTML = '';

  const first = new Date(view.getFullYear(), view.getMonth(), 1);
  const offset = (first.getDay() + 6) % 7; // Monday first
  const total = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();

  for (let i = 0; i < offset; i++) {
    const s = document.createElement('span');
    s.className = 'empty';
    calDays.appendChild(s);
  }
  for (let d = 1; d <= total; d++) {
    const date = new Date(view.getFullYear(), view.getMonth(), d);
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = d;
    if (date < today) b.disabled = true;
    if (+date === +today) b.classList.add('today');
    if (selectedDate && +date === +selectedDate) b.classList.add('selected');
    b.addEventListener('click', () => {
      selectedDate = date;
      dateField.value = date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
      dateField.closest('.field').classList.remove('error');
      renderCalendar();
    });
    calDays.appendChild(b);
  }
  $('#prevMonth').disabled = view <= new Date(today.getFullYear(), today.getMonth(), 1);
}

$('#prevMonth').addEventListener('click', () => { view.setMonth(view.getMonth() - 1); renderCalendar(); });
$('#nextMonth').addEventListener('click', () => { view.setMonth(view.getMonth() + 1); renderCalendar(); });

/* ---------- Booking: time slots (9:00 - 17:00) + own variant ---------- */
const customTimeEl = $('#customTime');
['09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00'].forEach(t => {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'time';
  b.textContent = t;
  b.addEventListener('click', () => {
    $$('.time', timesBox).forEach(x => x.classList.remove('selected'));
    b.classList.add('selected');
    selectedTime = t;
    customTimeEl.value = '';
    customTimeEl.closest('.field').classList.remove('error');
  });
  timesBox.appendChild(b);
});

customTimeEl.addEventListener('input', () => {
  if (customTimeEl.value.trim()) {
    selectedTime = null;
    $$('.time', timesBox).forEach(x => x.classList.remove('selected'));
  }
  customTimeEl.closest('.field').classList.remove('error');
});

/* ---------- Booking: submit -> WhatsApp ---------- */
const form = $('#bookingForm');
const msg = $('#formMsg');
const nameEl = $('#name');
const phoneEl = $('#phone');
const serviceEl = $('#service');

phoneEl.addEventListener('input', () => {
  phoneEl.value = phoneEl.value.replace(/[^\d+\s()-]/g, '');
});

function setError(el, bad) {
  el.closest('.field').classList.toggle('error', bad);
  return bad;
}

form.addEventListener('submit', e => {
  e.preventDefault();
  msg.className = 'form-msg';

  const digits = phoneEl.value.replace(/\D/g, '');
  const bad = [
    setError(nameEl, nameEl.value.trim().length < 2),
    setError(phoneEl, digits.length < 10),
    setError(serviceEl, !serviceEl.value),
    setError(dateField, !selectedDate)
  ].some(Boolean);

  if (bad) {
    msg.textContent = 'Пожалуйста, заполните все поля.';
    msg.classList.add('err');
    return;
  }
  const timeValue = customTimeEl.value.trim() || selectedTime;
  if (!timeValue) {
    setError(customTimeEl, true);
    msg.textContent = 'Выберите время из списка или напишите своё.';
    msg.classList.add('err');
    return;
  }

  const text =
    `Здравствуйте! Хочу записаться в AIDANA NAIL-MASTER.\n` +
    `Имя: ${nameEl.value.trim()}\n` +
    `Телефон: ${phoneEl.value.trim()}\n` +
    `Услуга: ${serviceEl.value}\n` +
    `Дата: ${dateField.value}\n` +
    `Время: ${timeValue}`;

  window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');

  msg.textContent = 'Спасибо! Открываем WhatsApp для подтверждения записи ♡';
  msg.classList.add('ok');
  form.reset();
  selectedDate = null;
  selectedTime = null;
  customTimeEl.value = '';
  $$('.time', timesBox).forEach(x => x.classList.remove('selected'));
  renderCalendar();
});

[nameEl, phoneEl, serviceEl].forEach(el =>
  el.addEventListener('input', () => el.closest('.field').classList.remove('error'))
);

renderCalendar();
