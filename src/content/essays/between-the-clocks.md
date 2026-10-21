---
title: "Between the Clocks: Introducing shared-signals.dev"
date: 2026-10-20
subject: Technology
tags: [Identity, Security]
description: "A half marathon run on three clocks is a race run blind between them. A new site for the standards that close the gap, and a place to see how they work."
project: "shared-signals-dev"
---

On September 17, 2011, I was reminded that obtaining and reacting to real-time data is essential. I was running the Stockholm Half Marathon, desperately trying to pace myself on a course I'd never run before. My goal was to keep close to five minutes per kilometre — and the Garmin on my wrist was continually giving me feedback.

It's no secret that one of the reasons I run is for the tech: I have a deep passion for sports watches and the data they provide. It's not just data for the sake of data, though. These devices inform strategy. At any point during a run I can glance down and get an instant read of my current speed, along with heart rate, cadence, elevation, the weather, a message from home. Because that data arrives in real time, my strategy can be adjusted with a glance. Real-time data leads to real-time decision-making.

> [!gloss]
> Five minutes per kilometre is eight minutes per mile, and a 1:45 half. The watch was a Forerunner. I've owned several since.

## What you don't know can hurt you

You don't need a sports watch to run a half marathon. There are clocks placed at key sections of the course: the beginning, the middle, the end. But relying only on those clocks results in a weakened approach to the race — one that presents risk. I might be close to on pace in those three small segments where a clock is visible, but what's happening between them? Those unknown sections are the danger to my finishing as I intended. Even if the halfway check is on pace, I may have raced through one stretch and dragged myself through the next. Without knowing what's happening at the moment it happens, I can't prevent myself from doing what I'm not supposed to do.

A stream of real-time data — and real-time decisions made from it — reduces risk, and makes it far more likely that I'm actually doing what I said I'd do.

## From running to identity

Identity today demands the same kind of concept.

Most access decisions are still made at three clocks. The user authenticates, and a session begins. Perhaps something's re-checked at a token refresh. Perhaps an access review comes around a quarter later. Between those marks the runner is unobserved: the laptop falls out of compliance, the credential turns up in a dump, the contract ends, the account is taken over — and the session carries on, because nothing in the architecture had any way to say so out loud.

That's the problem the OpenID Foundation's Shared Signals Framework exists to solve, along with the event profiles the transport carries: the Continuous Access Evaluation Profile for what happens to a session while someone's signed in, Risk Incident Sharing and Coordination for what happens to an account, and SCIM Events for provisioning. Identity information and context move in a steady stream, and decisions are evaluated continually rather than at intervals.

I've [made this case before, with dolphins](/shared-signals-and-thanks-for-all-the-fish/), and the argument hasn't changed since. What's changed is the tooling.

> [!aside]
> Fifteen species of dolphin fish cooperatively with people, and signal the fishers when to cast. Cooperation is the whole trick, there and here.

## A place to go and look

The case is easy to make and has been made often, and I'm just going to go ahead and assume that you agree with it. 

Your next thought should be something along the lines of *ok, so how does it work?*

There are a number of excellent resources and sites out there where you can learn the standard and play with it. But I've been holding onto a domain since I first became interested in the standard, and I've finally built it out: **[shared-signals.dev](https://shared-signals.dev)**.

> [!aside]
> This is not an official OpenID site, even though I'm a co-chair of the Shared Signals Framework working group.

It's an independent developer resource for the Shared Signals Framework, and it's organized around the order in which people actually need things:

- **Concepts in ten minutes** — transmitters, receivers, streams, SETs and subjects, the whole model on one page.
- **The event catalogue** — every CAEP, RISC and SSF event type, with its claims and an example token. Eight event types for CAEP, thirteen for RISC, each one a thing that can happen to a session or an account.
- **Implementations** — who actually transmits and receives today, products and open-source libraries both, because a standard with one implementation is a document.
- **A playground** — a public sample transmitter and receiver, built to the CAEP Interoperability Profile, so you can test an implementation without needing a willing partner on the other end. (Note that it supports all current events so that you can see them in action: CAEP, RISC, and SCIM.)

The playground is where I'd start, because it's the part that turns reading into doing. Create a receiver, make a stream on the sample transmitter the way a receiver would, and watch SETs arrive decoded and validated — or point your own transmitter at the push endpoint and find out what actually comes out of it. There's a SET inspector as well: paste a token, verify its signature against discovery or a JWKS, and see whether it says what the specification says it should. The transmitter's issuer is the site itself, and everything a receiver needs is in its configuration metadata.

It's a sandbox, and it behaves like one: rate limits, small quotas, idle streams and receivers swept after a week, and no real personal data, please. The source is on GitHub — around fourteen hundred lines of TypeScript on Cloudflare Workers and Durable Objects, written from the ground up for this and meant to be read. Issues and pull requests are welcome, and the reading is the point as much as the running.

The specifications are maintained by the Shared Signals Working Group, so where the site and the spec disagree, the spec wins. The site explains; it doesn't define.

Treat the site as the watch on your wrist: useful, immediate, and not the course itself.

## Run with it

If you build an identity provider, a SaaS application that holds sessions, a device manager or anything that learns something security-relevant and currently keeps it to itself, there's an event type for what you know. Go and find it. If you've already built one, add it to the implementations list — that page is only as useful as the number of people who are honest about what they support.

The gap between the clocks is where the risk lives. Closing it is an ongoing journey; future classes of event will address Infrastructure and Threat, Mission, and yes, Agents and Workloads. These are not theoretical—all three are currently being explored by various portions of the working group. The potential of Shared Signals to induce cooperation between actors, components, and even—gasp—vendors in the identity space is truly exciting.

Almost as much as that new watch.
