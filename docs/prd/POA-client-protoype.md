# POA — Client Prototype Brief

**For:** Claude design / prototyping
**Source PRDs:** Contract Hubs POA Module (v0.10), Messaging & Notification (v0.4), Module 0 / Platform CONTEXT
**Perspective:** The **Client** (the Principal receiving a Power of Attorney) — every screen, state, and message the client sees.
**Owner:** Product (Ala)

---

## 0. How to use this brief

This is a **screen-by-screen prototyping spec** for the client-facing side of the POA module. It covers four journeys end to end:

1. **Single-principal happy path** — one client, start to Final POA download.
2. **Co-owner / multi-principal** — two or more principals on one POA.
3. **Agent-on-behalf (client side)** — what the client sees when an agent does the legwork.
4. **No-show / dispute / error paths** — missed appointments, payment failure, no slots, reassignment.

Every screen below lists: **Purpose**, **Key UI elements**, **States** (empty / loading / error where relevant), **Primary action(s)**, and **Notification(s) that land the client here**. A consolidated messaging catalog with exact copy guidance is in **Section 7**.

**Design principles to carry through every screen:**

- **Price, status, and next action are always visible.** The client should never wonder what a POA costs, where it is, or what they must do next. This is the product's core promise — design the shell to enforce it.
- **Two things — and only two — are the client's job:** approving the draft and signing in the video session. Everything else can be done by an agent on their behalf. Design should make these two moments feel weighty and clear; everything else is light.
- **Bilingual document, English UI.** The POA *document* is shown Arabic + English side by side. The *interface* is English-only in V1 (architecture is Arabic-ready). On mobile, the bilingual document stacks with a language switcher.
- **Mobile and web at parity.** Design both; the client may start on web and sign on mobile.
- **Quiet by default, loud when it matters.** Routine updates are in-app + push; critical moments (payment, completion, urgent notary message) break through every channel.

---

## 1. Client personas

| Persona | Who they are | Verification | Notarisation document | Notes for design |
|---|---|---|---|---|
| **Resident individual** | UAE resident granting a POA | UAE Pass → `resident` | Emirates ID (free) **or** passport (+fee, opt-in) | Name + Emirates ID pre-filled and read-only. |
| **Non-resident individual** | Owner abroad | Passport → `non_resident` | Passport only (+fee, **mandatory**) | No Emirates ID. Passport-notarisation fee is unavoidable and must be shown up front. |
| **Company authorised signatory** | Signs on behalf of a company principal | UAE Pass or Passport | Per signatory residency | Enters company trade name, license, jurisdiction; confirms they are the signatory. |
| **Co-owner (multi-principal)** | One of 2–5 principals on a single POA | Each verifies independently | Per principal | Each approves and signs personally; nobody can do it for them. |
| **Client served by an agent** | Receives the case from an agent | Verifies via SMS link | Per residency | Agent fills forms/pays/books; client still approves + signs personally. |

---

## 2. Status model the client experiences

The case moves through a sequence of sub-statuses. The client only needs a **humanised status** + a **next-action label** — never the internal codes. Map for design reference:

| Internal sub-status | Humanised status (show this) | Next-action label for the client |
|---|---|---|
| Capturing principal info | "Setting up your POA" | "Add principal & attorney details" |
| Capturing principal info — awaiting co-Principal verification | "Waiting on co-owners to verify" | "Waiting on [name] to verify" |
| Capturing POA details | "Setting up your POA" | "Add POA details" |
| Awaiting documents | "Documents needed" | "Upload your documents" |
| Documents submitted / Generating draft | "Preparing your draft" | "No action needed — preparing" |
| Awaiting notary review | "With the notary" | "No action needed" |
| Notary editing draft | "With the notary" | "No action needed" |
| Document revision requested | "Document needs fixing" | "Re-upload [document]" |
| Awaiting client approval | "Ready for your review" | "Approve your draft" |
| Client change requested | "Changes sent to notary" | "No action needed" |
| Awaiting payment | "Payment needed" | "Pay to continue" |
| Awaiting booking | "Book your appointment" | "Book your notary session" |
| Appointment booked | "Appointment booked" | "Join your video session" (at time) |
| Video session in progress | "Session in progress" | "Join now" |
| Awaiting final POA | "Finalising your POA" | "No action needed" |
| **Final POA issued** | "Completed" | "Download your POA" |
| Pending termination — unexcused no-show | "Action needed — missed appointment" | "Dispute or start a new case" |
| Cancelled — abandoned / rejected / wrong type / no-show | "Cancelled" | (reason-specific) |

**SLA note for the shell:** the platform targets **same business day** (8 working hours, Sun–Thu 09:00–18:00 UAE), with the clock pausing whenever the case is "waiting on the client." Don't surface a countdown to the client; do surface a friendly "wall-clock since you started" if useful.

---

## 3. Journey map (all paths)

```
                            ┌─────────────────────────────────────────────┐
                            │  ENTRY                                       │
  Client direct ───────────┤  New Case → POA → Property / General         │
  Agent-on-behalf ─────────┤  SMS link → verify → land in case            │
                            └───────────────────┬─────────────────────────┘
                                                │
                    ┌───────────────────────────▼───────────────────────────┐
                    │  SETUP                                                 │
                    │  Who is the principal? (self / company / + co-owners)  │
                    │  Attorney(s) + authority mode                          │
                    │  POA details (property or general)                     │
                    │  ── co-owner branch: invite each to verify ──          │
                    └───────────────────────────┬───────────────────────────┘
                                                │
                    ┌───────────────────────────▼───────────────────────────┐
                    │  DOCUMENTS                                             │
                    │  Dynamic checklist → upload → (revision loop if flagged)│
                    └───────────────────────────┬───────────────────────────┘
                                                │
                    ┌───────────────────────────▼───────────────────────────┐
                    │  DRAFT (notary works; client waits)                    │
                    │  → "Ready for your review"                             │
                    │  Approve  ──or──  Request change → back to notary       │
                    │  ── co-owner branch: N-of-N approval tracker ──        │
                    └───────────────────────────┬───────────────────────────┘
                                                │
                    ┌───────────────────────────▼───────────────────────────┐
                    │  PAY                                                   │
                    │  Base fee + top-up + passport add-on + translation     │
                    │  (payment failure loop)                                │
                    └───────────────────────────┬───────────────────────────┘
                                                │
                    ┌───────────────────────────▼───────────────────────────┐
                    │  BOOK                                                  │
                    │  Same-day auto-assign  OR  future-day slot picker      │
                    │  (no-slots empty state)                                │
                    └───────────────────────────┬───────────────────────────┘
                                                │
                    ┌───────────────────────────▼───────────────────────────┐
                    │  VIDEO SESSION (partner-hosted; platform relays link)  │
                    │  Reminders 24h / 2h / 15min → Join → sign personally   │
                    │  ── no-show branch: excused (free rebook) /            │
                    │     unexcused (pending termination → dispute) ──       │
                    └───────────────────────────┬───────────────────────────┘
                                                │
                    ┌───────────────────────────▼───────────────────────────┐
                    │  DONE                                                  │
                    │  Download Final POA (AR, + EN if purchased)            │
                    │  Optional: Request shipping                            │
                    └─────────────────────────────────────────────────────────┘
```

---

## 4. Screen-by-screen — happy paths

> Screens are numbered `S#`. Reusable components (status banner, case thread, notification center) are defined once in Section 6 and referenced.

### 4A. Single-principal happy path

#### S1 — New case picker (POA selected)
- **Purpose:** Client chooses the POA type to start.
- **Key UI:** Two large cards — **Property POA** and **General POA** — each with a one-line description. Page title "Start a Power of Attorney."
- **States:**
  - *Verified client:* both cards active.
  - *Unverified client:* cards greyed with a banner "Verify your identity to continue" → CTA routes to UAE Pass or Passport verification, then returns here.
- **Primary action:** Tap a card → creates the case, advances to S2.
- **Note:** Type is locked once chosen (changing means starting a new case).

#### S2 — "Who is the principal?"
- **Purpose:** Capture who is granting the POA.
- **Key UI:**
  - The client's own row is pre-added with two cards: **"Myself (an individual)"** / **"A company I represent."**
  - `+ Add another principal` button (for co-owners — see 4B). Disabled at 5 principals with inline note.
- **States:** Individual selected vs Company selected reveal different field sets (next screen).
- **Primary action:** Choose, then `Continue` → S3.

#### S3 — Basic information form
- **Purpose:** Capture principal identity data.
- **Key UI (Individual principal):**
  - Full name — **pre-filled, read-only** (from UAE Pass or passport record).
  - Residency status — derived from verification method, read-only.
  - Emirates ID — pre-filled if resident; hidden for non-residents.
  - Passport number (required for all), email, mobile.
  - **Passport-notarisation toggle** with a **bold notice**: *"If you don't have an Emirates ID — or you have one but don't want to use it in court — you'll be notarised using your passport instead, for an extra 200 AED per person."*
    - Non-resident: toggle **on and locked** (passport is their only path).
    - Resident: toggle **off by default**, genuine opt-in.
- **Key UI (Company principal):** Company trade name, trade license number, jurisdiction, office address; Authorised Signatory section (pre-filled from the logged-in verified individual) + signatory's role in the company.
- **Primary action:** `Continue` → S4 (attorneys).

#### S4 — Attorney(s) section
- **Purpose:** Capture who receives the powers.
- **Key UI:**
  - One attorney row pre-added: **"Who is this attorney?"** → "An individual" / "A company."
  - Individual fields: full name, passport/Emirates ID, relationship to principal (spouse/parent/sibling/friend/employee/other).
  - Company fields: trade name, license, jurisdiction, authorised signatory name + ID + role.
  - `+ Add another attorney` (up to 5).
  - **Attorney authority mode** appears only if 2+ attorneys: `joint` / `several` / `joint_and_several` (the last unlocks a per-power split on the POA details form).
- **Primary action:** `Continue` → S5.

#### S5 — POA details form
- **Purpose:** Capture the substance of the POA.
- **Key UI (Property POA):** property emirate, property type, project/building name, unit number, **Purpose** (multi-select: sell / buy / manage / sign transfer docs / receive cheques / other). Optional: title deed number, Oqood number.
- **Key UI (General POA):** purpose description (free text 50–500 chars), powers granted (multi-select), validity preference (one-time / time-bounded with end date / unbounded).
- **Primary action:** `Continue` → S6. Case moves to "Documents needed" (client's turn).

#### S6 — Document checklist & upload
- **Purpose:** Collect exactly the documents this case needs — no more.
- **Key UI:** A dynamic checklist generated from POA type + residency + party type. Each row: document name, required badge, upload status, a thumbnail/preview once uploaded, and a "replace" affordance. Mobile camera capture supported.
  - Resident individual: passport copy, Emirates ID.
  - Non-resident individual: passport copy (no Emirates ID).
  - Passport-notarising principal: passport copy required; Emirates ID dropped/optional.
  - Company principal: signatory passport (+ Emirates ID if resident), trade license, memorandum of association.
  - Each attorney: ID/passport (company attorney: trade license + signatory ID), labelled with the attorney's name.
  - Property POA selling/buying/transfer: **title deed** (one case-level doc, not per principal).
- **States:**
  - *In progress:* progress indicator "3 of 4 uploaded."
  - *Complete:* auto-advances when the last required doc is in → "Preparing your draft."
  - *Revision requested (loop):* the flagged document shows a red marker + the notary's inline reason; CTA "Re-upload." See S6b.
- **Primary action:** Upload each → auto-advance.

#### S6b — Document revision requested (loop state of S6)
- **Purpose:** Client fixes a document the notary flagged.
- **Key UI:** Banner "Your notary needs one document fixed." The specific row shows the reason text inline. Other docs stay approved.
- **Primary action:** Re-upload → case returns to "With the notary" (not back to draft generation).

#### S7 — "Preparing your draft" / "With the notary" (wait state)
- **Purpose:** Reassure the client no action is needed.
- **Key UI:** Friendly status illustration, humanised status, "We'll notify you when your draft is ready to review." Case thread accessible. Client may navigate away.
- **States:** *Generating* (seconds) → *With the notary* (notary picks up and edits).
- **No client action.**

#### S8 — Draft review & approval ⭐ (Principal-Only Action)
- **Purpose:** The "moment of confidence" — client reads what they'll sign and consents.
- **Key UI:**
  - Bilingual draft preview: **Arabic (right) + English (left)** side by side on web; **stacked with a language switcher** on mobile. No internal annotations visible.
  - Two actions: **`Approve draft`** (primary) and **`Request change`** (secondary).
  - `Request change` opens a comments field (50–2000 chars).
- **States:**
  - *Single principal:* `Approve` → advances to payment.
  - *Change requested:* confirmation that comments were sent to the notary; status → "Changes sent to notary." (Returns to S8 when notary re-issues.)
- **Primary action:** `Approve draft`. **Design weight:** this is legally meaningful — treat as a deliberate, confirmed action.

#### S9 — Payment
- **Purpose:** One bundled, transparent price.
- **Key UI — itemised summary:**
  - Base fee — 1,500 AED (or agency override).
  - Agent top-up — if any (shown as a single line, not broken down).
  - **Passport notarisation** — one line **per passport-using principal**, e.g. *"Passport notarisation — Ahmed Khan — +200 AED"*; shows count + subtotal if multiple. Non-resident lines are present and **not removable**.
  - **Optional toggle:** *"Add stamped English translation of the Final POA — +250 AED"* (default off; total auto-updates).
  - Client wallet credit applied if available.
  - **Bundled total** (prominent).
  - Pay with **Apple Pay / card**.
- **States:**
  - *Success* → "Payment confirmed," advances to booking. (Critical notification fires.)
  - *Failure* → retry screen, case stays at payment, no charge. See S9b.
- **Primary action:** `Pay`.

#### S9b — Payment failed (loop state of S9)
- **Key UI:** Clear error, unchanged itemised total, `Try again`. Reassure no money was taken.

#### S10 — Booking
- **Purpose:** Pick a notary video appointment.
- **Key UI — two modes shown together when same-day is open:**
  - **Same-day (auto-assign):** a single button **"Book me the earliest appointment today"**; on tap the platform shows the auto-assigned time to confirm. No slot grid.
  - **Future days (self-select):** a positive-only list of available 30-min slots for the next 14 days from tomorrow, sorted earliest first, shown in **the client's local time with Asia/Dubai shown in parallel**. Booked/blocked/closed slots are simply absent.
- **States:**
  - *Same-day closed* (past 16:00 cutoff or no eligible slot): same-day option hidden; inline note "Same-day booking is closed — here are the next available appointments"; future picker only.
  - *No slots in 14 days* (empty state): "Your notary office hasn't published availability yet. We've notified them — please check back shortly." (Notary is auto-pinged; client gets notified when slots open.)
  - *Slot just taken at confirm:* inline "This slot is no longer available — please pick another," list refreshes.
- **Primary action:** Confirm a slot → "Appointment booked."

#### S11 — Appointment booked / case detail (pre-session)
- **Purpose:** Hold the appointment details and the join link.
- **Key UI:**
  - Appointment time (UAE + local), Session Operator name, notary office name.
  - **Join link panel:** the partner-provided video link as a clickable button **once provided**; otherwise "Your notary will share the join link before the appointment."
  - Join instructions text (once provided).
  - `Reschedule` action (free outside the 4-hour cutoff).
  - Case thread.
- **States:** *Link pending* vs *link available*; reminders update this view.
- **Primary action:** (at time) `Join your video session`.

#### S12 — Video session (relay) ⭐ (Principal-Only Action)
- **Purpose:** Client joins the notary's video tool and signs personally.
- **Key UI:** Prominent `Join` button opening the partner link; a note that the session runs in the notary's own video system; the platform does not host or record it. Agent (if any) may observe only.
- **Behaviour:** The notary runs the notarial reading and witnesses the signature in their tool. The platform only tracks state ("Session in progress" → "Finalising your POA").
- **No further platform action by the client beyond joining and signing.**

#### S13 — Completed / Final POA delivery
- **Purpose:** Deliver the finished document.
- **Key UI:**
  - **`Download Final POA (Arabic)`** — always present.
  - **`Download Final POA (English with stamp)`** — only if the translation add-on was purchased.
  - Acting Operator name + notary office.
  - **`Request shipping`** CTA (creates a separate Shipping case, pre-filled with address + the POA files).
  - **`Download notarial recording`** — only if the office chose to upload it; otherwise a one-line note that the recording is retained by the notary office.
- **Primary action:** Download. (Critical "completed" notification fires.)

#### S14 — My POAs dashboard
- **Purpose:** The client's home for all their POA cases.
- **Key UI:**
  - Summary strip: **Active**, **Awaiting your action**, **Completed (last 30 days)**.
  - Table: short case ID, POA type, principal display name (multi-principal shows "Ahmed Khan +1"), humanised status, notary office, wall-clock since creation, **next-action label computed for *this* user**, `View case`.
  - Filters: type, global status, active/completed, translation add-on, date range. Sort: created date / status / wall-clock.
- **States:**
  - *Empty:* two CTAs — `Start a POA Case` and `Learn how it works`.
  - *Populated:* highlight rows where "Awaiting your action."
- **Note:** This is the natural landing screen after login and the target of most deeplinks.

---

### 4B. Co-owner / multi-principal additions

Multi-principal reuses the single-principal screens with these **additions/overrides**:

#### S2-MP — Adding co-owners
- On S2, `+ Add another principal` appends a row (up to 5). Each new row asks individual/company.
- For each co-principal, the client enters that person's **mobile number** to trigger an invite-to-verify. The originating principal's own row needs no invite.

#### S2-MP-b — Principal authority mode
- Appears once 2+ principals exist; required single-select:
  - **`joint`** — "All principals grant this authority together."
  - **`several`** — "Each principal grants authority over their own share independently."
  - (`joint_and_several` is **not** offered for principals — attorneys only.)

#### S3-MP — Co-owner verification gate
- After setup, the case **cannot advance** until every co-principal has verified.
- **Key UI:** a per-principal verification tracker — "Waiting on [name] to verify" with a `pending` chip per unverified row. The originator + agent are notified on each verification.
- Each invited co-owner receives an SMS link → registers/verifies (their choice of UAE Pass or passport) → gains their own access to the case (it appears on their own My POAs dashboard).

#### S8-MP — Per-principal approval tracker ⭐
- **Purpose:** Each principal approves the *same* draft from their *own* login.
- **Key UI:**
  - Approval tracker: **"1 of 2 principals approved — awaiting [name]."**
  - Each not-yet-approved principal sees `Approve draft` **enabled on their own login**; already-approved principals and the agent see it **disabled** with status shown.
  - `Request change` is open to **any** principal or the agent (it's feedback, not consent).
- **Critical rule for design:** if *any* principal requests a change, **all approvals reset to zero** — when the revised draft returns, everyone re-approves. Make this consequence visible before submitting a change request ("This will reset approvals for all principals").
- Advances to payment only when **all** principals have approved.

#### S12-MP — Multi-principal signing
- Every principal must personally attend and sign. They may attend the same session or, at the office's discretion, in sequence.
- If one principal fails to join, the no-show flow applies to the **whole case** (Section 5).

#### Notification fan-out
- Approval, booking, reminders, video-link-provided, and completion notifications fan out to **all principals** (each on their own account), plus the agent.

---

### 4C. Agent-on-behalf (client side)

What the **client** sees when an agent starts and drives the case. The agent is a near-full proxy; the client still owns the two Principal-Only Actions.

#### SA1 — SMS invite & landing
- **Purpose:** Client receives the case via SMS and lands in it.
- **Key UI:** SMS with a deep link. On open:
  - *Already verified:* lands directly on the principal-type step (S2) or the case detail.
  - *Unverified / unknown:* routed through registration + verification (UAE Pass or passport, their choice), then into the case.
- **Note:** Until the client verifies, no case is fully active; the agent sees a "waiting on client" placeholder.

#### SA2 — Case detail, agent-driven
- **Purpose:** Client watches progress they don't have to drive.
- **Key UI:** Same case detail as S11/S14 rows, but most "next-action" labels read **"No action needed — your agent is handling this."** The client still receives every notification so they can step in.
- **Two moments where the label becomes the client's:**
  - **"Approve your draft"** at S8 — agent's approval is refused by the system; only the client can approve. If the agent tries, they get a clear message to send the client the link.
  - **"Join your video session"** at S12 — the client (or company signatory) must be present and sign; the agent may only observe.
- **Design implication:** visually distinguish "your agent handled this" steps (muted/confirmed) from "this needs you" steps (highlighted, action-colored). The two client moments should stand out sharply against the agent-handled background.

---

## 5. Screen-by-screen — error, no-show & dispute paths

#### E1 — Document revision loop
Covered as **S6b**. Client re-uploads the single flagged document; reason shown inline.

#### E2 — Change requested → notary
After `Request change` at S8: status → "Changes sent to notary," no action needed, returns to S8 when the notary re-issues. (Multi-principal: this resets all approvals — see S8-MP.)

#### E3 — Payment failed
Covered as **S9b**. Retry, no charge, case holds at payment.

#### E4 — No slots available
Covered as **S10** empty state. Client is told the office was notified and gets a `slots now available` notification when capacity is published.

#### E5 — Appointment cancelled by notary
- **Trigger:** Notary admin takes a booked slot offline.
- **Key UI:** High-priority banner "Your appointment was cancelled by the notary office," reason surfaced in the case thread, returns to booking (S10). Client + agent notified (critical).
- **State:** This is **not** a no-show; no penalty.

#### E6 — Acting/Session operator reassigned, or slot released
- **Key UI:** Inline system message in the thread + notification "Your notary was reassigned" / appointment moved back to booking. If a slot had to be released because no operator could cover it, client is reached by push + SMS and rebooks — **not** a no-show.

#### E7 — Video link missing at appointment time
- **Key UI:** If the partner never provided a join link, the join panel stays in "Your notary will share the join link before the appointment." Behind the scenes this escalates to the notary/platform admin. If unresolved, the case is moved back to booking with a system-message explanation; client rebooks.

#### E8 — Missed appointment → Excused
- **Trigger:** Client didn't join within 15 min; operator categorises as excused (technical issue or never received the link).
- **Key UI:** Friendly notification "Let's get you rebooked — no charge," case returns to booking (S10). No penalty, no wallet impact.
- **Primary action:** Book a new slot.

#### E9 — Missed appointment → Unexcused (pending termination) ⭐ sensitive
- **Trigger:** Operator categorises the no-show as unexcused.
- **Key UI:** Critical notification + a dedicated case state "Action needed — missed appointment." Screen explains plainly: **no refund, original payment stands**, and a **7-day window** to act. Two CTAs:
  - **`Dispute this categorisation`** → E10.
  - **`Start a new POA Case`** → new-case picker with a one-click prompt to **pre-fill** from this case's data (principal, attorney, details, documents). The new case is independent and requires a new payment.
- **Design tone:** clear and non-punitive in wording; this is a money-affecting moment, so avoid alarmist or jokey copy. State facts and the path forward.

#### E10 — Dispute flow
- **Purpose:** Client contests the unexcused categorisation.
- **Key UI:** Shows the operator's reason; a required counter-explanation field (50–500 chars). On submit, the 7-day auto-termination **pauses** while a platform admin reviews. Status "Dispute under review."
- **Outcomes (client sees a resolution notification):**
  - **Overturned** → case revived to booking (S10); client rebooks; original payment stands. No money moves.
  - **Upheld** → case cancelled (unexcused no-show); `Start a new POA Case` CTA remains.

#### E11 — Case cancelled / abandoned
- **Abandoned:** a case left untouched 14 days in early setup is auto-cancelled (no payment was taken). Show a calm "This case was cancelled due to inactivity" with `Start a new POA Case`.
- **Rejected by notary:** rare; client sees a clear notice and a **full refund** (base fee + top-up + translation if charged). Surface the refund prominently.

---

## 6. Reusable components

#### C1 — Status banner (top of every case detail)
Humanised status + next-action label + (optionally) wall-clock since start. Color-coded: neutral = waiting on others; highlighted = needs the client.

#### C2 — Notification Center (bell, top nav)
- The canonical inbox: every item needing attention lands here with a deeplink that drops the client exactly where the work is.
- **States per item:** unseen / seen / read / archived. Unread first, then read, newest first.
- **Grouping:** multiple messages on the same case collapse into one row ("3 new messages in [case]"), expandable.
- **Urgent items** are pinned at top, visually distinct, never grouped.
- **Badge:** reflects unseen count; syncs across devices in real time (reading on phone clears it on laptop).
- Filter by case; filter by role (for multi-role users).

#### C3 — Case thread (per case)
- One conversation per case: client + agent + assigned notary operator. Membership updates automatically as participants change.
- Message types: text (≤4000 chars), attachments (inline, link into documents), **voice messages** (record/review/send; inline waveform + play), and de-emphasised **system messages** for state changes.
- **Urgent flag:** any participant can mark a message urgent — it breaks through quiet hours, mute, and opt-outs, delivers on every channel, and asks recipients to **Acknowledge**. Show a confirmation before sending urgent ("This will alert [recipients] by SMS immediately, even during quiet hours").
- Catch-up: unread divider + "jump to first unread." In-thread search by keyword/author.
- Drafts persist across devices.

#### C4 — Verification gate (reused)
When an unverified client hits a POA action, route to UAE Pass or passport verification, then return them to where they were.

---

## 7. Messaging & notification catalog (client-facing)

Every scenario the **client** experiences. Channels: **in-app** (always), **push**, **email**, **SMS**. "Critical" items break through quiet hours and mute and always hit at least one outbound channel. **No PII in outbound bodies** — SMS/push/email are generic; specifics live behind the authenticated deeplink.

### 7A. Setup & verification
| # | Scenario | When | Channels | Copy guidance (generic, no PII) |
|---|---|---|---|---|
| M1 | Case started | Client/agent starts the case | in-app, push | "Your POA case has been started." Deeplink → case. |
| M2 | Invited to verify (co-owner) | Added as a co-principal | in-app, push, **SMS** | "You've been added to a POA. Tap to verify your identity and continue." |
| M3 | A co-owner verified | Each co-principal verifies | in-app, push | "[A co-owner] has verified." (To originator/agent.) |
| M4 | All principals verified | Last principal verifies | in-app, push | "Everyone's verified — your POA can move forward." |
| M5 | Documents requested | Checklist generated | in-app, push, **email** | "Your POA needs a few documents. Tap to upload." |

### 7B. Draft & approval
| # | Scenario | When | Channels | Copy guidance |
|---|---|---|---|---|
| M6 | Notary assigned | Operator picks up the case | in-app | "A notary is reviewing your draft." |
| M7 | Document needs fixing | Operator flags a doc | in-app, push, **email** | "One document needs to be re-uploaded. Tap to fix." |
| M8 | Draft ready for review | Notary marks ready | in-app, push, **email** | "Your POA draft is ready to review." → S8. (Fans out to all principals.) |
| M9 | A principal approved (multi) | One of several approves | in-app | "[A co-owner] approved the draft." |
| M10 | All principals approved | Last approves | in-app, push | "All principals approved — time to pay." |

### 7C. Payment
| # | Scenario | When | Channels | Copy guidance |
|---|---|---|---|---|
| M11 | Payment required | Draft approved | in-app, push, **email** | "Your POA is approved. Tap to pay and book." |
| M12 | Payment completed | Payment succeeds | in-app, push, email — **critical** | "Payment confirmed. Let's book your notary session." |
| M13 | Case reassigned for translation | Office can't do EN add-on | in-app, push, email | "We moved your case to a notary who can prepare your English copy." |

### 7D. Booking & reminders
| # | Scenario | When | Channels | Copy guidance |
|---|---|---|---|---|
| M14 | Appointment booked | Slot reserved | in-app, push, **email** | "Your notary session is booked for [time]." For auto-assigned same-day: note it's the earliest available today. Includes join link **if already provided**. (Fans out to all principals.) |
| M15 | No slots available | Picker empty | in-app, push, email | "Your notary hasn't published times yet — we've let them know." |
| M16 | Slots now available | Office publishes capacity while waiting | in-app, push, email | "New appointment times are available — tap to book." |
| M17 | Appointment cancelled by notary | Notary takes slot offline | in-app, push, email — **critical** | "Your appointment was cancelled by the notary office. Tap to rebook." |
| M18 | Notary/operator reassigned | Admin reassigns | in-app, push | "Your notary was reassigned. No action needed unless we ask." |
| M19 | Video link provided | Link added after 24h reminder | in-app, push, email | "Your notary shared the join link for your session." |
| M20 | Reminder — 24h | 24h before | in-app, push, **email** | "Your notary session is tomorrow at [time]." Includes link if available. (All principals.) |
| M21 | Reminder — 2h | 2h before | in-app, push | "Your notary session is in 2 hours." (All principals.) |
| M22 | Reminder — 15min | 15min before | in-app, push | "Your notary session starts in 15 minutes. Tap to join." (All principals.) |

### 7E. Session, completion & no-show
| # | Scenario | When | Channels | Copy guidance |
|---|---|---|---|---|
| M23 | Final POA issued | Operator uploads final | in-app, push, email — **critical** | "Your POA is ready. Tap to download." (All principals.) |
| M24 | No-show — excused | Operator categorises excused | in-app, push, email | "Let's get you rebooked — no charge. Tap to pick a new time." |
| M25 | No-show — unexcused, pending termination | Operator categorises unexcused | in-app, push, email — **critical** | "You missed your notary session. Your payment stands. You have 7 days to dispute or start a new case." Two CTAs. (Clear, non-punitive.) |
| M26 | No-show — case terminated | 7 days lapse / dispute upheld | in-app, push, email | "Your POA case was closed. You can start a new one — we'll pre-fill your details." |
| M27 | No-show — overturned, revived | Dispute overturned | in-app, push, email | "Good news — your case is back on. Tap to rebook, no extra charge." |
| M28 | Case rejected by notary | Notary rejects (rare) | in-app, push, email — **critical** | "Your POA couldn't proceed and you've been fully refunded. Contact support for details." |
| M29 | Case abandoned | 14 days idle in setup | in-app, email | "Your unstarted POA case was closed for inactivity. Start again anytime." |

### 7F. Thread & urgent (human-to-human)
| # | Scenario | When | Channels | Copy guidance |
|---|---|---|---|---|
| M30 | New thread message | Agent/notary posts | in-app, push (bundled if rapid) | "[N] new messages on your POA." Bundled, never one-per-message. |
| M31 | **Urgent** message | A participant flags urgent (e.g., notary finds an ID problem before the session) | in-app, push, **SMS** — **critical**, pierces mute/quiet hours | "Urgent update on your POA — open the app." Generic body; recipient sees **Acknowledge**. |

**Quiet hours:** the client can set a do-not-disturb window (default 22:00–07:00 local); normal notifications defer, but **critical and urgent always break through**.

---

## 8. Prototype priority (suggested build order for the designer)

1. **Spine of the happy path:** S1 → S6 → S8 → S9 → S10 → S11 → S12 → S13, plus the **My POAs dashboard (S14)** as the hub.
2. **The two ⭐ Principal-Only moments** (S8 approval, S12 signing) — get the weight and clarity right.
3. **Notification Center (C2)** + status banner (C1) threaded through every screen.
4. **Co-owner layer** (S2-MP, S3-MP, S8-MP) over the spine.
5. **Agent-on-behalf framing** (SA2 muted/handled vs needs-you states).
6. **No-show / dispute / error states** (E5–E11), with M25/E9 designed carefully as a sensitive, money-affecting moment.

---

*This brief is derived from the POA Module PRD (v0.10), the Messaging & Notification PRD (v0.4), and Module 0 CONTEXT. Notification triggers map 1:1 to the PRD's `poa.*` and `case.thread.*` trigger keys; internal sub-status codes are intentionally hidden from the client and replaced with humanised labels.*
