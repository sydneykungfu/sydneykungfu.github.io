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
        .catch(error => console.error('Error loading navigation:', error));
});
