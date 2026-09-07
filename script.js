const el = document.getElementById('today');
if (el) {
  const d = new Date();
  el.textContent = new Intl.DateTimeFormat('nl-NL', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  }).format(d);
}
