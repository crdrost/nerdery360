/* loadingAnim.js
 * provides loading.start(), loading.stop() which start and stop drawing a
 * simple loading animation to a canvas named #canvas_loading on the page.
 */
/*jslint browser: true */
var loading = (function () {
    "use strict";
    var colors = ["#110", "#220", "#230", "#340", "#350", "#460", "#470", "#580", "#590"],
        thread = null;
    return {
        start: function () {
            if (thread === null) {
                var t, R = 12, ctx, canvas = document.getElementById("canvas_loading");
                if (canvas.getContext) {
                    ctx = canvas.getContext('2d');
                    t = 0;
                    thread = setInterval(function () {
                        var i, n = colors.length;
                        ctx.clearRect(0, 0, 50, 34);
                        t += 1;
                        for (i = 0; i < n; i += 1) {
                            ctx.beginPath();
                            ctx.strokeStyle = colors[i];
                            ctx.arc(17 - R * Math.sin(2 * Math.PI * (i - t) / n),
                                    17 - R * Math.cos(2 * Math.PI * (i - t) / n), 2, 0, 2 * Math.PI);
                            ctx.stroke();
                        }
                    }, 100);
                }
            }
        },
        stop: function () {
            var canvas;
            if (thread !== null) {
                clearInterval(thread);
                thread = null;
                canvas = document.getElementById("canvas_loading");
                if (canvas.getContext) {
                    canvas.getContext('2d').clearRect(0, 0, 50, 34);
                }
            }
        }
    };
}());
