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
        // matches the inline background set in <head>
        document.documentElement.style.backgroundColor = "#1d1f21";
    }
    else {
        changeCSS("/static/base16-tomorrow.css");
        document.documentElement.style.backgroundColor = "#ffffff";
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

function fmtBytes(n) {
    if (n >= 1024 * 1024) return (n / (1024 * 1024)).toFixed(1) + " MiB";
    if (n >= 1024) return (n / 1024).toFixed(1) + " KiB";
    return n + " B";
}

window.addEventListener("load", function() {
    // let loadEventEnd settle before reading it
    setTimeout(function() {
        var el = document.getElementById("perf-stats");
        if (!el || !window.performance || !performance.getEntriesByType) return;

        var nav = performance.getEntriesByType("navigation")[0];
        if (!nav) return;

        var resources = performance.getEntriesByType("resource");
        var bytes = nav.transferSize;
        var requests = 1;
        var cached = 0;
        for (var i = 0; i < resources.length; i++) {
            requests++;
            if (resources[i].transferSize > 0) {
                bytes += resources[i].transferSize;
            } else {
                cached++;
            }
        }

        var render = Math.round(nav.domContentLoadedEventEnd - nav.startTime);
        var load = Math.round(nav.loadEventEnd - nav.startTime);

        el.textContent = "rendered in " + render + " ms"
            + " / loaded in " + load + " ms"
            + " / " + fmtBytes(bytes) + " over the wire"
            + " / " + requests + " request" + (requests === 1 ? "" : "s")
            + (cached > 0 ? " (" + cached + " cached)" : "");
    }, 0);
});

window.addEventListener("DOMContentLoaded", function() {
    var current = window.localStorage.getItem("theme");
    if (current == null) {
        window.localStorage.setItem("theme", "dark");
    }

    if (current !== "dark") { // dark mode is default
        applyMode();
    }

    var needjs = document.getElementsByClassName("need-js");
    for (var i = 0; i < needjs.length; i++) {
        needjs[i].style.display = 'inline';
    }
}, false);

// with js disabled, this just loads dark mode
