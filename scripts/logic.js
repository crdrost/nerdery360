/* logic.js
 * This is the script file loaded after the main page elements are initialized,
 * and governs the actual application logic rather than exporting functions for
 * use in other files.
 */

/*jslint browser: true */
/*global notify, request, History, JSON */

// This is a hash tracking thread; it supports IE7 which has no hashchange
// event, so that back and forward buttons work with the application directly.
(function () {
    "use strict";
    var hash = "_"; // impossible value so that it always runs at start
    setInterval(function hashTrackerThread() {
        if (window.location.hash !== hash) {
            hash = window.location.hash;
            if ($(hash).hasClass("pane")) {
                $(".pane").addClass("hide");
                $(hash).removeClass("hide");
                $(".header .links a").removeClass("active");
                $(hash + "_link").addClass("active");
            }
        }
    }, 100);
}());

var test_data = [
    {"id": "1234","title": "Racecars","votes": "0","status": "gotit"},
    {"id": "123456","title": "Mega Man","votes": "0","status": "wantit"},
    {"id": "12","title": "Smashbros.","votes": "1","status": "gotit"},
    {"id": "1","title": "Smashbros. 2","votes": "3","status": "wantit"},
    {"id": "123457","title": "Blue Machine","votes": "2","status": "wantit"}
];

function updateViews(data) {
    "use strict";
    var collected_data, titles;
    // We do a data transform so that collected_data is a Mustache template
    // context, and so that the views are properly sorted when rendered.
    collected_data = {
        wantit: data.filter(function (x) { return x.status === "wantit"; }).sort(function (x, y) {
            // descending sort by the number of votes
            return parseInt(y.votes, 10) - parseInt(x.votes, 10);
        }),
        gotit: data.filter(function (x) { return x.status === "gotit"; }).sort(function (x, y) {
            // ascending sort by the title
            return x.title < y.title ? -1 : 1;
        })
    };
    // cache existing titles for the submit button's use
    titles = data.map(function (x) { return x.title.toLowerCase(); });
    $("#existing_titles").val(JSON.stringify(titles));
    $("#wantit, #gotit").map(function (n, pane) {
        $(".render", pane).html(Mustache.render($(".template", pane).html(), collected_data));
    });
}
updateViews(test_data);