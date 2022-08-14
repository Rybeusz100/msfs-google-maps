function topnavFunction() {
    var x = document.getElementById("topnav-id");
    if (x.className === "topnav-class") {
      x.className += " responsive";
    } 
    else {
      x.className = "topnav-class";
    }
}