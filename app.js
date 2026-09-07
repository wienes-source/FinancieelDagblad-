
// Kleine enhancement: markeer interne ankerlinks vloeiend en houd de site volledig statisch voor GitHub Pages.
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', () => document.body.classList.add('navigating'));
});
