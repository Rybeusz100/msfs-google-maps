export default function toggleTopnav() {
    const sections = Array.from(document.getElementsByClassName('topnav-section'));

    sections.forEach((el) => {
        if (el.classList.contains('responsive')) {
            el.classList.remove('responsive');
        } else {
            el.classList.add('responsive');
        }
    });
}
