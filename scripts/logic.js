/* logic.js
 * This is the script file loaded after the main page elements are initialized,
 * and governs the actual application logic rather than exporting functions for
 * use in other files.
 */

/*jslint browser: true */
/*global notify, request, History, JSON */

// This is a hash tracking thread; it supports IE7 which has no hashchange
// event, so that back and forward buttons work with the application directly.
(function (onhashchange, runAtStart) {
    "use strict"
    var hash = runAtStart ? "_" : window.location.hash;
    setTimeout(function hashChangeTracker() {
        if (window.location.hash !== hash) {
            hash = window.location.hash;
            onhashchange();
        }
        setTimeout(hashChangeTracker, 100);
    }, 100);
}(function onhashchange() { // the actual event handler used above
    "use strict";
    var hash = location.hash || "#wantit";
    if ($(hash).hasClass("pane")) {
        $(".pane").addClass("hide");
        $(hash).removeClass("hide");
        $(".header .links a").removeClass("active");
        $(hash + "_link").addClass("active");
        
    }    
}, true));
