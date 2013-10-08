/* actions.js contains all of the JS functions which are referenced by links in
 * index.html.
 */

/*jslint browser: true, nomen: true */
/*global _, $, vote, notify, request, Mustache, refreshGamesList */

// called by the upvoting arrows. The underlying database operation is not
// idempotent: retrying an upvote which appeared to be timing out would game the
// system. To limit this effect we instead rollback the local alreadyVoted
// status after the timeout returns.
function upvote(id) {
    "use strict";
    var rollback;
    $("div#body").removeClass("vote");
    switch (vote.allowed()) {
    case "wrongDay":
        return notify("Sorry, you can't upvote on weekends.");
    case "alreadyVoted":
        return notify("Sorry, you already voted today.");
    case "ok":
        rollback = vote.getLast();
        vote.setLast();
        return request("/addVote", {id: id}, function (err, data) {
            if (err || data === false) {
                // rollback vote status on an error
                notify(data === false ? "App error: invalid ID used to add vote." :
                        "Upvote request timed out; assuming it was unsuccessful.");
                vote.setLast(rollback);
                $("div#body").addClass("vote");
            } else {
                notify("Your vote has been recorded.");
            }
        });
    }
}
// called by the "got it?" link on each entry, opens a confirmation tab which
// can confirm/deny that transaction
function confirmGotIt(id) {
    "use strict";
    var title = $("#wantit_" + id + " .title").text();
    $("#confirmgotit .render").html(
        Mustache.render($("#confirmgotit .template").html(), {id: id, title: title})
    );
    window.location = "#confirmgotit";
}
// called by the confirmation tab triggered by confirmGotIt()
function gotIt(id) {
    "use strict";
    request("/setGotIt", {id: id}, function (err) {
        if (err) {
            gotIt(id); // idempotent; so we just retry on timeout until successful.
        } else {
            notify("Game confirmed -- we got it!");
        }
    });
    window.location = "#wantit";
}

// called by the title submission form to send a title for consideration.
function submitTitle() {
    "use strict";
    var existing = JSON.parse(document.getElementById("existing_titles").value),
        title = document.getElementById("submit_title").value,
        f;
    if (_.indexOf(existing, title.toLowerCase()) !== -1) {
        notify('Error: "' + title + '" has already been submitted!');
    } else {
        switch (vote.allowed()) {
        case "alreadyVoted":
            notify("Sorry, you've already voted today!");
            window.location = "#wantit";
            break;
        case "wrongDay":
            notify("Sorry, you can't submit on weekends.");
            window.location = "#wantit";
            break;
        case "ok":
            vote.setLast();
            f = function addGame() {
                request("/addGame", {title: title}, function submit(err) {
                    if (err) {
                        // We'll retry on timeout if a query does not show the title.
                        refreshGamesList(function resumeSubmit(err, data) {
                            var titles;
                            if (err) { // retry refreshGamesList until successful, too
                                setTimeout(function () { refreshGamesList(resumeSubmit); }, 500);
                            } else {
                                titles = _.filter(data, function (x) {
                                    return x.title.toLowerCase() === title.toLowerCase();
                                });
                                if (titles.length === 0) {
                                    addGame();
                                } else {
                                    notify('Success! "' + title + '" has been added.');
                                    document.getElementById("submit_title").value = "";
                                }
                            }
                        });
                    } else {
                        notify('Success! "' + title + '" has been added.');
                        document.getElementById("submit_title").value = "";
                    }
                });
            };
            notify('Submitting "' + title + '"...');
            f();
            window.location = "#wantit";
            break;
        }
    }
}