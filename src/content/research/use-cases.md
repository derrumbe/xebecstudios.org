---
title: 'Use cases across jurisdictions'
description: 'What a platform actually faces, use case by use case, across 60 jurisdictions: which legal roles can carry each one, how far each reaches, and why high coverage is not the same as interoperability.'
section: 'digital-estate-standards'
order: 1
standing: 'Analysis. Every legal claim is carried from the sourced reference.'
updated: 2026-10-26
---
**This is the advisory layer, and it is deliberately not part of the base site.** The reference at
[the sourced reference](/research/digital-estate-roles/#tab=findings) and the viewer say what the law currently is and stop there. This page asks a
different question — what a platform or a standard should do about it — and keeping the two apart
matters, because the first is sourced to statute and the second is argument.

Not legal advice. Every legal claim here is carried from the base reference, where it has a pinpoint
citation and a retrieval date.

## The reframe

The base reference is organised by **role**, because that is how the law is organised. A platform
meets the same law as a **question**: who is asking, what state is the user in, and what are they
trying to reach. The role is the *answer* to that question, not the question itself.

That matters because the mapping is many-to-many. One use case is satisfied by several roles, the
set of available roles differs by jurisdiction, and in some jurisdictions the answer is that no role
exists. A view organised by role cannot show that; this one can.

## Coverage

One use case is **covered** in a jurisdiction when at least one of its canonical roles is recorded
there, so these are unions and never sums. The numbers are computed from the generated role index by
a checker in the source repository, which also checks this table — they are not copied by hand, because the base
findings page established what happens to a hand-copied count the moment a jurisdiction is added.

Each use case is stated as the question a platform actually faces, rather than as a role. The
identifiers are the ones the mapping data uses, and the table below repeats them:

- **`incapacity-account-access`** — A living user cannot act, and someone needs access to their accounts
- **`deceased-administration`** — A personal representative with a grant asks for the account
- **`incapacity-health-decisions`** — A living user cannot act, and someone must make treatment decisions
- **`deceased-small-estate`** — A family member asks for a deceased user’s account and the estate is small
- **`post-mortem-body`** — Someone must decide on remains or organ donation, within hours
- **`health-records-access`** — Someone needs the user’s health records
- **`benefits-and-tax`** — Someone must deal with benefits or tax authorities for the user
- **`deceased-digital-assets`** — A fiduciary invokes the digital-assets statute against a custodian
- **`deceased-trust-held`** — A successor trustee asks for an account the trust holds
- **`self-directed-ante-mortem`** — The user tells the platform now what should happen to the account later

| Use case | Jurisdictions | Countries | Share | Roles that can carry it |
|---|---|---|---|---|
| `incapacity-account-access` | 60 | 24 | 100% | durable / springing POA, conservator, guardian, digital-assets fiduciary, supported decision-maker |
| `deceased-administration` | 60 | 24 | 100% | executor, administrator, universal successor |
| `incapacity-health-decisions` | 58 | 23 | 96% | health-care agent, default surrogate, guardian, supported decision-maker |
| `deceased-small-estate` | 54 | 21 | 88% | small-estate affiant, universal successor |
| `post-mortem-body` | 55 | 19 | 79% | disposition-of-remains agent, anatomical-gift agent |
| `health-records-access` | 41 | 5 | 21% | health-records representative |
| `benefits-and-tax` | 41 | 5 | 21% | benefits payee, tax representative, veterans fiduciary |
| `deceased-digital-assets` | 34 | 4 | 17% | digital-assets fiduciary, online-tool designee |
| `deceased-trust-held` | 32 | 2 | 8% | successor trustee |
| `self-directed-ante-mortem` | 31 | 2 | 8% | online-tool designee |

France sits oddly in that last row and deserves calling out, because it is the only jurisdiction in
the set that **compels** the mechanism rather than recognising it: art. 85 III of Loi 78-17 obliges
every online public communication service to let users choose what happens to their data on death,
art. 48 obliges telling them the right exists, and the CNIL's sanction powers stand behind both. The
share column counts where a role exists; it does not show that in one country the law already
requires the function and specifies no way to perform it. That is the strongest adoption argument in
this material and it is not visible in any of these numbers.

**Two rows are artefacts of what this reference records, not findings about the world**, and reading
them as findings would be the §7 mistake in a new form:

- `deceased-trust-held` sits at 2 countries because the schema records the successor trustee
  only where it is materially relevant. Treat it as a floor.
- `health-records-access` and `benefits-and-tax` sit at 5 because they are **federal-layer** roles
  inherited by every US, Australian and Canadian sub-national file. The count reflects which
  countries have a federal layer in this data, not how many legislate the question.

The other eight rows are real.

## The first finding: coverage and interoperability are different things

`deceased-small-estate` is the volume case — the bereaved family contacting support — and it is
**88% covered and barely interoperable**. Two unrelated mechanisms reach it:

- a **small-estate affidavit**, a common-law device recorded in 6 countries, where the claimant
  swears a statement and hands it to whoever holds the asset; and
- **universal succession**, under which the heirs hold the estate from the moment of death, with no
  document to present at all. The 16 countries are Argentina, Brazil, China, Denmark, Finland,
  France, Germany, Italy, Japan, Mauritius, Mexico, the Netherlands, Rwanda, South Korea, Spain and
  Sweden — a list worth reading, because it is not simply "civil-law Europe": it spans four
  continents and includes two of the three African jurisdictions in the set.

So a platform that implements "accept a sworn affidavit" has built for 6 countries and will be
presented with nothing at all by claimants from 16 others, who are nonetheless entitled. And inside
the affidavit group the parameters are not close: the ceiling runs from **$2,000 to $208,850**, the
waiting period from none to 120 days, and the artefact from a mandatory state form (Virginia) to a
safe-harbour form (Kansas) to no artefact whatsoever (Virginia's tier below $35,000).

**A high coverage number is not a green light.** It says the claimant has a legal basis, not that
there is anything to verify.

## The second finding: the more digital the use case, the narrower it is

Read the Share column from the top and it falls off a cliff exactly where the subject turns digital:

- "administer the estate" and "act for someone who has lost capacity" — **100%**
- "collect a small estate" — 88%
- "invoke the digital-assets statute" — **17%**
- "the user told the platform what to do" — **8%**

The base findings page makes this point by role (§1, and the headline band pins its second figure to
the online-tool designee for the same reason). Stated per use case it is more actionable, because it
is about product flows rather than vocabulary: **a flow built on the online tool has a legal basis in
two countries; a flow built on "show me the grant" has one in twenty-four.**

That is an argument for binding to the universal roles and treating the digital-native ones as an
optimisation where they exist — not the reverse, which is the intuitive way round for a platform that
starts from its own data model.

## What the claimant actually hands over

The use case decides the legal basis. The **artefact** decides whether anything can be verified, and
it is where the trouble is.

| Use case | Artefact | Issued by | Verifiable today |
|---|---|---|---|
| `self-directed-ante-mortem` | a record the platform already holds | the custodian | **yes** — it never leaves |
| `deceased-administration` | letters, a grant, a certificate of inheritance | a court or register | no, but an issuer exists |
| `deceased-trust-held` | a certification of trust | the trustee, or in Iowa their attorney | no |
| `deceased-small-estate` | an affidavit, a court-issued certificate, or nothing | the claimant, a register, or nobody | no |
| `incapacity-account-access` | the instrument, or letters | a notary, a court, or nobody | no — and in 10 jurisdictions not yet, see below |
| `incapacity-health-decisions` | a declaration, an affidavit, a clinician's file note, a jointly signed agreement, or nothing | varies, including the relying party itself | no |
| `post-mortem-body` | a declaration, or an affidavit of identity from anyone willing to pay | the claimant | no |

Three observations a standard has to absorb:

1. **In the common case nobody is the issuer.** Universal succession, Virginia's lowest small-estate
   tier and an un-notarised nominating instrument all produce authority with no artefact and no
   issuing body. Every credential protocol assumes an issuer.
2. **The relying party is sometimes the author of the authority.** West Virginia's clinician
   *selects* the surrogate in writing; Iowa's §144A.7 surrogate can only *co-sign* with the attending
   physician. There is no claimant to authenticate, because the authority is the relying party's own
   record.
3. **Only the first row is verifiable today**, and only because the authority never left the
   platform. That is the shape worth generalising, not the exception to tolerate.
4. **Sometimes the artefact exists and confers nothing yet.** In ten jurisdictions — England &
   Wales, Scotland, Ireland, Singapore, Japan, South Korea, Denmark, Finland, France and Italy — a
   power must be registered or filed before it can be used, so there is a window in which the
   signed instrument is valid and empty. **Singapore is sharper still**: registration there is
   constitutive, so the power is *not created* unless registered. A platform that accepts a signed
   instrument on its face is wrong in ten jurisdictions and, in one, is honouring something that
   does not exist.
5. **The direction may be a prohibition.** Italy's Codice privacy art. 2-terdecies lets an
   interested person exercise the deceased's rights **unless the deceased forbade it in writing to
   the controller** — and the prohibition binds. France's directives may permit or forbid. So
   "who may act" is not always the question; sometimes the recorded fact is that nobody may.

## What varies, and so what the data has to carry

Five axes, each of which the base reference establishes varies across the set:

| Axis | Range observed |
|---|---|
| **What starts it** | execution; a clinician's or judge's written finding; a court order; death; a registration; a certified contingency |
| **What evidences it** | an instrument, letters, an affidavit, a certification, a register entry, a clinician's note, a joint agreement, nothing |
| **Who must honour it** | 8 statutory acceptance regimes, differing in duty, prohibited grounds, remedy, safe harbour and limitation period; everywhere else, nothing |
| **What ends it** | death, revocation, a court appointment (which may terminate, continue, suspend-and-revive, allocate, or transfer the power), a conviction, a confidential administrative finding, non-exercise on an hours clock |
| **Scope** | on the face of the artefact (Kansas) or only in the order behind it (everywhere else) |

The fourth row is the one no protocol currently expresses. A court appointment produces **five
different answers** across six states, one of which — Iowa's §633B.108(2) — is "suspended, and
reinstated if the principal regains capacity". An authority that is valid, temporarily ineffective,
and then valid again, with nothing issued or withdrawn at either boundary, is not a state any
credential format has.

## Where this goes next

[the standards landscape](/research/digital-estate-standards/standards/) takes these requirements to the current standards landscape and asks which of
them is already solved, which is nearly solved, and which nobody has attempted. The short version is
that the two things this reference has accidentally produced — a cross-jurisdiction role vocabulary
and a statutory vocabulary of lawful refusal grounds — are contributions rather than gaps, and the
hard parts are the issuer-less artefact, the as-at date, and the suspended state.

## Keeping this page honest


The checker verifies every row of the coverage table against the generated role index and fails if a use
case has no row, which is what catches a newly added jurisdiction. It does **not** check the prose:
the artefact table, the five axes and every argument above need reading by a human. Exit 2 means it
could not run, not that the data is wrong.
