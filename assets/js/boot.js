(function () {
    var root = document.documentElement;
    var layer = "dusk";
    try { layer = localStorage.getItem("mori-layer") || "dusk"; } catch (e) {}
    root.dataset.layer = ["dusk", "wired", "moss", "ember"].indexOf(layer) > -1 ? layer : "dusk";
    var ranks = ["unranked", "bronze", "silver", "gold", "platinum", "diamond"];
    var want = (location.search.match(/[?&]rank=([a-z]+)/) || [])[1];
    if (ranks.indexOf(want) > -1 && want !== root.dataset.rank) {
        root.dataset.rank = want;
        root.dataset.rankPreview = "1";
    }
    var seen = false;
    try { seen = sessionStorage.getItem("mori-seen") === "1"; } catch (e) {}
    if (!seen) root.classList.add("is-booting");
    root.classList.add("has-js");
})();
