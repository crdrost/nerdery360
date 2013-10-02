
var storage = {
    set: function storage_set(key, val) {
        var t = new Date().getTime();
        if (typeof window.localStorage === "object") {
            window.localStorage[key] = val;
        } else {
            document.cookie = encodeURIComponent(key) + "=" + encodeURIComponent(JSON.stringify(val));
        }
    },
    get: function storage_get(key) {
        var db = {};
        if (typeof window.localStorage === "object") {
            return window.localStorage[key];
        } else {
            document.cookie.split(/;\s*/g).forEach(function (x) {
                var i = x.indexOf("="),
                    key = decodeURIComponent(x.slice(0, i));
                out[key] = decodeURIComponent(x.slice(i + 1));
            });
            return db[key];
        }
    });
    }
};
