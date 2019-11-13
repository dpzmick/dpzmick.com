function changeCSS(cssFile) {
    var oldlink = document.getElementById("theme-css");
    var parent = oldlink.parentNode;

    var newlink = document.createElement("link");
    newlink.setAttribute("rel", "stylesheet");
    newlink.setAttribute("type", "text/css");
    newlink.setAttribute("id", "theme-css");
    newlink.setAttribute("href", cssFile);

    oldlink.replaceWith(newlink);
}

function applyMode() {
    // assumes we put a mode in the link already
    var current = window.localStorage.getItem("theme");
    if (current === "dark") {
        changeCSS("/static/base16-tomorrow-night.css");
    }
    else {
        changeCSS("/static/base16-tomorrow.css");
    }
}

function switchModes() {
    var current = window.localStorage.getItem("theme");
    if (current === "dark") {
        current = "light";
    }
    else {
        current = "dark";
    }

    window.localStorage.setItem("theme", current);
    applyMode();
}

window.addEventListener("DOMContentLoaded", function() {
    var current = window.localStorage.getItem("theme");
    console.log(current);
    if (current == null) {
        window.localStorage.setItem("theme", "dark");
    }

    if (current !== "dark") { // dark mode is default
        applyMode();
    }

    var needjs = document.getElementsByClassName("need-js");
    for (var i = 0; i < needjs.length; i++) {
        needjs[i].style.display = 'block';
    }
}, false);

// with js disabled, this just loads dark mode
