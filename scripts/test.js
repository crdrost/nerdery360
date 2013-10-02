/* test.js
 * This file replaces request.js to provide a realistic offline environment 
 * where the system can be tested.
 */

var request = (function () {
    "use strict";
    // random time; about 1 in 50 should take more than 5000 ms.
    function randTime() {
        return Math.floor(300 * Math.tan(Math.PI * Math.random() / 2));
    }
    var games = [], id = 0,
        services = {
            "/checkKey": function (p) {
                return true;
            },
            "/getGames": function (p) {
                return games;
            },
            "/addVote": function (p) {
                var g = games.filter(function (x) {
                    return x.status === "wantit" && x.id === p.id.toString();
                });
                if (g.length !== 1) {
                    return false;
                } else {
                    g[0].votes = (parseInt(g[0].votes, 10) + 1).toString();
                    return true;
                }
            },
            "/addGame": function (p) {
                var k = id;
                id += 1;
                games.push({id: k.toString(), title: p.title, votes: "0", status: "wantit"});
            },
            "/setGotIt": function (p) {
                var g = games.filter(function (x) {
                    return x.status === "wantit" && x.id === p.id.toString();
                });
                if (g.length !== 1) {
                    return false;
                } else {
                    g[0].status = "gotit";
                    return true;
                }
            },
            "/clearGames": function (p) {
                games = [];
                return true;
            }
        };
    return function request(service, params, callback) {
        // 0 = outgoing trip, 1 = incoming trip
        var t0 = randTime(), t1 = randTime(),
            fail0 = Math.random() < 0.002, fail1 = Math.random() < 0.002;
        
        if (fail0) {
            // outgoing request was not received: no effect, response times out.
            setTimeout(function () {
                callback.call(params, "timeout");
            }, 10000);
        } else if (t0 + t1 > 10000 || fail1) {
            // effect takes place, but response times out after 10s.
            setTimeout(function () {
                services[service](params);
                setTimeout(function () {
                    callback.call(params, "timeout");
                }, 10000 - t0);
            }, t0);
        } else {
            setTimeout(function () {
                var data = services[service](params);
                setTimeout(function () {
                    callback.call(params, null, data);
                }, t1);
            }, t0);
        }
    };
}());