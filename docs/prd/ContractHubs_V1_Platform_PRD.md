# Contract Hubs — Module 0 (Platform Backbone) — V1 PRD

**Status:** Draft v0.1
**Owner:** Product (Ala)
**Target launch:** 2026-10-03

**Scope of this PRD:** **Module 0 — the platform backbone**, deliberately narrowed to:
- **Identity** — login and registration.
- **Roles** — what an Individual can do, where.
- **Businesses (workspaces) and memberships** — the Agency / Notary office / Law firm / etc. entities Individuals join.
- **The module framework** — how service modules plug into the platform.
- **Platform-architecture decisions** that need to live somewhere: Mobile (React Native + Expo), Zoho integration as the canonical CRM downstream.

**Other platform primitives are referenced briefly here and specced in dedicated sibling PRDs** — see *Sibling PRDs* below.

**Service modules ship under their own PRDs and are out of scope for this document.** The eight V1 launch modules are:

| # | Module | Has its own PRD |
|---|--------|-----------------|
| (a) | Power of Attorney (POA) | Yes — separate PRD |
| (b) | Golden Visa | Yes — separate PRD |
| (c) | Legal | Yes — separate PRD |
| (d) | Shipping | Yes — separate PRD |
| (e) | FX | Yes — separate PRD |
| (f) | Off-plan | Yes — separate PRD |
| (g) | Tenancy | Yes — separate PRD |
| (h) | Conveyancing | Yes — separate PRD |

Module 0 is the **backbone these eight plug into**, and the same plug-in contract is what future Module 9, Module 10, … will use without forking the platform.

## Sibling PRDs (referenced, not specced here)

This PRD intentionally stops short of the following platform primitives. They exist on the platform — this document mentions them briefly so the overall picture stays whole — but the actual requirements, flows, and edge cases live in their own PRDs:

| Sibling PRD | Covers | Why split out |
|---|---|---|
| **Wallet & Finance PRD** | Payments, wallets (Individual + Business), commission and payout rules, ledger and bookkeeping, cash-out request lifecycle, IBAN, Finance hand-off via Zoho | Money is its own domain; the rules and edge cases deserve focused treatment with Finance as a co-author. |
| **Messaging & Notification PRD** | Notification channels (in-app, email, SMS, push), trigger taxonomy, per-user preferences, in-app messaging if/when it lands | Messaging is cross-cutting; treating it as a domain keeps Module 0 from accidentally becoming a CMS for triggers. |
| **Cases PRD** | The full case data model, global / sub-status state machine details, attribution rules, audit format, partner assignment semantics | Cases are the core unit of work — substantial enough to need their own document. |
| **SLAs PRD** | SLA timer mechanics, pause/resume rules, breach-handling, escalation policies, per-Business overrides | SLA semantics get fiddly fast; better isolated. |

This PRD owns identity, roles, Businesses, and the module framework. Anything else, look there first.

---

## Problem Statement

Real estate agents in Dubai juggle eight distinct service workflows for clients — POAs, Golden Visa applications, legal consultations, shipping, FX, off-plan purchases, tenancy paperwork, conveyancing — across email, WhatsApp, paper documents, and disconnected partner systems. The naive fix would be to build eight standalone tools, but that just moves the fragmentation onto the agent in a different shape: eight logins, eight inboxes, eight payment flows, eight reporting silos.

Contract Hubs takes a different bet: build a **single platform backbone (Module 0)** that owns identity, cases, documents, payments, wallets, SLAs, dashboards, and notifications **once**, and let each service ship as a module that plugs into that backbone. The agent works in one product. Each new module — the eight at launch and any added later — gets the platform's primitives for free and only has to spec what's truly module-specific (its workflow, its sub-statuses, its document templates, its commission rules).

## Goals

1. **Launch Module 0 as the backbone for all 8 service modules** — agents can run POA, Golden Visa, Legal, Shipping, FX, Off-plan, Tenancy, and Conveyancing cases through a single shared platform.
2. **Make modules genuinely pluggable.** Onboarding a 9th, 10th, or Nth module should cost meaningfully less than building a standalone product, because each module reuses the platform's identity, case framework, documents, payments, wallets, SLAs, dashboards, notifications, and Zoho sync via a versioned module contract.
3. **Cut average time from case creation to completion** meaningfully versus the agency's current manual process (baseline captured during pilot).
4. **Hit strong SLA compliance** per case type within the first quarter of operations.
5. **Onboard pilot agencies and partner organisations** on mobile (SMS OTP) and UAE Pass authentication — with multi-role support so a single Individual account can act as Agency Admin, Agent, Client, and Notary Operator without juggling separate logins. Email login is added later as a post-verification convenience.
6. **Every user verified before they transact** — no case creation or payment by an Unverified Individual. UAE Pass is the preferred path; passport upload with server-side OCR is the fallback. Verification status is visible on the Profile and enforced at every transaction gate (R1.7).
7. Establish Contract Hubs as the **system of record for cases**, with reliable one-way sync into Zoho CRM (cases originate in Contract Hubs).
8. **Ship native iOS and Android apps via React Native** at launch, with full feature parity to the web platform — native push, biometric unlock, distributed via App Store and Google Play.

## Non-Goals

1. **Module-specific workflow specs** — POA, Golden Visa, Legal, Shipping, FX, Off-plan, Tenancy, and Conveyancing each get **their own PRD**. This document defines only the backbone (Module 0) those modules plug into. If a workflow detail is module-specific (sub-statuses, document templates, partner type, commission rule, SLA target, page UI), it lives in that module's PRD, not here.
2. **Wallet, payments, and Finance hand-off** — see the **Wallet & Finance PRD**. This document mentions wallets only where identity / membership rules touch them (e.g., the agent clean-state gate in R1.3).
3. **Notifications and messaging** — see the **Messaging & Notification PRD**. This document doesn't enumerate triggers, channels, or preferences.
4. **Detailed case data model and state machine** — see the **Cases PRD**. This document mentions cases at the conceptual level only.
5. **SLA timer mechanics, breach handling, and overrides** — see the **SLAs PRD**. This document mentions SLAs as a primitive only.
6. **Email as a registration or login method in V1** — V1 only registers and logs in via mobile (SMS OTP) or UAE Pass. After an account is created and the mobile / UAE Pass identity is verified, the user can add an email address; email then becomes an additional login channel that delivers OTPs by email. Adding email **before** verification, or registering an account purely with an email, is explicitly out of V1.
7. **Affiliate program and open marketplace** — V1 is a closed platform for invited agencies and vetted partners; opening discovery is a separate go-to-market motion.
8. **Advanced analytics dashboards** (cohort analysis, predictive SLA risk) — V1 has operational dashboards only.
9. **Corporate clients** — V1 doesn't yet model "the Client is a Business." Companies buying or transacting on real estate as the end client are post-V1 — when added, a `Client` Business sub-type and the corresponding membership role will be introduced.
10. **Self-service Business creation** — V1 does not let users create Businesses themselves. Businesses are provisioned only by Platform Admin (R1.5). Self-service Business onboarding is post-V1.
11. **Member-initiated joining of a Business** — V1 only supports Business-initiated invites (R1.4 / F5). Public membership links, member-initiated join requests, and Business directories are explicitly out of scope. The change reflects a stakeholder decision to keep Business membership tightly controlled by the Business itself in V1.
12. **Arabic UI** — architecture is Arabic-ready (RTL, externalized strings) but V1 ships English-only.

## User Stories

> **Scope of these stories:** identity, roles, Businesses, memberships, modules. Wallet, payments, cash-out, and detailed notification stories live in the *Wallet & Finance PRD* and the *Messaging & Notification PRD* respectively.

### Multi-role user (any combination)

- As an **agency owner who is also an agent and occasionally a client**, I want one account that holds all three roles so I don't have to register and log in three separate times.
- As a **multi-role user**, I want a clear role switcher in the top navigation so I can move between agency-admin work, my own agent cases, and my personal client cases in one click.

### Agency Admin

- As an **agency admin**, I want to invite agents to my workspace by mobile number so I can onboard my team in minutes — they'll register via SMS OTP or UAE Pass and then explicitly accept the invite.
- As an **agency admin**, I want to enable or disable specific service modules for my agency — for example, turn off POA so my agents only handle Golden Visa and Tenancy — so the new-case picker shows only the modules my agency supports, without me having to police it case-by-case.
- As an **agency admin**, I want to see every case my agents own so I can monitor pipeline and intervene on stuck cases.
- As an **agency admin**, I want to revoke an agent's membership when they leave so client data stays controlled.

### Agent

- As an **agent**, I want to register with just my mobile number (or UAE Pass) so I don't need yet another password — and the only profile question I should be asked is whether I'm here as a Client or an Agent, so the platform sets up the right dashboard for me.
- As an **agent**, I want to start in **solo / freelance mode** by default so I can run my own cases without joining any agency.
- As a **new user**, I want to add the other primary role (Client if I picked Agent, or vice versa) from Settings later — one click — so I'm not locked out of either side just because I picked one at registration.
- As an **agent**, I want to receive an SMS invite from an agency and explicitly accept (or decline) it so I'm in control of whether I become a member.
- As an **agent**, I want to leave my current agency at any time so I can switch agencies or go back to solo mode without admin gatekeeping my exit — the only thing the platform should ask me to do first is clear my open cases (complete or reassign) and clear any open wallet balance (per the *Wallet & Finance PRD*), so the move is unambiguous.
- As an **agent moving between agencies**, I want the platform to refuse the transition until I'm at zero balance and zero open cases, so my earnings and unfinished work don't get stranded between two agencies.
- As an **agent**, I want to create a case for a client and pick the service type so the right module workflow kicks in — and if either I or the client hasn't verified our identity yet, I want a clear prompt to do it before the case is created, not a confusing error halfway through.
- As an **agent**, I want to invite an unverified client to verify their identity via an SMS link so I can keep my workflow moving without doing identity admin myself.
- As an **agent who already has a verified account**, I want to add my email later so I can receive login OTPs via email when SMS isn't convenient.

### Client

- As a **client**, I want to log in with my mobile number or UAE Pass so I can verify my identity once and reuse it across cases without managing yet another password — and the platform should know I'm a Client from the moment I finish registering, not later.
- As a **client without UAE Pass**, I want to verify my identity by uploading my passport — entering my name and date of birth, then uploading a passport photo — so I can transact on the platform even though I don't have UAE Pass.
- As **any verified user**, I want my verification status visible on my Profile so I know I'm cleared for transactions without trial and error.

### Partner-Business member (notary office, law firm, shipping provider, FX broker, etc.)

- As a **lawyer at Bin Saad Law Firm**, I want my admin to invite me into the firm's workspace by my mobile number so I can start picking up assigned legal cases — I authenticate with my own Individual account; the Business membership grants me the Lawyer role inside the firm.
- As the **admin of a Notary office**, I want my notary office to exist as a Business entity in the platform — provisioned by the Platform Admin team after offline verification — so cases, invoices, and the office's records are attributed to the office, not to any one person.
- As an **independent freelance partner** (e.g., a freelance translator), I want to take cases assigned to me as a Solo Individual without setting up a Business — so the platform doesn't force me to create a Business when I don't have one.

### Platform Admin

- As a **platform admin**, I want to create and manage Business entities (Agencies, Notary offices, Law firms, Shipping providers, FX brokers, …) — including suspending bad actors — so the marketplace stays healthy.
- As a **platform admin**, I want to provision a new Business by picking its sub-type, entering its trade name, license number, and jurisdiction, then assigning the first admin from an existing Individual on the platform — so onboarding a Partner organisation is a single workflow.
- As a **platform admin**, I want to enable, disable, and version individual service modules from a single management surface so I can roll a new module out (or pull one back) without touching Module 0.
- As a **platform admin**, I want to enable or disable a module for a specific Business directly from its admin view (in addition to the global toggle), so I can support an Agency that asked us to turn off POA without having to teach their admin to do it themselves.
- As a **platform admin**, I want to review users in `Pending Manual Review` state — see their submitted name / DOB, the OCR-extracted values, and the uploaded passport image — and approve or reject the verification, so we have a human-in-the-loop for the cases the automatic OCR couldn't resolve.

## Requirements

All requirements below are required for V1 launch.

### Identity, Roles & Businesses

The identity model has three layers — kept distinct on purpose.

| Layer | What it is | Examples |
|---|---|---|
| **Login (always Individual)** | Every authentication on the platform is one human, one account. There is no "Business login." | Sara (a person), Mohammad (a person). |
| **Business entity** | A non-individual entity in the platform — has a sub-type, profile, wallet, audit log, and members. Created by Platform Admin only. | `Acme Realty` (Agency), `Acme Notary LLC` (Notary office), `Bin Saad Law Firm` (Law firm). |
| **Role grant** | A capability granted to an Individual, either platform-wide or scoped to a specific Business entity. | Sara is granted `Client`, `Agent (solo)`, and `Agency Admin (Acme Realty)`. |

The rest of R1 fleshes out each layer in detail.

**R1.1 — Roles: platform-scoped, Business-scoped, and module-defined**

A user account gains capability by being granted **roles**. Roles come in two scopes:

- **Platform-scoped roles** apply to the Individual themselves, not tied to any Business. The platform defines three: `Client`, `Agent (solo)`, and `Platform Admin`.
- **Business-scoped roles** apply to the Individual *within a specific Business entity*. The platform defines two: `Agency Admin` (in an Agency Business) and `Agent` (member of an Agency Business — distinct from solo Agent). Service modules declare additional Business-scoped roles in their manifest (R3.1) — e.g., POA introduces `Notary Admin` and `Notary Operator` (in Notary office Businesses), Legal introduces `Law Firm Admin` and `Lawyer` (in Law Firm Businesses), and so on. This keeps Module 0's role surface small and lets each module define its own member roles without modifying Module 0.

A real person can hold any combination of role grants — solo Agent + Client + Agency Admin (of Acme Realty) + Notary Operator (at Acme Notary LLC), all on one account. A persistent **role switcher** in the top navigation lets them change active context in one click.

**Roles defined in Module 0 (V1):**

| Role | Scope | Source | Notes |
|---|---|---|---|
| Client | Platform | Module 0 | Anyone who buys a service. Default capability for any Individual; not formally "granted." |
| Agent (solo) | Platform | Module 0 | Freelance / solo agents. Default for an Individual who hasn't joined an Agency. |
| Agent | Business (Agency) | Module 0 | Granted via membership in an Agency (R1.4). Mutually exclusive with Agent (solo). |
| Agency Admin | Business (Agency) | Module 0 | Granted in an Agency. Manages members, sees agency-wide cases and wallet. |
| Platform Admin | Platform | Module 0 | Manages Businesses, modules, system health. Exclusive — cannot stack with any other role. |
| (Module-defined Business-scoped roles) | Business (per the module's sub-type) | Each service module manifest | E.g., POA → Notary Admin / Notary Operator; Legal → Law Firm Admin / Lawyer. See module PRDs. |

- AC: A user account can be granted one or more roles. Platform-scoped grants are recorded against the Individual; Business-scoped grants are recorded against the `(Individual, Business)` pair.
- AC: At registration, the user **picks `Client` or `Agent (solo)` as the initial role granted**. Without this pick the platform can't route the user — there is no other moment in the V1 product where this signal gets captured. Only the picked role is granted at registration; the other one can be added later from Settings (multi-role).
- AC: At any moment the user is acting in **exactly one active role context** — the platform always knows whether they're acting as Client, solo Agent, Agent of Acme Realty, Agency Admin of Acme Realty, Notary Operator at Acme Notary LLC, etc.
- AC: Switching active role context is one click and is logged.
- AC: Permissions, dashboards, data visibility, and wallet view are scoped strictly to the active role context.
- AC: Every API call carries the active role context. Cross-context access is denied.
- AC: Platform Admin role cannot be combined with any other role on the same account (security boundary).
- AC: An Individual cannot simultaneously be the Agent on a case and the Client on the same case (case-level role conflict prevented by the platform).
- AC: A user who picked `Client` at registration but later receives a Business invite for an Agent or Notary Operator role can accept it normally (R1.4). Accepting the invite grants the new Business-scoped role; the original `Client` grant is unaffected.
- AC: A user can self-grant the *other* platform-scoped role (Client ↔ Agent solo) at any time from `Settings → Roles` with one click. The opposite role is granted instantly; the role switcher updates to include both. There is no admin approval for this — it's a self-service toggle, since both Client and Agent (solo) are platform-default roles available to any Individual.

**R1.2 — Two registration paths: mobile (any country) or UAE Pass**

Every login is an Individual. Registration creates that login — there is no Business-registration path; Businesses are entities, not logins (R1.5).

Registration is deliberately limited to **two paths** and nothing else:
1. **Mobile number + SMS OTP** — any valid international mobile number is accepted (`+971…`, `+44…`, `+1…`, etc.), provided OTP can be delivered. The user enters the number, receives an SMS code, enters it, and the account is created.
2. **UAE Pass** — a one-tap path that brings a verified Emirates ID and verified mobile number into the account in a single OAuth flow. This is the higher-trust path: any module that requires Emirates ID (e.g., POA, Golden Visa) can rely on the UAE Pass payload directly.

Email is **not** a registration or login method in V1. After an account is created and the mobile number is verified, the user can optionally **add an email address to the account and use it as a login channel — receiving the OTP via email instead of (or in addition to) SMS**. This is a post-verification convenience, not a registration path; it's listed under post-V1 work in Non-Goals.

- AC: First-time registration completes in ≤ 90 seconds for either path.
- AC: **Registration is minimal — the platform does not collect any field that isn't strictly required to authenticate or to set the initial role.** The single non-auth question asked at registration is the `Client` vs `Agent (solo)` role pick (per R1.1). No name, no address, no email, no IBAN, no profile photo, no Business affiliation, no anything else. Optional profile data and capability-gated data (IBAN for cash-out, address for some modules, etc.) are only requested at the point in the user journey where the platform actually needs them — see R7.6 for IBAN at wallet activation as the canonical example.
- AC: Mobile-path registration accepts any E.164-formatted international number; numbers that fail SMS delivery are surfaced with a clear error and the user can retry.
- AC: UAE Pass path completes the OAuth flow without leaving the app and persists the Emirates ID + verified mobile from the UAE Pass payload.
- AC: Subsequent logins use the same channel the user registered with — mobile OTP or UAE Pass. A user who registered via mobile can also log in via UAE Pass later if their mobile number matches the UAE Pass record.
- AC: Sessions expire and require re-authentication every 30 days, or immediately on suspicious activity.
- AC: An email address can be added to the account **only after** the registered mobile (or UAE Pass) is verified. Once added and verified, email becomes an additional login channel that delivers OTPs by email. (Implementation: post-V1; tracked as a future-phase non-goal.)
- AC: Modules that require Emirates ID (e.g., POA, Golden Visa) can prompt non–UAE Pass users to upgrade their account by linking UAE Pass before creating such a case. The platform exposes a "link UAE Pass" flow for this; the case-level KYC requirement is the module's responsibility, not Module 0's.

**R1.3 — Solo or member-of-a-Business**

Most Business-scoped roles are mutually exclusive across Businesses — an Individual is a member of **at most one Business per role** at any moment. To change Businesses (e.g., move from one Agency to another, or switch which Notary office they work in), the Individual leaves the current one first.

For the **Agent** role specifically — which exists both platform-scoped (Solo) and Business-scoped (member of an Agency) — the Individual is in **exactly one of two states**:

- **Solo / freelance** — no Agency affiliation. The agent runs cases under their own account and keeps all commission directly.
- **Member of exactly one Agency** — affiliated with a single Agency Business. While affiliated, the agent's cases roll up into the Agency's pipeline and the Agency's commission split applies.

An Agent is never a member of two Agencies at the same time. Solo is the default; affiliating with an Agency is opt-in and requires the mutual-consent flow in R1.4.

The same one-Business-at-a-time rule extends to other Business-scoped member roles defined by service modules (e.g., Notary Operator in one Notary office at a time, Lawyer in one Law Firm at a time). Admin-style roles within a Business (`Agency Admin`, `Notary Admin`, `Law Firm Admin`, …) can in principle be held in more than one Business — a freelance Agency Admin who consults for two agencies — but this is an exception, not the default.

- AC: A new account starts in `Solo` state for any role that supports a Solo mode (today: Agent).
- AC: Membership in any Business is set only via the consent flow in R1.4.
- AC: At any moment the system knows, for each Business-scoped role, whether the Individual is Solo (where applicable) and which Business they're a member of.
- AC: Leaving a Business does not delete the Individual's historical cases — those remain attributed to the Business that owned them at completion. New cases after leaving belong to the Individual's new state.
- AC: Removing an Individual from a Business (initiated by either side, see R1.4) immediately revokes their access to that Business's cases, documents, and wallet.
- AC: **Agent transitions require a clean state.** An Agent moving between states — Solo → Agency, Agency A → Solo, or (effectively) Agency A → Agency B — is allowed only when both of these are true at the moment of the transition:
  - **Zero balance** in the affected Agent wallet — meaning balance = 0, no pending Holds, and no in-flight cash-out requests in any non-terminal state. The Agent must have either earned nothing or already cashed out cleanly.
  - **Zero open cases assigned to them as Agent** — i.e., no case where the Agent is the current assignee and the case is in any non-terminal status (anything other than `Completed` or `Cancelled`).
  
  If either condition is unmet, the platform refuses the transition and shows a clear, actionable breakdown: the offending wallet balance / pending requests, and the list of open cases. The user is given direct links to (a) submit a cash-out request for any remaining balance, and (b) complete or reassign each open case before retrying.

**R1.4 — Joining a Business: Business-initiated invite, two-way mutual agreement**

Joining a Business is **Business-initiated only**. An admin within the Business (Agency Admin for Agencies, Notary Admin for Notary offices, Law Firm Admin for Law Firms, etc.) sends an invite by mobile number; the invitee must explicitly accept. Both sides must signal consent for membership to exist — invite alone or acceptance alone is never enough — but the **invitee cannot initiate the request**: there is no public membership link, no join-request inbox, no Business directory in V1.

Either party can end the membership at any time. The leaving / removing action takes effect immediately.

- AC: The only way to create a Business membership in V1 is the Business-initiated invite path (see F5).
- AC: A Business admin enters the invitee's mobile number and the role to grant (Agent, Notary Operator, Lawyer, etc., per the Business's sub-type); the platform sends an SMS invite with a deep link. The invitee opens the link, signs in (or registers per R1.2), reviews the invite (Business name, role offered, admin name), and **explicitly accepts** to become a member.
- AC: A membership is only created after both parties have signaled consent (admin sent invite + invitee accepted). A single-sided action never creates a membership.
- AC: An invitee with one pending invite from a given Business cannot be sent a duplicate from the same Business until the first is resolved (accepted, declined, or expired).
- AC: An invite expires after 14 days if not actioned.
- AC: An invitee already affiliated with another Business in the same role cannot accept a second invite without first leaving the current Business. The platform surfaces a clear "leave first" prompt.
- AC: **For Agent invites specifically**, the platform also enforces the clean-state gate from R1.3 at the moment of acceptance — accepting an Agency invite requires the Agent's current state (Solo or another Agency) to have zero Agent-wallet balance and zero open cases. The accept CTA is disabled with a breakdown of what to clear if either condition is unmet. (Same gate fires when leaving an Agency to go Solo or to switch agencies.)
- AC: Leave / remove actions log the actor, reason (optional free text), and timestamp on both sides' audit log.

**R1.5 — Business entities (created by Platform Admin)**

A **Business** is a non-individual entity in the system: an Agency, a Notary office, a Law firm, a Shipping provider, an FX broker, and so on. Each Business has:

- A unique entity ID and a stable name.
- A **sub-type** that determines what kind of work it does. Module 0 ships the `Agency` sub-type (introduced in this PRD); each service module introduces additional sub-types via its manifest (R3.1) — POA → `Notary office`, Legal → `Law firm`, Shipping → `Shipping provider`, FX → `FX broker`, future modules → their own.
- A profile: trade / legal name, trade license number (UAE) or equivalent registration number, country / jurisdiction of registration.
- A **wallet** of its own — Business wallets exist alongside Individual wallets and follow the same lifecycle (full mechanics in the *Wallet & Finance PRD*).
- An **audit log** of every action performed on or by the Business.
- **Members** — Individuals granted Business-scoped roles within the Business via R1.4.

**Businesses are created and provisioned only by Platform Admin** — there is no self-service Business creation in V1. Why: Business identity carries trust we can't establish at self-service registration (license verification, who is authorised to act for the entity, wallet routing). Platform Admin provisions the Business after offline verification, then assigns the first admin so the right humans can act in it.

**Provisioning flow (Platform Admin):**

1. Platform Admin opens *Businesses → New Business*.
2. Admin selects a sub-type from the list of available sub-types (Module 0's Agency plus whatever the enabled modules declare).
3. Admin enters the profile: trade / legal name, trade license number (or equivalent), country / jurisdiction.
4. Admin assigns the **first admin** of the Business — an existing Individual on the platform — by mobile number. The platform sends that Individual an invite (R1.4) for the appropriate Admin role (`Agency Admin`, `Notary Admin`, `Law Firm Admin`, etc.).
5. On acceptance, the Business goes live. The first admin can then invite further members.

That's it for V1. No address, no industry classification, no logo at provisioning. Modules that need more — e.g., a Notary office that needs an office address, opening hours, or a notary license — collect those at the point they're needed, the same just-in-time pattern the platform uses everywhere else (the IBAN-at-wallet-activation rule, defined in the *Wallet & Finance PRD*, is the canonical example).

- AC: A Business has exactly one sub-type, set at creation. The sub-type cannot be changed later in V1; suspend and re-create if needed.
- AC: The set of valid sub-types comes from Module 0 plus what each enabled module declares in its manifest. Trying to create a Business with an unknown sub-type returns an error.
- AC: A Business must have at least one member with the corresponding admin role. Removing the last admin is blocked; Platform Admin must assign a new admin first or suspend the Business.
- AC: Every Business creation, profile change, and admin change is audited (Platform Admin who acted, timestamp, before/after values).
- AC: Suspending a Business immediately revokes member access to its data and freezes its wallet (no new credits, no cash-outs) but preserves the ledger and audit log.
- AC: A Business's wallet IBAN must be the Business's bank account, not a personal IBAN — full activation rules in the *Wallet & Finance PRD*.

**R1.6 — Canonical user identifier and merge semantics** *(technical decision — implementation mechanics deferred)*

> This is a design constraint to lock in early. The UI consequences are minimal; the database and audit-trail consequences are not.

In the database, the canonical user identifier is the **Emirates ID** number returned by UAE Pass. Phone numbers change — people swap SIMs, switch carriers, or update their numbers — so a phone-keyed identity model would force painful re-keying every time. Emirates ID is stable for life. Two cases:

- **A user who registers via UAE Pass:** their canonical identifier is set to the **Emirates ID** from the UAE Pass payload at account creation. No UUID is minted.
- **A user who registers via SMS only:** the platform mints an **internal UUID** as the canonical identifier (no Emirates ID is available yet). The UUID stays the canonical key for the lifetime of that account *unless* the account is later linked to UAE Pass (R1.2 AC and F7 — "Link UAE Pass").

**Merge on later UAE-Pass linking.** When an SMS-only user authenticates via UAE Pass and the verified mobile on the UAE Pass payload matches the account's registered mobile, the platform **merges** the records and adopts the Emirates ID as the canonical identifier without losing any of the user's history.

- AC: A user with an internal UUID who completes F7 successfully has their canonical identifier upgraded to the Emirates ID. All historical references — case ownership, audit-log entries, ledger entries, role grants, Business memberships — continue to resolve to the same record.
- AC: The internal UUID is retained as an **alias** of the same record (so anything previously keyed against the UUID — a Zoho-side case sync, a webhook payload, an archived audit entry — still resolves correctly). The UUID is never re-used for a different account.
- AC: A merge is only permitted when the UAE Pass mobile matches the account's mobile (the security boundary already stated in F7 step 6 — no silent identity merging across mismatched mobiles).
- AC: The merge event is auditable — a record is written with timestamp, old UUID, new canonical Emirates ID, and the trigger (F7 link action, by which Individual).
- AC: For UAE-Pass-registered accounts, no UUID is ever minted; the Emirates ID is the canonical key from account creation.
- AC: The storage and indexing strategy (foreign-key column vs. redirect table vs. another scheme) is an implementation decision and is **out of scope for this PRD**. This requirement specifies the *behaviour* the system must guarantee — the *mechanism* is designed during implementation. Engineering should write the design note as part of the merge implementation ticket.

**R1.7 — Identity verification: UAE Pass or passport (verified-before-transaction gate)**

The platform handles sensitive personal and financial workflows — POAs, Golden Visa applications, payments, legally binding documents. Before any Individual can initiate a **transaction**, they must be identity-verified.

**What counts as a transaction.** Any action that legally or financially commits the user or another party — **case creation** and **payment** are the two canonical examples for V1. Module manifests (R3.1) can declare additional transaction points (e.g., e-signature steps, money movements). Browsing, reading, and account-management actions are **not** transactions.

**Two verification paths.**

1. **UAE Pass (preferred).** Linking UAE Pass implicitly verifies the Individual — the Emirates ID and full name in the UAE Pass payload are taken as authoritative identity. Users who registered via UAE Pass are Verified from day one; SMS-registered users who later link UAE Pass (F7) become Verified at the moment of the merge (R1.6).
2. **Passport verification (fallback for users without UAE Pass).** The user enters three fields — **First name, Last name, Date of birth** — and uploads a clear photo of the passport biographical page. The platform sends the image to a server-side **OCR / image-processing service** that extracts the same three fields from the document. The platform matches user-entered vs. extracted values (with fuzzy matching tolerant of transliteration differences in names). If all three match, the Individual is Verified.

**Verification status.** Stored on the Individual profile and surfaced on the Profile screen. The status is one of:

- `Unverified` (default at account creation)
- `Verified (UAE Pass)` — Emirates ID + name vouched for by UAE Pass
- `Verified (Passport)` — passport image OCR'd and matched against user-entered fields
- `Pending Manual Review` — passport verification failed after retry threshold; Platform Admin must intervene

Status is visible to: the Individual on their Profile; Platform Admin (for compliance and audit); Business admins for members of their Business (for compliance — e.g., an Agency Admin can see which of their Agents are Verified).

**The gate.** Before any transaction, the platform calls a `requireVerified()` check on the acting Individual. If the Individual is Unverified, the calling flow is interrupted with a "Verify your identity to continue" prompt that routes them to either F7 (UAE Pass) or F8 (Passport verification). On completion, the original flow resumes from where it was interrupted. Crucially, the gate also fires when an **Agent attempts to create a case for a Client**: if the Client is Unverified, the Agent sees a prompt to invite the Client to verify first (an SMS invite link to the Client's mobile that opens F8 — or F7 if they have UAE Pass).

**ACs:**

- AC: Every Individual has a `verification_status` field, defaulting to `Unverified` at account creation.
- AC: Successfully linking UAE Pass (F7) sets status to `Verified (UAE Pass)` and timestamps the event.
- AC: Successful passport verification (F8) sets status to `Verified (Passport)` and timestamps the event. Both the user-entered fields and the OCR extraction result are stored on the audit record.
- AC: After **3 failed passport-verification attempts** by the same Individual, status moves to `Pending Manual Review`; Platform Admin is notified and can manually approve / reject by inspecting the uploaded image.
- AC: Passport images are **encrypted at rest** and stored only as long as needed for verification and audit. Access is restricted to: the user themselves, the OCR service (via a short-lived signed URL), and Platform Admin.
- AC: The Profile screen always shows the Individual's verification status with the method ("Verified via UAE Pass" or "Verified via Passport"). For `Pending Manual Review`, the user sees "Your identity is under review — we'll notify you when it's resolved."
- AC: The platform exposes a `requireVerified(individual_id)` check used by modules at every transaction boundary. The check is a simple boolean for Module 0 — modules can layer stricter requirements via the manifest (see below).
- AC: An Unverified Individual **cannot**:
  - Create a case in any module.
  - Make a payment.
  - Be attached as the Client of a new case (Agent attempting to add an Unverified Client sees a `Invite this client to verify` prompt that sends them an SMS link).
- AC: A Verified Individual stays Verified for the life of their account unless Platform Admin manually unverifies them (e.g., suspected document fraud). Manual unverification triggers a notification to the Individual and is auditable.
- AC: Module manifests (R3.1) can declare per-module verification thresholds — e.g., POA may require `Verified (UAE Pass)` specifically because the document is government-issued and needs Emirates ID; Tenancy may accept either path. Module 0 enforces the *base* gate (any Verified status); modules layer stricter checks on top.
- AC: The verification flow is idempotent — verifying an already-Verified user is a no-op.

### Cases — the core unit of work *(brief — full spec in the Cases PRD)*

A **case** is the unit of work on the platform — every service request creates exactly one case, regardless of module. From Module 0's perspective, the things that matter are:

- **Cases originate in Contract Hubs** (not in Zoho — Zoho is downstream, see R7).
- **Hybrid status model.** Every case has a **global status** owned by the platform (Open, In Progress, Awaiting Client, Awaiting Partner, Completed, Cancelled) and a **module-specific sub-status** declared by the module that owns the case (e.g., "Notary review" for POA, "Eligibility check" for Golden Visa).
- **Single-partner assignment** at a time, with the valid partner types per case declared by the module.
- **Case ownership** is what the multi-role / membership rules in R1 reference (e.g., the agent clean-state gate in R1.3 is defined as "zero open cases assigned to me as Agent").

The **Cases PRD** owns the full data model, the state-machine details, attribution rules across membership transitions, audit format, and partner-assignment semantics. Anything beyond the bulleted summary above lives there.

### Module Framework — how service modules plug into the platform

The platform owns identity, cases, documents, payments, wallets, SLAs, dashboards, notifications, and Zoho sync **once**. Each service module reuses those primitives and only declares what is genuinely module-specific. The framework below is the contract every module — POA, Golden Visa, Legal, Shipping, FX, Off-plan, Tenancy, Conveyancing, and any future module — implements.

**R3.1 — Module manifest**
Every module is registered in the platform via a manifest containing, at minimum:
- A stable module key (e.g., `poa`, `golden_visa`, `tenancy`).
- Display name and short description.
- **Business sub-types** the module introduces (consumed by R1.5) — e.g., POA introduces `Notary office`, Legal introduces `Law firm`, Shipping introduces `Shipping provider`. Sub-types are scoped to the module that declared them.
- **Business-scoped roles** the module declares for each of its sub-types (consumed by R1.1) — e.g., POA declares `Notary Admin` and `Notary Operator` for the `Notary office` sub-type. The manifest specifies, per role: whether it's an admin role and any role-specific permissions.
- The set of valid case sub-statuses (consumed by R2 — Cases).
- Required-document checklist per sub-status (consumed by R5 — Documents).
- SLA defaults per sub-status (consumed by R4 — SLAs; full mechanics in the *SLAs PRD*).
- Commission and payout rules per role per case-completion event (consumed by the *Wallet & Finance PRD*). Rules can route money to Individual wallets, Business wallets, or split across both.
- Pricing rules / fee schedule per case (consumed by the *Wallet & Finance PRD*).
- Notification triggers it emits beyond the platform's defaults (consumed by the *Messaging & Notification PRD*).
- Zoho sync mapping — how this module's case fields map into Zoho (consumed by R7 — Zoho Integration).
- **Verification requirements** the module layers on top of R1.7's base gate — e.g., `requires: Verified (UAE Pass)` for POA (since the issued document is government-bound and needs the Emirates ID), `requires: any Verified` for Tenancy. The platform enforces the manifest's requirement at every transaction boundary in the module's workflow.
- AC: Modules are registered through configuration, not by editing platform code. Platform Admin can enable/disable a module per environment.
- AC: Manifest changes are versioned and audited.

**R3.2 — Module workflow contract**
Every module declares its workflow as a state machine over the platform's global statuses + the module's sub-statuses. The platform runs the state machine; the module supplies the transitions, guards, and side effects.
- AC: Modules cannot bypass the platform's case lifecycle, audit log, or RBAC.
- AC: Side effects (e.g., "credit Notary office Business wallet on completion" — wallet semantics live in the *Wallet & Finance PRD*) are declared in the manifest, not embedded in custom code paths the platform can't see.

**R3.3 — Module-scoped UI mounts**
Each module supplies the UI fragments rendered inside the platform's case detail view (e.g., POA's notary booking widget, Shipping's Aramex tracking panel). The platform owns navigation, page chrome, role context, and the global case header.
- AC: Module UI receives the platform's design system tokens; modules cannot inject arbitrary CSS or break the platform shell.
- AC: A module's UI is loaded only on its own case types; users never see another module's UI.

**R3.4 — Module-scoped APIs and data isolation**
A module's data (its sub-status events, custom fields, partner integrations) is namespaced under its module key. One module cannot read or write another module's data.
- AC: Cross-module reads happen only through the platform's stable case API.
- AC: Module API access is audited at the boundary.

**R3.5 — Adding a new module after launch**
The 9th and 10th and Nth modules ship by writing a manifest, a workflow, and UI fragments — without modifying Module 0 source. Common platform changes (new role, new payment provider, new SLA semantics) remain Module 0's responsibility and benefit every module at once.
- AC: A "hello-world" module can be registered, render in dashboards, and complete a case lifecycle without any change to Module 0's deploy artifact.
- AC: Module versioning is independent — a module update can ship without redeploying the platform.

**R3.6 — Per-Business module activation (two-level enable / disable)**

Modules can be enabled or disabled at two levels, and the user's effective module list is the **intersection** of both:

- **Platform-wide (Platform Admin):** the existing per-environment toggle from R3.1. When a module is globally disabled it disappears for everyone, regardless of any per-Business override.
- **Per-Business (Business admin — Agency Admin, Notary Admin, Law Firm Admin, etc.):** a Business admin can disable any globally-enabled module *for their Business specifically*. The intent: let a Business curate what its members can use. Example — an Agency that doesn't want its agents handling POA cases disables the POA module for the Agency, and POA disappears from the new-case picker for any agent acting in that Agency's context.

**Effective module visibility for a user** = `(Platform Admin global enable) AND (active Business per-Business enable, when the user is acting in a Business context)`. Solo Individuals (Solo Agents, Clients with no Business context) are gated only by the global enable.

- AC: Platform Admin sees a global enable / disable toggle per module in *Platform → Modules*.
- AC: Each Business admin sees, in *Workspace → Modules*, the list of all globally enabled modules with a per-module toggle to disable any of them for their Business. The disabled state persists.
- AC: When a module is disabled at Business level, it disappears from the new-case picker for any member acting in that Business's context. Existing cases of that module type that pre-date the disable continue through their lifecycle to completion (no orphaning); only **new** case creation in that module is blocked.
- AC: Re-enabling a previously disabled module immediately restores the new-case picker option for members acting in that Business context.
- AC: A Business admin cannot enable a module that the Platform Admin has globally disabled — the local enable is gated by the global enable. The toggle is shown but greyed out with the reason ("Disabled platform-wide").
- AC: Every per-Business module toggle change is audited (admin who acted, before/after, timestamp).
- AC: A notification is emitted to all members of the Business when a per-Business module state changes, so they're not surprised when a new-case option appears or disappears (full notification semantics in the *Messaging & Notification PRD*).

### SLAs *(brief — full spec in the SLAs PRD)*

**R4.1 — SLA timers exist as a platform primitive**
Every case carries an SLA timer. SLA defaults come from each module's manifest (R3.1) and can be overridden per Business by Platform Admin. The timer pauses when a case is in "Awaiting Client" status and resumes on client action. SLA breach triggers escalation notifications to the relevant role contexts (notification mechanics in the *Messaging & Notification PRD*; full SLA rules in the *SLAs PRD*).

### Documents *(brief)*

**R5.1 — Documents are a platform primitive**
Cases have a documents section supporting upload, replace, version history, and download. Supported formats: PDF, JPG, PNG, DOCX, max 25 MB per file. Document templates per case type are declared in module manifests (R3.1) and used by modules to generate drafts (e.g., POA draft, Tenancy contract). All documents are encrypted at rest.

### Wallets, Payments, and Cash-out *(brief — full spec in the Wallet & Finance PRD)*

**R6.1 — Wallets and finance are out-of-scope here**
The platform supports wallets (one per Individual role context where money flows; one per Business entity), payments initiated from cases, automatic commission credits per the module's manifest, and a cash-out request lifecycle that hands off to Finance via Zoho. Module 0 references these primitives in two specific places — the agent clean-state gate (R1.3) and the module manifest's commission/pricing fields (R3.1). The full requirements, ACs, and flows live in the *Wallet & Finance PRD*.

### Dashboards *(brief)*

**R7.1 — Role-tailored dashboards as a platform primitive**
Each role context renders its own dashboard. Module 0 owns the chrome (navigation, role switcher, page header). Module 0 promises:
- Each role context has a dedicated dashboard view with role-appropriate filters (status, sub-status, date range, case type, assignee).
- Modules contribute UI fragments that render inside the case detail view (R3.3).

The exact dashboard widgets per role — and any cross-role analytics — are out of scope for Module 0 and will be detailed alongside Cases / SLAs / Wallet PRDs as they cement.

### Zoho Integration *(brief)*

**R8.1 — One-way case sync, CH → Zoho**
Cases sync from Contract Hubs to Zoho on create and on every status change. Sync failures are surfaced in the Platform Admin dashboard with retry.

**R8.2 — Contact matching**
Sync is one-way for case data in V1. Contact data may sync bidirectionally if a contact match is found.

**R8.3 — Cash-out request hand-off**
Zoho is also the channel through which cash-out requests reach Finance — the *Wallet & Finance PRD* owns this contract; this section just notes the dependency on the Zoho integration so it doesn't get lost in the move.

### Mobile

**R9.1 — Native React Native apps (Expo)**
Native iOS and Android apps built with **React Native** on the **Expo managed workflow** — chosen for faster setup, free over-the-air JS updates (push fixes without re-submitting to the stores), and EAS-managed CI/CD. Business logic is shared with the web platform via a shared TypeScript core where practical. Includes native push notifications and biometric unlock (`expo-notifications`, `expo-local-authentication`). Distributed via App Store and Google Play. Feature parity with web at launch.

> **Caveat:** if the UAE Pass SDK does not have an Expo-compatible config plugin, we wrap it as a custom native module via Expo Modules. If that proves infeasible, we eject to the Bare workflow.

## Key User Flows

These are the platform-critical, end-to-end flows that drive Module 0 wireframes — focused on identity, roles, Business membership, and identity verification. Module-specific flows (POA notary booking, Golden Visa eligibility check, etc.) live in their respective module PRDs. **Wallet activation and cash-out flows live in the *Wallet & Finance PRD*; notification flows live in the *Messaging & Notification PRD*.** Each flow lists trigger, actors, pre-conditions, the happy path step-by-step, branches, edge cases, and the post-condition. Flow IDs (F1–F8) are stable references for design and engineering.

### F1 — Registration

**Trigger:** A user without an account opens the app or follows an SMS invite link.
**Actors:** New user.
**Pre-conditions:** No existing account on this device for this identity.
**Success outcome:** Individual account exists with the picked initial role granted; user is logged in and lands on the matching dashboard.

**Happy path:**

1. **Welcome screen.** Two primary CTAs: `Continue with mobile number` and `Continue with UAE Pass`. Footer link: `Have an account? Log in.`
2. User picks a path:
   - Mobile path → step 3.
   - UAE Pass path → step 6.
3. **Mobile entry screen.** International country-code picker (default `+971`), phone-number input, CTA `Send code`.
4. System sends SMS OTP. **OTP entry screen** shows the masked number, a 6-digit input, `Resend code` (disabled for 30s), and `Back`.
5. User enters correct OTP. System verifies and marks the mobile as verified → step 8.
6. **UAE Pass OAuth handoff.** In-app browser (or native handoff per R11.1) opens UAE Pass; user authenticates inside UAE Pass.
7. UAE Pass returns Emirates ID, verified mobile, full name. Platform persists → step 8.
8. **Role selection screen.** Single question, two choice cards (per R1.1 — this is the platform's only chance to capture the user's primary role):
   - `Client` — *I'm here to use real estate services* (POA, Golden Visa, legal consultations, shipping, FX, off-plan, tenancy, conveyancing). Person illustration.
   - `Agent` — *I'm a real estate agent who manages client cases.* Briefcase / contract illustration.
   A small footnote reassures multi-role users: *"You can add the other role later from Settings."* CTA `Continue`.
9. User picks one card and taps `Continue`. The picked role is granted; the account is created → dashboard for that role.

**Branches and edge cases:**

- **SMS undelivered:** banner "Couldn't deliver code." with `Retry` and `Try UAE Pass` CTAs.
- **OTP expired (5 min):** input grays out; show `Get a new code`.
- **Wrong OTP entered 5 times:** mobile locked for 10 minutes with countdown; suggest UAE Pass.
- **UAE Pass auth cancelled:** return to Welcome screen.
- **Registration was triggered by an SMS Business-invite link (F5):** the role selection step is skipped — the role is implied by the invite (e.g., the Agency invited them as `Agent`, the Notary office invited them as `Notary Operator`). The picked role is the invited role; the user lands on the invite-review screen (F5 step 7) immediately after account creation. They can later add `Client` or `Agent (solo)` from Settings if they want.
- **User taps `Continue` without picking a card:** CTA stays disabled until a selection is made; small inline hint "Pick one to continue."
- **User wants both roles:** they pick the primary one now and add the other from Settings later (one-click toggle). The platform doesn't grant both at registration to keep the signal clean.

**Post-conditions:** An Individual login exists (R1.1 — every login is Individual; Businesses are entities created separately by Platform Admin per R1.5). The picked role (`Client` or `Agent (solo)`) is granted. For an Agent: state = `Solo`. User is logged in and the active role context is the role they just picked. (Wallet provisioning and activation behaviour is defined in the *Wallet & Finance PRD*.)

### F2 — Login

**Trigger:** Returning user opens the app and is not in an active session.
**Actors:** Returning user.
**Pre-conditions:** Account already exists, mobile verified.
**Success outcome:** Active session; user lands on the dashboard for their last-used role.

**Happy path:**

1. **Welcome screen.** Two CTAs: `Log in with mobile` and `Log in with UAE Pass`. *(Post-V1: a third option `Log in with email` appears for users who have added and verified an email — see F3.)*
2. Mobile path:
   1. **Mobile entry** — country code + phone, CTA `Send code`.
   2. **OTP entry** — same as F1 step 4.
   3. On success → dashboard for last-used role.
3. UAE Pass path:
   1. UAE Pass OAuth handoff.
   2. Platform matches the returned Emirates ID / verified mobile to an existing account.
   3. On success → dashboard.

**Branches and edge cases:**

- **Mobile not recognized:** show "We don't see an account for this number. Create one?" with `Continue to register` (jumps to F1 step 3 with the number pre-filled) and `Try a different number`.
- **UAE Pass identity not matched to an existing account:** offer `Create an account with UAE Pass` (jumps to F1 step 9) or `Try a different login`.
- **Suspicious activity (per R1.2):** force re-authentication and show a security prompt; lock the account on repeated failures.
- **Session expired (30 days, R1.2):** silently route to step 1 with the last-used login channel pre-selected.

**Post-conditions:** Active session bound to one role context (the last-used role).

### F3 — Add email after verification (post-V1, gated by Non-Goal #2)

**Trigger:** A logged-in user opens *Settings → Login methods* and chooses "Add email."
**Actors:** Verified user.
**Pre-conditions:** Mobile or UAE Pass identity is verified; no email currently linked.
**Success outcome:** Email linked to the account and usable as an additional login channel.

**Happy path:**

1. **Settings → Login methods → Add email.** Fields: email address, CTA `Send verification code`.
2. Platform sends a one-time code by email. **Email-OTP entry** screen.
3. User enters the code → email is marked verified and added to the account.
4. Settings now shows email as an additional channel; toggle `Use email for login` defaults to on.

**Branches and edge cases:**

- **Email already linked to another account:** error inline, "This email is in use. Use a different email or contact support."
- **Email-OTP expired (10 min):** show `Resend`.
- **User wants to remove email later:** Settings has a `Remove email` option that confirms with mobile-OTP (or UAE Pass) before removing — never with the email itself, to prevent lock-out.

**Post-conditions:** Email is a recognized login channel; F2 step 1 now shows three CTAs.

### F4 — Role switching mid-session

**Trigger:** A logged-in multi-role user clicks the role switcher in the top navigation.
**Actors:** Multi-role user.
**Pre-conditions:** The account has been granted ≥ 2 roles.
**Success outcome:** Active role context changes; dashboard, wallet view, and permissions all reflect the new role.

**Happy path:**

1. User clicks the role switcher chip in the top nav (shows current role, e.g., `Agent — solo`).
2. **Role menu opens** with all granted roles, current role marked. Each entry shows the role name and the Business context where applicable (`Agency Admin — Acme Realty`, `Notary Operator — Acme Notary LLC`, `Agent — solo`, `Client — personal`).
3. User picks a different role.
4. Page does a partial refresh: dashboard data, wallet view, navigation links, and any in-progress drafts swap to the new role's context. URL updates to the new role's home if the current page isn't valid in that role.
5. An audit-log entry is written (per R1.1).

**Branches and edge cases:**

- **Pending draft in current role:** prompt `You have an unsaved draft. Save before switching?` with `Save & switch`, `Discard`, `Cancel`.
- **Current page doesn't exist in the target role** (e.g., agency-admin-only page when switching to Client): redirect to the target role's dashboard with a small toast.
- **Only one role:** the switcher chip is non-interactive (no menu).

**Post-conditions:** Active role context = the chosen role. All subsequent API calls carry that context.

### F5 — Business invite (Business-initiated membership)

**Trigger:** A Business admin (Agency Admin, Notary Admin, Law Firm Admin, etc.) opens *Workspace → Members → Invite member*.
**Actors:** Business admin (initiator), Invitee (recipient).
**Pre-conditions:** Business admin is signed in to the Business workspace they administer.
**Success outcome:** Invitee is a member of the Business with the granted role; both audit logs reflect the membership.

**Happy path (admin side):**

1. Admin enters the invitee's mobile number, picks the **role to grant** (constrained by the Business's sub-type — e.g., an Agency admin can grant `Agent`; a Notary office admin can grant `Notary Operator`), and (optional) note. CTA `Send invite`.
2. Confirmation: "Invite sent to `+971…`. Expires in 14 days."
3. Pending invite appears in the workspace's *Members → Pending invites* list.

**Happy path (invitee side):**

4. Invitee receives an SMS: *"Acme Realty invited you to join as Agent on Contract Hubs. Open: <link>"*
5. Invitee taps the link.
   - Already-logged-in → step 7.
   - Not signed in / no account → routed through F1 (registration) or F2 (login), then back to step 7.
6. (See above.)
7. **Invite review screen.** Shows Business name, logo, admin name, role offered, optional note, and a clear summary of what membership means (per R1.3). Two CTAs: `Accept invitation`, `Decline`.
8. Invitee picks `Accept` → membership is created. The role grant is recorded against `(individual_id, business_id, role)`. Notifications fire to both sides (channels and triggers defined in the *Messaging & Notification PRD*).

**Branches and edge cases:**

- **Invitee already in another Business in the same role** (e.g., already an Agent at another Agency): review screen replaces `Accept` with a `Leave current Business to accept` flow that requires explicit confirmation; or `Decline` to keep current membership.
- **Invitee is an Agent and fails the clean-state gate** (R1.3 / R1.4): the `Accept` CTA is disabled and the screen shows a breakdown — current Agent-wallet balance and pending cash-out requests, plus the list of open cases assigned to them. Each item has a direct link: a cash-out CTA for the balance (the cash-out flow lives in the *Wallet & Finance PRD*), and a "Complete or reassign" link for each open case. Once both checks read zero, `Accept` re-enables. This branch fires whether the Agent is currently Solo or in another Agency.
- **Decline:** invite marked Declined, admin notified. No membership created.
- **Invite expires (14 days):** SMS link shows "This invite has expired. Ask Acme Realty to send a new one." Admin's pending list moves it to Expired.
- **Admin cancels invite before action:** SMS link shows "This invite has been cancelled."
- **Duplicate invite from same Business to a pending invitee:** admin sees error; the existing invite must resolve first.

**Post-conditions:** Membership `(individual ↔ business, role)` exists. The Individual's role switcher now includes the new context. Audit log entries on both sides.

### F6 — Leaving / removing a Business membership

**Trigger:** Either party initiates: member leaves, or Business admin removes.
**Actors:** Member or Business admin.
**Pre-conditions:** An active membership exists.
**Success outcome:** Membership ended; the Individual loses that role context.

**Happy path — member leaves:**

1. Member opens *Profile → Business memberships → Leave Acme Realty*.
2. **Pre-flight check (Agents only — R1.3 clean-state gate):** the platform inspects the Agent's wallet balance and open-case list. If both are zero, proceed to step 3. If either is non-zero, the screen shows the breakdown (balance + pending cash-out requests, list of open cases) with `Submit cash-out` (cash-out flow defined in the *Wallet & Finance PRD*) and `Complete / reassign case` shortcuts; the `Confirm leave` CTA is disabled until both read zero. (Non-Agent member roles — Notary Operator, Lawyer, etc. — don't have this gate in V1; they can leave at any time, and case attribution falls to the module's rules.)
3. Confirmation modal: "Leaving will end your membership. Cases you owned were completed and stay attributed to Acme Realty; new cases after this point are yours alone (or under your next Business)." Optional reason. CTA `Confirm leave`.
4. Membership ends immediately. The role context disappears from the role switcher. Notifications to both sides.

**Happy path — admin removes:**

1. Admin opens *Workspace → Members → [Member] → Remove from Business*.
2. Confirmation modal with a similar warning about case attribution. Optional reason (private to admin, not shown to member). CTA `Confirm remove`.
3. Affiliation ends immediately; the member's access to workspace cases is revoked at the same instant.
   - Note: the clean-state gate from R1.3 applies to **Agent-initiated transitions** (Agent leaving, accepting another invite). Admin-initiated removal is **not** gated — an Agency Admin can remove an Agent at any time, regardless of balance or open cases. The platform handles the residue per the rules below.

**Branches and edge cases:**

- **Admin removes an Agent who still has open cases:** cases stay attributed to the Agency for completion; the Agency Admin reassigns them to another Agent or absorbs them. Ownership and SLAs follow the case-level rules from the relevant module PRD.
- **Admin removes an Agent who still has wallet balance:** the Agent's personal Agent wallet retains its balance and remains operable for cash-out. Subsequent commission credits from the now-completed Agency cases land in the Agency's wallet, not the removed Agent's. (Detailed credit-attribution on partial work is module-PRD territory.)
- **Re-joining the same Business later:** must go through F5 again; no fast-path.

**Post-conditions:** Affiliation = ended (timestamped). Both audit logs updated. Agent state = `Solo`.

### F7 — Linking UAE Pass to upgrade an existing mobile-registered account

**Trigger:** A mobile-registered user attempts an action a module gates behind UAE Pass / Emirates ID — typically starting a POA, Golden Visa, or Conveyancing case (per R1.2 AC).
**Actors:** Existing user.
**Pre-conditions:** User is logged in. Account currently has only mobile identity (no UAE Pass). The module they're entering requires UAE Pass.
**Success outcome:** UAE Pass is linked to the existing account; user can proceed with the gated action.

**Happy path:**

1. User clicks `Start a POA case` (or equivalent action).
2. **Linking prompt screen.** Headline: "This service requires UAE Pass." Body: explains why (Emirates ID is needed for the document being issued by the government). Two CTAs: `Link UAE Pass`, `Cancel`.
3. User taps `Link UAE Pass` → UAE Pass OAuth handoff (same as F1 step 8).
4. UAE Pass returns Emirates ID + verified mobile + name.
5. Platform compares the UAE Pass mobile to the account's registered mobile.
6. Branch on match:
   - **Match:** UAE Pass is linked to the account; Emirates ID and verified name are persisted. **Behind the scenes, the platform performs the canonical-identifier merge per R1.6** — the Emirates ID becomes the canonical key going forward, the original internal UUID is retained as an alias, and all history (cases, audit log, role grants, memberships) continues to resolve. **The Individual's verification status (R1.7) is set to `Verified (UAE Pass)` as a side-effect.** The user is returned to step 1's action and proceeds — no UI surface for the merge itself.
   - **No match:** show conflict screen — "The UAE Pass mobile doesn't match your account's mobile. To use this UAE Pass, log out and sign in with it instead." CTAs `Log out and sign in with UAE Pass`, `Cancel`. Linking is not allowed when the mobiles don't match (security boundary; we don't merge identities silently).

**Branches and edge cases:**

- **UAE Pass auth cancelled:** return to step 2.
- **UAE Pass tied to another existing CH account:** "This UAE Pass is already linked to another account on Contract Hubs. Contact support to merge." Auto-merge is post-V1.
- **User completes linking but doesn't actually need to proceed with the gated action:** linking is permanent regardless; UAE Pass stays linked.

**Post-conditions:** Account now has both mobile and UAE Pass identities. The account's Emirates ID and verified name are populated. **Verification status (R1.7) is now `Verified (UAE Pass)`.** Modules that require Emirates ID will no longer prompt for the link.

### F8 — Passport verification (for users without UAE Pass)

**Trigger:** An Unverified Individual hits a transaction gate (case creation, payment, or any module-declared transaction per R1.7) and either chooses the passport path on the "Verify your identity" prompt, or opens *Profile → Verify identity → Use passport instead*.
**Actors:** The Unverified Individual.
**Pre-conditions:** Individual is logged in and has `verification_status = Unverified`. The user does not have UAE Pass (or has actively chosen this path).
**Success outcome:** `verification_status` advances to `Verified (Passport)`; the original action (if any) resumes.

**Happy path:**

1. **Verify your identity screen.** Headline: "Verify your identity to continue." Two CTAs: `Use UAE Pass` (preferred — branches to F7) and `Use passport`.
2. User picks `Use passport`.
3. **Personal details screen.** Three fields: `First name`, `Last name`, `Date of birth` (date picker). Copy: "These must match the passport you'll upload next." CTA `Continue`.
4. **Passport upload screen.** Single dropzone (or camera capture on mobile) for the **biographical page**. Helper copy explains what counts as a clear photo (well-lit, all four corners visible, no glare). CTA `Upload & verify`.
5. On submit, the image is uploaded to encrypted storage, and a job is dispatched to the OCR / image-processing service. The user sees a **processing screen** with a spinner and a brief explanation ("Reading your passport — this usually takes under 30 seconds"). The user can leave; they'll be notified when it's done.
6. The OCR service extracts `First name`, `Last name`, `Date of birth` from the document and returns them.
7. The platform runs a **match check** — exact match on date of birth, fuzzy match on names (tolerant of transliteration, common spelling variants, ordering of multiple given names).
8. On full match: `verification_status` → `Verified (Passport)`. Verification timestamp recorded. User is bounced back to the action that triggered the gate (or to Profile if entered from Settings).
9. The user receives a confirmation notification (channel and triggers in *Messaging & Notification PRD*).

**Branches and edge cases:**

- **OCR cannot extract fields** (blurry image, wrong document): show the error inline ("We couldn't read your passport — please try a clearer photo"). User can re-upload. Counts as one failed attempt.
- **OCR succeeds but fields don't match user-entered values:** show "The details you entered don't match the passport. Please review and try again." with the conflicting fields highlighted. The user can edit the entered values or upload a different image. Counts as one failed attempt.
- **3 failed attempts in total:** verification is escalated — `verification_status` → `Pending Manual Review`. Platform Admin gets a notification. The user sees: "Your verification has been escalated to our team — we'll reach out within 1 business day." Until manual approval, the user remains Unverified for transaction purposes.
- **User submits an obviously non-passport image** (selfie, screenshot, etc.): treated as an OCR-cannot-extract failure; same retry logic.
- **User abandons after upload (closes app before OCR returns):** the job continues server-side; the user is notified when verification completes (or fails). On next login they see their updated status.
- **Already-Verified user opens F8 again** (e.g., out of curiosity): idempotent no-op; show "You're already verified" and exit.

**Privacy / security:**

- The uploaded image is encrypted at rest from the moment it lands on the server.
- The OCR service receives the image via a short-lived signed URL, not direct database access.
- Access to the stored image is restricted to: the user themselves (read), the OCR service (read once), and Platform Admin (read for manual review or audit).
- Retention: the image is kept for the audit window required by the platform's compliance posture (TBD with Legal — likely 7 years for KYC purposes); see open question.

**Post-conditions:** `verification_status` is `Verified (Passport)` or `Pending Manual Review`. The user-entered and OCR-extracted field values, plus a hash/reference to the encrypted image, are stored on the verification audit record.

## Open Questions

> Wallet/finance and notification open questions live in their respective sibling PRDs.

| ID | Owner | Blocking? | Question |
|----|-------|-----------|----------|
| O1 | Legal | Yes | UAE data residency requirements — must primary data store live in UAE region? Affects cloud provider selection. |
| O2 | Engineering | No | Document storage — S3 with encryption, or a UAE-resident equivalent? Tied to O1. |
| O3 | Engineering | No | SMS OTP provider — Etisalat / Twilio / SNS — and per-message cost ceiling. Drives auth UX latency and unit economics. |
| O4 | Stakeholder + Legal | No | Corporate clients — when do we let a Business act as the Client on a case? In Dubai real estate, corporate buyers (LLCs, investment vehicles) are common. V1 keeps Client as a platform-scoped role on Individuals only; the question is whether to add a `Client` Business sub-type for V1 or hold it for the next release. |
| O5 | Engineering | No | Business profile validation — when Platform Admin creates a Business (R1.5), do we integrate with the UAE trade-license registry to verify the license number on the spot, or rely on the admin's offline verification before they hit Save? Affects how much friction sits inside the provisioning flow. |
| O6 | Engineering + Stakeholder | Yes | OCR / image-processing provider for passport verification (R1.7 / F8) — which service (e.g., AWS Textract, Google Document AI, Azure Form Recognizer, Mindee, Onfido, Veriff)? Constraints to weigh: passport-MRZ accuracy, support for non-Latin scripts, data-residency posture, per-document cost, manual-review tooling. Drives the verification UX, cost, and compliance posture. |
| O7 | Legal | Yes | Passport-image retention window for KYC — how long do we keep the encrypted passport image after verification? UAE financial-services KYC norms typically require multi-year retention; needed to set the storage budget and the deletion policy. |
| O8 | Stakeholder | No | Verification-required actions beyond case creation and payment — should signing actions, document approvals, and high-value module-specific actions also trigger the verified gate? V1 default is "case creation + payment + whatever modules declare"; this question gauges whether the default needs broadening. |

---

## What this spec deliberately leaves to follow-up specs

This PRD owns Module 0's identity layer (login, register, roles, Businesses, memberships) and the module framework. Two kinds of sibling PRDs sit alongside it:

**Cross-cutting platform PRDs (siblings to this document):**

| Sibling PRD | What it owns |
|---|---|
| **Wallet & Finance PRD** | Payments, wallets (Individual + Business), commission and payout rules, ledger / bookkeeping, cash-out lifecycle, IBAN, Finance hand-off via Zoho. |
| **Messaging & Notification PRD** | Notification channels, trigger taxonomy, per-user preferences, in-app messaging when it lands. |
| **Cases PRD** | Full case data model, state-machine details, attribution rules, audit format, partner-assignment semantics. |
| **SLAs PRD** | SLA timer mechanics, pause / resume rules, breach handling, escalation policies, per-Business overrides. |

**Service-module PRDs (eight at launch + future):**

Each of the eight V1 service modules ships under its own PRD covering its workflow, sub-statuses, document templates, partner assignment rules, pricing, commission rules, and SLA targets. All eight plug into Module 0 via the contract in **R3 — Module Framework**.

| # | Service module | Owns its own PRD |
|---|----------------|-----------------|
| (a) | **Power of Attorney (POA)** — case creation → notary review → client approval → payment → slot booking → video call → POA issued | Yes |
| (b) | **Golden Visa** — eligibility check → document upload → partner review → payment → processing → completion | Yes |
| (c) | **Legal** — request submission → law firm selection → consultation booking → payment → consultation → summary | Yes |
| (d) | **Shipping** — Aramex API integration, shipment creation and tracking | Yes |
| (e) | **FX** — white-label foreign exchange flow | Yes |
| (f) | **Off-plan** — off-plan project browsing and purchase application | Yes |
| (g) | **Tenancy** — tenancy contract generation and execution | Yes |
| (h) | **Conveyancing** — property transfer workflow | Yes |

Future modules (the 9th, 10th, …) are added to the platform purely by writing a manifest, a workflow, and UI fragments per **R3.5** — without modifying Module 0's source.

Wireframes for the **platform shell** — login, registration, role-pick, role switcher, Business workspace, case detail view chrome (with module UI mount points), dashboards per role — are the natural next deliverable once this spec is approved.
