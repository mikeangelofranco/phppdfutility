const orbs = document.querySelectorAll('.orb');

document.addEventListener('mousemove', (event) => {
    const { innerWidth, innerHeight } = window;
    const x = (event.clientX / innerWidth - 0.5) * 2;
    const y = (event.clientY / innerHeight - 0.5) * 2;

    orbs.forEach((orb, index) => {
        const intensity = (index + 1) * 6;
        orb.style.transform = `translate(${x * intensity}px, ${y * intensity}px)`;
    });
});

const liftables = document.querySelectorAll('.card, .tile, .step, .stat');

liftables.forEach((item) => {
    item.addEventListener('mousemove', (event) => {
        const rect = item.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const xPercent = (x / rect.width - 0.5) * 8;
        const yPercent = (y / rect.height - 0.5) * 8;
        item.style.transform = `translateY(-3px) rotateX(${yPercent}deg) rotateY(${xPercent}deg)`;
        item.style.transition = 'transform 0.12s ease';
    });

    item.addEventListener('mouseleave', () => {
        item.style.transform = '';
        item.style.transition = 'transform 0.25s ease';
    });
});

const navLinks = document.querySelectorAll('.nav a');

const setActiveNav = () => {
    const fromTop = window.scrollY + 120;

    navLinks.forEach((link) => {
        const section = document.querySelector(link.getAttribute('href'));
        if (!section) return;

        const offsetTop = section.offsetTop;
        const offsetBottom = offsetTop + section.offsetHeight;

        if (fromTop >= offsetTop && fromTop < offsetBottom) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
};

window.addEventListener('scroll', setActiveNav);
setActiveNav();
