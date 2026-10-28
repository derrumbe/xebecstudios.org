---
title: 'Standards landscape, against what the law requires'
description: 'Where the current identity and authorization standards stand against what 62 jurisdictions of verified law actually require — ten conformance tests, each traceable to a statute.'
section: 'digital-estate-standards'
order: 2
standing: 'Survey and argument. Specification status verified 14 October 2026 and will date.'
updated: 2026-10-27
---
**Advisory layer, like [the use-case analysis](/research/digital-estate-standards/use-cases/), and deliberately not part of the base site.** The reference
states the legal position; this page argues about what to build on it.

**Everything below was verified on 14 October 2026** from the specification bodies themselves —
IETF Datatracker, the OpenID Foundation and W3C — rather than from memory, because this area moves
faster than the law does. Status lines go stale; re-check before relying on one.

## Relation to the DADE paper

The OpenID Foundation published [*The Unfinished Digital Estate: Culture, Law, and Technology after
Death*](https://openid.net/wp-content/uploads/2026/03/The-Unfinished-Digital-Estate-Final.pdf)
(Flanagan, Kiser and Saxe, eds., 3 March 2026). Its §5.2 already surveys the Sovrin guardianship
model, Kantara's UMA work and the eKYC & IDA delegated-authority effort; its §5.3 names the
interoperability gap; its §8.2 asks standards bodies for interoperable on-behalf-of delegation,
auditable logs, cross-jurisdiction revocation, multi-party delegation, conditional triggers that fire
only on verified death or incapacity, trust frameworks for death-certificate validation, and
**cross-industry conformance testing**.

This page does not restate any of that. It does one thing the paper could not: **it turns every
jurisdiction of verified law in the reference into conformance test cases**, so a proposal can be
checked against what legislatures actually did rather than against a model of delegation. The count
is deliberately not written down here — it was 56, then 57, and was behind the data both times. That is the asset this
repository has and the specs do not.

## What exists, and where it stands

| | Status on 14 Oct 2026 | Relevance here |
|---|---|---|
| **W3C VC Data Model 2.0** | **Recommendation**, 15 May 2025 | the credential container |
| **W3C Bitstring Status List 1.0** | **Recommendation**, 15 May 2025; v1.1 in development | revocation by polling |
| **OpenID4VP 1.0** | **Final**, 9 July 2025 | presentation |
| **OpenID4VCI 1.0** | **Final**, approval announced ~Sept 2025 *(exact date not confirmed from an OIDF page)* | issuance |
| **SD-JWT VC** | `draft-ietf-oauth-sd-jwt-vc-18`, 3 Aug 2026, submitted to IESG, *AD Evaluation: Revised I-D Needed*; a -19 exists | selective disclosure; base SD-JWT is **RFC 9901** |
| **OIDC for Identity Assurance (eKYC/IDA) 1.0** | **Final**, 1 Oct 2024; errata set 1, July 2026 | **evidence** metadata — the closest fit for proof of standing |
| **eKYC/IDA "Authority" work** | WG draft in progress (*OpenID Connect Authority claims extension* / *OpenID Authority 1.0*), moved to its own repository; **no current revision pinned** | explicitly "on behalf of" for persons and legal entities |
| **Shared Signals Framework, CAEP 1.0, RISC** | **Final**, September 2025 | push notification of status change |
| **CAEP Interoperability Profile** | draft; WG restarted its review 15 Sept 2026 | profiling the above |
| **AuthZen Authorization API 1.0** | **Final**, approved 12 Jan 2026 | externalised decision point |
| **AuthZen Access Request and Approval Profile 1.0** | WG draft, not final | request-and-approval flows |
| **OAuth Rich Authorization Requests** | **RFC 9396** | `authorization_details` — fine-grained, structured authority |
| **GNAP** | **RFC 9635**, Proposed Standard, Oct 2024 | delegation to software; rights structure modelled on RAR |
| **Transaction Tokens** | `draft-ietf-oauth-transaction-tokens-11`, 30 July 2026, *WG Consensus: Waiting for Write-Up* — an **OAuth** WG document, not WIMSE | call-chain context propagation |
| **WIMSE** | WG: `arch-08` (6 July 2026), `wpt-01`, `workload-creds-02`, `http-signature-02`; also `aims-00` (AI Identity Management System) and `draft-sweeney-wimse-credential-delegation-00` | workload, not human, identity — adjacent |
| **AAuth** (Hardt) | `draft-hardt-oauth-aauth-protocol-09/10`, individual draft, **not WG-adopted**; builds on HTTP Message Signatures (RFC 9421) | per-agent cryptographic identity, signed requests instead of bearer tokens |
| **Mission-Bound Authorization** (McGuinness) | `draft-mcguinness-oauth-mission-00`, 6 July 2026, individual, **"not endorsed by the IETF"** | a durable, human-approved, bounded grant — see below |
| **OAuth Actor Profile for Delegation** (McGuinness) | `draft-mcguinness-oauth-actor-profile-00`, individual | the `act` delegation chain Mission uses |
| **OAuth 2.0 AI Agent Instance Profile** (McGuinness) | `draft-mcguinness-oauth-ai-agent-instance-00`, 4 July 2026 | attested instance ids, sub-agent chains |
| **UMA 2.0** (Kantara, Maler et al.) | Grant and Federated Authorization, **2018 Recommendations** | party-to-party access with the owner absent — see below |
| **UMA for Agents (U4A)** | **nine Internet-Drafts** plus a running Apache-2.0 reference implementation, by Nick Gamb (MindGarden) and Eve Maler (Venn Factory) at `u4a.ai`. Emerging and **not ratified by any body** — its own pages call it a proof of concept. Read for this page | a UMA 2.0 profile for the case where the owner is **not at the keyboard** — the closest structural fit to this problem of anything here |
| **George Fletcher's corpus** | [`gffletch/da_research`](https://github.com/gffletch/da_research) — 366 sources, 251 active IETF drafts as of Aug 2026 | the field is crowded; this is the map |

## Two proposals worth reading closely

### Mission-Bound Authorization is a power of attorney, re-derived

`draft-mcguinness-oauth-mission-00` arrives at a structure that matches the legal instrument this
repository documents, apparently without starting from it:

| Mission | The legal analogue in this data |
|---|---|
| "The Mission is the durable object these project from: the approved task that bounds and outlives them." Tokens are short-lived projections | A power of attorney or letters of office. §17 of the base findings concludes the same thing from the law: short credential lifetimes and a status channel, not rich assertions at issue time |
| Authority Set of `mission_resource_access` entries with per-entry constraints, e.g. `max_amount` | The small-estate ceiling — a per-entry monetary cap is exactly the shape, and it runs $2,000 to $208,850 |
| Revocation "stops further derivation" and "does not undo completed actions" | The safe harbour in all eight acceptance regimes: acts done in good faith before actual knowledge bind the principal |
| `delegation` with `max_depth` and `allowed_delegates`; non-delegable by default; a delegated entry may not be broader than its parent | Successor and alternate appointment — Iowa §144C.8 devolves to an alternate designee on forfeiture |
| State is active, revoked or expired | **The mismatch.** See test 1 below |
| `expires_at` is REQUIRED | **The mismatch.** Legal authority rarely expires on a date; it ends on *events* |
| Held server-side by the issuing AS, "its only issuer" | **The big mismatch.** See test 2 below |

### UMA 2.0 is the only mainstream standard built for an absent owner

Every OAuth-shaped flow assumes the resource owner is present to approve. The digital estate case is
the one where they are permanently not. UMA 2.0's core model has a **requesting party who is not the
resource owner**, policy set at the authorization server in advance, and a claims-gathering step in
which the AS demands claims from the requesting party before issuing a token — which is structurally
"prove you are the personal representative".

That makes it the closest existing fit for `deceased-administration` and for generalising
`self-directed-ante-mortem` beyond one platform's online tool.

### UMA for Agents picks up exactly where that leaves off

**U4A is a UMA 2.0 profile for the case the original specification predates: the requester is an
autonomous agent belonging to somebody else, and the owner is not at the keyboard.** Its own summary
of the problem — *“She isn't online. Her policy is”* — is the digital-estate thesis in four words,
arrived at from the agent side rather than the mortality side. It is nine Internet-Drafts (three
required: core, owner-proffered terms, federated authorization; four optional: policy, lineage,
multi-party, owner's API; plus an MCP binding and an AAuth credential document) with a running
reference implementation. It is a proof of concept and not ratified — its pages say so — but it is a
document set, not an idea.

Four of its features answer things the tests below ask for, and the correspondence is close
enough to be worth stating precisely:

- **Terms are an artefact, and so are refusals.** The authorization server proffers machine-readable
  terms, the agent signs them, and both sides keep a counter-signed receipt; the pattern is cited as
  IEEE 7012. Every step of a negotiation emits a structured event — challenge, terms dictated,
  contract committed, owner notified, decision, grant issued, call allowed or denied, connection
  revoked — under one stable correlation id, and **“refusals are recorded too”**. That is test 8, and
  it is also the answer to Iowa's two-way fee shift, which makes the record of what was shown and
  decided financially decisive rather than merely good practice.
- **The ledger is a projection of that stream, not a table**, so “the audit trail cannot disagree
  with what happened”. §8.2 of the DADE paper asks for auditable logs of delegated actions; this is
  a design for them.
- **Every owner names her own authorization server**, and a resource server may hold many owners'
  accounts each governed by an authority it was never configured against. That is the most direct
  answer anyone has to test 2: the owner designates the authority **in advance**, which generalises
  `self-directed-ante-mortem` off a single platform's online tool without inventing a registry.
- **Revocation is deliberately terminal** — introspection answers `connection_revoked`, “not an
  invitation to renegotiate”, and ending the connection and burning the grants behind it are one
  operation rather than two. The reasoning is that a bare `inactive` would send the agent round the
  loop again.

#### U4A against the tests

All nine drafts were fetched and searched. **None of them contains the words suspend, reinstate,
revive, dormant, retract, incapacity, death, deceased or successor**; `quorum` appears twice in
multiparty and `jurisdiction` once each in core and policy. So the evaluation below is a reading of
the documents rather than an inference from the overview pages.

| Test | U4A | |
|---|---|---|
| 1. Suspended and revivable | **fails, by design** | Revocation is deliberately terminal: introspection answers `connection_revoked`, "not an invitation to renegotiate", because a bare `inactive` would send the agent round the loop. Sound for its own domain, and the exact opposite of Iowa §633B.108(2). No suspended state exists in any draft |
| 2. No issuer | **best answer available, but only half of it** | Every owner names her own authorization server, and a resource server may hold many owners each governed by an authority it was never configured against. That solves *designation* — and still requires the owner to have acted in advance, so the 17 countries where heirs hold the estate by operation of law remain unaddressed |
| 3. Relying party as author | **out of scope, and architecturally opposed** | The premise is an authority on the owner's side, "one the resource server does not control". West Virginia §16-30-8(a) has the clinician select the surrogate; Iowa §144A.7 has the physician co-sign. There the resource server *is* the author — the inversion U4A exists to prevent |
| 4. As-at date and jurisdiction | **fails** | `jurisdiction` appears once in core, as a claim the *requesting party* attests alongside a licence — not as the governing-law key. Nothing carries a date against which a rule is evaluated |
| 5. Lapse by non-exercise | **fails** | Terms carry an expiry; nothing fires on silence |
| 6. Knowledge-constitutive | **has the substrate, lacks the semantics** | Every negotiation step emits an event under one stable correlation id, and the ledger is a projection of that stream, so "was this known, and when" is answerable. But no legal effect is made contingent on delivery |
| 7. Scope on the artefact | **passes** | A proof-of-possession token "carrying its permissions as a claim", operation binding, single use, per-tier terms. This is Kansas §§59-30,108(c) and 59-30,185 in protocol form |
| 8. Refusal with reasons | **passes, and it is the best in the field** | `terms` §6: the AS MUST accept `decline=true`, MUST end the negotiation, and MUST **record the refusal against the terms that were declined** — "a refusal is a record too", and "the only signal an owner has that her terms are the reason nobody uses a resource she has published". That is test 8, and where Iowa's two-way fee shift finds an implementation |

Two further observations from drafts the overview pages do not foreground.

**`multiparty` §3.3, "The Fold", is a real answer to co-held authority** and deserves credit. Where a
resource is jointly held, the tally must obtain each holder's terms from her own authorization server
and fold them into one document: *the shortest expiry, the intersection of scopes, the union of
prohibitions, and ask-me if any holder asks.* Mandates carry a threshold, and a deployment may fix a
floor below which no mandate's threshold may go — the draft observes that the real-world version is
"a regulator or an account agreement fixing one". That maps well onto Iowa §144A.7(1)(d)'s "majority
of the adult children who are reasonably available", and onto Kansas §59-30,108(c)'s co-guardians who
may act jointly or independently.

What it does **not** map onto is a **ranked ladder with fallback**, which is how nearly every
default-surrogate and disposition statute here works: spouse, then a majority of adult children, then
parents, then siblings, then — in Iowa — anyone who swears to the decedent's identity and accepts the
bill. The Fold is among co-equals. The law is usually a hierarchy, and the hierarchy is the part a
relying party has to evaluate.

**`lineage` flattens delegation deliberately**, and the trade is worth naming. An agent with a
standing relationship may introduce another, which negotiates its own terms under its own key:
"Nothing is handed down. The task graph an orchestrating agent builds may nest as deeply as it likes.
The authority graph stays one level deep: every agent is separately visible to the owner, separately
bounded by her policy, and separately revocable, and revoking the agent that introduced others
revokes them with it."

That last clause is the inverse of legal devolution. Under Iowa §144C.8 the first holder's forfeiture
is precisely what *vests* the authority in the alternate: the successor's authority begins where the
predecessor's ends and does not fall with it. So `lineage` models introduction well and succession
not at all.

The remaining honest caveat on UMA itself: the core specs are 2018 Kantara Recommendations with
modest deployment.

## Shared Signals: the event layer these use cases actually need

**Almost nothing in this reference is a query. Nearly all of it is a state transition.** Someone
dies, a clinician records a finding, a court appoints a fiduciary, capacity returns, a principal
revokes, a clock expires. The authority before and after is a consequence; the event is the thing.
That makes the Shared Signals Framework the right shape for this problem and not merely an adjacent
technology, so it is worth being specific about what it supplies and what it does not.

### The stack, verified

| | What it gives |
|---|---|
| **SET — RFC 8417** | the event itself: a JWT describing something that happened to a subject, with `events`, `iat`, `jti` |
| **Push — RFC 8935** | transmitter-initiated HTTP POST of `application/secevent+jwt` to a receiver endpoint |
| **Poll — RFC 8936** | receiver-initiated pull, with an acknowledgement of the event ids it processed |
| **Subject Identifiers — RFC 9493** | named subject-identifier formats and the `sub_id` claim, plus the IANA registry |
| **SSF** (OIDF, **Final**, Sept 2025) | stream configuration and management between transmitter and receiver |

Carried *over* that transport, and separate from it, are the event sets. **CAEP 1.0** and **RISC**
(both OIDF Final, September 2025) are the two that exist: CAEP's eight types are about session and
credential continuity, RISC's about account compromise. They are the precedent for how a set is
defined and registered, not a basis to extend — which is why what follows is a set of its own.

### Mapping the legal transitions onto it

| Legal event | Statute in this data | Who would transmit | What it needs |
|---|---|---|---|
| Death | every jurisdiction | a civil registry — MOSIP's model, which notifies entities pre-approved by law | no event type; and deaths get **mis-recorded and revoked**, so it must be retractable |
| Incapacity determined | Iowa §633B.109(3); §144B.1(3) | a clinician, or a judge | no event type |
| Capacity regained, authority revives | Iowa §633B.108(2); Utah §75A-9-117 | the court ending the conservatorship | **no reinstatement event at all** |
| Conservator appointed | Iowa §633B.108(2) and five other states | a court | no event type — and see below, the same event has five different effects |
| Revocation of a power | Missouri §404.717(1)(3) | the principal, or a recorder of deeds | nobody is obliged to transmit anything |
| Agent named in a founded abuse report | Iowa §633B.110(2)(e) | a state department, **confidentially** | cannot be transmitted at all |
| Conviction of exploitation | Virginia §64.2-1608(B)(4) | a court | public, but no stream exists |
| Forfeiture by non-exercise | Iowa §144C.8(2) | **nobody** — the trigger is the absence of an act | an event that must fire on silence |
| Refusal to accept an authority | Kansas §59-30,123(b) | the **custodian**, to the court, within 10 days | the stream runs the wrong way |

### Five things that follow

**1. The transport is reusable; the events are not.** This is the central conclusion, and it is not
a criticism of anything that exists. SSF carries event sets, and the sets that exist were written for
other subjects — access continuity, account compromise. None of them is about the legal status of a
person or the authority others hold over their affairs, and none should be expected to be. So the
work DADE needs is **its own set**, as a peer to the others rather than a variation on one. That set
is specified in [openid-dade-events](https://github.com/derrumbe/openid-dade-events), with the reasoning in [the event-set argument](/research/digital-estate-standards/dade-events/).

**2. Three things that set has to carry, which are easy to underestimate.** A **suspended** state
with an explicit reinstatement, because Iowa §633B.108(2) and Utah §75A-9-117 both require an
authority that is valid, temporarily ineffective, then valid again. A **retraction**, because deaths
get mis-recorded and the DADE paper notes MOSIP's point that a death notice can be revoked. And a
rich **initiating authority** — court, registrar, notary, clinician, agency, or no one at all —
because the weight a relying party gives an event depends almost entirely on who declared it, and
`operation-of-law` has to be expressible for the 17 countries where nobody declares anything.

**3. The event can carry the fact but not the effect.** A court appoints a conservator: in Virginia
the agency continues, in West Virginia and Kentucky it terminates, in Missouri the court allocates
between them, in Nebraska and Kansas the conservator inherits the power to revoke, and in Iowa the
power is suspended and later revived. **One event, six legal consequences, selected by the law of the
principal's domicile.** So a digital-estate event family must transmit *what happened* and leave the
consequence to be evaluated against jurisdiction and date — which is exactly what an AuthZen
decision call is for, and it is the cleanest division of labour available between these specs.

**4. Delivery is sometimes constitutive, not just informative.** Iowa §144C.8(1) forfeits the right
to control remains on a murder charge **only once "those charges are known to a third party"**, and
§144B.6(1) ranks an agent above a guardian only while "known to the health care provider". In those
cases the signal does not report a change that already happened — **the signal is what makes it
happen**. That inverts the usual relationship, and it means RFC 8936's acknowledgement and any
delivery receipt are *evidence of a legal fact*, not merely reliability engineering. Nothing in SSF
is written with that in mind, and it is a genuinely novel requirement.

**5. Absence of a signal proves nothing, and the law says so.** Virginia §54.1-2996 provides that
failure to register a document — or a revocation — does not affect its validity. So a receiver that
has seen no event has learned nothing about the world, only about the stream. Any design that treats
a quiet stream as "authority unchanged" is making a claim the underlying law refuses to support.

### Push or poll, and the forty-hour problem

Iowa §144C.8(2) gives 24 hours from notification or 40 hours from death, whichever is earlier. A
poll-based stream on a daily cadence cannot serve that use case at all, so push (RFC 8935) is not an
optimisation here but a requirement — and push needs the receiver pre-registered with the
transmitter, which is precisely MOSIP's arrangement of notifying entities **pre-approved by law**.
That is a governance decision wearing protocol clothes, and it is where a trust framework has to
exist before the transport can be used. The subject-identifier question is equally awkward: RFC 9493
has no format for "the person named on this death certificate", and correlating a deceased person
across a registry and a platform is the exact privacy hazard RFC 8417 and RFC 8935 both flag.

### The obvious composition

U4A already emits a structured event for every step of a negotiation, under a stable correlation id,
with its ledger as a projection of that stream. Those events are the natural SET payloads. So the
division that suggests itself across all of this is:

- **U4A** for the authority itself — the owner's own authorization server, named in advance, holding
  terms, receipts and the connection;
- **SSF carrying a DADE event set** for the transitions that originate outside any platform: death,
  a capacity finding, a court appointment, and the suspensions and reinstatements;
- **AuthZen** for evaluating what a transition *means* in a given jurisdiction as at a given date,
  since finding 3 shows the event cannot carry that;
- **eKYC/IDA evidence** for the proof-of-standing problem, whose `vouch` type is already close to
  §14's table;
- **VC / SD-JWT VC** for the portable assertion where an issuer exists, with the honest
  acknowledgement from test 2 that for a third of the set none does.

None of that is a proposal to build something new. It is an argument that the pieces mostly exist,
that the missing piece is a small event vocabulary plus the trust framework to say who may transmit
it, and that the legal data in this repository is what such a vocabulary should be tested against.

**That vocabulary is now specified.** SSF carries event sets and does not prescribe them, so DADE
needs its own, as a peer to the sets that already exist for other subjects. The specification is
[openid-dade-events](https://github.com/derrumbe/openid-dade-events), an Informational draft; [the event-set argument](/research/digital-estate-standards/dade-events/) carries the argument and the
statutory evidence behind it.

It defines **five** event types — `principal-deceased`, `principal-capacity-changed`,
`authority-changed`, `direction-recorded` and `authority-refused` — with the common fields the set
needs (`initiating_authority` including `operation-of-law`, `governing_law` as
jurisdiction-plus-date, `supersedes` / `corrects`, and an explicit `effect_unspecified`), the
`principal` subject identifier format, and a refusal-grounds registry lifted from the four statutes
that already enumerate them. Three further events are raised as candidates and deliberately left
unspecified.

**Five rather than one per transition is the substantive decision**, and it comes from the law.
A court appointing a conservator over someone who had granted a power of attorney has five different
effects across seven US states, so an event named `authority-terminated` would be wrong in five of
them. The event therefore names the fact and the law it is to be read against, and leaves the
consequence to be evaluated by whoever is entitled to evaluate it.

## The conformance tests the law produces

Each of these is a real statute in the base reference, not a hypothetical. The verdict column is
what today's specifications can express.

A note on weighting, because it matters for an international effort: tests 1 to 8 were drawn
disproportionately from US states, which reflects where this reference has been growing rather than
where the hardest cases are. Tests 9 and 10 are led by Italy and France, test 1 now carries the
ten-jurisdiction registration class with Singapore as its sharpest instance, and the civil-law
systems are what make test 2 structural rather than marginal. The pattern worth noticing is that
**the non-US cases tend to break the design assumptions rather than stretch them** — a prohibition
instead of a grant, no artefact at all, an authority that does not exist until a registry says so.

**1. An authority can be valid and not effective, in three different ways.** Iowa §633B.108(2)
suspends a power of attorney when a conservator is appointed and **reinstates** it if the principal
regains capacity; Utah §75A-9-117 has a health-care authority that commences, ceases and resumes
with a clinical finding. Those are suspensions of something already in force.

**The larger class is not American.** In **ten jurisdictions** — England & Wales, Scotland, Ireland,
Singapore, Japan, South Korea, Denmark, Finland, France and Italy — a power must be **registered or
filed before it can be used**, so there is a period in which the instrument exists, is valid, and
confers nothing. And **Singapore is the third case**, distinct again: registration there is
*constitutive*, not procedural — the Act does not say a lasting power must be registered before use,
it says the power **is not created** unless registered. So the instrument is signed and there is no
authority at all until a registry acts.

Three states of "not currently effective", then: not yet registered, not yet created, and suspended
mid-life. A protocol that can issue a credential at signing time is wrong in ten jurisdictions, and
in Singapore has nothing to issue.
→ *No credential format has any of these states.* Mission has `suspended` only as an OPTIONAL extension in a
separate status profile, with pause-and-resume listed as future work. Bitstring Status List is
binary per index, and an event set would have to define "asleep, may wake" because no existing one
had reason to. **This is the single most specific piece of feedback this dataset can give.**

**2. There is no issuer.** In 17 countries the heirs hold the estate from the moment of death by
operation of law, with no document. Virginia's small-estate tier below $35,000 requires no affidavit
at all. An un-notarised nominating instrument is still an instrument in most states.
→ *Every credential model assumes an issuer*, including Sovrin guardianship and Mission's "its only
issuer" AS. For a third of the set there is no body to issue, and inventing one is a policy change,
not a protocol decision.

**3. The relying party is sometimes the author.** West Virginia §16-30-8(a) has the attending
clinician **select the surrogate in writing**. Iowa §144A.7 makes the authority a written agreement
**co-signed by the attending physician**, witnessed.
→ *Nothing models "the verifier creates the credential".* Presentation protocols assume a holder
presenting to a verifier; here the verifier is upstream of the authority existing.

**4. The governing law needs an as-at date, and the date can move.** §12 of the base findings shows
commencement expressed as a past date, a future date, a condition the code does not quote
(Virginia §§64.2-2000, 64.2-2009), and — Iowa's 2025 amendment to §633.356 — **retroactively**, to a
date already passed.
→ *No standard carries (section, jurisdiction, as-at date)* as the key to a rule, and a schema with
a single `effectiveFrom` has nowhere to put a contingent or retroactive commencement.

**5. Authority can lapse by not being used.** Iowa §144C.8(2) forfeits the right to control remains
if it is not exercised within **24 hours of notification or 40 hours of death, whichever is
earlier**, and devolves it to an alternate.
→ *No protocol models losing authority through inaction*, and no design whose refresh interval is a
day can represent the window at all.

**6. Legal effect can turn on the relying party's knowledge.** Iowa §144C.8(1) forfeits the right on
a murder **charge** — "and those charges are known to a third party". Iowa §144B.6(1) ranks an agent
above a guardian only while "known to the health care provider to be available and willing".
→ Everywhere else knowledge governs only the safe harbour. Here it is **constitutive**, so "does X
hold this role?" is not answerable from facts about X. A credential needs a notification history,
which none carries.

**7. Scope belongs on the artefact.** Kansas §59-30,108(c) requires every limitation on a guardian's
powers to be **stated on the letters of office**, and §59-30,185 makes those stated restrictions
binding on a relying party who is otherwise protected without inquiry.
→ *This one today's stack handles well.* It is a scoped credential, and RAR's
`authorization_details` or Mission's Authority Set is the right shape. Worth citing as the legal
precedent for scope-carrying credentials, because it exists in statute and is not a protocol
invention.

**8. Refusal is a legitimate outcome with reasons.** Eight regimes legislate a duty to accept; four
of them **enumerate the lawful grounds for refusing** — Idaho §15-15-106(2), Nebraska §30-4020(2),
Kansas §59-30,123(a) and Iowa §633B.120(2) — and two enumerate grounds a refusal may **not** rest on.
Kansas §59-30,123(b) then requires the refuser to report the refusal and its reason **to the
appointing court within 10 days**.
→ *No protocol has a refusal vocabulary*, and these statutes are a ready-made one. Kansas's
reporting duty is also the only legislated *return* path in the data: a decline that travels back to
the issuer.

**9. The instrument may be a prohibition, not a grant.** Italy's Codice privacy art. 2-terdecies
makes the deceased's GDPR rights exercisable by anyone with their own interest — **unless the person
forbade it in writing to the controller**, and that prohibition binds. France's directives may be
either, and are revocable at any time. RUFADAA's online-tool direction may allow *or* forbid.
→ Every authorization model here is grant-shaped: a subject, a permission, an issuer. **A
prohibition lodged with the controller has no representation in any of them**, and a design that
models only consent silently mis-implements Italy and under-implements France. Allow and forbid both
have to be first-class, addressed to the controller, and revocable.

**10. The person the deceased chose may have *less* prescribed proof than the fallback.** France is
where this reads precisely. Décret n° 2019-536 art. 124 tells an **heir** exactly what to bring —
identity plus an *acte de notoriété* or a *livret de famille*. For the *personne chargée de
l'exécution des directives*, the person the deceased actually named, the decree prescribes
**nothing**: art. 85 confers the standing and stops.
→ The intuitive design assumption is that a designated person is the easy case and the
operation-of-law claimant is the hard one. France inverts it, and it inverts it in the only
jurisdiction that **compels platforms to offer the designation in the first place** — art. 85 III
obliges every online public communication service to let users choose, art. 48 obliges telling them
the right exists, and art. 16 and art. 20 IV put the CNIL's sanction powers behind both, reaching an
*astreinte* of €100 000 per day and a fine of up to €10 million or 2% of worldwide turnover.

**That last point is the strongest argument on this page for doing any of this work.** There is
already a legal mandate to provide exactly the mechanism a protocol would specify, backed by real
penalties, with **no technical form specified anywhere in the statute**. France is not a conformance
edge case; it is the one jurisdiction where a standard would be adopted because the law requires the
function and names no way to perform it.

## What this repository can contribute

Two assets fall out of work already done and verified:

1. **A cross-jurisdiction role vocabulary.** 21 canonical ids that line up the same role across 26
   countries, each with a definition and pinpoint citations per jurisdiction. Every proposal above
   needs a way to say *what* authority is held; none supplies the terms. This is the gap the DADE
   paper's §8.2 calls "define the vocabulary".
2. **A statutory vocabulary of refusal grounds**, taken from the four acts that enumerate them.

And one method: **the dataset as a conformance suite.** §8.2 asks for cross-industry conformance
testing; tests 1 to 8 above are the beginning of it, each traceable to a statute with a retrieval
date.

## Where I would send which feedback

- **Mission-Bound Authorization** — test 1. A suspended-and-revivable state is not an edge case; it
  is Iowa's and Utah's actual rule, and it is in the base profile's blind spot.
- **eKYC/IDA Authority work** — tests 3 and 6, and eKYC/IDA's existing `evidence` types are already
  close to §14's proof-of-standing table, `vouch` in particular mapping onto a third party attesting
  to someone's standing.
- **Shared Signals** — the ask is a **new event set**, not a change to an existing one, and
  [openid-dade-events](https://github.com/derrumbe/openid-dade-events) is the specification, with [the event-set argument](/research/digital-estate-standards/dade-events/) as its evidence base. The parts worth raising with the working group are the ones that
  bear on the framework rather than the vocabulary: the stream is unidirectional while Kansas
  §59-30,123(b) requires a refusal to travel back to the issuing court, so some flows need a second
  stream with the authority as receiver; delivery is sometimes constitutive rather than informative
  (Iowa §144C.8(1)), which makes an acknowledgement evidence of a legal fact; an absence of signal
  is not evidence of anything, because Virginia §54.1-2996 says non-registration does not affect
  validity; and RFC 9493 has no subject-identifier format for a deceased person.
- **W3C VC / Bitstring Status List** — test 4. A credential about a legal authority is a credential
  about a rule with an as-at date.
- **UMA for Agents (U4A)** — now evaluated test by test above. It passes tests 7 and 8, is the
  best available answer to half of test 2, and fails 1, 4 and 5 outright; tests 9 and 10 are new and
  it has not been read against them. Three things worth sending: a
  suspended-and-revivable state, since no draft contains the word and Iowa and Utah both require
  one; a ranked ladder alongside `multiparty`'s Fold, because the Fold handles co-equals and the law
  is usually a hierarchy; and succession in `lineage`, where revoking the introducer revoking the
  introduced is the inverse of Iowa §144C.8's devolution to an alternate. Also that *“She isn't
  online. Her policy is”* describes the post-mortem case exactly, and framing it around death and
  incapacity rather than only agents would widen the audience considerably.
- **UMA / Kantara** — the absent-owner property is the right foundation for the post-mortem case and
  deserves saying out loud in those terms.
- **AuthZen** — tests 7 and 8. A decision API is where a scoped grant and a reasoned refusal would
  actually be evaluated and returned.

## Caveats

Status lines above are a snapshot of 14 October 2026 and several documents were mid-process on that
date. The individual drafts by Hardt and McGuinness carry no IETF endorsement and should not be read
as consensus. All nine U4A drafts were fetched and searched and the quoted
passages are from them, but they were **not** read end to end, so a mechanism could exist in a
section the searches did not surface. The absence findings — no suspend, reinstate, revive, retract,
incapacity, death or successor anywhere in the nine — are whole-text string searches and are solid. The OpenID4VCI approval date and the current revision
of the eKYC/IDA Authority draft were **not** pinned to a primary page and are marked accordingly —
all three need checking before citation.
