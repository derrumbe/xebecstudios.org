# Findings across the set

What the data says when you read it sideways — across jurisdictions rather than down one.
The viewer recomputes its headline figures from the data every time it draws this page; the
counts written into the sections here were current on **2026-10-14**.

Not legal advice, and not a survey: this is what the sourced data supports, nothing wider.

## 1. The roles are near-universal. The digital adaptation is not.

Counting how many **countries** recognise each canonical role, rather than how many
jurisdictions:

| Canonical role | Jurisdictions | Countries |
|---|---|---|
| `personal-representative-executor` | 57 | **24** |
| `conservator-estate` | 60 | 21 |
| `personal-representative-administrator` | 53 | 20 |
| `anatomical-gift-agent` | 54 | 19 |
| `financial-poa-durable` | 51 | 17 |
| `guardian-person` | 51 | 17 |
| `health-care-agent` | 49 | 14 |
| … | | |
| `digital-assets-fiduciary` | 31 | **4** |
| `online-tool-designee` | 28 | **2** |

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
assets as such (`digitalAssetsFiduciaryStatute`: true in 27 of the 47 jurisdictions that record
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

`poaDurableByDefault` is **false in 27** of the 51 jurisdictions that record it and **true in 24**
— Denmark, Finland, Germany, the Netherlands and Sweden, plus the US model layer and the states
that took the Uniform Power of Attorney Act: Idaho, Illinois, **Iowa**, Kentucky, Maine, Michigan,
**Nebraska**, New York, North Carolina, Ohio, Oklahoma, Pennsylvania, Utah, Virginia and West Virginia, with
**Maryland** reaching the same default through an act of its own and Louisiana by an entirely
different route. The majority still require a dedicated instrument or express words.

Those twenty-three get there three different ways, which matters for anyone modelling the lifecycle:

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

Missouri marks the far end of the opt-in majority, and it is further out than anything else here.
Delaware's §49A-104 wants one sentence; Washington and New Jersey want words to similar effect.
§404.705(1) wants **three cumulative things**: the instrument must be *denominated* a "Durable Power
of Attorney"; it must contain, in substance, one of **two sentences the statute prints in capitals**;
and it must be subscribed, dated and "acknowledged in the manner prescribed by law for conveyances of
real estate". A Missouri power of attorney that is notarised and says plainly that it survives
incapacity, but is headed "General Power of Attorney", has failed the first condition. §404.810 then
carries all three into the health-care power of attorney, so the same magic words gate the authority
to refuse treatment.

**Kansas sits at that same far end, and how it got there is the finding.** §58-652(a) asks for the
same three cumulative things — denominated a "durable power of attorney", containing in substance one
of two sentences the statute prints out, and signed, dated and acknowledged under the revised uniform
law on notarial acts. Kansas prints its two sentences in lower case where Missouri capitalises them,
and that is nearly the whole difference.

The two states are neighbours, and **they share no act at all**: Kansas never enacted the Uniform
Power of Attorney Act and neither did Missouri, so neither rule descends from the other or from a
common model. Set that against this section's usual warning. Delaware and Virginia share an act's
architecture down to the section number and answer the durability question *oppositely*; Kansas and
Missouri share nothing and answer it *identically, down to the sentence*. **Neither the presence nor
the absence of a common uniform act predicts the rule** — which means a reader cannot shortcut this
question from an enactment table in either direction.

Kansas then adds an accommodation the other magic-words state lacks, and it is the kind of detail a
protocol will meet in practice: where the principal is "physically unable to sign … but otherwise
competent and conscious", an adult designee may sign the principal's name, in the principal's
presence, at the principal's specific direction expressed **in the presence of a notary public**. The
instrument is then acknowledged to the same effect as if the principal had signed it. The most formal
durability rule in the file has a route for a signatory who cannot hold a pen.

Put the two poles beside each other and the spread on this single question is the widest in the file:
in twenty-one jurisdictions a power is durable because the legislature says so unless the document
objects, and in Missouri and Kansas it is durable only if the document is titled correctly, recites the
prescribed sentences and is acknowledged — in Missouri to the standard required for transferring
land, in Kansas before a notary. Both are described in
the same four words — "durable power of attorney".

## 5. Registration before use splits the common-law world against itself

`poaRegistrationBeforeUse` is true in 10 of the 45 jurisdictions that record it and false in 35.
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

`organDonationModel` is **opt-in in 40** of the 50 jurisdictions that record it and **opt-out in
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
| `health-records-representative` | 47 | 5 |
| `benefits-payee` | 41 | 5 |
| `tax-representative` | 41 | 5 |
| `veterans-fiduciary` | 34 | 3 |

These are federal-layer roles inherited by every sub-national file in the US, Australia and
Canada. They are national programme mechanics, not a global pattern, and treating them as
one would over-generalise from three countries.

The inverse is `universal-successor-heir`: **16 jurisdictions across 16 countries**, exactly
one per country. It is a clean marker of civil-law universal succession, where the estate
vests in the heirs at death with no grant and no appointment.

West Virginia extends the warning a level further down, below the unit this data can model at all.
Article 44-3A establishes an optional **fiduciary supervisor** system for estate administration, and
§44-3A-1 leaves its adoption to **each county commission**: the commission must hold an advertised
public hearing — which ten percent of the county's voters can compel by petition — weigh five listed
factors including "the relative cost and convenience to the public and to the estates", and then
enter an order adopting or rejecting the article. Where a county has adopted it, the fiduciary
supervisor publishes a monthly notice of estate accounts and runs a sixty-day claims window under
§44-3A-4; where it has not, the article 44-2 route before the county commission applies instead.

So *which office supervises a West Virginia estate, and on what timetable*, is not a question about
West Virginia. The jurisdiction column already over-promises against the country column; here the
jurisdiction is itself the wrong unit, and a file keyed to a state cannot say which of two regimes a
given estate falls under. This reference records the choice and its mechanics rather than pretending
to a single state-wide answer — but it is a reminder that "jurisdiction" is a modelling assumption,
not a fact about the law.

## 8. Supported decision-making is the newest idea and spreads unevenly

`supportedDecisionMakingStatute` is true in 21 of the 31 jurisdictions that record it and false in
10 — the thinnest coverage of any feature here, so read it as two thirds of what has been sourced
rather than a third of the set. Notably the **US model layer is
false while eleven US states are true** — California, **Colorado**, Delaware, Florida, Illinois,
Maryland, New York, Texas, Utah, Virginia and Washington — so the uniform acts have not absorbed it,
but states have.

Colorado's is article 14 part 8 of its probate title, and its legislative declaration is the
clearest statement of the idea's purpose in the data: guardianship “constitutes one of the most
restrictive options available to adults with disabilities” and “should be employed only when
a less restrictive alternative would fail to meet the needs of the adult”, with adults with
disabilities “presumed competent”. The agreement is filed in the same title as the
guardianship it is meant to avert.

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

## 9. Not one mechanism, and a hundredfold spread in the number that triggers it

This section used to open by saying that every US state lets a successor collect a small estate
without a grant, on an affidavit, after a short wait — one uniform mechanism with a wildly
variable threshold. The threshold half is right. The uniform half was never true, and the data
said so before the prose did: `smallEstateWithoutGrant` has been **false for New York** all
along, because SCPA article 13 voluntary administration is filed *with the Surrogate's Court*
and the affiant acts under a court-issued short certificate. Maryland now makes two, and more
plainly: its small estate is an **administration**, in which the register of wills directs the
petitioner to serve as personal representative and issues letters (§§5-602, 5-603). Virginia
then adds a third shape at the other extreme, a tier with **no document at all**. Kentucky goes
furthest of all: no ceiling anywhere in its scheme, and no affidavit either.

So there are at least seven mechanisms wearing one name:

| | What the successor does |
|---|---|
| Most of the US layer | presents a sworn affidavit to whoever holds the asset; no court involved |
| **Virginia** under $35,000 | **nothing** — the holder may simply pay a successor (§64.2-602) |
| **New York**, **Maryland** | files with the court or register and acts under a grant it issues |
| **Idaho**, **Oklahoma** | petitions for a decree or summary administration with no ceiling at all |
| **Kentucky** | asks the court to dispense with administration altogether, on no ceiling at all |
| **Missouri** | swears an affidavit **and posts a bond** approved by the probate division, and pays a fee |
| **Nebraska** | presents an affidavit for personalty, or **records one in the land registry** for realty |

**Kentucky has no monetary threshold at all**, and is the only US jurisdiction here that does not.
It has no small-estate affidavit either. Instead the District Court may dispense with administration
on one of three grounds, each relational or conditional rather than numeric:

- §395.455(1) — where the spousal and children's exemption, alone or together with preferred claims
  paid, **equals or exceeds the distributable assets**. That is a *relative* test, so it scales with
  the estate rather than capping it: the exemption is $30,000 of personal property under
  §391.030(1)(c), but an estate well above $30,000 qualifies when enough of it is owed to preferred
  creditors.
- §395.455(2) — where the court is satisfied that no distributable estate will pass through the
  personal representative's hands, it may order that **no letters of administration issue**.
- §395.470 — administration may be dispensed with **by written agreement, for an estate of any
  size**, if there are no debts, all beneficiaries agree in writing under penalty of perjury, the
  inheritance and estate taxes are provided for, and the beneficiaries have advertised for creditors
  — "posted at the courthouse door for six (6) weeks" and published — before applying.

That third route is the interesting one, because it answers the same question as a dollar threshold
with an entirely different instrument. Every other jurisdiction in this table uses an **amount** as
the proxy for "small enough that the protections of administration are not worth their cost".
Kentucky substitutes **unanimity, publicity and time**: everyone entitled must agree, the creditors
must have had six weeks' notice nailed to the courthouse door, and the court must be satisfied. A
protocol that models the small-estate route as "value below X" cannot express Kentucky at all, which
is the sharpest available argument for the rule this section ends on.

Kentucky therefore has no row in the table below, and `scripts/check-findings.py` expects none: its
`threshold` and `waitingDays` are null because the statutes state no amount and no uniform wait, not
because nobody looked.

Missouri is the opposite kind of outlier, and it shows that the ceiling is not the only thing worth
recording about these routes. Its §473.097 looks ordinary in the table — $40,000, thirty days, an
affidavit — but the affidavit is only the first of four conditions, and the other three run through
the probate division: a **bond** for not less than the value of the personal property, approved by
the judge or clerk and conditioned on paying the decedent's debts and complying with future orders
of the court, unless the court dispenses with it; a **fee** under §483.580; and, where required, the
**publication cost of notice to creditors**. Missouri's second route, refusal of letters under
§473.090, requires a bond too.

So a Missouri successor at $39,000 posts security and pays a filing fee, where a Texas successor at
$74,000 signs a form and hands it to a bank. Two states, nearly the same number, and a completely
different transaction. The number is the part a protocol is most tempted to encode and the least
informative thing in the row.

Nebraska contributes two things the rest of the table does not have, and the second is the more
useful.

It runs **two parallel affidavit routes**. §30-24,125 is the ordinary one — $100,000 of personal
property, thirty days, an affidavit handed to whoever holds the asset. §30-24,129 then does the same
job for **real property**: the successor records an affidavit with the **register of deeds** of the
county where the land lies, signed by all persons claiming as successors, and it stands as "prima
facie evidence of the facts stated". The ceiling is measured on the decedent's interest in all
Nebraska realty, valued from the assessment rolls for the year of death less taxes due. Most of this
table reaches only personalty; Nebraska's realty claim becomes a public record in the land registry
rather than a sheet of paper in a custodian's file.

And **§30-24,125(2) is the only provision in this data that admits the death certificate may not
exist yet.** The affidavit must recite a certified or authenticated copy of the death certificate —
"or, in the event of a delay in the production of a certified death certificate, an **abstract of
death** as defined in section 71-601.01". Every other route here assumes the certificate is
available, and every model of a post-mortem claim tends to assume the same. Nebraska names a
substitute artefact for the window before it issues, which is precisely the window in which a family
contacts a platform. It is a small provision with a large implication: **the event that starts the
authority has to be proved too, and the proof of it has a lag.** §30-24,125(4) is also unusually
specific about the sanction, requiring the affiant to "swear or affirm" and to acknowledge that a
false statement may bring "penalties relating to perjury under section 28-915" — the criminal
section by number, rather than the bare "under penalty of perjury" formula the other states use.

Iowa is the one that legislates the transaction rather than the claim, and it is the most complete
provision of its kind here. §633.356 is an ordinary-looking row — $50,000, forty days, an affidavit
under penalty of perjury — and then does four things nothing else in this table does.

**It prices both sides of the refusal.** §633.356(6)(b): where the holder refuses to pay or transfer
“within a reasonable time”, the successor may compel it and “the court **shall** award attorney fees
to the person bringing the action if the court finds that the holder … acted **unreasonably** in
refusing”. §633.356(7)(b), in the same action: “the court **shall** award attorney fees **to the
holder** if the court finds that the holder acted **reasonably**”. Every other regime in this file
funds the claimant and leaves the custodian to carry its own costs even when it was right to say no.
Iowa funds whichever side was reasonable — which moves the question from *is this affidavit good* to
*was this refusal reasonable*, and those are not the same question.

**It lets the claimant ask.** §633.356(9): on receiving the affidavit and identity proof, “the holder
of the property **shall disclose to the affiant** whether the value of the property held by the holder
is, or has been at any time since the decedent’s death, fifty thousand dollars or less” — and an
affidavit furnished for that purpose need not assert the value at all. The single fact that decides
whether this route is open is held by the custodian, not the family, and everywhere else the claimant
must swear to it blind. Iowa gives them a query against the party they are about to make a claim
against. For a protocol that is the most directly copyable provision in this section: it is a
status endpoint, legislated.

**It prices the residual risk in collateral.** §633.356(4)(b): where evidence of ownership is not
produced, the holder may require “a bond in a reasonable amount **determined by the holder**” to
indemnify it, or an agreement in lieu. §18 argues that Missouri answers the evidence problem with
money; Iowa does the same here, and leaves the amount to the counterparty rather than to a judge.

**And the state is a rival claimant on a clock.** §633.356(2)(c) makes the Iowa Medicaid agency a
statutory “successor” in its own right, and §633.356(8)(b) lets the department claim after **ninety
days** if no family affidavit has arrived — presenting “proof of payment of funeral expenses as
verification of the decedent’s death **instead of** a certified copy of the decedent’s death
certificate”. Nebraska is credited below with being the only provision that admits the death
certificate may not exist yet; Iowa is the second, and it reserves the workaround for the state.

The threshold varies across all of them. Every amount and wait in this table is now checked against
the `smallEstateWithoutGrant` feature data by `scripts/check-findings.py`, which fails if the two
drift apart, if a jurisdiction with a recorded ceiling has no row, or if a row claims a waiting
period the data does not record:

| | Ceiling | Wait | Second ceiling, and when it applies |
|---|---|---|---|
| Florida | $2,000 | — (6 months) | — |
| West Virginia | $5,000 | 120 days | — |
| North Carolina | $20,000 | 30 days | — |
| Massachusetts | $25,000 | 30 days | — |
| Uniform Probate Code §3-1201 (the model) | $25,000 | 30 days | — |
| Ohio | $35,000 | — | $100,000 where the surviving spouse takes the whole estate |
| Maine | $40,000 | 30 days | CPI-indexed |
| Missouri | $40,000 | 30 days | $15,000 where a creditor applies and there is no surviving spouse or unmarried minor child |
| Delaware | $50,000 | 30 days | — |
| Iowa | $50,000 | 40 days | — |
| Maryland | $50,000 | — | $100,000 where the surviving spouse is the sole legatee or heir |
| Michigan | $50,000 | 28 days | — |
| New Jersey | $50,000 | — | $20,000 where there is no spouse, civil union partner or domestic partner |
| New York | $50,000 | none | — |
| Oklahoma | $50,000 | 10 days | — |
| Pennsylvania | $50,000 | — | — |
| Kansas | $75,000 | none | $75,000 again where the district court refuses letters on a bond in not less than the value of the estate (§59-2287) |
| Texas | $75,000 | 30 days | — |
| Virginia | $75,000 | 60 days | $35,000, below which no affidavit is needed at all |
| Idaho | $100,000 | 30 days | no ceiling where a surviving spouse is the sole devisee or heir |
| Nebraska | $100,000 | 30 days | $100,000 again for real property, by affidavit recorded with the register of deeds (§30-24,129) |
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
spans two orders of magnitude — $5,000 in West Virginia against $208,850 in California, a factor
of forty-two, and $2,000 against $208,850 if Florida's sole-name-account route is counted as the
same thing — and two states index the figure to inflation while the rest legislate a flat amount
that silently erodes. Utah shows that the choice is deliberate rather than
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
**Michigan after twenty-eight**, **California, Iowa and Washington after forty**, **Virginia makes the
successors wait sixty** (§64.2-601), **West Virginia a hundred and twenty** (§44-1-28) — and **three
states impose no wait at all**: New York, because voluntary administration has no waiting period,
Illinois, and **Kansas, whose §59-1507b states none**, so the successor may present the affidavit the
day after the death. Virginia then puts a shorter clock inside
the longer one: the licensed funeral service establishment may claim after **thirty** days
(§64.2-604), ahead of the successors it is paid out of. So the first lawful claim on the same estate
can fall anywhere from the day of death to two months after it, and in one state two different
claimants have two different start dates. Of the twenty jurisdictions here that record a wait at
all, only ten set it at thirty days, so **a protocol that assumes a month is wrong in half of them,
in both directions** — and wrong by a factor of a hundred and twenty between the two extremes.

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
answered partly by "who".

Two states now fix the **shape** of the affidavit rather than only its contents, and how they differ
is the more useful half. Virginia's §64.2-601 *requires* the affidavit to be **on a form prepared by
the Office of the Executive Secretary of the Supreme Court of Virginia**, and it names a single
**designated successor** to receive payment who then owes the others a statutory fiduciary duty.
Kansas's §59-1507b instead makes the official form a **safe harbour**: the affidavit "shall be deemed
sufficient if in substantial compliance with the form set forth by the **judicial council**". So
Virginia's custodian can reject anything that is not the form, while Kansas's is told that the form is
enough and left to argue about anything else. One mandates the artefact; the other blesses it.
Everywhere else the affidavit's contents are specified and its shape is not.

Kansas's discharge clause is the strongest in this table, and it is the part a custodian actually
cares about. §59-1507b(b) deems the transfer "to be a transfer to the personal representative of the
decedent" and makes the successor's receipt "a full discharge and release … **to the same extent as
if the transfer had been made to an executor or administrator**". The holder is not merely immunised
for relying on a stranger's affidavit; it is placed in the position it would have occupied had it
dealt with a grant holder. That is §15's safe-harbour component written as a deeming provision rather
than as an immunity, and it is why the ceiling matters less here than the row suggests.

Kansas's second route then parallels Missouri's closely enough to be worth noting between two
neighbouring non-uniform states. §59-2287 lets the district court **refuse letters altogether**:
under (a)(1) where the estate is no greater than the exempt property and the §59-403 spousal and
children's allowance — a relational test like Kentucky's — and under (a)(2) where the estate does not
exceed $75,000 and an interested person petitions **on bond** in not less than the value of the
estate. Missouri's §473.090 is the same device at $15,000, also on bond. Two states that took no
uniform probate code both built a bonded, court-ordered alternative to the affidavit, and both set it
beside a route that needs neither bond nor court.

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

West Virginia adds a variant that is not on the same axis at all: it notarises **the wrong
signature**, or rather a different one. For a financial power of attorney, §39B-1-105 requires the
*principal* to acknowledge before a notary, and makes that a condition of validity — the uniform
§105 asks only for a signature and treats acknowledgement as buying a presumption of genuineness,
which its official comment states outright ("notarization of the principal's signature is not
required to create a valid power of attorney"). For a medical power of attorney two chapters away,
§16-30-4(a) requires two witnesses and then notarises **the witnesses' signatures and attestations**,
not the principal's. One state, two instruments, and the notary is authenticating a different person
in each. A rule of the form "check that the notarial certificate covers the grantor" is correct for
one of these documents and wrong for the other, within one state's code.

Nebraska goes below "nearly formless" to formless. Under §30-604(2)(a) of its 2018 Health Care
Surrogacy Act, "an individual may designate a natural person to act as surrogate for the individual
**by personally informing the primary health care provider**". There is no writing, no witness, no
notary, no form and no record requirement attached to the designation itself — the appointment is
complete on the telling. Idaho's advance care planning document at least needs a signed sheet of
paper; Maryland's oral directive needs a clinician, a witness and an entry in the record. Nebraska's
spoken designation needs a conversation.

It is worth noticing where that sits. The same legislature wrote §30-4020, the most demanding duty to
accept a power of attorney in this file, complete with grounds a bank may not refuse on. Nebraska is
therefore simultaneously the hardest state in which to refuse a written financial authority and the
easiest in which to create a health-care one. **Formality and enforceability are independent axes**,
and a jurisdiction can sit at opposite ends of them at once.

**Iowa inverts the ordering most people would assume, and inverts Missouri’s too.** Its financial
power of attorney *must* be acknowledged before a notary to be valid at all (§633B.105) — Iowa is one
of the two states here, with West Virginia, where the notary is a condition of validity rather than a
route to a presumption. Its health-care power, under §144B.3(1)(b), needs only **two witnesses who
sign in each other’s and the principal’s presence — or** a notary, at the principal’s choice, with
§144B.3(3) adding that at least one witness must not be a relative “within the third degree of
consanguinity”.

So in Iowa the document that refuses life-sustaining treatment is **easier to execute than the one
that moves money**. Missouri is the exact opposite: §404.810 pulls the financial act’s magic words
into the health-care power and makes it the most formal instrument in this file. Two states, the same
two instruments, the formality ranking reversed — so there is no general rule that the graver decision
gets the heavier form, and a profile that infers the strength of an authority from the ceremony around
its creation is reading a local drafting choice.

Missouri holds both poles inside a single instrument, which is sharper than holding them in two.
A Missouri health-care power of attorney is the most formal document in this file: §404.810 pulls in
§404.705, so it must be titled "Durable Power of Attorney", recite one of two capitalised statutory
sentences, and be acknowledged to the standard required for conveying real estate. §404.850(1) then
provides that it "may be revoked at any time and **in any manner by which the patient is able to
communicate** the intent to revoke", effective on communication to the agent or to the attending
physician. The same piece of paper needs a notary and magic words to exist and a murmur to disappear,
and the only trace is §404.850(2)'s duty on the provider to note the revocation in the medical
record. The financial version is the same shape: §404.717(1)(2) lets the principal terminate
**orally**.

Missouri's living will adds a quieter variant of the same point. §459.015(1)(4) requires two
witnesses **only "if not wholly in the declarant's handwriting"** — so a declaration written out
longhand and signed needs no witness at all, while the same words typed need two. Formality attaches
to the medium rather than to the decision, which is the oldest rule in the book about wills turning
up in the newest part of this data.

Kentucky then marks the formless pole for the financial instrument, and it does so by being
*uniform* rather than unusual. §457.050 requires a signature and nothing else; notarisation earns
the presumption and is not a condition of validity. So among four contiguous states — Kentucky,
Virginia, West Virginia, Maryland — the answer to "what makes a power of attorney valid?" runs from a
bare signature to a lawyer in the room, with the uniform act's own text at the permissive end. §15
sets that spread out in full, because it turns out to correlate with how much those states oblige a
third party to accept.

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

Four jurisdictions in this set carry two answers at once, or recently did, at four different
distances — which is what turns this from a curiosity into something a standard has to handle:

| | Replacement regime | Commences |
|---|---|---|
| **Utah** | Uniform Health Care Decisions Act (2025 ch. 439) | 1 January 2026 — already in force |
| **Idaho** | Uniform Guardianship, Conservatorship and Other Protective Arrangements Act (S 1240, 2026 ch. 79) | 1 January 2027 |
| **Oklahoma** | Uniform Health Care Decisions Act of 2026 (enrolled HB 1687) | 1 July 2027 |
| **Kansas** | Uniform Guardianship, Conservatorship and Other Protective Arrangements Act (L. 2025 ch. 40) | 1 January 2026 — already in force, and the old act repealed |

**Kansas and Idaho are the same act on opposite sides of the same transition**, which is the cleanest
illustration in this file of why a date is not optional. Both enacted UGCOPAA. Idaho's commences on
1 January 2027 and its statute book currently prints *both* regimes at once. Kansas's commenced on
**1 January 2026**: §59-30,101 cites §§59-30,101 to 59-30,212 as the Kansas uniform guardianship,
conservatorship and other protective arrangements act, and the revisor's note records that it
"replaces K.S.A. 59-3050 et seq.". So "has this state adopted UGCOPAA?" is true of both, and the
answer to "who may be appointed guardian, on what finding, with what powers" is the new act's in one
and the old act's in the other, for another fifteen months.

Kansas also shows what the *completed* transition looks like from the outside, and it is less helpful
than it sounds. §59-3050 — the citation section of the repealed act, and the number every reference
written before 2026 points at — is still a live page on the revisor's site, still answers normally,
and now contains nothing but its own history: "Repealed, L. 2025, ch. 40, § 167; January 1, 2026."
The old address resolves, returns a document, and the document is a tombstone. A pipeline that checks
whether a cited section still exists would find that it does. **Existence is not currency**, and the
three states above are the reason the data records a commencement date rather than an enactment one.

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

Iowa adds a fourth mode, and it is the only one that runs **backwards**. The 2025 amendments to
§633.356 — which narrowed the small-estate route to estates with **no real property at all**, dropping
the former allowance for realty passing to inheritance-tax-exempt joint tenants — carry this note in
the Code itself: “2025 amendments to section apply **retroactively to January 1, 2025**, to the
estates of decedents dying on or after January 1, 2025” (2025 Acts ch. 148, §54).

Every other case in this section is about a future the reader has to anticipate. Iowa’s is about a
past that changed after the fact. A claim made in good faith in, say, March 2025 under the law as
published then was governed, once the amendment passed, by a rule that had not existed when the claim
was made. **“The law as at the date of death” is not a stable key** even when the date of death is
long past, and a cached answer can be falsified by a later session of the legislature rather than by
anything the reader failed to look up. The statute book is honest about it — the note is printed on
the section — but nothing about the shape of a citation reveals that its answer is provisional.

| | How the switchover is expressed |
|---|---|
| **Utah**, **Kansas** | a date, already passed |
| **Idaho**, **Oklahoma** | a date, in the future |
| **Virginia** | **a condition in an act the Code does not quote** |
| **Iowa** | **a date in the past, applied retroactively** |

Two design points follow, and they are not specific to Idaho:

- **Authority assertions need a time, not just a date of issue.** "X is conservator of Y" is
  evaluated against the law of a jurisdiction *as at* some moment. A standard that records only
  when a credential was issued cannot express which regime it was issued under.
- **A commencement date can point backwards.** Iowa's §633.356 was amended in 2025 with retroactive
  effect to 1 January 2025. A pipeline that resolves “the rule as at date D” by reading the statute
  book as published at D will disagree with the statute book as published later, for the same D.
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

Set against section 13, the set holds eight points on one scale, and the Maryland, Virginia and West
Virginia rows are the ones that break the self-asserted-to-attested line it used to describe:

| | What the claimant produces | Who stands behind it |
|---|---|---|
| French designated person | nothing prescribed | — |
| **Virginia** last-resort surrogate | **nothing** | **a hospital committee, or two independent physicians, who must document the basis** |
| **West Virginia** health-care surrogate | **nothing — and does not volunteer either** | **the attending physician or nurse practitioner, who selects the surrogate in writing** |
| Delaware default surrogate | declaration, no form prescribed | the claimant, under penalty of perjury |
| Utah default surrogate | declaration on a state form | the claimant, under penalty of perjury |
| **Maryland** friend or other relative | **affidavit of specific facts showing regular contact** | **the claimant — and the physician must file it in the medical record** |
| French heir | *acte de notoriété* or *livret de famille* | a notary, or the civil register |
| **Oklahoma, Virginia, Missouri** health-care agent | **nothing — a register is consulted** | **a state department, on its own record (in Missouri, a third party under contract to it)** |
| **Iowa** relative under §144A.7 | **nothing — there is no claim to make** | **the attending physician, who must co-sign the decision itself, before a witness** |

Virginia's row is the odd one because it produces nothing and is *not* the weakest. §54.1-2986's
last class — an adult who has exhibited special care and concern — hands the question to the
institution: a quorum of the facility's patient care consulting committee, or two physicians who are
not treating the patient, not employed by the facility and not in the attending physician's practice,
**shall determine** whether the person qualifies and **shall document the information relied upon**.
Standing is established by somebody else's recorded finding, which is the only instance in this data
of proof by third-party determination rather than by instrument, oath or register.

**Iowa goes further than either, by removing the claimant from the question.** Everywhere else in
this table somebody comes forward and the law asks how they prove they qualify. Under §144A.7(1) an
Iowa relative never holds the authority at all: life-sustaining procedures may be withheld or
withdrawn from a patient who left no declaration only where there is “consultation and **written
agreement** for the withholding or the withdrawal … **between the attending physician and**” one of a
ranked list — the §144B agent, the guardian with court approval, the spouse, an adult child or “a
majority of the adult children who are reasonably available”, a parent, an adult sibling — and
§144A.7(2) requires **a witness present at the consultation**.

So the artefact is the agreement, and the relative is a co-signatory to it rather than a decision
maker whose standing has to be established. There is nothing for them to prove because there is no
moment at which they decide alone. That is a fourth shape for this table, after self-asserted
declaration, third-party determination and clinician selection: **joint decision**, where the
relying party is also the co-author of the authority.

It has a cost, and it is worth stating plainly. Because §144A.7 reaches only the withholding or
withdrawal of life-sustaining procedures from a patient in a terminal condition who is comatose or
incapable of communication, an Iowa patient who executed no instrument has **nobody who can consent
to ordinary treatment** by operation of law. Iowa therefore sits oddly between the two groups this
section describes: it is not Missouri or Kansas, which have no surrogate at all, and it is not the
states with a general ranked list — it has a list that works for exactly one decision.

West Virginia goes a step past Virginia's committee and inverts the whole frame. In every other row
of that table somebody comes forward and the question is how they prove they qualify. Under
§16-30-8(a), when a person becomes incapacitated "the attending physician or the advanced nurse
practitioner … **shall select, in writing, a surrogate**" — after a reasonable inquiry for a medical
power of attorney representative or guardian, then down a list of seven classes ending in "close
friends" and then entities the Department of Health designates by rule. Within a class the clinician
picks whoever "reasonably appears to be best qualified" against five listed criteria, and may prefer
someone *lower* in the order on those criteria. So the West Virginia surrogate does not establish
their standing at all: a clinician confers it, and the artefact is that clinician's written
selection. For a relying party outside the health system — a bank, a custodian, a platform — this is
the hardest row in the table to verify, because the document that creates the authority is a note in
someone else's file.

Missouri and Kansas are the limiting case of this whole table, because they are the two
jurisdictions where the claimant in several of these rows **does not exist**. Neither has a default
health-care surrogate. Taking Missouri first: no
statutory list of relatives, no last-resort class, nothing. The catchlines of chapters 404, 459, 475,
191 and 194 contain no "surrogate"; the revisor's full-text search, checked against a positive
control, finds the word only in chapter 162, where it means a surrogate *parent* in special
education. §191.240 mentions "a person authorized to make health care decisions for the patient" in
passing without creating one. What Missouri offers instead is three routes that all require an
instrument or a judge — a durable power of attorney for health care under §§404.800 to 404.872, a
declaration under §§459.010 to 459.055, or a guardianship, after which §475.120(3) gives the guardian
the ward's "health" and the duty to "provide required consents". Every other US jurisdiction here
lets a spouse or an adult child decide by operation of law; Missouri sends the same decision to the
probate division. The role is dropped from its row rather than recorded as empty, which is why
`default-surrogate` does not move when Missouri is added.

**Kansas is the second, and it was established the same way with a weaker instrument.** The
catchlines of chapters 58, 58a, 59, 65 and 39 — 5,117 sections, covering the power of attorney act,
the trust code, the probate code and guardianship, the public health code and social welfare —
contain no surrogate, no next of kin and no nearest relative provision conferring health-care
authority. Kansas's routes all need an instrument or a judge too: a durable power of attorney for
health care decisions under §§58-625 to 58-632, a declaration under §65-28,103, a guardian whose
duties §59-30,153 sets, or — new in the 2025 act — a **protective arrangement instead of
guardianship** under §59-30,197, which lets a court make a single targeted order without appointing
anyone at all.

The method matters as much as the answer. Missouri's negative rests on a full-text search run
against a positive control; Kansas's rests on reading catchlines, because the revisor's site has no
search at all. So the Kansas claim is scoped to those five chapters and stated as such in the data,
and the West Virginia lesson applies — a search that cannot be trusted and a true absence look
identical, and only one of them can be reported as a finding. **Two of twenty-five US jurisdictions
here have nobody who can decide for an incapacitated adult by operation of law**, which is a large
enough exception to the "a spouse can always decide" assumption that a protocol should not hold it.

Nebraska shows that the artefact can simply be missing, and that a legislature can remove it without
removing the rule it supports. Its trust-code catchlines print the uniform section number in
parentheses, so the mapping is checkable line by line — and article 10 runs from §30-3890 (UTC 1001)
to §30-38,101 (UTC 1012) and **stops**. There is no UTC 1013, and so **no certification of trust**:
the one standardised, statute-defined document a trustee can hand a bank instead of the trust
instrument itself. Every other Uniform Trust Code state read here has one — West Virginia
§44D-10-1013, Kentucky §386B.10-120, Missouri §456.10-1013, the last of which is strict enough to
require every trustee's signature.

What Nebraska keeps is the protection without the paper: §30-38,101 shields a person who deals with a
trustee in good faith and for value without knowledge of a breach, and §30-3895 protects a trustee
acting in reasonable reliance on the trust instrument. Both allocate liability; neither tells the
relying party what to ask for. So a Nebraska successor trustee is in the position this whole section
describes — entitled to act, protected if the counterparty accepts, and holding nothing designed to
be shown. (Checked across all 1,187 catchlines of chapter 30; the Nebraska site has no full-text
search, so that is scoped to the trust code and that chapter rather than to the entire statute book.)

Missouri also supplies the two ends of a smaller question this table raises but does not ask: **who
is expected to help the claimant produce the artefact?** Maryland requires a **supervising attorney**
to be present, physically or electronically, before a remotely witnessed power of attorney is valid —
the only place in this data where a lawyer's participation is a condition of a valid instrument.
Missouri's §473.091 goes the other way and says so expressly: the clerks of the probate division
"may … assist in filling out all forms necessary" for an order refusing letters, and doing so "shall
not constitute the practice of law". One state makes a professional a precondition; the other
deputises a counter clerk and immunises them for it.

One artefact in Missouri comes from outside the state's law altogether. §194.119, which ranks the
holders of the right of sepulcher, puts an attorney in fact specifically granted that right first and
then, for a decedent on active military duty, **the person named on United States Department of
Defense Form 93** — ahead of the surviving spouse. A federal personnel record decides a state-law
priority, which is the only instance here of a document issued by another sovereign controlling who
holds one of these roles.

Kansas adds a point to the left-hand column that no other row has, and it is about the *appointed*
roles rather than the self-asserting ones. Under §59-30,108 a Kansas guardian's **letters of office**
do not issue until the appointee files an acceptance, an oath, a personal information sheet that
"shall not be disclosed to the public" — and "**evidence of completion of a basic instructional
program concerning the duties and responsibilities of a guardian**". A conservator files the same
plus any bond. Nowhere else in this data does the artefact that evidences an authority wait on the
holder having been *taught the job*, which is a competence condition rather than an eligibility one.

And §59-30,108(c) puts the scope on the artefact itself: "Limitations on the powers of a guardian or
conservator or on the property subject to conservatorship **must be stated on the letters of
office**", and where co-guardians are appointed the letters must say whether they may act
independently, must act jointly, or on what terms. Every other appointed role in this reference asks
a relying party to take the artefact as proof of the role and then go and read the order behind it to
learn the limits. Kansas puts the limits on the face of the thing being presented.

And the act closes that loop, which is what makes it more than a drafting preference. §59-30,185
protects a person who "assists or deals with a conservator in good faith and for value" as though the
conservator "properly exercised any power in question", and says that knowing one is dealing with a
conservator "does not require the person to inquire into the existence of authority … or the
propriety of the conservator's exercise of authority" — and then: "**but restrictions on authority
stated in letters of office, or otherwise provided by law, are effective as to the person**". The
protection extends even to "a procedural irregularity or jurisdictional defect in the proceeding
leading to the issuance of letters of office".

Read the two sections together and Kansas has legislated, for paper in 2025, the thing a scoped
credential is for: **the artefact must state its own limits, the relying party need not look behind
it, and reliance is protected inside those limits and not outside them.** The defect that would
normally destroy the authority — a flaw in the appointment itself — is absorbed, while the one thing
printed on the document is binding. That is a cleaner statement of the trust model than anything else
in this file, and it is the opposite of how the power-of-attorney regimes in §15 work, where the
relying party is protected against everything short of actual knowledge and the instrument's scope is
whatever the drafter wrote in prose.

Read the right-hand column on its own and it turns into a second scale, about **who the law trusts to
decide that an adult has lost capacity**. Its two ends are both in states added here. West Virginia
§16-30-7 asks for one clinician — the attending physician, another physician, a qualified
psychologist, a physician's assistant or an advanced practice registered nurse — who has personally
examined the person and records the basis contemporaneously in the medical record. Kentucky, for a
guardianship, asks for a **jury**: §387.570(7) makes the hearing a jury trial unless the respondent,
their counsel and the attorney for the Commonwealth all agree to a bench trial, no interested person
objects, and the evaluation report is unanimous; §387.570(5) puts the burden "on the Commonwealth to
prove the disability … by clear and convincing evidence", whoever brought the petition; and
§387.580(1) gives the capacity findings themselves to "the court, or the jury if one is impaneled".
The same underlying question — can this adult manage their affairs — is answered in one state by a
single clinician's chart note and in another by twelve jurors holding the state to a heightened
standard of proof. Any model that carries "determined to lack capacity" as a boolean is flattening a
range that runs from a nurse practitioner's examination to a verdict.

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

Iowa closes a loop that every other springing-power regime leaves open, and it belongs here because
it is about proving the **event** rather than the person. §633B.109(2) lets the principal name
“one or more persons to determine **in a writing or other record** that the event or contingency has
occurred”. If nobody was named, or the named person will not act, a power springing on incapacity
takes effect on a written determination by “a licensed physician or licensed psychologist” or by “a
judge, or an appropriate governmental official” (§633B.109(3)).

Then §633B.109(4): that person “may act as the principal’s **personal representative** pursuant to
the federal Health Insurance Portability and Accountability Act of 1996 … to obtain access to the
principal’s health care information and to communicate with the principal’s health care provider”.

That is the bootstrapping problem solved in one sentence. Determining incapacity needs medical
information; getting medical information needs authority; and the authority is the thing the
determination is supposed to switch on. Nebraska gets as far as making the absence of evidence of
the contingency a lawful ground to refuse (§30-4020(2)(h)); Iowa names who may certify the event
**and** grants them federal health-records standing for the sole purpose of certifying it. Any
design that gates an authority on a condition precedent needs an answer to this, and Iowa is the
only jurisdiction here that has written one down.

Iowa also screens where Kansas trains. §633.564 requires the court to request criminal-record checks
and checks of “the child abuse, dependent adult abuse, and sexual offender registries” for **every**
proposed guardian and conservator bar a financial institution with Iowa trust powers, with the
petitioner paying the fee; Kansas withholds letters until the appointee files evidence of completing
an instructional programme. Both are fitness gates that run before the artefact exists and leave no
trace on it, and they test opposite things — competence in one state, record in the other. A relying
party holding either state’s letters cannot tell which, if any, was done.

One further Utah detail cuts against how credentials are usually built. Under §75A-9-117 the power
of an agent or surrogate **commences** when the individual is found to lack capacity, **ceases** if
capacity is later found or the individual objects to the finding, and **resumes** if the finding is
confirmed. Authority here is not a window with a start and an end; it oscillates with a clinical
determination that can be revisited. A credential carrying a validity period cannot express that,
and one asserting "holder is the surrogate" is making a claim that may be false by the afternoon.
Whatever a standard does about health care has to treat the authority as a question to be asked at
the moment of use, not a fact to be cached.

## 15. Acceptance is already solved in statute, eight times over, and four states go further

The question an evidence layer exists to answer is not "who may act" — §1 says that is settled
nearly everywhere — but "why would the party holding the asset say yes?" Eight regimes in this data
answer it, and they are built from the same three components: a **duty** to accept, a **remedy** if
the holder refuses, and a **safe harbour** for the holder that accepts. No two of them carry the
same subset, and four of them add a component the others do not have at all — Missouri a right to
demand security, Nebraska and Iowa grounds a refusal may *not* rest on, Kansas an obligation on
the refuser to **report the refusal to the authority that issued the appointment**, and Iowa a
**limitation period** on the remedy and a fee shift that can run **against** the person who was
refused.

| | Duty to accept | Remedy for refusal | Safe harbour for accepting |
|---|---|---|---|
| **Idaho**, URSDDA §§15-15-105 to 107 | any person, any substitute decision-making document | court order **plus** reasonable attorney's fees and costs | assume validity without inquiry absent actual knowledge; rely on asserted facts, a translation, counsel's opinion |
| **UPOAA §§119–120** (the model; **Virginia** and **Kentucky** took Alternative A, **Maryland** and **West Virginia** Alternative B) | any person, within **seven business days** of presentation — of *any* acknowledged power of attorney under A, only of the **statutory form** under B | court order **plus** reasonable attorney's fees and costs — except in **West Virginia**, where the court "may at its discretion award" them | rely on the power as genuine absent actual knowledge; rely without investigation on the agent's certification, a translation, counsel's opinion |
| **RUFADAA §16** (the model and the 15 RUFADAA states here) | a custodian, within 60 days of a complying request | court order directing compliance | immune for an act or omission in good faith in compliance |
| **Delaware**, 12 Del. C. §§2306–2307 | — | recovery or compulsion in the Court of Chancery | released as if paid to the personal representative; no duty to inquire into the truth of the affidavit |
| **Supported decision-making** (Del. §9408A, Utah §75-5-709) | — | — | immunity, and in Utah presumptions that the signatures and the authority are genuine |
| **Missouri**, §§404.719, 456.10-1013 | — | — | eleven items a good-faith third person need not inquire into, absent actual knowledge — **plus a right to demand security**: indemnity against forgery by bond, or a certification of trust acknowledged or guaranteed |
| **Nebraska**, §§30-4019–4020 | any person, within **seven business days** of presentation, of *any* acknowledged power of attorney — **plus grounds it may not refuse on** | court order, fees, **and liability as if it had refused the principal in person** | the uniform reliance protections of §30-4019 |
| **Iowa**, §§633B.119–120, 633A.4604, 633.356 | any person, within **seven business days**, of *any* acknowledged power of attorney — **plus a ground it may not refuse on**; and, uniquely, a duty in the **trust** and **small-estate** lanes too | court order and fees, but **only if sued within one year**; in the trust lane, damages and fees for demanding the instrument; in the small-estate lane, **fees to whichever side was reasonable** | the uniform reliance protections — **and a good-faith belief of invalidity that no evidence can cure** |
| **Kansas**, §§59-30,123, 59-30,185 | any person, of a **guardian's or conservator's letters of office** — the only duty here owed on a *court appointment* rather than on an instrument the principal signed | a petition to **compel** acceptance, **and a report back to the appointing court within 10 days** of any refusal, handled as a grievance under §59-30,127 | good faith and for value, protected "as though the conservator properly exercised any power in question", no duty to inquire — **but restrictions stated in the letters of office bind the relying party** |

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

Adding Kentucky and West Virginia makes that a natural experiment rather than an anecdote, because
the four states are **mutual neighbours** and they split evenly:

| | §105 execution | §120 alternative | Remedy for refusal |
|---|---|---|---|
| **Kentucky** §§457.050, 457.200 | signature; notary buys a presumption | **A** — any acknowledged power | automatic liability for fees |
| **Virginia** §§64.2-1603, 64.2-1618 | signature; notary buys a presumption | **A** — any acknowledged power | automatic liability for fees |
| **Maryland** §§17-110, 17-104 | notary **and two witnesses**; a supervising attorney to witness remotely | **B** — statutory form only | automatic liability for fees |
| **West Virginia** §§39B-1-105, 39B-1-120 | notary **required for validity** | **B** — statutory form only | court **may** award fees, at its discretion |

Two things fall out of that table. First, the two states that demand **more** at execution are the
two that owe **less** at acceptance: Maryland and West Virginia make the instrument harder to create
and then confine the duty to accept to one official form, while Kentucky and Virginia let a bare
signed power exist and owe a duty on any of them. That looked like a pattern across four mutual
neighbours, and it is the opposite of what a drafter might expect, since a more formal instrument is
the easier one for a stranger to rely on.

**Iowa is the counterexample, and it settles the question.** §633B.105 makes acknowledgment before a
notary a condition of **validity** — the West Virginia position, stricter than Maryland's in the
sense that an un-notarised Iowa power is not a power at all — and §633B.120 then owes the duty on
*any* acknowledged power, which is Alternative A, the Kentucky and Virginia position. Iowa demands
the **most** at execution and owes the **broadest** duty at acceptance. So the pattern was a
coincidence of four adjacent legislatures, not a design logic, and **the formality of an instrument
predicts nothing about who must honour it.** For anyone building a profile that is the useful
negative result: these are two independent axes, and both have to be carried in the data.

Second, **West Virginia varied something the ULC did not offer as a choice.** The alternatives
differ only in scope; the remedy is identical in both, and in the model and in the three other
states a refusing party "is subject to" a court order *and* liability for fees. West Virginia
rewrote that into a court which "may at its discretion award" them. So the fee shift — the only
provision in this data that puts a price on an unjustified refusal — survives as an entitlement in
three of these four states and as a judicial discretion in the fourth. For a relying party deciding
whether refusing is cheap, that is the whole question, and it is invisible from the fact of
enactment.

That is a sharper version of §4's point. **"Has this jurisdiction adopted §120?" has no useful
answer**, because all four states did and they owe different duties on different instruments with
different consequences; and Idaho widened the instrument class a third time without changing the
remedy at all. Three points on one axis — the statutory
form, any acknowledged power of attorney, any substitute decision-making document — from one piece
of drafting.

**Nebraska takes the uniform regime and adds two components nothing else here has**, which is worth
setting out because it is the closest any legislature in this data comes to designing the thing a
profile would need.

It starts from Alternative A — the duty runs to any acknowledged power of attorney, on the uniform
seven-business-day clock with five further days once a requested certification arrives. Then:

- **Prohibited grounds.** §30-4020(3) lists reasons a person *may not* refuse on: a refusal resting
  **exclusively** on the date the power was executed, or **exclusively** on insisting that a
  different form be used. Most regimes here enumerate the lawful refusals and leave the rest
  to argument; Nebraska also enumerates two unlawful ones. For a standard this is the more useful
  half, because "your document is too old" and "use our form instead" are exactly the answers a
  custodian gives a valid credential. **Iowa makes it two states, and files it differently:**
  §633B.120(1)(c) puts the prohibition inside the duty itself — “A person shall **not require an
  additional or different form of power of attorney** for authority granted in the power of attorney
  presented” — so in Iowa demanding the bank's own form is a breach of the duty rather than a ground
  that failed to make the list.
- **Liability measured against the principal.** §30-4020(4)(b)(i) makes the refuser liable to the
  principal and the principal's heirs, assigns and personal representative "in the same manner as the
  person would be liable had the person refused to accept the authority of **the principal to act on
  the principal's own behalf**". The agent is not owed a special, lesser duty; refusing the agent is
  refusing the principal, with whatever that would have cost.

Nebraska also adds two lawful refusals the uniform act lacks, and both are about evidence rather than
suspicion: a pending judicial proceeding construing the power or reviewing the agent's conduct
(§30-4020(2)(g)), and — the one that matters for springing powers — a power effective on a
contingency where "neither a certification nor evidence of the occurrence of the event or contingency
is presented" (§30-4020(2)(h)). That is a statutory evidence requirement attached to a condition
precedent, and the only one in this file.

**Kansas does the one thing nothing else in this file does: it makes the refusal travel.** Its 2025
act obliges a person to "recognize the authority of a guardian or conservator to act on behalf of an
individual subject to guardianship or conservatorship" unless one of three things is true — actual
knowledge or reasonable belief that the letters are invalid or that the fiduciary is exceeding or
improperly exercising the court's grant; actual knowledge that the individual is being abused,
neglected, exploited or abandoned **by that guardian or conservator**; or that the person has made,
or knows someone has made, an abuse report under §39-1402 or §39-1431. Then §59-30,123(b):

> A person that refuses to accept the authority of a guardian or conservator **must, within 10 days
> of the refusal, report the refusal and the reason for refusal to the court**. Upon receiving the
> report, the clerk of the district court shall forward the report to the presiding judge who shall
> consider whether further action is appropriate.

A refusal is "treated in the same manner as a grievance under K.S.A. 59-30,127", so the court that
granted the authority can act on it without anyone petitioning.

Kansas is the only row in that table carrying all three components **and** a fourth, and the fourth
is not a fee shift: §59-30,123 puts no price on refusing at all. What it imposes instead is *work*,
due whether or not anybody complains. Everywhere else the consequence of an unjustified refusal is a
liability contingent on someone going to court; in Kansas the refuser must write to the court
itself, within ten days, saying what it did and why.

Three further things follow, and the third is the one for a standard.

First, **this is the only acceptance duty in the data that runs on a court appointment rather than on
a document the principal signed.** Every other row above is about an instrument someone executed — a
power of attorney, a supported decision-making agreement, a small-estate affidavit, a certification
of trust, a digital-asset request. Kansas owes the duty on **letters of office**, the artefact
§59-30,108 requires to carry its own limitations on its face. So the two halves fit: a relying party
is told what the authority is by the document, and told it must honour it by §59-30,123.

Second, **its lawful refusals are about evidence of wrongdoing rather than evidence of authority.**

Idaho's §15-15-106(2) already includes a refusal grounded in a report to adult protective services;
Kansas makes that one of only three grounds, and the other two are invalid letters and knowledge of
abuse by the fiduciary. There is no "we would like a different form" and no "the document is too
old" — the answers Nebraska had to prohibit expressly, Kansas never admitted.

Third, and this is the finding: **every other statute in this section leaves the channel blank in one
direction, and Kansas is the only one that writes into the other.** The gap this section ends on is
that a safe harbour runs until the relying party has *actual knowledge*, and nothing tells it
anything — information has nowhere to flow *to* the custodian. Missouri's three registers are places
to put a revocation so that it could flow that way. Kansas legislates the **return path**: when a
custodian says no, the court that issued the authority finds out, with reasons, on a ten-day clock,
and can act on its own motion. That is a refusal-reporting endpoint, and it is the component a
protocol designer would otherwise have to invent — §15's own closing point is that "refusal is a
legitimate outcome with reasons attached", and Kansas is the one jurisdiction that requires the
reasons to be *sent somewhere*. It is also the only provision here that makes refusing a credential
cost the refuser *work* rather than money: the fee shift elsewhere is a liability contingent on
litigation, while the report is due whether or not anyone complains.

What it is not is a notification to the guardian, or a register anyone can query, or a duty to
consult anything. The flow is one-way and the court is the only recipient. But it is the first
instance in this file of a legislature treating a refusal as an **event worth routing** rather than
as a private decision by the party holding the asset.

**Iowa is the only jurisdiction here that extends the duty beyond powers of attorney by its own
drafting**, and the trust lane is where it matters most. §633A.4604(6): “A person making a demand for
the trust instrument in addition to a certification of trust or excerpts shall be **liable for
damages, including attorney fees**, incurred as a result of the refusal to accept the certification
of trust.”

Set that against §14's Nebraska row. Every Uniform Trust Code state in this file offers the
certification as an *option* the trustee may use and a *safe harbour* for whoever accepts it; none
obliges anyone to take it, so a counterparty that insists on the whole instrument is merely being
awkward. Iowa is the one place where it is paying damages. §633A.4604(5) adds the clock — “the period
of time to verify the identity of the trustee shall not exceed **ten business days**” — which is the
trust-lane counterpart of the seven business days the uniform power-of-attorney act gives, and which
no other trust code here has. So the one artefact in this data that was designed to be handed to a
bank finally has a duty and a deadline attached, in exactly one state.

Two Iowa provisions cut the other way, and they are the more instructive half.

**§633B.120(2)(e) makes the evidence irrelevant.** A person need not accept an acknowledged power
where it “in good faith believes that the power of attorney is not valid or that the agent does not
have the authority to perform the act requested, or that the power of attorney does not comply with
federal or state law or regulations, **whether or not** a certification, a translation, or an opinion
of counsel … has been requested or provided”. The uniform act's lawful refusals are specific facts —
actual knowledge of termination, a pending abuse report, inconsistency with federal law. Iowa adds a
general one and then expressly severs it from the evidence: the certification the act invites the
custodian to demand **cannot cure the doubt it was demanded to resolve**. For a credential this is
the sharpest warning in the section. Better evidence is not the mechanism by which a relying party
is obliged to say yes; the obligation is, and Iowa shows a legislature can grant the obligation and
withdraw it in consecutive subsections.

**§633B.120(3)(b) puts the remedy on a clock.** The fee shift applies “provided that any such action
must be brought **within one year** of the initial request for acceptance of the power of attorney” —
the only limitation period on an acceptance remedy in this file. The price of an unjustified refusal
is not just discretionary in one state (West Virginia) and automatic in the rest; in Iowa it also
expires, and it expires from the date of the *request*, not from the date the principal discovers
the harm.

Read down the last column rather than the first. The duty is the component a standards body cannot
supply, and where it exists it is usually narrow; the safe harbour is in **all eight**, and it is the component that
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

**Missouri is the one jurisdiction here that writes anything into that blank**, and it does so three
times, which is worth more attention than its size suggests. §404.717(1)(3) lets a written notice of
modification or termination of a power of attorney be **filed for record with the recorder of deeds**
in the principal's county — a public register of revocations, searchable by anyone, for an instrument
that needs no registration to be valid in the first place. §404.850(2) obliges the attending
physician or provider, on learning of a health-care revocation, to put it in the medical record.
And §459.250 has the Department of Health and Senior Services contract a third party to run an
online **Advance Health Care Directives Registry** which stores directives *and their revocations*,
with "any licensed health care provider or licensed attorney" as an intake point.

None of the three is a notification: nobody has to tell a particular custodian anything, and
§404.719(1)(9) still relieves the third person of any duty to find out. They are **places where the
revocation can be put**, which is the half of the problem a standard could actually build on — a
status endpoint is useless without a duty to consult it, and a duty to consult is unenforceable
without somewhere to look. Missouri has built the second half and left the first, which is the
mirror image of Idaho, where §15-15-105's duty to accept runs against no register at all.

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

## 17. The same event ends the authority in one state, preserves it in another, and in Kentucky does both at once

Every other section here asks what starts an authority. This one asks what ends it, and it is the
clearest case in the data of a termination rule that cannot be read off the instrument, the role, or
even the chapter the role lives in.

Uniform Power of Attorney Act §108(b) deals with what happens when a court later appoints a
conservator over the same property the agent is managing. It does two things: it makes the agent
"accountable to the fiduciary as well as to the principal", and then it offers, **in brackets**, a
sentence settling the agency's fate — "The power of attorney is not terminated and the agent's
authority continues unless limited, suspended, or terminated by the court." The brackets matter.
The official comment records that even this much was a change of direction: §108(b) "is a departure
from the Uniform Durable Power of Attorney Act which gave a court-appointed fiduciary the same power
to revoke or amend a power of attorney as the principal would have if not incapacitated".

Three neighbouring states enacted that section and answered the bracketed question three different
ways, two of them by writing its inverse. Missouri, which took no uniform power-of-attorney act at
all, supplies a fourth answer that is neither; Nebraska, which took the act whole, supplies a fifth
by keeping the rule the act was written to abolish; Kansas arrives at Nebraska's rule without ever
having enacted the act at all — and Iowa, which did enact it, gives a sixth answer that is none of
the above. Colorado is the one state here that adds no new answer: it took the bracketed sentence as
written, which puts it with Virginia and makes the point that where the uniform text is adopted
verbatim it does produce agreement.

| | Where the rule lives | What a court appointment does to the agency |
|---|---|---|
| **Virginia** | §64.2-1606(B), the §108 slot | **nothing** — "not terminated and the agent's authority continues unless limited, suspended, or terminated by the court" |
| **Colorado** | §15-14-708(2), the §108 slot | **nothing** — the identical bracketed sentence, with the agent "accountable to the fiduciary as well as to the principal" |
| **West Virginia** | §39B-1-108(b), the §108 slot | **ends it** — "unless otherwise ordered by the court making the appointment, the power of attorney and the agent's authority thereunder terminates upon the appointment" |
| **Kentucky** | §457.100(1)(c), the **termination** section | **ends it** — the power terminates on the appointment "unless the court specifically provides that the power of attorney shall remain in effect" |
| **Missouri** | §404.731(3), in the jurisdiction section | **neither** — "the court **may specify in an order** the powers, duties and responsibilities" of the legal representative and the attorney in fact "and the manner in which they shall **coordinate** the exercise of their respective powers" |
| **Nebraska** | §30-4008(2), the §108 slot | **hands the decision to the conservator** — the fiduciary "shall have the same power to revoke or amend the power of attorney that the principal would have had if he or she were not disabled or incapacitated" |
| **Kansas** | §58-656(c), in its own act's duties section | **hands the decision to the conservator** — the fiduciary "has the same power to revoke or amend the durable power of attorney that the principal would have had" |
| **Iowa** | §633B.108(2), the §108 slot | **suspends it, and reinstates it** — the power "is suspended unless the power of attorney provides otherwise or unless the court … decides the power of attorney should continue", and "shall be **reinstated** upon termination of the conservatorship as a result of the principal regaining capacity" |

West Virginia and Kentucky reach the identical rule and file it in different places, and that is not
a filing curiosity. A reader asking "when does a West Virginia power of attorney end?" goes to
§39B-1-110, the section called *Termination of power of attorney or agent's authority*, and finds the
uniform six triggers — death, incapacity if not durable, revocation, its own terms, purpose
accomplished, agent gone. The appointment of a conservator is not among them. It is a seventh
trigger, sitting two sections earlier under a heading about nominating a guardian. Kentucky, having
made the same choice, put it in the termination list where someone would look. The rule is equally
findable in one state and effectively hidden in the other.

Nebraska is the sharpest case, because the uniform act's own comment describes its rule as the
discarded one. Recall what §108(b) says in the bracket: the power of attorney is *not* terminated and
the agent's authority continues unless the court intervenes. The comment explains why that sentence
is there — "Section 108(b) is a **departure from the Uniform Durable Power of Attorney Act** which
gave a court-appointed fiduciary the same power to revoke or amend a power of attorney as the
principal would have if not incapacitated."

§30-4008(2) is that abolished rule, verbatim in substance: the Nebraska conservator "shall have the
same power to revoke or amend the power of attorney that the principal would have had if he or she
were not disabled or incapacitated". Nebraska enacted the 2006 act in 2012, mapped every section to
the uniform numbering, and restored the 1979 position in the one place the drafters had changed it.

That produces the widest outcome in the table, because it is not a rule about the agency at all — it
is a **transfer of the principal's own revocation power to a stranger the court appoints**. In
Virginia and Colorado the agent continues; in West Virginia and Kentucky the agency ends by
operation of law; in Missouri a judge allocates. In Nebraska and Kansas the conservator simply
decides, and may do so without any further court involvement. In Iowa the power goes dormant and
revives. **Eight jurisdictions, one uniform section, five distinct rules**, and the only thing they
agree on is that something happens.

For anyone modelling this, the lesson is narrower than "jurisdictions differ". **The event is the
same and observable — a court appoints a fiduciary — but what it does to an existing authority is
not derivable from the event.** A system told only "a conservator was appointed for this principal"
cannot compute whether the agent still holds anything, and in Nebraska cannot even know whether the
answer is settled yet, because it now depends on a private decision by the conservator that no court
records.

Missouri declines the binary. Under §404.731(3) the probate division, having appointed a guardian or
conservator for a principal who holds a durable power of attorney, may after notice and hearing
specify by order what each of the two office-holders may do **and how they are to coordinate**. The
agency neither lapses nor continues of its own force; a judge divides the work. §404.727(5) is the
menu that order is drawn from, and it is wider than any other court's powers here: direct the agent
to act or to refrain, modify the authority, **suspend** a power that is not durable, terminate a
durable one, remove the agent, or **confirm** the authority of an agent or successor.

**Iowa's answer is the one a protocol cannot express at all.** The other five all resolve to a
state: the agency is alive, dead, or subject to someone else's say-so. Iowa makes it **dormant** —
§633B.108(2) suspends the power on the appointment of a conservator and then reinstates it “upon
termination of the conservatorship as a result of the principal regaining capacity”.

Three things follow. The instrument is **never invalid**, so there is nothing wrong with the paper at
any point and no version of it that a custodian could be shown to learn the difference. Nothing is
issued, endorsed or filed at either boundary: the suspension happens because a court appointed
somebody in a different proceeding, and the reinstatement happens because that proceeding ended for
one particular reason among several — capacity regained, not death, not resignation, not a successor
conservator. And the condition is **continuous rather than instantaneous**: a relying party that
checked last week learned the state last week.

§14 records Utah's §75A-9-117, under which a health-care authority commences on a finding of
incapacity, ceases if capacity returns, and resumes if the finding is confirmed — authority that
oscillates with a clinical determination. Iowa is that same shape in the **financial** lane, which is
where the custodians are. Put the two together and the point generalises: **an authority is not
always a span with a start and an end.** Some are intermittent, and the gaps are invisible from the
document. A credential with a validity period cannot say "valid, but asleep", and one that is
re-checked at the moment of use needs something to check against that no jurisdiction here provides.

That last item is worth isolating. Everywhere else in this data a relying party's problem is that
nobody will tell it whether an authority is still good. Missouri lets an interested person ask a
court to say so, on the record, in advance — a judicial confirmation of an agent's standing. It is
the nearest thing in the set to an authority that can be *queried* rather than merely presented.

Then Kentucky does something neither of the others does: it answers the question **differently for
the person than for the property**.

- Over property, §457.100(1)(c) ends the agency when the court appoints a conservator or guardian of
  the estate.
- Over the person, §311.6231 does the opposite, and emphatically: where a court appoints "a fiduciary
  charged with the care and protection of the grantor's person" after an advance directive was made,
  "the fiduciary shall be bound by the terms of the grantor's advance directive", and if the
  directive designated a surrogate, "the surrogate may continue to act".

One event — a court appointing a fiduciary — and the person the principal chose keeps deciding about
their body and loses the ability to decide about their money. Whatever one thinks of that as policy,
it is a single jurisdiction holding two opposite rules about the same trigger, distinguished only by
the lane. Nothing in the role name, the instrument, or the fact of a court order tells you which
applies.

Virginia supplies a second warning from the other direction, about vocabulary rather than placement.
§64.2-1602 keys durability to the principal's "incapacity", and §64.2-1600 defines that term.
§64.2-1608(A)(2), amended by 2022 cc. 397 and 654, instead terminates a non-durable power when the
principal "becomes a **vulnerable adult**" — a phrase that appears nowhere in §64.2-1600, which is
the chapter's only definitions section. The section that creates the default and the section that
executes it no longer use the same word, and only one of the two words is defined where a reader of
the chapter would find it. Virginia also added two termination triggers the uniform act
does not have: a widened set of family-law filings, and §64.2-1608(B)(4), under which the agent's
authority ends when the agent "is convicted of financial exploitation of the principal under
§18.2-178.2" — authority extinguished by a criminal judgment in another title entirely.

**Iowa goes one step beyond Virginia, and the step is off the public record.** §633B.110(2) ends an
agent's authority not only where the agent "is convicted of dependent adult abuse for having abused
the principal" — the Virginia shape — but also, at paragraph (e), where the agent "is **named as
having abused the principal in a founded dependent adult abuse report**". That is an **administrative
finding by a state department**, not a judgment of any court, and the register it lives in is
confidential. So the most consequential thing that can happen to an Iowa power of attorney is
recorded somewhere a bank cannot look, by a body that is not telling it, with no document changing
hands.

The same register is load-bearing at the other end of the lifecycle: §633.564 requires the court to
search the dependent adult abuse registry before appointing a guardian or conservator. Iowa uses one
confidential state record both to **screen** who may be given authority and to **strip** authority
already given — and in neither direction does the artefact in anyone's hand reflect it.

For anyone building an evidence layer the consequence is concrete, and it compounds the gap §15
ends on. A relying party's safe harbour runs until it has **actual knowledge** that the authority has
terminated. These are exactly the terminations nobody will tell it about: a guardianship order
entered in a different proceeding, a criminal conviction in a different court, a statutory trigger
located in a different chapter from the one the instrument was drafted under. The instrument in the
custodian's hand is unchanged and still looks valid. **A credential that asserts an authority must be
revocable by events its issuer never sees**, which is an argument for short lifetimes and a status
channel rather than for richer assertions at issue time.

## 18. Missouri answers the same question with money instead of law

Section 15 sorts the acceptance regimes by three components — a duty to accept, a remedy for
refusing, a safe harbour for accepting — and every one of them works by **reallocating legal risk**.
Idaho and the uniform power-of-attorney states put the risk on the refuser through a court order and
a fee shift. RUFADAA puts it on the custodian through a compliance deadline. Delaware and Utah put
it on the claimant through a perjury sanction. All of it is law moving liability between parties.

Missouri does something that is not on that axis at all, and it does it four times in four different
chapters. It lets the relying party demand **security**.

- **A power of attorney.** §404.719(4): a third person asked to deal with an attorney in fact may
  require specimens of the agent's signature, any other information reasonably necessary, and an
  indemnity "against forgery of the power of attorney, **by bond or otherwise**". The bond is excused
  only where the power is durable *and* the principal or the agent has been a Missouri resident for
  at least two years *and* an indemnity agreement satisfactory to the third person has been
  delivered.
- **A certification of trust.** §456.10-1013(2): "A third party **may require that the certification
  of trust be acknowledged or guaranteed**." Missouri also requires it to be "signed by **all** the
  trustees", where uniform §1013(b) provides that it "may be signed or otherwise authenticated by
  **any** trustee" — the wording West Virginia and Kentucky both kept.
- **A small-estate claim.** §473.097(1)(3): the affiant files a **bond** for not less than the value
  of the personal property, approved by the judge or clerk of the probate division and conditioned
  on paying the decedent's debts and complying with the court's future orders, unless the court
  dispenses with it.
- **A creditor's claim where no letters issue.** §473.090(1)(2): the creditor applying for refusal
  of letters gives **bond** in not less than the value of the estate, on the same kind of condition.

Behind these sits a general bond apparatus for personal representatives — some two dozen sections,
§§473.157 to 473.217, with §473.200 revoking letters outright for failure to give one, and §473.160
listing the ways out.

The difference between the two designs is worth stating plainly, because it is the difference
between what a standard can do and what an ecosystem can do. **A duty, a remedy and a safe harbour
are all attempts to make an unverified assertion safe to rely on.** Security does not try: it
concedes that the assertion may be false and asks the claimant to cover the loss if it is. One is an
evidence mechanism, the other is an insurance mechanism, and they fail in opposite directions. The
evidence mechanism fails when nobody can tell the custodian the truth in time — the gap §15 and §17
end on. The insurance mechanism fails when the claimant cannot afford the premium, which is why
Missouri's $39,000 estate is a more expensive transaction than Texas's $74,000 one, and why §473.091
has the probate clerk fill out the forms for free and declares that doing so "shall not constitute
the practice of law".

Two details in §404.719(4) repay attention. The first is what the residency exemption is really
measuring. A bond is excused where the principal or agent has been a Missouri resident for two
years — not because residents forge fewer powers of attorney, but because a resident is reachable by
a Missouri court. **The implicit collateral is jurisdictional reach**, which is exactly what a
cross-border digital-estate claim lacks, and it suggests that the harder a claimant is to sue, the
more security a relying party will want. Any scheme that lets a designated recipient in one country
claim an account held in another is, on this reading, the maximum-security case.

The second is the sentence at the end, which is the only place in this data where a statute addresses
the notification problem from the custodian's side: the third person "may **prescribe the place and
manner** in which the third person will be given any notice respecting the principal's power of
attorney and the time in which the third person has to comply with any notice." The relying party
designs its own channel and sets its own clock, and the statute makes that stipulation binding. It
is not a standard, and it does not scale — every bank would specify something different, which is
the problem a profile exists to solve. But it is a legislature recognising that someone has to
nominate the channel, and deciding it should be the party that has to act on what arrives.

## 19. Iowa makes the relying party's knowledge part of the authority, and puts one of them on a shot clock

Every other section here treats the relying party's knowledge as a **shield**. The safe harbours in
§15 all run until the custodian has actual knowledge that the authority is gone; §17 is about
terminations it will never hear of. In all of that, what the custodian knows decides whether it is
*liable*, never whether the authority *exists*. The authority is a fact about the holder, and
knowledge is a fact about the audience.

**Iowa writes three provisions where knowledge, or a clock, is an element of the authority itself.**

| | What the law makes the authority depend on |
|---|---|
| §144B.6(1), health-care agent | priority over a court-appointed guardian, for an agent "**known to the health care provider** to be available and willing to make health care decisions" |
| §144C.8(1), right to control a body | forfeited on being **charged** with murder or voluntary manslaughter in connection with the death — "and those charges are **known to a third party**" |
| §144C.8(2), right to control a body | forfeited by **not acting**: within **24 hours of receiving notification** of the death, or **40 hours of the death**, whichever is earlier |

The first is the mildest and the most far-reaching. Iowa's health-care attorney in fact outranks
"any other person, **including a guardian** appointed pursuant to chapter 633" — a strong rule, and
the inverse of what most of this set does with a later court appointment. But the rank is granted to
an agent *known to the provider to be available and willing*. An agent nobody has heard from does
not outrank the guardian; they are not a lower-priority agent, they are simply not in the contest.
Whether the agent beats the guardian is therefore a question about the hospital's records, not about
the instrument, and two providers holding the same power of attorney can correctly reach opposite
answers.

The second is the one §15 has been circling for four sections. §15 ends on the observation that
every safe harbour turns on actual knowledge and no statute says how knowledge would arrive. Here a
legislature has gone further and made the **terminating event itself** conditional on a third party
knowing: a designee charged with killing the declarant forfeits the right to control the body, but
only once "those charges are known to a third party". Before anyone knows, the charge has no legal
effect on the authority. Virginia ends an agent's authority on a *conviction*, which is at least a
public record; Iowa ends this one on a *charge*, which is earlier, and then gates it on publicity.
The provision is honest about the hinge in a way the safe harbours are not — it concedes that an
event nobody knows about cannot be doing any work — and that honesty is the finding.

The third has no analogue anywhere in this data. **Iowa is the only jurisdiction here in which an
authority can be lost by not using it.** Every other termination in this file is an event about the
principal or the holder: death, revocation, incapacity, a court order, a conviction, a divorce
filing, a founded abuse report. §144C.8(2) ends this one because nobody acted in time, on a clock
measured in hours, and the clock is the **earlier** of two differently-anchored deadlines — 24 hours
from notification, 40 hours from death. A designee told of the death at hour 30 has ten hours; one
told at hour 39 has one; one never told loses the authority at hour 40 without ever having had a
chance to exercise it. The authority then devolves to an alternate designee, or back down the
§144C.5 list.

That list ends in the widest claimant class in this reference, which is the system's answer to the
clock running out: §144C.5(1)(i) gives the right to control to "a person who represents that the
person knows the identity of the decedent and who signs an **affidavit warranting the identity** of
the decedent and **assuming** the right to control final disposition … and the **responsibility to
pay any expenses**". No relationship, no instrument, no court — a sworn statement of identity and an
acceptance of the bill. Iowa closes a forty-hour window and then leaves a door open to anyone
willing to pay.

Three consequences for anything built on top of this, and they are not specific to Iowa:

- **"Does X hold this role?" is not always answerable from facts about X.** Three Iowa provisions
  make the answer depend on what a provider was told, what a third party knows, or how long ago
  somebody was notified. An assertion of the form *holder is the designee of D* is incomplete in
  Iowa without a timestamp and a notification history, and no credential format in use carries
  those.
- **Short-lived authority is real, and the short end is hours, not months.** §16 records findings
  with statutory shelf lives from two hours to five years. §144C.8(2) is the same scale applied to
  the authority rather than to the finding beneath it. Any design whose refresh interval is a day
  cannot represent this role at all.
- **Non-exercise is a state worth modelling.** A protocol that distinguishes only *valid* from
  *revoked* has nowhere to put "lapsed because unused", and nowhere to put the devolution that
  follows it. The alternate designee's authority begins at the moment the first one's ends, and the
  only evidence of that moment is the absence of an act.

## 20. Colorado has two durability tests, and which one applies depends on when the instrument was signed

Every other section here compares jurisdictions. This one is about a jurisdiction that differs from
**itself**, on a line drawn through a single date, and it is the cleanest case in the data of a rule
that cannot be applied until you know how old the paper is.

Colorado enacted the Uniform Power of Attorney Act in 2009, effective 1 January 2010, and
§15-14-704 gives the uniform default in subsection (1): a power “created on and after January 1,
2010, is durable unless it expressly provides that it is terminated by the incapacity of the
principal.” The official comment, which Colorado prints in the statute text, says plainly that
this “is the reverse of the approach under the Uniform Durable Power of Attorney Act”.

Subsection (2) is the part with no parallel elsewhere in this reference:

> A power of attorney existing on December 31, 2009, is durable only if on that day the power of
> attorney is durable under section 15-14-501 or 15-14-745 (2).

So the state keeps **two live tests** and selects between them by the instrument's creation date.
For anything signed before 2010, the operative question is not the default at all but the old
magic-words rule at §15-14-501 — the writing must contain “This power of attorney shall not be
affected by disability of the principal.” or “This power of attorney shall become effective
upon the disability of the principal.” or “similar words showing the intent of the
principal”.

**§15-14-501 is therefore load-bearing, not a vestige**, and that distinction matters because the
same title is littered with sections that *are* vestiges and say so. Article 14 carries four
power-of-attorney parts. Part 6's declaration at §15-14-601 is “(Repealed)”, with an
editor's note sending the reader to §15-14-500.3. The Uniform Statutory Form Power of Attorney Act
at article 1 part 13 is “(Repealed)” outright. Part 7 is the current act. Part 5 is the
superseded one and is still the law for a seventeen-year cohort of instruments. Four parts, two
live, and nothing in the part headings distinguishes them.

### Why this is more than a transitional curiosity

Transitional provisions are ordinary; §15-14-745 is one, and most enacting states have something
like it. What is unusual is the **shape of the result**. A relying party holding a Colorado power
of attorney cannot ask “is this durable?” and get an answer from one section. It has to ask,
in order: when was this signed, and therefore which test applies, and only then, does it pass.

That is the same structure as §12's enacted-but-not-commenced problem and §16's shelf lives, seen
from the other side. §12 is about law that has a future start date; §16 is about findings that go
stale. This is about law that has a **past** cut-off, where the older rule never stops applying to
the instruments it was written for. All three defeat the same assumption — that the law governing an
authority can be looked up once, as it stands today.

For anyone modelling this, the lesson is narrow and concrete: **an assertion about an authority
needs the date of the instrument, not only the date of the assertion.** Two documents presented on
the same morning, identical on their face, can be governed by different tests because one was
signed in 2008. A system that stores “Colorado: durable by default” has recorded something
that is true of most Colorado powers and false of the rest, with no field in which the difference
could be noticed.

Colorado supplies two further things worth recording, neither of which needs a section of its own.

**It states no small-estate figure.** §15-12-1201(1)(a) sets the affidavit ceiling at property that
“does not exceed twice the amount set forth in section 15-11-403, as adjusted by section
15-10-112”. Following that through: §15-11-403(1)(a) fixes an exempt-property base of
“twenty-six thousand dollars” as a pre-2012 figure, and §15-10-112 makes it CPI-adjusted
against a **2010 reference base**, keyed to the calendar year immediately preceding the **year of
death**, rounded down to the next multiple of $1,000. Doubled, that is the ceiling. Every other US
jurisdiction in §9's table prints a number; Colorado prints a formula whose answer depends on when
the decedent died and on a federal index, and which appears nowhere in the statute book. This
reference records the formula and leaves the amount null rather than publishing a figure it has not
read from an official source — which is why Colorado has no row in §9.

**And its default health-care decision-maker cannot be derived.** Every other surrogate in this data
is the output of a statutory priority list, so a relying party can compute it. Colorado's proxy
decision-maker under §15-18.5-103 is the output of a negotiation: “interested persons” — a
spouse, either parent, any adult child, sibling or grandchild, **or any close friend** — “shall
make reasonable efforts to reach a consensus as to who among them shall make medical treatment
decisions”, and the only guidance is qualitative. There is no tie-break; if anyone disagrees with
the selection *or with a decision*, the route is guardianship, which only those same interested
persons may start. Where nobody can be found or nobody is willing, the attending physician may
designate **another willing physician** as proxy. So Colorado can be told who its surrogate is, and
can never be asked to work it out.

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
   that evidences it. The one place the artefact earns its keep is where a legislature has made it
   carry its own scope: Kansas requires every limitation on a guardian's or conservator's powers to
   be stated **on the letters of office** (§59-30,108(c)) and then makes those stated restrictions
   binding on a relying party who is otherwise protected without inquiry (§59-30,185). That is a
   scoped credential written for paper, and it is the closest thing in the set to a model worth
   copying.
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
6. **Expect the authority to end somewhere nobody is looking.** Every safe harbour in §15 runs
   until the relying party has *actual knowledge* that the authority is gone, and §17 shows where
   that knowledge would have to come from: a guardianship order in a separate proceeding, which
   terminates the agency by default in Kentucky and West Virginia and does not in Virginia; a
   criminal conviction for financial exploitation in another title of the Code, which ends a
   Virginia agent's authority by operation of law; a statutory trigger filed two sections away from
   the one headed "Termination". The instrument in the custodian's hand is unchanged in all three
   cases and still looks valid. That argues for short credential lifetimes and a status channel
   rather than for richer assertions at issue time — and it means the same event has to be
   expressible as ending one authority while leaving another intact, because in Kentucky a court
   appointment ends the agent's power over the property and expressly preserves the surrogate's
   over the person. Missouri is the one jurisdiction that has built anywhere to *put* a revocation —
   the recorder of deeds under §404.717(1)(3), the medical record under §404.850(2), the contracted
   registry under §459.250 — and it still imposes no duty on anyone to look. A place to publish and
   a duty to consult are separable, and a standard needs both. **Kansas is the only jurisdiction that
   builds the channel in the other direction**: under §59-30,123(b) a person who refuses a guardian's
   letters of office must report the refusal and its reason to the appointing court within ten days,
   where it is handled as a grievance. So a protocol needs three things, not one — somewhere to
   publish a change of status, a duty to consult it, and a path for the relying party's own "no" to
   get back to whoever issued the authority. Exactly one of the three is legislated anywhere in this
   set, and it is the one nobody designs. **Iowa shows the problem is worse than a missing channel**:
   under §633B.108(2) a power of attorney is *suspended* by a conservatorship and *reinstated* when
   the principal regains capacity, so the authority is intermittent and the document never changes;
   and §633B.110(2)(e) ends an agent's authority on a **founded dependent adult abuse report**, an
   administrative finding in a confidential register. A status channel has to be able to say "asleep"
   as well as "revoked", and some of what it would have to report, no jurisdiction will disclose.
7. **Expect some jurisdictions to answer with collateral rather than evidence.** Missouri lets the
   relying party demand security instead of trusting the assertion: indemnity against forgery of a
   power of attorney by bond (§404.719(4)), a certification of trust acknowledged or guaranteed and
   signed by every trustee (§456.10-1013(2)), a bond from the small-estate affiant (§473.097) and
   from a creditor seeking refusal of letters (§473.090). §18 argues that this is an insurance
   mechanism rather than an evidence one, and that the bond exemption's two-year residency test is
   really measuring whether the claimant is reachable by a local court. A cross-border digital-estate
   claimant is the least reachable party there is, so a profile should expect to carry
   indemnity, guarantee or insurance terms alongside the assertion, and should not assume that
   better evidence removes the demand for security.
8. **Expect some authority to be lost by inaction, and some to turn on what you were told.** §19 is
   Iowa: a health-care agent outranks a guardian only while "known to the health care provider to be
   available and willing" (§144B.6(1)); a designee forfeits the right to control a body on a murder
   charge, but only once "those charges are known to a third party", and forfeits it outright by not
   acting within 24 hours of notification or 40 hours of death (§144C.8). Everywhere else in this file
   the relying party's knowledge decides only whether it is liable. In Iowa it decides whether the
   authority is there at all. So an assertion about a role may need a notification history and a
   timestamp, not just an issue date — and a design whose shortest refresh is a day cannot carry a
   role whose window is forty hours.
9. **Prove the event, not just the role — and expect the proof to lag.** Every section above is about
   evidencing an authority; none of these statutes, bar one, says anything about evidencing the
   *event* that starts it. Nebraska's §30-24,125(2) is the exception, and it concedes the point by
   accepting an "abstract of death" where "a certified death certificate" is delayed. The delay is
   not an edge case: it is the window in which a family first contacts a platform. A design that
   makes a death certificate a precondition is unusable in exactly that window, and §17 adds the
   mirror problem for living principals — in Nebraska a conservator may revoke a power of attorney
   by private decision under §30-4008(2), so the terminating event may leave no public trace at all.
   An assertion about a role should therefore carry what it relies on and how fresh that is, rather
   than assuming a canonical document exists at the moment of the claim.

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
