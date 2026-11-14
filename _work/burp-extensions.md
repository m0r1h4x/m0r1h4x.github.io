---
title: "Burp Suite extensions"
description: "Tooling that maps roles, state and trust boundaries while I test."
status: building
order: 2
topics: [burp, access-control]
---

Extensions for the proxy I live in. The goal is to make the invisible parts of an application visible while testing by hand: who is allowed to do what, which state an object is in, and where the server trusts the client.

## Ideas on the bench

1. Replay a request as every role I hold and diff the answers.
2. Track object identifiers across a session and flag the ones that cross accounts.
3. Mark the steps of a workflow so skipping one becomes obvious.

## Status

In progress. Releases and notes will be linked here.
