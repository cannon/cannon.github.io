
function lerp(v0, v1, t) {
    return v0*(1-t)+v1*t
}

function shuffleArray(array) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
    return array;
}

function HSVtoColor(h, s, v) {
    var r, g, b, i, f, p, q, t;
    if (arguments.length === 1) {
        s = h.s, v = h.v, h = h.h;
    }
    i = Math.floor(h * 6);
    f = h * 6 - i;
    p = v * (1 - s);
    q = v * (1 - f * s);
    t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
    }
    return "#"+("00"+Math.round(r * 255).toString(16)).substr(-2)+("00"+Math.round(g * 255).toString(16)).substr(-2)+("00"+Math.round(b * 255).toString(16)).substr(-2);
}

var CURTIME_OFFSET = 0;
var TIME_PAUSED = -1;

function curTime() {
    if (TIME_PAUSED > -1) {
        return TIME_PAUSED;
    }
    return (new Date().getTime())-CURTIME_OFFSET;
}

function pauseTime() {
    if (TIME_PAUSED > -1) {
        console.log("TIME ALREADY PAUSED");
    } else {
        TIME_PAUSED = curTime();
    }
}

function resumeTime() {
    if (TIME_PAUSED > -1) {
        CURTIME_OFFSET = (new Date().getTime())-TIME_PAUSED;
        TIME_PAUSED = -1;
    } else {
        console.log("TIME IS NOT PAUSED");
    }
}

function dist(x, y) {
    return Math.sqrt((x*x)+(y*y));
}

function distSq(x, y) {
    return (x*x)+(y*y);
}

function sign(x) {
    return x<0 ? -1:1;
}
