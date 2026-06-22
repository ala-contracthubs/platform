# shared/kernel/state-machine

CONTEXT-FREE TransitionTable mechanism only: validate a transition given a table; NO domain status values, NO guards, NO side effects — the GlobalStatus table lives in case-lifecycle/domain and the POA sub-status table in modules/poa/poa-case-workflow/domain
