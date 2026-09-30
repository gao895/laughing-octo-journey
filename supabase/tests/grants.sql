-- Supabase grants table privileges to the API roles by default; RLS decides the rest.
grant all on all tables in schema public to anon, authenticated, service_role;
grant execute on all functions in schema public to anon, authenticated;
