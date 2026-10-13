# Findings across the set

What the data says when you read it sideways — across jurisdictions rather than down one.
The viewer recomputes its headline figures from the data every time it draws this page; the
counts written into the sections here were current on **2026-10-02**.

Not legal advice, and not a survey: this is what the sourced data supports, nothing wider.

## 1. The roles are near-universal. The digital adaptation is not.

Counting how many **countries** recognise each canonical role, rather than how many
jurisdictions:

| Canonical role | Jurisdictions | Countries |
|---|---|---|
| `personal-representative-executor` | 50 | **24** |
| `conservator-estate` | 53 | 21 |
| `personal-representative-administrator` | 46 | 20 |
| `anatomical-gift-agent` | 47 | 19 |
| `financial-poa-durable` | 44 | 17 |
| `guardian-person` | 44 | 17 |
| `health-care-agent` | 42 | 14 |
| … | | |
| `digital-assets-fiduciary` | 24 | **4** |
| `online-tool-designee` | 21 | **2** |

Every legal system in the set has someone who steps into a dead person's shoes, and almost
all have someone who acts for a living person who cannot. Executor or its equivalent is the
single most universal role in the data, present in 24 of 24 countries.

**The gap is not conceptual, it is digital.** `online-tool-designee` exists in two countries.
Whatever a standard needs to carry, it is not a new idea about who may act — that idea is
settled nearly everywhere. It is the means of proving it to a platform.

Nor is the United States monolithic about it. **Delaware is the only US jurisdiction in this set
with no online-tool designee at all** — its 2014 digital-assets act predates the uniform one and
contains no such mechanism — while Massachusetts and Louisiana have no fiduciary-access statute to
hang one on. Three of the twenty US states here have nothing a platform-side designation could
bind to, and they get there three different ways: one legislated early and kept its own act, two
have not legislated. A design that treats "the US" as a single RUFADAA jurisdiction is wrong in all
three — and Virginia shows the fork was real rather than inevitable, because it legislated early
too, in the same window as Delaware, and then **repealed its own act** in favour of the uniform
one.

## 2. Four regimes, in three countries, address post-mortem digital authority directly

Only France and the United States have a statute conferring fiduciary access to digital
assets as such (`digitalAssetsFiduciaryStatute`: true in 20 of the 40 jurisdictions that record
it — France, the US model layer, the RUFADAA states, and **Delaware, which is not one of them**;
the two US states with no fiduciary-access statute at all, Massachusetts and Louisiana, record it false).
Italy arrives at a nearby place by a different route. The four shapes are not variations — they
disagree about the default:

| | Mechanism | Default if the person said nothing |
|---|---|---|
| **US (RUFADAA)** | Custodian's online tool names a designated recipient; otherwise a fiduciary under other law requests disclosure | Catalogue yes; **content needs the user's consent**, or a court direction for a personal representative |
| **France (Loi 78-17 art. 85)** | Directives, general or particular, may name a person charged with execution; **art. 85 III obliges every online service to offer the choice**; contrary terms of service are *réputée non écrite* | **Heirs** may act so far as settling the succession requires |
| **Italy (Codice privacy art. 2-terdecies)** | The deceased's GDPR rights may be exercised by someone with their own interest — **unless the person forbade it in writing to the controller**, and that prohibition binds | Rights **are** exercisable by interested persons |
| **Delaware (12 Del. C. ch. 50)** | No online tool at all. A fiduciary has "the same access as the account holder" and is **deemed to have their lawful consent**; a licence term limiting access is **void against the public policy of the State**, and a choice-of-law clause importing one is unenforceable | **Full control**, unless a governing instrument or court order says otherwise |

The design consequence is concrete: a protocol cannot assume a direction is a *grant*. Italy's
instrument is a **prohibition lodged with the controller**; France's may be either and is
revocable at any time; RUFADAA's is a disclosure direction that beats a terms-of-service
clause only where the user acted affirmatively and distinctly. **Allow and forbid both have to
be first-class, addressed to the controller, and revocable.** A design that models only
consent silently mis-implements Italy and under-implements France.

Virginia is the control that makes Delaware's position a choice rather than an accident. Both
states legislated on digital assets before RUFADAA existed — Virginia's Privacy Expectation
Afterlife and Choices Act of 2015 is still printed, repealed, as article 3 of its chapter 1, next
to the uniform act at article 3.1 — and only one of them changed course. Virginia repealed and
adopted; Delaware kept its own. The two are adjacent states with the same starting point and
opposite defaults, which is as close to a controlled comparison as this data gets.

Delaware is the fourth shape and the one that breaks the assumption hardest, because it has no
designation step to model. Delaware legislated in 2014, before RUFADAA existed, and never
replaced its act: it reverses the uniform default so that the fiduciary controls everything
unless the *user* opted out through a will or trust, and it attacks the problem at the licence
rather than at the platform's interface. §5004(b) voids a term limiting fiduciary access as
against the strong public policy of the State unless separately assented to, and §5004(c) makes
a choice-of-law clause unenforceable where it would import a law that enforces one — **the only
provision in this data aimed at a custodian moving the question to a friendlier forum.** For a
standard the lesson is that a protocol which requires a platform-side designation to exist has
nothing to bind to in Delaware, where the governing instrument is the only channel.

## 3. France is the only jurisdiction that compels the platform

Everywhere else, online tools are *recognised where custodians choose to offer them*. Art. 85
III requires every provider of an online public communication service to inform users of what
happens to their data on death and let them choose whether to pass it to a designated third
party.

A second duty sits earlier in the lifecycle: art. 48 obliges a controller, when it collects
someone's data, to inform them of the right to define post-mortem directives at all. So France
compels both the telling and the offering.

Neither duty is merely declaratory. Art. 16 brings breaches of "la présente loi" within the
CNIL's sanction competence, and art. 20 IV reaches an injunction carrying an *astreinte* of up
to 100 000 € per day of delay and an administrative fine of up to 10 million € or 2 % of total
worldwide annual turnover, whichever is higher. §13 is about where those teeth land.

That is the largest standards opportunity in the data: a legal mandate to provide exactly the
mechanism a protocol would specify, with no technical form specified anywhere in the statute.
Anything that interoperates is competing with bespoke per-platform implementations, not with
an incumbent standard.

## 4. Durability by default is a minority rule, and three routes reach it

`poaDurableByDefault` is **false in 25** of the 44 jurisdictions that record it and **true in 19**
— Denmark, Finland, Germany, the Netherlands and Sweden, plus the US model layer and the states
that took the Uniform Power of Attorney Act: Idaho, Illinois, Maine, Michigan, New York, North
Carolina, Ohio, Oklahoma, Pennsylvania, Utah and **Virginia**, with **Maryland** reaching the same
default through an act of its own and Louisiana by an entirely different route. The majority still
require a dedicated instrument or express words.

Those nineteen get there three different ways, which matters for anyone modelling the lifecycle:

- **By design** — the UPOAA states, where §104 says a power is durable unless it expressly
  provides otherwise. Maryland is the reminder that the design is not the uniform act's property:
  title 17 is its own twenty-section act, keeps the older vocabulary of "attorney in fact", and
  still lands on the uniform rule at §17-105(c) — durable "unless otherwise provided by its terms",
  expressly applied to **all** powers of attorney. Michigan qualifies it: §556.204 is captioned a *limited* presumption, and
  a power not executed with the §205 formalities is not durable at all, however clearly it says
  so.
- **By omission** — the Netherlands, where BW art. 3:72 lists what ends a *volmacht* (death,
  *ondercuratelestelling*, bankruptcy, revocation) and incapacity is simply not on the list.
  Nothing declares durability; it follows from the absence of a terminating event.
- **By contract** — Louisiana, where the instrument is not a power of attorney at all but a
  *mandat*, a contract under C.C. art. 2989. Art. 3026 keeps it alive through the principal's
  incapacity "in the absence of contrary agreement", so durability is the term you contract out
  of rather than words you put in.

Ireland is the sharp contrast: an ordinary agency dies with capacity, and an enduring power
**does not enter into force until** both registration and incapacity (2015 Act s 59(4)) — two
cumulative gates where England and Wales next door needs none for property.

Delaware shows the same thing from the other direction, and the trap there is structural rather
than chronological. Title 12 chapter 49A is not the uniform act, but it borrows its architecture
down to the numbering — §101 short title, §102 definitions, §104 durability, §109 effectiveness,
§110 termination — and then §49A-104 makes a power durable **only if** it says "This power of
attorney shall not be affected by the subsequent incapacity of the principal". The same section
number answers the same question the opposite way, so Delaware sits with Washington, New Jersey and
Massachusetts in the opt-in majority while reading, section for section, like a uniform-act state.
**Shared structure is not a shared rule.** Nothing in the citation form distinguishes §49A-104 from
§104 of the act it is modelled on; only the text does. A mapping built by matching section numbers
across jurisdictions — the obvious shortcut when normalising this kind of data — inverts Delaware's
default and reports it as durable. Virginia is the proof: §64.2-1602 is the same section of the same
act in the neighbouring state, with the uniform words intact, and the two sections answer the same
question oppositely. One of them is numbered 104 and one 1602, which is the only difference a
machine would see.

Oklahoma shows how little the default settles on its own. It has **two live power-of-attorney
acts with opposite presumptions**: the Uniform Power of Attorney Act of 2021, codified in the
probate title at §58-3004, is durable unless the instrument says otherwise, while the Uniform
Statutory Form Power of Attorney Act of 1998 survives at §15-1004 and makes a power durable only
if it carries language saying so. What resolves it is neither default but an applicability
section — §58-3003 applies the 2021 act to all powers of attorney bar four carve-outs, so the
1998 act now supplies a form read under the newer act's rules. Anyone reading Oklahoma's
durability rule off §15-1004, which is still in the statute book and still says the opposite,
gets it backwards.

## 5. Registration before use splits the common-law world against itself

`poaRegistrationBeforeUse` is true in 10 of the 38 jurisdictions that record it and false in 28.
The split does not follow legal
family: England & Wales, Scotland, Ireland, Singapore, Japan, South Korea, Denmark, Finland,
France and Italy require a registration or filing step; most US states, the Australian states,
the Canadian provinces, the Netherlands and Northern Ireland do not.

Singapore is the outlier worth noting: registration there is **constitutive**, not procedural
— the Act does not say a lasting power must be registered before use, it says the power is not
created unless registered.

For a protocol this is the difference between a credential that can be issued at signing time
and one that cannot exist until an authority acts.

## 6. Organ donation: opt-out is European, recent, and still soft

`organDonationModel` is **opt-in in 33** of the 43 jurisdictions that record it and **opt-out in
10**. The opt-out set
is almost entirely European — Finland, France, Ireland, the Netherlands, Spain, Sweden and all
three UK jurisdictions — plus Singapore.

Nearly all are *soft* opt-out: Ireland's deemed consent does not apply at all where no
designated family member can be identified; the Netherlands registers silence as *geen bezwaar*
only six weeks after a reminder. The register is the operative artefact in every case, which
makes this the one role in the set where a national lookup service already exists and a
standard would be integrating rather than inventing.

Ireland's commenced on **17 June 2025**, the most recent substantive change in the data.

## 7. Watch the country column, not the jurisdiction column

Four roles look widespread by jurisdiction count and are not:

| Role | Jurisdictions | Countries |
|---|---|---|
| `health-records-representative` | 40 | 5 |
| `benefits-payee` | 34 | 5 |
| `tax-representative` | 34 | 5 |
| `veterans-fiduciary` | 27 | 3 |

These are federal-layer roles inherited by every sub-national file in the US, Australia and
Canada. They are national programme mechanics, not a global pattern, and treating them as
one would over-generalise from three countries.

The inverse is `universal-successor-heir`: **16 jurisdictions across 16 countries**, exactly
one per country. It is a clean marker of civil-law universal succession, where the estate
vests in the heirs at death with no grant and no appointment.

## 8. Supported decision-making is the newest idea and spreads unevenly

`supportedDecisionMakingStatute` is true in 20 of the 28 jurisdictions that record it and false in
8 — the thinnest coverage of any feature here, so read it as two thirds of what has been sourced
rather than a third of the set. Notably the **US model layer is
false while ten US states are true** — California, Delaware, Florida, Illinois, **Maryland**, New
York, Texas, Utah, **Virginia** and Washington — so the uniform acts have not absorbed it, but
states have.

The two new ones are also the reason to stop reading this feature as a measure of anything but
presence. Set the four states whose statutes this file has actually read against the two questions
above, and they answer them differently enough that one `true` covers four different regimes:

| | Decision recognised as the adult's own | Execution not evidence of incapacity | Third party protected |
|---|---|---|---|
| **Utah** §§75-5-708, 709 | yes | yes | presumptions of validity, plus immunity |
| **Delaware** §§9404A, 9407A, 9408A | yes | yes | immunity for honouring **and** for declining |
| **Maryland** tit. 18 | **no such provision** | yes (§18-103(d)) | immunity both ways (§18-109) |
| **Virginia** §37.2-314.3 | **no** | **no** | **none** |

Virginia is the floor, and worth stating plainly because the feature key flatters it: §37.2-314.3
defines a supported decision-making agreement and a supporter, and then directs the Department to
run an **education and training programme** about them. It gives the agreement no legal effect,
offers a relying party nothing, does not bar a court from treating the agreement as evidence of
incapacity, and reaches only adults with an intellectual or developmental disability. Maryland sits
in between: it protects the adult and the third party but never says what a supported decision *is*
for the purposes of other law, so the instrument that Utah and Delaware make operative is in
Maryland only shielded.

Utah's, enacted in 2025, is the strongest in the set on both of the questions that decide whether
such a statute does anything. A decision made with a supporter's assistance "shall, for the
purposes of any provision of law, be recognized as the decision or request of the principal and
may be enforced on the same basis as a decision or request of the principal without support", and
a court "may not consider an individual's execution of a supported decision-making agreement as
evidence of the individual's incapacity" — the two failure modes of a supported-decision regime,
closed expressly. Utah also connects the arrangement to something else: §75A-9-111(2)(g) puts an adult who has
routinely assisted the individual with supported decision making in the preceding six months into
the default health-care surrogate priority list, so the informal supporter is promoted into a
statutory role rather than left in a parallel track. Delaware's §2512(b)(7) does the same, in the
same words, which is unsurprising once you know both states enacted the same uniform health-care
act — but Delaware's supporter arrives better equipped. Its Supported Decision-Making Act (16
Del. C. ch. 94A) is older than Utah's by most of a decade, and §9407A likewise makes a decision made
or communicated with a supporter's assistance the principal's own "for the purposes of any provision
of law", enforceable on the same basis, while §9404A(c) bars treating the agreement as evidence of
incapacity. Ireland's 2015 Act is built on it as the first of three graded tiers; Victoria, British
Columbia, Québec, Italy, Japan, South Korea, India, Brazil and Argentina all have a form.

The part of these two statutes a standard should read first is the part that is not about the
supported person at all. Both legislate **the relying party's position**, which almost nothing else
in this data does for any role. Delaware §9408A immunises a person who in good faith honours an
authorisation in an agreement — and, symmetrically, one who in good faith declines, including on
grounds of conscience or a facility's written policy. Utah §75-5-709 goes at it from the evidentiary
side: a non-party, "including a provider of health care or financial services", may presume the
signatures genuine and the agreement and the supporter's authority valid, each unless it has actual
knowledge otherwise, and is not liable for giving effect to the agreement or following the
supporter's direction.

That is an acceptance rule of the kind an interoperability profile needs, already drafted, and it
exists for the newest and least formal instrument in the set — §15 sets it beside the other three.
Delaware §9410A even puts the forms on the Department of Health and Social Services, so the artefact
is standard; the same state prescribes no form for a default surrogate's declaration (§14). Within
one statute book, the newer idea got the better plumbing.

It is the one place where the canonical vocabulary is still moving, which is a reason to treat
`supported-decision-maker` as provisional rather than settled.

## 9. Not one mechanism, and a tenfold spread in the number that triggers it

This section used to open by saying that every US state lets a successor collect a small estate
without a grant, on an affidavit, after a short wait — one uniform mechanism with a wildly
variable threshold. The threshold half is right. The uniform half was never true, and the data
said so before the prose did: `smallEstateWithoutGrant` has been **false for New York** all
along, because SCPA article 13 voluntary administration is filed *with the Surrogate's Court*
and the affiant acts under a court-issued short certificate. Maryland now makes two, and more
plainly: its small estate is an **administration**, in which the register of wills directs the
petitioner to serve as personal representative and issues letters (§§5-602, 5-603). Virginia
then adds a third shape at the other extreme, a tier with **no document at all**.

So there are at least four mechanisms wearing one name:

| | What the successor does |
|---|---|
| Most of the US layer | presents a sworn affidavit to whoever holds the asset; no court involved |
| **Virginia** under $35,000 | **nothing** — the holder may simply pay a successor (§64.2-602) |
| **New York**, **Maryland** | files with the court or register and acts under a grant it issues |
| **Idaho**, **Oklahoma** | petitions for a decree or summary administration with no ceiling at all |

The threshold varies across all of them. Every amount and wait in this table is now checked against
the `smallEstateWithoutGrant` feature data by `scripts/check-findings.py`, which fails if the two
drift apart, if a jurisdiction with a recorded ceiling has no row, or if a row claims a waiting
period the data does not record:

| | Ceiling | Wait | Second ceiling, and when it applies |
|---|---|---|---|
| Florida | $2,000 | — (6 months) | — |
| North Carolina | $20,000 | 30 days | — |
| Massachusetts | $25,000 | 30 days | — |
| Uniform Probate Code §3-1201 (the model) | $25,000 | 30 days | — |
| Ohio | $35,000 | — | $100,000 where the surviving spouse takes the whole estate |
| Maine | $40,000 | 30 days | CPI-indexed |
| Delaware | $50,000 | 30 days | — |
| Maryland | $50,000 | — | $100,000 where the surviving spouse is the sole legatee or heir |
| Michigan | $50,000 | 28 days | — |
| New Jersey | $50,000 | — | $20,000 where there is no spouse, civil union partner or domestic partner |
| New York | $50,000 | none | — |
| Oklahoma | $50,000 | 10 days | — |
| Pennsylvania | $50,000 | — | — |
| Texas | $75,000 | 30 days | — |
| Virginia | $75,000 | 60 days | $35,000, below which no affidavit is needed at all |
| Idaho | $100,000 | 30 days | no ceiling where a surviving spouse is the sole devisee or heir |
| Utah | $100,000 | 30 days | — |
| Washington | $100,000 | 40 days | — |
| Illinois | $150,000 | none | — |
| Louisiana | $200,000 | — | $125,000 for an ancillary succession; no ceiling if the death was 20+ years ago |
| California | $208,850 | 40 days | CPI-indexed |

Four of those rows were wrong until this table was rebuilt from the data, and the errors all ran
the same way — a single figure standing in for a conditional pair, or for a different mechanism
entirely. Florida was listed at $75,000, which was the **summary administration** ceiling, a court
route, and which ch. 2026-57 raised to $150,000 in July 2026 in any case; the only Florida figure
that belongs in a table about collection without a grant is the **$2,000** a family member can draw
from sole-name accounts under §735.303. Ohio was listed at $100,000, which is only the
sole-surviving-spouse case; its general ceiling is $35,000. New Jersey was listed at $20,000, which
is only the case where there is **no** spouse. Louisiana and Illinois were given as ranges that
conflated two different conditions with a figure changing over time.

The same claim, presented to the same kind of custodian, is effective over a range that
spans an order of magnitude — and two states index the figure to inflation while the rest
legislate a flat amount that silently erodes. Utah shows that the choice is deliberate rather than
an oversight: §75-1-110 indexes five figures in its probate code to the CPI — the spouse's
intestate share, the elective share, the homestead allowance, exempt property and the family
allowance — and the small-estate ceiling is not one of them.

For a protocol the lesson is narrow and useful: **do not encode the threshold.** Whether a
small-estate claim is good is a question for the law of the decedent's domicile at the date of
death, not a number a credential or a custodian can carry. What a credential can usefully
assert is the affiant's sworn statement and the state whose law they swore it under — and it
cannot assume there is an affidavit to carry, because in Maryland and New York the route runs
through an office that issues its own artefact, and in Virginia's lowest tier there is no artefact
at all.

The waiting period varies too, and less visibly. Thirty days is the common figure, but it is a
custom rather than a rule: **Oklahoma opens the affidavit route after ten** days (§58-393),
**Virginia makes the successors wait sixty** (§64.2-601), and **New York imposes no wait at all**,
because voluntary administration has no waiting period. Virginia then puts a shorter clock inside
the longer one: the licensed funeral service establishment may claim after **thirty** days
(§64.2-604), ahead of the successors it is paid out of. So the first lawful claim on the same estate
can fall anywhere from the day of death to two months after it, and in one state two different
claimants have two different start dates. A protocol that assumes a month is wrong in three
jurisdictions out of twenty, in both directions.

What the affiant must swear to varies as much as the ceiling, and that is the part a credential
would actually have to carry. The model asks for value, timing and the absence of a personal
representative. Delaware's §2306 asks for all of that **plus** that known debts are paid or
provided for and that the surviving spouse's §2308 allowance has been paid, provided for, waived or
lapsed — two facts about the state of the estate rather than about the claimant. It also closes the
class: the route is open to the spouse, a grandparent or a lineal descendant of a grandparent, their
personal representative or guardian, the trustee of a trust the decedent created, the named executor
if qualified, and — found nowhere else in this data — **a funeral director licensed in this State**.
Delaware has decided in advance who may ask, where most of these statutes describe a successor and
leave identification to the custodian.

Maryland raises the ceiling on the same test rather than removing it: §5-601(c) doubles $50,000 to
**$100,000 where the surviving spouse is the sole legatee or heir**, so the question "how much" is
answered partly by "who". And Virginia's affidavit is the only one in this set that is a prescribed
statewide artefact: §64.2-601 requires it to be **on a form prepared by the Office of the Executive
Secretary of the Supreme Court of Virginia**, and it names a single **designated successor** to
receive payment who then owes the others a statutory fiduciary duty. Everywhere else the affidavit's
contents are specified and its shape is not.

Two states add a route with no ceiling at all, and reach it by different tests. Idaho asks **who
inherits**: under §15-3-1205, where a surviving spouse is the sole devisee or heir, a petition and
hearing produce a decree with the same effect as a formal decree of distribution, with no personal
representative and no amount limit. Oklahoma asks **when the death was and where the decedent
lived**: summary administration under §58-245 is available where the estate is $200,000 or less,
*or* where the decedent has been dead more than five years, *or* where they resided in another
jurisdiction. Size of estate is simply irrelevant in either case — which means a credential that
carried a value band would misread both.

## 10. An instrument can be nearly formless

Idaho replaced its living will and its durable power of attorney for health care in 2023 with
one instrument, the advance care planning document. Its mandatory elements are the person's
name, date of birth, telephone number and mailing address, a signature, and a date. That is
all. §39-4510(1) then provides that provisions "left blank by a person executing the document
shall be deemed intentional and shall not invalidate the document", and §39-4510(2) lists as
optional — things an ACPD "may but is not required to include" — the nomination of a health
care agent, and notarisation.

Set against Maine, where §5-905 makes notarisation a condition of a power's *validity* and a
durable power is void without two long statutory notices, the set's range on execution
formality is nearly total: from two witnessed notices and a notary to a signed sheet of paper
with the agent's name left blank on purpose.

Two consequences for anyone designing around these documents:

- **There is no field you can rely on finding.** A valid Idaho ACPD may name no agent at all.
  A schema that requires an agent identifier cannot represent a valid instrument, and one that
  treats a missing agent as an error will reject conforming documents.
- **Notarisation cannot be the trust signal.** In Maine its absence voids the instrument; in
  Idaho its presence is an optional extra. Any rule of the form "accept if notarised" is
  simultaneously too strict and too weak across one set of twenty US states.

Maryland holds both ends of the range at once, and by a wider margin than Delaware does. Its
financial power of attorney is the most formal instrument in this data: §17-110 wants writing, a
signature, acknowledgement before a notary **and** attestation by **two** adult witnesses — and if
it is executed remotely, the principal and every witness must be in the presence of one another
**and of a supervising attorney**, who must then produce a "certified power of attorney", a paper
version of every page with a signed certification of what they observed. Maryland is the only
jurisdiction here that makes a lawyer's participation a condition of validity.

The same statute book then lets a person appoint a health care agent **by speaking**. Under
§5-602(d) an oral advance directive made in front of the attending physician, physician assistant or
nurse practitioner and one witness has the same effect as a written one, provided its substance is
written into the medical record and signed by the clinician and the witness. And under §5-602(c)(3)
the State-designated health information exchange may accept an **unwitnessed video record** as a
valid advance directive — including to appoint an agent — if it is dated and stored by an electronic
advance directives service recognised by the Maryland Health Care Commission.

Set those three beside each other: a notary, two witnesses and a supervising attorney for the
property instrument; a sentence spoken to a nurse practitioner for the health one; a dated video
file with no witness at all, held by a state-designated intermediary. **Formality does not track the
jurisdiction, and it does not track the gravity of the decision either** — the instrument that can
refuse life-sustaining treatment is the one with no witness requirement. The video provision is also
the only place in this data where a statute contemplates the authority-conferring instrument living
with a designated third party rather than in the claimant's hands, which is the shape §14 and §15
argue is missing everywhere else.

Delaware shows the same instability inside one jurisdiction, less starkly. A Delaware financial power of attorney is the strictest instrument in
this set: §49A-105 wants writing, signature, a date, a notarial officer **and** one adult witness
who is neither related to the principal nor a beneficiary under their existing will or trust, and
§49A-105(b) adds an evidentiary penalty for omitting the statutory notice — without a signed notice
the **agent** carries the burden of proving the power valid if it is challenged. The same state's
health-care power of attorney, in the same year's statute book, needs one adult witness, no notary
at all, and will accept that witness's presence **by audio alone** where they know the individual or
can authenticate them from their answers. Strictest and nearly formless, one jurisdiction, chosen
per instrument. **Formality is a property of the document type, not of the jurisdiction** — so
"Delaware requires a notary" is not a sentence that can be true or false, and a rule table keyed on
jurisdiction has the wrong primary key.

Idaho goes further on the trigger. The model has the agent's authority begin on incapacity,
usually certified by a clinician. §39-4504(1)(b) instead gives the ACPD agent authority "if the
conditions in such advance care planning document for authorizing the agent to act have been
satisfied" — the instrument defines its own commencement, and the statute does not supply a
default. **When the authority starts is a fact about the document, not about the law.**

## 11. Idaho compels the relying party, as France compels the platform

§3 noted France as the only jurisdiction that obliges platforms to offer a post-mortem
designation mechanism. Idaho obliges the other side of the exchange — the party being asked to
honour a document — and does it in the broadest terms in this data. It is not quite alone: RUFADAA
§16(a) obliges a *custodian* to comply with a fiduciary's request within 60 days, which is a duty
running the same direction. The difference is scope. RUFADAA's duty is owed by one kind of
business, on one kind of request, once the fiduciary has produced what §§7–15 require. Idaho's is
owed by **any person asked to accept any substitute decision-making document**, and it bars the
most common refusal outright.

Idaho enacted the Uniform Recognition of Substitute Decision-Making Documents Act (title 15,
chapter 15). §15-15-103 makes a document executed in another state valid in Idaho if it
complied with the law of the place of execution. §15-15-106(1) then does the work:

> a person that is asked to accept a substitute decision-making document shall accept within a
> reasonable time a document that purportedly meets the validity requirements of section
> 15-15-103 … The person may not require an additional or different form of document for
> authority granted in the document presented.

And it has teeth, which §15 takes up: §15-15-106(3) makes a person who refuses in violation of the
section subject to a court order mandating acceptance **and** liable for the reasonable attorney's
fees and costs of getting it. That is what turns the duty from a statement of policy into a thing a
holder can be made to do.

This section used to add that Idaho's was the only fee-shifting provision in the data. That was
wrong, and adding Virginia and Maryland is what caught it: the fee shift is the **Uniform Power of
Attorney Act's** own remedy at §120, so it travels with that act. Virginia's §64.2-1618(C) and
Maryland's §17-104(b) both give a court order mandating acceptance plus liability for reasonable
attorney's fees and costs, in nearly the uniform words — though not for the same instruments, which
§15 takes up. What is distinctive about Idaho is not the remedy but its **reach**: §120 protects a
power of attorney, while Idaho's duty covers any substitute decision-making document, health-care
and personal-care ones included.

Three things make this the closest analogue in the data to what an interoperability standard
is for. The duty runs against **any person** asked to accept, not only officials or registries.
It covers **health-care and personal-care documents as well as property ones**, where the
uniform power-of-attorney acceptance regime (§120, cross-referenced here at
§15-12-120(2)(b)) reaches only powers of attorney. And the second sentence is a direct bar on
the most common practical refusal — demanding the holder re-execute on the relying party's own
form.

Taken with France, the data now contains a mandate on each side of the same transaction and in
neither case any specified technical form:

| | Who is compelled | What they must do |
|---|---|---|
| **France**, Loi 78-17 art. 85 III | the online service | inform the user and let them choose who receives their data on death |
| **Idaho**, §15-15-106 | anyone asked to accept a document | accept within a reasonable time; do not demand a different form |
| **Delaware**, 12 Del. C. §2307(b) | a holder of estate property shown a small-estate affidavit | pay, deliver or transfer — or be compelled, in the Court of Chancery |

That is the shape of an opportunity rather than an obstacle. Both statutes describe an outcome
and leave the mechanism open, which is precisely the gap a profile can fill — and in Idaho's
case the statute has already removed the relying party's strongest objection to accepting an
unfamiliar artefact.

The exceptions matter and should be read: §15-15-106(2) preserves refusal where the person
would not have to act for the individual anyway, where they have actual knowledge the
authority has terminated, and in the other listed cases.

Delaware's row is narrower than Idaho's and completes it, which is why it is worth setting beside
it. Idaho states a **duty** of broad scope — any person, any substitute decision-making document —
and names no consequence for breach. Delaware covers exactly one artefact, the §2306 small-estate
affidavit, and supplies the **remedy**: §2307(b) says that where the holder refuses, the property
"may be recovered or compelled in an action brought in the Court of Chancery … upon proof of the
facts required to be stated in the affidavit". The two halves of an acceptance regime are in the
data, and in different states. Note what the remedy is priced at: an action in a court of equity,
which is worth bringing for an estate and not for a social-media account — so even the jurisdiction
that made acceptance enforceable left the small digital case unreachable. §2307(a) is the other half
of the bargain and the part a custodian cares about: a holder who *does* pay on the affidavit is
released as if it had paid the personal representative, and is not required to inquire into the truth
of any statement in it. The affiant's sworn statement is enough precisely because the risk of its
being false was legislated off the custodian and onto the distributee — which is the pattern §15 is
about.

## 12. Law in force is not law enacted

Three jurisdictions in this set now carry two answers at once, at three different distances, which
is what turns this from a curiosity into something a standard has to handle:

| | Replacement regime | Commences |
|---|---|---|
| **Utah** | Uniform Health Care Decisions Act (2025 ch. 439) | 1 January 2026 — already in force |
| **Idaho** | Uniform Guardianship, Conservatorship and Other Protective Arrangements Act (S 1240, 2026 ch. 79) | 1 January 2027 |
| **Oklahoma** | Uniform Health Care Decisions Act of 2026 (enrolled HB 1687) | 1 July 2027 |

Oklahoma's is the starkest, because the act does not merely amend a regime — it repeals the
Oklahoma Health Care Agent Act and introduces a default surrogate where the state currently has
none. So for the next nine months Oklahoma is the only US jurisdiction here with no ranked
surrogate at all, and the fix is already law.

Idaho is where the pattern is easiest to read, because the statute book prints it.
Title 15 chapter 5 is currently published under two headings — "PROTECTION OF PERSONS UNDER
DISABILITY AND THEIR PROPERTY [EFFECTIVE UNTIL JANUARY 1, 2027]" and "UNIFORM GUARDIANSHIP,
CONSERVATORSHIP, AND OTHER PROTECTIVE ARRANGEMENTS ACT [EFFECTIVE JANUARY 1, 2027]". Idaho
enacted UGCOPAA in 2026 (S 1240, ch. 79); it is law, and it is not yet in force. §15-5-401 was
"repealed and added" with effect from that date.

The guardian and conservator rows here record the law in force and say what replaces it.
Anyone citing them needs to know that they expire: on 1 January 2027 Idaho's answer to "when
does a conservator's authority begin, and on what finding" changes, and a reader who cached
the current answer is wrong without anything having visibly moved.

Delaware supplies the control case, and it is the one that makes the problem concrete rather than
hypothetical. Three jurisdictions here have enacted the **same** act, the Uniform Health-Care
Decisions Act (2023), in three consecutive sessions, and its section order is identical in each:
Delaware's is in force (84 Del. Laws c. 467), Utah's commenced on 1 January 2026, and Oklahoma's
waits until 1 July 2027. So a citation to "§2512, the default surrogate list" resolves to live law
in Delaware, to live law in Utah, to nothing yet in Oklahoma — and in Oklahoma, to law that will
*displace* the regime a reader finds there today.

That is the clearest statement in this data of what a citation has to be. **A section number is not
an address.** Section, jurisdiction and date are all three required before a reference resolves, and
the trio above is a case where two of the three are identical across jurisdictions and the third
decides the answer. A standard that models "the applicable rule" as a section reference, or caches
one, is relying on the one component these three jurisdictions do not share.

Virginia adds a fourth case that is worse than all three, because there is no date to record at
all. §§64.2-2000 and 64.2-2009 — the definitions and the **order of appointment** for guardianship
and conservatorship, which is precisely where this data says the authority begins — are each printed
**twice** in the Code, one version marked "(Contingent expiration date; see Acts 2026, cc. 992 and
1081, cl. 3)" and the other "(Contingent effective date; …)". The switch is tied to an enactment
clause, not to a calendar date, and the Code does not reproduce the condition. So for these two
sections the question this whole section is about — *what did the law say as at a given moment* —
cannot be answered from the statute book at any date, past or future.

The substantive difference between Virginia's two versions is small: the live one cross-references
§64.2-2009.2 on capacity to vote, the pending one folds that into the chapter. The mechanism is the
finding, not the amendment. A jurisdiction can put its statute book into a state where "as at" has
no answer, and a reader who assumes commencement is always a date will not even see it.

| | How the switchover is expressed |
|---|---|
| **Utah** | a date, already passed |
| **Idaho**, **Oklahoma** | a date, in the future |
| **Virginia** | **a condition in an act the Code does not quote** |

Two design points follow, and they are not specific to Idaho:

- **Authority assertions need a time, not just a date of issue.** "X is conservator of Y" is
  evaluated against the law of a jurisdiction *as at* some moment. A standard that records only
  when a credential was issued cannot express which regime it was issued under.
- **Enactment and commencement are separate events and both are citable.** Ireland's deemed
  consent commenced on 17 June 2025, years after enactment; Idaho's UGCOPAA is enacted with a
  commencement 15 months out. Anything built from a snapshot of "what the statute book says"
  without reading the commencement provisions will be wrong in both directions.
- **Commencement is not always a date.** Virginia's is a condition, and the condition lives in the
  act rather than in the code. A schema with an `effectiveFrom` date has nowhere to put that, and a
  pipeline that requires one will either drop the pending version or invent a date for it.

## 13. An obligation to offer the choice is not an evidence layer

France compels the platform (§3) and Idaho compels the relying party (§11), but neither says
how the person who turns up after the death proves they are who they claim. France is the case
where that gap can be read precisely, because the implementing decree answers the question for
one claimant and not the other.

Décret n° 2019-536 art. 124 tells an heir exactly what to bring:

> Outre la justification de son identité, l'héritier … doit, lors de sa demande, apporter la
> preuve de sa qualité d'héritier par la production d'un **acte de notoriété** ou d'un **livret
> de famille**.

For the *personne chargée de l'exécution des directives* — the person the deceased actually
chose — the decree says nothing. Art. 85 confers the standing and stops there.

| | Standing from | Proof of standing |
|---|---|---|
| **Heir** | art. 85 II, failing directives | prescribed: identity + acte de notoriété or livret de famille |
| **Designated person** | art. 85 I, by the deceased's own choice | none prescribed |

What is left for the designee depends on where the directives sit. *Directives particulières*
are registered with the controller, so the platform already holds the designation and can match
it — this is the case that works, and it is effectively France's online tool. *Directives
générales* were meant to sit with a CNIL-certified *tiers de confiance numérique*, referenced in
a *registre unique* whose arrangements art. 85 I leaves to a décret en Conseil d'État. No such
décret was found: the texts linked to art. 85 are the 2019 decree, which covers only the heir,
and a 2020 arrêté routing rights within one sector. On that evidence the general-directives
channel has a statutory container and no machinery — recorded as unverified, since failing to
find a decree is weaker than reading one.

The mandate is not short of teeth, which is what makes the gap interesting. France built no
bespoke penalty for art. 85 and needed none: art. 16 gives the CNIL's *formation restreinte*
competence over failures to meet obligations arising from the GDPR "**et de la présente loi**",
and art. 85 is in *la présente loi*. That inheritance matters more than it sounds, because
post-mortem data falls outside the GDPR's material scope — the hook had to be national. From
there art. 20 IV supplies an injunction to comply with an *astreinte* of up to 100 000 € per day,
temporary or definitive limitation of the processing, and a fine of up to 10 million € or 2 % of
total worldwide annual turnover, whichever is higher; the familiar 20 million € / 4 % ceilings are
reserved by that same article to the cases in GDPR art. 83(5) and (6). Art. 21 allows provisional
interruption of the processing for up to three months, and Code pénal art. 226-22-2 punishes
obstructing the CNIL with a year and 15 000 €. Whether any of it has ever been used on art. 85 III
is a separate question, not established here.

Read against the table above, every one of those instruments attaches to the duty to **offer** the
choice. None attaches to honouring the designation, and none to making it provable. A provider
that informs its users and renders a checkbox has complied, while the person they designated still
arrives at the controller with nothing art. 124 recognises.

The inversion is the finding. The claimant the law most wants to empower, because the deceased
named them, is the one with no way to prove it; the fallback claimant, who merely has to be
related, has a centuries-old notarial instrument waiting. **An obligation to offer a choice and
an ability to act on that choice are different problems, and only the first has been legislated.**
That is the gap a credential closes. It is also why §3's mandate has not by itself produced
anything interoperable: not for want of enforcement, but because the enforcement bites somewhere
else.

## 14. Two states enacted the same proof-of-standing rule; one prescribed the artefact

Section 13 is about a right granted without a way to evidence it. Utah is the other side of that
coin, and arrived in the set by accident: its 2025 Uniform Health Care Decisions Act prescribes,
for the claimant whose authority comes from a statutory list rather than from a document, exactly
what they must produce.

> A responsible health care professional may require an individual who assumes authority to act as
> a default surrogate to provide a declaration in a record **under penalty of perjury** stating
> facts and circumstances reasonably sufficient to establish the authority. The Department of
> Health and Human Services **shall create a uniform form** to be used in accordance with
> Subsection (3)(a).

Two things make that worth recording. A default surrogate normally has the weakest evidentiary
position of any role in this data — their authority comes from being someone's spouse or child,
which no instrument states and no court confirms — and Utah is the only jurisdiction here that
gives them a prescribed artefact. And the form is specified to exist: a named agency must publish
it, so the thing a custodian is asked to accept is the same thing every time.

Delaware enacted that same sentence and stopped one clause short, which is the most useful single
comparison in this file. §2512(c) also lets a responsible health-care professional require a
declaration in a record under penalty of perjury establishing the authority — the wording tracks
Utah's §75A-9-111(3) — but Delaware names no agency and prescribes no form. The legal rule is
identical in both states; the artefact is standard in one and whatever the claimant writes in the
other. **The interoperability was lost after the statute, not in it.** Two jurisdictions adopting
the same uniform text produced one state where a custodian knows what it is being handed and one
where it does not, and nothing in the citations distinguishes them. That is the gap a profile
occupies: the rule is already uniform in places, and the thing passed across the wire is not.

It is not a credential, and the difference is the point. The declaration is **self-asserted**: it
is the claimant's own statement, backed by a perjury sanction rather than by anyone having checked
it. Oklahoma supplies the missing end of the scale. Under §63-3102.1 the State Department of Health
must maintain a web-accessible **advance directives registry**, storing directives filed by or with
the authorisation of the person who executed them, and designed to give access to that person, to
**those named as agents in the directive**, and to close relatives. A named agent does not have to
produce anything: the relying party can consult a state register that already names them.

Set against section 13, the set holds seven points on one scale, and the two Maryland and Virginia
rows are the ones that break the self-asserted-to-attested line it used to describe:

| | What the claimant produces | Who stands behind it |
|---|---|---|
| French designated person | nothing prescribed | — |
| **Virginia** last-resort surrogate | **nothing** | **a hospital committee, or two independent physicians, who must document the basis** |
| Delaware default surrogate | declaration, no form prescribed | the claimant, under penalty of perjury |
| Utah default surrogate | declaration on a state form | the claimant, under penalty of perjury |
| **Maryland** friend or other relative | **affidavit of specific facts showing regular contact** | **the claimant — and the physician must file it in the medical record** |
| French heir | *acte de notoriété* or *livret de famille* | a notary, or the civil register |
| **Oklahoma, Virginia** health-care agent | **nothing — a register is consulted** | **a state department, on its own record** |

Virginia's row is the odd one because it produces nothing and is *not* the weakest. §54.1-2986's
last class — an adult who has exhibited special care and concern — hands the question to the
institution: a quorum of the facility's patient care consulting committee, or two physicians who are
not treating the patient, not employed by the facility and not in the attending physician's practice,
**shall determine** whether the person qualifies and **shall document the information relied upon**.
Standing is established by somebody else's recorded finding, which is the only instance in this data
of proof by third-party determination rather than by instrument, oath or register.

Maryland sits between the two kinds. The claimant swears — an affidavit of "specific facts and
circumstances demonstrating that the person has maintained regular contact with the patient
sufficient to be familiar with the patient's activities, health, and personal beliefs" — but
§5-605(5) then makes the attending physician **put the affidavit in the medical record**. The
assertion is the claimant's; the custody of the evidence is the relying party's. That is closer to
how a credential presentation is actually audited than anything else here.

The register rows are no longer singular either, and the second one is broader. Virginia's Advance
Health Care Planning Registry (§54.1-2994) takes a health care power of attorney, an advance
directive, **an anatomical gift declaration** and any other document supporting advance health care
planning, including do-not-resuscitate and portable medical order forms — one register spanning
health care and organ donation, which no other jurisdiction here does. Filing is by the person who
executed the document or their representative, the contents are confidential and FOIA-exempt, and
access is set by Board of Health regulation.

And §54.1-2996 states the limit that both registers share and that anyone building an evidence layer
has to design around: **failure to register does not affect the document's validity**, and nor does
failure to register a revocation. The register is therefore never authoritative on absence. A
relying party that finds nothing in it has learned nothing — which is the same hole as §15's
actual-knowledge problem, seen from the other side. The gap a credential fills is everything these
registers do, made portable *and* made negative-answerable.

One further Utah detail cuts against how credentials are usually built. Under §75A-9-117 the power
of an agent or surrogate **commences** when the individual is found to lack capacity, **ceases** if
capacity is later found or the individual objects to the finding, and **resumes** if the finding is
confirmed. Authority here is not a window with a start and an end; it oscillates with a clinical
determination that can be revisited. A credential carrying a validity period cannot express that,
and one asserting "holder is the surrogate" is making a claim that may be false by the afternoon.
Whatever a standard does about health care has to treat the authority as a question to be asked at
the moment of use, not a fact to be cached.

## 15. Acceptance is already solved in statute, four times over, with the same three parts

The question an evidence layer exists to answer is not "who may act" — §1 says that is settled
nearly everywhere — but "why would the party holding the asset say yes?" Four regimes in this data
answer it, and they are built from the same three components: a **duty** to accept, a **remedy** if
the holder refuses, and a **safe harbour** for the holder that accepts. No two of them carry the
same subset.

| | Duty to accept | Remedy for refusal | Safe harbour for accepting |
|---|---|---|---|
| **Idaho**, URSDDA §§15-15-105 to 107 | any person, any substitute decision-making document | court order **plus** reasonable attorney's fees and costs | assume validity without inquiry absent actual knowledge; rely on asserted facts, a translation, counsel's opinion |
| **UPOAA §§119–120** (the model; **Virginia** took Alternative A, **Maryland** Alternative B) | any person, within **seven business days** of presentation — of *any* acknowledged power of attorney under A, only of the **statutory form** under B | court order **plus** reasonable attorney's fees and costs | rely on the power as genuine absent actual knowledge; rely without investigation on the agent's certification, a translation, counsel's opinion |
| **RUFADAA §16** (the model and the 15 RUFADAA states here) | a custodian, within 60 days of a complying request | court order directing compliance | immune for an act or omission in good faith in compliance |
| **Delaware**, 12 Del. C. §§2306–2307 | — | recovery or compulsion in the Court of Chancery | released as if paid to the personal representative; no duty to inquire into the truth of the affidavit |
| **Supported decision-making** (Del. §9408A, Utah §75-5-709) | — | — | immunity, and in Utah presumptions that the signatures and the authority are genuine |

Two of those rows are the same drafting travelling under different names. Idaho's acceptance regime
**is** the uniform power-of-attorney one, lifted out of §§119–120 and pointed at every substitute
decision-making document rather than only at powers of attorney. So the duty is not as rare as it
first looks: the seven-business-day clock, the five further days after a certification arrives, the
court order and the fee shift are all uniform text, enacted wherever the UPOAA was.

What varies is **which instruments the duty reaches**, and the uniform act is itself the reason,
because it ships a choice. The legislative note to §120 says Alternatives A and B are identical
"except that Alternative B applies only to acknowledged statutory form powers of attorney while
Alternative A applies to all acknowledged powers of attorney". Virginia enacted A: §64.2-1618 owes
the duty on any acknowledged power of attorney. Maryland enacted B: §17-104 owes it only where the
instrument is the statutory form, so a Maryland power drafted any other way is owed nothing at all.
Adjacent states, the same uniform section, and a holder's obligation that turns on which branch the
legislature picked twenty years ago.

That is a sharper version of §4's point. **"Has this jurisdiction adopted §120?" has no useful
answer**, because both states did and they owe different duties; and Idaho widened the instrument
class a third time without changing the remedy at all. Three points on one axis — the statutory
form, any acknowledged power of attorney, any substitute decision-making document — from one piece
of drafting.

Read down the last column rather than the first. The duty is the component a standards body cannot
supply, and where it exists it is usually narrow; the safe harbour is in **all four**, and it is the component that
actually moves a relying party, because it converts "I might be sued for getting this wrong" into "I
am protected if I act in good faith on what I was shown". Delaware's small-estate route is the proof
of concept: a custodian pays out on a stranger's sworn affidavit, for a $50,000 estate, with no court
anywhere in the transaction — not because the affidavit is verified but because §2307(a) moved the
risk of its being false onto the person who swore it.

Every one of these statutes then turns on the same hinge, and it is the one none of them supplies.
The presumption holds **until the relying party has actual knowledge** that the document or the
authority is void, invalid, terminated or revoked: Idaho §15-15-105(1) in those words, RUFADAA
§16(f) through "good faith", Delaware §9408A(1) and (2) expressly both ways, Utah §75-5-709 in its
two presumptions. Not one of them says how a custodian would come to know. The drafters put the
burden where it belongs — on knowledge, not on inquiry — and left blank the channel by which
knowledge would arrive. Maryland shows how wide that gap can be opened by one asymmetry: a
supported decision-making agreement must be written, dated and signed (§18-107), but §18-108 lets
the adult revoke it **"orally, in writing, or otherwise by expressing the adult's specific intent to
revoke"**. The instrument is formal, the revocation is formless, and the third party's immunity
under §18-109 turns on an assumption that it has not been revoked. Nothing requires anyone to tell
them. **That blank is the gap, and it is an evidence problem rather than an
authority problem**: the hard part is not asserting that someone holds a role, it is telling a
relying party that they have stopped holding it.

One asymmetry is worth copying rather than correcting. These statutes protect **refusal** as
carefully as acceptance. Idaho §15-15-106(2) enumerates five lawful refusals — including that the
holder would not have had to act for the individual either, and that someone has reported suspected
abuse to adult protective services — and Delaware §9408A immunises a good-faith refusal, including
one grounded in conscience or a facility's written policy. RUFADAA §16(d) lets a custodian deny a
request where it is aware of lawful access to the account after the request. A design that treats a
refusal as an error, or a protocol that has no way to express "declined, in good faith, on these
grounds", is out of step with all three. **Refusal is a legitimate outcome with reasons attached**,
and the reasons are the interesting payload.

## 16. The finding that starts the authority has a shelf life, and the data knew before this page did

Every other section here treats authority as a span: something begins it, something ends it, and the
interesting questions are what and when. Three jurisdictions say that is not enough, because the
**finding** the authority rests on expires and has to be made again. Two of them have been in this
data since they were added, modelled correctly, and never written up; Virginia is what made them
visible.

| | What must be redone | How often |
|---|---|---|
| **Maryland**, Health-Gen. §5-606 | certification of incapacity by two clinicians, one of whom examined the patient | within **2 hours** before certifying |
| **Virginia**, §54.1-2983.2 | certification by the attending physician **and** a statutory capacity reviewer, both on personal examination | **no less frequently than every 180 days** while the need continues |
| **Virginia**, §64.2-2009(A1) | court review of a guardianship or conservatorship order | within **1 year**, then at least every **3 years** |
| **Victoria**, Guardianship and Administration Act | VCAT reassessment of the order | within **12 months**, then at least every **3 years** |
| **Queensland**, Guardianship and Administration Act | QCAT review of the appointment | at least every **5 years** |

Two of those are health care and three are guardianship, and the difference in scale is not a
rounding error: the shortest is **two hours** and the longest **five years**, four orders of
magnitude apart for the same underlying question of whether the authority still rests on anything.

The modelling consequence is specific. In the state machines these appear as **self-loops** —
`active → active`, the authority continuing because it was re-established — and Victoria and
Queensland already carry them that way (`t-reassess`, `t-review`). Virginia adds a third, and the
first in the US layer. Any lifecycle that offers only *start*, *suspend* and *end* has nowhere to
put a transition whose whole content is "checked again, still true".

For a standard the point is sharper than it looks, because it is not about credential expiry.
A credential's validity period is set by whoever issues it. These intervals are set by the law of
the forum and attach to the **underlying finding**, not to any document: a Virginia guardianship
order is not stale because a certificate aged out but because the court has not looked at it within
three years, and a Maryland certification of incapacity is worthless at the two-hour mark however
fresh the paperwork is. So an assertion of authority needs two times, not one — when the law was
as it was (§12), and when the finding underneath it was last made — and a relying party that caches
either has cached something the issuing jurisdiction expected to go off.

It also gives §14's last row a harder limit. A register answers "is there a document?"; none of
these jurisdictions requires it to answer "was the finding behind that document refreshed on time?"
Utah's oscillating surrogate authority (§75A-9-117) is the same problem without an interval at all:
the authority can lapse and resume with a clinical opinion, and nothing anywhere records the moment
it did.

## What this suggests for a standard

1. **Bind to the roles that already exist.** Executor and administrator are present in 20–24
   countries and are always evidenced by a document — a grant, letters, a certificate, or in
   civil-law systems nothing at all because succession is automatic. A credential that asserts
   *"holder is the personal representative of X"* has near-universal legal meaning. A new role
   invented for digital assets has meaning in two countries. The documents are more varied
   than the roles, though: Idaho is the only jurisdiction in the set where a *trustee* can hold
   a court-issued credential — §15-7-403 letters of trusteeship, recordable with the county
   recorder — where every Uniform Trust Code state expects a certification of trust signed by
   the trustee themselves. Bind to the assertion ("holder is trustee of T"), not to the artefact
   that evidences it.
2. **Carry direction, not just identity.** Allow, forbid, and silence are three different
   states with different defaults in the US, France and Italy respectively. The prohibition
   case is not an edge case; it is Italy's entire model. And "the US" is not one default either:
   Delaware's chapter 50 gives the fiduciary full control unless the *user* opted out in a
   governing instrument, the inverse of RUFADAA, so silence resolves the opposite way one state
   over. The default has to be a property of the jurisdiction in the data, not an assumption in
   the code.
3. **Expect the authority to be gated, and to be re-gated.** In 10 jurisdictions a power does not
   exist, or does not operate, until a registry or court acts — and in Ireland and France the gate
   is explicitly two-part. Issuance time and effectiveness time are not the same event. Nor is
   effectiveness permanent: in Maryland, Virginia, Victoria and Queensland the finding underneath
   the authority has a statutory shelf life, from two hours to five years (§16), so an assertion
   needs the date of the finding as well as the date of the document.
4. **The civil-law systems need no grant at all.** In 16 countries the heirs hold the estate
   from the moment of death by operation of law. There is no document to present. Any design
   that assumes a court artefact excludes a third of the set.
5. **France is the forcing function, and shows what a mandate alone does not fix.** It is the
   only jurisdiction that requires platforms to offer the mechanism, and it voids terms of
   service that cut across the user's choice. The duty is backed by the CNIL's ordinary sanction
   powers — up to 10 million € or 2 % of worldwide turnover, and an astreinte of 100 000 € a day.
   It still prescribes no way for the person the user designated to prove that later, while
   prescribing one for the heir — so the obligation exists, is enforceable, and the evidence layer
   does not exist. A mandate with that much behind it produced no credential, which says the
   missing piece is not pressure on platforms.

## Terms used here

Two kinds of name appear in these sections, and neither explains itself.

**Feature keys** are written in camelCase (`poaDurableByDefault`). They are the cross-jurisdiction
facts the data records for each jurisdiction, each one carrying its own citation, and they are what
the counts in sections 2 and 4 to 8 are counting.

**Every one of those counts is out of the jurisdictions that record that key, not out of all 47.**
Coverage is ragged and deliberately so: a key is only filled in where the answer could be traced to
a primary source, which runs from 41 jurisdictions for `poaDurableByDefault` down to 25 for
`supportedDecisionMakingStatute`. **A missing value means the question has not been sourced, not
that the answer is no.** That is why each count now carries its denominator, and why two sections
describing differently-sized subsets is a property of the sourcing rather than an inconsistency in
the data.

- **`poaDurableByDefault`** — whether a power of attorney keeps working after the person who gave
  it loses capacity *without the document having to say so*. `true` means the law makes a power
  durable unless the document opts out; `false` means durability has to be opted into, by express
  words or by signing a different kind of instrument.
- **`poaRegistrationBeforeUse`** — whether the power has to be registered or filed with a court,
  registry or public authority before the attorney may act on it. `true` means an authority has to
  do something before the document works.
- **`digitalAssetsFiduciaryStatute`** — whether a statute gives a fiduciary access to the person's
  *digital* assets as such. `false` does not mean nobody can ever reach the account; it means no
  statute addresses digital assets specifically, so whoever wants access is arguing from general
  law and the platform's terms.
- **`supportedDecisionMakingStatute`** — whether there is a statute for **supported** decision
  making, where the person keeps legal capacity and a supporter helps them decide. That is a
  different thing from the substitute decision making the rest of this page is about, where
  somebody decides *instead of* the person.
- **`organDonationModel`** — whether donation is `opt-in`, so that donation needs a consent
  recorded by the person or given for them, or `opt-out`, so that consent is deemed unless the
  person recorded an objection.

**Canonical role ids** are written in kebab-case (`personal-representative-executor`). Each one
names the same role across every country in the set, so that an executor in Ireland and a
liquidator in Québec line up in one row even though no two legal systems use the same word. They
are a vocabulary for comparison, not terms of art from any one legal system, and the local
statutory name is always recorded alongside. In the viewer, hovering any of these names shows its
definition; the full list lives in `research/SCHEMA-INTL.md`.

One number to read carefully: **jurisdictions** and **countries** are counted separately
throughout, because a federal country contributes several jurisdictions and one legal idea.
Section 7 is about what happens when those two counts are confused.
