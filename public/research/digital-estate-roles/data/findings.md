# Findings across the set

What the data says when you read it sideways — across jurisdictions rather than down one.
The viewer recomputes its headline figures from the data every time it draws this page; the
counts written into the sections here were current on **2026-10-01**.

Not legal advice, and not a survey: this is what the sourced data supports, nothing wider.

## 1. The roles are near-universal. The digital adaptation is not.

Counting how many **countries** recognise each canonical role, rather than how many
jurisdictions:

| Canonical role | Jurisdictions | Countries |
|---|---|---|
| `personal-representative-executor` | 45 | **24** |
| `conservator-estate` | 48 | 21 |
| `personal-representative-administrator` | 41 | 20 |
| `anatomical-gift-agent` | 42 | 19 |
| `financial-poa-durable` | 39 | 17 |
| `guardian-person` | 39 | 17 |
| `health-care-agent` | 37 | 14 |
| … | | |
| `digital-assets-fiduciary` | 19 | **4** |
| `online-tool-designee` | 17 | **2** |

Every legal system in the set has someone who steps into a dead person's shoes, and almost
all have someone who acts for a living person who cannot. Executor or its equivalent is the
single most universal role in the data, present in 24 of 24 countries.

**The gap is not conceptual, it is digital.** `online-tool-designee` exists in two countries.
Whatever a standard needs to carry, it is not a new idea about who may act — that idea is
settled nearly everywhere. It is the means of proving it to a platform.

## 2. Three regimes, worldwide, address post-mortem digital authority directly

Only France and the United States have a statute conferring fiduciary access to digital
assets as such (`digitalAssetsFiduciaryStatute`: true in 7 of 25 jurisdictions that record
it, and those seven are France plus the RUFADAA states and the US model layer). Italy
arrives at a nearby place by a different route. The three shapes are not variations — they
disagree about the default:

| | Mechanism | Default if the person said nothing |
|---|---|---|
| **US (RUFADAA)** | Custodian's online tool names a designated recipient; otherwise a fiduciary under other law requests disclosure | Catalogue yes; **content needs the user's consent**, or a court direction for a personal representative |
| **France (Loi 78-17 art. 85)** | Directives, general or particular, may name a person charged with execution; **art. 85 III obliges every online service to offer the choice**; contrary terms of service are *réputée non écrite* | **Heirs** may act so far as settling the succession requires |
| **Italy (Codice privacy art. 2-terdecies)** | The deceased's GDPR rights may be exercised by someone with their own interest — **unless the person forbade it in writing to the controller**, and that prohibition binds | Rights **are** exercisable by interested persons |

The design consequence is concrete: a protocol cannot assume a direction is a *grant*. Italy's
instrument is a **prohibition lodged with the controller**; France's may be either and is
revocable at any time; RUFADAA's is a disclosure direction that beats a terms-of-service
clause only where the user acted affirmatively and distinctly. **Allow and forbid both have to
be first-class, addressed to the controller, and revocable.** A design that models only
consent silently mis-implements Italy and under-implements France.

## 3. France is the only jurisdiction that compels the platform

Everywhere else, online tools are *recognised where custodians choose to offer them*. Art. 85
III requires every provider of an online public communication service to inform users of what
happens to their data on death and let them choose whether to pass it to a designated third
party.

That is the largest standards opportunity in the data: a legal mandate to provide exactly the
mechanism a protocol would specify, with no technical form specified anywhere in the statute.
Anything that interoperates is competing with bespoke per-platform implementations, not with
an incumbent standard.

## 4. Durability by default is a minority rule, and two routes reach it

`poaDurableByDefault` is **false in 21** jurisdictions and **true in 8** — Denmark, Finland,
Germany, the Netherlands, Sweden, Illinois, New York and the US model layer. The majority
require a dedicated instrument or express words.

Two of those eight get there differently, which matters for anyone modelling the lifecycle:

- **By design** — the UPOAA states, where §104 says a power is durable unless it expressly
  provides otherwise.
- **By omission** — the Netherlands, where BW art. 3:72 lists what ends a *volmacht* (death,
  *ondercuratelestelling*, bankruptcy, revocation) and incapacity is simply not on the list.
  Nothing declares durability; it follows from the absence of a terminating event.

Ireland is the sharp contrast: an ordinary agency dies with capacity, and an enduring power
**does not enter into force until** both registration and incapacity (2015 Act s 59(4)) — two
cumulative gates where England and Wales next door needs none for property.

## 5. Registration before use splits the common-law world against itself

`poaRegistrationBeforeUse` is true in 10 and false in 15. The split does not follow legal
family: England & Wales, Scotland, Ireland, Singapore, Japan, South Korea, Denmark, Finland,
France and Italy require a registration or filing step; most US states, the Australian states,
the Canadian provinces, the Netherlands and Northern Ireland do not.

Singapore is the outlier worth noting: registration there is **constitutive**, not procedural
— the Act does not say a lasting power must be registered before use, it says the power is not
created unless registered.

For a protocol this is the difference between a credential that can be issued at signing time
and one that cannot exist until an authority acts.

## 6. Organ donation: opt-out is European, recent, and still soft

`organDonationModel` is **opt-in in 18** jurisdictions and **opt-out in 10**. The opt-out set
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
| `health-records-representative` | 35 | 5 |
| `benefits-payee` | 29 | 5 |
| `tax-representative` | 29 | 5 |
| `veterans-fiduciary` | 22 | 3 |

These are federal-layer roles inherited by every sub-national file in the US, Australia and
Canada. They are national programme mechanics, not a global pattern, and treating them as
one would over-generalise from three countries.

The inverse is `universal-successor-heir`: **16 jurisdictions across 16 countries**, exactly
one per country. It is a clean marker of civil-law universal succession, where the estate
vests in the heirs at death with no grant and no appointment.

## 8. Supported decision-making is the newest idea and spreads unevenly

`supportedDecisionMakingStatute` is true in 15 and false in 8. Notably the **US model layer is
false while five US states are true** — the uniform acts have not absorbed it, but states
have. Ireland's 2015 Act is built on it as the first of three graded tiers; Victoria, British
Columbia, Québec, Italy, Japan, South Korea, India, Brazil and Argentina all have a form.

It is the one place where the canonical vocabulary is still moving, which is a reason to treat
`supported-decision-maker` as provisional rather than settled.

## 9. One mechanism, a tenfold spread in the number that triggers it

Every US state in the set lets a successor collect a small estate without a grant, on an
affidavit, after a short wait. The mechanism is uniform. The threshold is not:

| | Ceiling |
|---|---|
| Uniform Probate Code §3-1201 (the model) | $25,000 |
| North Carolina, New Jersey | $20,000 |
| Maine (CPI-indexed) | $40,000 |
| Michigan, New York, Pennsylvania | $50,000 |
| Florida, Texas | $75,000 |
| **Idaho**, Ohio, Washington | $100,000 |
| Louisiana | $125,000–$200,000 |
| Illinois | $100,000–$150,000 |
| California (CPI-indexed) | $208,850 |

The same affidavit, presented to the same kind of custodian, is effective over a range that
spans an order of magnitude — and two states index the figure to inflation while the rest
legislate a flat amount that silently erodes.

For a protocol the lesson is narrow and useful: **do not encode the threshold.** Whether a
small-estate claim is good is a question for the law of the decedent's domicile at the date of
death, not a number a credential or a custodian can carry. What a credential can usefully
assert is the affiant's sworn statement and the state whose law they swore it under.

Idaho adds a second route with no ceiling at all: under §15-3-1205, where a surviving spouse
is the sole devisee or heir, a petition and hearing produce a decree with the same effect as a
formal decree of distribution, with no personal representative and no amount limit. Size of
estate is simply irrelevant where the spouse takes everything.

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
  simultaneously too strict and too weak across one set of fifteen US states.

Idaho goes further on the trigger. The model has the agent's authority begin on incapacity,
usually certified by a clinician. §39-4504(1)(b) instead gives the ACPD agent authority "if the
conditions in such advance care planning document for authorizing the agent to act have been
satisfied" — the instrument defines its own commencement, and the statute does not supply a
default. **When the authority starts is a fact about the document, not about the law.**

## 11. Idaho compels the relying party, as France compels the platform

§3 noted France as the only jurisdiction that obliges platforms to offer a post-mortem
designation mechanism. Idaho is the only one in the set that obliges the other side of the
exchange — the party being asked to honour a document.

Idaho enacted the Uniform Recognition of Substitute Decision-Making Documents Act (title 15,
chapter 15). §15-15-103 makes a document executed in another state valid in Idaho if it
complied with the law of the place of execution. §15-15-106(1) then does the work:

> a person that is asked to accept a substitute decision-making document shall accept within a
> reasonable time a document that purportedly meets the validity requirements of section
> 15-15-103 … The person may not require an additional or different form of document for
> authority granted in the document presented.

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

That is the shape of an opportunity rather than an obstacle. Both statutes describe an outcome
and leave the mechanism open, which is precisely the gap a profile can fill — and in Idaho's
case the statute has already removed the relying party's strongest objection to accepting an
unfamiliar artefact.

The exceptions matter and should be read: §15-15-106(2) preserves refusal where the person
would not have to act for the individual anyway, where they have actual knowledge the
authority has terminated, and in the other listed cases.

## 12. Law in force is not law enacted

Idaho is the first jurisdiction in this set where the data has to carry two answers at once.
Title 15 chapter 5 is currently published under two headings — "PROTECTION OF PERSONS UNDER
DISABILITY AND THEIR PROPERTY [EFFECTIVE UNTIL JANUARY 1, 2027]" and "UNIFORM GUARDIANSHIP,
CONSERVATORSHIP, AND OTHER PROTECTIVE ARRANGEMENTS ACT [EFFECTIVE JANUARY 1, 2027]". Idaho
enacted UGCOPAA in 2026 (S 1240, ch. 79); it is law, and it is not yet in force. §15-5-401 was
"repealed and added" with effect from that date.

The guardian and conservator rows here record the law in force and say what replaces it.
Anyone citing them needs to know that they expire: on 1 January 2027 Idaho's answer to "when
does a conservator's authority begin, and on what finding" changes, and a reader who cached
the current answer is wrong without anything having visibly moved.

Two design points follow, and they are not specific to Idaho:

- **Authority assertions need a time, not just a date of issue.** "X is conservator of Y" is
  evaluated against the law of a jurisdiction *as at* some moment. A standard that records only
  when a credential was issued cannot express which regime it was issued under.
- **Enactment and commencement are separate events and both are citable.** Ireland's deemed
  consent commenced on 17 June 2025, years after enactment; Idaho's UGCOPAA is enacted with a
  commencement 15 months out. Anything built from a snapshot of "what the statute book says"
  without reading the commencement provisions will be wrong in both directions.

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
   case is not an edge case; it is Italy's entire model.
3. **Expect the authority to be gated.** In 10 jurisdictions a power does not exist, or does
   not operate, until a registry or court acts — and in Ireland and France the gate is
   explicitly two-part. Issuance time and effectiveness time are not the same event.
4. **The civil-law systems need no grant at all.** In 16 countries the heirs hold the estate
   from the moment of death by operation of law. There is no document to present. Any design
   that assumes a court artefact excludes a third of the set.
5. **France is the forcing function.** It is the only jurisdiction that requires platforms to
   offer the mechanism, and it voids terms of service that cut across the user's choice.

## Terms used here

Two kinds of name appear in these sections, and neither explains itself.

**Feature keys** are written in camelCase (`poaDurableByDefault`). They are the cross-jurisdiction
facts the data records for each jurisdiction, each one carrying its own citation, and they are what
the counts in sections 2 and 4 to 8 are counting.

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
