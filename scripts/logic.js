/* logic.js
 * This is the script file loaded after the main page elements are initialized,
 * and governs the actual application logic rather than exporting functions for
 * use in other files.
 */

/*jslint browser: true */
/*global notify, request */

function loadTab(id) {
    "use strict";
    if ($("#" + id).hasClass("pane")) {
        $(".pane").addClass("hide");
        $("#" + id).removeClass("hide");
        window.location = "#" + id;
    }
}
(function () { // reload this tab from the anchor in the URL.
    "use strict";
    var anchor = window.location.href.match(/#[a-z]+/i);
    if (anchor !== null) {
        loadTab(anchor[0].slice(1));
    }
}());

