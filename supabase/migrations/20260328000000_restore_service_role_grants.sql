-- Restaura privilegios de service_role en public.
-- Sin esto, APIs server (service role) y scripts de alta fallan con 42501.
-- RLS sigue aplicando a anon/authenticated; service_role bypassa RLS pero
-- igual necesita GRANT a nivel de tabla.

grant usage on schema public to service_role;

grant select, insert, update, delete, truncate, references, trigger
  on all tables in schema public
  to service_role;

grant usage, select, update
  on all sequences in schema public
  to service_role;

grant execute
  on all functions in schema public
  to service_role;

alter default privileges in schema public
  grant select, insert, update, delete, truncate, references, trigger
  on tables to service_role;

alter default privileges in schema public
  grant usage, select, update
  on sequences to service_role;

alter default privileges in schema public
  grant execute
  on functions to service_role;
