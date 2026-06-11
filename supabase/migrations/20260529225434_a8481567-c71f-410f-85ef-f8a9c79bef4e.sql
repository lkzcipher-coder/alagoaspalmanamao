CREATE OR REPLACE FUNCTION get_server_time()
RETURNS json AS $$
BEGIN
  RETURN json_build_object(
    'now', now(),
    'brazil_day', (now() AT TIME ZONE 'America/Sao_Paulo')::date,
    'brazil_time', (now() AT TIME ZONE 'America/Sao_Paulo')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_server_time() TO anon, authenticated, service_role;