# Hotfix release 1.4.1 — Falso "username en uso" durante el signup

Hotfix puntual sobre `main` (tag `v1.4.1`, 2026-06-16). Un solo cambio.

## Corrección

1. **El alta mostraba "usuario no disponible" aunque el username estuviera libre.**
   La comprobación previa de disponibilidad (`username_available`, RPC introducida
   en la 1.3.1) bloqueaba el signup cuando la RPC fallaba: `data` llegaba `null`
   y el `if (!usernameOk)` lo interpretaba como "ocupado". Corregido en
   `src/lib/actions/auth.ts`: solo se bloquea con un `false` explícito; ante un
   error de la RPC se continúa y el trigger `handle_new_user` actúa como gate
   final (que es quien tiene la última palabra en cualquier caso).
