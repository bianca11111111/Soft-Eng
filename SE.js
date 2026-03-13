const card = document.querySelector('.login-card');

function animateEntry() {
    if (!card) return;
    card.classList.add('animate-entry');
}

function shakeCard() {
    if (!card) return;

    card.classList.remove('shake');
    card.offsetWidth;
    card.classList.add('shake');

    card.addEventListener('animationend', () => {
        card.classList.remove('shake');
    }, { once: true });
}

function animateDashboard() {
    const sidebar = document.querySelector('.sidebar');
    const header = document.querySelector('.header-bar');
    const content = document.querySelector('.dashboard-content');

    if (!sidebar || !header || !content) return;

    window.requestAnimationFrame(() => {
        sidebar.classList.add('animate-in');
        header.classList.add('animate-in');
        content.classList.add('animate-in');
    });
}

window.animateEntry = animateEntry;
window.shakeCard = shakeCard;
window.animateDashboard = animateDashboard;

if (document.body.classList.contains('dashboard')) {
    animateDashboard();
}
