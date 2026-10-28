---
title: 'A DADE event set for the Shared Signals Framework'
description: 'The argument and the sourced evidence behind a Shared Signals event set for digital-estate access — why five events rather than one per legal transition, and what each has to carry to be correct in more than one jurisdiction.'
section: 'digital-estate-standards'
order: 3
standing: 'Argument and evidence. The normative definitions live in the openid-dade-events specification, which governs where the two disagree.'
updated: 2026-10-14
---
**This is the argument and the evidence; the normative definitions live in the specification** —
[openid-dade-events](https://github.com/derrumbe/openid-dade-events), an Informational draft
defining the five event types, the `principal` subject identifier format and the refusal-grounds
registry. Where the two disagree, the
specification governs and this page is stale. Part of the advisory layer — see [the use-case analysis](/research/digital-estate-standards/use-cases/) for the
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

What follows is the set, derived from what the statutes in [the sourced reference](/research/digital-estate-roles/#tab=findings) actually require, and
the reasoning behind it. The set was first drafted here with one event per legal transition; writing
it up as a specification cut it from seventeen events to five, for a reason given under
[The events](#the-events) that is worth more than the list itself.

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

Five event types, in the namespace the specification uses:
`https://schemas.openid.net/secevent/dade/event-type/`.

**An earlier draft of this document enumerated seventeen**, one per legal transition —
`authority-granted`, `authority-suspended`, `authority-reinstated`, `authority-terminated` and so on.
Writing the specification collapsed them, and the reason is design rule 1 above: those names assert
effects. Take one transition, a court appointing a conservator over someone who had granted a power
of attorney. Across seven US states it has five different effects: in Virginia the agency continues;
in West Virginia and Kentucky it terminates; in Missouri the court allocates functions between the
two fiduciaries; in Nebraska and Kansas the conservator acquires the principal's own power to revoke
it; in Iowa the power is suspended and later reinstated if the principal regains capacity. An event
named `authority-terminated` would be **wrong in five of those seven states**.

So a transition is one event that names the fact, the law it is to be read against, and the resulting
state as a field — which is also the only shape that survives a jurisdiction whose transition the
enumeration never anticipated.

| Event | Asserts | Carries, beyond the common fields |
|---|---|---|
| `principal-deceased` | a death has been recorded, or that record was withdrawn | `record_status`, `date_of_death`, `death_type`, `proof`, `registry_reference` |
| `principal-capacity-changed` | a finding of incapacity has been made, has lapsed, or has been reversed | `capacity_status`, `determiner`, `scope` (property, person, both), `finding_date`, `expires_at`, `objection` |
| `authority-changed` | a party's authority over the principal came into existence, changed state, or ended | `authority_status` — one of `granted`, `registered`, `suspended`, `reinstated`, `scope-changed`, `devolved`, `terminated` — plus `holder`, `artefact`, `scope`, `registration_effect`, `revival`, `cause`, `predecessor` |
| `direction-recorded` | the principal lodged a direction with a custodian, or withdrew one | `direction_status`, `effect` (`permit` or **`forbid`**), `lodged_with`, `designee`, `scope`, `precedence`, `revocable` |
| `authority-refused` | a custodian declined a presented authority | `grounds` (see the vocabulary below), `holder`, `presented_at`, `artefact`, `report_deadline`, `remediable`, `format` |

The seven `authority_status` values are the seven transitions the earlier draft gave separate event
types. Nothing was lost by collapsing them; what changed is that the receiver is told the fact and
the governing law, and decides for itself what follows.

Retraction and correction are not separate events, per design rule 2. Each of the three state events
carries its own status field with the withdrawal value in it — a mis-recorded death is undone by a
second `principal-deceased` with `record_status: withdrawn` and `corrects` set to the `jti` of the
original, and a restored capacity is a second `principal-capacity-changed`. So every assertion has a
retraction path without a second vocabulary to maintain.

Three further events are raised as **candidates and deliberately not specified** —
`authority-lapse-pending`, `authority-presented` and `authority-accepted`. The argument for each is
at the end of this section.

### Principal state

Two notes survive from the longer draft because they are facts about evidence rather than about
event shape. `proof` cannot be assumed to be a death certificate: Nebraska §30-24,125(2) accepts an
**abstract of death** where the certificate is delayed, and Iowa §633.356(8)(b) lets the state
substitute **proof of payment of funeral expenses**. Both exist because the certificate lags exactly
when a family first contacts a platform. And incapacity findings expire: §16 of the base findings
records statutory shelf lives from two hours to five years, which is why
`principal-capacity-changed` carries `expires_at` rather than leaving a finding open-ended.

### Authority, and what the one event has to carry

Collapsing seven transitions into `authority-changed` only works if its fields carry what the
separate names used to. Three cases from the findings set the requirements.

**Authority is not always binary**, so `state` cannot be a flag. Iowa §633B.108(2) suspends a power
of attorney on the appointment of a conservator and reinstates it if the principal regains capacity;
Utah §75A-9-117 has an authority that commences, ceases and resumes with a clinical finding. Both
need valid, temporarily ineffective, and valid again. A companion to `cause` matters as much: Iowa's
revival is automatic on a condition — "reinstated upon termination of the conservatorship as a result
of the principal regaining capacity" — so a receiver can know in advance that the suspension is not
terminal, which it cannot infer from the word "suspended" alone.

**Authority devolves**, and that is one event with two subjects. Iowa §144C.8 forfeits the right of
the first holder on a murder charge and vests it in an alternate designee; a receiver has to drop the
first and pick up the second from a single assertion.

**Registration sometimes creates rather than activates**, which is design rule 8 and the sharpest
distinction in the set. In England & Wales, Scotland, Ireland, Japan, South Korea, Denmark, Finland,
France and Italy registration **activates** an instrument that already existed. In **Singapore** it
**creates** the power — the Act does not require registration before use, it provides that the power
is not created unless registered. A receiver that treats those the same will either honour an
authority that does not exist or refuse one that does, so the distinction has to be carried in the
event rather than left to the reader of a registry name.

### Direction, where the instrument is not a grant

`direction-recorded` is not a variation on a grant, and that is the point. Italy's Codice privacy
art. 2-terdecies instrument is a **prohibition lodged with the controller** which binds whoever would
otherwise have been entitled; France's directives may permit or forbid and are revocable at any time;
RUFADAA's online-tool direction may do either and beats a contrary terms-of-service clause only where
the user acted affirmatively and distinctly.

So `effect: forbid` has to be a first-class value rather than the absence of a grant, and
`lodged_with` matters because in Italy the prohibition binds by virtue of having been given **to the
controller** — the custodian is not a relying party here, it is the addressee. Withdrawal is the same
event superseding the earlier one, not a second type.

### Refusal, and the reverse channel

**`authority-refused` travels in the opposite direction to all the others**, and it exists because
one legislature already requires it. Kansas §59-30,123(b): a person refusing a guardian's letters of
office "must, within 10 days of the refusal, report the refusal and the reason for refusal to the
court", where it is treated as a grievance. That is a custodian transmitting to a court — the
receiver of the authority stream becoming the transmitter of a refusal stream. SSF streams are
unidirectional, so this needs a second stream with the issuing authority as receiver.

It is also the one event whose vocabulary did not have to be invented, which is why it survived the
collapse while presentation and acceptance did not: four acts enumerate the lawful grounds, set out
below.

### The three candidates, and why they are not specified

| Candidate | The case for it | Why it is held back |
|---|---|---|
| `authority-lapse-pending` | Iowa §144C.8(2) loses an authority by **not** using it, on the earlier of two differently-anchored deadlines — 24 hours from notification or 40 hours from death. Nothing can emit the lapse when it happens, because the trigger is silence, so the transmitter would announce the clock and the receiver compute the expiry | it is the only event that asserts a future rather than a fact, which sits awkwardly with design rule 1, and one statute is a thin basis for a type |
| `authority-presented` | Iowa's two-way fee shift (§§633.356(6)(b) and (7)(b)) awards costs to whichever side **acted reasonably**, which makes the record of what was shown financially decisive rather than optional telemetry | it reports a claimant's action to parties who are not the claimant, and the privacy case has not been made |
| `authority-accepted` | the other half of the same record | a stream of acceptances is a stream of who asked about whom, and the hazard outweighs the demonstrated need |

## Common fields

Every event in the set carries these, alongside the timestamp and the administrative and end-user
reason strings that any event set needs:

| Field | Why |
|---|---|
| `initiating_authority` | who declared it. Values: `court`, `registrar`, `notary`, `clinician`, `agency`, `principal`, `custodian`, `claimant`, **`operation-of-law`**. The weight a relying party gives an event depends almost entirely on this, and the last value is not a formality — in 17 countries the heirs hold the estate from the moment of death with nobody declaring anything, so the set has to be able to say that no one did |
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

- **Push (RFC 8935) is required**, not preferred, for `principal-deceased` where a disposition clock
  depends on it — and it is the reason `authority-lapse-pending` is worth keeping on the candidate
  list rather than discarding. A daily poll cannot serve a forty-hour deadline.
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

## What the event set does not solve

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

The specification exists: [openid-dade-events](https://github.com/derrumbe/openid-dade-events) defines the five event types, the `principal`
subject identifier format and the refusal-grounds registry, with a browsable
[event reference](https://derrumbe.github.io/openid-dade-events/dade-event-reference.html) showing
the five alongside the three candidates. So the next step is no longer a longer document here.

What is still missing is the part that was never a drafting problem. The transitions in
the research data should go to the Shared Signals working group as test cases alongside the
conformance tests in [the standards landscape](/research/digital-estate-standards/standards/) — the data is already there. And the trust framework has to
exist before any of the transport is usable: MOSIP's model, a civil registry notifying entities
pre-approved by law, is the existing answer to who may transmit, and it is a governance question
rather than a standards one.
