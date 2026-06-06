-- Los triggers que mantienen datos derivados (global_score cacheado y afinidad)
-- deben ejecutarse con privilegios del propietario, no del invocador: una
-- interacción de un usuario 'authenticated' (sin UPDATE sobre recommendations)
-- dispara la actualización de recommendations.global_score, que de otro modo
-- falla con "permission denied for table recommendations" y aborta la operación.

alter function public.maintain_global_score() security definer;
alter function public.maintain_global_score() set search_path = public;

alter function public.maintain_affinity() security definer;
alter function public.maintain_affinity() set search_path = public;
