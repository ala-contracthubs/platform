# `poa/poa-intake`

The capture flow before the Notary touches the Case: who-is-the-Principal (Myself / a Company + add co-Principal up to 5), Basic Information (read-only name + residency read via verification's published state, Emirates ID/passport, per-Principal Passport-Based Notarisation toggle), Attorney(s) section + Attorney Authority Mode, and POA Details (Property vs General field sets) with the English Translation Add-on intent captured so the assignment filter can route to a translation-capable Notary office. Value objects: PropertyDetails, GeneralDetails, EnglishTranslationAddonIntent, PrincipalIdentityData, CompanyPartyData. Owns form validation and the type/authority-mode immutability rules. Drives capturing_principal_info -> capturing_poa_details.

---
`domain` → `application` → `infrastructure`, dependencies inward. `domain/ports` = repository ports only.
Part of the POA Module. See [`docs/ARCHITECTURE.md`](../../../../../docs/ARCHITECTURE.md).

