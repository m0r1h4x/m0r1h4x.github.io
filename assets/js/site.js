(function () {
    "use strict";

    var root = document.documentElement;
    var view = document.getElementById("view");
    var still = window.matchMedia("(prefers-reduced-motion: reduce)");

    var BAYER = [
        0, 32, 8, 40, 2, 34, 10, 42, 48, 16, 56, 24, 50, 18, 58, 26,
        12, 44, 4, 36, 14, 46, 6, 38, 60, 28, 52, 20, 62, 30, 54, 22,
        3, 35, 11, 43, 1, 33, 9, 41, 51, 19, 59, 27, 49, 17, 57, 25,
        15, 47, 7, 39, 13, 45, 5, 37, 63, 31, 55, 23, 61, 29, 53, 21
    ].map(function (v) { return (v + 0.5) / 64; });

    function pack(hex) {
        var n = parseInt(hex.slice(1), 16);
        return (255 << 24 | (n & 255) << 16 | (n >> 8 & 255) << 8 | (n >> 16 & 255)) >>> 0;
    }

    function palette(list) {
        var out = {};
        Object.keys(list).forEach(function (key) {
            out[key] = Array.isArray(list[key]) ? list[key].map(function (pair) { return pair.map(pack); }) : pack(list[key]);
        });
        return out;
    }

    var PAL = {
        dusk: palette({
            sky: "#1b1b1e",
            glow: "#5b3a5e",
            glyph: "#b6af8e",
            disc: "#d6cfae",
            discShade: "#a3b59a",
            spark: "#e3a88e",
            ridges: [
                ["#56494d", "#b6af8e"],
                ["#3d3140", "#948774"],
                ["#2a2a2c", "#6a4a6c"],
                ["#232326", "#4a3550"],
                ["#1b1b1e", "#322934"]
            ],
            foot: "#5b3a5e",
            hot: "#e3a88e",
            veil: "#030a14",
            veilMid: "#175e96",
            veilEdge: "#9fd0ff"
        }),
        wired: palette({
            sky: "#030a14",
            glow: "#0c3052",
            glyph: "#3f8fd4",
            disc: "#9fd0ff",
            discShade: "#2f7fc4",
            spark: "#e0eeff",
            ridges: [
                ["#0c3052", "#4ea3ea"],
                ["#08233c", "#1d6fc4"],
                ["#061b2f", "#175e96"],
                ["#04111e", "#0c3052"],
                ["#030a14", "#08233c"]
            ],
            foot: "#0e3a66",
            hot: "#e0eeff",
            veil: "#1b1b1e",
            veilMid: "#5b3a5e",
            veilEdge: "#d6cfae"
        })
    };

    PAL.moss = palette({
        sky: "#121512",
        glow: "#2f4a34",
        glyph: "#9fb08a",
        disc: "#dfe3b8",
        discShade: "#8fb996",
        spark: "#e8c98a",
        ridges: [
            ["#3f5a44", "#b9c79a"],
            ["#2c4232", "#8fa67a"],
            ["#1f2f24", "#4f7354"],
            ["#182019", "#2f4a34"],
            ["#121512", "#223026"]
        ],
        foot: "#2f4a34",
        hot: "#e8c98a",
        veil: "#1a1210",
        veilMid: "#6b2f22",
        veilEdge: "#ffd9a0"
    });
    PAL.ember = palette({
        sky: "#1a1210",
        glow: "#6b2f22",
        glyph: "#d9a074",
        disc: "#ffd9a0",
        discShade: "#f08a4b",
        spark: "#ffe9c4",
        ridges: [
            ["#7a3b26", "#f0a868"],
            ["#5a2a1f", "#d07a48"],
            ["#3d1e18", "#9a4a30"],
            ["#2a1613", "#6b2f22"],
            ["#1a1210", "#3d1e18"]
        ],
        foot: "#6b2f22",
        hot: "#ffb070",
        veil: "#121512",
        veilMid: "#2f4a34",
        veilEdge: "#dfe3b8"
    });

    var MOTIF = { dusk: "ridges", wired: "blocks", moss: "pines", ember: "dunes" };
    var DISC = { ridges: [1, 0], blocks: [0.55, -0.05], pines: [0.6, -0.06], dunes: [1.75, 0.17] };
    var INK = { dusk: ["#b6af8e", "#e3a88e"], wired: ["#3f8fd4", "#e0eeff"], moss: ["#9fb08a", "#e8c98a"], ember: ["#d9a074", "#ffe9c4"] };

    function layer() { return PAL[root.dataset.layer] ? root.dataset.layer : "dusk"; }
    var RANKS = ["unranked", "bronze", "silver", "gold", "platinum", "diamond"];
    var TINT = { unranked: 0.16, bronze: 0.3, silver: 0.28, gold: 0.34, platinum: 0.34, diamond: 0.38 };
    var tiers = {}, lights = {}, tinted = {};

    function rank() { return RANKS.indexOf(root.dataset.rank) > -1 ? root.dataset.rank : "unranked"; }
    function tierHex(id) {
        if (!tiers[id]) {
            var hex = getComputedStyle(root).getPropertyValue("--tier-" + id).trim();
            tiers[id] = /^#[0-9a-f]{6}$/i.test(hex) ? hex : "#9a958a";
        }
        return tiers[id];
    }
    function lightHex(id) {
        if (!lights[id]) {
            var n = parseInt(tierHex(id).slice(1), 16), out = "#";
            [16, 8, 0].forEach(function (shift) {
                var v = n >> shift & 255;
                out += ("0" + Math.round(v + (255 - v) * 0.6).toString(16)).slice(-2);
            });
            lights[id] = out;
        }
        return lights[id];
    }
    function blend(a, b, k) {
        var r = (a & 255) + ((b & 255) - (a & 255)) * k;
        var g = (a >> 8 & 255) + ((b >> 8 & 255) - (a >> 8 & 255)) * k;
        var u = (a >> 16 & 255) + ((b >> 16 & 255) - (a >> 16 & 255)) * k;
        return (255 << 24 | u << 16 | g << 8 | r) >>> 0;
    }
    function pal() {
        var key = layer() + rank();
        if (!tinted[key]) {
            var base = PAL[layer()], tone = pack(tierHex(rank())), k = TINT[rank()], out = {};
            Object.keys(base).forEach(function (name) { out[name] = base[name]; });
            out.glow = blend(base.glow, tone, k * 0.6);
            out.disc = blend(base.disc, tone, k);
            out.discShade = blend(base.discShade, tone, k * 0.7);
            out.spark = blend(base.spark, tone, k);
            out.hot = blend(base.hot, tone, k);
            out.foot = blend(base.foot, tone, k * 0.5);
            out.ridges = base.ridges.map(function (pair, i) { return i ? pair : [pair[0], blend(pair[1], tone, k * 0.6)]; });
            tinted[key] = out;
        }
        return tinted[key];
    }

    function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }
    function sleep(ms) { return new Promise(function (done) { setTimeout(done, ms); }); }
    function hash(n) { var s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }
    function noise(x) {
        var i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
        return hash(i) * (1 - u) + hash(i + 1) * u;
    }
    function fbm(x) { return noise(x) * 0.6 + noise(x * 2.3 + 17) * 0.28 + noise(x * 5.1 + 43) * 0.12; }

    function shape(motif, i, u) {
        if (motif === "blocks") return hash(Math.floor(u * 2.2) + i * 7.3) * 0.75 + (hash(Math.floor(u * 6.6) + i * 3.1) > 0.7 ? 0.2 : 0);
        if (motif === "dunes") return 0.5 + 0.34 * Math.sin(u * 0.8 + i * 2.1) + 0.12 * Math.sin(u * 2.1 + i);
        if (motif === "pines") {
            var n = fbm(u) * 0.7;
            var k = u * (5 + i * 1.5), t = k - Math.floor(k);
            n += (1 - Math.abs(t * 2 - 1)) * (0.14 + hash(Math.floor(k) + i * 5.7) * 0.4);
            return n;
        }
        var r = fbm(u);
        return i === 0 ? 1 - Math.abs(r * 2 - 1) * 0.9 : r;
    }

    function windowAt(x, y, k) {
        return (x & 3) < 2 && (y & 3) < 2 && hash((x >> 2) * 13.1 + (y >> 2) * 7.7 + k) > 0.8;
    }

    var GLYPHS = "@#%&+=/:;<>[]{}0123456789abcdefhjklnrstxyz";

    function scramble(el, text, ms) {
        if (still.matches || !ms) { el.textContent = text; return Promise.resolve(); }
        return new Promise(function (done) {
            var start = performance.now();
            el.dataset.scrambling = "1";
            function frame(now) {
                var p = clamp((now - start) / ms, 0, 1);
                var solved = Math.floor(p * text.length);
                var out = text.slice(0, solved);
                for (var i = solved; i < text.length; i++) {
                    out += text[i] === " " ? " " : GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
                }
                el.textContent = out;
                if (p < 1 && el.isConnected) requestAnimationFrame(frame);
                else { el.textContent = text; delete el.dataset.scrambling; done(); }
            }
            requestAnimationFrame(frame);
        });
    }

    function Scene(hero) {
        this.hero = hero;
        this.canvas = hero.querySelector("[data-scene]");
        this.ctx = this.canvas.getContext("2d");
        this.glyphs = document.createElement("canvas");
        this.glyphs.className = "scene glyphs";
        this.glyphs.setAttribute("aria-hidden", "true");
        this.canvas.after(this.glyphs);
        this.gctx = this.glyphs.getContext("2d");
        this.say = hero.querySelector("[data-say]");
        this.lines = JSON.parse(hero.dataset.lines || "[]");
        this.stream = JSON.parse(hero.dataset.stream || "[]");
        this.at = 0;
        this.alive = true;
        this.visible = true;
        this.last = 0;
        this.lastMask = -1000;
        this.glitchUntil = 0;
        this.bands = new Int16Array(64);
        this.px = 0.5;
        this.tx = 0.5;
        this.ty = 0.5;
        this.mx = 0;
        this.my = 0;
        this.lit = 0;
        this.hover = false;
        this.fontReady = false;
        this.resize = this.resize.bind(this);
        this.frame = this.frame.bind(this);
        this.move = this.move.bind(this);
        var self = this;
        window.addEventListener("resize", this.resize);
        hero.addEventListener("pointermove", this.move);
        hero.addEventListener("pointerleave", function () { self.hover = false; });
        this.watch = new IntersectionObserver(function (entries) {
            self.visible = entries[0].isIntersecting;
            if (self.visible) self.kick();
        });
        this.watch.observe(hero);
        this.resize();
        document.fonts.load('16px "Departure Mono"').then(function () {
            self.fontReady = true;
            self.lastMask = -1000;
            if (still.matches) self.draw(0);
        });
        if (still.matches) this.draw(0);
        else {
            this.kick();
            if (this.lines.length > 1) this.timer = setInterval(function () { self.next(); }, 5600);
        }
    }

    Scene.prototype.kick = function () {
        if (this.running || !this.alive || still.matches) return;
        this.running = true;
        requestAnimationFrame(this.frame);
    };

    Scene.prototype.move = function (event) {
        var box = this.hero.getBoundingClientRect();
        this.tx = clamp((event.clientX - box.left) / box.width, 0, 1);
        this.ty = clamp((event.clientY - box.top) / box.height, 0, 1);
        this.hover = event.pointerType !== "touch";
    };

    Scene.prototype.resize = function () {
        var cw = this.hero.clientWidth, ch = this.hero.clientHeight;
        if (!cw || !ch) return;
        var scale = cw < 720 ? 2 : cw > 1800 ? 4 : 3;
        this.scale = scale;
        this.cw = cw;
        this.ch = ch;
        this.W = Math.ceil(cw / scale);
        this.H = Math.ceil(ch / scale);
        this.canvas.width = this.W;
        this.canvas.height = this.H;
        this.dpr = Math.min(window.devicePixelRatio || 1, 2);
        this.glyphs.width = Math.round(cw * this.dpr);
        this.glyphs.height = Math.round(ch * this.dpr);
        this.img = this.ctx.createImageData(this.W, this.H);
        this.buf = new Uint32Array(this.img.data.buffer);
        this.heights = [];
        for (var i = 0; i < 5; i++) this.heights.push(new Float32Array(this.W));
        this.env = new Float32Array(this.W);
        this.narrow = cw < 860;
        this.lanes = [];
        var fs = this.narrow ? 22 : 33;
        this.fs = fs;
        var y = -ch * 0.52, k = 0;
        while (y < cw * 0.9) {
            var text = this.stream.length ? this.stream[(k * 5 + 3) % this.stream.length] : "0101";
            this.lanes.push({ y: y, text: text + "   ", speed: 5 + hash(k + 9) * 12, off: hash(k + 2) * 900 });
            y += fs * (1.7 + hash(k + 5) * 2.2);
            k++;
        }
        this.lastMask = -1000;
        if (still.matches) this.draw(0);
    };

    Scene.prototype.drawGlyphs = function (t) {
        var g = this.gctx, cw = this.cw, ch = this.ch, fs = this.fs, s = this.scale, env = this.env, W = this.W;
        g.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
        g.globalCompositeOperation = "source-over";
        g.clearRect(0, 0, cw, ch);
        if (!this.fontReady) return;
        var ang = 1.05, cos = Math.cos(ang), sin = Math.sin(ang), narrow = this.narrow, x;
        g.save();
        var ink = INK[layer()], cold = ink[0], warm = rank() === "unranked" ? ink[1] : tierHex(rank());
        var hotLane = Math.floor(t / 3.2) % this.lanes.length;
        g.font = fs + 'px "Departure Mono"';
        g.textBaseline = "middle";
        g.textAlign = "center";
        g.translate(0, ch);
        g.rotate(-ang);
        var step = fs * 1.2, span = cw * cos + ch * sin + fs * 2;
        for (var i = 0; i < this.lanes.length; i++) {
            var lane = this.lanes[i], len = lane.text.length;
            var shift = (t * lane.speed + lane.off) % (step * len);
            g.fillStyle = i === hotLane ? warm : cold;
            for (var c = 0, lx = -shift; lx < span; lx += step, c++) {
                var chr = lane.text[c % len];
                if (chr === " ") continue;
                var sx = lx * cos + lane.y * sin, sy = ch - lx * sin + lane.y * cos;
                if (sx < -fs || sx > cw + fs || sy < -fs || sy > ch + fs) continue;
                if (narrow ? sy > ch * 0.17 : sx < cw * 0.56 && sy > ch * 0.3) continue;
                g.fillText(chr, lx, lane.y);
            }
        }
        g.restore();
        g.globalCompositeOperation = "destination-out";
        g.beginPath();
        g.moveTo(0, ch);
        for (x = 0; x < W; x++) {
            g.lineTo(x * s, env[x] * s);
            g.lineTo((x + 1) * s, env[x] * s);
        }
        g.lineTo(cw, ch);
        g.closePath();
        g.fill();
        g.beginPath();
        g.arc(this.cx * s, this.cy * s, this.r * s + s, 0, 7);
        g.fill();
    };

    Scene.prototype.draw = function (t) {
        var W = this.W, H = this.H, buf = this.buf, hs = this.heights, P = pal();
        if (!buf) return;
        this.px += (this.tx - this.px) * 0.05;
        var par = (this.px - 0.5) * 2, i, x, y, narrow = this.narrow, motif = MOTIF[layer()], city = motif === "blocks", disc = DISC[motif];
        for (i = 0; i < 5; i++) {
            var left = narrow ? 0.16 + i * 0.024 : 0.6 + i * 0.075, right = narrow ? 0.08 + i * 0.04 : 0.17 + i * 0.15;
            var amp = H * (narrow ? 0.04 - i * 0.005 : 0.11 - i * 0.014) * (city ? 1.8 : 1), freq = (1.5 + i * 0.8) / W;
            var drift = (city ? 0 : t * (0.012 + i * 0.012) + par * (0.05 + i * 0.07)) + i * 31.7;
            var row = hs[i];
            for (x = 0; x < W; x++) {
                var f = Math.pow(x / W, 1.7);
                var n = shape(motif, i, x * freq * 4 + drift);
                row[x] = (H * (left + (right - left) * f) - amp * n * (0.5 + f));
            }
        }
        var env = this.env;
        for (x = 0; x < W; x++) env[x] = Math.min(hs[0][x], hs[1][x], hs[2][x], hs[3][x], hs[4][x]);
        var cx = W * (narrow ? 0.7 : 0.6), cy = H * ((narrow ? 0.075 : 0.2) + disc[1] * (narrow ? 0.15 : 1)), r = Math.min(W, H) * (narrow ? 0.13 : 0.115) * (narrow ? Math.min(disc[0], 1.2) : disc[0]), r2 = r * r, g2 = r * r * 14;
        this.cx = cx; this.cy = cy; this.r = r;
        if (t - this.lastMask > 0.07) { this.drawGlyphs(t); this.lastMask = t; }
        var glitch = performance.now() < this.glitchUntil, bands = this.bands;
        this.lit += ((this.hover ? 1 : 0) - this.lit) * 0.08;
        this.mx += (this.tx * W - this.mx) * 0.16;
        this.my += (this.ty * H - this.my) * 0.16;
        var lit = this.lit, mx = this.mx, my = this.my, R2 = W * W * 0.02, add = 0;
        var ridges = P.ridges;
        for (y = 0; y < H; y++) {
            var off = glitch ? bands[(y >> 3) & 63] : 0, by = (y & 7) * 8, dy = y - cy, yn = y / H;
            for (x = 0; x < W; x++) {
                var xs = x + off;
                if (xs < 0) xs += W; else if (xs >= W) xs -= W;
                var b = BAYER[by + (xs & 7)], color = 0, hit = -1;
                for (i = 4; i >= 0; i--) { if (y >= hs[i][xs]) { hit = i; break; } }
                var xn = xs / W;
                if (lit > 0.01) {
                    var q = 1 / (1 + ((xs - mx) * (xs - mx) + (y - my) * (y - my)) / R2);
                    add = q * q * lit * 0.6 * (narrow ? 1 : clamp(xn / 0.55, 0.35, 1));
                }
                if (hit < 0) {
                    var dx = xs - cx, d2 = dx * dx + dy * dy;
                    if (d2 < r2) {
                        var sx = dx + r * 0.42, sy = dy + r * 0.3;
                        color = (sx * sx + sy * sy) / r2 * 0.62 > b + 0.18 ? P.discShade : P.disc;
                    } else {
                        var glow = add * 0.7 + Math.exp(-d2 / g2) * 0.7 + xn * 0.1 + noise(xs * 0.03 + t * 0.05) * 0.06 * xn;
                        color = glow > b ? P.glow : P.sky;
                    }
                } else {
                    var depth = y - hs[hit][xs];
                    var light = (1 - hit * 0.17) * Math.exp(-depth / (H * (0.07 + hit * 0.03)));
                    var fog = noise(xs * 0.018 + t * 0.07 + hit * 9) * 0.3;
                    var dim = narrow ? clamp((0.28 - yn) / 0.08, 0, 1) * clamp(xn / 0.6 + 0.3, 0.3, 1) : clamp((xn - 0.3) / 0.36, 0, 1);
                    if (add > 0.02) dim = Math.max(dim, add * 2.4);
                    var v = (light * 0.85 + fog * light) * (0.06 + dim * 0.94) + add * 0.5;
                    var pair = ridges[dim > b * 0.9 ? hit : hit > 2 ? 4 : hit + 2];
                    color = v > b ? pair[1] : pair[0];
                    if (city && hit < 3 && depth > 2 && dim > 0.5 && windowAt(xs, y, hit)) color = ridges[0][1];
                    if (glitch && off && b > 0.93) color = P.spark;
                }
                buf[y * W + x] = color;
            }
        }
        this.ctx.putImageData(this.img, 0, 0);
    };

    Scene.prototype.frame = function (now) {
        if (!this.alive || !this.visible || document.hidden) { this.running = false; return; }
        if (now - this.last > 40) {
            this.last = now;
            this.draw(now / 1000);
        }
        requestAnimationFrame(this.frame);
    };

    Scene.prototype.glitch = function (ms) {
        for (var i = 0; i < 64; i++) this.bands[i] = hash(i + performance.now()) > 0.62 ? Math.round((hash(i * 3 + performance.now()) - 0.5) * 36) : 0;
        this.glitchUntil = performance.now() + ms;
    };

    Scene.prototype.next = function () {
        if (!this.visible || document.hidden || !this.say) return;
        this.at = (this.at + 1) % this.lines.length;
        var spans = this.say.children, line = this.lines[this.at];
        this.glitch(260);
        for (var i = 0; i < spans.length; i++) scramble(spans[i], line[i] || "", 380 + i * 140);
    };

    Scene.prototype.repaint = function () {
        this.lastMask = -1000;
        if (still.matches) this.draw(0);
    };

    Scene.prototype.stop = function () {
        this.alive = false;
        clearInterval(this.timer);
        this.watch.disconnect();
        window.removeEventListener("resize", this.resize);
    };

    var veil = {
        canvas: document.querySelector("[data-veil]"),
        label: document.querySelector("[data-veil-label]"),
        p: 0,
        setup: function () {
            this.ctx = this.canvas.getContext("2d");
            this.big = document.createElement("b");
            this.small = document.createElement("span");
            this.label.append(this.big, this.small);
        },
        size: function () {
            var cell = window.innerWidth < 720 ? 5 : 7;
            var W = Math.ceil(window.innerWidth / cell), H = Math.ceil(window.innerHeight / cell);
            if (W !== this.W || H !== this.H) {
                this.W = this.canvas.width = W;
                this.H = this.canvas.height = H;
                this.img = this.ctx.createImageData(W, H);
                this.buf = new Uint32Array(this.img.data.buffer);
                this.band = new Float32Array(H);
                this.tone = new Float32Array(H);
                this.shift = new Int16Array(H);
            }
        },
        shuffle: function () {
            var H = this.H, y = 0, seed = Math.random() * 1000;
            while (y < H) {
                var tall = 1 + Math.floor(hash(seed + y) * hash(seed + y * 7) * 14);
                var level = hash(seed + y * 3), tone = hash(seed + y * 11), shift = Math.round((hash(seed + y * 13) - 0.5) * 24);
                for (var k = 0; k < tall && y < H; k++, y++) {
                    this.band[y] = level;
                    this.tone[y] = tone;
                    this.shift[y] = shift;
                }
            }
        },
        paint: function (p) {
            var W = this.W, H = this.H, buf = this.buf, P = pal();
            var base = P.sky, mid = P.glow, edge = P.disc, reach = p * 1.08;
            for (var y = 0; y < H; y++) {
                var band = this.band[y] * 0.5, tone = this.tone[y] * 0.34, sh = this.shift[y], by = (y & 7) * 8;
                for (var x = 0; x < W; x++) {
                    var b = BAYER[by + ((x + sh) & 7)];
                    var d = reach - (b * 0.5 + band);
                    buf[y * W + x] = d < 0 ? 0 : d < 0.05 ? edge : d < 0.16 ? (b > 0.45 ? mid : base) : (b < tone ? mid : base);
                }
            }
            this.ctx.putImageData(this.img, 0, 0);
        },
        run: function (from, to, ms) {
            var self = this;
            this.size();
            this.shuffle();
            this.canvas.classList.add("is-on");
            if (still.matches) {
                this.p = to;
                if (to <= 0) this.canvas.classList.remove("is-on");
                else this.paint(to);
                return Promise.resolve();
            }
            return new Promise(function (done) {
                var start = performance.now();
                function frame(now) {
                    var k = clamp((now - start) / ms, 0, 1);
                    var e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
                    self.p = from + (to - from) * e;
                    self.paint(self.p);
                    if (k < 1) requestAnimationFrame(frame);
                    else {
                        if (to <= 0) self.canvas.classList.remove("is-on");
                        done();
                    }
                }
                requestAnimationFrame(frame);
            });
        },
        say: function (big, small) {
            this.small.textContent = small || "";
            this.label.classList.add("is-on");
            return scramble(this.big, big, 220);
        },
        hush: function () {
            this.label.classList.remove("is-on");
        }
    };

    var TAU = Math.PI * 2;
    function frac(v) { return v - Math.floor(v); }
    function dot(g, x, y, a, color, s) {
        if (a <= 0.02) return;
        g.globalAlpha = a > 1 ? 1 : a;
        g.fillStyle = color;
        g.fillRect(Math.round(x), Math.round(y), s || 1, s || 1);
    }
    function glint(g, x, y, a, color) {
        dot(g, x, y, a, color);
        dot(g, x - 1, y, a * 0.45, color);
        dot(g, x + 1, y, a * 0.45, color);
        dot(g, x, y - 1, a * 0.45, color);
        dot(g, x, y + 1, a * 0.45, color);
    }
    function rim(u, W, H, m) {
        var w = W - m * 2 - 1, h = H - m * 2 - 1, d = frac(u) * (w + h) * 2;
        if (d < w) return [m + d, m];
        d -= w;
        if (d < h) return [m + w, m + d];
        d -= h;
        if (d < w) return [m + w - d, m + h];
        return [m, m + h - (d - w)];
    }

    var AIR = {
        unranked: function (g, W, H, t, c) {
            for (var i = 0; i < 14; i++) {
                var x = frac(hash(i) + t * 0.004 * (0.4 + hash(i + 20))) * W + Math.sin(t * 0.3 + i) * 3;
                var y = frac(hash(i + 50) - t * 0.003 * (0.5 + hash(i + 70))) * H;
                dot(g, x, y, 0.1 + 0.16 * (0.5 + 0.5 * Math.sin(t * (0.5 + hash(i + 9)) + i * 4)), c.tier);
            }
        },
        bronze: function (g, W, H, t, c) {
            var n = W < 260 ? 16 : 30;
            for (var i = 0; i < n; i++) {
                var p = frac(t * (0.05 + hash(i + 3) * 0.07) + hash(i + 11));
                var x = hash(i) * W + Math.sin(p * 7 + i) * 5 + p * 10;
                var y = H - p * H * (0.3 + hash(i + 31) * 0.55);
                if (hash(i + Math.floor(t * 9) * 1.7) < 0.12) continue;
                dot(g, x, y, Math.pow(1 - p, 1.4) * 0.85, p < 0.3 ? c.hot : c.tier, p < 0.12 && hash(i + 5) > 0.6 ? 2 : 1);
            }
        },
        silver: function (g, W, H, t, c) {
            var n = W < 260 ? 14 : 24;
            for (var i = 0; i < n; i++) {
                var p = frac(t * (0.018 + hash(i + 3) * 0.02) + hash(i + 11));
                var y = p * (H + 8) - 4, x = frac(hash(i) + p * 0.12) * W + Math.sin(t * 0.4 + i) * 2;
                var tw = Math.sin(t * (0.9 + hash(i + 7)) + i * 5);
                if (tw > 0.9) glint(g, x, y, 0.75, c.hot);
                else dot(g, x, y, 0.2 + 0.25 * (tw * 0.5 + 0.5), c.tier);
            }
        },
        gold: function (g, W, H, t, c) {
            var n = W < 260 ? 9 : 16;
            for (var i = 0; i < n; i++) {
                var x = hash(i) * W + (noise(t * 0.11 + i * 7.3) - 0.5) * W * 0.22;
                var y = hash(i + 40) * H + (noise(t * 0.13 + i * 3.9 + 50) - 0.5) * H * 0.3;
                var a = Math.max(0, Math.sin(t * (0.5 + hash(i + 8) * 0.7) + i * 3));
                a *= a;
                dot(g, x - 1, y - 1, a * 0.12, c.tier, 3);
                dot(g, x, y, a * 0.9, a > 0.7 ? c.hot : c.tier);
            }
        },
        platinum: function (g, W, H, t, c) {
            var n = W < 260 ? 10 : 16;
            for (var i = 0; i < n; i++) {
                var p = frac(t * (0.015 + hash(i + 3) * 0.02) + hash(i + 11));
                var tw = Math.sin(t * (1 + hash(i + 7)) + i * 5);
                if (tw > 0.75) glint(g, hash(i) * W, H - p * H, 0.55 * (1 - p), c.tier);
                else dot(g, hash(i) * W, H - p * H, 0.3 * (1 - p), c.tier);
            }
        },
        diamond: function (g, W, H, t, c) {
            var hues = [c.tier, tierHex("platinum"), tierHex("silver"), c.hot], i;
            var n = W < 260 ? 12 : 22;
            for (i = 0; i < n; i++) {
                var beat = t * (0.25 + hash(i + 7) * 0.3) + hash(i + 2) * 9, tw = Math.sin(beat * TAU);
                var seat = Math.floor(beat), x = hash(i + seat * 3.3) * W, y = hash(i * 1.9 + seat * 5.1) * H;
                var color = hues[(i + seat) & 3];
                if (tw > 0.55) glint(g, x, y, (tw - 0.55) * 1.9, color);
                else if (tw > 0) dot(g, x, y, tw * 0.5, color);
            }
            var cycle = t / 6.5, p = frac(cycle) / 0.16, seed = Math.floor(cycle);
            if (p < 1) {
                var sx = (0.25 + hash(seed) * 0.75) * W, sy = hash(seed + 9) * H * 0.3, run = W * 0.3;
                for (i = 0; i < 14; i++) {
                    var q = p - i * 0.012;
                    if (q < 0) break;
                    dot(g, sx - q * run, sy + q * run * 0.45, (1 - i / 14) * (1 - p) * 0.9, i ? c.tier : c.hot);
                }
            }
        }
    };

    var AURA = {
        unranked: function (g, W, H, t, c) {
            if (frac(t / 2.6) < 0.55) dot(g, 2, (H >> 1) - 1, 0.7, c.tier, 2);
        },
        bronze: function (g, W, H, t, c) {
            for (var i = 0; i < 28; i++) {
                var beat = t * (0.6 + hash(i + 3) * 0.7) + hash(i + 11), p = frac(beat);
                var x = 5 + hash(i + Math.floor(beat) * 2.3) * (W - 11) + Math.sin(p * 5 + i) * 1.2;
                var y = H - 4 - p * (H - 5) * (0.5 + hash(i + 21) * 0.5);
                dot(g, x, y, (1 - p) * 0.95, p < 0.28 ? c.hot : c.tier);
            }
        },
        silver: function (g, W, H, t, c) {
            var i, at;
            for (i = 0; i < 9; i++) {
                at = rim(t * 0.16 - i / ((W + H - 10) * 2), W, H, 2);
                if (i) dot(g, at[0], at[1], 0.7 - i * 0.08, c.tier);
                else glint(g, at[0], at[1], 1, c.hot);
            }
            for (i = 0; i < 3; i++) {
                var beat = t * 0.4 + i * 0.37, tw = Math.sin(frac(beat) * Math.PI), seat = Math.floor(beat);
                if (tw > 0.5) glint(g, 2 + hash(i + seat * 2.7) * (W - 5), hash(i * 3 + seat) > 0.5 ? 2 : H - 3, (tw - 0.5) * 1.4, c.tier);
            }
        },
        gold: function (g, W, H, t, c) {
            var cx = (W - 1) / 2, cy = (H - 1) / 2, rx = W / 2 - 2, ry = H / 2 - 2;
            for (var i = 0; i < 6; i++) {
                var speed = 0.7 + hash(i + 4) * 0.5, a = t * speed + i * TAU / 6, wob = 1 + Math.sin(t * 0.8 + i * 2) * 0.08;
                for (var k = 0; k < 4; k++) {
                    var b = a - k * 0.11;
                    dot(g, cx + Math.cos(b) * rx * wob, cy + Math.sin(b) * ry * wob, (0.9 - k * 0.24) * (0.55 + 0.45 * Math.sin(t * 2 + i)), k ? c.tier : c.hot);
                }
            }
        },
        platinum: function (g, W, H, t, c) {
            for (var h = 0; h < 2; h++) {
                for (var i = 0; i < 14; i++) {
                    var at = rim(t * 0.3 + h * 0.5 - i / ((W + H - 10) * 2), W, H, 2);
                    dot(g, at[0], at[1], 1 - i / 14, i < 2 ? c.hot : c.tier);
                }
            }
        },
        diamond: function (g, W, H, t, c) {
            var hues = [c.tier, tierHex("platinum"), tierHex("silver"), c.hot];
            var cx = (W - 1) / 2, cy = (H - 1) / 2, rx = W / 2 - 3, ry = H / 2 - 2;
            for (var i = 0; i < 6; i++) {
                var dir = i & 1 ? -1 : 1, a = t * 0.8 * dir + i * TAU / 6, lean = (i & 1 ? 0.35 : -0.35);
                var x = cx + Math.cos(a) * rx, y = cy + Math.sin(a) * ry + Math.cos(a) * lean * ry;
                y = clamp(y, 1, H - 2);
                var tw = 0.5 + 0.5 * Math.sin(t * 3 + i * 1.7), color = hues[(i + Math.floor(t * 0.6)) & 3];
                if (tw > 0.7) glint(g, x, y, tw, color);
                else dot(g, x, y, 0.4 + tw * 0.5, color);
            }
        }
    };

    var air = {
        page: document.querySelector("[data-air]"),
        word: document.querySelector(".top .status-rank"),
        on: false,
        last: 0,
        setup: function () {
            if (this.page) this.pctx = this.page.getContext("2d");
            if (this.word) {
                this.ring = document.createElement("canvas");
                this.ring.className = "aura";
                this.ring.setAttribute("aria-hidden", "true");
                this.word.append(this.ring);
                this.rctx = this.ring.getContext("2d");
            }
            var self = this;
            window.addEventListener("resize", function () { self.size(); });
            document.addEventListener("visibilitychange", function () { self.kick(); });
            document.fonts.ready.then(function () { self.size(); });
            still.addEventListener("change", function () { self.size(); self.kick(); });
            this.size();
            this.kick();
        },
        size: function () {
            if (this.page) {
                var cell = window.innerWidth < 720 ? 2 : 3;
                this.page.width = Math.max(1, Math.ceil(this.page.clientWidth / cell));
                this.page.height = Math.max(1, Math.ceil(this.page.clientHeight / cell));
            }
            if (this.ring) {
                this.ring.width = Math.max(1, Math.ceil(this.ring.clientWidth / 2));
                this.ring.height = Math.max(1, Math.ceil(this.ring.clientHeight / 2));
            }
        },
        kick: function () {
            if (this.on || still.matches || document.hidden) return;
            this.on = true;
            requestAnimationFrame(this.frame);
        },
        frame: function (now) {
            if (still.matches || document.hidden) { air.on = false; return; }
            if (now - air.last > 33) {
                air.last = now;
                var t = now / 1000, id = rank(), c = { tier: tierHex(id), hot: lightHex(id) };
                if (air.pctx) {
                    air.pctx.clearRect(0, 0, air.page.width, air.page.height);
                    AIR[id](air.pctx, air.page.width, air.page.height, t, c);
                }
                if (air.rctx) {
                    air.rctx.clearRect(0, 0, air.ring.width, air.ring.height);
                    AURA[id](air.rctx, air.ring.width, air.ring.height, t, c);
                }
            }
            requestAnimationFrame(air.frame);
        }
    };

    function setRankPreview(scope) {
        if (!root.dataset.rankPreview) return;
        var id = rank();
        scope.querySelectorAll(".status, .menu-status, .readout, .totals").forEach(function (el) {
            RANKS.forEach(function (r) { el.classList.remove("tier-" + r); });
            el.classList.add("tier-" + id);
        });
        scope.querySelectorAll(".status-rank, .readout-rank").forEach(function (el) {
            if (el.firstChild && el.firstChild.nodeType === 3) el.firstChild.nodeValue = id;
        });
    }

    function seedOf(text) {
        var n = 0;
        for (var i = 0; i < text.length; i++) n = (n * 31 + text.charCodeAt(i)) % 9973;
        return n * 0.37;
    }

    function paintBand(band) {
        var canvas = band.canvas, cw = canvas.clientWidth, ch = canvas.clientHeight;
        if (!cw || !ch) return;
        var s = cw < 720 ? 2 : 3, W = Math.ceil(cw / s), H = Math.ceil(ch / s), P = pal(), motif = MOTIF[layer()], disc = DISC[motif];
        canvas.width = W;
        canvas.height = H;
        var ctx = canvas.getContext("2d"), img = ctx.createImageData(W, H), buf = new Uint32Array(img.data.buffer);
        var foot = band.foot, n = foot ? 3 : 4, hs = [], seed = band.seed, i, x, y;
        for (i = 0; i < n; i++) {
            var row = new Float32Array(W);
            for (x = 0; x < W; x++) {
                var f = Math.pow(x / W, 1.6);
                if (foot) row[x] = H * (0.34 + i * 0.26) - H * 0.5 * (shape(motif, i + 1, x * (1.6 + i * 1.3) / W * 5 + seed + i * 13) - 0.5);
                else row[x] = H * (0.66 + i * 0.1 + (0.1 + i * 0.2 - 0.66 - i * 0.1) * f) - H * (0.24 - i * 0.04) * shape(motif, i, x * (1.5 + i * 0.8) / W * 4 + seed + i * 31.7) * (0.5 + f);
            }
            hs.push(row);
        }
        var cx = W * 0.8, cy = H * (0.32 + disc[1] * 1.3), r = H * 0.17 * disc[0], r2 = r * r, g2 = r2 * 16, order = [0, 1, 2, 4], dens = [0.3, 0.62, 2];
        for (y = 0; y < H; y++) {
            for (x = 0; x < W; x++) {
                var b = BAYER[(y & 7) * 8 + (x & 7)], hit = -1, color;
                for (i = n - 1; i >= 0; i--) { if (y >= hs[i][x]) { hit = i; break; } }
                if (foot) color = hit >= 0 && dens[hit] > b ? P.foot : 0;
                else if (hit < 0) {
                    var dx = x - cx, dy = y - cy, d2 = dx * dx + dy * dy;
                    if (d2 < r2) {
                        var sx = dx + r * 0.42, sy = dy + r * 0.3;
                        color = (sx * sx + sy * sy) / r2 * 0.62 > b + 0.18 ? P.discShade : P.disc;
                    } else color = Math.exp(-d2 / g2) * 0.7 + x / W * 0.1 > b ? P.glow : P.sky;
                } else {
                    var k = order[hit], xn = x / W, dim = clamp((xn - 0.36) / 0.4, 0, 1);
                    var light = (1 - k * 0.17) * Math.exp(-(y - hs[hit][x]) / (H * (0.16 + k * 0.05)));
                    var pair = P.ridges[dim > b * 0.9 ? k : 4];
                    color = light * 0.85 * (0.06 + dim * 0.94) > b ? pair[1] : pair[0];
                    if (motif === "blocks" && hit < 3 && y - hs[hit][x] > 2 && dim > 0.2 && windowAt(x, y, hit)) color = P.ridges[0][1];
                }
                buf[y * W + x] = color;
            }
        }
        ctx.putImageData(img, 0, 0);
    }

    var bands = [];
    function addBand(canvas, seed, foot) {
        var band = { canvas: canvas, seed: seed, foot: foot };
        bands.push(band);
        paintBand(band);
    }
    function repaintBands() {
        bands = bands.filter(function (band) { return band.canvas.isConnected; });
        bands.forEach(paintBand);
    }
    var figure = { canvas: document.querySelector("[data-figure]"), image: null };

    function paintFigure() {
        var canvas = figure.canvas;
        if (!canvas) return;
        var img = figure.image;
        if (!img) {
            img = figure.image = new Image();
            img.onload = paintFigure;
            img.src = canvas.dataset.src;
            return;
        }
        var cw = canvas.clientWidth, ch = canvas.clientHeight;
        if (!img.naturalWidth || !cw || !ch) return;
        var s = cw < 720 ? 2 : 3, W = Math.ceil(cw / s), H = Math.ceil(ch / s), P = pal();
        canvas.width = W;
        canvas.height = H;
        var ctx = canvas.getContext("2d", { willReadFrequently: true });
        var iw = Math.round(H * img.naturalWidth / img.naturalHeight), x0 = iw > W * 0.8 ? Math.round((W - iw) / 2) : Math.round(W * 0.94 - iw);
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, W, H);
        ctx.drawImage(img, x0, 0, iw, H);
        var data = ctx.getImageData(0, 0, W, H), px = data.data, out = new Uint32Array(px.buffer);
        var ramp = [P.sky, P.ridges[4][1], P.ridges[3][1], P.ridges[2][1], P.ridges[1][1], P.ridges[0][1]];
        var tone = [0.03, 0.7];
        for (var y = 0; y < H; y++) {
            var fy = clamp(y / H / 0.5, 0, 1);
            for (var x = 0; x < W; x++) {
                var o = (y * W + x) * 4, u = (x - x0) / iw;
                var fx = clamp(u / 0.28, 0, 1) * clamp((1 - u) / 0.12, 0, 1);
                var l = Math.pow(clamp(((px[o] * 0.299 + px[o + 1] * 0.587 + px[o + 2] * 0.114) / 255 - tone[0]) / (tone[1] - tone[0]), 0, 1), 0.9) * fx * fy * 4.6;
                var base = Math.floor(l);
                out[y * W + x] = ramp[Math.min(5, l - base > BAYER[(y & 7) * 8 + (x & 7)] ? base + 1 : base)];
            }
        }
        ctx.putImageData(data, 0, 0);
    }

    var bandTimer = 0;
    window.addEventListener("resize", function () {
        clearTimeout(bandTimer);
        bandTimer = setTimeout(function () {
            repaintBands();
            paintFigure();
        }, 120);
    });

    function ditherImage(fig) {
        var img = fig.querySelector("img"), canvas = fig.querySelector("canvas");
        if (!img.naturalWidth) return;
        var W = Math.min(Math.round(img.naturalWidth / 2), 380), H = Math.round(W * img.naturalHeight / img.naturalWidth), P = pal();
        canvas.width = W;
        canvas.height = H;
        var ctx = canvas.getContext("2d", { willReadFrequently: true });
        ctx.drawImage(img, 0, 0, W, H);
        var data;
        try { data = ctx.getImageData(0, 0, W, H); } catch (e) { fig.classList.add("is-raw"); return; }
        var px = data.data, out = new Uint32Array(px.buffer), ramp = [P.sky, P.glow, P.ridges[1][1], P.disc];
        for (var y = 0; y < H; y++) {
            for (var x = 0; x < W; x++) {
                var o = (y * W + x) * 4;
                var l = Math.pow((px[o] * 0.299 + px[o + 1] * 0.587 + px[o + 2] * 0.114) / 255, 0.9) * 3;
                var base = Math.floor(l);
                out[y * W + x] = ramp[Math.min(3, l - base > BAYER[(y & 7) * 8 + (x & 7)] ? base + 1 : base)];
            }
        }
        ctx.putImageData(data, 0, 0);
    }

    function setImages() {
        view.querySelectorAll(".prose img").forEach(function (img) {
            if (img.closest(".dither") || /^https?:/.test(img.getAttribute("src")) && new URL(img.src).origin !== location.origin) return;
            var fig = document.createElement("button");
            fig.type = "button";
            fig.className = "dither";
            fig.title = "Show the original image";
            var canvas = document.createElement("canvas");
            canvas.setAttribute("role", "img");
            canvas.setAttribute("aria-label", img.alt || "");
            img.replaceWith(fig);
            fig.append(canvas, img);
            fig.addEventListener("click", function () {
                var raw = fig.classList.toggle("is-raw");
                fig.title = raw ? "Show the dithered image" : "Show the original image";
            });
            if (img.complete) ditherImage(fig);
            else img.addEventListener("load", function () { ditherImage(fig); });
        });
    }

    function repaintImages() {
        view.querySelectorAll(".dither").forEach(ditherImage);
    }

    var progress = document.querySelector("[data-progress]");
    function setProgress() {
        if (!progress) return;
        var room = document.documentElement.scrollHeight - window.innerHeight;
        var on = room > 200 && view.querySelector(".post .prose");
        progress.style.width = on ? clamp(window.scrollY / room, 0, 1) * 100 + "%" : "0";
    }
    window.addEventListener("scroll", setProgress, { passive: true });

    var scene = null;
    var busy = false;
    var cache = new Map();

    function setDays(scope) {
        scope.querySelectorAll("[data-day]").forEach(function (el) {
            var started = Date.parse(el.dataset.started + "T00:00:00");
            if (isNaN(started)) return;
            el.textContent = Math.max(0, Math.floor((Date.now() - started) / 86400000));
        });
    }

    function setNav() {
        var path = location.pathname;
        document.querySelectorAll("[data-nav]").forEach(function (a) {
            if (path.indexOf(a.dataset.nav) === 0) a.setAttribute("aria-current", "page");
            else a.removeAttribute("aria-current");
        });
    }

    function setFilters() {
        var box = view.querySelector("[data-filters]");
        if (!box) return;
        var items = view.querySelectorAll(".entry");
        var years = view.querySelectorAll(".year");
        var none = view.querySelector("[data-none]");
        var q = new URLSearchParams(location.search);
        var state = { format: q.get("format") || "", topic: q.get("topic") || "" };
        function apply() {
            var shown = 0;
            items.forEach(function (el) {
                var topics = (el.dataset.topics || "").split(" ");
                var ok = (!state.format || el.dataset.format === state.format) && (!state.topic || topics.indexOf(state.topic) > -1);
                el.hidden = !ok;
                if (ok) shown++;
            });
            years.forEach(function (y) { y.hidden = !y.querySelector(".entry:not([hidden])"); });
            if (none) none.hidden = shown > 0;
            box.querySelectorAll("[data-filter]").forEach(function (b) {
                var kind = b.dataset.filter;
                var on = kind === "all" ? !state.format && !state.topic : state[kind] === b.dataset.value;
                b.setAttribute("aria-pressed", String(on));
            });
            var p = new URLSearchParams();
            if (state.format) p.set("format", state.format);
            if (state.topic) p.set("topic", state.topic);
            var s = p.toString();
            history.replaceState(null, "", location.pathname + (s ? "?" + s : ""));
        }
        box.addEventListener("click", function (event) {
            var b = event.target.closest("[data-filter]");
            if (!b) return;
            state.format = b.dataset.filter === "format" ? b.dataset.value : "";
            state.topic = b.dataset.filter === "topic" ? b.dataset.value : "";
            apply();
        });
        box.hidden = false;
        apply();
    }

    function initPage(animate) {
        if (scene) { scene.stop(); scene = null; }
        var hero = view.querySelector("[data-hero]");
        if (hero) scene = new Scene(hero);
        var banner = view.querySelector("[data-banner]");
        if (banner) addBand(banner, seedOf(location.pathname), false);
        setDays(view);
        setRankPreview(view);
        setNav();
        setFilters();
        setImages();
        setProgress();
        if (animate) {
            view.querySelectorAll("[data-scramble]").forEach(function (el) { scramble(el, el.textContent, 520); });
        }
    }

    function load(url) {
        if (!cache.has(url)) {
            cache.set(url, fetch(url, { credentials: "same-origin" }).then(function (res) {
                if (!res.ok && res.status !== 404) throw new Error(String(res.status));
                return res.text();
            }).catch(function (err) { cache.delete(url); throw err; }));
        }
        return cache.get(url);
    }

    function nameOf(url) {
        var path = new URL(url, location.href).pathname.replace(/\/+$/, "");
        return path ? path : "/home";
    }

    function go(url, push) {
        if (busy) return;
        busy = true;
        closeMenu();
        var target = new URL(url, location.href);
        var page = load(target.pathname + target.search);
        if (!still.matches) view.classList.add("is-tearing");
        var covered = veil.run(0, 1, 300).then(function () { return veil.say(nameOf(url), ""); });
        Promise.all([page, covered]).then(function (got) {
            var doc = new DOMParser().parseFromString(got[0], "text/html");
            var next = doc.getElementById("view");
            if (!next) throw new Error("no view");
            view.innerHTML = next.innerHTML;
            document.title = doc.title;
            if (push) history.pushState(null, "", target.href);
            view.classList.remove("is-tearing");
            initPage(true);
            var anchor = target.hash ? document.getElementById(target.hash.slice(1)) : null;
            if (anchor) anchor.scrollIntoView();
            else window.scrollTo(0, 0);
            veil.hush();
            if (!still.matches) {
                view.classList.add("is-landing");
                setTimeout(function () { view.classList.remove("is-landing"); }, 380);
            }
            return veil.run(1, 0, 380);
        }).then(function () {
            busy = false;
            view.focus({ preventScroll: true });
        }).catch(function () {
            location.href = target.href;
        });
    }

    function internal(a) {
        if (!a || a.target || a.hasAttribute("download") || a.hasAttribute("data-native")) return false;
        if (a.origin !== location.origin) return false;
        if (/\.(xml|txt|png|svg|json|pdf)$/.test(a.pathname)) return false;
        return true;
    }

    document.addEventListener("click", function (event) {
        if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        var a = event.target.closest("a[href]");
        if (!internal(a)) return;
        if (a.pathname === location.pathname && a.search === location.search) {
            if (a.hash) return;
            event.preventDefault();
            window.scrollTo({ top: 0, behavior: still.matches ? "auto" : "smooth" });
            return;
        }
        event.preventDefault();
        go(a.href, true);
    });

    document.addEventListener("pointerover", function (event) {
        var a = event.target.closest && event.target.closest("a[href]");
        if (internal(a) && a.pathname !== location.pathname) load(a.pathname + a.search).catch(function () {});
    });

    var here = location.pathname + location.search;
    window.addEventListener("popstate", function () {
        var now = location.pathname + location.search;
        if (now === here) return;
        here = now;
        go(location.href, false);
    });
    var push = history.pushState;
    history.pushState = function () {
        push.apply(history, arguments);
        here = location.pathname + location.search;
    };

    var LAYERS = ["dusk", "wired", "moss", "ember"];

    function setLayerButton() {
        var now = root.dataset.layer;
        document.querySelectorAll("[data-set-layer]").forEach(function (b) {
            b.setAttribute("aria-pressed", String(b.dataset.setLayer === now));
        });
    }

    function setLayer(next) {
        if (busy || next === root.dataset.layer || LAYERS.indexOf(next) < 0) return;
        busy = true;
        closeMenu();
        if (!still.matches) view.classList.add("is-tearing");
        veil.run(0, 1, 300).then(function () { return veil.say(next, "layer"); }).then(function () { return sleep(still.matches ? 0 : 140); }).then(function () {
            root.dataset.layer = next;
            try { localStorage.setItem("mori-layer", next); } catch (e) {}
            setLayerButton();
            if (scene) scene.repaint();
            repaintBands();
            repaintImages();
            paintFigure();
            view.classList.remove("is-tearing");
            veil.hush();
            veil.shuffle();
            veil.paint(1);
            return veil.run(1, 0, 420);
        }).then(function () { busy = false; });
    }

    document.addEventListener("click", function (event) {
        var b = event.target.closest("[data-set-layer]");
        if (b) setLayer(b.dataset.setLayer);
    });

    var menu = document.querySelector("[data-menu]");
    var menuButton = document.querySelector("[data-menu-button]");
    var menuSky = null;

    function setInert(on) {
        view.inert = on;
        var foot = document.querySelector(".foot");
        if (foot) foot.inert = on;
    }

    function closeMenu() {
        if (!menu || menu.hidden) return;
        menu.hidden = true;
        setInert(false);
        root.classList.remove("menu-open");
        menuButton.setAttribute("aria-expanded", "false");
        menuButton.setAttribute("aria-label", "Open menu");
    }

    function openMenu() {
        menu.hidden = false;
        setInert(true);
        root.classList.add("menu-open");
        menuButton.setAttribute("aria-expanded", "true");
        menuButton.setAttribute("aria-label", "Close menu");
        var path = location.pathname;
        menu.querySelectorAll("[data-menu-link]").forEach(function (a) {
            var on = a.dataset.menuLink === "/" ? path === "/" : path.indexOf(a.dataset.menuLink) === 0;
            if (on) a.setAttribute("aria-current", "page");
            else a.removeAttribute("aria-current");
        });
        if (!menuSky) {
            menuSky = menu.querySelector("[data-menu-sky]");
            addBand(menuSky, 7.7, false);
        } else repaintBands();
        menu.querySelector("a").focus({ preventScroll: true });
    }

    if (menuButton) {
        menuButton.addEventListener("click", function () {
            if (menu.hidden) openMenu();
            else closeMenu();
        });
        menu.addEventListener("click", function (event) {
            if (event.target.closest("a")) closeMenu();
        });
        window.matchMedia("(min-width: 861px)").addEventListener("change", closeMenu);
    }

    function boot() {
        try { sessionStorage.setItem("mori-seen", "1"); } catch (e) {}
        if (!root.classList.contains("is-booting")) return;
        if (still.matches) { root.classList.remove("is-booting"); return; }
        busy = true;
        veil.size();
        veil.shuffle();
        veil.canvas.classList.add("is-on");
        veil.paint(1);
        root.classList.remove("is-booting");
        var status = document.querySelector(".status");
        var line = status ? status.textContent.replace(/\s+/g, " ").trim() : "";
        var skipped = false, wake = null;
        function skip() { skipped = true; if (wake) wake(); }
        window.addEventListener("pointerdown", skip, { once: true });
        window.addEventListener("keydown", skip, { once: true });
        function wait(ms) {
            if (skipped) return Promise.resolve();
            return new Promise(function (done) { wake = done; setTimeout(done, ms); });
        }
        veil.small.textContent = "";
        veil.label.classList.add("is-on");
        scramble(veil.big, "m0r1h4x", 520)
            .then(function () { return wait(380); })
            .then(function () { veil.small.textContent = line; return skipped ? null : scramble(veil.big, "mori", 360); })
            .then(function () { return wait(620); })
            .then(function () {
                veil.hush();
                if (scene) scene.glitch(420);
                view.classList.add("is-landing");
                setTimeout(function () { view.classList.remove("is-landing"); }, 380);
                return veil.run(1, 0, 620);
            })
            .then(function () {
                busy = false;
                window.removeEventListener("pointerdown", skip);
                window.removeEventListener("keydown", skip);
            });
    }

    document.addEventListener("pointerover", function (event) {
        var a = event.target.closest && event.target.closest("[data-nav], .block-head a, .foot-links a");
        if (!a || a.dataset.scrambling || a.contains(event.relatedTarget) || event.pointerType === "touch") return;
        scramble(a, a.textContent, 240);
    });

    var keysOn = true;
    try { keysOn = localStorage.getItem("mori-keys") !== "off"; } catch (e) {}
    var keysButton = document.querySelector("[data-keys]");
    function setKeysButton() {
        if (keysButton) keysButton.textContent = keysOn ? "Turn keys off" : "Turn keys on";
    }
    if (keysButton) {
        keysButton.addEventListener("click", function () {
            keysOn = !keysOn;
            try { localStorage.setItem("mori-keys", keysOn ? "on" : "off"); } catch (e) {}
            setKeysButton();
        });
        setKeysButton();
    }

    document.addEventListener("keydown", function (event) {
        if (event.metaKey || event.ctrlKey || event.altKey || busy) return;
        if (event.target.closest && event.target.closest("input, textarea, select, [contenteditable]")) return;
        var key = event.key.toLowerCase(), links = document.querySelectorAll("[data-nav]"), to = null;
        if (key === "escape") { closeMenu(); return; }
        if (!keysOn) return;
        if (key >= "1" && key <= "4") to = links[Number(key) - 1];
        else if (key === "h") to = document.querySelector(".mark");
        else if (key === "l") { setLayer(LAYERS[(LAYERS.indexOf(layer()) + 1) % LAYERS.length]); return; }
        if (to && to.pathname !== location.pathname) go(to.href, true);
    });

    veil.setup();
    var skyline = document.querySelector("[data-skyline]");
    if (skyline) addBand(skyline, 4.2, true);
    paintFigure();
    setDays(document);
    setRankPreview(document);
    air.setup();
    setLayerButton();
    initPage(false);
    boot();
})();
