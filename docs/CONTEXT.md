# Contract Hubs — Platform (Module 0)

Module 0 is the platform backbone that owns identity, cases, documents, payments, wallets, SLAs, dashboards, and notifications once — so each service (POA, Golden Visa, Legal, Shipping, FX, Off-plan, Tenancy, Conveyancing, and any future module) ships as a plug-in instead of a standalone product. This file pins the shared vocabulary the team uses to talk about that backbone.

## Language

**Individual**:
A single human account; the only thing that can log in on the platform.
_Avoid_: User, account, profile

**Business**:
A non-individual entity (Agency, Notary office, Law firm, Shipping provider, FX broker, …) with a sub-type, profile, wallet, audit log, and members. Provisioned only by Platform Admin.
_Avoid_: Company, organization, tenant, workspace owner

**Business Sub-type**:
The kind of Business an entity is. Module 0 ships `Agency`; each Module Manifest adds its own.
_Avoid_: Category, business type, vertical

**Membership**:
The `(Individual, Business, Role)` relation; created only by mutual consent — Business-initiated invite plus explicit acceptance.
_Avoid_: Affiliation, association, link

**Member**:
An Individual currently holding a Business-scoped Role inside a specific Business.
_Avoid_: Employee, staff, user-in-org

**Role**:
A capability grant attached to an Individual. Platform-scoped (`Client`, `Agent (solo)`, `Platform Admin`) or Business-scoped (`Agency Admin`, `Agent` in an Agency, plus what modules declare such as `Notary Operator`, `Lawyer`).
_Avoid_: Permission, group, persona

**Active Role Context**:
The exactly-one Role an Individual is acting as right now; carried on every API call and switched via the top-nav role switcher.
_Avoid_: Mode, view, current profile

**Solo**:
The default state of any Role that supports it (today: Agent) — no Business affiliation.
_Avoid_: Independent, unaffiliated, freelancer

**Canonical Identifier**:
The stable key for an Individual — Emirates ID once UAE Pass is linked, otherwise an internal UUID. Never a phone number.
_Avoid_: User ID, primary key, login ID

**Clean-state Gate**:
The precondition for any Agent transition (Solo↔Agency, Agency↔Agency): zero wallet balance, no pending holds or in-flight cash-out requests, and zero open cases assigned. Fires only on Agent-initiated transitions, not on admin-initiated removals.
_Avoid_: Exit check, lockout, blocker

**Verification Status**:
A per-Individual flag with values `Unverified`, `Verified (UAE Pass)`, `Verified (Passport)`, `Pending Manual Review`.
_Avoid_: KYC level, identity score, trust tier

**Transaction**:
Any action that legally or financially commits a party. Case creation and payment are the V1 base; modules can declare more in their Manifest.
_Avoid_: Operation, action, event

**Case**:
The unit of work on the platform; every service request creates exactly one. Cases originate in Contract Hubs.
_Avoid_: Job, ticket, deal, request, file

**Global Status**:
The platform-owned lifecycle state on every Case: `Open`, `In Progress`, `Awaiting Client`, `Awaiting Partner`, `Completed`, `Cancelled`.
_Avoid_: Phase, stage, state

**Sub-status**:
The module-specific state within a Global Status (e.g., POA's *Notary review*); declared by the Module that owns the Case.
_Avoid_: Step, milestone, sub-phase

**Partner**:
The Business or Solo Individual fulfilling module-specific work on a Case (Notary office, Law firm, freelance translator, …). One Partner at a time per Case.
_Avoid_: Vendor, supplier, third party

**Module**:
A pluggable service unit (POA, Golden Visa, Legal, …) that adds workflow, sub-statuses, documents, roles, SLAs, commissions, and pricing to the platform via a Manifest.
_Avoid_: Plugin, extension, feature, app

**Module 0 / Backbone**:
The platform itself — owner of identity, cases, documents, payments, wallets, SLAs, dashboards, notifications, and Zoho sync. Modules plug into it; it never plugs into modules.
_Avoid_: Core, kernel, framework

**Module Manifest**:
The declarative registration of a Module — its key, Business sub-types, Business-scoped roles, sub-statuses, document templates, SLA defaults, commission and pricing rules, notification triggers, Zoho mapping, and verification thresholds.
_Avoid_: Config, spec, schema

**Wallet**:
A balance-holding ledger account owned by an Individual (per role context) or a Business. Wallets are user-facing: their balance is shown, their transaction history is queryable, and they can be the source or destination of cash flow. Every Wallet's `Available + Pending` reconciles to the sum of its ledger postings.
_Avoid_: Balance, bank account, purse

**Bookkeeping Account**:
An internal ledger account that absorbs the Platform-side of double-entry postings. Not owned by any Individual or Business; not user-facing; has no cash-out and no balance shown to anyone. Exists so every Ledger Entry has both a debit and a credit even when the Platform itself is one side of the transaction. V1 declares a fixed, named set of these (Platform Revenue, Pending FX Revenue, Refunds Issued, Platform Credits Issued).
_Avoid_: Platform wallet, system wallet, house account, internal wallet

**Fee Model**:
The pricing shape a Module uses when a Case is charged. Each Module declares exactly one Fee Model in its Manifest; the Wallet & Finance backbone owns the math, postings, and cash flow for every Fee Model so Modules don't ship payment code. A Fee Model dictates how the Client is charged, whether an Agent Top-up is allowed, and how revenue is split between the Platform, the Agent, and any Partner.
_Avoid_: Pricing type, billing mode, charge model

**Base Fee**:
The amount the Platform charges for a Case before any Agent Top-up. Its computation depends on the Module's Fee Model: a fixed AED amount (POA, Golden Visa), an agent-selected tier (Legal, Conveyancing, Shipping), or a percentage of a notional value (FX). The Base Fee is composed of a Partner Share (what the Platform owes the Partner Business for this Case) plus the Platform's own margin; the Client always sees the Base Fee as a single number, never the split. Frozen on the Case at creation.
_Avoid_: Platform fee, service fee, list price

**Top-up**:
The optional margin an Agent adds over the Base Fee, bounded by a Top-up Cap. The Client pays a single bundled total (Base Fee + Top-up) and never sees the split. Only available on Modules whose Fee Model permits it. Top-up is the Agent's only financial lever — no other Case price input is under Agent control.
_Avoid_: Markup, commission, agent fee, surcharge

**Top-up Cap**:
The maximum AED Top-up an Agent can add on a Case, declared per (Module, Agency) pair in module config. Different Modules carry different caps because Base Fees vary widely (e.g., a 200 AED cap may suit POA but not Conveyancing). Solo Agents fall under a platform-wide cap set per Module by Platform Admin.
_Avoid_: Margin ceiling, commission limit

**Partner Share**:
The portion of a Case payment owed to the Partner Business fulfilling the Case (e.g., the 70% to a Law Firm on Legal, the revenue share to an FX broker, the courier cost on Shipping). Credited to the Partner Business's Wallet as a ledger posting at the moment the Client pays. Partners can see their Wallet balance but cannot self-serve cash-out in V1 — Finance reconciles off-platform.
_Avoid_: Partner commission, partner cut, vendor payout

**Originator Commission**:
A platform-configured slice of the Platform's net share credited to the Agent who originated the Case, used when Top-up is not the right mechanic. V1: FX only. The rate is declared in the Module Manifest and is platform-wide — no per-Agency overrides. Lands in the same Wallet as Top-up and follows the same Agency-vs-Solo settlement rules. On Modules with deferred Settlement Mode (FX), the Originator Commission is not posted at Case payment — it posts when the Partner settles the Platform's revenue share back to the Platform.
_Avoid_: Referral fee, finder's fee, agent revenue share

**Settlement Mode**:
A property of a Fee Model declaring when wallet postings happen relative to Case payment. `immediate` (Fixed, Tiered): Partner Share, Platform Share, and Top-up post at the moment the Client pays. `deferred` (Percentage / FX): Client funds flow to the Partner, not the Platform, at payment; the Platform's share and any Originator Commission post later when the Partner settles back to the Platform.
_Avoid_: Payout timing, posting schedule, billing cycle

**SLA Timer**:
The countdown attached to every Case, with module-declared defaults and optional per-Business overrides; pauses on `Awaiting Client`.
_Avoid_: Deadline, due date, timeout

**System of Record**:
Contract Hubs holds the authoritative case data; Zoho is downstream and receives a one-way sync.
_Avoid_: Source of truth, master, primary system

**Notary office**:
The `Business Sub-type` introduced by the POA Module — a third-party partner business that fulfils notarisation on POA Cases. Provisioned by Platform Admin; carries its own profile, Wallet, audit log, and Members.
_Avoid_: Notary, notary firm, notary partner, notary agency

**Notary Admin**:
The Business-scoped Admin Role inside a Notary office. Manages Operators, publishes office capacity, oversees reassignments, sees the office's Case pipeline. Can hold the role across more than one Notary office (admin-style roles are not one-Business-at-a-time, per CONTEXT.md M0:R1.3).
_Avoid_: Notary owner, head notary, office manager

**Notary Operator**:
The Business-scoped member Role inside a Notary office. Reviews POA Drafts, runs Video Sessions, completes the Session-Completion Checklist, uploads the Final POA. One Notary office at a time per Operator (one-Business-at-a-time rule, M0:R1.3).
_Avoid_: Notary, signing notary, notarisation agent

**POA Type**:
The kind of Power of Attorney a Case is for. V1 ships two: `Property POA` and `General POA`. Future types (Vehicle, Company, Custom) require Platform-Admin-authored templates before going live.
_Avoid_: POA category, POA template, POA flavour

**Principal**:
The party on whose behalf the POA is being granted. Can be either (a) the Client logging in (a Verified `Individual`), or (b) a `Company` whose **Authorised Signatory** is the logged-in Verified Individual. Either Verification method (UAE Pass or Passport) satisfies POA's gate.
_Avoid_: Grantor, donor, executor, owner

**Attorney (POA context)**:
A party the Principal is granting powers to. **A POA Case can have one or more Attorneys** (V1 cap: 5 per Case). Each Attorney is independently either (a) an Individual (referenced by data on the Case — name + ID document; not required to be on the platform) or (b) a `Company` (referenced by data — trade name, license number, jurisdiction, Authorised Signatory). Not necessarily a lawyer. When there are multiple Attorneys, the Case also carries an **Attorney Authority Mode** describing how they can act.
_Avoid_: Lawyer, agent, representative (last one collides with platform's Agent Role)

**Attorney Authority Mode**:
The legal rule that governs how multiple Attorneys on the same POA Case can exercise their powers. V1 supports three values: `joint` (all Attorneys must act together for any action), `several` (any one Attorney can act independently), and `joint_and_several` (each Attorney can act alone for some powers and jointly for others — the Draft specifies the split). Required only when the Case has more than one Attorney; hidden and ignored when there is exactly one.
_Avoid_: Authority type, signing rule, group mode

**Company (POA context)**:
A legal entity acting as Principal or Attorney on a POA Case. Captured as **data fields** on the Case (trade name, trade license number, jurisdiction of registration, Authorised Signatory) — **not** modelled as a Module 0 `Business` entity in V1. Distinct from the platform's `Business` concept (which is for Partners and Agencies, not Clients).
_Avoid_: Corporate client, business client, organisation, legal person

**Authorised Signatory**:
The Verified `Individual` who signs the POA on behalf of a `Company` Principal or Attorney. Always the logged-in Client when the Principal is a Company. The Signatory's Verification gates the Case the same way the Principal's would for an Individual Principal.
_Avoid_: Company representative, signatory, agent

**Principal-Only Action**:
An action on a POA Case that **must** be performed by the Principal themselves (or the Authorised Signatory if the Principal is a Company) — never by the Agent acting on their behalf. V1 has exactly two: **Approve Draft** (the legal consent to the document's content, at Sub-status #8) and **sign in the Video Session** (the legal notarial signature, at Sub-status #13). Every other action on the Case can be performed by an attached Agent on the Principal's behalf, including filling forms, uploading documents, paying, booking, rescheduling, disputing, and starting a follow-up Case after a terminated one.
_Avoid_: Client-only action, restricted action, signing action

**English Translation Add-on**:
The optional paid extra on a POA Case whereby the Notary office produces a stamped English translation of the Final POA in addition to the default Arabic Final POA. Opted into by the Client at the payment step; price declared in the POA Module Manifest.
_Avoid_: Translation, English copy, translated POA

**No-Show Categorisation**:
The required Operator attestation when a POA Case is marked `Missed appointment`. Picks one category from a small enum (`excused_technical_issue` | `excused_communication_issue` | `unexcused`) and records a free-text reason. The category determines the outcome (Excused → free reschedule, no penalty; Unexcused → the configured Client-Wallet credit penalty). Auditable; disputable by the Client via Platform Admin review.
_Avoid_: No-show reason, missed-appointment reason, no-show classification

**Excused No-Show**:
A no-show whose Categorisation is `excused_technical_issue` or `excused_communication_issue` — the Operator confirms the Client tried to join and was blocked by a technical fault, or the Client never received the join link/instructions. Outcome: **free reschedule**, no Wallet penalty, does not count toward the 30-day gaming-mitigation threshold.
_Avoid_: Forgiven no-show, waived no-show

**Unexcused No-Show**:
A no-show whose Categorisation is `unexcused` — the Operator finds no acceptable reason for the Client's absence. Outcome: **no Wallet credit, no partial refund**. The Case enters a 7-day pending-termination window (Sub-status `Pending termination — unexcused no-show`) during which the Client can dispute the Categorisation. If the window expires without dispute, or the dispute is upheld, the Case advances to terminal `Cancelled — unexcused no-show` and the Client must **start a new POA Case** (with optional one-click pre-fill of the previous Case's data) to try again. Original Case payment stands — Notary keeps Partner Share, Agent keeps Top-up, Platform keeps margin. Counts toward the 30-day gaming-mitigation threshold.
_Avoid_: Penalised no-show, standard no-show

**POA Draft**:
The populated POA document generated from the Module Manifest's template, populated with the Principal, Attorney, and POA-Type-specific data captured on the Case. Exists in two stored forms — the raw template-merge output and the LLM-polished output — with the polished version as the default surfaced to the Notary Operator. The Operator can revert to the raw output with one click. Versioned per edit.
_Avoid_: Draft (without qualifier — collides with Case-state usage in some legacy docs), POA document, template fill

**Final POA**:
The signed and notarised POA document uploaded by the Notary Operator after a successful Video Session and Session-Completion Checklist. Distinct from the POA Draft — once issued, the Final POA is immutable on the Case and is the only document the Client can download.
_Avoid_: Signed POA, executed POA, completed POA

**Acting Operator**:
The Notary Operator who first picked up the POA Case from the office's draft-review queue. Owns the Case's paperwork from draft review through Final POA upload; immutable barring a Notary-Admin-initiated reassignment with reason.
_Avoid_: Assigned notary, case notary, primary notary

**Session Operator**:
The Notary Operator who runs the Video Session for a specific Case. Defaults to the Acting Operator; can differ when the Acting Operator is not on-shift at the booked Slot, in which case the Notary Admin assigns the Session Operator from the office's schedule.
_Avoid_: Video notary, meeting notary

**Office Capacity Block**:
A published window of N concurrent Slots a Notary office offers — e.g., "Mon 10:00–13:00, 4 sessions." **Notary Admin is the sole source of truth** — they publish, edit, override, and remove Blocks; the platform does not generate or pad capacity. Blocks support one-off dates or weekly recurrence. Individual occurrences of a recurring Block can be overridden ad hoc (e.g., this Tuesday's concurrent count reduced from 4 to 2 for staffing).
_Avoid_: Availability window, opening hours, calendar block

**Slot**:
A single bookable time within an Office Capacity Block — e.g., "Mon 11:00." Holds one POA Case at a time. Drawn from the office's capacity pool, not from a per-Operator calendar. Individual Slots can be **blocked ad hoc** by the Notary Admin (taking that specific Slot offline without affecting its surrounding Block).
_Avoid_: Appointment, time, opening

**Office-closure day**:
A date the Notary Admin has marked as office-closed. Office-closure days override every Block — no Slots are published for the Client on those dates, regardless of recurrence rules. UAE public holidays are pre-seeded but editable per office.
_Avoid_: Holiday, day off, blackout

**Video Session**:
The appointment at which notarisation happens. In POA the session runs on **whatever video tooling the assigned Notary office's authority approves** — Contract Hubs does **not** create the meeting. The platform relays the Operator-provided join link and instructions to the Client and Agent. (Other Modules that need a platform-created video session use Microsoft Teams per ADR-0004 — POA is the explicit exception.)
_Avoid_: Video call, notarisation meeting, Teams meeting (the term is video-vendor-agnostic in POA)

**Partner-Provided Video Link**:
The join URL the Notary office's Operator (or Notary Admin) supplies for a booked Video Session on a POA Case. Captured on the Case as a text field; relayed to Client and Agent via Notification Center, email, and the Case detail view. The platform places no constraint on which video service the URL points to — it follows whatever notarial system the Notary office is licensed to use.
_Avoid_: Teams link, meeting URL (in POA context), notary URL

**Session-Completion Checklist**:
The required post-session attestation the Session Operator completes in the platform UI before sub-status `Awaiting final POA` can advance to `Final POA issued`. Includes: identity-verified, notarial-reading-conducted, signature-observed, recording-retained (in the notary's system per their policy — not pulled into Contract Hubs). For Cases with the English Translation Add-on, also includes english-translation-prepared. Audit-logged.
_Avoid_: Post-call form, session sign-off

## Relationships

- An **Individual** holds one or more **Roles** and acts in exactly one **Active Role Context** at a time.
- A **Membership** binds one **Individual** to one **Business** with one Business-scoped **Role**.
- A **Business** has many **Members** and must have at least one Admin member at all times.
- A **Case** belongs to exactly one **Module** and carries one **Global Status** plus one Module-declared **Sub-status**.
- A **Case** has one **Partner** assigned at a time.
- Every **Case** has exactly one **SLA Timer**.
- A **Module** is registered via a **Module Manifest**; the Manifest is the only contract the **Backbone** knows about.
- A **Wallet** belongs to either an **Individual** (per role context) or a **Business** — never both.
- A **Transaction** is gated by the acting **Individual's Verification Status**; **Modules** may layer stricter requirements via their **Manifest**.
- An **Agent's** state transition (Solo↔Agency, Agency↔Agency) is gated by the **Clean-state Gate**.
- **Module 0** defines `Agency` as a **Business Sub-type**; every other **Business Sub-type** is introduced by a **Module Manifest**.
- A **POA Case** has exactly one **Principal** and **one or more Attorneys** (V1 cap: 5), and is fulfilled by exactly one **Notary office** as **Partner**. When the Case has more than one Attorney, it also carries an **Attorney Authority Mode**.
- A **POA Case** has one **Acting Operator** (set at draft pickup) and one **Session Operator** (set at booking); the two may differ but default to the same person.
- A **Slot** belongs to exactly one **Office Capacity Block**, which belongs to exactly one **Notary office**.
- A **Principal** is either an **Individual** (the logged-in Client) or a **Company** represented by an **Authorised Signatory** who is the logged-in Client; an **Attorney** is either an Individual or a Company.

## Example dialogue

> **Dev:** "If a Client wants to create a POA Case, what do we check before the form opens?"
> **Domain expert:** "It's a Transaction, so `requireVerified()` fires on the Individual. POA's Manifest layers no stricter requirement than the base gate — either `Verified (UAE Pass)` or `Verified (Passport)` is enough, since V1 supports both UAE residents and non-residents. The form then asks whether the Principal is the logged-in Individual or a Company; if Company, the logged-in Individual is recorded as the Authorised Signatory and the company-data fields appear. If the Client is Unverified we send them through the verification flow and resume Case creation on success."

> **PM:** "An Agent wants to move from Acme Realty to Beta Realty. What stops them?"
> **Domain expert:** "Only the Clean-state Gate. They need zero balance in their Agent Wallet and zero open Cases assigned to them as Agent. If both are clear, they leave Acme — the Membership ends — and can accept Beta's invite. Cases they completed at Acme stay attributed to Acme."

> **Designer:** "On the new-case picker, do we show every Module the platform supports?"
> **Domain expert:** "No — effective visibility is the intersection of Platform Admin's global enable and the active Business's per-Business enable. A Solo Agent only sees the global set; an Agent acting inside Acme Realty sees only what Acme has left enabled."

## Flagged ambiguities

- "User" was used to mean both **Individual** and **Member** — resolved: every login is an **Individual**; **Member** only exists inside a specific **Business**.
- "Account" was used to mean both **Individual** and **Business** — resolved: **Account** = **Individual**; a **Business** is an entity, not a login.
- "Status" was used to mean both **Global Status** and **Sub-status** — resolved: these are two distinct layers on the same **Case**, owned by Module 0 and the **Module** respectively.
- "Owner" of a Business was used informally — resolved: there is no Owner concept; say **Admin** (Agency Admin, Notary Admin, Law Firm Admin, …).
- "Verified" without a method was ambiguous — resolved: distinguish **Verified (UAE Pass)** from **Verified (Passport)**; the method matters for module-level gates.
- "Sign up with email" was sometimes assumed — resolved: V1 has only **mobile** and **UAE Pass** registration paths; email is post-V1.
- "Plugin" / "extension" was used for Modules — resolved: say **Module**.
- "Tenant" was used in the multi-tenant-SaaS sense — resolved: collides with the *Tenancy* Module; use **Business** for the workspace concept.
