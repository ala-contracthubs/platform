# Contract Hubs — Power of Attorney (POA) Module — V1 PRD

**Status:** Draft v0.11 (stakeholder revisions: non-residents in scope; companies as parties; bilingual drafts + English-translation add-on; same-business-day SLA; Client dashboard; video session is partner-hosted; no-show Operator-categorised; Notary Admin owns Slot availability; multiple Attorneys with Authority Mode; **multiple Principals / co-owners with Principal Authority Mode — each Principal reviews the Draft and signs in the Video Session personally, non-delegable to the Agent or to any other Principal; payment remains delegable to the originating party**; Agent is near-full proxy except for the Principal-Only Actions; **same-day bookings are platform auto-assigned (earliest slot ≥ prep buffer) behind a 4 PM office cutoff, future days are self-select; Passport-Based Notarisation Add-on charged per passport-using Principal — mandatory for non-residents, opt-in for residents who decline their Emirates ID**)
**Owner:** Product (Ala)
**Target launch:** 2026-10-03 (aligned with Module 0)

**Scope of this PRD:** the POA Module — the first service Module to plug into Module 0. It declares its Module Manifest (Fee Model, Business sub-type, roles, sub-statuses, document templates, SLAs, verification requirements, notification triggers), its workflow from Case creation through Final POA issuance, the Notary office Partner side, and the partner-hosted video-session relay (ADR-0004). Everything Module 0 already owns — identity, role context, the Case lifecycle scaffolding, payments, Wallet postings, the case thread, the Notification Center, the SLA timer, the Zoho one-way sync — is referenced, not re-specified.

**Sibling PRDs:** Module 0 (identity, roles, Business sub-types, module framework), Wallet & Finance (Fixed Fee Model postings, Top-up, refunds, Client Wallet credits), Messaging & Notification (Notification Center, case threads, declarative triggers), Cases (full Case data model and state-machine details), SLAs (timer mechanics, breach handling, per-Business overrides).

**Architectural decisions:** See `docs/adr/0004-poa-video-stack-microsoft-teams.md` for the trade-off behind Microsoft Teams as the video stack instead of an embedded SDK.

---

## Changelog

### v0.11 — 2026-06-10 (implementation-review fixes)

1. **Notary rejection split into pre- and post-payment windows (P1.18, P1.4 T2, Manifest, Platform Admin story).** Previous draft only allowed rejection at #6 — before any payment exists — yet specified a full refund. Rejection is now allowed from #6/#9 (pre-payment, no refund path runs) and #12–#14 (post-payment, full refund). The refund list now also includes the Passport-Based Notarisation Add-on, previously omitted.
2. **Translation Add-on intent moved to the Details form (#2); post-payment reassignment removed (P1.6, P1.7, P1.11, P1.12, P1.21, PF4).** Previous draft reassigned the Case to a translation-capable office *after* payment, after the Partner Share had already posted to the original office's Wallet, with no reversal mechanism, and with undefined Acting-Operator handoff. Intent is now captured before assignment so the translation-capable filter applies at first assignment; at payment the Add-on can be switched off freely but on only if the assigned office is capable. `poa.case_reassigned_for_translation` trigger removed.
3. **`Mark Missed Appointment` available from #12, not only #13; late-reschedule mechanics defined (P1.14, P1.17).** Previous draft required the Operator to `Start session` (entering #13) before a no-show could be recorded. Within-cutoff reschedules now immediately free the Slot and return the Case to #11 with a `late_reschedule_pending_categorisation` marker; the Operator categorises within 48h (default: excused). Category wordings generalised to cover late reschedules.
4. **New terminal T5 `Cancelled — expired` and post-payment stall escalation (P1.4, P1.21, P1.22, PF4).** Previous draft's only sweeper (T1) covered `Open` (#1–#2), leaving Cases stalled at #3/#7/#8/#10/#11/#12 with no terminal path — while PF4 incorrectly claimed the sweeper applied at #10. T5 now auto-cancels 14-day-idle pre-payment `Awaiting Client` states (#3, #7, #8, #10); post-payment states (#11, #12) escalate to Platform Admin via `poa.stalled_case_escalation` instead of auto-cancelling. Drop-off metric redefined over all terminals (T1–T5).
5. **P1.8 advancement condition fixed.** Previous draft required documents to be `Approved` before leaving #3 — circular, since Operator review only happens at #5–#6, which the Case can't reach without leaving #3. Advancement now gates on upload only; `review_status` enum cleaned (`pending_review` / `approved` / `needs_revision`) and is Operator-owned during #5–#6.
6. **Post-revision re-entry corrected to #6 (P1.8).** Re-upload after a `needs_revision` flag previously returned the Case to #5 — the self-assign queue — even though the Case already carries an immutable Acting Operator. It now returns to #6 with the Acting Operator retained.
7. **24-hour delayed-visibility window replaced with explicit recall (P1.10).** Previous draft had the Notary Admin able to "override the readiness flag for a 24-hour window" — contradicting the immediate #6 → #8 transition and the notification firing on #8 entry. Marking ready now advances immediately; the Notary Admin can instead recall the Case #8 → #6 (with reason) while no Principal has yet approved.
8. **Sub-status #9 exit transitions defined (P1.10).** Previously unspecified. #9 behaves as #6 with comments attached: re-mark ready → #8, flag docs → #7, or reject → T2.
9. **Stale Microsoft Teams references removed (Scope, P1.4 #13).** "Teams session live" and "the Microsoft Teams video integration" were leftovers from the pre-ADR-0004 draft; replaced with partner-hosted language.
10. **Same-day prep buffer raised to 3h and required to strictly exceed the 2h escalation threshold (P1.1, P1.13).** At buffer = escalation = 2h, the `poa.video_link_missing_escalation` could fire at the booking moment on an empty-by-design link field. Past-scheduled `poa.video_link_required` re-fires are now also skipped for same-day bookings.
11. **Non-resident payment backstop no longer a dead end (P1.12).** The server-side check previously directed the user "back to the Principal form" — immutable after #4. It now auto-corrects the mandatory flag, audit-logs the correction, and re-presents the corrected total before charging.
12. **PF2 placeholder model reconciled (Agent user story, PF2).** The user story claimed an unverified Client's Case "sits in `Open`"; PF2 correctly creates no Case until verification. Story updated to the placeholder model; the Agent's Top-up is stored on the placeholder and bound to the Case at creation.
13. **Reschedule cutoff unit fixed to clock hours (P1.17).** "4 business hours" contradicted the Manifest's `reschedule_cutoff_hours: 4`; clock hours now explicit (a 09:00 Slot's cutoff is 05:00).
14. **Notification recipient/channel mismatches fixed (P1.17, P1.21).** Dispute outcomes now reference the Client-facing triggers (`poa.unexcused_no_show_case_terminated` / `poa.unexcused_no_show_overturned_case_revived`) rather than the Notary-Admin-only `poa.no_show_dispute_resolved` meta-trigger; `poa.case_started` gains an `sms` channel for the Agent-initiated flow PF2.

**Structural additions (developer clarity):**

15. **Canonical snake_case Sub-status keys (P1.1, P1.4).** Every Sub-status and terminal now has a stable key; the `#` numbers are demoted to display ordering only. Code, APIs, the Manifest, and Appendix A reference keys — the `#4a` insertion showed ordinals are brittle.
16. **Appendix A — normative state-transition table.** Every legal transition with event, actor, guard, target, and side effects, in one place. This *is* the declared state machine P1.4's server-side validation enforces; unlisted transitions are illegal (400). Previously transitions were scattered as prose across P1.8–P1.18.
17. **Appendix B — consolidated Case data model.** Every Case field with type, owner, and mutability window (Case-level, `principals[i]`, `attorneys[i]`, `documents[i]`). Previously fields were introduced inline across nine sections with mutability rules scattered alongside.

---

## Problem Statement

A Power of Attorney is one of the most common — and most painful — documents in UAE real-estate transactions. An owner abroad needs an Attorney in Dubai to sign transfer paperwork; a corporate vehicle needs to delegate authority to a local representative; a resident needs to grant a family member powers to manage finances. Today this is a multi-week WhatsApp loop between the Agent, the Client, and an off-platform notary partner: documents emailed back and forth, drafts redrafted on Word, payment haggled at the end, an appointment booked verbally, and a notary visit organised through whatever Telegram thread the partner happens to keep. Nobody knows the price up front. Nobody knows the status. Nobody knows where their passport scan went.

The POA Module replaces that loop with a structured workflow inside Contract Hubs. Agent or Client starts a Case, indicates whether the Principal is themselves or a Company, fills two short forms, uploads a small checklist of documents, gets a populated bilingual (Arabic + English) Draft within seconds, has it reviewed and edited by a Partner Notary office, approves it, pays one bundled price (plus an optional English-translation add-on for the Final POA), books a slot from the office's published capacity, joins a **video session hosted on whatever notarial video system the assigned Notary office uses** (the platform relays the Operator-provided join link — see ADR-0004), and downloads the Final POA in Arabic (and English if requested) — same business day. The platform handles every notification, every state change, every payment posting, and the Zoho sync — none of it is the Module's job because Module 0 already owns those primitives.

POA is also the proving ground for Module 0's plug-in promise. If POA can ship by writing a Manifest plus this PRD's workflow and UI fragments, without modifying Module 0, the other seven V1 Modules can follow the same recipe.

## Goals

1. **Launch POA as the first end-to-end Module on top of Module 0**, exercising the Module Manifest contract (R3.1), the case lifecycle and Sub-status mechanic (Module 0 R2 / Cases PRD), the Fixed Fee Model (WF1.2), Client and Agent payments with Top-up (WF1.4–WF1.5), Notification Center triggers (MN2), case threads (MN6–MN8), and the Zoho one-way sync (R8.1).
2. **Make the price, status, and next action visible at every moment.** No back-and-forth required to know where a Case is or what it will cost — the playbook's "structured / transparent / fast / predictable" pitch is enforced by the platform shell, not by Agents' diligence.
3. **Compress the median Case to same business day.** Target: 8 business hours end-to-end (Sunday–Thursday, 09:00–18:00 UAE), aggregate timer pausing on `Awaiting Client` — a Case where the user is responsive should ship on the same business day it was created.
4. **Serve both resident and non-resident Principals, both Individual and Company Principals, and co-owners issuing a single joint POA.** The product reaches every paying segment the playbook calls out — residents with UAE Pass, non-residents with Passport verification, corporate vehicles signing through Authorised Signatories, and multiple co-owners of the same property who grant authority together on one notarised document (each verifying, approving, and signing personally).
5. **Hand Notary offices a real workspace, not a queue.** Each Notary office has its own Wallet, members, audit log, and dashboard; published Office Capacity Blocks drive the Client's booking calendar; the Notary Admin owns Operator scheduling.
6. **Use the Notary office's own video service for notarisation; relay, don't host.** POA does not create the video meeting — that responsibility sits with the Notary office, which uses whatever notarial video system its licensing authority approves (Dubai Courts, Ministry of Justice, or a private system). The platform's job is to relay the Operator-provided join link and instructions to the Client and Agent, run the state machine around the appointment, and capture the Operator's post-session attestations. Contract Hubs' *platform-level* video stack — for any future Module where the platform itself creates the meeting — is Microsoft Teams (ADR-0004), but that does not apply to POA.

## Non-Goals

1. **Express service tier and below-1,500-AED Standard tier.** V1 ships exactly one POA price point (Base Fee 1,500 AED — Platform-Admin-configurable). The "Standard / VIP / Express" pricing structure from the operator playbook is an Open Question for V1.1 (would require migrating POA from `Fixed` to `Tiered` per WF1.2 — explicitly out of V1). When tiering is introduced, the floor for `Standard` is 1,500 AED (per stakeholder direction).
2. **Translation beyond the bilingual draft and the paid English-Final-POA add-on.** V1 ships POA Drafts in Arabic + English by default (no extra charge) and an optional **English Translation Add-on** for the Final POA (paid; produced by the Notary office; English copy with stamp delivered alongside the Arabic Final POA). Languages other than Arabic and English, translation of a Case's uploaded documents, and standalone document-translation Cases outside POA are all post-V1.
3. **Bundle discount for multiple POAs.** No automated multi-Case discount in V1. The playbook's bundle-discount upsell can be achieved manually via Platform Admin posting a Client Wallet credit (WF1.11), but that is an operational workaround, not a productised feature.
4. **POA types beyond Property and General.** Vehicle POA, Company POA (as a *type* — distinct from a Property/General POA with a Company *party*), and Custom POA are post-V1. Each requires a Platform-Admin-authored bilingual template before going live.
5. **Self-service Notary office onboarding.** Notary offices are provisioned by Platform Admin via the Module 0 R1.5 path (the same way every other Business sub-type is provisioned). No self-service in V1.
6. **Notary self-service cash-out.** Partner Share lands on the Notary office's Business Wallet at Case payment (WF1.5); cash-out is Finance-reconciled off-platform per WF1.8.
7. **Recorded-meeting playback in the platform UI.** Recordings and transcripts are stored as Case documents (downloadable) but a built-in player is post-V1.
8. **A POA-Module-owned chat.** Case-scoped conversation is the Messaging PRD's `case thread` (MN6); POA inherits it. The Module does *not* ship its own chat surface.
9. **Per-Operator booking calendar.** V1 uses Office Capacity Blocks (Notary Admin publishes office-wide capacity); per-Operator calendars are post-V1.
10. **Shipping the Final POA via Aramex inside the POA Module.** Shipping is its own Module — V1 wires a "Request shipping" CTA on the Final POA Delivery screen that **creates a Shipping Case** chained to the POA Case (cross-Module link). The POA Module does not handle shipping logistics, courier integration, or shipping pricing.
11. **Companies modelled as Module 0 `Business` entities.** When Principal or Attorney is a Company in V1, the Company is captured as **data fields on the Case** (trade name, license, jurisdiction, Authorised Signatory) — *not* provisioned as a Module 0 Business. Module 0's Non-Goal #9 (corporate clients deferred) still stands at the platform level; POA implements a constrained POA-only workaround. Promoting Companies to first-class Module 0 entities is a future amendment.
12. **Arabic UI.** Mirrors Module 0 — UI chrome architecture is Arabic-ready, V1 ships English-only UI. (This is the *UI language*; the *document language* is independent — POA Drafts and Final POAs are produced in Arabic and/or English regardless of UI language.)

## User Stories

> **Scope of these stories:** the POA workflow from Case creation to Final POA delivery. Stories that touch identity, role context, Business membership, payments, Wallet, or notifications cite the sibling PRD instead of restating it.

### Client (Principal — Individual or Authorised Signatory of a Company)

- As a **Client**, I want to start a POA Case directly from the new-case picker so I don't need an Agent to do it for me — if I'm Verified by any method (UAE Pass or Passport) the form opens immediately; if I'm Unverified the platform routes me through F7 (UAE Pass) or F8 (Passport) first, per Module 0 R1.7.
- As a **resident Client**, I want my Emirates ID pre-filled from UAE Pass so I don't re-key data I've already given the platform.
- As a **non-resident Client**, I want to complete a POA Case using passport-only verification so I'm not blocked from the service just because I don't have UAE Pass.
- As a **Client acting on behalf of a Company**, I want to declare at the start of the Case that the Principal is a Company (not me personally), enter the company trade name, license number, jurisdiction, and confirm I am the Authorised Signatory — so the POA is correctly attributed and the Notary sees the company data they need to draft.
- As a **Client**, I want to grant powers to **more than one Attorney** on the same POA — and choose how they can act (jointly / severally / a mix) — so I don't have to issue separate POAs for, e.g., my brother and my lawyer when both need authority over the same property.
- As a **co-owner of a property**, I want to issue a **single POA together with the other owner(s)** — adding each co-owner as a Principal on the same Case and choosing whether we grant authority jointly or severally — so two people who own the same property don't have to run two separate POA Cases for the same transaction.
- As a **Principal who has been added to a co-owned POA Case by someone else** (the originating Principal or an Agent), I want to be invited to verify my own identity, **review the Draft from my own login, and sign in the Video Session myself** — because these are the two things the law requires me to do personally; nobody can approve or sign on my behalf.
- As the **originating Principal or Agent on a multi-Principal Case**, I want to fill the forms, upload documents, pay, and book on behalf of every Principal — but I understand that **each Principal must approve the Draft and sign in the session individually**, and the Case will not advance to payment until **all** Principals have approved.
- As a **Client**, I want a single price for the POA quoted up front (1,500 AED unless my Agent has added a Top-up), with an optional clearly-labelled **English Translation Add-on** if I want a stamped English copy of the Final POA — so there's no haggling and the upsell is honest.
- As a **Client**, I want to be told **clearly and in bold, before I pay**, that *if I don't have an Emirates ID — or I have one but don't want to use it in court — I'll be notarised by passport for an extra fee per person* — so there are no surprises: a non-resident understands the passport charge is part of their price, and a resident gets to make an informed choice between using their Emirates ID (no charge) or their passport (extra fee).
- As a **Client**, I want a checklist of exactly which documents I need to upload, generated from my POA Type, my residency status, and whether the Principal or Attorney is a Company, so I don't waste time uploading paperwork that doesn't apply.
- As a **Client**, I want my Draft POA delivered in **both Arabic and English side-by-side** so I can read what I'm signing even if my Arabic isn't strong.
- As a **Client**, I want to review the Draft POA before paying — the playbook calls this the "moment of confidence" — so I'm not paying for something I haven't seen.
- As a **Client**, I want to request changes to the Draft with comments if anything looks wrong, so I'm not stuck with the Notary's first interpretation.
- As a **Client**, I want to book a slot from the assigned Notary office's published windows, with a clear timezone, a confirmation, and a reminder before the appointment.
- As a **Client**, I want to join the Video Session from a clear button on my Case page; I want to know who the Session Operator will be before joining.
- As a **Client**, I want to download the Final POA the moment the Operator uploads it — by default in Arabic; if I opted into the English Translation Add-on, the stamped English copy appears for download too.
- As a **Client**, I want a **Client dashboard** that lists every POA Case I have on the platform, with current Sub-status, the Notary office assigned, the wall-clock since creation, and the next action expected of me — so I can manage multiple POAs without losing track (see P1.23).

### Agent (Solo or Agency)

- As an **Agent**, I want to start a POA Case on behalf of a Client by entering their mobile number; if the Client isn't on the platform or isn't verified, the platform sends them an SMS to verify (Module 0 R1.7 invite-to-verify flow) — the Case is created once they verify, and until then I see a `pending_client_verification` placeholder in my pipeline (PF2). Verification by either method (UAE Pass or Passport) unblocks creation.
- As an **Agent**, I want to act as **near-full proxy** for my Client on the Case — filling the Principal and Attorney(s) and POA Details forms, uploading all required documents, requesting Draft changes (with comments), paying for the Case using my own payment method, opting into the English Translation Add-on, booking and rescheduling Slots, disputing an unexcused no-show, and starting a new POA Case after a terminated one — without dragging my Client through every step. The Client gets to focus on the two things only they can do: **approving the Draft** and **attending the notarisation Video Session as the signer**.
- As an **Agent**, I want to add my Top-up over the Base Fee within my Agency's POA cap (or the Solo cap if I'm solo) so I capture margin on each Case, per WF1.4 and WF1.5.
- As an **Agent paying for a Case out of my own pocket** (because that's the deal I have with my Client), I want the Wallet postings to credit my Wallet for the Top-up the same way they would if the Client had paid directly — so my net cost is just the Notary's Partner Share plus the Platform margin (and any Translation Add-on), and I square up with my Client off-platform.
- As an **Agent**, I want notifications about every Client-facing action my Client is expected to take (documents requested, draft ready for approval, payment required, appointment reminders) — so I know exactly when to step in and do the work, and when to nudge my Client for the two things only they can do.
- As an **Agent**, I want to communicate with the Client and the Session Operator inside the Case thread (Messaging PRD MN6) so the conversation lives with the Case and not on WhatsApp.
- As an **Agent**, I want to see my open POA Cases in my dashboard with the current Sub-status and the wall-clock since creation, so I can chase the slow ones.

### Notary Operator (Partner-Business member of a Notary office)

- As a **Notary Operator**, I want to see the POA Cases in my office's draft-review queue and self-assign one to myself so I become the Acting Operator on it.
- As a **Notary Operator**, I want to read the Client's uploaded documents and the generated **bilingual Draft** side-by-side, with the **AI-polished version as the default** for each language and a one-click revert to the **raw template-merged version** so I can compare if the polish changed anything meaningful.
- As a **Notary Operator**, I want to edit the Draft in place (any zone not marked `LOCKED` by the template), in Arabic, in English, or both — and version every save so my changes are auditable.
- As a **Notary Operator**, I want to flag a specific uploaded document as `Needs revision` (with a reason) so the Client knows exactly what to re-upload — and the Case moves to `Document revision requested` (sub-status #7) automatically.
- As a **Notary Operator**, I want to mark the Draft `ready for client approval` so the Case moves to the Client's side and I can stop watching it.
- As a **Notary Operator** running the Video Session, I want a checklist in the platform UI — identity verified, notarial reading conducted, signature observed, recording attached, and (if requested) English translation prepared with stamp — that I must complete before I can upload the Final POA. This is the Session-Completion Checklist.
- As a **Notary Operator**, I want to upload the Final POA (Arabic) — and the stamped English version too if the Client paid for it — and have the Case advance to `Final POA issued` (Global Status `Completed`) automatically, triggering the notification to the Client.

### Notary Admin (Partner-Business admin)

- As a **Notary Admin**, I want to **fully own and maintain my office's Slot availability** — publishing weekly recurring Office Capacity Blocks, editing or removing them as staffing changes, blocking out individual Slots ad hoc (e.g., this Tuesday's 11:00 only — without removing the whole Block), and adjusting the concurrent-slot count for a specific date when fewer Operators are on shift than usual. The Client's booking calendar is **exactly** what I publish — nothing more, nothing less — so Slot supply is in my hands, not the platform's.
- As a **Notary Admin**, I want to mark public holidays and office-closure days so the Client never sees a Slot on a date my office is closed.
- As a **Notary Admin**, I want to see every POA Case assigned to my office, with the Acting Operator, current Sub-status, Wallet credit, English-translation-add-on flag, and a 30-day no-show history per Client.
- As a **Notary Admin**, I want to reassign the Acting Operator on a Case (with a reason — illness, leave, conflict) and have the case thread + Client notification fire automatically.
- As a **Notary Admin**, I want to assign a **Session Operator** to each booked Slot from my office's internal schedule when the Acting Operator isn't on-shift for that Slot.
- As a **Notary Admin**, I want to write Notary internal notes on a Case — visible only to my office's members, never to the Client or Agent — so we can coordinate without exposing internal coordination.

### Agency Admin

- As an **Agency Admin**, I want to set my Agency's per-Module Top-up Cap for POA in Agency settings (WF1.4) so my Agents capture appropriate margin without being able to overcharge.
- As an **Agency Admin**, I want every POA Case my Agents own visible in my Agency dashboard (Module 0 user-stories — "see every case my agents own") so I can monitor pipeline.

### Platform Admin

- As a **Platform Admin**, I want to provision a Notary office (Module 0 R1.5) including the office's notarial-video-system label (free-text — for display and audit), so the platform knows what to relay to Clients on booked appointments. (Per ADR-0004, POA no longer requires the office to bind a Microsoft 365 tenant — the video session is partner-hosted.)
- As a **Platform Admin**, I want to configure POA's Manifest values — Base Fee, Partner Cost, Top-up Cap defaults, reschedule cutoff, no-show refund percentage, end-to-end SLA target, **translation add-on price and partner share** — and audit every change.
- As a **Platform Admin**, I want to review **post-payment** Notary-rejection Cases before issuing a refund — defaulting to full Base Fee + Top-up + translation + passport-notarisation refund per WF1.10, with override on suspected-fraud reason. (Pre-payment rejections involve no money and need no refund review — P1.18.)
- As a **Platform Admin**, I want to see POA-specific health: median time to completion, drop-off by Sub-status, conversion rate from Case creation to Payment, no-show rate per Notary office, and English-translation-add-on attach rate.

## Requirements

All requirements below are required for V1 launch unless explicitly marked otherwise.

### P1.1 — POA Module Manifest

The POA Module registers with Module 0 via a Manifest (R3.1). V1 declares:

| Field | Value |
|---|---|
| `module_key` | `poa` |
| `display_name` | `Power of Attorney` |
| `business_sub_types` | `notary_office` |
| `business_scoped_roles` | `Notary Admin`, `Notary Operator` (in `notary_office`) |
| `fee_model` | `Fixed` (per WF1.2) |
| `base_fee_aed` | `1500` (Platform-Admin-configurable; per-Agency override allowed per WF1.3; configurable floor for any future Standard tier is also 1,500 per stakeholder direction) |
| `partner_cost_aed` | `850` (flat base notary cost — covers both resident and non-resident cases at the higher of the two cost bases; residents over-credit the Partner Wallet by 200 AED, reconciled monthly per WF1.9. **The Passport-Based Notarisation Add-on below is charged and credited separately, per passport-using Principal**, and is not part of this flat base.) |
| `settlement_mode` | `immediate` |
| `top_up_enabled` | `true` (per WF1.4) |
| `top_up_cap_default_aed` | `200` (platform-wide Solo cap; Agency caps set in Agency settings up to a platform-wide ceiling of `500`) |
| `verification_requirement` | `any Verified` (V1 accepts both `Verified (UAE Pass)` for residents and `Verified (Passport)` for non-residents) |
| `max_principals_per_case` | `5` (the maximum number of Principals / co-owners the Case can carry; Platform-Admin-configurable per P1.5) |
| `principal_authority_modes` | `["joint", "several"]` (the modes the form offers when the Case has more than one Principal — see P1.5; `joint_and_several` is **not** offered for Principals in V1, only for Attorneys) |
| `max_attorneys_per_case` | `5` (the maximum number of Attorneys the Case can carry; Platform-Admin-configurable per P1.5) |
| `attorney_authority_modes` | `["joint", "several", "joint_and_several"]` (the modes the form offers when the Case has more than one Attorney — see P1.5) |
| `sub_statuses` | The Sub-status map in P1.4 — 17 working states + 5 Cancelled terminals; the snake_case keys are the canonical identifiers consumed by code, APIs, and Appendix A's transition table |
| `document_templates` | `property_poa_template_v1_bilingual`, `general_poa_template_v1_bilingual` — each a single bilingual (Arabic + English) template; Platform-team-authored, versioned; LLM-polish locked zones declared per template — see P1.9 |
| `document_checklist_per_subtype` | See P1.8 — generated dynamically per POA Type + residency + party-type (Individual vs Company) |
| `sla_aggregate_business_hours` | `8` (end-to-end target — same business day; Sunday–Thursday 09:00–18:00 UAE, paused on `Awaiting Client`; per-Notary-office override allowed per SLAs PRD) |
| `reschedule_cutoff_hours` | `4` (within this window a reschedule is treated as a no-show) |
| `same_day_cutoff_local_time` | `16:00` (Asia/Dubai office time; after this clock time the office's same-day **auto-assign** booking mode is closed for the current date — see P1.13; Platform-Admin default, per-Notary-office override allowed) |
| `same_day_prep_buffer_hours` | `3` (minimum lead time between the moment of same-day booking and the auto-assigned Slot start; Platform-Admin-configurable; must be **strictly greater** than the 2-hour `poa.video_link_missing_escalation` threshold (P1.13) so the escalation moment always falls after the booking moment — at exactly 2h the escalation would fire immediately on a freshly booked Slot with an empty-by-design link field) |
| `unexcused_no_show_dispute_window_days` | `7` (length of the dispute window in Sub-status #16 before the Case auto-advances to terminal T4; configurable by Platform Admin per P1.17) |
| `notary_rejection_refund_default` | `full_refund` (Base Fee + Top-up + Translation fee + Passport-Based Notarisation fee(s) if any, reversed per WF1.10; applies only to **post-payment** rejections — pre-payment rejections involve no money movement, see P1.18; Platform Admin can override on fraud reason) |
| `translation_addon_enabled` | `true` (V1 supports the English Translation Add-on; intent captured at the Details form (P1.6 / P1.7), confirmed at payment) |
| `translation_addon_price_aed` | `250` (Platform-Admin-configurable; charged when Client opts in) |
| `translation_addon_partner_share_aed` | `200` (the portion of the translation price credited to the Notary office Wallet — they produce the translation and stamp; remaining `50` AED is Platform margin) |
| `passport_notarisation_addon_enabled` | `true` (V1 supports the Passport-Based Notarisation Add-on — notarising a Principal against their passport rather than their Emirates ID; opt-in per Principal at the Principal form, see P1.5) |
| `passport_notarisation_addon_price_aed` | `200` (Platform-Admin-configurable; charged **per Principal who notarises by passport** — distinct from Module 0 identity verification; mandatory for non-resident Principals who have no Emirates ID, opt-in for resident Principals who choose not to use their Emirates ID in court) |
| `passport_notarisation_addon_partner_share_aed` | `200` (full price credited to the Notary office Wallet by default — covers the office's additional passport-ID handling cost; remaining `0` AED Platform margin. Like the Translation Add-on, the exact split is subject to Finance sign-off before V1 freeze.) |
| `notification_triggers` | See P1.21 |
| `zoho_mapping` | One-way Case sync per R8.1; field mapping in `poa_zoho_field_map.yaml` (engineering doc, not in scope here) |

- AC: The Manifest is registered through configuration; Platform Admin can enable / disable POA globally (Module 0 R3.6) and per Business (per-Agency, per-Notary-office).
- AC: All Manifest values are versioned and audited (R3.1); in-flight Cases keep the Manifest values they were created under.
- AC: Per-Agency Base Fee override (WF1.3) is permitted on POA because it is a `Fixed` Fee Model.
- AC: The `translation_addon_*` and `passport_notarisation_addon_*` fields together require a small Wallet PRD amendment for Module-declared add-on line items with their own Partner Share, to be agreed with Finance before V1 freeze. Note the two add-ons differ in unit: the Translation Add-on is a single per-Case line item, whereas the Passport-Based Notarisation Add-on is charged **per passport-using Principal** (so a Case can carry between 0 and `max_principals_per_case` instances of it).
- AC: **OPEN QUESTION — per-Principal pricing.** V1 ships the multi-Principal capability (P1.5) on the existing `Fixed` Fee Model: a Case with two or more Principals is charged the **same single Base Fee (1,500 AED)** as a single-Principal Case unless and until this Open Question is resolved. UAE notary practice commonly charges a fee *per additional Principal* on a single POA, and the flat `partner_cost_aed` of 850 may not cover the Notary office's true cost when several Principals are verified and signed in one session. Whether to add a per-additional-Principal line item (with its own Partner Share, analogous to the Translation Add-on) is **deferred to a Finance decision before V1 freeze**. If adopted, it extends WF1.5 the same way the Translation Add-on does and does not require the `Tiered` Fee Model. Until resolved, no per-Principal charge is applied.

### P1.2 — POA Types in V1: Property POA and General POA

Two POA Types are supported in V1. The Type is selected at Case creation and is immutable on the Case once set.

- AC: At `Start a POA Case`, the user picks one of two cards: **Property POA** or **General POA**. The choice is recorded as the Case's `poa_type` field and cannot be changed thereafter (open a new Case if the wrong Type was selected; the wrong Case is `Cancelled` with reason `wrong_type_selected`).
- AC: The selected Type drives the POA Details form (P1.6 / P1.7), the document checklist (P1.8), and the bilingual template used for Draft generation (P1.9).
- AC: Adding a new POA Type (Vehicle, Company-as-Type, Custom) requires a Manifest update (new bilingual template + new checklist entry) and is out of V1 scope.

### P1.3 — Roles and the Notary office Business sub-type

POA introduces the `notary_office` Business sub-type and two Business-scoped Roles inside it.

- AC: A Notary office is a Business (Module 0 R1.5) with sub-type `notary_office`, provisioned by Platform Admin. Mandatory profile fields beyond Module 0's minimums (trade name, license, jurisdiction): **default Operator capacity** (numeric; informational; used by Notary Admin to validate Office Capacity Blocks), **translation-capable Operators flag** (whether the office can fulfil the English Translation Add-on — defaults to true; if false, the office can opt out of receiving Cases where the Add-on is opted into), and **notarial video system name** (free-text label such as "Dubai Courts video notarisation" or "Ministry of Justice e-Notary" — for display and audit only; the platform places no technical requirement on which system the office uses). **No Microsoft 365 tenant binding is required for POA** — the previous draft of this PRD required it; ADR-0004's POA exception removes that requirement.
- AC: A `Notary Admin` is a Business-scoped admin Role inside a Notary office, capable of: managing the Operator roster (inviting / removing via F5 / F6), publishing Office Capacity Blocks (P1.13), assigning Session Operators to booked Slots (P1.13), reassigning Acting Operators (P1.10), writing Notary internal notes (P1.20), seeing the office's Wallet (per WF1.1), and toggling the office's translation-capable flag.
- AC: A `Notary Operator` is a Business-scoped member Role inside a Notary office, capable of: self-assigning POA Cases from the office's draft-review queue (P1.10), editing Drafts within unlocked zones (P1.9 / P1.10), flagging documents `Needs revision` (P1.8), marking Drafts `ready for client approval` (P1.10), **providing the Partner-Provided Video Link and any session instructions** for a booked appointment (P1.13), running Video Sessions and completing the Session-Completion Checklist (P1.15), uploading the Final POA in Arabic (and the English Translation if the Client opted in) (P1.16).
- AC: A `Notary Operator` is a one-Business-at-a-time Role (Module 0 R1.3); transitions between Notary offices follow the same R1.4 mutual-consent invite/accept pattern but **do not** carry the Agent Clean-state Gate (Module 0 R1.3 — that gate applies only to Agent transitions in V1).
- AC: A `Notary Admin` can in principle be held in more than one Notary office (admin-style Roles are exempt from one-Business-at-a-time per Module 0 R1.3), but this is an exception, not the default.

### P1.4 — POA Case lifecycle and sub-statuses

A POA Case follows Module 0's hybrid Global Status + Sub-status model. The Case is created at the moment the user picks a POA Type from the new-case picker (Global Status = `Open`, Sub-status `capturing_principal_info`) and proceeds through the 17 working Sub-statuses below to either `Final POA issued` (Completed) or one of five Cancelled terminals (T1–T5).

**Each Sub-status carries a canonical snake_case `key`. The `#` numbers are display ordering only** — code, the Manifest, APIs, and the transition table (Appendix A) reference keys, never numbers. (The `#4a` insertion shows why ordinals are brittle; prose references like "#8" in this PRD are shorthand for the key on the same row.)

| # | Key | Sub-status (display) | Global Status | What's happening | Whose action moves it | SLA timer |
|---|-----|----------------------|---------------|------------------|----------------------|-----------|
| 1 | `capturing_principal_info` | `Capturing principal info` | `Open` | User on Basic Information form (P1.5) | Client / Agent | Running |
| 2 | `capturing_poa_details` | `Capturing POA details` | `Open` | User on POA Details form (P1.6 / P1.7) | Client / Agent | Running |
| 3 | `awaiting_documents` | `Awaiting documents` | `Awaiting Client` | Checklist generated; required docs not all uploaded | Client | Paused |
| 4 | `documents_submitted` | `Documents submitted` | `In Progress` | All required docs uploaded; draft generation triggered | System | Running |
| 4a | `generating_draft` | `Generating draft` | `In Progress` | Bilingual draft generation + LLM-polish pass running (up to 60s); falls back to raw template on failure | System | Running |
| 5 | `awaiting_notary_review` | `Awaiting notary review` | `Awaiting Partner` | Bilingual Draft generated; Notary office queue; first Operator picks up | Notary Operator | Running |
| 6 | `notary_editing_draft` | `Notary editing draft` | `Awaiting Partner` | Acting Operator is editing the Arabic / English Draft | Notary Operator | Running |
| 7 | `document_revision_requested` | `Document revision requested` | `Awaiting Client` | Operator flagged specific docs as `Needs revision` | Client | Paused |
| 8 | `awaiting_client_approval` | `Awaiting client approval` | `Awaiting Client` | Operator marked draft ready; Client reviews bilingual preview | Client | Paused |
| 9 | `client_change_requested` | `Client change requested` | `Awaiting Partner` | Client clicked "Request change" with comments; back to Operator | Notary Operator | Running |
| 10 | `awaiting_payment` | `Awaiting payment` | `Awaiting Client` | Client approved draft; payment screen with optional Translation Add-on toggle | Client | Paused |
| 11 | `awaiting_booking` | `Awaiting booking` | `Awaiting Client` | Payment succeeded; slot picker | Client | Paused |
| 12 | `appointment_booked` | `Appointment booked` | `Awaiting Client` | Slot booked; waiting for appointment time | Client | Paused |
| 13 | `video_session_in_progress` | `Video session in progress` | `Awaiting Partner` | Partner-hosted video session live (P1.14); Session Operator running it | Notary Operator | Running |
| 14 | `awaiting_final_poa` | `Awaiting final POA` | `Awaiting Partner` | Session complete + checklist submitted; Operator uploading signed Arabic POA (and English if requested) | Notary Operator | Running |
| 15 | `final_poa_issued` | `Final POA issued` | `Completed` | Done — Client can download Arabic Final POA (and English if requested) | — | Stopped |
| 16 | `pending_termination_unexcused_no_show` | `Pending termination — unexcused no-show` | `Awaiting Client` | Operator marked Unexcused; 7-day Client dispute window running | Client (dispute) / System (auto-advance) | Paused |
| T1 | `cancelled_abandoned` | `Cancelled — abandoned` | `Cancelled` | Auto after 14 days idle in `Open` | System | Stopped |
| T2 | `cancelled_rejected_by_notary` | `Cancelled — rejected by notary` | `Cancelled` | Operator + Notary Admin rejected the Case — from #6/#9 (pre-payment, no refund needed) or #12–#14 (post-payment, full refund) per P1.18 | Notary Operator + Notary Admin | Stopped |
| T3 | `cancelled_wrong_type_selected` | `Cancelled — wrong type selected` | `Cancelled` | Client / Agent abandoned a Case with wrong POA Type to start a new one | Client / Agent | Stopped |
| T4 | `cancelled_unexcused_no_show` | `Cancelled — unexcused no-show` | `Cancelled` | 7-day dispute window expired or dispute upheld; no refund; Client must start a new POA Case to try again | System | Stopped |
| T5 | `cancelled_expired` | `Cancelled — expired` | `Cancelled` | Auto after 14 days idle in a pre-payment `Awaiting Client` Sub-status (#3, #7, #8, #10) | System | Stopped |

- AC: The SLA timer pauses on every `Awaiting Client` Sub-status (per Module 0 R4.1) and resumes on the next Client action. The aggregate end-to-end target of 8 business hours (P1.19) only counts running time.
- AC: A no-show event (P1.17) re-enters Sub-status `Awaiting booking` (#11) with a `was_rescheduled: true` flag; it is not a separate state.
- AC: A Case in `Open` with no activity for **14 days** transitions to `Cancelled — abandoned` automatically (T1). No refund applies because no payment has been taken at that point in the lifecycle.
- AC: A Case idle for **14 days** in any **pre-payment `Awaiting Client`** Sub-status (#3 `Awaiting documents`, #7 `Document revision requested`, #8 `Awaiting client approval`, #10 `Awaiting payment`) transitions to `Cancelled — expired` automatically (T5). No refund applies — payment is only taken on leaving #10, so every T5-eligible state is pre-payment. `poa.case_expired` fires (P1.21).
- AC: **Post-payment Sub-statuses (#11, #12) never auto-cancel** — money has moved and cancellation needs a human decision. A Case idle for **30 days** in #11 or #12 fires `poa.stalled_case_escalation` to Platform Admin for manual resolution (refund per WF1.10, nudge, or manual cancellation). A booked Slot whose start time passed **24 hours** ago with neither `Start session` nor `Mark Missed Appointment` recorded fires the same escalation to Notary Admin + Platform Admin. (#16 has its own 7-day auto-advance per P1.17.)
- AC: Every state transition fires a system message into the case thread (per Messaging PRD MN7's system-message capability) and may fire a notification (P1.21).
- AC: Sub-status transitions are validated server-side against the declared state machine; illegal transitions return 400. **The declared state machine is the transition table in Appendix A (normative), expressed in Sub-status keys** — any transition not listed there is illegal.
- AC: **Multi-Principal gate at Sub-status #1.** When the Case has more than one Principal, it cannot advance from #1 (`Capturing principal info`) to #2 until **every** Principal has completed Verification (P1.5). While one or more co-Principals are unverified, the Case stays in #1 (`Capturing principal info — awaiting co-Principal verification`), SLA timer behaviour follows `Open` (running), and the abandonment sweeper (T1, 14 days idle) still applies.
- AC: **Multi-Principal gate at Sub-status #8.** When the Case has more than one Principal, Sub-status #8 (`Awaiting client approval`) does not advance to #10 (`Awaiting payment`) until **all** Principals have individually approved the Draft (P1.12). The Case shows a per-Principal approval tracker (e.g., "1 of 2 Principals approved"); a `Request change` by any Principal (or the Agent) resets pending approvals and sends the Case to #9 (`Client change requested`) per P1.12.

### P1.5 — Principal and Attorney parties on a Case (Individuals and Companies)

Every POA Case has **one or more Principals** (V1 cap: 5) and **one or more Attorneys** (V1 cap: 5). Each Principal, like each Attorney, can be **either an Individual or a Company**, independently. When the Case has more than one Principal it carries a Principal Authority Mode; when it has more than one Attorney it carries an Attorney Authority Mode.

Multiple Principals model the common case of **co-owners of the same property** (or other jointly-held interest) granting authority on a single POA. UAE notary practice supports this on one notarised document, provided every Principal is verified and **personally** reviews and signs (research basis recorded in the Open Question on per-Principal pricing, P1.1). The Case has an **Originating Principal** — the logged-in Individual who created the Case (or, when an Agent created it, the first Principal entered) — who, together with the Agent (if any), may fill forms, upload documents, pay, and book on behalf of all Principals. The Originating Principal carries **no extra authority over the other Principals**: each Principal still approves the Draft and signs in the Video Session personally (P1.12, P1.14, P1.24).

**Principal(s) — one or more per Case**

A POA Case carries **one or more Principals** (V1 cap: 5). Each Principal is captured as its own item in the Case's `principals` list and is independently an Individual or a Company. When there are two or more Principals, the Case also carries a Principal Authority Mode that governs how they grant authority.

- AC: At Sub-status #1, the form opens with the Originating Principal's own row pre-added, asking *"Who is this Principal on the POA?"* — two cards: **"An Individual"** and **"A Company"** — captured per row as `principals[i].type` (`individual` | `company`); immutable per row once advancing past Sub-status #1. For the Originating Principal's own row, the platform defaults the card to match the logged-in flow (`Myself (an Individual)` / `A Company I represent`) but the underlying field is the same `principals[i].type`.
- AC: For a row where `principals[i].type = individual`, fields are: full name (for the **Verified** Principal — the Originating Principal and any co-Principal who has completed Verification — pre-populated from UAE Pass *or* the Passport-verification record, read-only; for a co-Principal not yet verified, entered by the originator as a placeholder and **overwritten by the Verified name** once that Principal verifies), residency status (`resident` | `non_resident` — pre-populated from the Verification method: UAE Pass → resident, Passport → non-resident; not editable once verified), Emirates ID number (pre-populated from UAE Pass; absent for Passport-verified non-residents), passport number (required for all), email, mobile (used to invite co-Principals to verify — see below).
- AC: For a row where `principals[i].type = company`, fields are: company trade name (required), company trade license number (required), jurisdiction of registration (required — emirate or international country), company office address (required), and the **Authorised Signatory** — for the Originating Principal's company, pre-populated from the logged-in Individual's Verified data; for a co-Principal company, the Authorised Signatory is the Individual who will be invited to verify and sign for that company — plus the Signatory's relationship to the company (required: director / partner / employee with power-of-signature / other-with-explanation). Each Authorised Signatory's Verification method (UAE Pass or Passport) is recorded.
- AC: **Residency status and notarisation-document choice are independent.** `principals[i].residency_status` continues to be derived from the Module 0 Verification method (UAE Pass → `resident`, Passport → `non_resident`) and is **not** the same thing as which ID document is used to notarise the POA. A `resident` Principal may still elect to notarise by passport (see next AC); the residency field does not change when they do.
- AC: **Passport-Based Notarisation choice (per Principal).** Each Principal row carries a `principals[i].passport_notarisation` boolean governing whether that Principal is notarised against their **passport** rather than their Emirates ID, and whether the Passport-Based Notarisation Add-on (`passport_notarisation_addon_price_aed`, default 200 AED, P1.1) applies for that Principal. Presented to **all** Principals as a single toggle accompanied by a **bold notice**: **"If you don't have an Emirates ID — or you have one but don't want to use it in court — you'll be notarised using your passport instead, for an extra `[passport_notarisation_addon_price_aed]` AED per person."** Behaviour:
  - For a Principal whose `residency_status = non_resident` (Passport-verified, no Emirates ID), the toggle is **pre-set on and cannot be turned off** — passport is their only path. The bold notice explains the charge is unavoidable for them; the Case cannot reach payment with it off (validated at P1.12).
  - For a Principal whose `residency_status = resident` (UAE-Pass-verified, has Emirates ID), the toggle **defaults off** (notarise by Emirates ID, no surcharge) and is a genuine **opt-in** — turning it on adds the per-Principal surcharge.
  - The choice is selected on the Principal form **before payment** (alongside the rest of the Principal's data) so the total is known upfront; the resulting surcharge is itemised on the payment screen (P1.12).
- AC: `principals[i].passport_notarisation` is editable up to Sub-status #4 (`Documents submitted`); after Draft generation, changing it follows the same Operator-flagged revision flow as adding/removing a Principal, because it can change the required documents (P1.8) and the notary's session handling.
- AC: The user can `+ Add another Principal` to append a row. Up to **5 Principals** per Case (`max_principals_per_case` in the Manifest — see P1.1). Above 5, the `+ Add another Principal` button is disabled with an inline note.
- AC: Each added Principal row (other than the Originating Principal's own row) can be removed via `× Remove` provided the Case has not yet advanced past Sub-status #4 (`Documents submitted`). After draft generation, adding or removing a Principal requires the Operator to flag the documents for revision and re-generate the Draft (P1.10). The Originating Principal's own row cannot be removed.
- AC: The Principal list cannot be empty — at least one Principal is required. The Originating Principal is always Verified (they created the Case). **Every other Principal must complete Verification (UAE Pass or Passport, their choice) before the Case can advance from Sub-status #1 to #2.** The originator adds a co-Principal by entering their mobile number; the platform runs the Module 0 R1.7 invite-to-verify flow (same mechanism PF2 uses for Agent-invited Clients): an existing Verified Individual is linked immediately; an unverified or unknown Individual receives an SMS link routing them through F7 (UAE Pass) or F8 (Passport), then F1 registration first if needed. Until every Principal is Verified, the Case sits in Sub-status #1 with a `pending_principal_verification` marker per unverified row, and `poa.principal_invited_to_verify` (P1.21) has fired to each.
- AC: Once a co-Principal verifies, their `principals[i].individual_id` is bound, their name/residency/Emirates ID fields are overwritten with their Verified data (read-only thereafter), and they gain their own access to the Case (it appears on their Client dashboard, P1.23).

**Principal Authority Mode**

- AC: When the Case has **two or more** Principals, a `principal_authority_mode` field becomes visible and required, as a single-select with two options:
  - **`joint`** — *"All Principals grant this authority together — the powers are granted by the Principals collectively."* The Final POA renders the grant as a single collective act of all Principals.
  - **`several`** — *"Each Principal grants this authority over their own share independently."* Each Principal's grant stands on its own (e.g., each co-owner authorises dealings with their own undivided share).
  - `joint_and_several` is **not** offered for Principals in V1 (it is offered only for Attorneys, P1.5 Attorney section).
- AC: When the Case has exactly **one** Principal, `principal_authority_mode` is hidden, not collected, and defaults to `n_a` server-side.
- AC: `principal_authority_mode` is immutable once the Case advances past Sub-status #4. Changing it after Draft generation requires the same Operator-flagged revision flow as adding/removing a Principal.
- AC: **Regardless of `principal_authority_mode`, every Principal must personally (a) approve the Draft (P1.12) and (b) sign in the Video Session (P1.14).** The Authority Mode governs the legal *content* of the grant in the document, not who must consent — consent is always per-Principal and non-delegable.

**Attorney(s) — one or more per Case**

A POA Case carries **one or more Attorneys** (V1 cap: 5). Each Attorney is captured as its own item in the Case's `attorneys` list and is independently an Individual or a Company. When there are two or more Attorneys, the Case also carries an Attorney Authority Mode that governs how they act.

- AC: At Sub-status #1, after Principal, the form opens an `Attorneys` section with one Attorney row pre-added. Each row asks first *"Who is this Attorney?"* — two cards: **"An Individual"** and **"A Company"** — captured per row as `attorneys[i].type` (`individual` | `company`); immutable per row once advancing past Sub-status #1.
- AC: For a row where `attorneys[i].type = individual`, fields are: full name (required), passport or Emirates ID number (required; if Emirates ID, the Attorney is presumed to be a UAE resident — informational only, no Verification gate on the Attorney), relationship to Principal (required: spouse / parent / sibling / friend / employee / other-with-explanation).
- AC: For a row where `attorneys[i].type = company`, fields are: company trade name (required), trade license number (required), jurisdiction (required), Authorised Signatory name + ID number (required), Authorised Signatory's role within the Attorney company (required).
- AC: The user can `+ Add another Attorney` to append a row. Up to **5 Attorneys** per Case (`max_attorneys_per_case` in the Manifest — see P1.1). Above 5, the `+ Add another Attorney` button is disabled with an inline note.
- AC: Each Attorney row can be removed via a `× Remove` action on that row, provided the Case has not yet advanced past Sub-status #4 (`Documents submitted`). After draft generation, removing or adding Attorneys requires the Operator to flag the documents for revision and re-generate the Draft (P1.10).
- AC: The Attorney list cannot be empty — at least one Attorney is required to advance from Sub-status #1 to #2.
- AC: No Attorney (whether Individual or Company) is required to be an Individual or Business on the platform. They are referenced by data on the Case only. Post-V1: invite Attorneys to verify so the platform can produce a Final POA matching their on-platform identity record.

**Attorney Authority Mode**

- AC: When the Case has **two or more** Attorneys, an `attorney_authority_mode` field becomes visible and required at the bottom of the Attorneys section, as a single-select with three options:
  - **`joint`** — *"All Attorneys must act together for any action."* The Final POA renders a single signing requirement: every Attorney must sign / consent.
  - **`several`** — *"Any one Attorney can act independently."* Each Attorney is empowered alone for the full list of powers granted.
  - **`joint_and_several`** — *"Each Attorney can act alone for some powers and jointly for others — the Draft specifies the split per power."* When this is selected, the POA Details form (P1.6 / P1.7) adds a per-power "Joint or Several" toggle for each power in the granted-powers list.
- AC: When the Case has exactly **one** Attorney, `attorney_authority_mode` is hidden, not collected, and defaults to `n_a` server-side.
- AC: `attorney_authority_mode` is immutable once the Case advances past Sub-status #4. Changing it after Draft generation requires the same Operator-flagged revision flow as adding/removing Attorneys.

**All required fields must be filled before the Sub-status can advance from #1 to #2** — this applies to every Attorney row, plus `attorney_authority_mode` when applicable.

**Companies as Module 0 entities**

- AC: When any Principal or Attorney is a Company, the Company is **not** provisioned as a Module 0 `Business` entity. It is captured as Case-level data fields only. The Originating Principal (or the Agent) remains the owner of the Case for workflow purposes, while every Principal — including each Company's Authorised Signatory — retains their own non-delegable approve and sign actions. This is a POA-only relaxation of Module 0 Non-Goal #9 (corporate clients deferred); promoting Companies to first-class Module 0 entities is a future amendment to be aligned with Legal.

### P1.6 — Property POA: details form

When `poa_type = property_poa`, the Sub-status #2 form captures property-specific data populated into the Draft.

- AC: Required fields: property emirate (dropdown of seven emirates), property type (apartment / villa / townhouse / commercial / land / other), project or building name, unit number, Purpose (multi-select: sell property / buy property / manage property / sign transfer documents / receive cheques / other-with-explanation).
- AC: Optional fields: title deed number, Oqood number.
- AC: The form also captures the **English Translation Add-on intent** (`english_translation_requested`, toggle, default off, price from `translation_addon_price_aed` shown inline). Capturing intent at Sub-status #2 — before Notary office assignment — lets the assignment filter (P1.11) route the Case to a translation-capable office. The toggle pre-sets the payment-screen toggle (P1.12) and remains editable until payment confirmation, subject to the P1.12 capability rule.
- AC: A Property POA with `Purpose = sell property` (or `buy property`, or `sign transfer documents`) requires a `title_deed` document on the checklist (P1.8). Other Purposes don't.

### P1.7 — General POA: details form

When `poa_type = general_poa`, the Sub-status #2 form captures purpose and powers granted.

- AC: Required fields: purpose description (free text, 50–500 characters), powers granted (multi-select from a Manifest-declared list: open bank account / sign contracts / manage finances / represent in court / collect documents / file applications / other-with-explanation), validity preference (one-time use / time-bounded with explicit end date / unbounded).
- AC: The form also captures the **English Translation Add-on intent** (`english_translation_requested`, toggle, default off, price shown inline) — same behaviour as P1.6: drives the translation-capable assignment filter (P1.11), pre-sets the payment-screen toggle (P1.12), editable until payment confirmation subject to the P1.12 capability rule.

### P1.8 — Document checklist and upload

After Sub-status #2, the system generates a dynamic document checklist based on POA Type, Principal type (Individual vs Company), Principal residency (where relevant), and Attorney type. The Case moves to `Awaiting documents` (#3) until all required documents are uploaded. (Operator review of documents happens later, at Sub-statuses #5–#6 — review is **not** a gate for leaving #3.)

- AC: The platform's documents primitive (Module 0 R5.1) is used; accepted formats PDF / JPG / PNG / DOCX, max 25 MB per file; encrypted at rest.
- AC: Per-document fields: `required` flag, `upload_status` (`pending`, `uploaded`), `review_status` (`pending_review`, `approved`, `needs_revision`), `uploaded_by`, `reviewed_by`. `review_status` is set to `pending_review` on upload and is changed only by the Notary Operator during Sub-statuses #5–#6.
- AC: **Checklist generation rules:**

  **For each Principal in the `principals` list, the checklist adds the row matching that Principal's type and residency** (each row labelled with the Principal's name — or the company trade name — for disambiguation when the Case has more than one Principal):

  | Principal type | Principal residency | Required Principal documents |
  |---|---|---|
  | Individual | Resident | Passport copy, Emirates ID |
  | Individual | Non-resident | Passport copy (Emirates ID hidden) |
  | Company | Authorised Signatory resident | Signatory passport, Signatory Emirates ID, Company trade license, Company memorandum of association |
  | Company | Authorised Signatory non-resident | Signatory passport, Company trade license, Company memorandum of association |

  For a Property POA whose property is co-owned, the **title deed** (required where Purpose includes sell / buy / sign transfer — see the table below) is a single Case-level document showing all co-owners; it is **not** duplicated per Principal.

  **For each Attorney in the `attorneys` list, the checklist adds the row matching that Attorney's type:**

  | Attorney type (per Attorney row) | Required documents for that Attorney |
  |---|---|
  | Individual | Attorney ID/passport (labelled with the Attorney's name on the checklist for disambiguation) |
  | Company | Attorney company trade license, Attorney's Authorised Signatory ID/passport (each labelled with the Attorney's trade name) |

  | POA Type + Purpose | Additional document |
  |---|---|
  | Property POA with Purpose includes sell / buy / sign transfer | Title deed (required) |
  | All other POAs | — |

- AC: **Passport-notarisation effect on the checklist.** For any Principal with `passport_notarisation = true` (P1.5), the **passport copy is required** and the **Emirates ID document is not required** for that Principal — for a non-resident it was never on the list, and for a resident who has opted to notarise by passport the Emirates ID row is dropped to optional (they have explicitly chosen not to use it in court). A passport copy is therefore required for every passport-using Principal regardless of residency.
- AC: Mobile camera capture is supported for upload; file preview is supported; replace-uploaded-file is supported (the previous version is retained per Module 0 R5.1's version history).
- AC: Once **all required** documents are uploaded, the Case auto-advances to Sub-status #4 (`Documents submitted`) and triggers draft generation (P1.9).
- AC: A document flagged `needs_revision` by the Notary Operator (P1.10) sends the Case back to Sub-status #7 (`Document revision requested`); the Client sees that specific document marked, with the Operator's reason inline. Re-uploading returns the Case to Sub-status #6 (`Notary editing draft`) with the existing Acting Operator retained — **not** to #5 (the queue is only for Cases without an Acting Operator) and not back to draft generation, since the Draft already exists; the Acting Operator is notified to re-review the re-uploaded document.

### P1.9 — Draft generation: bilingual template substitution + LLM polish, with fallback

When the Case enters Sub-status #4 (`Documents submitted`), the system generates a bilingual POA Draft (Arabic + English).

- AC: Generation runs in two stages: (1) **deterministic bilingual template substitution** — the Manifest's `property_poa_template_v1_bilingual` or `general_poa_template_v1_bilingual` is populated with Case data, producing a single document with Arabic and English side-by-side (Arabic in right column for RTL flow, English in left column); (2) **LLM polish pass per language** — the merged document is passed to an LLM (provider TBD with Engineering and Legal) for grammatical polish and UAE-notary phrasing normalisation; the polish pass runs once per language and respects locked zones.
- AC: Templates declare **locked zones** (operative clauses: party identification, powers granted, validity, company trade-license references, **the Principal Authority Mode clause when the Case has more than one Principal**, **and the Attorney Authority Mode clause when the Case has more than one Attorney**) marked `LOCKED` — the LLM polish pass cannot modify these in either language. Only preamble, transitional language, and recital sections are `POLISH_ALLOWED`.
- AC: Templates support **list rendering of Principals** in their locked zone — the template substitution iterates over the Case's `principals` list and renders each Principal's identification block in turn (name, ID/passport, residency for Individual; trade name, license, Authorised Signatory for Company). The Principal Authority Mode clause is rendered immediately after the Principal list, with template variants per mode (`joint` — the Principals grant collectively; `several` — each Principal grants over their own share). A single-Principal Case renders the standard single-grantor clause with no Authority Mode language.
- AC: Templates support **list rendering of Attorneys** in their locked zone — the template substitution iterates over the Case's `attorneys` list and renders each Attorney's identification block in turn (name, ID, relationship for Individual; trade name, license, Authorised Signatory for Company). The Attorney Authority Mode clause is rendered immediately after the Attorney list, with template variants per mode (`joint` / `several` / `joint_and_several`); for `joint_and_several`, the per-power split captured in P1.6 / P1.7 is rendered alongside the powers list.
- AC: Both versions are stored per language: `draft.raw_template_output_ar`, `draft.raw_template_output_en`, `draft.llm_polished_output_ar`, `draft.llm_polished_output_en`. The polished versions are the default shown to the Notary Operator; the Operator can revert to the raw version of either language with one click, independently.
- AC: The Case enters Sub-status #4a (`Generating draft`) while the two LLM passes run (in parallel). SLA budget for this Sub-status is **60 seconds total** for both languages combined.
- AC: If either LLM pass fails or the combined time exceeds 60 seconds, the system **falls back to the raw template output for the affected language(s)** (records the fallback event on the Case audit log, notifies Platform Admin) and advances the Case to Sub-status #5. No user-facing error.
- AC: Every Draft is versioned (`draft.version`) — the first Draft is version 1, every Operator save creates a new version (saves are tracked per language). The version field captures the full bilingual state.
- AC: The POA Draft is **not** downloadable by the Client during the workflow — only previewable in both languages side-by-side. The Final POA (P1.16) is the downloadable artefact.

### P1.10 — Notary review and editing

When the Case enters Sub-status #5 (`Awaiting notary review`), it appears in the assigned Notary office's draft-review queue (see P1.11 for office assignment).

- AC: Any Notary Operator in the assigned office can view the Case in the queue. The first Operator to self-assign becomes the `acting_operator_id` on the Case; the Sub-status advances to #6 (`Notary editing draft`).
- AC: The Acting Operator is **immutable** for the rest of the Case **except via a Notary-Admin-initiated reassignment** (with a reason). Reassignment fires a notification to the Client and a system message into the case thread.
- AC: While in Sub-status #6, the Operator can: edit the Draft in unlocked zones in Arabic, English, or both (each save creates a new `draft.version`); flag documents `needs_revision` with a reason (sends Case to Sub-status #7); reject the Case with a reason (sends Case to terminal T2, see P1.18); mark the Draft `ready for client approval` (sends Case to Sub-status #8). The "ready for client approval" action requires both language drafts to be in a non-empty, edited or accepted state.
- AC: Marking the Draft `ready for client approval` advances the Case to Sub-status #8 **immediately** — there is no delayed-visibility window; `poa.draft_ready_for_client_approval` fires on #8 entry (P1.21). If the Notary Admin disagrees with the Operator's readiness call, they can **recall** the Case from #8 back to #6 (with a required reason; available only while **no Principal has yet approved** the Draft). A recall fires a notification to Client and Agent and posts a system message into the case thread.
- AC: **Sub-status #9 (`Client change requested`) exit transitions.** #9 behaves as #6 with the change-request comments attached: the Acting Operator (unchanged) addresses the comments and re-marks the Draft `ready for client approval` (→ #8; per-Principal approvals were already reset on entry to #9, P1.12), or flags documents `needs_revision` (→ #7), or rejects the Case (→ T2 per P1.18).

### P1.11 — Notary office assignment

When the Case advances to Sub-status #5, it must be assigned to exactly one Notary office (the Partner per Module 0's case model — "one Partner at a time per Case").

- AC: **V1 assignment policy: round-robin across Platform-Admin-curated active Notary offices.** Platform Admin can mark an office as `active` or `paused`; active offices receive Cases in round-robin order. Per-office load (number of in-flight Cases) is used as a secondary fairness factor — an office at its configured capacity is skipped.
- AC: **Translation-capable filter.** The Case's translation-intent flag (`english_translation_requested`, captured on the Details form at Sub-status #2 — P1.6 / P1.7) is known before assignment. When it is `true` at the time of assignment, only offices with the `translation-capable Operators` flag = true are eligible. There is **no post-payment reassignment for translation** — at payment the Add-on can be switched off freely, but can be switched on only if the assigned office is translation-capable (P1.12). This guarantees Partner Share postings always target the office that will actually fulfil the Case.
- AC: Each Notary office has a Platform-Admin-configurable `max_in_flight_cases` value; a Case is assigned to the next eligible office whose in-flight load is below capacity.
- AC: Manual reassignment of a Case to a different Notary office is possible by Platform Admin only (covers the "Notary unavailable" edge case from the stakeholder spec). Reassignment from the Client's or Agent's side is not supported in V1.
- AC: The assigned Notary office's identifier becomes the Case's `assigned_notary_office_id` — this is the Partner on the Case for the purposes of WF1.5 (Partner Share posting at Client payment).

### P1.12 — Client draft approval, payment, and Translation Add-on opt-in

When the Case enters Sub-status #8 (`Awaiting client approval`), the Client sees a bilingual Draft preview screen.

- AC: The Draft preview shows the LLM-polished output by default in both languages side-by-side (Arabic right, English left; mobile stacks them with a language switcher). No `LOCKED`/`POLISH_ALLOWED` annotations are visible to the Client.
- AC: Two actions: `Approve draft` (records the acting Principal's approval) and `Request change` (opens a free-text comments field, 50–2000 characters; on submit, advances to Sub-status #9, `Client change requested`).
- AC: **`Approve draft` is a Principal-Only Action, recorded per Principal** (per P1.24). The platform enforces this server-side: the API call's actor must be the **specific Principal whose approval is being recorded** — the Principal Individual (when that `principals[i].type = individual`) or that Principal's Authorised Signatory (when `principals[i].type = company`). The approval is stored as `principals[i].draft_approved = true` with timestamp and actor. **No party can approve on behalf of another Principal** — not the Agent, and not the Originating Principal or any other co-Principal. An Agent, or a Principal attempting to approve a row that isn't theirs, receives a 403 with a clear error: *"Each Principal must approve the Draft from their own login. Send them the case link or ask them to log in."*
- AC: **Advancement to payment is N-of-N.** The Case advances from Sub-status #8 to #10 (`Awaiting payment`) only when **every** Principal has `draft_approved = true`. Until then it stays in #8 with a per-Principal approval tracker visible to all parties ("1 of 2 Principals approved — awaiting [name]"). Each not-yet-approved Principal sees the `Approve draft` button enabled on their own login; already-approved Principals and the Agent see it disabled with their status shown.
- AC: The Agent's (and any non-approving party's) Case page shows the Draft preview but the `Approve draft` button is disabled and labelled accordingly. The `Request change` action, by contrast, is **open to the Agent and to any Principal** — it's feedback, not legal consent.
- AC: A `Request change` submitted by any Principal or the Agent sends the Case to #9 and **resets all recorded `draft_approved` flags to false** — because the Draft that some Principals already approved no longer exists once it is revised. When the revised Draft returns to #8, every Principal re-approves. This reset is recorded on the audit log.
- AC: **Payment screen** at Sub-status #10 shows:
  - Base Fee (1,500 AED, or per-Agency override)
  - Agent Top-up if any
  - **Passport-Based Notarisation Add-on**, itemised **per passport-using Principal** — one line per Principal with `passport_notarisation = true`, each at `passport_notarisation_addon_price_aed` (default 200 AED), labelled with the Principal's name (e.g., *"Passport notarisation — [name] — +200 AED"*). For non-resident Principals this line is present and **not removable** (the choice was fixed on the Principal form, P1.5); for resident Principals who opted in, it reflects their toggle. The payment screen shows the count and subtotal (e.g., *"Passport notarisation × 2 — 400 AED"*).
  - **Optional**: a clearly-labelled toggle — *"Add stamped English translation of the Final POA — +250 AED"* — **pre-set from the Case's translation-intent flag** (P1.6 / P1.7). It can be switched **off** freely. It can be switched **on** at payment only if the assigned office is translation-capable; otherwise it is disabled with the note *"Your assigned notary office doesn't offer stamped English translations — set this option when starting a Case to be matched with one that does."* (Accepted V1 limitation.) The Manifest's `translation_addon_price_aed` is the displayed price.
  - Client Wallet credit applied if available (per WF1.11)
  - Bundled total (auto-updates when the translation toggle changes; the passport-notarisation lines are fixed at this point because they were set on the Principal form)
  - Apple Pay / card (payment integration owned by Wallet PRD)
- AC: **Payment-blocking validation for non-resident Principals.** The Case cannot advance from Sub-status #8/#10 to a successful payment while any Principal with `residency_status = non_resident` has `passport_notarisation = false`. In practice the Principal form (P1.5) forces the toggle on for non-residents, so this validation is a server-side backstop against data-integrity faults; if hit, the platform **auto-corrects** the flag to `true` (the field is mandatory for non-residents and immutable after Sub-status #4 anyway — P1.5, so there is no user-editable path back to it), records the correction on the audit log, recalculates the total with the per-Principal surcharge, and re-presents the corrected total to the payer before charging. (Residents are never blocked — passport notarisation is their free choice.)
- AC: The passport surcharge is persisted as a per-Principal flag and aggregated for payment. The Wallet PRD's payment-in postings (WF1.5) extend to credit the Notary office Wallet an additional `passport_notarisation_addon_partner_share_aed` (200 AED default) **for each** passport-using Principal, and Platform Revenue the per-Principal remainder (`price − partner_share`, default 0). This is the same Wallet PRD amendment flagged in P1.1 for Module-declared add-on line items, extended to support a count-based (per-Principal) add-on.
- AC: A revision-request comment is posted into the case thread as a system message (Messaging PRD MN7) so the Operator sees it inline with the rest of the conversation.
- AC: There is no hard cap on revision rounds in V1; soft cap monitored — Platform Admin gets a notification when a Case crosses 5 round-trips so they can intervene.
- AC: The translation toggle's state is persisted on the Case as `english_translation_requested: bool`. If `true`, the Wallet PRD's payment-in postings (WF1.5) extend to credit the Notary office Wallet an additional `translation_addon_partner_share_aed` (200 AED default) and Platform Revenue an additional `translation_addon_price_aed − translation_addon_partner_share_aed` (50 AED default). **This requires a Wallet PRD amendment** for Module-declared per-Case add-on line items, to be agreed with Finance before V1 freeze.
- AC: A Case can never carry `english_translation_requested = true` while assigned to a non-translation-capable office: the assignment filter (P1.11) handles intent set at Sub-status #2, and the payment-screen capability rule (above) blocks late opt-in. Post-payment reassignment for translation does not exist in V1.

### P1.13 — Office Capacity Blocks, Slots, and booking

The **Notary Admin is the sole source of truth for Slot availability** at their office. The Client's booking calendar shows exactly the Slots the Notary Admin has published as available — nothing more, nothing less. The platform does not generate, hold back, or pad Slots. Auto-assign (below) only **selects** among already-published Slots; it never creates, holds back, or pads capacity, so the sole-source-of-truth principle is preserved. If the office has not published capacity for the next 14 days, the Client sees an empty calendar and a clear message routing them to the office.

**Two booking modes split by date**

Booking behaves differently for **same-day** versus **future-day** appointments:

- AC: **Future days (tomorrow and beyond) — self-select.** For any date from tomorrow through the 14-day horizon, the Client (or proxying Agent) picks a specific 30-minute Slot from the office's published availability, exactly as described in *What the Client sees* below. This is the default, unchanged behaviour.
- AC: **Same day — auto-assign (no Slot picking).** For the current date, the Client does **not** choose a specific Slot. If same-day booking is open (see cutoff), the Client requests a same-day appointment with a single action ("Book me the earliest appointment today") and the **platform auto-assigns the best available same-day Slot** on their behalf. The Client is shown the resulting time before confirming and again on the booking confirmation. The same-day option is presented alongside the future-day picker whenever same-day booking is open; when it is closed (see cutoff) the same-day option is hidden and only the future-day picker is shown.
- AC: **Same-day selection rule = earliest with prep buffer.** Auto-assign picks the **earliest available same-day Slot whose start is at least `same_day_prep_buffer_hours` (default 3h, Manifest P1.1) from the moment of booking**, in `Asia/Dubai` time. Because the buffer is **strictly greater** than the 2-hour `poa.video_link_missing_escalation` threshold (P1.13 Partner-Provided Video Link), the escalation moment (Slot start − 2h) always falls after the booking moment — the office has at least `buffer − 2h` to provide the join link before any escalation can fire. Slots earlier than `now + same_day_prep_buffer_hours` are not eligible for auto-assign even if technically unbooked.
- AC: **Same-day cutoff.** Same-day auto-assign is open only **before `same_day_cutoff_local_time` (default 16:00 `Asia/Dubai`, per-office configurable, Manifest P1.1)**, evaluated in office time regardless of the Client's own timezone (so a non-resident Client gets the same cutoff as a resident). After the cutoff — or if no same-day Slot satisfies the prep-buffer rule — same-day auto-assign is closed for the current date.
- AC: **Fallback when same-day is unavailable.** When same-day auto-assign is closed (past cutoff) or yields no eligible Slot (none satisfy the prep buffer, or the office has none published for today), the Client is rolled straight into the **future-day self-select picker** (starting tomorrow) with a short inline note ("Same-day booking is closed — here are the next available appointments"). The Client is never left at a dead end. If the office has no published availability across the entire 14-day horizon, the empty-state and `poa.no_slots_available` behaviour below applies.
- AC: **Reservation atomicity applies to auto-assign too.** The auto-assigned same-day Slot is reserved via the same atomic `reserve(slot_id)` operation described under *Reservation atomicity*. If the chosen Slot is taken between selection and confirmation, the platform retries with the next-earliest eligible same-day Slot; if none remain, it falls back to the future-day picker per the rule above.

**Slot supply — what the Notary Admin maintains**

- AC: **Office Capacity Block (the primary lever):** a Notary Admin publishes Blocks via `Workspace → Capacity`. Each Block declares a `start_time`, `end_time` (same day), `concurrent_slots_count` (positive integer — number of parallel sessions the office can run in that window), and a recurrence rule (one-off date, weekly recurring with optional end-date, or open-ended weekly recurring). The system materialises individual `Slot` records inside each Block: a Block of `Mon 10:00–13:00, 4 concurrent slots` with a 30-minute slot length materialises into 24 individual Slots (6 half-hour slots × 4 concurrents). New / edited / removed Blocks take effect immediately.
- AC: **Per-instance overrides (ad-hoc):** for any specific date that falls inside a recurring Block, the Notary Admin can override a single occurrence — reducing the concurrent-slot count for just that day (e.g., normally 4 concurrent, but only 2 Operators are on shift this Tuesday), or blocking the entire instance for that date without affecting other weeks.
- AC: **Individual Slot blocking:** within any materialised set of Slots, the Notary Admin can block a single Slot (e.g., today's 11:00 is taken offline because of a personal appointment) without touching the surrounding Slots or the Block they sit in. A blocked Slot disappears from the Client's calendar instantly.
- AC: **Office-closure days:** the Notary Admin can mark specific dates as office-closed (public holidays, staff event, etc.). Office-closure days override every Block — no Slots are published for the Client on those dates, regardless of recurrence rules. A list of UAE public holidays is pre-seeded but can be edited by the Notary Admin per their office's actual calendar.
- AC: Slot length is a per-office Platform-Admin setting (default 30 minutes); the Notary Admin cannot edit this in V1 because changing slot length retroactively would affect already-booked Slots. Whether to hand this lever to the Notary Admin themselves is deferred to V1.1.

**What the Client sees**

- AC: The future-day self-select picker shows the next **14 days** of *available* Slots for the assigned Notary office **from tomorrow onward** (same-day Slots are handled by auto-assign per *Two booking modes* above, not individually selectable), sorted earliest first, displayed in the Client's local timezone with the office's timezone (`Asia/Dubai`) shown in parallel. Booked Slots, blocked Slots, override-reduced overflow, and office-closure days are simply **absent** from the list — the Client does not see "10:00 — booked" alongside "10:30 — available." The picker is a positive-only view.
- AC: If the Notary Admin has not published any availability for the next 14 days, the Client sees a clear empty state: "Your Notary office hasn't published availability yet. We've notified them — please check back shortly." The platform fires `poa.no_slots_available` to the Notary Admin so they know the Client is waiting.
- AC: The booking calendar **refreshes automatically** when the Client opens it (initial fetch) and on a pull-to-refresh / explicit "Refresh" tap. The platform does not push real-time updates to a watching Client in V1, but a stale picker that no longer matches reality is caught at reservation time (next AC).

**Reservation atomicity**

- AC: When the Client confirms a Slot, the platform attempts an atomic `reserve(slot_id)` operation. On success, the Case advances to Sub-status #12 (`Appointment booked`); the Slot's `status` transitions to `booked`. On failure (because the Slot was just booked by someone else, or the Notary Admin removed it between page load and confirmation), the Client sees a clear inline message — "This slot is no longer available — please pick another" — and the picker refreshes.
- AC: A Notary Admin who removes or blocks a Slot **after** it's been booked must use the explicit "Cancel this appointment" action, not the Slot-blocking action — the platform protects booked Slots from accidental deletion. Cancelling a booked appointment is a Notary-Admin-only action that returns the Case to Sub-status #11 (`Awaiting booking`), fires a high-priority notification to the Client + Agent, and surfaces the office's reason in the case thread.

**Session Operator assignment**

- AC: Defaults to the Acting Operator. If the Acting Operator is not on-shift for the booked Slot (per the Notary Admin's internal scheduling), the Notary Admin can assign a different Operator from the office's schedule. The Client is shown the Session Operator's name on the booking confirmation and on the appointment reminder. This per-Slot Operator assignment is part of the Notary Admin's overall scheduling responsibility — it is not exposed to the Client beyond the assigned name.

**Partner-Provided Video Link**

- AC: The platform does **not** create the video meeting. After Slot reservation, the Case enters Sub-status #12 with empty `partner_video_join_url` and `partner_video_instructions` fields. The Session Operator (or Notary Admin) is responsible for entering these fields via the Case detail page before the appointment. A `poa.video_link_required` trigger fires to the Session Operator and Notary Admin immediately on Slot reservation and again 4 hours and 1 hour before the Slot if the link is still missing; **re-fire times that already lie in the past at the moment of booking (common for same-day bookings) are skipped**. If the link is missing **2 hours before the Slot**, the Case is escalated to Notary Admin and Platform Admin via a high-priority notification (for same-day bookings this moment is guaranteed to fall after booking, since `same_day_prep_buffer_hours` > 2h — P1.1).
- AC: The link is validated only for being a well-formed URL — the platform makes no claim about which service it points to. `partner_video_instructions` is free text (≤ 1000 characters) for things like "Please join 10 minutes early to test your camera" or "You will be admitted from a virtual lobby — please wait."
- AC: Booking confirmation fires a `poa.appointment_booked` trigger (P1.21); the trigger's notification template **includes the Partner-Provided Video Link only if it is set** at the moment of fire. Reminder notifications (24h, 2h, 15min) follow the same rule — they include the link only when it's available. If the link is provided after the 24h reminder has already fired, a one-off `poa.video_link_provided` notification fires to Client and Agent with the link.

### P1.14 — Video Session (Partner-hosted; platform relays only)

The notarisation step runs on the Notary office's own video service. Contract Hubs **does not create, host, brand, or record the video meeting** for POA Cases (see ADR-0004 for the platform-wide rationale and the POA exception). The platform's responsibilities are limited to: relaying the Operator-provided join link to the Client and Agent, running the state machine around the appointment, capturing the Operator's post-session attestations (P1.15), and accepting the Final POA upload (P1.16).

- AC: A POA Case carries `partner_video_join_url` (text, well-formed URL) and `partner_video_instructions` (free text, ≤ 1000 characters) populated by the Session Operator or Notary Admin via the Case detail page (per P1.13). The platform stores and relays these values; it makes no assumptions about the video service.
- AC: The Client's Case page in Sub-status #12 (`Appointment booked`) shows: the appointment time (UAE timezone + Client's local), the Session Operator's name and Notary office, the `partner_video_join_url` as a clickable link (once provided), and the `partner_video_instructions` text (once provided). If the link is not yet provided, the Client sees a clear "Your notary will share the join link before the appointment" message instead.
- AC: At appointment time, the Case advances to Sub-status #13 (`Video session in progress`) when the Session Operator clicks `Start session` in the platform UI. This is a state-machine action only — it does not start a video meeting on our side. The Operator clicks `Start session` when they have actually started the notarisation session in their video tool.
- AC: All actors — Client, Agent (if any), Session Operator — join the session via the Operator-provided link in whatever video tool the Notary office uses. The platform places no constraints on which tool that is.
- AC: **The signing parties in the Video Session are a Principal-Only role** (per P1.24). **Every Principal must personally attend and sign** — for each `principals[i]`, the Principal Individual (when `type = individual`) or that Principal's Authorised Signatory (when `type = company`) is the party whose identity the Operator verifies in-session and whose signature appears on the Final POA. **No Principal can sign for another, and the Agent — if joining — joins as an observer only.** The Operator should refuse to proceed with notarisation unless **all** Principals (or their Authorised Signatories) are visibly present in the session. This is the notarial integrity check, not a platform-side gate (the platform cannot tell who is in the partner's video meeting); it is captured by the Operator's per-Principal `identity_verified` and `signature_observed` attestations in the Session-Completion Checklist (P1.15).
- AC: All Principals may attend the **same** session (the common co-owner case) or, at the Notary office's discretion, the office may run the notarisation such that Principals attend in sequence — V1 makes no platform-side requirement on session structure; the platform only relays one `partner_video_join_url` per Case and records the Operator's per-Principal attestations once the office considers signing complete. If a Principal fails to join, the no-show / missed-appointment flow (P1.17) applies to the Case as a whole.
- AC: The platform does not stream, monitor, record, transcribe, or pull any media or metadata from the partner's video service. Recording and transcription (if any) are entirely the Notary office's responsibility under whatever notarial authority licenses them. The Operator's Session-Completion Checklist (P1.15) is how the platform attests the session occurred — not via direct observation of the meeting.
- AC: If the Client does not join the session within `15 minutes` of the booked Slot start (Operator's judgement, attested in-platform), the Operator can record the no-show via `Mark Missed Appointment` — available from **Sub-status #12** once Slot start + 15 minutes has passed (the Operator is **not** required to click `Start session` to record a no-show) and from **Sub-status #13** (Client appeared to start then abandoned, or never appeared after the Operator opened the session). The outcome follows the No-Show Categorisation flow (P1.17).
- AC: **Branding limit.** The join experience is whatever the partner's video service provides. Contract Hubs branding appears only in the platform UI surrounding the link — the notification, the Case detail page's relay panel, and the appointment reminders — not inside the partner's video meeting.

### P1.15 — Session-Completion Checklist

After the Video Session ends, the Session Operator must complete a required checklist in the platform UI before the Case can advance.

- AC: When the Operator clicks `End session` in the platform UI (a state-machine action — independent of whether the partner's video meeting has actually ended), the Case enters Sub-status #14 (`Awaiting final POA`). A modal in the platform UI shows the **Session-Completion Checklist**:
  - **Per Principal** (the checklist repeats these two attestations for each `principals[i]`, each labelled with the Principal's name or company trade name):
    - `identity_verified`: "I have visually verified this Principal's identity against their uploaded passport or Emirates ID."
    - `signature_observed`: "I have observed this Principal (or the Authorised Signatory if the Principal is a Company) sign the document."
  - `notarial_reading_conducted`: "I have read the POA aloud to the Principal(s) and confirmed comprehension."
  - `recording_retained`: "I confirm the session was recorded and the recording is retained in our notarial system per our authority's policy."
  - **(Conditional, shown only if `english_translation_requested = true`)** `english_translation_prepared`: "I confirm the English translation has been prepared and stamped."
- AC: All shown attestations are required before the `Upload Final POA` button enables — including the per-Principal `identity_verified` and `signature_observed` for **every** Principal on the Case. Each attestation is captured with a checkbox + timestamp + actor — stored on the Case audit log.
- AC: The platform **does not** pull recordings or transcripts from the partner's video service. The recording lives wherever the Notary office's notarial system stores it, under whatever retention policy applies to that system. If the Notary office wants the recording attached to the Case (for the Client to download), the Operator uploads it manually via the standard documents primitive (Module 0 R5.1) — `document_type: notarial_recording` — but this is **optional** and at the office's discretion. The same applies to any transcript.
- AC: The Operator can save the checklist progress and finish it within a 4-hour window after session end; beyond that, the Case is flagged for Notary Admin review.

### P1.16 — Final POA upload and delivery (Arabic default; English add-on if requested)

After the Session-Completion Checklist is complete, the Acting Operator uploads the Final POA.

- AC: The Operator uploads at minimum the **Arabic Final POA** as `document_type: final_poa_ar`. Only PDF is accepted for any Final POA (other formats rejected — the Final POA is the legally-binding output and must be a single archival format).
- AC: If the Case has `english_translation_requested = true`, the Operator must **also** upload the **stamped English Final POA** as `document_type: final_poa_en`. The `Upload Final POA` action is gated — both files must be selected before submission can proceed when the Add-on is opted in. The English document must visibly carry the Notary's stamp/seal (Operator attests via `english_translation_prepared` in P1.15).
- AC: Once the required Final POA file(s) are uploaded, the Case advances to Sub-status #15 (`Final POA issued`), Global Status `Completed`. SLA timer stops. Notifications fire to Client, Agent, and the case thread.
- AC: The Client sees on their completed-Case page:
  - **`Download Final POA (Arabic)`** — always present.
  - **`Download Final POA (English with stamp)`** — present only if the Add-on was opted in.
  - Acting Operator's name and Notary office.
  - A `Request shipping` CTA (see below).
  - **`Download notarial recording`** — present **only if** the Notary office opted to upload the recording as a Case document under P1.15. If not uploaded, the Client is shown a one-line note that "The recording is retained by the Notary office per their authority's policy. Contact your Notary office if you need a copy." — pointing the Client at the right party.
- AC: **Shipping handoff:** clicking `Request shipping` on the completed-Case page creates a new Shipping Module Case (separate Case, separate payment) with `linked_case_id = poa_case.id`. The shipping form is pre-populated with the Client's address and the Final POA file(s) — both Arabic and English if both exist — as the package contents. The POA Case itself does not change — it remains `Completed`. (This is a cross-Module link; the POA Module does not import any Shipping Module code.)
- AC: The Final POA(s) are retained per the platform's KYC retention window (per Module 0 Open Question O7 — likely 7 years; carried over here). Recordings and transcripts, when uploaded, follow the same retention; when **not** uploaded (the default case), they are not the platform's responsibility — retention sits with the Notary office.

### P1.17 — Reschedule and No-Show (with Categorisation)

Three rescheduling paths exist on a POA Case: a free Client-initiated reschedule outside the cutoff window, and two no-show outcomes determined by the Operator's **No-Show Categorisation**.

**Free reschedule (outside the cutoff)**

- AC: A Client can reschedule a booked Slot any number of times **for free** — from sub-status #12 (`Appointment booked`), clicking `Reschedule` returns the Case to Sub-status #11 (`Awaiting booking`) and frees the previously-held Slot, provided the reschedule is initiated **more than 4 clock hours before the original Slot start** (`reschedule_cutoff_hours` from the Manifest — clock hours, not business hours, matching the Manifest's unit; a 09:00 Slot's cutoff is therefore 05:00 the same day).
- AC: A reschedule initiated within the 4-hour cutoff is treated as a no-show. Mechanically: the Slot is **freed immediately** and the Case returns to Sub-status #11 (`Awaiting booking`) with a `late_reschedule_pending_categorisation` marker; the Operator categorises the event through the same Categorisation form below within **48 hours**. If the Operator does not categorise within 48 hours, the event defaults to **excused** (Client-favourable) and the marker clears. An `unexcused` categorisation moves the Case from #11 to Sub-status #16 with the standard dispute window.
- AC: **Auto-assigned same-day appointment exemption.** A same-day appointment the platform auto-assigned (P1.13 *Two booking modes*) is exempt from the within-cutoff penalty for its **first** reschedule: because the Client did not choose the time and an auto-assigned Slot can legitimately fall inside the 4-hour window (it is booked with only `same_day_prep_buffer_hours` of lead time), the first reschedule of an auto-assigned Slot is always treated as a **free reschedule** regardless of the cutoff, returning the Case to Sub-status #11 (`Awaiting booking`). Subsequent reschedules follow the normal cutoff rule. This exemption is recorded on the Case audit log.

**No-Show Categorisation — required Operator attestation**

- AC: A Client no-show (failure to join within 15 minutes of the Slot start, P1.14) **does not** automatically credit the Wallet. Instead, the Operator must record the no-show via a `Mark Missed Appointment` action on the Case — available from Sub-status #12 (once Slot start + 15 minutes has passed) or #13, per P1.14 — which opens a required form:
  - **Category** (single-select, required): one of
    - `excused_technical_issue` — *"The Client was prevented from attending — or forced into a late reschedule — by a technical fault on our side or the video service."*
    - `excused_communication_issue` — *"The Client never received the join link / instructions, there was a delivery problem, or another communication failure caused the miss or late reschedule."*
    - `unexcused` — *"The Client did not attempt to join (or rescheduled late) without an acceptable reason."*
  - **Reason** (free text, 50–500 chars, required): a brief explanation captured for audit and shown to the Client.
- AC: Submitting the form transitions the Case from Sub-status #12 or #13 back to Sub-status #11 (`Awaiting booking`) with `was_rescheduled: true` (for a late-reschedule event the Case is already in #11 carrying the `late_reschedule_pending_categorisation` marker — the form clears the marker instead), and triggers the Categorisation Outcome below. The Categorisation, the Reason text, and the Operator's actor ID are stored on the Case audit log permanently — they cannot be edited after submission, only overridden by Notary Admin or Platform Admin.

**Categorisation Outcomes**

- AC: **Excused No-Show** (`excused_technical_issue` or `excused_communication_issue`): **free reschedule.** No Wallet credit, no penalty, no charge to anybody. The Case returns to Sub-status #11 (`Awaiting booking`) with `was_rescheduled: true`. The Client books a new Slot and the Case proceeds normally. The Client receives the `poa.no_show_excused` notification (P1.21) explaining what happened and inviting them to pick a new Slot.
- AC: **Unexcused No-Show** (`unexcused`): **no Wallet credit, no refund, no partial credit.** The Case is moved to Sub-status #16 (`Pending termination — unexcused no-show`) and a 7-day dispute window begins. During the window the Client can dispute (see below); if they don't dispute, or the dispute is upheld, the Case auto-advances to terminal T4 (`Cancelled — unexcused no-show`). The original Case payment **stands in full** — Notary keeps the Partner Share, Agent keeps the Top-up, Platform keeps the margin. The Translation Add-on fee, if charged, is also not refunded. The Client receives `poa.unexcused_no_show_pending_termination` immediately, with a clear two-CTA message:
  - **`Start a new POA Case`** — deep-link to the new-case picker with a one-click prompt to pre-fill the new Case from this one's data (Principal, Attorney, POA Details, uploaded documents). The pre-fill is a UX convenience only — the new Case is a fully independent Case requiring a new payment.
  - **`Dispute this categorisation`** — opens the dispute flow below.

**Client dispute path**

- AC: The Client can **dispute** an Unexcused Categorisation within **7 days** of entering Sub-status #16 by clicking `Dispute this categorisation` from the Case page. The dispute opens a Platform Admin queue item containing: the Operator's Reason text, the Client's free-text counter-explanation (required, 50–500 chars), the recorded notifications and any related case-thread messages. The Case stays in #16 while the dispute is being reviewed (the 7-day auto-advance to T4 pauses on dispute submission).
- AC: Platform Admin reviews the dispute and either:
  - **Upholds** the Operator's Categorisation → the Case advances immediately to terminal T4 (`Cancelled — unexcused no-show`). No refund. Client sees `poa.unexcused_no_show_case_terminated` with the `Start a new POA Case` CTA (the Notary Admin receives the `poa.no_show_dispute_resolved` meta-trigger — P1.21).
  - **Overturns** it to `excused_communication_issue` → the Case is **revived** back to Sub-status #11 (`Awaiting booking`). No money moves; no Wallet credit needed — the Client just picks a new Slot and the Case continues with the original payment standing. Client sees `poa.unexcused_no_show_overturned_case_revived` (the Notary Admin receives the `poa.no_show_dispute_resolved` meta-trigger — P1.21). The Operator's original Categorisation is preserved in the audit log alongside the overturn ruling.
- AC: A Notary Admin can also override an Operator's Categorisation internally within 24 hours of submission (e.g., the Admin agrees with the Client's complaint before it escalates). The internal override applies the same outcome rules as a Platform-Admin overturn — Case revives to #11.
- AC: If the 7-day dispute window expires without a dispute being filed, the Case auto-advances to T4. The Client receives `poa.unexcused_no_show_case_terminated` with the `Start a new POA Case` CTA.

**Gaming mitigation (only counts Unexcused)**

- AC: If the same Client has **2+ Unexcused no-show events** across any POA Cases within a 30-day window, the third and subsequent unexcused no-shows are flagged for Platform Admin review — no automatic Wallet credit; Platform Admin decides case-by-case.
- AC: **Excused no-shows do not count** toward the 30-day gaming-mitigation threshold. However, if the same Client accrues **3+ excused no-shows in 30 days**, the platform fires `poa.repeated_excused_no_shows_flagged` to Platform Admin so they can investigate whether the Notary office has a systemic link-delivery issue or whether the Client is gaming the excused category. No automatic action; Platform Admin reviews.

**Operator/Slot reassignment edge cases**

- AC: Per Notary Admin discretion, the Acting Operator can be reassigned (P1.10); if the new Acting Operator is not on-shift for the already-booked Slot, the Slot remains booked but the Session Operator field updates (Notary Admin sets it). If no Session Operator can be assigned to that Slot, the Slot is released and the Case returns to Sub-status #11 — with the Client notified via a high-priority channel (push + SMS). This is **not** a no-show — no Categorisation flow runs.

**Wallet PRD impact**

- AC: No Wallet PRD amendment is required for V1 no-show handling — neither outcome (Excused → free reschedule; Unexcused → terminate, no refund) moves any money automatically. The Excused outcome doesn't credit anyone; the Unexcused outcome leaves the original payment intact. Dispute overturn likewise doesn't move money — it just revives the Case.

### P1.18 — Notary rejection of a Case

A Notary Operator can reject a POA Case for legitimate legal reasons — suspected document fraud, illegal purpose, conflict of interest, etc. — in two windows: **pre-payment rejection** during Sub-status #6 (`Notary editing draft`) or #9 (`Client change requested`), and **post-payment rejection** during Sub-statuses #12–#14 (e.g. identity fraud discovered at the Video Session).

- AC: Rejection requires: a `reason` field (free text, 50–500 characters) and the **Notary Admin's countersignature** within 24 hours of the Operator's rejection. Until the Notary Admin countersigns, the Case sits in Sub-status #6 with a `pending_rejection` marker (visible only to Notary-office members).
- AC: On Notary Admin countersignature, the Case advances to terminal T2 (`Cancelled — rejected by notary`).
- AC: **Pre-payment rejection (#6/#9):** no payment has been taken at this point in the lifecycle, so **no refund path runs** — the Case terminates at T2 and the Client and Agent are notified. The `full_refund` default and the Platform Admin refund review apply only to post-payment rejections.
- AC: **Post-payment rejection (#12–#14):** rejection at T2 triggers the default refund path (`full_refund` per the Manifest): the Base Fee + Top-up, **the Translation Add-on fee if charged, and the Passport-Based Notarisation Add-on fee(s) if charged** are refunded to the Client via Platform Admin per WF1.10; the Partner Shares (base, translation, and per-Principal passport-notarisation) are reversed (or escalated to Finance if already paid out per WF1.10 conditional logic).
- AC: Platform Admin can override the default to `no_refund` only with documented `reason = suspected_fraud` — the override is audited and triggers an internal compliance review.

### P1.19 — SLA target (same business day)

POA carries one SLA: an end-to-end aggregate target. The stakeholder direction is **same business day** — measured in hours, not days.

- AC: `poa.aggregate_end_to_end_business_hours = 8`. The clock measures wall-time spent across all `In Progress` and `Awaiting Partner` Sub-statuses, **paused on every `Awaiting Client` Sub-status** (per Module 0 R4.1).
- AC: Business hours: Sunday–Thursday, 09:00–18:00 UAE. Configurable platform-wide by Platform Admin; per-Notary-office overrides allowed per SLAs PRD.
- AC: Under the same-business-day premise, a Case where the Client is responsive (documents uploaded, draft approved, paid, booked promptly) should reach `Final POA issued` within the same UAE business day it entered Sub-status #4 (`Documents submitted`). Any Client-side wait does not consume SLA budget.
- AC: SLA breach triggers escalation notifications to Notary Admin (primary), Platform Admin (secondary), and the Agency Admin of the Agent (if Agency-affiliated) — channel and templates per Messaging PRD MN2.
- AC: Per-Sub-status SLAs are **not** declared in V1; the end-to-end aggregate is the single SLA. Revisit per-step targets in V1.1 after observing real Notary partners.

### P1.20 — Notary internal notes

A Notary office's members can write internal notes on a Case, never visible to Client or Agent.

- AC: A Case carries a `notary_internal_notes` field — an append-only list of timestamped notes (author + body, 0–4000 characters per note). Notary-office members of the assigned office see these inline on the Case detail page in a dedicated panel; Platform Admin can also see them (audit / compliance).
- AC: Internal notes are **not** part of the Messaging PRD's case thread (MN6) — they are a separate Case field. They do not fire notifications.
- AC: Internal notes are part of the Case's permanent record and retained per the platform's retention policy.

### P1.21 — Notification triggers (POA-specific)

The POA Manifest declares the following triggers (consumed by Messaging PRD MN2). Each is a trigger key, default body / title template, and default channels.

| Trigger key | Fires when | Default recipients | Default channels |
|---|---|---|---|
| `poa.case_started` | Sub-status #1 entered | Originating Principal, Agent (if any) | `in_app`, `push`, `sms` (sms fires only on the Agent-initiated flow PF2, where the Client must be pulled into the Case via a deep-link) |
| `poa.principal_invited_to_verify` | A co-Principal is added and invited to verify (Case has >1 Principal, Sub-status #1) | The invited co-Principal (SMS), Originating Principal, Agent (if any) | `in_app`, `push`, `sms` |
| `poa.principal_verified` | A co-Principal completes Verification | Originating Principal, Agent (if any) | `in_app`, `push` |
| `poa.all_principals_verified` | Every Principal on the Case is Verified; Case can advance from #1 | Originating Principal, Agent (if any) | `in_app`, `push` |
| `poa.documents_requested` | Sub-status #3 entered | Client, Agent (if any) | `in_app`, `push`, `email` |
| `poa.draft_ready_for_notary` | Sub-status #5 entered | Notary office (all members) | `in_app`, `push` |
| `poa.acting_operator_assigned` | Sub-status #6 entered | Client, Agent | `in_app` |
| `poa.document_revision_requested` | Sub-status #7 entered | Client, Agent (if any) | `in_app`, `push`, `email` |
| `poa.draft_ready_for_client_approval` | Sub-status #8 entered | **Every Principal** (each must approve personally), Agent (if any) | `in_app`, `push`, `email` |
| `poa.principal_approved_draft` | A Principal records their Draft approval while others are still pending (Case has >1 Principal) | Originating Principal, Agent (if any) | `in_app` |
| `poa.all_principals_approved` | The last Principal approves; Case advances #8 → #10 | Every Principal, Agent (if any) | `in_app`, `push` |
| `poa.client_change_requested` | Sub-status #9 entered | Acting Operator, Notary Admin | `in_app`, `push` |
| `poa.payment_required` | Sub-status #10 entered | Client, Agent (if any) | `in_app`, `push`, `email` |
| `poa.payment_completed` | Payment success | Client, Agent | `in_app`, `push`, `email` (critical) |
| `poa.translation_addon_purchased` | Payment success with `english_translation_requested = true` | Acting Operator, Notary Admin | `in_app`, `push` |
| `poa.passport_notarisation_required` | Payment success with one or more Principals having `passport_notarisation = true` (so the office prepares to verify those Principals against passport in-session) | Acting Operator, Notary Admin | `in_app`, `push` |
| `poa.appointment_booked` | Sub-status #12 entered (covers both self-selected future-day and auto-assigned same-day bookings; the template surfaces the assigned time and, for auto-assigned same-day Slots, notes the appointment was auto-assigned as the earliest available today) | Client, Agent, Session Operator | `in_app`, `push`, `email` |
| `poa.no_slots_available` | Client opens booking picker and the Notary office has no published availability in next 14 days | Notary Admin (so they publish capacity) | `in_app`, `push`, `email` |
| `poa.appointment_cancelled_by_notary` | Notary Admin cancels a booked appointment (Slot taken offline post-booking) | Client, Agent, Platform Admin | `in_app`, `push`, `email` (critical) |
| `poa.video_link_required` | Slot reserved without `partner_video_join_url`; re-fires 4h and 1h before Slot if still empty | Session Operator, Notary Admin | `in_app`, `push` |
| `poa.video_link_provided` | `partner_video_join_url` is set after the 24h reminder has already fired | Client, Agent | `in_app`, `push`, `email` |
| `poa.video_link_missing_escalation` | 2h before Slot and `partner_video_join_url` still empty | Notary Admin, Platform Admin | `in_app`, `push`, `email` (critical) |
| `poa.appointment_reminder_24h` | 24h before Slot | Client (primary signer), Session Operator, Agent (if any) | `in_app`, `push`, `email` |
| `poa.appointment_reminder_2h` | 2h before Slot | Client (primary signer), Session Operator, Agent (if any) | `in_app`, `push` |
| `poa.appointment_reminder_15min` | 15min before Slot | Client (primary signer), Session Operator, Agent (if any) | `in_app`, `push` |
| `poa.acting_operator_reassigned` | Notary-Admin-initiated reassignment | Client, Agent | `in_app`, `push` |
| `poa.no_show_excused` | Operator categorised the no-show as `excused_technical_issue` or `excused_communication_issue`; Case returns to #11 for free rebooking | Client, Agent | `in_app`, `push`, `email` |
| `poa.unexcused_no_show_pending_termination` | Operator categorised the no-show as `unexcused`; Case in #16 with 7-day dispute window | Client, Agent, Notary Admin, Platform Admin | `in_app`, `push`, `email` (critical) |
| `poa.unexcused_no_show_case_terminated` | 7-day window expired without dispute, or dispute upheld; Case advanced to T4 | Client, Agent | `in_app`, `push`, `email` |
| `poa.unexcused_no_show_overturned_case_revived` | Platform Admin or Notary Admin overturned the Categorisation; Case revived to #11 | Client, Agent, Notary Admin | `in_app`, `push`, `email` |
| `poa.no_show_dispute_opened` | Client opened a dispute against an Unexcused Categorisation | Platform Admin | `in_app`, `push`, `email` (critical) |
| `poa.no_show_dispute_resolved` | Platform Admin upheld or overturned the Categorisation (this is a meta-trigger; the more specific `unexcused_no_show_case_terminated` and `unexcused_no_show_overturned_case_revived` carry the actionable content) | Notary Admin | `in_app` |
| `poa.repeated_excused_no_shows_flagged` | 3+ excused no-shows in 30 days for the same Client | Platform Admin | `in_app`, `email` |
| `poa.slots_now_available` | New Office Capacity Block published while a Case is waiting in #11 with no available Slot | Client | `in_app`, `push`, `email` |
| `poa.case_rejected` | T2 entered | Client, Agent, Platform Admin | `in_app`, `push`, `email` (critical) |
| `poa.final_poa_issued` | Sub-status #15 entered | Client, Agent | `in_app`, `push`, `email` (critical) |
| `poa.sla_breach` | End-to-end SLA target exceeded | Notary Admin, Platform Admin, Agency Admin | `in_app`, `push`, `email` |
| `poa.case_abandoned` | T1 entered (auto after 14d) | Client, Agent | `in_app`, `email` |
| `poa.case_expired` | T5 entered (auto after 14d idle in a pre-payment `Awaiting Client` Sub-status) | Client, Agent | `in_app`, `email` |
| `poa.stalled_case_escalation` | Case idle 30d in #11/#12, or booked Slot start passed 24h with no Operator action (P1.4) | Platform Admin, Notary Admin | `in_app`, `push`, `email` |

- AC: All triggers above are declarative in the Manifest; the Messaging PRD MN2 registry consumes them at module-registration time.
- AC: Users can adjust their per-trigger preferences within the limits each trigger declares (MN5); `critical`-tagged triggers cannot be disabled.
- AC: **Multi-Principal fan-out.** On a Case with more than one Principal, every trigger whose recipient list includes the "Client / primary signer" — specifically `poa.draft_ready_for_client_approval`, `poa.appointment_booked`, `poa.appointment_reminder_24h`, `poa.appointment_reminder_2h`, `poa.appointment_reminder_15min`, `poa.video_link_provided`, and `poa.final_poa_issued` — fans out to **all** Principals on the Case (each receives it on their own account), in addition to the Agent. This ensures every co-owner who must approve and sign personally gets the same situational awareness.

### P1.22 — POA-specific metrics

POA declares the following metrics for Platform Admin and Agency Admin dashboards.

- AC: **Conversion rate** = `Cases reaching Sub-status #10 / Cases reaching Sub-status #1` (the funnel drop-off the operator playbook explicitly tracks).
- AC: **Median time to completion** = median wall-clock duration from Sub-status #1 to Sub-status #15, computed over a configurable rolling window (default 30 days). Separate from the SLA timer — wall-clock includes `Awaiting Client` pauses.
- AC: **Drop-off by Sub-status** = histogram of the last Sub-status a Case held before entering **any** Cancelled terminal (T1–T5), shown per 30-day rolling window, with a per-terminal breakdown.
- AC: **Average revenue per POA** = mean of `Base Fee + Top-up + Translation Add-on (if any)` across `Final POA issued` Cases in the window.
- AC: **No-show rate** = `no-show events / appointments booked` in the window, per Notary office — split into `excused_no_show_rate` and `unexcused_no_show_rate`. A high excused rate at one Notary office is a signal of video-link reliability problems on that office's side; a high unexcused rate is a signal of Client friction (link, timing, awareness). Both are surfaced as separate scorecards in Platform Admin's POA health view.
- AC: **Unexcused no-show termination rate** = `Cases reaching T4 / unexcused no-show events` in the window. **Restart rate** = `new POA Cases that pre-fill from a terminated T4 Case / T4 terminations` in the window — how often Clients come back after losing a Case to unexcused no-show. A low restart rate combined with a high T4 rate is a strong signal that the no-credit policy is driving Clients away rather than disciplining them.
- AC: **No-show dispute rate** = `disputes opened / unexcused no-shows` in the window. **Dispute overturn rate** = `disputes overturned / disputes resolved`. A high overturn rate is a signal that Operators are mis-categorising no-shows as unexcused too aggressively; a high terminated-without-dispute rate is a signal that Clients aren't reading the notification or are simply walking away.
- AC: **English Translation Add-on attach rate** = `Cases with english_translation_requested = true / Cases reaching Sub-status #10` in the window.
- AC: **Resident vs Non-resident Case mix** = share of Cases by Principal Verification method (UAE Pass vs Passport) in the window.
- AC: **Individual vs Company Principal mix** = share of Cases by Principal type in the window (computed across the `principals` list).
- AC: **Single vs multi-Principal mix** = share of Cases by Principal count (1 vs 2+) in the window, with a secondary breakdown of multi-Principal Cases by `principal_authority_mode` (`joint` vs `several`). Surfaced for Platform Admin to size demand for co-owner POAs and to inform the per-Principal pricing Open Question (P1.1).
- AC: All POA metrics are visible to Platform Admin; the conversion rate, average revenue per POA, and Add-on attach rate are also visible to Agency Admins for their Agency's Cases.

### P1.23 — Client dashboard (My POAs view)

Every Client has a POA-specific dashboard view inside the platform's role-tailored dashboard (Module 0 R7.1).

- AC: The view appears as `Dashboard → My POAs` in the Client Active Role Context. It is the Client-side counterpart to the Agency Admin's "every case my agents own" view.
- AC: The view lists every POA Case in which the current user is **any Principal** — i.e. their `individual_id` appears in the Case's `principals` list (as a Principal Individual or as a Company Principal's Authorised Signatory) — in a table with columns: Case ID (short), POA Type (Property / General), Principal display name (for a single-Principal Case, the Individual's name or the Company trade name; for a multi-Principal Case, the lead name plus "+N" — e.g. "Ahmed Khan +1"), Sub-status (humanised), Notary office, wall-clock since creation, **next action expected of this user** (an action label like "Verify your identity", "Approve draft (your approval pending)", "Waiting on other Principals to approve", "Pay", "Book slot", "Join video session", "Download Final POA", or "Done — no action needed" — computed for *this* user's outstanding Principal-Only Actions, not the Case as a whole), and a `View case` deep-link.
- AC: Filters: by POA Type, by Global Status, by Active vs Completed, by `english_translation_requested`, by date range (created in last 7 / 30 / 90 days / all time).
- AC: Sort: by created date (default desc), by Sub-status, by wall-clock.
- AC: A summary strip at the top shows counters: `Active`, `Awaiting your action`, `Completed (last 30 days)`.
- AC: Clicking a Case row deep-links to the standard Case detail page (the same page the Agent and Operator see, with role-appropriate visibility).
- AC: The dashboard is available on web and mobile with parity (Module 0 R9.1's React Native parity rule).
- AC: A Client with **zero POA Cases** sees an empty state with two CTAs: `Start a POA Case` (deep-link to new-case picker) and `Learn how it works` (short marketing screen — non-blocking, can be removed).

### P1.24 — Agent permissions on a POA Case (near-full proxy)

When an Agent is attached to a POA Case (via the Agent-initiated flow PF2, or by the Agent being the original Solo creator), the Agent acts as a **near-full proxy** for the Principal(s). Every action on the Case is open to the Agent **except the two Principal-Only Actions** defined in CONTEXT.md — and those two actions are non-delegable **per Principal**: on a multi-Principal Case, neither the Agent nor the Originating Principal nor any co-Principal may approve the Draft or sign in the Video Session on another Principal's behalf. Each Principal performs both actions from their own login / in-session presence. **Payment is not a Principal-Only Action** — it remains delegable to any party (the Agent, the Originating Principal, or any Principal who chooses to pay), per the payment AC below.

**What the Agent CAN do on the Client's behalf:**

- AC: Fill the Principal-info form, the Attorney(s) section (including authoring multiple Attorneys and choosing the Attorney Authority Mode), and the POA Details form (P1.5, P1.6, P1.7).
- AC: Upload every required document on the checklist (P1.8) — passport copies, Emirates IDs, trade licenses, title deeds, etc. — even though the documents legally belong to the Principal.
- AC: Re-upload a document flagged `Needs revision` by the Operator (P1.8).
- AC: Click **`Request change`** on the Draft preview screen (P1.12) and submit revision comments to the Operator — this is feedback, not legal consent, so it is open to the Agent.
- AC: **Pay for the Case** at Sub-status #10 (P1.12) using the Agent's own payment method, including opting into the English Translation Add-on. The Wallet PRD postings (WF1.5) are unchanged — Notary office Wallet receives the Partner Share, Platform Revenue receives the platform margin, the Agent's Wallet receives the Top-up. The Agent's **net out-of-pocket cost** is `Base Fee + Translation Add-on (if any) − Top-up earned`; reimbursement between Agent and Client happens **off-platform**, not via the platform's ledger.
- AC: Book a Slot on the Client's behalf (P1.13), reschedule outside the cutoff for free, or initiate a reschedule inside the cutoff (which then enters the Operator-Categorisation flow per P1.17).
- AC: Dispute an Unexcused No-Show Categorisation within the 7-day window (P1.17) on the Client's behalf.
- AC: Start a new POA Case after a terminated T4 — using the Client's previous Case data via the pre-fill prompt — on the Client's behalf.
- AC: Request shipping of the Final POA on the completed-Case page (P1.16) — chains to a Shipping Module Case.

**What the Agent (and any party acting for another Principal) CANNOT do — the two Principal-Only Actions, enforced per Principal:**

- AC: **`Approve draft`** at Sub-status #8 (P1.12) — the platform enforces server-side that the actor must be the **specific Principal whose approval is being recorded** (the Principal Individual or that Principal's Authorised Signatory). A call by the Agent, the Originating Principal, or any co-Principal to approve a row that is not theirs returns 403 with an error message that nudges them to send the Case link to the Principal in question. The Case advances only when **all** Principals have approved (N-of-N).
- AC: **Sign in the Video Session** at Sub-status #13 (P1.14) — **every** Principal (or their Authorised Signatory) must be visible to the Operator and sign personally; no Principal signs for another, and the Agent may only observe. The Operator's per-Principal `identity_verified` and `signature_observed` attestations in the Session-Completion Checklist (P1.15) are the integrity gate.

**Notification recipients on Client-action triggers**

- AC: When an Agent is attached to a Case, the following triggers — which were Client-only in earlier drafts — now include **Agent (if any)** as a recipient: `poa.documents_requested`, `poa.document_revision_requested`, `poa.draft_ready_for_client_approval`, `poa.payment_required`, `poa.appointment_reminder_24h`, `poa.appointment_reminder_2h`, `poa.appointment_reminder_15min`. The Principal still always receives them — the addition ensures the Agent has the same situational awareness without having to poll the dashboard. The full updated recipient lists are in P1.21.

**Audit trail**

- AC: Every Case action records the `actor_individual_id` and the `actor_role_context` (`Client` / `Agent (solo)` / `Agent in Acme Realty` / etc.) so the Case audit log clearly distinguishes which actions came from the Principal directly and which came from the Agent acting on their behalf. This matters for: dispute resolution, Notary-side compliance review, and any future legal challenge to a Case.

## Key User Flows

The platform shell, role context, login, registration, role switching, verification, business invites, and the cash-out request flow are all owned by Module 0 and Wallet & Finance PRDs and are not restated here. Below are the POA-specific end-to-end flows.

### PF1 — Start a POA Case (Client direct)

**Trigger:** A Verified Client opens the new-case picker and selects POA.
**Actors:** Client.
**Pre-conditions:** Client is logged in. `verification_status` is **any Verified** value (`Verified (UAE Pass)` or `Verified (Passport)`) — P1.1 requires `any Verified`, no method-specific gate. Client is acting in `Client` Active Role Context.
**Success outcome:** A POA Case exists in Sub-status #1, with the Client as the Principal (Individual or Authorised Signatory of a Company).

**Happy path:**

1. Client opens `New Case → Power of Attorney`. Sees two cards: `Property POA` and `General POA`.
2. Client picks a card. Case is created in Global Status `Open`, Sub-status `Capturing principal info`.
3. **"Who is the Principal?"** screen — the Originating Principal's own row is pre-added (`Myself (an Individual)` or `A Company I represent`). The Client can `+ Add another Principal` (e.g. a co-owner) up to **5 Principals** total per Case — each added row asks `An Individual` / `A Company`.
4. **Basic Information form** (P1.5) loads with branches conditional on each Principal's choice:
   - **Individual Principal:** Name and (if resident, UAE Pass) Emirates ID pre-filled, read-only for the Originating Principal and any already-verified co-Principal. Client enters passport number, email, mobile. Residency status is recorded based on Verification method.
   - **Company Principal:** Company fields appear (trade name, license number, jurisdiction, office address). Authorised Signatory section pre-fills from the relevant Verified record; Client enters signatory's role within the company.
   - **For each co-Principal added,** the Client enters that co-owner's mobile number; the platform sends them an invite-to-verify (Module 0 R1.7). The Case **cannot leave Sub-status #1** until every co-Principal has verified (P1.5). If a second (or more) Principal row exists, a **Principal Authority Mode** selector appears, required: `joint` / `several`.
5. Then **`Attorneys` section** with one row pre-added — *"Who is this Attorney?"* with two cards (`An Individual` / `A Company`); subsequent fields render per P1.5. The user can `+ Add another Attorney` up to **5 Attorneys** total per Case. If the user adds a second (or more) Attorney row, an **Attorney Authority Mode** dropdown appears at the bottom of the section, required: `joint` / `several` / `joint_and_several` (with the per-power split form unlocking on `joint_and_several`).
6. Client clicks `Continue`. (If any co-Principal is still unverified, the Case holds at Sub-status #1 with a `pending_principal_verification` marker until they complete Verification; the originator and Agent are notified on each verification.)
7. **POA Details form** (P1.6 or P1.7 depending on Type) loads. Client fills required fields. Clicks `Continue`. Case advances to Sub-status #3 (`Awaiting documents`); SLA timer pauses (Awaiting Client).
8. **Document checklist** loads with required documents flagged based on POA Type, Principal residency, and Principal/Attorney being Individual vs Company (P1.8). Client uploads each. As the last required document is uploaded, the Case auto-advances to Sub-status #4; SLA timer resumes.
9. **Bilingual draft generation** runs (P1.9). Case briefly enters Sub-status #4a (`Generating draft`) — Client may navigate away; a notification fires when the Draft is ready for notary review.
10. Case advances to Sub-status #5; Client now sees their Case page with status `Awaiting notary review`. SLA timer is running.

**Branches and edge cases:**

- **Client is Unverified** — the new-case picker shows POA greyed out with a "Verify your identity to continue" CTA that routes through F7 (UAE Pass) or F8 (Passport). On Verification, the picker re-enables and the Client can proceed.
- **Client abandons mid-form** — the Case stays in `Open` and the relevant Sub-status; the abandonment sweeper (P1.4) cancels it after 14 days of inactivity.

### PF2 — Start a POA Case (Agent on behalf of Client)

**Trigger:** Agent in any role context opens the new-case picker and selects POA, then enters a Client mobile number.
**Actors:** Agent (initiator), Client (recipient).
**Pre-conditions:** Agent is Verified (R1.7 transaction gate). Agent's active role context allows POA Module visibility (per Module 0 R3.6).
**Success outcome:** Case is in Sub-status #1 with the Client as Principal; Client receives an SMS link to log in and continue.

**Happy path:**

1. Agent picks `POA → Property POA` (or General) from the new-case picker; enters Client's mobile number.
2. The platform checks whether an Individual exists with that number and whether they are Verified (by any method):
   - Any-Verified Individual → Case is created with that Individual as the Principal (the platform does not assume `Individual` vs `Company` Principal type; Client picks at PF1 step 3); an SMS notifies the Client (`poa.case_started` trigger), deep-linking into the Principal-type step. Agent sees the Case in their pipeline with Sub-status `Capturing principal info — waiting on Client`.
   - Unverified Individual → Agent sees the "Invite this client to verify" prompt (Module 0 R1.7); on confirm, the Client receives an SMS link routing them through F7 (UAE Pass) **or** F8 (Passport) — Verification method is the Client's choice — then into PF1 step 3. The Case is created only after the Client's Verification is complete — until then, Agent sees a `pending_client_verification` placeholder, not a Case.
   - No Individual with that mobile → Agent sees "Invite this client to verify"; on confirm, Client receives an SMS link routing them through F1 (registration) → F7 / F8 (Verification of their choice) → PF1 step 3.
3. Agent enters their Top-up amount (within the Agency's POA cap, or platform Solo cap if Solo). On the unverified / unregistered branches — where no Case exists yet — the Top-up is stored on the `pending_client_verification` placeholder and bound to the Case at creation. The Top-up applies once the Case reaches Sub-status #10.
4. **From this point forward, the Agent can take every subsequent action on the Client's behalf** (per P1.24): filling Principal / Attorney(s) / POA Details forms, uploading documents, requesting Draft changes, **paying with the Agent's own payment method** (opting into the Translation Add-on as needed), booking and rescheduling Slots, and disputing an unexcused no-show. The Client receives the same notifications throughout so they can step in at any point — but they are only **required** to act for the two Principal-Only Actions:
   - **Approve Draft** at Sub-status #8 — the platform refuses the Agent's approval call (P1.12).
   - **Sign in the Video Session** at Sub-status #13 — the Operator verifies the Client / Authorised Signatory in-session; the Agent can observe but cannot substitute (P1.14).

**Branches and edge cases:**

- **Multiple Principals (co-owners).** The Agent can add co-Principals in the Principal section (P1.5) and enter each one's mobile number; each receives the same invite-to-verify SMS as the primary Client. The Case holds at Sub-status #1 until **all** Principals verify. The Agent may then fill forms, upload documents, pay, and book for everyone — but **each Principal must approve the Draft and sign in the Video Session personally** (the Agent cannot do either for any Principal, P1.24).
- **Client never verifies** — the placeholder remains in Agent's pipeline; no Case is created; auto-cleanup after 14 days. On a multi-Principal Case, if any one Principal never verifies, the Case stays in #1 and is subject to the same 14-day abandonment sweep.
- **Client abandons after starting** — same auto-cancellation logic as PF1. (The Agent's prior work fills the Case data, but the Case still needs the Client's Verification before it can reach Sub-status #2.)
- **Agent pays for the Case** — Wallet PRD postings (WF1.5) credit the Notary office (Partner Share), Platform Revenue (margin), and the Agent's own Wallet (Top-up) — same as if the Client had paid. The Agent reconciles with the Client off-platform.

### PF3 — Notary picks up a Case and reviews the bilingual Draft

**Trigger:** A Case enters Sub-status #5 (`Awaiting notary review`) after assignment to a Notary office (P1.11).
**Actors:** Notary Operator (initiator); Notary Admin (secondary observer).
**Pre-conditions:** Operator is a member of the assigned Notary office.
**Success outcome:** Operator becomes Acting Operator; reviews bilingual Draft; advances Case to Sub-status #8 (Client approval).

**Happy path:**

1. Operator opens `Workspace → POA queue` — sees Cases in Sub-status #5 for the office.
2. Operator clicks `Self-assign` on a Case → becomes the Acting Operator; Case advances to Sub-status #6 (`Notary editing draft`).
3. Operator opens the Case detail page. Sees bilingual Draft (Arabic + English, LLM-polished, default for both), uploaded documents, Principal / Attorney data (with party-type flags surfaced), Case thread (per Messaging PRD MN6).
4. Operator reviews. Can:
   - Edit the Draft in unlocked zones — in Arabic, in English, or both. Each save creates a new `draft.version`.
   - Toggle to the raw template-merge version (per language) with one click for comparison.
   - Flag a document `Needs revision` with a reason — Case advances to Sub-status #7; Client is notified via `poa.document_revision_requested`.
   - Reject the Case with a reason — see P1.18, requires Notary Admin countersignature within 24h.
   - Mark Draft `ready for client approval` — Case advances to Sub-status #8; Client is notified via `poa.draft_ready_for_client_approval`.

**Branches and edge cases:**

- **Operator self-assigns then becomes unavailable** — Notary Admin reassigns (P1.10). Reassignment fires `poa.acting_operator_reassigned`; Client sees a system message in the case thread.
- **No Operator picks up within the SLA window** — SLA breach fires `poa.sla_breach`; Notary Admin and Platform Admin are notified. The Case stays in Sub-status #5 until picked up.

### PF4 — Client approves Draft, pays (with optional Translation Add-on), books a Slot

**Trigger:** Case enters Sub-status #8 (`Awaiting client approval`).
**Actors:** Client (initiator); Acting Operator (secondary in case of change request).
**Pre-conditions:** Operator has marked Draft ready (P1.10).
**Success outcome:** Case is in Sub-status #12 (`Appointment booked`) with a confirmed Slot, the Session Operator assigned, and (if applicable) `english_translation_requested = true` recorded. The `partner_video_join_url` is initially empty — the Operator/office provides it before the appointment per P1.13.

**Happy path:**

1. Every Principal receives `poa.draft_ready_for_client_approval`; each opens the Case from their own login.
2. Each sees the bilingual Draft preview (Arabic + English). Two actions: `Approve` and `Request change`.
3. Each Principal clicks `Approve` from their own login (no one can approve for another). On a single-Principal Case, that one approval advances the Case to #10 (`Awaiting payment`). On a multi-Principal Case, the Case shows "X of N approved" and advances to #10 only when **all** Principals have approved (`poa.all_principals_approved` fires). Any `Request change` resets pending approvals and sends the Case to #9.
4. **Payment screen** shows: Base Fee (1,500 AED, or per-Agency override), Agent Top-up if any, **Translation Add-on toggle** (+250 AED, pre-set from the Case's translation-intent flag captured at Sub-status #2; switchable off freely, on only if the assigned office is translation-capable — P1.12), Client Wallet credit applied if available (per WF1.11), total. Apple Pay / card.
5. Client (optionally) toggles Translation Add-on on; total recalculates.
6. Successful payment → WF1.5 postings fire (Client charge in; Partner Share credit to Notary office Wallet for Base Fee component; Platform Revenue credit for the Platform margin; Top-up credit to Agent Wallet; **additionally if Add-on opted in**: 200 AED to Notary office Wallet and 50 AED to Platform Revenue). Case advances to Sub-status #11 (`Awaiting booking`). Client gets `poa.payment_completed`. If Add-on opted in, `poa.translation_addon_purchased` fires to Acting Operator and Notary Admin so they know to prepare the English copy.
7. **Booking screen** shows next 14 days of Slots from the assigned Notary office's Office Capacity Blocks (P1.13). Client picks a Slot; clicks `Confirm`. Slot is reserved atomically; if it was just taken by someone else, Client sees "Just taken — please pick another" and the list refreshes.
8. On Slot reservation: the Case advances to Sub-status #12, the Session Operator defaults to the Acting Operator unless the Notary Admin has overridden it, and `poa.appointment_booked` fires to Client, Agent, and Session Operator. The platform does **not** create any video meeting (per ADR-0004 — POA's session is partner-hosted). The `partner_video_join_url` field starts empty; `poa.video_link_required` fires to the Session Operator and Notary Admin so they know to provide the join link before the appointment (P1.13).

**Branches and edge cases:**

- **Client clicks `Request change`** — modal collects 50–2000 characters of comments; submission moves Case to Sub-status #9 (`Client change requested`); Operator is notified.
- **Payment fails** — Client sees retry screen; Case stays in Sub-status #10; no Wallet postings; if Client abandons, the 14-day expiry sweeper applies (T5, P1.4).
- **No Slots available in next 14 days** — Client sees "No available slots — we'll notify you when new slots open" message; the Case stays in Sub-status #11; the system fires a notification to the Notary Admin so they can publish more capacity. When new Slots are published, `poa.slots_now_available` fires to the Client.

### PF5 — Video Session (partner-hosted) and Final POA delivery

**Trigger:** Booked Slot start time arrives.
**Actors:** Client, Session Operator (initiator on Operator side); Agent observer optional.
**Pre-conditions:** Case is in Sub-status #12, with `session_operator_id` set and ideally `partner_video_join_url` set (if not yet set by 2 hours before Slot, the escalation flow from P1.13 will have fired).
**Success outcome:** Case is in Sub-status #15 (`Final POA issued`); Client can download Arabic Final POA (and English if the Add-on was opted in).

**Happy path:**

1. 15 minutes before Slot — `poa.appointment_reminder_15min` fires to Client and Session Operator. If `partner_video_join_url` is set, the notification carries the link; if not, it nudges the Operator to provide it. Operator's Case detail page now shows `Start session` button.
2. The Operator starts the video session in their notarial video tool (Dubai Courts system / Ministry of Justice e-Notary / private notary system / whatever the office is licensed to use). The Client joins via the `partner_video_join_url` already shown on their Case page (and in their notifications).
3. Operator clicks `Start session` in the **platform UI** (this is a state-machine action, independent of whether the partner's meeting has technically started) → Case advances to Sub-status #13 (`Video session in progress`).
4. Session runs in the partner's video tool — notarial reading in Arabic and/or English depending on Client preference, signature, etc. The platform does not observe the session content.
5. Operator clicks `End session` in the platform UI after the notarial session concludes. Case advances to Sub-status #14 (`Awaiting final POA`).
6. **Session-Completion Checklist** modal appears (P1.15). Operator ticks `notarial_reading_conducted`, `recording_retained`, the **per-Principal** `identity_verified` and `signature_observed` for **every** Principal on the Case, plus `english_translation_prepared` if `english_translation_requested = true`. Each tick is audit-logged. On a multi-Principal Case the Operator must not proceed unless all Principals (or their Authorised Signatories) signed.
7. With checklist complete, `Upload Final POA` button enables. Operator uploads the **Arabic Final POA PDF**. If Add-on opted in, the upload form requires **two files** — Arabic and stamped English — and submission is gated until both are attached. Operator may also (optionally) upload the notarial recording as a Case document — at the office's discretion.
8. Case advances to Sub-status #15 (`Final POA issued`); SLA timer stops; Wallet PRD WF1.5 postings are unchanged (already posted at payment time). `poa.final_poa_issued` fires to Client and Agent.

**Branches and edge cases:**

- **Client doesn't join within 15 minutes** — Operator opens `Mark Missed Appointment` and selects a No-Show Category (P1.17): `excused_technical_issue` (Client tried to join but the link/service failed), `excused_communication_issue` (Client never received the link), or `unexcused` (no acceptable reason). The Operator also enters a free-text Reason. The outcome follows:
  - **Excused** → Case returns to Sub-status #11 with a `was_rescheduled: true` flag; *no Wallet credit, no penalty*; `poa.no_show_excused` fires to Client and Agent inviting a free rebooking.
  - **Unexcused** → Case moves to Sub-status #16 (`Pending termination — unexcused no-show`); **no Wallet credit, no refund**; `poa.unexcused_no_show_pending_termination` fires to Client (critical) with two CTAs: `Start a new POA Case` (deep-link with optional pre-fill from this Case's data) and `Dispute this categorisation` (valid 7 days). If the 7-day window expires without a dispute, the Case auto-advances to terminal T4 (`Cancelled — unexcused no-show`); `poa.unexcused_no_show_case_terminated` fires. If the dispute is overturned by Platform Admin or Notary Admin, the Case is revived to #11 for a free rebooking; `poa.unexcused_no_show_overturned_case_revived` fires.
- **Partner-Provided Video Link was never entered** — escalation from P1.13 has already fired; if the appointment time arrives without a link, Notary Admin / Platform Admin manually contact the Operator or reschedule the Case (Operator marks the Case as needing reschedule; Case returns to Sub-status #11 with a system-message explanation).
- **Partner's video service is broken at session time** — the Operator switches to a backup video tool (their authority's fallback procedure) and pastes the new join link into the case thread (Messaging PRD MN6). The platform's state-machine progression (`Start session` → `End session`) is unaffected — it's driven by the Operator's clicks in the platform UI, not by any signal from the video service.
- **English translation requested but Operator forgot to prepare it** — the `english_translation_prepared` attestation in the Session-Completion Checklist is the gate; if the Operator attempts to advance without it, the platform refuses and shows a clear inline message. If the Operator needs more time to prepare the translation, they can park the Case in Sub-status #14 — the SLA timer continues; the Operator returns later to complete the checklist and upload both files.

## Cross-references back to Module 0 and sibling PRDs

- `M0:R1.1` — role context. P1.3 introduces `Notary Admin` and `Notary Operator` Business-scoped Roles inside the `notary_office` sub-type; P1.23 introduces the POA-specific dashboard surface inside the `Client` Active Role Context.
- `M0:R1.3` — one-Business-at-a-time. P1.3 confirms Notary Operator follows this rule; Notary Admin can be held in multiple offices.
- `M0:R1.5` — Business creation by Platform Admin. P1.3 adds the translation-capable flag and notarial-video-system label as profile fields for `notary_office`. *(M365 tenant binding is no longer required for POA — ADR-0004's POA exception removes it.)*
- `M0:R1.7` — verification gate. P1.1 declares `any Verified` as POA's manifest-level verification requirement (both UAE Pass and Passport accepted); PF1 / PF2 consume both F7 (UAE Pass) and F8 (Passport) verification flows.
- `M0:R2` / Cases PRD — the case lifecycle. P1.4 uses the standard six Global Statuses + module-declared Sub-statuses; no Module 0 enum extension.
- `M0:R3.1` — Module Manifest. P1.1 is the complete POA Manifest; every other requirement in this PRD declares a value the Manifest consumes.
- `M0:R3.6` — per-Business module activation. POA can be disabled per Agency or per Notary office; the new-case picker respects both global and per-Business toggles.
- `M0:R4.1` / SLAs PRD — SLA timer mechanics. P1.19 declares `poa.aggregate_end_to_end_business_hours = 8` (same business day).
- `M0:R5.1` — documents primitive. P1.8, P1.9, P1.15, P1.16 all consume the platform's documents capability; the Arabic Final POA (and optional English Final POA) are always stored as Case documents. Notarial recordings and transcripts are stored as Case documents **only when** the Notary office chooses to upload them (P1.15) — there is no automated pull from a partner video service.
- `M0:R7.1` — role-tailored dashboards. P1.23's `Dashboard → My POAs` view is a POA-specific surface inside the Client dashboard.
- `M0:R8.1` — Zoho one-way sync. POA Cases sync on create and on every status change; field mapping in `poa_zoho_field_map.yaml`. Company-as-Principal data is mapped to a "company contact" Zoho object (mapping detail in the engineering doc).
- `M0: Non-Goal #9` — corporate clients deferred. POA V1's Company-as-party support is a constrained workaround at the Module level (Companies live as Case-level data, not as Module 0 Business entities); promoting them to first-class is a future Module 0 amendment.
- `WF1.2` — Fee Model declaration. P1.1 declares `Fixed`; the Wallet PRD does not need amending for this.
- `WF1.3` — per-Agency Base Fee override. POA is `Fixed`, so this override path applies.
- `WF1.4` — Top-up Cap. P1.1 declares `top_up_enabled: true`, default Solo cap 200 AED, Agency-cap ceiling 500 AED.
- `WF1.5` — payment-in postings. POA payment fires the standard four-entry ledger posting at Sub-status #10 → #11 transition (Client charge in, Partner Share to Notary office Wallet, Platform's margin to Platform Revenue, Top-up to Agent Wallet); if the Translation Add-on is opted in, two additional postings extend WF1.5 (translation Partner Share to Notary office Wallet, translation Platform margin to Platform Revenue) — requires a Wallet PRD amendment for Module-declared per-Case add-on line items, to be agreed with Finance before V1 freeze.
- `WF1.10` — refunds. P1.18 (Notary rejection) uses WF1.10's default refund path, extended to include the Translation Add-on fee where applicable.
- `WF1.11` — Client Wallet credits. Used only by Platform Admin's manual goodwill / referral / cashback path. POA does not rely on automated Module-state-machine credits — the no-show flow neither credits nor refunds automatically.
- `MN2` — declarative trigger registry. P1.21 lists every POA notification trigger.
- `MN6` — case threads. POA inherits the case thread for Client + Agent + Acting/Session Operator conversation; the POA Module does not ship its own chat.
- `MN7` — message types. State transitions in P1.4 fire system messages into the thread.
- `MN8` — case-thread notifications. The `case.thread.new_message` trigger fires on every user message in a POA Case thread.
- `ADR-0004` — Contract Hubs platform video stack is Microsoft Teams, with POA as the explicit exception. POA's video session is **partner-hosted** (the Notary office's own notarial video system); the platform's role is to relay the Operator-provided join link and run the surrounding state machine. P1.13, P1.14, P1.15, and PF5 implement the relay model.

---

## Appendix A — State-transition table (normative)

This table is the **declared state machine** that P1.4's server-side validation enforces: any (from, event) pair not listed here is an illegal transition and returns 400. States are referenced by canonical key (P1.4). Per P1.4, **every** transition additionally fires a system message into the case thread (MN7); the Side effects column lists only effects beyond that. Display numbers appear in parentheses as a reading aid only.

| From | Event / action | Actor | Guard(s) | To | Side effects |
|------|----------------|-------|----------|----|----|
| — | Case created (POA Type picked) | Client / Agent | Actor Verified; on the Agent flow (PF2) the Client must be Verified first — otherwise a `pending_client_verification` placeholder, not a Case | `capturing_principal_info` (1) | `poa_type` frozen; `poa.case_started` |
| `capturing_principal_info` (1) | Continue past Basic Information | Client / Agent | All Principal + Attorney required fields complete; **every Principal Verified** (P1.5); authority modes set where ≥2 parties | `capturing_poa_details` (2) | — |
| `capturing_poa_details` (2) | Continue past Details form | Client / Agent | Required P1.6 / P1.7 fields complete (incl. translation-intent toggle state) | `awaiting_documents` (3) | Checklist generated (P1.8); `poa.documents_requested`; SLA pauses |
| `awaiting_documents` (3) | Last required document uploaded | System (auto) | All `required` docs `upload_status = uploaded` | `documents_submitted` (4) | SLA resumes |
| `documents_submitted` (4) | Draft generation starts | System | — | `generating_draft` (4a) | — |
| `generating_draft` (4a) | Generation completes (or 60s fallback to raw template) | System | — | `awaiting_notary_review` (5) | Notary office assigned (P1.11 round-robin + translation-capable filter); `poa.draft_ready_for_notary`; fallback audit-logged if it occurred |
| `awaiting_notary_review` (5) | Self-assign | Notary Operator | Operator is a member of the assigned office; first claim wins (atomic) | `notary_editing_draft` (6) | `acting_operator_id` set; `poa.acting_operator_assigned` |
| `notary_editing_draft` (6) | Flag document(s) `needs_revision` | Acting Operator | Reason per document | `document_revision_requested` (7) | `poa.document_revision_requested`; SLA pauses |
| `document_revision_requested` (7) | All flagged docs re-uploaded | Client / Agent | — | `notary_editing_draft` (6) | Acting Operator retained + notified; SLA resumes |
| `notary_editing_draft` (6) | Mark `ready for client approval` | Acting Operator | Both language drafts non-empty (P1.10) | `awaiting_client_approval` (8) | `poa.draft_ready_for_client_approval` (fans out to all Principals) |
| `awaiting_client_approval` (8) | Recall | Notary Admin | No Principal has approved yet; reason required | `notary_editing_draft` (6) | Client + Agent notified |
| `awaiting_client_approval` (8) | `Approve draft` (per Principal) | The specific Principal / their Authorised Signatory | Actor owns the row — 403 otherwise (P1.12) | stays (8) until N-of-N, then `awaiting_payment` (10) | `principals[i].draft_approved` set; `poa.principal_approved_draft`; on last approval `poa.all_principals_approved` + `poa.payment_required` |
| `awaiting_client_approval` (8) | `Request change` | Any Principal or Agent | Comments 50–2000 chars | `client_change_requested` (9) | **All** `draft_approved` flags reset (audited); `poa.client_change_requested` |
| `client_change_requested` (9) | Re-mark ready | Acting Operator | Comments addressed; both language drafts non-empty | `awaiting_client_approval` (8) | `poa.draft_ready_for_client_approval` |
| `client_change_requested` (9) | Flag document(s) `needs_revision` | Acting Operator | Reason per document | `document_revision_requested` (7) | as the #6 → #7 row |
| `notary_editing_draft` (6) / `client_change_requested` (9) | Reject — **pre-payment** | Acting Operator, countersigned by Notary Admin ≤ 24h | Reason 50–500 chars; `pending_rejection` marker until countersign | `cancelled_rejected_by_notary` (T2) | No refund path (nothing paid); `poa.case_rejected` |
| `awaiting_payment` (10) | Payment succeeds | Client / Agent / any Principal | Non-resident `passport_notarisation` flags auto-corrected to `true` if needed (P1.12) | `awaiting_booking` (11) | WF1.5 postings + add-on postings; `poa.payment_completed`; conditional `poa.translation_addon_purchased`, `poa.passport_notarisation_required` |
| `awaiting_booking` (11) | Slot reserved | Client / Agent (future-day self-select) or System (same-day auto-assign) | Atomic `reserve(slot_id)`; same-day: before office cutoff and Slot ≥ now + prep buffer (P1.13) | `appointment_booked` (12) | `session_operator_id` defaulted to Acting Operator; `poa.appointment_booked`; `poa.video_link_required` |
| `appointment_booked` (12) | Free reschedule | Client / Agent | Outside 4h cutoff, **or** first reschedule of an auto-assigned same-day Slot (P1.17) | `awaiting_booking` (11) | Slot freed; `was_rescheduled: true` |
| `appointment_booked` (12) | Late reschedule (within cutoff) | Client / Agent | — | `awaiting_booking` (11) | Slot freed; `late_reschedule_pending_categorisation` set — Operator categorises ≤ 48h, default excused; `unexcused` then moves (11) → (16) |
| `appointment_booked` (12) | Cancel appointment | Notary Admin | Explicit cancel action (booked Slots protected from Slot-blocking) | `awaiting_booking` (11) | `poa.appointment_cancelled_by_notary` (critical); reason in thread |
| `appointment_booked` (12) | No Session Operator assignable to Slot | Notary Admin | — | `awaiting_booking` (11) | Slot released; high-priority notify (push + SMS); **not** a no-show |
| `appointment_booked` (12) | `Start session` | Session Operator | — | `video_session_in_progress` (13) | State-machine action only — no platform video meeting |
| `appointment_booked` (12) / `video_session_in_progress` (13) | `Mark Missed Appointment` → excused | Session Operator | From (12): ≥ Slot start + 15 min; category + reason 50–500 chars | `awaiting_booking` (11) | `was_rescheduled: true`; `poa.no_show_excused`; no money moves |
| `appointment_booked` (12) / `video_session_in_progress` (13) | `Mark Missed Appointment` → unexcused | Session Operator | same | `pending_termination_unexcused_no_show` (16) | `poa.unexcused_no_show_pending_termination` (critical); 7-day window starts; payment stands |
| `video_session_in_progress` (13) | `End session` | Session Operator | — | `awaiting_final_poa` (14) | Session-Completion Checklist opens (P1.15) |
| `awaiting_final_poa` (14) | Upload Final POA | Acting Operator | Checklist complete incl. per-Principal attestations; Arabic PDF; + stamped English PDF if `english_translation_requested` | `final_poa_issued` (15) | SLA stops; `poa.final_poa_issued` (critical) |
| `appointment_booked` (12) / `video_session_in_progress` (13) / `awaiting_final_poa` (14) | Reject — **post-payment** | Acting Operator, countersigned by Notary Admin ≤ 24h | e.g. identity fraud at session; reason 50–500 chars | `cancelled_rejected_by_notary` (T2) | Full refund incl. both add-ons; Partner Shares reversed (P1.18 / WF1.10); `poa.case_rejected` |
| `pending_termination_unexcused_no_show` (16) | Dispute opened | Client / Agent | Within 7 days; counter-explanation 50–500 chars | stays (16) | Auto-advance paused; `poa.no_show_dispute_opened` (Platform Admin queue) |
| `pending_termination_unexcused_no_show` (16) | Window expires / dispute upheld | System / Platform Admin | — | `cancelled_unexcused_no_show` (T4) | No refund; `poa.unexcused_no_show_case_terminated` |
| `pending_termination_unexcused_no_show` (16) | Dispute overturned / Notary Admin override ≤ 24h | Platform Admin / Notary Admin | — | `awaiting_booking` (11) | No money moves; `poa.unexcused_no_show_overturned_case_revived` |
| `capturing_principal_info` (1) / `capturing_poa_details` (2) | 14 days idle | System (sweeper) | — | `cancelled_abandoned` (T1) | `poa.case_abandoned` |
| `awaiting_documents` (3) / `document_revision_requested` (7) / `awaiting_client_approval` (8) / `awaiting_payment` (10) | 14 days idle | System (sweeper) | Pre-payment by construction | `cancelled_expired` (T5) | `poa.case_expired` |
| Any pre-payment Sub-status (1–10) | Cancel — wrong type | Client / Agent | No payment taken | `cancelled_wrong_type_selected` (T3) | Reason `wrong_type_selected` recorded |
| `awaiting_booking` (11) / `appointment_booked` (12) | 30 days idle, **or** Slot start + 24h with no Operator action | System (sweeper) | Post-payment — never auto-cancels | stays | `poa.stalled_case_escalation` — escalation only, no transition (P1.4) |

---

## Appendix B — Case data model (consolidated)

A consolidated view of every POA-Case field introduced across this PRD, with type, owner, and **mutability window**. The cited section governs behavioural detail; this appendix governs field names and mutability — a conflict between the two is a documentation bug to be fixed, not interpreted. "Until #4" means until the Case leaves `documents_submitted`; changes after that point go through the Operator-flagged revision flow (P1.5 / P1.10).

### B.1 — Case-level fields

| Field | Type | Set when / by | Mutability | Ref |
|-------|------|---------------|------------|-----|
| `poa_type` | enum `property_poa` \| `general_poa` | Case creation, Client / Agent | **Immutable** — wrong type → cancel (T3) + new Case | P1.2 |
| `global_status`, `sub_status_key` | enums (P1.4) | State machine | Server-only, per Appendix A | P1.4 |
| `originating_principal` | ref into `principals` | Case creation (Agent flow: first Principal entered) | Immutable; row not removable | P1.5 |
| `principals[]` | list of Principal (B.2), 1–5 | Sub-status #1 | Rows add/remove until #4; after: revision flow | P1.5 |
| `principal_authority_mode` | `joint` \| `several` \| `n_a` | #1 (required when ≥ 2 Principals; else `n_a` server-side) | Until #4 | P1.5 |
| `attorneys[]` | list of Attorney (B.3), 1–5 | #1 | Rows add/remove until #4; after: revision flow | P1.5 |
| `attorney_authority_mode` | `joint` \| `several` \| `joint_and_several` \| `n_a` | #1 (required when ≥ 2 Attorneys) | Until #4 | P1.5 |
| `property_details` | object — emirate, property type, project/building, unit, purpose[], title deed no.?, Oqood no.? | #2 (Property POA only) | Until #4 | P1.6 |
| `general_details` | object — purpose description, powers[], per-power joint/several split (cond.), validity preference | #2 (General POA only) | Until #4 | P1.7 |
| `english_translation_requested` | bool, default `false` | #2 Details form | Until payment confirmation; on→ at payment only if office translation-capable | P1.6 / P1.7 / P1.12 |
| `documents[]` | list of Document (B.4) | Checklist generated on #2 → #3 | See B.4 | P1.8 |
| `draft` | object — `version`, `raw_template_output_{ar,en}`, `llm_polished_output_{ar,en}` | Generated at #4a | Operator edits unlocked zones in #6 / #9; every save increments `version` | P1.9 |
| `assigned_notary_office_id` | id | On #4a → #5 (round-robin + translation filter) | Platform Admin manual reassignment only | P1.11 |
| `acting_operator_id` | id | Self-assign at #5 → #6 | Immutable except Notary Admin reassignment (reason required) | P1.10 |
| `session_operator_id` | id | Defaults to Acting Operator at booking | Notary Admin reassignable per Slot | P1.13 |
| `appointment` | object — `slot_id`, start time | #11 → #12 | Changed only via the reschedule / no-show flows | P1.13 / P1.17 |
| `partner_video_join_url` | well-formed URL | During #12, Session Operator or Notary Admin | Editable until session start; escalation timers watch it (P1.13) | P1.13 / P1.14 |
| `partner_video_instructions` | text ≤ 1000 chars | Same | Same | P1.13 |
| `was_rescheduled` | bool | Set on any return #12 → #11 | System-only | P1.4 / P1.17 |
| `late_reschedule_pending_categorisation` | marker + 48h deadline | Late reschedule | Cleared by Operator categorisation or 48h default-excused | P1.17 |
| `pending_principal_verification` | marker per unverified Principal row | Co-Principal invited | Cleared on that Principal's Verification | P1.5 |
| `pending_rejection` | marker (office-visible only) | Operator rejection | Cleared by Notary Admin countersign (→ T2) or 24h lapse | P1.18 |
| `no_show_events[]` | list — category, reason, operator id, timestamp, dispute record | `Mark Missed Appointment` / late reschedule | Append-only; category immutable post-submit (Admin override only) | P1.17 |
| `payment` | object — base fee, top-up, passport add-on lines[], translation add-on, wallet credit, total, payer, paid-at | Payment success at #10 | Frozen at payment | P1.12 / WF1.5 |
| `notary_internal_notes[]` | append-only — author, body ≤ 4000 chars, timestamp | Any time, assigned-office members | Append-only; never visible to Client / Agent; Platform Admin can read | P1.20 |
| `linked_case_id` | id (on the Shipping Case, pointing here) | `Request shipping` post-completion | — | P1.16 |
| Manifest snapshot | values the Case was created under | Case creation | Immutable (in-flight Cases keep their Manifest) | P1.1 |

### B.2 — `principals[i]`

| Field | Type | Set when / by | Mutability | Ref |
|-------|------|---------------|------------|-----|
| `type` | `individual` \| `company` | Row creation at #1 | Immutable past #1 | P1.5 |
| `individual_id` | id | Bound at that Principal's Verification | Immutable once bound | P1.5 |
| `full_name` | string | Originator placeholder → **overwritten by Verified name** | Read-only once verified | P1.5 |
| `residency_status` | `resident` \| `non_resident` | Derived from Verification method (UAE Pass / Passport) | Locked once verified; independent of `passport_notarisation` | P1.5 |
| `emirates_id_number` | string? | From UAE Pass | Absent for Passport-verified; read-only | P1.5 |
| `passport_number` | string (required for all) | #1 | Until #4 | P1.5 |
| `email`, `mobile` | strings | #1 (mobile drives invite-to-verify) | Until #4 | P1.5 |
| `passport_notarisation` | bool | #1 toggle; **forced `true` for non-residents** | Until #4; after: revision flow; server auto-corrects at payment (P1.12) | P1.5 |
| `draft_approved` | bool + timestamp + actor | Only by **this** Principal / their Authorised Signatory (403 otherwise) | Reset to `false` for all rows by any `Request change` | P1.12 |
| Company variant | trade name, license no., jurisdiction, office address, Authorised Signatory {name, individual_id, verification method, relationship} | #1 | Until #4 | P1.5 |

### B.3 — `attorneys[i]`

| Field | Type | Mutability | Ref |
|-------|------|------------|-----|
| `type` | `individual` \| `company` | Immutable past #1 | P1.5 |
| Individual variant | full name, passport / Emirates ID no., relationship to Principal | Until #4; after: revision flow | P1.5 |
| Company variant | trade name, license no., jurisdiction, Authorised Signatory name + ID, Signatory role | Until #4; after: revision flow | P1.5 |

No Verification gate on Attorneys in V1 — they are Case data only (P1.5).

### B.4 — `documents[i]`

| Field | Type | Owner | Ref |
|-------|------|-------|-----|
| `document_type` | enum from checklist rules (incl. `final_poa_ar`, `final_poa_en`, `notarial_recording`) | System (checklist) / Operator (finals) | P1.8 / P1.16 |
| `required` | bool | Checklist generation | P1.8 |
| `upload_status` | `pending` \| `uploaded` | Client / Agent (uploads); replace keeps version history (R5.1) | P1.8 |
| `review_status` | `pending_review` \| `approved` \| `needs_revision` | Set `pending_review` on upload; changed only by Notary Operator in #5–#6 / #9 | P1.8 |
| `uploaded_by`, `reviewed_by` | actor ids | System | P1.8 / P1.24 (audit) |
