(function () {
    var root = document.documentElement;
    var layer = "dusk";
    try { layer = localStorage.getItem("mori-layer") || "dusk"; } catch (e) {}
    root.dataset.layer = ["dusk", "wired", "moss", "ember"].indexOf(layer) > -1 ? layer : "dusk";
    var seen = false;
    try { seen = sessionStorage.getItem("mori-seen") === "1"; } catch (e) {}
    if (!seen) root.classList.add("is-booting");
    root.classList.add("has-js");
})();
