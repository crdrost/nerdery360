/* request.js provides a global object `handle` for requests to be handled by,
 * and a global method `request` to make a request to The Nerdery's web service.
 * It also sets an interval which monitors how many requests are currently
 * underway and, if the answer is greater than 0, displays a loading animation.
 */

/*jslint browser: true */

var handle = {}, request, fakeLoad;


request = (function () { // scope bracket for loading, randomName.
    "use strict";
    // number of current open requests.
    var loading = 0;
    fakeLoad = function (x) {
        loading += x;
    };
    setInterval(function checkLoading() {
        if (loading > 0) {
            document.getElementById("ajax_loading").style.visibility = "visible";
        } else {
            document.getElementById("ajax_loading").style.visibility = "hidden";
        }
    }, 250);

    // names on handle[] are given by this randomName picker. It needs to be an
    // ECMAScript identifier and there needs to be enough of them to not
    // generate many birthday collisions; I've assumed 52^3 is enough for this.
    function randomName() {
        var i, s = "",
            alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
        for (i = 0; i < 6; i += 1) {
            s += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
        }
        return s;
    }

    /** request(string endpoint, object params, function callback)
     *    Issues a request to The Nerdery's web service with this API key, and
     *    registers a new handler on the `handle` object which will service that
     *    request. The params object is mandatory and will be filled with the
     *    appropriate `callback` and `apiKey`; inside the callback `this` is set to
     *    `params`; the spec is `callback(boolean success, ? data)`, a failure will
     *    be registered if the script takes longer than 10 seconds to load.
     *
     *    Services which can be requested are documented in the Javascript Code
     *    Challenge document; the endpoints from there are used literally.
     */

    return function (endpoint, params, callback) {
        var key, name = randomName(), paramStrs = [], url, fn, element;
        // format the object into a URL string
        params.apiKey = '2d66904252fefc15b8a83a19a3ef37d7';
        params.callback = 'handle.' + name;
        for (key in params) {
            if (params.hasOwnProperty(key)) {
                paramStrs.push(encodeURIComponent(key) + "=" + encodeURIComponent(params[key]));
            }
        }
        url = 'http://js.nrd.mn/challenge' + endpoint + "?" + paramStrs.join("&");

        // set the handler and its timeout
        while (handle[name] !== undefined) {
            name = randomName();
        }
        fn = handle[name] = function (data) {
            delete handle[name];
            loading -= 1;
            callback.call(params, null, data);
        };
        setTimeout(function () {
            if (handle[name] === fn) {
                delete handle[name];
                loading -= 1;
                callback.call(params, "timed out");
            }
        }, 10 * 1000);

        // attach the script call and exit.
        element = document.createElement('script');
        element.setAttribute('src', url);
        document.body.appendChild(element);
        loading += 1;
    };
}());