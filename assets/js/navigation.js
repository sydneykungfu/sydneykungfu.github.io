document.addEventListener('DOMContentLoaded', () => {
    fetch('/includes/navigation.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById('navigation-placeholder').innerHTML = data;

            // Add menu toggle functionality after navigation is loaded
            const menuToggle = document.getElementById('menu-toggle');
            const menu = document.getElementById('menu');
            const menuLinks = menu.querySelectorAll('a');

            menuToggle.addEventListener('click', () => {
                menu.classList.toggle('hidden');
            });

            menuLinks.forEach(link => {
                link.addEventListener('click', () => {
                    if (!menu.classList.contains('hidden')) {
                        menu.classList.add('hidden');
                    }
                });
            });
        })
        .catch(error => console.error('Error loading navigation:', error))
        .then(() => {
            // Dynamically set Home link based on path
            const homeLink = document.getElementById('home-link');
            const enrollLink = document.getElementById('enroll-link');
            const localClassLink = document.getElementById('local-class-link');
            const aboutSifuAngusLink = document.getElementById('about-sifu-angus-link');
            const classContentLink = document.getElementById('class-content-link');
            const contactLink = document.getElementById('contact-link');
            const choyleefutHistoryLink = document.getElementById('choyleefut-history-link');
            const faqLink = document.getElementById('faq-link');
            
            if (location.pathname.includes('/zh') || location.pathname.includes('/zh-CN')) {
                homeLink.href = 'index.html';
                enrollLink.href = 'enroll.html';
                localClassLink.href = 'index.html#schedule';
                aboutSifuAngusLink.href = 'about-sifu-angus.html';
                classContentLink.href = 'class-content.html';
                contactLink.href = 'index.html#contact';
                choyleefutHistoryLink.href = 'choyleefut-history.html';
                faqLink.href = 'index.html#faq';
            } else {
                homeLink.href = '/index.html';
                enrollLink.href = '/enroll.html';
                localClassLink.href = '/index.html#schedule';
                aboutSifuAngusLink.href = '/about-sifu-angus.html';
                classContentLink.href = '/class-content.html';
                contactLink.href = '/index.html#contact';
                choyleefutHistoryLink.href = '/choyleefut-history.html';
                faqLink.href = '/index.html#faq';
            }

        });
});
