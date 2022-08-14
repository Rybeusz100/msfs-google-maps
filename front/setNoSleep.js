let noSleep = new NoSleep()
let checkbox = document.getElementById('nosleep')
checkbox.addEventListener('change', function() {
if(this.checked) {
    noSleep.enable()
}
else {
    noSleep.disable()
}
})