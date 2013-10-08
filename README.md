# 360 Tracker
This application is a part of a code challenge submitted to the Nerdery.

This is a front-end for an application which displays Xbox 360 games which we currently
own, as well as the games we would like to buy, and the number of votes for buying each of
those games. Employees can vote for their favorite games or add new games to this list, 
once per day. If we meet our productivity goals then each week the game with the most 
votes will be purchased and we'll update the list accordingly.

The application (a) displays the games we own, (b) displays games that we want to own, and
lets you vote on them, (c) allows you to submit new titles for voting, and (d) allows you 
to designate a game as owned by us.

# Code Layout
Aside from third-party libraries in `lib/` there are three libraries in `scripts/`, 
including `notify.js` which operates the notification box at the bottom of the screen,
`request.js` which packages requests to the Nerdery's server and manages their callbacks,
and `test.js` which works as a replacement for request.js which does not send to their 
server. The services that can be requested from the Nerdery are outlined in
`JavascriptCodeChallenge111412.pdf`.

There are then two main logic files, `actions.js` which contains functions referenced by
buttons and links in `index.html`, and `logic.js` which contains utility functions (some
of which are needed by actions.js and might be pulled out into a separate file), the
threads which run the application apart from the click actions, and some start-up code.
One of these threads is a hash tracker; we use the hash to provide a really cheap sort of
history tracking.

View code is also in `logic.js`, but it mostly uses Mustache.js to render templates which
you can find inline in `index.html`.

The backend does not have a user architecture, so the frontend implements the security 
restriction of at most 1 vote/day by storing dates in a cookie named lastVote in a 
`YYYY-MM-DD` format, so that they can be compared with the string `<` operator. There is 
an abstraction layer above this process, implemented as a `vote` namespace in `logic.js`. 
