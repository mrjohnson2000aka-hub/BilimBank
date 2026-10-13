-- Optional: send reminders and expire old requests every 5 minutes.
-- 1) In Supabase: Database -> Extensions, enable "pg_cron" and "pg_net".
-- 2) Replace the two values below, then run this file in the SQL editor.
select cron.schedule('bilimbank-every-5-min', '*/5 * * * *', $$
  select net.http_get(
    url := 'https://YOUR-SITE.vercel.app/api/cron',
    headers := jsonb_build_object('Authorization', 'Bearer YOUR-CRON-SECRET')
  );
$$);
-- To stop it later:  select cron.unschedule('bilimbank-every-5-min');
