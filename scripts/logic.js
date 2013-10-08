/* logic.js
 * This is the script file loaded after the main page elements are initialized,
 * and governs the actual application logic rather than exporting functions for
 * use in other files.
 */

/*jslint browser: true, nomen: true */
/*global _, $, console, Mustache, notify, request, JSON */

var threads, vote, errcounter;
errcounter = 0; // counts number of failed connections to the nerdery servers.
threads = {};   // keeps track of the setIntervals that are created in this file.

/** Namespace `vote` 
 *  This object handles the persistence of a date which records when we last voted. It
 *  currently persists the date in a cookie for 2 days. 
 * 
 *     vote.allowed :: () -> IO String
 *         Determine if a vote is allowed. Return statuses are: "wrongDay" if it's not a
 *         weekday; "alreadyVoted" if the user already voted today; "ok" if it's okay for
 *         the user to vote.
 *     vote.getLast :: () -> IO String
 *         Recover the last string set by vote.set
 *     vote.getToday :: () -> IO String
 *         Recover the string corresponding to today in yyyy-mm-dd format, which allows 
 *         the string < operator to compare them semantically.
 *     vote.setLast :: Either String (Maybe Date) -> IO ()
 *         Set the vote string cookie, using yyyymmdd() to coerce undefineds and Dates.
 */
vote = (function () {
    "use strict";
    // Prepend "0" to x until x.length is n.
    function pad(x, n) {
        x = x.toString();
        return x.length < n ? x : pad("0" + x, n);
    }
    // This method formats a date into a string in YYYY-MM-DD format.
    function yyyymmdd(d) {
        return pad(d.getFullYear(), 4) + "-" + pad(d.getMonth() + 1, 2) + "-" + pad(d.getDate(), 2);
    }
    return {
        allowed: function allowed() {
            if (_.indexOf([1, 2, 3, 4, 5], new Date().getDay()) !== -1) {
                return "wrongDay";
            }
            return vote.getLast() < vote.getToday() ? "ok" : "alreadyVoted";
        },
        getLast: function getLast() {
            var cookies = {};
            _.each(document.cookie.split(/;\s*/g), function (x) {
                var i = x.indexOf("="), key = decodeURIComponent(x.slice(0, i));
                cookies[key] = decodeURIComponent(x.slice(i + 1));
            });
            return cookies.lastVote || "";
        },
        setLast: function setLast(date) {
            date = typeof date === "string" ? date : yyyymmdd(date || new Date());
            var t = new Date().getTime() + 2 * 24 * 60 * 60 * 1000; // 2 days in the future
            document.cookie = "lastVote=" + encodeURIComponent(date) + "; expires=" + new Date(t).toUTCString();
        }
    };
}());

// only use console.log if a console is active on the page
function log_debug() {
    "use strict";
    if (typeof console.log === "function") {
        console.log.apply(console, arguments);
    }
}

// Presentation logic: this function takes a valid data structure of the sort and updates
// documented in the challenge services, and updates the wantit/gotit views with sorted
// expressions of that data, caching the data if that is possible.
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


// This is a hash tracking thread; it supports IE7 which has no hashchange event, so 
// that back and forward buttons work with the application directly.
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

// This thread enables voting if you happen to leave the app open on a work computer
// after midnight.
threads.toggleVoting = setInterval(function () {
    "use strict";
    if (vote.allowed() === "ok") {
        $("div#body").addClass("vote");
    } else {
        $("div#body").removeClass("vote");
    }
}, 300);


// We try to load data from the localStorage cache if it's possible.
try {
    updateViews(JSON.parse(window.localStorage.voteCache));
} catch (e) {
    log_debug("error loading votes from vote cache", e);
}

/** refreshGamesList :: Maybe Callback -> IO ()
 * This function makes a request() out to the service, updates the list of available
 * games with updateViews(), and then returns control to the callback if it's defined,
 * as if that callback were given to request(). It also calls notify() on connection
 * errors, but does not retry them. 
 */
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
                log_debug("error loading votes from Nerdery server", e, e.message, data);
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
