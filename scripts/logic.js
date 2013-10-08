/* logic.js
 * This is the script file loaded after the main page elements are initialized,
 * and governs the actual application logic rather than exporting functions for
 * use in other files.
 */

/*jslint browser: true */
/*global $, console, Mustache, notify, request, JSON */

// only use console.log if a console is active on the page
function log_debug() {
    "use strict";
    if (typeof console.log === "function") {
        console.log.apply(console, arguments);
    }
}

var threads = {}; // keeps track of the setIntervals that have been created

// This is a hash tracking thread; it supports IE7 which has no hashchange
// event, so that back and forward buttons work with the application directly.
(function () {
    "use strict";
    var hash = "_"; // impossible value so that it always runs at start
    threads.hashTracker = setInterval(function hashTrackerThread() {
        if (window.location.hash !== hash) {
            hash = window.location.hash || "#wantit";
            if ($(hash).hasClass("pane")) {
                $(".pane").addClass("hide");
                $(hash).removeClass("hide");
                $(".header .links a").removeClass("active");
                $(hash + "_link").addClass("active");
            }
        }
    }, 100);
}());

// returns document.cookie as an associative array
function cookies() {
    "use strict";
    var out = {};
    _.each(document.cookie.split(/;\s*/g), function (x) {
        var i = x.indexOf("="), key = decodeURIComponent(x.slice(0, i));
        out[key] = decodeURIComponent(x.slice(i + 1));
    });
    return out;
}

// String representing whether the user is allowed to vote right now.
// In order to be able to vote, it needs to be Mon-Fri local time, and the
// stored last vote must either not exist or be in the past. The vote is stored
// in cookies, so that this method works with IE7.
function canVote() {
    "use strict";
    var c;
    if (_.indexOf([1, 2, 3, 4, 5], new Date().getDay()) === -1) {
        return "wrongDay";
    } else {
        c = cookies();
        return (typeof c.lastVote !== "string" || c.lastVote < yyyymmdd()) ? "ok" : "alreadyVoted";
    }
}

// thread to enable voting if you happen to leave the app open on a work
// computer after midnight.
threads.toggleVoting = setInterval(function () {
    "use strict";
    if (canVote() === "ok") {
        $("div#body").addClass("vote");
    } else {
        $("div#body").removeClass("vote");
    }
}, 100);

// Presentation logic: this function takes a valid data structure and updates 
// the wantit/gotit views with sorted expressions of that data, caching the data
// if that is possible.
function updateViews(data) {
    "use strict";
    var collected_data, titles;
    try {
        if (typeof window.localStorage === "object") {
            window.localStorage.voteCache = JSON.stringify(data);
        }
    } catch (e) {
        log_debug("error updating localStorage", e);
    }
    
    // We do a data transform so that collected_data is a Mustache template
    // context, and so that the views are properly sorted when rendered.
    collected_data = {
        wantit: _.filter(data, function (x) { return x.status === "wantit"; }).sort(function (x, y) {
            // descending sort by the number of votes
            return parseInt(y.votes, 10) - parseInt(x.votes, 10);
        }),
        gotit: _.filter(data, function (x) { return x.status === "gotit"; }).sort(function (x, y) {
            // ascending sort by the title
            return x.title < y.title ? -1 : 1;
        })
    };
    // cache existing titles for the submit button's use
    titles = _.map(data, function (x) { return x.title.toLowerCase(); });
    $("#existing_titles").val(JSON.stringify(titles));
    _.each(["wantit", "gotit"], function (s) {
        var pane = document.getElementById(s);
        $(".render", pane).html(Mustache.render($(".template", pane).html(), collected_data));
        _.each($(".render li", pane), function (x, n) {
            x.id = pane.id + "_" + collected_data[pane.id][n];
        });
        if (collected_data[pane.id].length === 0) {
            $(pane).addClass("empty");
        } else {
            $(pane).removeClass("empty");
        }
    });
}

// load data from cache
try {
    updateViews(JSON.parse(window.localStorage.voteCache));
} catch (e) {
    log_debug("error loading votes from vote cache", e);
}
var errcounter = 0;

function refreshGamesList(cb) {
    "use strict";
    function getGames(err, data) {
        if (err || data === false) {
            errcounter += 1;
            notify("Error: couldn't connect to the Nerdery server. (tries: " + errcounter + ")");
        } else {
            if (errcounter !== 0) {
                notify("Nerdery connection re-established.");
                errcounter = 0;
            }
            try {
                updateViews(data);
            } catch (e) {
                log_debug("error loading votes from Nerdery server", e.message, data);
                notify("Nerdery sent an invalid data structure.");
            }
        }
        if (typeof cb === "function") {
            cb.apply(this, arguments);
        }
    }
    request("/getGames", {}, getGames);
}

// load games initially & regularly

refreshGamesList();
threads.getGames = setInterval(refreshGamesList, 1000);

/*
// test for presentation logic
updateViews([
    {"id": "1234", "title": "BioShock Infinite", "votes": "0", "status": "gotit"},
    {"id": "123456", "title": "Devil May Cry", "votes": "0", "status": "wantit"},
    {"id": "12", "title": "Tomb Raider", "votes": "1", "status": "gotit"},
    {"id": "1", "title": "Skulls of the Shogun", "votes": "3", "status": "wantit"},
    {"id": "123457", "title": "Terraria", "votes": "2", "status": "wantit"}
]);
*/
