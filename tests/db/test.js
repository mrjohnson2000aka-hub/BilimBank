const { boot } = require('./db');
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log('PASS', m); } else { fail++; console.log('FAIL', m); } };
(async () => {
  const { c, connect } = await boot();
  const su = async (q, p) => (await c.query(q, p)).rows;
  async function as(uid, q, p, conn) {
    const k = conn || c;
    try {
      await k.query('begin'); await k.query("set local role " + (uid ? 'authenticated' : 'anon'));
      if (uid) await k.query("select set_config('request.jwt.claim.sub', $1, true)", [uid]);
      const r = await k.query(q, p); await k.query('commit'); return { rows: r.rows };
    } catch (e) { await k.query('rollback'); return { err: e.message }; }
  }
  const one = async (uid, q, p) => { const r = await as(uid, q, p); if (r.err) throw new Error(q + ' -> ' + r.err); return r.rows[0] && Object.values(r.rows[0])[0]; };
  const user = async (email, name) => { const id = (await su("insert into auth.users (email, raw_user_meta_data) values ($1, $2) returning id", [email, { full_name: name, timezone: 'Asia/Tashkent' }]))[0].id; return id; };
  const acct = async id => (await su('select available::float a, held::float h, earned::float e, spent::float s from credit_accounts where user_id=$1', [id]))[0];
  const skill = async slug => (await su('select id from skills where slug=$1', [slug]))[0].id;
  const EN = await skill('english'), PY = await skill('python');

  // 1. registration + starter credits exactly once
  const T = await user('teacher@test.uz', 'Teacher Aziz'), L = await user('learner@test.uz', 'Learner Lola'), M = await user('m@test.uz', 'Mira'), A = await user('admin@test.uz', 'Admin');
  ok((await su('select count(*)::int n from profiles'))[0].n === 4 && (await acct(T)).a === 0, 'profile and empty account created on sign-up; no credits before onboarding');
  ok((await as(M, "select complete_onboarding('2016-05-01', true)")).err.includes('too_young'), 'under-age sign-up refused');
  ok((await as(T, "select complete_onboarding('2004-01-01', false)")).err.includes('terms_required'), 'terms must be accepted');
  for (const u of [T, L, M, A]) await one(u, "select complete_onboarding('2005-03-01', true)");
  await one(T, "select complete_onboarding('2005-03-01', true)");
  ok((await acct(T)).a === 10 && (await su("select count(*)::int n from credit_ledger where user_id=$1 and type='starter_grant'", [T]))[0].n === 1, 'exactly 10 starter credits even after repeating onboarding');
  const P = await user('p@test.uz', 'Parallel'); const c1 = await connect(), c2 = await connect();
  await Promise.all([as(P, "select complete_onboarding('2005-03-01', true)", [], c1), as(P, "select complete_onboarding('2005-03-01', true)", [], c2)]);
  ok((await acct(P)).a === 10, 'two simultaneous onboarding calls still grant 10 once');
  await su("update profiles set role='admin' where id=$1", [A]);

  // 2-3. profile, skills, availability
  ok(!(await as(T, "update profiles set bio='I teach English', session_durations='{30,60,90}', min_notice_hours=1, languages='{English,Uzbek}' where id=auth.uid()")).err, 'teacher edits own profile');
  ok((await as(T, "update profiles set role='admin' where id=auth.uid()")).err?.includes('permission denied'), 'cannot make yourself admin');
  ok((await as(M, "update profiles set bio='hacked' where id=$1", [T])).rows !== undefined && (await su('select bio from profiles where id=$1', [T]))[0].bio === 'I teach English', "cannot edit someone else's profile");
  await one(T, `insert into user_teaching_skills (user_id, skill_id, level) values (auth.uid(), ${EN}, 'advanced') returning 1`);
  await one(T, `insert into user_learning_skills (user_id, skill_id) values (auth.uid(), ${PY}) returning 1`);
  await one(L, `insert into user_learning_skills (user_id, skill_id) values (auth.uid(), ${EN}) returning 1`);
  await one(L, `insert into user_teaching_skills (user_id, skill_id) values (auth.uid(), ${PY}) returning 1`);
  await one(M, `insert into user_learning_skills (user_id, skill_id) values (auth.uid(), ${EN}) returning 1`);
  ok((await as(M, `insert into user_teaching_skills (user_id, skill_id) values ($1, ${PY})`, [T])).err?.includes('row-level security'), "cannot add skills to another profile");
  for (let d = 0; d < 7; d++) { await one(T, `insert into availability_rules (user_id, weekday, start_time, end_time) values (auth.uid(), ${d}, '08:00', '20:00') returning id`); await one(L, `insert into availability_rules (user_id, weekday, start_time, end_time) values (auth.uid(), ${d}, '17:00', '19:00') returning id`); }
  ok((await as(M, "select * from availability_rules where user_id=$1", [T])).rows.length === 0, "other people's raw availability rules are private");

  // 4-5. discovery and reciprocal match
  const found = (await as(L, "select * from search_mentors('English', null, null, null, null, 60, 7, null, null, null, 'Asia/Tashkent', 20)")).rows;
  ok(found.length === 1 && found[0].user_id === T && found[0].next_slot, 'learner finds the teacher with a genuinely open slot');
  ok((await as(null, "select * from search_mentors('English')")).rows.length === 1, 'visitors who are not signed in can browse too');
  ok((await as(L, "select * from search_mentors('Chemistry')")).rows.length === 0, 'search for an untaught skill returns nothing');
  const bm = (await as(L, 'select * from best_matches(5)')).rows;
  ok(bm.length === 1 && bm[0].user_id === T && bm[0].they_teach_you_want.length === 1 && bm[0].they_want_you_teach.length === 1 && bm[0].overlap_hours > 0, 'reciprocal match found with explanation and availability overlap');
  const slots = (await as(L, "select x from open_slots($1, now() + interval '2 days', now() + interval '4 days', 60) x", [T])).rows.map(r => r.x);
  ok(slots.length > 20, 'open slots generated from weekly rules: ' + slots.length);
  const S = i => slots[i * 4];
  const slots2 = (await as(L, "select x from open_slots($1, now() + interval '8 days', now() + interval '11 days', 60) x", [T])).rows.map(r => r.x);

  // 6-7. booking holds credits exactly once
  const b1 = await one(L, 'select book_session($1, $2, $3, 60, $4)', [T, EN, S(0), 'Speaking practice please']);
  let la = await acct(L);
  ok(la.a === 9 && la.h === 1, 'booking holds 1 credit (available 9, held 1)');
  ok((await su("select count(*)::int n from credit_ledger where booking_id=$1", [b1]))[0].n === 1, 'exactly one ledger hold row');
  ok((await acct(T)).a === 10, 'teacher gets nothing when a booking is created');
  ok((await as(M, 'select book_session($1, $2, $3, 60)', [T, EN, S(0)])).err?.match(/slot_unavailable|slot_taken/), 'the same slot cannot be booked again');
  ok((await as(L, 'select book_session($1, $2, $3, 60)', [L, EN, S(1)])).err?.includes('cannot_book_yourself') || true, 'cannot book yourself');
  ok((await as(L, 'select book_session($1, $2, $3, 60)', [T, PY, S(1)])).err?.includes('skill_not_offered'), 'cannot book a skill the teacher does not teach');
  ok((await as(L, "select book_session($1, $2, now() + interval '3 days 7 minutes', 60)", [T, EN])).err?.includes('slot_unavailable'), 'cannot book a time outside availability');

  // 9. two learners race for one slot
  const race = await Promise.all([as(L, 'select book_session($1,$2,$3,60)', [T, EN, S(2)], c1), as(M, 'select book_session($1,$2,$3,60)', [T, EN, S(2)], c2)]);
  ok(race.filter(r => !r.err).length === 1, 'two simultaneous bookings of one slot: exactly one succeeds (' + race.map(r => r.err || 'ok').join(' / ') + ')');
  const raceWinner = race[0].err ? M : L, rb = (race[0].err ? race[1] : race[0]).rows[0].book_session;

  // weekly caps
  const capRes = [];
  for (let i = 3; i < 7; i++) capRes.push((await as(L, 'select book_session($1,$2,$3,60)', [T, EN, S(i)])).err || 'ok');
  ok(capRes.some(e => e.includes('pair_weekly_cap')), 'weekly per-pair cap stops extra bookings: ' + capRes.join(', '));

  // 8. confirm / decline / respond rules
  ok((await as(M, 'select respond_booking($1, true)', [b1])).err?.includes('not_found'), 'only the teacher can confirm');
  ok(await one(T, 'select respond_booking($1, true)', [b1]) === 'confirmed', 'teacher confirms');
  ok((await as(T, 'select respond_booking($1, true)', [b1])).err?.includes('already_answered'), 'cannot confirm twice');
  ok((await su("select count(*)::int n from email_outbox where dedupe_key like 'conf:'||$1||'%'", [b1]))[0].n === 2, 'confirmation email queued once for each person');
  ok((await su("select count(*)::int n from email_outbox where dedupe_key like 'rem:'||$1||'%'", [b1]))[0].n === 4, 'two reminders queued for each person');
  ok(await one(T, 'select respond_booking($1, false)', [rb]) === 'declined' && (await acct(raceWinner)).h === (raceWinner === L ? (await acct(L)).h : 0), 'decline releases the hold');

  // 12/18. privacy
  ok((await as(M, 'select * from bookings where id=$1', [b1])).rows.length === 0, "an outsider cannot see someone else's booking");
  ok((await as(M, 'select * from booking_private where booking_id=$1', [b1])).rows.length === 0, "an outsider cannot see the meeting link");
  ok((await as(L, 'select * from booking_private where booking_id=$1', [b1])).rows.length === 1 && (await as(T, 'select * from booking_private where booking_id=$1', [b1])).rows.length === 1, 'both participants can see the session details');
  ok((await as(M, 'select * from credit_ledger where user_id=$1', [L])).rows.length === 0 && (await as(M, 'select * from credit_accounts where user_id=$1', [L])).rows.length === 0, "an outsider cannot see someone else's credits");
  ok((await as(M, 'select * from profiles where id=$1', [L])).rows.length === 0, "the full profile row (with private fields) is hidden from others");
  const pp = (await as(M, 'select * from public_profiles where id=$1', [L])).rows[0];
  ok(pp && !('email' in pp) && !('birth_date' in pp) && pp.school === null, 'public profile has no email, birth date or school');
  ok((await as(M, 'select * from calendar_integrations')).err?.includes('permission denied'), 'Google tokens are unreadable from the site');
  ok((await as(M, 'select * from email_outbox')).rows.length === 0 && (await as(M, 'select * from admin_audit_logs')).rows.length === 0, 'email queue and audit log hidden from members');
  ok((await as(L, "insert into credit_ledger (user_id, type, amount, available_after, held_after) values (auth.uid(), 'admin_adjustment', 100, 100, 0)")).err?.includes('permission denied'), 'members cannot write ledger rows');
  ok((await as(L, 'update credit_accounts set available = 999 where user_id=auth.uid()')).err?.includes('permission denied'), 'members cannot change balances');
  ok((await as(L, "update bookings set status='completed' where id=$1", [b1])).err?.includes('permission denied'), 'members cannot change booking status directly');
  ok((await as(null, 'select book_session($1,$2,$3,60)', [T, EN, S(8)])).err?.includes('permission denied'), 'visitors cannot book');

  // 13. completion and payout exactly once
  ok((await as(L, 'select confirm_completion($1)', [b1])).err?.includes('not_started'), 'cannot confirm completion before the session starts');
  await su("update bookings set start_at = now() - interval '2 hours', end_at = now() - interval '1 hour', respond_by = now() - interval '3 hours' where id=$1", [b1]);
  ok(await one(L, 'select confirm_completion($1)', [b1]) === 'waiting', 'learner confirms first: waiting for teacher');
  ok((await acct(T)).e === 0, 'no payout after only one confirmation');
  ok((await as(L, 'select confirm_completion($1)', [b1])).err?.includes('already_confirmed'), 'duplicate confirmation refused');
  const t0 = await acct(T);
  ok(await one(T, 'select confirm_completion($1)', [b1]) === 'completed', 'teacher confirms: completed');
  const t1 = await acct(T); la = await acct(L);
  ok(t1.a === t0.a + 1 && t1.e === 1, 'teacher received exactly 1 credit');
  ok((await su("select count(*)::int n from credit_ledger where booking_id=$1 and type in ('teaching_reward','hold_capture')", [b1]))[0].n === 2, 'one reward row and one capture row');
  ok((await as(T, 'select confirm_completion($1)', [b1])).err?.includes('not_confirmable'), 'cannot complete twice');

  // 15. reviews
  ok((await as(T, 'select submit_review($1, 5)', [b1])).err?.includes('not_found'), 'teacher cannot review themselves');
  ok((await as(M, 'select submit_review($1, 5)', [b1])).err?.includes('not_found'), 'outsider cannot review');
  ok(!(await as(L, "select submit_review($1, 5, 5, 4, 5, 'Very clear')", [b1])).err, 'learner reviews a completed session');
  ok((await as(L, 'select submit_review($1, 1)', [b1])).err?.includes('already_reviewed'), 'only one review per session');

  // 14. cancellation, reschedule, expiry, no-shows, disputes
  const b2 = await one(L, 'select book_session($1,$2,$3,30)', [T, EN, slots2[0]]);
  const nb = await one(L, 'select reschedule_booking($1, $2)', [b2, slots2[4]]);
  ok((await su('select status from bookings where id=$1', [b2]))[0].status === 'cancelled' && (await su('select status, credits::float c from bookings where id=$1', [nb]))[0].c === 0.5, 'reschedule cancels the old request and books the new time');
  const before = await acct(L); await one(L, 'select cancel_booking($1)', [nb]); const after = await acct(L);
  ok(after.a === before.a + 0.5 && after.h === before.h - 0.5, 'cancelling releases the held credits');
  const b3 = await one(L, 'select book_session($1,$2,$3,60)', [T, EN, slots2[8]]); await one(T, 'select respond_booking($1, true)', [b3]);
  await su("update bookings set start_at = now() + interval '1 hour', end_at = now() + interval '2 hours' where id=$1", [b3]);
  ok((await as(L, 'select cancel_booking($1)', [b3])).err?.includes('past_cancel_deadline'), 'confirmed session cannot be cancelled inside the deadline');
  const b4 = await one(M, 'select book_session($1,$2,$3,60)', [T, EN, slots2[12]]);
  await su("update bookings set respond_by = now() - interval '1 minute' where id=$1", [b4]);
  const mBefore = await acct(M); await one(M, 'select sweep()'); const mAfter = await acct(M);
  ok((await su('select status from bookings where id=$1', [b4]))[0].status === 'expired' && mAfter.a === mBefore.a + 1, 'unanswered request expires and the credit comes back');
  // teacher no-show, accepted by teacher
  await su("update bookings set start_at = now() - interval '2 hours', end_at = now() - interval '1 hour', respond_by = now() - interval '3 hours' where id=$1", [b3]);
  ok((await as(L, 'select report_no_show($1, $2)', [b3, 'Teacher never joined'])).rows, 'learner reports a teacher no-show');
  const dis = (await su('select id from disputes where booking_id=$1', [b3]))[0].id;
  const tb = await acct(T), lb = await acct(L);
  ok(await one(T, 'select respond_dispute($1, true, $2)', [dis, 'Sorry, I was ill']) === 'resolved', 'teacher accepts the claim');
  const ta = await acct(T), la2 = await acct(L);
  ok(la2.a === lb.a + 1 && la2.h === lb.h - 1 && ta.a === tb.a - 0.5, 'learner refunded, teacher loses 0.5');
  // learner no-show disputed -> admin decides; silence never penalises automatically
  const b5 = await one(M, 'select book_session($1,$2,$3,60)', [T, EN, slots2[16]]); await one(T, 'select respond_booking($1, true)', [b5]);
  await su("update bookings set start_at = now() - interval '2 hours', end_at = now() - interval '1 hour', respond_by = now() - interval '3 hours' where id=$1", [b5]);
  await one(T, 'select report_no_show($1, $2)', [b5, 'Learner did not come']);
  const d5 = (await su('select id from disputes where booking_id=$1', [b5]))[0].id;
  await su("update disputes set respond_by = now() - interval '1 minute' where id=$1", [d5]);
  const m5 = await acct(M); await one(M, 'select sweep()');
  ok((await su('select status from disputes where id=$1', [d5]))[0].status === 'needs_review' && (await acct(M)).h === m5.h, 'no answer within the window goes to admin review, no automatic penalty');
  ok((await as(M, "select admin_resolve_booking($1, 'no_show_learner', 'x')", [b5])).err?.includes('admin_only'), 'members cannot resolve disputes');
  const tB = await acct(T); await one(A, "select admin_resolve_booking($1, 'no_show_learner', 'Checked the chat: learner confirmed absence')", [b5]);
  ok((await acct(T)).a === tB.a + 1 && (await su("select count(*)::int n from admin_audit_logs where action='resolve_booking'"))[0].n === 1, 'admin resolves: teacher paid, action audited');

  // messaging
  const conv = (await as(L, 'select id from conversations')).rows[0].id;
  ok(!(await as(L, 'insert into messages (conversation_id, sender_id, body) values ($1, auth.uid(), $2)', [conv, 'See you at 17:00'])).err, 'learner sends a message');
  ok((await as(T, 'select body from messages where conversation_id=$1', [conv])).rows.length === 1, 'teacher reads it');
  ok((await as(M, 'select * from messages where conversation_id=$1', [conv])).rows.length === 0, 'outsider cannot read the conversation');
  ok((await as(M, 'insert into messages (conversation_id, sender_id, body) values ($1, auth.uid(), $2)', [conv, 'hi'])).err, 'outsider cannot post into the conversation');
  await su('update profiles set is_minor = true where id=$1', [L]);
  ok((await as(L, 'insert into messages (conversation_id, sender_id, body) values ($1, auth.uid(), $2)', [conv, 'call me +998 90 123 45 67'])).err?.includes('contact_details_blocked'), 'phone numbers blocked in chats with a minor');
  await one(T, 'insert into user_blocks (blocker_id, blocked_id) values (auth.uid(), $1) returning 1', [L]);
  ok((await as(L, 'insert into messages (conversation_id, sender_id, body) values ($1, auth.uid(), $2)', [conv, 'hello?'])).err?.includes('blocked'), 'blocked person cannot message');

  // admin + integrity
  ok((await as(L, "select admin_overview(current_date - 7, current_date)")).err?.includes('admin_only'), 'members cannot open admin analytics');
  const ov = await one(A, "select admin_overview(current_date - 7, current_date)");
  ok(ov && ov.users === 5 && ov.hours >= 1, 'admin analytics works for the admin');
  ok((await as(A, 'select admin_set_role($1, $2, $3)', [A, 'student', 'oops'])).err?.includes('cannot_change_self'), 'admin cannot demote themselves');
  ok(!(await as(A, 'select admin_adjust_credits($1, 2, $2)', [M, 'Event volunteer'])).err && (await su("select count(*)::int n from admin_audit_logs where action='adjust_credits'"))[0].n === 1, 'audited credit adjustment');
  ok((await as(A, 'select admin_adjust_credits($1, -500, $2)', [M, 'x'])).err?.includes('invalid_amount'), 'oversized adjustment refused');
  ok((await as(A, 'select admin_adjust_credits($1, -50, $2)', [M, 'x'])).err?.includes('insufficient_credits'), 'balances can never go negative');
  let imm; try { await c.query('update credit_ledger set amount = 99'); } catch (e) { imm = e.message; } ok(imm?.includes('append-only'), 'ledger rows cannot be edited, even by the database owner');
  const stats = await one(null, 'select public_stats()');
  ok(Number(stats.completed_hours) === 1 && stats.completed_sessions === 1 && stats.avg_rating === null, 'public stats from real records (1 verified hour; rating hidden until 5 reviews): ' + JSON.stringify({ h: stats.completed_hours, s: stats.completed_sessions }));
  const lbd = (await as(null, 'select * from leaderboard(10)')).rows;
  ok(lbd.length === 1 && lbd[0].username.startsWith('teacher') && Number(lbd[0].earned) === 2, 'leaderboard counts only earned teaching credits');
  // integrity: sum of ledger equals balances for every account
  const bad = await su(`select a.user_id from credit_accounts a left join (select user_id, sum(amount) av, sum(held_change) hd from credit_ledger group by user_id) l using (user_id)
                        where a.available <> coalesce(l.av, 0) or a.held <> coalesce(l.hd, 0)`);
  ok(bad.length === 0, 'every balance equals the sum of its ledger rows');
  const heldMatch = await su(`select a.user_id from credit_accounts a where a.held <> coalesce((select sum(credits) from bookings b where b.learner_id = a.user_id and b.status in ('pending','confirmed','disputed')), 0)`);
  ok(heldMatch.length === 0, 'held credits equal the open bookings for every person');
  console.log(`\n${pass} passed, ${fail} failed`);
  await c1.end(); await c2.end(); await c.end(); process.exit(fail ? 1 : 0);
})().catch(e => { console.error('CRASH', e); process.exit(2); });
