# Contract Hubs — Messaging & Notification PRD — V1

**Status:** Draft v0.4
**Owner:** Product (Ala)
**Target launch:** 2026-10-03 (aligned with Module 0)

**Changelog:**
- v0.4 — Added voice messages as a thread media type (MN7) and a per-user upload storage quota (MN7, default 500 MB, configurable).
- v0.3 — Merged the v0.2 (revised) expansion (new MN10 reliability, MN11 search, MN12 urgent messages; hardening across MN1–MN9). Carried forward the @mention removal: @mentions remain excluded (Non-Goal). Where the revised draft leaned on @mentions (one-thread mitigation, mute piercing, away-summary), those now rely on unread markers, search, and the Urgent path instead.
- v0.2 — Removed @mention functionality from case threads.
- v0.1 — Initial draft.

**Scope:** the in-app **Notification Center** (primary channel for ~90% of platform communication), **multi-channel delivery** (push, email, SMS as fallbacks and escalations), and **case-scoped threads** — the human-to-human conversation rooted in each case. This PRD intentionally starts narrow and grows. Out-of-case chat, team channels, and voice/video are not in V1.

**Sibling PRDs:** Module 0 (identity, roles), Cases PRD (case lifecycle and participants), Wallet & Finance PRD (payment notifications), SLAs PRD (breach notifications), per-module PRDs (each declares its own notification triggers in its manifest).

---

## Problem Statement

Real estate cases in Dubai live in WhatsApp today — every POA, every Golden Visa application, every conveyancing handover spawns a parallel WhatsApp group where the client, agent, and partners hash out who needs which document next. The conversation that owns the transaction lives outside the platform, so the platform never owns the transaction.

Contract Hubs only replaces WhatsApp for these workflows if it makes the case itself the conversation — every case has its own thread, every participant joins automatically when they join the case, and every status update appears in the thread next to the messages that drove it. We are not building a chat app. We are building case-scoped conversation infrastructure, plus the Notification Center that pulls users back to it.

The hard part is not the data model — it is parity with what WhatsApp does effortlessly: immediate, reliable delivery and a frictionless mobile experience, without flooding people, and the ability to reach a stakeholder fast when something is blocking the deal. Users drift back to WhatsApp the moment the replacement feels slower, less reliable, or noisier than the group chat they already have — or the moment they need someone right now and the platform can't get through. Every requirement in this PRD is therefore measured against one bar: as immediate and reliable as WhatsApp, quieter day-to-day, and able to break through when it matters.

## Goals

1. **The Notification Center is the canonical inbox.** Every user — Client, Agent, Agency Admin, partner, Platform Admin — has one place where things needing attention land, with a deeplink that drops them exactly where the work is.
2. **Every case has exactly one thread, and participants are derived from the case.** A POA case with a client, agent, and notary office has a 3-way thread; participants change automatically as partners are assigned or unassigned.
3. **Triggers are declarative.** Modules, Wallet, SLAs, and Module 0 all declare notification triggers in their manifests; the platform owns delivery. No module ships its own SMS or email code.
4. **Multi-channel with sane defaults.** In-app is always on; push, email, and SMS are fallbacks and escalations governed by trigger configuration and user preferences.
5. **Conversations are part of the audit trail.** Thread messages, system events, and notification deliveries are all permanently recorded against the case.
6. **Reliable and quiet by default, loud when it matters.** Notifications are delivered exactly once per device, never lost, never duplicated; a busy case produces a summary, not a storm — but a participant can flag something urgent and break through to the other stakeholder immediately. Reliability, noise-control, and a working urgent path are first-class product requirements, not implementation details — together they are the difference between leaving WhatsApp and going back to it.

## Non-Goals

1. **Out-of-case chat, team channels, DMs.** There is no chat between users that isn't anchored to a case in V1. (Agency Admin → Agent management lives in the Agency workspace, not as DMs.)
2. **Voice and video _calls_.** Real-time calling is out of scope. Video for notary sessions is handled by the POA module's specific integration, not this PRD. (Note: the urgent-message path in MN12 is the V1 answer to "I need to reach them now" — it is not a call, but it breaks through like one.) This is distinct from asynchronous **voice messages**, which _are_ in V1 — see MN7.
3. **End-to-end encryption.** Transport encryption (TLS) and encryption-at-rest are in scope; E2E key management is not.
4. **Translation.** Module 0 ships English-only; this PRD does too. Architecture is Arabic-ready — see MN2 (templates are locale-keyed from day one, only `en` populated).
5. **Bulk messaging, broadcasts, marketing campaigns.** Operational communication only. (This boundary is also a compliance boundary — see MN9.)
6. **Inbound email / SMS reply parsing.** If we send an email about a case, the user cannot reply to that email and have the text show up in the thread. Reply happens in-app. (Architecturally kept open for V2.)
7. **Self-service trigger configuration.** Only Platform Admin can change which triggers exist and their default channels. Users adjust their own preferences within the limits each trigger declares.
8. **@mentions.** Directing a message at a specific participant within a thread is not in V1. The "reach a specific person now" need is served instead by the Urgent path (MN12); routine findability is served by search (MN11). (Architecturally kept open for V2.)
9. **Typing indicators and live presence.** Deferred to post-V1. They add immediacy and "this is alive" feel, but require always-on real-time infrastructure and add little to an audit-first B2B workflow. Documented as a known WhatsApp-parity gap; revisit in V2.
10. **Per-message read receipts.** Deferred. Read receipts create response pressure and have privacy implications across the Client/Agent/Partner boundary. The lightweight acknowledgement reaction in MN7 — and the mandatory acknowledgement on urgent messages in MN12 — cover the real "did they see it" need more appropriately. Revisit only if users explicitly demand per-message confirmation everywhere.
11. **Sub-threads / topic-splitting within a case thread.** V1 is one flat thread per case. Long, multi-topic cases are mitigated with unread markers, jump-to-unread, and search (MN6, MN11) rather than nested threads. Topic-splitting is a documented post-V1 need.

## User Stories

### Client
- As a Client, I want to see all my pending actions in one Notification Center so I'm not chasing emails or WhatsApp messages.
- As a Client, I want a notification when my agent needs something from me (e.g., re-upload my passport photo) with a deeplink that takes me straight to the upload screen.
- As a Client, I want to message my agent inside the case so we don't end up on WhatsApp.
- As a Client, I want to be notified when a new message arrives on my case thread so I don't have to keep checking.
- As a Client, I don't want a 2am push for a routine comment — but I do want to be reached immediately if something critical happens (a payment fails, a deadline is at risk). (Quiet hours with critical override — MN5.)

### Agent (Solo or Agency member)
- As an Agent, I want a single feed of every notification across all my cases so I can triage by what needs me next.
- As an Agent, I want to message my client and the assigned partner (e.g., notary) inside the case thread so the whole conversation is in one place and survives any handoff.
- As an Agent, I want to send a quick message and have the client get notified immediately, without thinking about which channel.
- As an Agent, when something is blocking a case right now — the notary appointment is in two hours and a document is wrong — I want to reach the client and partner immediately, breaking through quiet hours and mute, and know they've seen it, without leaving the platform for WhatsApp or a phone call. (Urgent messages — MN12.)
- As an Agent, when I start typing a reply and get interrupted, I want my draft to still be there when I come back — on whichever device I pick up next. (Drafts — MN7.)
- As an Agent, I want to find the message where the client agreed to something three weeks ago, without scrolling the whole case. (Search — MN11.)
- As an Agent, when a case gets busy, I want one summary — "5 new messages in the Khalifa POA" — not twenty separate pings. (Digest/bundling — MN8.)

### Partner-Business member (Notary Operator, Lawyer, etc.)
- As a Notary Operator, when I'm assigned to a POA case, I want to be added to the case thread automatically so I can ask the agent and the client clarifying questions without leaving the platform.
- As a Notary Operator, when I discover a blocker shortly before a notary session (expired ID, missing signature, wrong document), I want to flag the message urgent so the agent and client are alerted on every channel at once and I can see who has acknowledged. (Urgent messages — MN12.)
- As a Notary Operator, I want notifications about cases assigned to me to be clearly distinct from cases I'm watching or have completed.

### Agency Admin
- As an Agency Admin, I want notifications about agency-level events — agent invites accepted, agents leaving, monthly settlement complete — so I can keep tabs without staring at the dashboard.
- As an Agency Admin, I want a read-only view of any case thread in my agency without becoming a participant or being mistaken for one.

### Platform Admin
- As a Platform Admin, I want notifications about system events — Zoho sync failures, wallet reconciliation exceptions, abuse reports — so the platform stays healthy without me polling.

### Multi-role user
- As a multi-role user, I want a single Notification Center showing everything across my roles, with each item tagged for which role it's for and a deeplink that switches into the right context.
- As a multi-role user, I want the bell badge count to make sense — I never want to see a badge with nothing behind it, or tap something on my phone and have my laptop still show it as unread. (Cross-device read-state sync — MN1.)

## Requirements

**Convention.** Each requirement lists acceptance criteria (AC) that must be individually testable. **[V1]** = required for launch. **[V1.1]** = strongly desired in V1, may slip to immediate fast-follow. **[V2]** = explicitly deferred, recorded here so the V1 design doesn't foreclose it.

**MN1 — Notification Center as the canonical inbox.**
Every user has an in-app Notification Center available from a bell icon in the top nav. It is the primary delivery channel for every notification on the platform and the system of record for notification state.
- [V1] A notification has: `id`, `recipient`, `type` (trigger key), `title`, `body`, `deeplink`, `role_context` (which of the user's roles this is for), `priority` (`normal` | `critical`), `created_at`, plus three independent state timestamps: `seen_at` (rendered in the feed), `read_at` (opened/interacted), `archived_at` (cleared from the active list) — all nullable.
- [V1] `priority: critical` may originate from a system trigger (MN4 examples) or from a human-flagged urgent message (MN12). The inbox treats both identically (elevated, top of list).
- [V1] Read/seen/archived are distinct states, not one flag. Badges count unseen items by default (configurable to unread); the rule must be stated so it cannot drift.
- [V1] Center shows unread first, then read, ordered by `created_at` desc.
- [V1] Center supports filtering by role context (when the user has multiple roles) and by case (when the notification ties to a case).
- [V1] Notification grouping. Multiple notifications of the same trigger type for the same case collapse into one inbox row ("5 new messages in Khalifa POA"), expandable on tap. The inbox must not show one row per message for a chatty case. (Urgent messages — MN12 — are never grouped; they stand alone and pinned.)
- [V1] Bulk actions: mark all read; mark all read within a filter; archive read.
- [V1] Cross-device read-state sync. Read/seen state is server-authoritative and pushed to all of the user's live sessions in real time (WebSocket/SSE). Reading on one device updates every other device and the app-icon badge within seconds. The badge is always derived from the server count, never computed locally.
- [V1] Badge rule for multi-role users (explicit). The bell badge reflects the unseen count for the user's currently active role context; switching roles recomputes it from the server. The OS app-icon badge reflects the total unseen across all roles. This split is stated so QA can assert it and it cannot drift.
- [V1] Center is available on web and mobile with parity.

**MN2 — Declarative trigger registry.**
Notifications are emitted via a registry of typed triggers. Each trigger is declared by the system or module that owns the event. Modules declare their triggers in the manifest (Module 0 R3.1).
- [V1] A trigger declaration includes: `key` (stable, e.g., `case.status_changed`, `poa.notary_review_complete`, `wallet.cashout_paid`), `default_title_template`, `default_body_template`, `default_channels`, `priority`, `user_disable_allowed` (boolean), `category` (one of: `transactional`, `case_activity`, `security_account`, `administrative` — drives MN5 grouping and MN4 override logic), and `delivery_mode` (`immediate` | `batchable` | `digestible`) with an optional `grouping_key` (e.g., `case_id`).
- [V1] Templates are locale-keyed and versioned. Title/body templates are keyed by locale (`en` populated in V1; structure is Arabic-ready) and carry a version. The audit trail (MN9) records the template key + version used, so we can always reconstruct exactly what text a user was sent.
- [V1] Emitting code never composes a notification by hand — it calls the registry with the trigger key and a payload; the registry renders the template.
- [V1] Adding a new trigger ships with the module's manifest; no platform release is required.
- [V1] Platform Admin can enable / disable any trigger globally per environment (audited).

**MN3 — Deeplinks.**
Every notification carries a deeplink that drops the user on the exact screen where the work happens.
- [V1] Deeplinks work on web (URL) and mobile (universal links / app links).
- [V1] Deferred deep linking. If a recipient taps a push/SMS/email link without the app installed, the link routes through install and still lands on the correct case after first launch. (Universal/App Links alone do not handle the not-installed case; this matters for onboarding users migrating from WhatsApp.)
- [V1] Validate destination + permission before navigating. The platform confirms the target screen exists and the user still has access before navigating; otherwise it shows the "no longer available" screen.
- [V1] When the deeplink target requires a role context different from the user's active context, the platform prompts to switch (Module 0 R1.1) before navigating.
- [V1] Tapping a notification marks it read and navigates in one action.
- [V1] A deeplink targeting a case the user no longer has access to (e.g., agent removed from agency) shows a clear "no longer available" screen, not an error.
- [V1] Link-wrapping caution. If any outbound channel (SMS now; email post-V1) uses click-tracking/URL-wrapping, it must be verified not to break universal-link resolution; otherwise disable wrapping for deeplink URLs.

**MN4 — Multi-channel delivery: push, email, SMS as fallbacks.**
In-app delivery is always on. Other channels are governed by user preference and trigger configuration.
- [V1] Channels: `in_app` (always), `push` (mobile, when installed), `email` (when verified email on account — post-V1 per Module 0 R1.2), `sms` (always available; every account has a verified mobile per Module 0 R1.2).
- [V1] A trigger's `default_channels` list applies for a user who has not customized their preferences.
- [V1] Critical override. `critical` triggers (security alerts, identity verifications, payment paid / failed, cash-out paid, case completed) deliver to in-app AND at least one outbound channel regardless of preferences and regardless of quiet hours (MN5). Human-flagged urgent messages (MN12) use this same override path.
- [V1] Escalation cascade (not just "one outbound"). For critical notifications (system or urgent), delivery escalates on non-acknowledgement: in-app → if unseen after N minutes → push → if still unseen after M minutes → SMS. The unread windows (N, M) are configurable per criticality. (`normal` triggers do not escalate.) MN12 builds its escalation on this cascade.
- [V1] Throttle + auto-batch (not just rate-limit). Outbound channels rate-limit per user (configurable). Crucially, overflow events are rolled into a digest (MN8), not dropped — a chatty case must never silently lose a notification, and must never flood SMS. Urgent messages (MN12) are exempt from throttling/batching and always send immediately (subject to MN12's own per-sender rate limit).
- [V1] Delivery failures (SMS bounce, email bounce, push token invalid) are recorded and retried per channel rules (see MN10); in-app delivery is never dropped.

**MN5 — User preferences.**
Users can adjust per-trigger channel preferences in Settings, within the limits declared by the trigger.
- [V1] Settings → Notifications shows every trigger the user is eligible for, grouped by category (Cases, Wallet, Memberships, System — mapped from MN2 categories), with toggles per channel. Target 5–10 visible groups in 2–4 sections; never a flat wall of toggles.
- [V1] Triggers where `user_disable_allowed = false` show as read-only with a one-line explanation ("required for security").
- [V1] Quiet hours / Do-Not-Disturb (timezone-aware) with critical bypass. Users can set a quiet-hours window during which normal outbound notifications are suppressed (deferred to a digest or to window end); `critical` notifications — including urgent messages (MN12) — always break through. The window is timezone-aware (the user's timezone is captured and stored). Default to a sensible window (e.g., 22:00–07:00 local) that users can change or disable. Per-channel nuance is allowed (a late email may be fine while a late push is not).
- [V1] Digest frequency preference. For digestible categories, the user can choose immediate vs. periodic digest (e.g., hourly / daily).
- [V1] Inline access. A "manage notifications" affordance is reachable from the bell and from within a thread (the per-thread mute in MN8 links here). Most users never open Settings; preferences must be reachable in context.
- [V1] Preference changes take effect on the next notification.
- [V1] Multi-role users see triggers for all their roles in a single Settings screen, grouped by role.

**MN6 — Case threads: one per case, participants derived from the case.**
Every case has exactly one thread. Thread membership is derived from the case's participants — when a participant is added or removed at the case level, thread membership updates automatically.
- [V1] A case thread is created at case creation and lives for the case's lifetime (and beyond — threads are not deleted).
- [V1] Default participants: the case's Client, the assigned Agent, and any assigned Partner (e.g., Notary Operator for POA). The Agency Admin of the Agent's Agency is **not** a participant by default but has a read-only Agency-Admin view of the thread.
- [V1] Agency-Admin read-only view is modeled as a non-participant. It never appears in participant-derived membership, never counts toward N-way membership, and never triggers "active viewer" suppression (MN8) for others. (It may optionally be an escalation fallback target for urgent messages — see MN12 — but is never a default recipient.)
- [V1] Participant changes (Agent reassignment, Partner assignment / unassignment) are reflected immediately and recorded as a system message in the thread.
- [V1] Removed-participant boundary (explicit). A removed participant retains read access to messages from their period of participation only — their visibility is frozen at the removal timestamp. They cannot post new messages and cannot see messages posted after removal. (This is the defensible position for a regulated transaction; stated so it is testable and audit-clear.)
- [V1] 2-way, 3-way, and N-way threads are all the same primitive — there is no separate "group chat" model.
- [V1] Catch-up UX. A user re-entering a thread sees an unread divider and a "jump to first unread" control. Long threads must not force manual scrolling to find what's new.

Note: one-thread-per-case is correct for V1; topic-splitting/sub-threads are a documented [V2] need (see Non-Goals), mitigated in V1 by unread markers and search (MN11).

**MN7 — Message types in a thread.**
Threads support user messages, system messages, and attachments.
- [V1] User message: plain text, up to 4000 characters. (Markdown rendering [V2].)
- [V1] Urgent flag at composition. When composing a message, a participant can flag it Urgent, invoking MN12's delivery and acknowledgement behavior. Urgent is a deliberate, non-default action.
- [V1] Attachment: any file type the documents section accepts (Module 0 R5.1 — PDF, JPG, PNG, DOCX, ≤ 25 MB), shown inline with a link into the case's documents section. Attachments are malware-scanned on upload, generate a thumbnail/preview where possible, and inherit the case's retention/immutability (MN9). Define max attachments per message.
- [V1] Voice message. A participant can record and send an audio message in-thread: tapping a microphone button in the composer starts recording; the user can review, then send or discard. Voice messages are a first-class media message type — recorded, not uploaded as a file — and render inline with a play control, duration, and a waveform; they play without leaving the thread.
  - [V1] Captured in a compressed audio format (e.g., AAC/Opus/m4a); max duration is configurable (default 5 minutes). Each voice message counts toward the per-user storage quota below and against the documents-section size limit (≤ 25 MB).
  - [V1] Voice messages inherit the case's retention/immutability and audit rules (MN9) exactly like attachments; the 5-minute author delete window applies. Outbound notifications follow MN8 (new-message) and never include audio in the body (no-PII rule, MN9) — the deeplink opens the thread to play it.
  - [V1] Available on web and mobile with parity (mic permission requested at first use). Server-side malware scanning applies as for any uploaded media.
  - [V2] Automatic transcription of voice messages (Arabic-ready, English first) — deferred; useful for search (MN11) and accessibility, recorded so the design doesn't foreclose it.
- [V1] Per-user upload storage quota. Each user has a configurable total-storage quota for everything they upload to the platform — case attachments, voice messages, and any other uploaded media, summed across all cases. Default 500 MB per user; Platform Admin can change the default and override per user (audited).
  - [V1] As the user approaches the limit, the UI warns at a configurable threshold (default 90%); when the quota is reached, new uploads (files and voice messages) are blocked with a clear message and a path to free space or request an increase. Posting text messages is never blocked by quota.
  - [V1] Quota usage is computed from stored bytes and surfaced to the user (e.g., "412 MB of 500 MB used") and to Platform Admin. Because uploaded media inherits case retention/immutability (MN9), space is **not** automatically reclaimed by deleting a message within the 5-minute window — see Open Questions for how reclamation interacts with retention.
- [V1] System message: emitted by the platform on case state changes, document uploads, payment events, partner assignment, SLA milestones. Visually distinct, de-emphasized (lighter weight than human messages), non-editable, addressed to no one specifically. Consecutive system messages may be collapsed so they don't drown human conversation (the Linear/GitHub activity-feed pattern).
- [V1] Drafts. An unsent message draft persists per thread across navigation and app backgrounding, and syncs across the user's devices. (Baseline WhatsApp/Slack expectation on mobile; its absence makes the app feel inferior.)
- [V1.1] Reactions / acknowledgements. A minimal reaction set (e.g., 👍 / ✓) lets a participant acknowledge "seen/agreed" without posting a noise-generating "ok" message. This is the preferred, quieter alternative to read receipts (which are a Non-Goal) and reduces thread clutter in operational back-and-forth.
- [V1] Messages cannot be edited in V1.
- [V1] Messages can be deleted by the author within 5 minutes of sending — deletion replaces the body with "Message deleted," is auditable, and is visible to other participants.
- [V1] Delete-window reconciliation (race condition). If a message is deleted within the 5-minute window after an outbound notification already fired, the inbox row is updated to the tombstone and any deeplink resolves to "Message deleted." (Already-delivered SMS/push cannot be recalled; the in-app record is authoritative.)
- [V1] Every message records `author`, `created_at`, and the `case_id` it belongs to.

**MN8 — Case-thread notifications.**
A new message in a thread fires a notification to every other participant.
- [V1] Notification trigger key: `case.thread.new_message`. (Urgent messages use a distinct key — see MN12.)
- [V1] Default channels: `in_app` + `push`. Email and SMS are off by default for thread messages (would be noisy); users can opt them on.
- [V1] Digest / bundling (must-fix for noise). Rapid messages from the same thread within a short window are bundled into a single notification ("3 new messages in Khalifa POA") rather than one push per message. This ties to MN2's `digestible` + `grouping_key` declaration and MN5's digest preference. This is the single highest-leverage control against the notification spam that pushes users back to WhatsApp. Urgent messages (MN12) are never bundled and never digested.
- [V1] Active-viewer suppression (precisely defined). A participant whose thread is focused/visible with the app foregrounded, and who has been active within the last ~30 seconds, does not receive a push for messages they're seeing live. Race rule: if viewer state is stale (>30s) or ambiguous, default to sending — never silently drop a notification on uncertain presence. (Urgent messages still notify regardless, since the point is to confirm receipt via acknowledgement — see MN12.)
- [V1] Per-thread mute. A user can mute a specific case thread; muted threads only fire outbound notifications for urgent messages (MN12). Mute suppresses outbound channels only — the in-app canonical inbox (MN1) still records unread state, so a muted case still shows up when the user chooses to look. Mute is reversible.

**MN9 — Audit, retention & data protection.**
Notifications and thread messages are part of the case's permanent record. (This section states the policy; values marked "Legal to confirm" must be signed off by counsel — this PRD is not legal advice.)

*Audit & immutability*
- [V1] Every notification delivery — and every channel attempt, success or failure — is recorded with timestamps, the template key + version used (MN2), and a correlation ID (MN10).
- [V1] Urgent messages and their acknowledgements/escalations (MN12) are fully audited — who flagged urgent, when, to whom, on which channels, who acknowledged and when, and any fallback escalation triggered.
- [V1] Thread messages are immutable after the 5-minute delete window; the audit trail includes any deletions (who, when, tombstone).
- [V1] Tamper-evident storage (mechanics, not just intent). The audit log is append-only and tamper-evident (e.g., hash-chaining or write-once storage), so "we don't update the row" is enforced by the store, not by convention.
- [V1] Per-case export (e-discovery / DSAR). A case's communications can be exported as both a human-readable transcript and a machine-readable record, including system messages and delivery logs — for dispute resolution (e.g., RERA Rent Dispute Settlement / courts) and data-subject access requests.

*Retention (corrected from v0.1)*
v0.1 anchored retention to "likely 7 years." That is the wrong default for this use case. Retention is configurable per record class, with the following defaults (Legal to confirm):
- Case communications & audit (default): **5 years after case closure.** UAE AML record-keeping for DNFBPs — which expressly includes real-estate brokers/agents and notaries — requires retention of no less than five years from completion of the transaction / end of the business relationship (Cabinet Resolution No. 134 of 2025, Art. 25, carrying forward the former Cabinet Decision No. 10 of 2019 Art. 24, under Federal Decree-Law No. 10 of 2025). Company accounting records are likewise 5 years (Federal Decree-Law No. 32 of 2021, Art. 26).
- Records tied to corporate tax: 7 years where applicable (Federal Decree-Law No. 47 of 2022, Art. 56).
- Records tied to real-estate VAT: 15 years where applicable (VAT Law, Federal Decree-Law No. 8 of 2017, Executive Regulation — standard 5 years extended to 15 for real estate).
- Note: practitioners flag an unresolved 5-vs-7-year inconsistency between the Corporate Tax Law and Tax Procedures regulations; the FTA is expected to clarify. Default to 5 years for communications unless a longer tax/VAT obligation attaches to the specific case.

*Data protection (PDPL + outbound comms)*
- [V1] Right-to-deletion vs. immutability (explicit resolution). UAE PDPL (Federal Decree-Law No. 45 of 2021, Art. 11) grants a right to erasure, limited where retention is required by law. Rule: statutory retention (AML/tax/VAT) overrides an erasure request for the retention window; erasure is honored only after the retention clock expires (then secure deletion/anonymization). PDPL data-subject requests carry a response window (~20 business days — Legal to confirm).
- [V1] No PII in outbound notification bodies. Emirates ID numbers and sensitive transaction details must never appear in SMS/push previews or email bodies (they leak to lock screens and third-party providers). Outbound bodies are generic ("You have an update on your POA case" / "Urgent update on your POA case — open the app"); specifics live behind the authenticated deeplink. Aligns with PDPL data-minimization.
- [V1] SMS = transactional only (TDRA). Case SMS (including urgent SMS) is strictly transactional in tone, sent via pre-registered sender IDs (per Etisalat/du registration). The transactional↔marketing boundary is enforced so a future trigger cannot accidentally cross it. Any promotional messaging (a Non-Goal) would require the "AD-" sender prefix, the 07:00–21:00 marketing window, and consent records retained for the sending period + 2 years (TDRA Regulatory Policy on Unsolicited Electronic Communications, v1.1, 13 June 2022).
- [V1.1] Data residency. Confirm UAE data-residency expectations and PDPL cross-border-transfer constraints (adequacy / standard contractual clauses / explicit consent) for any push/SMS/email provider or hosting outside the UAE. (Note: if the entity is domiciled in DIFC/ADGM, those free-zone data laws differ from the federal PDPL.) Flag for architecture review.

**MN10 — Delivery reliability & correctness (new in v0.2 — must-fix).**
Outbound delivery is at-least-once by nature; this requirement makes the user experience exactly-once and loss-free.
- [V1] Idempotency + deduplication. Before sending on any channel, the pipeline checks a dedup key (e.g., `recipient:trigger_key:case_id:time_window`) in a fast store (e.g., Redis) with a priority-based TTL, and uses provider-level collapse keys (`apns-collapse-id`, FCM `collapse_key`, an SMS idempotency key) so the same logical notification never double-delivers across devices or retries.
- [V1] Retry hardening. Failed outbound attempts retry with exponential backoff + jitter (to avoid retry storms). Attempts that exhaust retries land in a dead-letter queue for inspection; they are never silently lost.
- [V1] Outbox pattern for critical notifications. `critical` notifications (system or urgent) are written to a durable outbox in the same transaction as the originating event before enqueue, so nothing is lost if the queue/broker is unavailable.
- [V1] Observability. Per-channel success/failure rates, provider latency, and a correlation ID threaded from event → render → each channel attempt → audit log (MN9), with dashboards/alerts. Target outbound delivery success ≥ ~98% and duplicate rate < ~1% (calibrate against beta telemetry).

**MN11 — Search & findability (new in v0.2 — must-fix).**
With one ever-growing thread per case, search is how users find prior decisions — its absence is a direct reason people keep using WhatsApp ("let me just search the group").
- [V1] In-thread search. Within a case thread, search messages by keyword and by author; jump to a result in context.
- [V1] Filter system vs. human messages. Search can scope to human messages only (excluding the system-event stream) so a real decision isn't buried under status updates.
- [V1.1] Cross-case search. From the Notification Center / global search, find a message across all cases the user currently has access to (respecting the removed-participant boundary in MN6).
- [V1] Attachments are findable by filename within a case.

**MN12 — Urgent messages (human-initiated escalation) (new in v0.2 — must-fix).**
Some case moments are time-critical and only a human in the loop recognizes them — a notary appointment in two hours blocked by an expired Emirates ID, a document error found mid-signing, a Golden Visa submission window about to lapse. The platform's `critical` priority (MN1/MN4) fires only on system events; this requirement gives a participant a deliberate way to flag a message urgent so it breaks through to the other stakeholder immediately. Without it, users reach for WhatsApp or a phone call in exactly the high-stakes moments where we most need the conversation to stay on-platform. The design must balance reach against fatigue: urgent only stays useful if it stays rare.

*Sending & delivery*
- [V1] A participant composing a thread message can flag it Urgent (MN7). An urgent message emits a distinct trigger `case.thread.urgent_message` with `priority: critical`.
- [V1] An urgent message delivers in-app + push + SMS to every other current participant immediately, bypassing quiet hours (MN5), per-thread mute (MN8), the recipient's channel opt-outs, and the new-message digest/batching (MN8). It is never bundled.
- [V1] Urgent messages are visually distinct in the thread and pinned/elevated at the top of recipients' Notification Center (MN1), clearly marked urgent.

*Acknowledgement & escalation*
- [V1] Acknowledgement. Each recipient sees an explicit Acknowledge action; the sender sees who has acknowledged and when. This is the on-platform answer to "did they see it?" and the reason to flag urgent rather than phone someone. Acknowledgement state is recorded in the audit trail (MN9).
- [V1] Escalation on non-acknowledgement. If no required recipient acknowledges within a configurable window (default e.g. 10 minutes), the platform re-notifies via the next channel in the cascade (MN4) and may notify a configurable fallback (e.g., the Agent if a Client hasn't acknowledged, or the Agency Admin of the relevant agency). Fallback policy is configurable and every escalation is audited.

*Guardrails (urgent stays useful only if it stays rare)*
- [V1] Confirmation step before sending: "This will alert [recipients] by SMS immediately, even during their quiet hours. Send as urgent?"
- [V1] Per-sender rate limit on urgent messages per case and per time window (configurable); exceeding it requires a cooldown and surfaces a clear message.
- [V1] Every urgent send is audited (sender, time, recipients, channels attempted, acknowledgements, escalations).
- [V1] Urgent is a deliberate, non-default action; the normal send path is unchanged and remains the default.

*Boundaries*
- [V1] Urgent respects the removed-participant boundary (MN6): a removed participant is not a current participant and is not reachable.
- [V1] The Agency-Admin read-only view (MN6) is never a default urgent recipient; it may only be a configured escalation fallback.
- [V1] The no-PII-in-outbound-bodies rule (MN9) applies — the urgent SMS/push body is generic ("Urgent update on your [case] — open the app"); specifics live behind the authenticated deeplink.
- [Decision — see Open Questions] Who may send urgent: default = any participant (rate-limited + audited); alternative = restrict to Agent / Partner roles. Product to confirm.

## Open Questions / Decisions Needed

1. Retention values — Legal to confirm the 5-year default and the 7-year / 15-year exception classes, and the PDPL response window.
2. Escalation windows (MN4 N, M; MN12 ack window) — product to set defaults per criticality; confirm SMS cost ceiling with Finance (urgent + escalation both spend SMS).
3. Who can send urgent messages (MN12) — any participant (rate-limited) vs. Agent/Partner only. Recommended default: any participant, with rate-limit + confirmation + audit.
4. Urgent fallback policy (MN12) — default escalation target when no one acknowledges (e.g., Agent → Agency Admin). Confirm per case type (POA may differ from conveyancing).
5. Reactions in V1 vs fast-follow (MN7) — decide based on engineering capacity; recommended in V1 as the quiet alternative to read receipts.
6. Data residency / hosting region (MN9) — depends on chosen push/SMS/email providers and entity domicile (federal vs DIFC/ADGM).
7. Voice message limits (MN7) — confirm max duration default (5 min?) and audio format; confirm whether V1 ships transcription or defers to V2.
8. Storage-quota reclamation vs. retention (MN7) — if media is retained for AML/audit (MN9) even after a message is tombstoned, deleting a message can't free quota. Decide: does quota measure live-thread bytes (reclaimable) or total-ever-uploaded (not reclaimable for the retention window)? Confirm the per-user 500 MB default and whether quota is per-user or should also have a per-case cap, with Finance/Legal.
9. Message unsend / deletion vs. legal history (MN7 / MN9) — case messages are part of the legal/audit record, yet MN7 currently lets an author delete (tombstone) a message within 5 minutes. Decide with Legal whether self-deletion should be allowed at all. Options: (a) no user deletion — messages are immutable from send, only redacted by an authorized admin with reason logged; (b) keep the 5-minute author delete but make the tombstone fully reconstructable in the audit log (original content retained, hidden from participants, recoverable for dispute/e-discovery); (c) the current visible-tombstone behavior. Recommended default given the legal-history purpose: (b) — the participant-facing message shows "deleted," but the original is never actually destroyed within the retention window. Confirm against PDPL erasure (MN9).

## Cross-references back to Module 0

- `M0:R1.1` — role context. **MN1 + MN3** scope Notification Center visibility and deeplink navigation to the user's active role.
- `M0:R1.2` — verified mobile / UAE Pass. **MN4** (and MN12 urgent SMS) depend on this — SMS is always available because every account has a verified mobile.
- `M0:R3.1` — module manifest. **MN2** consumes the notification-trigger field; each service module declares its triggers there.
- `M0:R3.6` — per-Business module activation. The audit / notification ACs in R3.6 are emitted via **MN2** triggers (`module.business_enabled`, `module.business_disabled`).
- `M0:R5.1` — documents primitive. **MN7** reuses the supported file types and size limits.
- `M0:F5` — Business invite. The SMS invite link and acceptance notifications in F5 are emitted via **MN2** triggers.
- `M0:F6` — leave / remove a Business membership. Both-sides notifications referenced in F6 are emitted via **MN2** triggers.

---

## Changelog — v0.1 → v0.4

### New capabilities (v0.4)
- **MN7 — Voice messages.** New asynchronous voice-message media type: mic-button record, review/discard, inline waveform playback, compressed audio, configurable max duration (default 5 min), malware-scanned, inheriting case retention/immutability and the 5-minute delete window. Transcription deferred to V2. Non-Goal #2 clarified so "voice/video calls" is not confused with voice messages.
- **MN7 — Per-user storage quota.** New configurable per-user upload quota covering all uploaded media (attachments + voice messages) across cases. Default 500 MB; Platform-Admin-settable with per-user overrides; warns at a threshold (default 90%); hard-blocks new uploads at the limit (text never blocked); usage surfaced to user + admin.
- **Open Questions** — added voice-message limits (#7) and quota-reclamation-vs-retention (#8).

### New requirements (v0.3)
- **MN10 — Delivery reliability & correctness:** idempotency/dedup, retry backoff+jitter, dead-letter queue, outbox for critical, observability.
- **MN11 — Search & findability:** in-thread search, system/human filter, cross-case search, attachment search.
- **MN12 — Urgent messages (human-initiated escalation):** a participant can flag a message urgent; it breaks through quiet hours, mute, opt-outs and digesting, delivers on all channels immediately, requires acknowledgement, escalates to a fallback if unacknowledged, and is guarded by a confirmation step, per-sender rate limit and full audit. Addresses the POA-style "I need to reach them now to fix a problem" gap.

### Enhanced in place
- **MN1:** split notification state into seen/read/archived; added cross-device read-state sync; defined the multi-role badge rule explicitly; added inbox grouping by case; noted critical can originate from a system trigger or a human urgent message.
- **MN2:** added `category`, `delivery_mode`/`grouping_key`; made templates locale-keyed and versioned.
- **MN3:** added deferred deep linking, destination+permission validation, link-wrapping caution.
- **MN4:** added escalation cascade and throttle-with-auto-batch; clarified critical override (and urgent) also bypasses quiet hours; exempted urgent from batching.
- **MN5:** added quiet hours (timezone-aware, critical/urgent bypass), digest-frequency preference, inline access; bounded category grouping.
- **MN6:** added catch-up UX (unread divider, jump-to-unread); froze removed-participant visibility at removal; modeled Agency-Admin read-only as non-participant (and optional urgent fallback); documented one-thread-per-case breaking points.
- **MN7:** added drafts, reactions/acknowledgements, and the urgent flag at composition; defined system-message de-emphasis/collapsing; added attachment scanning/preview/limits; specified delete-window edge cases. _(v0.4 voice messages and storage quota are listed under New capabilities above.)_
- **MN8:** added digest/bundling; gave a precise active-viewer definition + race rule; clarified mute suppresses outbound only and that urgent still pierces mute; noted urgent is never digested.
- **MN9:** corrected retention default to 5 years (was "likely 7"), made it per-record-class (5/7/15), resolved PDPL erasure-vs-immutability, added "no PII in notification bodies," TDRA SMS boundary, tamper-evident audit storage, per-case export; added urgent-message acknowledgement/escalation to the audit scope.

### Removed / deferred
- **@mentions — removed (Non-Goal #8).** Carried forward from v0.2. The "reach a specific person now" need is served by the Urgent path (MN12); findability by search (MN11). Kept architecturally open for V2.
- **Typing indicators / live presence → V2** (Non-Goal #9).
- **Per-message read receipts → V2** (Non-Goal #10) — covered instead by acknowledgement reactions (MN7) and mandatory acknowledgement on urgent messages (MN12).
- **Sub-threads / topic-splitting → V2** (Non-Goal #11); mitigated by unread markers and search.

### Unchanged (already correct in v0.1)
Case-as-conversation framing; one-thread-per-case with derived participants; declarative trigger registry; in-app-as-canonical-channel; system critical-priority override; English-only with Arabic-ready architecture; the existing Non-Goals (out-of-case chat, voice/video, E2E, bulk/marketing, inbound reply parsing, self-service trigger config).
