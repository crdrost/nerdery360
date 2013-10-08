/* notify.js provides a global method `notify` which can be used to send a
 * notification to the `#notifications` element in the document. This can be
 * used to report errors or connectivity problems.
 */

/*global $, setTimeout */

var notify = (function () {
    "use strict";
    var queue = []; // notifications queue

    function loadMessage() {
        var text = queue[0] + (queue.length === 1 ?  "" : " [" + (queue.length - 1) + " more...]");
        $("#notifications").html(text).animate({bottom: "-3px"});
    }
    function hide() {
        $("#notifications").animate({bottom: "-100px"});
    }
    return function notify(message) {
        queue.push(message);
        loadMessage();
        if (queue.length === 1) {
            setTimeout(function notificationThread() { // thread for eliminating notifications
                queue.splice(0, 1);
                if (queue.length === 0) {
                    hide();
                } else {
                    loadMessage();
                    setTimeout(notificationThread, 3000);
                }
            }, 3000);
        }
    };
}());
