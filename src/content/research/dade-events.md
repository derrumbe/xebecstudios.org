---
title: 'A DADE event set for the Shared Signals Framework'
description: 'A proposed event set for the legal transitions that drive digital-estate access: death and its retraction, incapacity and recovery, authority granted, suspended, reinstated and refused.'
section: 'digital-estate-standards'
order: 3
standing: 'A proposal, not a specification.'
updated: 2026-10-14
---
**A proposal, not a specification, and part of the advisory layer** — see [the use-case analysis](/research/digital-estate-standards/use-cases/) for the
separation from the base reference. Every legal claim below is carried from [the sourced reference](/research/digital-estate-roles/#tab=findings), where
it has a pinpoint citation and a retrieval date.

## What this is

The Shared Signals Framework is the transport: streams, configuration, and delivery by push
(RFC 8935) or poll (RFC 8936), carrying Security Event Tokens (RFC 8417) about subjects identified
per RFC 9493. **The event sets are separate from it**, and several already exist for other purposes.
DADE needs its own, as a peer to those rather than a variation on any of them: the subject matter
here is the legal status of a person and the authority others hold over their affairs, which nothing
else is about.

So the work is defining the events. The plumbing is reusable as it stands, and the reason is simply
that every transition this reference documents has the right shape for it — something happened to a
subject, a party learned of it, and other parties have to change their behaviour as a result.

What follows is the set, derived from what the statutes in [the sourced reference](/research/digital-estate-roles/#tab=findings) actually require.

## Design rules

These come from the findings, and each one is a constraint some statute imposes:

1. **Transmit the fact, never the effect.** A conservator was appointed is a fact. Whether that
   terminates, continues, suspends, allocates or transfers an existing power of attorney is the law
   of the principal's domicile, and it differs in six states. Events carry what happened; a decision
   point (AuthZen) evaluates what it means.
2. **Everything is correctable.** Deaths are mis-recorded, and the DADE paper notes MOSIP's point
   that a death notice can be revoked. Any event asserting a state must have a retraction and a
   correction path, and receivers must be able to unwind.
3. **Absence is not evidence.** Virginia §54.1-2996 provides that failure to register a document, or
   a revocation, does not affect its validity. A quiet stream says nothing about the world.
4. **Some deliveries are constitutive.** Iowa §144C.8(1) forfeits an authority on a murder charge
   only once "those charges are known to a third party". There, delivery is what makes the legal
   consequence attach, so the acknowledgement is evidence and not just reliability.
5. **Some clocks are measured in hours.** Iowa §144C.8(2): 24 hours from notification or 40 hours
   from death, whichever is earlier. Poll-based delivery on a daily cadence cannot serve that.
6. **Authority is not always binary.** Iowa §633B.108(2) suspends a power of attorney on the
   appointment of a conservator and reinstates it if the principal regains capacity. Utah
   §75A-9-117 has an authority that commences, ceases and resumes with a clinical finding.
7. **A direction may forbid rather than permit.** Italy's Codice privacy art. 2-terdecies makes the
   deceased's rights exercisable by an interested person **unless the deceased forbade it in writing
   to the controller**, and that prohibition binds. France's directives may allow or forbid and are
   revocable at any time. An event set that can only say "X now holds authority" cannot carry
   either.
8. **The grant may not be effective when it is made.** In ten jurisdictions — England & Wales,
   Scotland, Ireland, Singapore, Japan, South Korea, Denmark, Finland, France and Italy — a power
   must be registered or filed before use, and in **Singapore** registration is constitutive: the
   power is not created unless registered. So an event announcing a grant at signing time would be
   announcing something that does not yet confer anything, or does not yet exist.

## The events

Proposed namespace: `https://schemas.openid.net/secevent/dade/event-type/`

### Principal state

| Event | Means | Notable fields |
|---|---|---|
| `principal-deceased` | a death has been recorded | `date_of_death`, `proof` — and see below, the proof is not always a certificate |
| `principal-death-retracted` | the death record was withdrawn or corrected | `corrects` (the `jti` of the original) |
| `principal-incapacity-determined` | a finding of incapacity has been made | `determiner` (physician, psychologist, judge, governmental official), `finding_date`, `scope` (property, person, both), `expires_at` where the law gives the finding a shelf life |
| `principal-capacity-restored` | the finding has ceased or been reversed | `corrects` or `supersedes` |

Two notes. `proof` cannot be assumed to be a death certificate: Nebraska §30-24,125(2) accepts an
**abstract of death** where the certificate is delayed, and Iowa §633.356(8)(b) lets the state
substitute **proof of payment of funeral expenses**. Both exist because the certificate lags exactly
when a family first contacts a platform. And incapacity findings expire: §16 of the base findings
records statutory shelf lives from two hours to five years.

### Authority lifecycle

| Event | Means | Notable fields |
|---|---|---|
| `authority-granted` | a party now holds a role over the principal | `canonical_role`, `artefact`, `scope`, `effective_from` |
| `authority-suspended` | the authority exists and is currently ineffective | `cause`, `revival` (`automatic` or `order-required`) |
| `authority-reinstated` | a suspended authority is effective again | `supersedes` |
| `authority-terminated` | terminal | `cause` (death, revocation, court order, conviction, abuse finding, non-exercise, expiry, purpose fulfilled) |
| `authority-scope-changed` | the limits moved; the authority did not end | `scope` |
| `authority-devolved` | the authority passed to an alternate or successor | `from`, `to`, `cause` |
| `authority-registered` | a registry or court completed the step that makes the authority effective, or that creates it | `registry`, `effect` (`activates` or **`creates`**) |

`authority-suspended` and `authority-reinstated` are the pair the law insists on and that a
two-state model cannot carry: Iowa §633B.108(2) and Utah §75A-9-117 both need an authority that is
valid, temporarily ineffective, and then valid again. `revival` matters because Iowa's is automatic
on a condition —
"reinstated upon termination of the conservatorship as a result of the principal regaining
capacity" — which means a receiver can know in advance that the suspension is not terminal.

`authority-devolved` covers Iowa §144C.8, where forfeiture by the first holder vests the right in an
alternate designee: one event, two subjects, and a receiver that drops the first and picks up the
second.

`authority-registered` exists because of design rule 8, and its `effect` field is the part that
matters. In England & Wales, Scotland, Ireland, Japan, South Korea, Denmark, Finland, France and
Italy registration **activates** an instrument that already existed. In Singapore it **creates** the
power — the Act does not require registration before use, it provides that the power is not created
unless registered. A receiver that treats those two the same will either honour an authority that
does not exist or refuse one that does.

### Direction, where the instrument is not a grant

| Event | Means | Notable fields |
|---|---|---|
| `direction-recorded` | the principal lodged a direction with the custodian about post-mortem access | `effect` (`permit` or **`forbid`**), `scope`, `lodged_with` |
| `direction-withdrawn` | the direction was revoked | `supersedes` |

This pair is not a variation on `authority-granted`, and that is the point. Italy's art. 2-terdecies
instrument is a **prohibition lodged with the controller** which binds whoever would otherwise have
been entitled; France's directives may permit or forbid and are revocable at any time; RUFADAA's
online-tool direction may do either and beats a contrary terms-of-service clause only where the user
acted affirmatively and distinctly.

So `effect: forbid` has to be a first-class value rather than the absence of a grant, and
`lodged_with` matters because in Italy the prohibition binds by virtue of having been given **to the
controller** — the custodian is not a relying party here, it is the addressee.

### Claim handling, including the reverse channel

| Event | Means | Notable fields |
|---|---|---|
| `authority-presented` | a claimant presented an authority to a custodian | `presented_at`, `artefact`, `canonical_role` |
| `authority-accepted` | the custodian honoured it | `decided_at` |
| `authority-refused` | the custodian declined | `grounds` (see the vocabulary below), `reason_user`, `reason_admin` |

**`authority-refused` is the event that travels in the opposite direction to all the others**, and it
exists because one legislature already requires it. Kansas §59-30,123(b): a person refusing a
guardian's letters of office "must, within 10 days of the refusal, report the refusal and the reason
for refusal to the court", where it is treated as a grievance. That is a custodian transmitting to a
court — the receiver of the authority stream becoming the transmitter of a refusal stream. SSF
streams are unidirectional, so this needs a second stream with the issuing authority as receiver.

The other reason to carry presentation and decision as events is Iowa's two-way fee shift
(§§633.356(6)(b) and (7)(b)), which awards costs to whichever side **acted reasonably**. That makes
the record of what was shown and what was decided financially decisive, so it is not optional
telemetry.

### The deadline event

| Event | Means | Notable fields |
|---|---|---|
| `authority-lapse-pending` | a clock is running against an authority | `deadline`, `basis` (notification, death, or another anchor), `on_expiry` |

This is the odd one, and Iowa §144C.8(2) is why it has to exist: an authority that is lost by **not
being used**, on the earlier of two differently-anchored deadlines. Nothing can emit the lapse at the
moment it happens, because the trigger is silence. So the transmitter announces the clock when it
starts, and the receiver computes the expiry. It is the only way to make an event out of an absence.

## Common fields

Every event in the set carries these, alongside the timestamp and the administrative and end-user
reason strings that any event set needs:

| Field | Why |
|---|---|
| `initiating_authority` | who declared it. Values: `court`, `registrar`, `notary`, `clinician`, `agency`, `principal`, `custodian`, `claimant`, **`operation-of-law`**. The weight a relying party gives an event depends almost entirely on this, and the last value is not a formality — in 16 countries the heirs hold the estate from the moment of death with nobody declaring anything, so the set has to be able to say that no one did |
| `governing_law` | `{jurisdiction, as_at}`. Required by design rule 1, because the effect is jurisdiction-dependent, and by §12 of the findings, because a rule needs a date — Iowa's 2025 amendment to §633.356 applies **retroactively**, so even a past date is not stable |
| `canonical_role` | one of the 21 canonical role ids in this repository, so that "executor" and "liquidator" and *Nachlassverwalter* line up |
| `evidence` | **reuse eKYC/IDA's `evidence` structure** rather than inventing one; its `document`, `electronic_record` and `vouch` types already cover a certificate, a register entry, and a third party attesting to someone's standing |
| `supersedes`, `corrects` | a `jti` reference, so a later event can withdraw or restate an earlier one. Design rule 2 |
| `effect_unspecified` | an explicit marker that the event asserts a fact and not its legal consequence. Honest encoding of design rule 1, and it stops a receiver inferring a consequence the transmitter never claimed |

## A refusal-grounds vocabulary, taken from statute

Four acts already enumerate the lawful grounds for refusing an authority, which makes this the one
place in the proposal where the vocabulary does not have to be invented:

- actual knowledge that the authority is void, invalid, terminated or revoked
- a good-faith belief of invalidity — Iowa §633B.120(2)(e), notably **"whether or not" a
  certification was provided**
- knowledge that the principal is being abused, neglected, exploited or abandoned by the claimant
- the refuser has made, or knows of, an abuse report — Idaho §15-15-106(2), Kansas §59-30,123(a)(3),
  Iowa §633B.120(2)(f)
- the transaction would be inconsistent with other law
- a pending judicial proceeding construing the authority — Nebraska §30-4020(2)(g)
- no evidence of the occurrence of a contingency the authority was conditioned on — Nebraska
  §30-4020(2)(h)
- the refuser would not have engaged in the transaction with the principal either

And two grounds that must be **rejected** where the duty applies, because two legislatures
prohibited them expressly: refusing *exclusively* because of the authority's age, and refusing
*exclusively* to insist on a different form — Nebraska §30-4020(3), Iowa §633B.120(1)(c).

## Delivery

- **Push (RFC 8935) is required**, not preferred, for `authority-lapse-pending` and for
  `principal-deceased` where a disposition clock depends on it. A daily poll cannot serve a
  forty-hour deadline.
- **Acknowledgements should be retained as evidence**, not discarded as transport state, wherever a
  statute makes the legal effect depend on a third party's knowledge.
- **Receivers must not treat a quiet stream as "unchanged"**, per design rule 3.
- **Subject identification is unsolved.** RFC 9493 has no format for "the person named on this death
  certificate", and correlating a deceased person across a civil registry and a platform is exactly
  the privacy hazard RFC 8417 and RFC 8935 both flag. An opaque identifier minted per
  registry–receiver pair is the obvious direction, and it needs saying out loud rather than leaving
  to deployments.
- **Who may transmit is a governance question, not a protocol one.** MOSIP's model — a civil registry
  notifying entities **pre-approved by law** — is the existing answer, and a trust framework has to
  exist before the transport is usable.

## What this proposal does not solve

- **The no-issuer case.** Where authority arises by operation of law with no artefact and no issuing
  body, there is no transmitter either. `initiating_authority: operation-of-law` is honest labelling,
  not a solution, and the gap is a policy choice about whether someone should be made to declare.
- **The relying party as author.** West Virginia §16-30-8(a) has the attending clinician *select* the
  surrogate in writing; Iowa §144A.7 makes the authority a jointly signed agreement with the
  physician. There the receiver creates the authority, and an inbound event stream is the wrong shape
  for it.
- **Ranked fallback.** Most default-surrogate and disposition statutes are a priority ladder — spouse,
  then a majority of adult children, then parents, then siblings. These events can say who holds the
  authority; they do not express the ladder, and a receiver cannot work out who is next from them.
- **The asymmetry France exposes.** Décret n° 2019-536 art. 124 prescribes what an **heir** must
  produce and prescribes nothing for the person the deceased actually named. An event set can carry
  whatever evidence exists; it cannot supply evidence a legal system declined to require, and the
  claimant with the stronger moral claim is the one with the weaker paper trail.

## Next step

The useful version of this is not a longer document. It is a table of the legal transitions in
the research data with a proposed event for each, taken to the Shared Signals working group as test
cases alongside the eight in [the standards landscape](/research/digital-estate-standards/standards/). The data is already there; what is missing is the
vocabulary and the trust framework, and only one of those is a standards problem.
