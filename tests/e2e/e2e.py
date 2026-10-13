import json, subprocess, time, urllib.request
from playwright.sync_api import sync_playwright, expect
B = 'http://127.0.0.1:3000'; SHOTS = '/home/claude/e2e/shots/'
R = {'pass': 0, 'fail': 0}; errs = []
def ok(c, m):
    R['pass' if c else 'fail'] += 1; print(('PASS ' if c else 'FAIL ') + m, flush=True)
def sql(q):
    return subprocess.run(['psql', '-h', '127.0.0.1', '-p', '54329', '-U', 'postgres', '-d', 'e2e', '-tAc', q], capture_output=True, text=True).stdout.strip()
def mails(): return json.loads(urllib.request.urlopen('http://127.0.0.1:4010/all').read())
def page(ctx, who):
    p = ctx.new_page(); p.set_default_timeout(15000)
    p.on('pageerror', lambda e: errs.append((who, str(e)[:200])))
    return p
def signup(p, name, email):
    p.goto(B + '/auth/sign-up'); p.fill('#name', name); p.fill('#email', email); p.fill('#password', 'correct-horse-9'); p.fill('#country', 'Uzbekistan')
    p.check('input[type=checkbox]'); p.click('button[type=submit]'); p.wait_for_url('**/onboarding', timeout=20000)
def onboard(p, teach, learn, slots=True):
    p.fill('#dob', '2006-04-10'); p.get_by_role('button', name='Next').click()
    p.get_by_text('What can you teach?').wait_for()
    for s in teach: p.fill('input[aria-label="Search skills"]', s); p.get_by_role('button', name=s, exact=True).click(); p.wait_for_timeout(400)
    p.get_by_role('button', name='Next').click(); p.get_by_text('What do you want to learn?').wait_for()
    for s in learn: p.fill('input[aria-label="Search skills"]', s); p.get_by_role('button', name=s, exact=True).click(); p.wait_for_timeout(400)
    p.get_by_role('button', name='Next').click(); p.fill('#bio', 'IELTS 7.5, I like speaking practice.'); p.fill('#langs', 'English, Uzbek'); p.get_by_role('button', name='Next').click()
    p.get_by_text('When are you free to teach?').wait_for()
    if slots:
        btns = p.get_by_role('button', name='Add time')
        for i in range(7): btns.nth(i).click(); p.wait_for_timeout(250)
        p.locator('#dur-30').check(); p.locator('#dur-90').check(); p.get_by_role('button', name='Save', exact=True).click(); p.wait_for_timeout(600)
    p.get_by_role('button', name='Next').click(); p.get_by_text('Your public profile').wait_for()
    p.get_by_role('button', name='Enter the marketplace').click(); p.wait_for_url('**/discover', timeout=20000)

sql("truncate credit_ledger, credit_accounts, bookings, booking_private, conversations, messages, reviews, reports, disputes, abuse_flags, notifications, email_outbox, admin_audit_logs, user_teaching_skills, user_learning_skills, availability_rules, availability_exceptions, profile_private, profiles cascade; delete from auth.users;")
subprocess.run(['psql','-h','127.0.0.1','-p','54329','-U','postgres','-d','e2e','-qf','/home/claude/bb/supabase/seed.sql'], capture_output=True)
urllib.request.urlopen(urllib.request.Request('http://127.0.0.1:4010/reset', method='POST'))
with sync_playwright() as pw:
    b = pw.chromium.launch()
    T = b.new_context(viewport={'width': 1280, 'height': 900}); L = b.new_context(viewport={'width': 1280, 'height': 900}); X = b.new_context(viewport={'width': 1280, 'height': 900})
    t = page(T, 'teacher'); l = page(L, 'learner'); x = page(X, 'outsider')
    t.goto(B + '/'); t.screenshot(path=SHOTS + 'home-empty.png', full_page=True)
    ok('Your Skills Are Worth Something' in t.inner_text('h1'), 'home page renders the hero')
    # 1-3 registration, onboarding, starter credits
    signup(t, 'Aziz Karimov', 'aziz@test.uz'); t.screenshot(path=SHOTS + 'onboarding-1.png', full_page=True); onboard(t, ['English'], ['Python'])
    ok(sql("select available from credit_accounts a join auth.users u on u.id=a.user_id where email='aziz@test.uz'") == '10.0', 'teacher got exactly 10 starter credits')
    signup(l, 'Lola Rahimova', 'lola@test.uz'); onboard(l, ['Python'], ['English'], slots=False)
    signup(x, 'Mira Outsider', 'mira@test.uz'); onboard(x, [], ['Chess'], slots=False)
    ok(sql("select count(*) from credit_ledger where type='starter_grant'") == '3', 'one starter grant per account')
    # 4-5 discovery and reciprocal match
    l.goto(B + '/discover'); l.get_by_text('Best matches for you').wait_for()
    ok('You can teach Python, and Aziz Karimov wants to learn it and can teach English.' in l.inner_text('#matches'), 'reciprocal match explained in plain words')
    l.screenshot(path=SHOTS + 'discover.png', full_page=True)
    l.goto(B + '/discover?q=English'); ok(l.locator('article', has_text='Aziz Karimov').count() >= 1, 'search shows the mentor with open slots')
    l.goto(B + '/discover?q=Chemistry'); ok('No open slots match' in l.inner_text('main'), 'empty state for skills nobody teaches')
    # 6-7 booking with held credits
    l.goto(B + '/discover?q=English'); l.locator('article', has_text='Aziz Karimov').get_by_role('link', name='View available slots').first.click()
    l.wait_for_url('**/u/**'); l.locator('#book button.tabular').first.click()
    l.get_by_label('I agree to the session rules').check(); l.fill('#bk-note', 'Speaking practice for IELTS part 2 please')
    l.screenshot(path=SHOTS + 'booking.png', full_page=True)
    l.get_by_role('button', name='Book for 1 credit').click(); l.get_by_text('Request sent').wait_for()
    ok(sql("select available||'/'||held from credit_accounts a join auth.users u on u.id=a.user_id where email='lola@test.uz'") == '9.0/1.0', 'learner: 9 available, 1 held')
    ok(sql("select count(*) from credit_ledger where type='hold'") == '1', 'credit held exactly once')
    bid = sql("select id from bookings limit 1")
    time.sleep(2)
    ok(any(m['to'] == ['aziz@test.uz'] and 'New session request' in m['subject'] for m in mails()), 'teacher received the booking request email')
    # 8 teacher confirms; meet link
    t.goto(B + '/sessions?tab=pending'); ok('Pending requests' in t.inner_text('main') and t.locator('a', has_text='Lola Rahimova').count() >= 1, 'teacher sees the pending request')
    t.goto(B + f'/sessions/{bid}'); t.get_by_role('button', name='Confirm', exact=True).click(); t.get_by_text('Starts in').wait_for(); t.wait_for_timeout(1500)
    ok(sql(f"select status from bookings where id='{bid}'") == 'confirmed', 'booking confirmed')
    t.fill('input[placeholder="https://meet.google.com/abc-defg-hij"]', 'https://meet.google.com/abc-defg-hij'); t.get_by_role('button', name='Save link').click(); t.wait_for_timeout(1500)
    t.screenshot(path=SHOTS + 'session-teacher.png', full_page=True)
    time.sleep(2); m = mails()
    ok(any(x['to'] == ['lola@test.uz'] and x['subject'].startswith('Confirmed') for x in m) and any(x['to'] == ['aziz@test.uz'] and x['subject'].startswith('Confirmed') for x in m), 'both people got the confirmation email')
    conf = [x for x in m if x['to'] == ['lola@test.uz'] and x['subject'].startswith('Confirmed')][0]['text']
    ok('Aziz Karimov' in conf and '60 min' in conf and '1 credit' in conf and 'Asia/Tashkent' in conf, 'confirmation email has name, time zone, length and credits')
    l.goto(B + f'/sessions/{bid}'); ok(l.get_by_role('link', name='Join Google Meet').get_attribute('href') == 'https://meet.google.com/abc-defg-hij', 'learner sees the Join Google Meet button')
    # 12/18 privacy
    x.goto(B + f'/sessions/{bid}'); ok('Session not found' in x.inner_text('main'), 'outsider cannot open the session or its meeting link')
    # messaging
    l.get_by_role('link', name='Message', exact=True).click(); l.wait_for_url('**/messages**'); l.fill('input[placeholder="Write a message"]', 'Hi! See you on Monday.'); l.get_by_role('button', name='Send').click(); l.wait_for_timeout(1000)
    t.goto(B + '/messages'); t.get_by_role('button', name='Lola Rahimova').click(); t.get_by_text('Hi! See you on Monday.').wait_for()
    ok(True, 'teacher reads the learner message'); t.screenshot(path=SHOTS + 'messages.png')
    x.goto(B + '/messages'); x.wait_for_timeout(2500); print('   outsider messages page:', x.inner_text('main')[:160].replace(chr(10),' | ')); ok('No conversations yet' in x.inner_text('main'), 'outsider sees no conversations')
    # 13 completion: move the session into the past
    sql(f"update bookings set start_at=now()-interval '2 hours', end_at=now()-interval '1 hour', respond_by=now()-interval '3 hours' where id='{bid}'")
    l.goto(B + f'/sessions/{bid}'); l.get_by_role('button', name='Confirm it happened').click(); l.get_by_role('dialog').get_by_role('button', name='Confirm it happened').click(); l.wait_for_timeout(1500)
    ok(sql("select earned from credit_accounts a join auth.users u on u.id=a.user_id where email='aziz@test.uz'") == '0.0', 'no payout after only the learner confirms')
    t.goto(B + f'/sessions/{bid}'); t.get_by_role('button', name='Confirm it happened').click(); t.get_by_role('dialog').get_by_role('button', name='Confirm it happened').click(); t.wait_for_timeout(1500)
    ok(sql("select available||'/'||earned from credit_accounts a join auth.users u on u.id=a.user_id where email='aziz@test.uz'") == '11.0/1.0', 'teacher paid exactly 1 credit after both confirmed')
    ok(sql("select count(*) from credit_ledger where type='teaching_reward'") == '1', 'exactly one payout row')
    # 15 review
    l.goto(B + f'/sessions/{bid}'); l.get_by_role('radiogroup', name='rating').get_by_role('radio', name='5').click(); l.fill('textarea[aria-label^="What went well"]', 'Clear explanations and useful feedback.')
    l.get_by_role('button', name='Publish review').click(); l.get_by_text('You reviewed this session.').wait_for(); ok(True, 'learner left a review')
    l.goto(B + '/wallet'); l.screenshot(path=SHOTS + 'wallet.png', full_page=True); ok('Teaching reward' not in l.inner_text('main') and 'Paid for session' in l.inner_text('main'), 'learner wallet shows the payment row')
    # 16 public stats and leaderboard
    x.goto(B + '/'); ok('1' in x.locator('section.bg-navy').inner_text() and 'Hours exchanged' in x.inner_text('main'), 'home stats come from real records'); x.screenshot(path=SHOTS + 'home.png', full_page=True)
    x.goto(B + '/leaderboard'); ok('Aziz Karimov' in x.inner_text('main') and '1 credit' in x.inner_text('main'), 'leaderboard shows earned credits')
    x.goto(B + '/u/' + sql("select username from profiles where display_name='Aziz Karimov'")); ok('Clear explanations' in x.inner_text('main') and '@test.uz' not in x.inner_text('main'), 'public profile shows the review and never the email'); x.screenshot(path=SHOTS + 'profile.png', full_page=True)
    # 17 admin access
    r = l.goto(B + '/admin'); ok(r.status == 404, 'ordinary member gets 404 on /admin')
    sql("update profiles set role='admin' where display_name='Mira Outsider'")
    x.goto(B + '/admin'); x.get_by_text('Registered users').wait_for(); x.wait_for_timeout(800); ok('Verified hours' in x.inner_text('main'), 'admin dashboard loads for the admin'); x.screenshot(path=SHOTS + 'admin.png', full_page=True)
    x.get_by_role('tab', name='Participants').click(); x.get_by_text('Lola Rahimova').wait_for(); ok(True, 'admin sees participants')
    # cancellation refund via UI
    l.goto(B + '/u/' + sql("select username from profiles where display_name='Aziz Karimov'") + '#book'); l.locator('#book button.tabular').last.click(); l.get_by_label('I agree to the session rules').check(); l.get_by_role('button', name='Book for 1 credit').click(); l.get_by_text('Request sent').wait_for()
    b2 = sql("select id from bookings where status='pending' limit 1"); before = sql("select available from credit_accounts a join auth.users u on u.id=a.user_id where email='lola@test.uz'")
    l.goto(B + f'/sessions/{b2}'); l.get_by_role('button', name='Cancel session').click(); l.get_by_role('dialog').get_by_role('button', name='Cancel session').click(); l.wait_for_timeout(1500)
    after = sql("select available from credit_accounts a join auth.users u on u.id=a.user_id where email='lola@test.uz'")
    ok(float(after) == float(before) + 1, f'cancel returns the held credit ({before} -> {after})')
    # language + phone layout
    m = b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, storage_state=L.storage_state()); mp = page(m, 'mobile')
    mp.goto(B + '/'); mp.get_by_role('button', name='Menu').click(); mp.get_by_role('button', name='UZ').click(); mp.wait_for_timeout(1500)
    ok('Bilimingiz qadrli' in mp.inner_text('h1'), 'Uzbek switch works')
    for path in ['/', '/discover', f'/sessions/{bid}', '/wallet', '/messages', '/settings/availability']:
        mp.goto(B + path); mp.wait_for_timeout(800); w = mp.evaluate('document.documentElement.scrollWidth')
        ok(w <= 390, f'no sideways scroll on phone: {path} ({w})'); mp.screenshot(path=SHOTS + 'm' + path.replace('/', '_')[:30] + '.png', full_page=False)
    print('page errors:', errs[:8])
    print(f"\n{R['pass']} passed, {R['fail']} failed")
    b.close()
