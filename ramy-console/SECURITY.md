# RAMY — data and sharing boundary

This release is a device-local workspace. No client data is intentionally sent to GitHub, an analytics service, a market feed or a remote database. GitHub contains source code and explicitly synthetic QA records only.

Browser storage is **not an encrypted bank vault**. Anyone who can use the same unlocked browser profile, or code served by a compromised hosting origin, may access its records. Client/Meeting/Internal/Advisor modes are presentation controls, not authorization. Do not distribute an editable master as a client report.

Client outputs are assembled from an allowlist. Private client notes, market cost, premium, revenue, internal batch notes, drafts and audit history are excluded from Client HTML/PDF content. Private fields are not merely hidden with CSS. The internal report places its revenue/review appendix after the client-facing sections.

Imported HTML is parsed for JSON data only; its scripts are not executed. Text is escaped before report insertion. Image uploads accept bounded PNG/JPEG/WebP data URLs, not executable SVG. Invalid quantities, dates, unsupported record versions, duplicate record IDs and malformed amounts reject the import rather than silently discard positions.

Keep offline backups in an approved protected location. Clearing browser data, device loss, private browsing and storage eviction can remove records. Avoid simultaneous editing of the same client in multiple tabs; this release does not implement cross-tab conflict merging. There is no cross-device synchronization.

For production use with sensitive customer information, the deploying organization must approve the host, device controls, access policy, retention and backup process. HTTPS, access protection and server headers must be verified on the actual deployment. Do not add credentials or customer exports to this public repository.

A published PWA cannot protect a device that is already unlocked or compromised. Treat client snapshots as confidential client documents even though internal economics are excluded.
