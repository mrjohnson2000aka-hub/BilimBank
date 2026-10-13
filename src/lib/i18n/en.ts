const en = {
  common: {
    appName: 'BilimBank', join: 'Join BilimBank', signIn: 'Sign in', signOut: 'Sign out', save: 'Save', saved: 'Saved', saving: 'Saving…', cancel: 'Cancel', close: 'Close',
    back: 'Back', next: 'Next', skip: 'Do this later', loading: 'Loading…', edit: 'Edit', remove: 'Remove', confirm: 'Confirm', search: 'Search', optional: 'optional',
    credit: 'credit', credits: 'credits', minutes: 'min', viewProfile: 'View profile', viewSlots: 'View available slots', tryAgain: 'Try again',
    somethingWrong: 'Something went wrong. Please try again.', example: 'Example', seeAll: 'See all', yes: 'Yes', no: 'No', none: 'None yet', add: 'Add',
    areYouSure: 'Are you sure?', newMentor: 'New mentor', reviewsN: '{n} reviews', reviews1: '1 review', you: 'You', deletedUser: 'Former member'
  },
  nav: {
    how: 'How it works', explore: 'Explore skills', community: 'Community', discover: 'Discover', sessions: 'Sessions', messages: 'Messages', wallet: 'Wallet',
    notifications: 'Notifications', profile: 'My public profile', settings: 'Settings', admin: 'Admin', leaderboard: 'Leaderboard', help: 'Help center',
    availability: 'Availability', account: 'Account and privacy', editProfile: 'Edit profile', menu: 'Menu'
  },
  home: {
    heroTitle: 'Your Skills Are Worth Something. Share Them.',
    heroText: "Teach what you know. Learn what you've always wanted. Exchange skills with students and grow together, without paying for lessons.",
    ctaPrimary: 'Start Learning for Free', ctaSecondary: 'Explore Skills', exampleLabel: 'Example profile', oneCredit: '1 hour of teaching = 1 credit',
    exampleName: 'Sample mentor', exampleBio: 'Teaches algebra, wants to learn graphic design', exchangeA: 'You teach English', exchangeB: 'You learn Python',
    howTitle: 'How it works', howText: 'Four steps from sign-up to your first lesson.',
    steps: [
      ['Create your profile', 'Add your skills, interests, and availability.'],
      ['Share your knowledge', 'Offer lessons in subjects you understand.'],
      ['Exchange credits', 'Earn one credit for every hour of completed teaching.'],
      ['Learn something new', 'Spend your credits learning from another student.']
    ],
    popularTitle: 'Popular skills', popularText: 'Pick a subject to see who can teach it this week.',
    featuredTitle: 'Featured student mentors', featuredText: 'Rated mentors with open times this week.', featuredEmpty: 'Mentors appear here as soon as students add skills and free times. You could be the first.',
    matchTitle: 'Find your perfect skill match', matchText: 'BilimBank puts the best swap first: someone who teaches what you want and wants what you teach. Matching is rule-based and transparent, and every suggestion explains why it was chosen.',
    matchCta: 'See my matches',
    statsTitle: 'BilimBank in numbers', statActive: 'Active students', statActiveDef: 'Signed in or took part in the last 30 days',
    statHours: 'Hours exchanged', statHoursDef: 'Only sessions both people confirmed', statSessions: 'Completed sessions', statRating: 'Average rating',
    statRatingPending: 'Shown after 5 reviews', recentTitle: 'Recently completed', recentItem: '{skill} · {min} min',
    testimonialsTitle: 'What learners say', testimonialFrom: 'A learner about {name}',
    faqTitle: 'Questions students ask',
    faq: [
      ['Is BilimBank really free?', 'Yes. There is no money on BilimBank. You earn credits by teaching and spend them on learning. New members get 10 starter credits.'],
      ['What if I am not an expert?', 'You do not need to be. Teach what you know well, set your level honestly, and learners choose what fits them.'],
      ['How do lessons happen?', 'Online, on Google Meet. After a teacher confirms, both of you get the time and the meeting link in My Sessions.'],
      ['When does the teacher get the credit?', 'Only after both people confirm the session took place. Until then the credit is held, not spent.'],
      ['What if someone does not show up?', 'Report it from the session page. The other person can respond, and an administrator reviews any disagreement before credits move.'],
      ['Is my information private?', 'Your email, birth date, messages, credit history and meeting links are never shown on your public profile.']
    ],
    safetyTitle: 'Safety and community guidelines',
    safety: [
      ['Respect first', 'Be kind, on time, and on topic. Harassment and discrimination lead to suspension.'],
      ['Keep it on BilimBank', 'Arrange sessions in BilimBank messages. Contact details are blocked in chats that involve a student under 18.'],
      ['Guardians are welcome', 'A parent or guardian may join any session of a student under 18.'],
      ['Report anything wrong', 'Every session and chat has a report button. Reports go privately to the administrators.']
    ],
    finalTitle: 'Your first lesson is 10 credits away', finalText: 'Create a free profile, add one skill you can teach, and book a mentor today.'
  },
  footer: {
    tagline: 'Learn for free by teaching what you are good at.', about: 'About', help: 'Help Center', privacy: 'Privacy Policy', terms: 'Terms',
    guidelines: 'Community Guidelines', contact: 'Contact', product: 'Product', company: 'BilimBank', legal: 'Policies'
  },
  auth: {
    signUpTitle: 'Create your BilimBank account', signUpText: 'Free for every student. You get 10 starter credits after a short setup.',
    fullName: 'Full name', email: 'Email address', password: 'Password', passwordHint: 'At least 8 characters.', country: 'Country', timezone: 'Time zone',
    language: 'Preferred language', agreePrefix: 'I agree to the', terms: 'Terms', privacy: 'Privacy Policy', guidelines: 'Community Guidelines', and: 'and',
    createAccount: 'Create account', haveAccount: 'Already have an account?', signInTitle: 'Welcome back', signInText: 'Sign in to book sessions and manage your credits.',
    noAccount: 'New to BilimBank?', forgot: 'Forgot password?', forgotTitle: 'Reset your password', forgotText: 'Enter your email and we will send you a reset link.',
    sendLink: 'Send reset link', linkSent: 'If an account exists for that email, a reset link is on its way.', checkEmailTitle: 'Check your email',
    checkEmailText: 'We sent a confirmation link to {email}. Open it to verify your address and continue setting up your profile.',
    resetTitle: 'Choose a new password', newPassword: 'New password', updatePassword: 'Update password', passwordUpdated: 'Password updated.',
    google: 'Continue with Google', or: 'or', mustAgree: 'Please accept the terms to continue.', invalidLogin: 'Email or password is incorrect.',
    emailNotConfirmed: 'Please confirm your email first. Check your inbox for the link.', weakPassword: 'Use at least 8 characters.', emailTaken: 'That email is already registered. Try signing in.'
  },
  onboarding: {
    title: 'Set up your profile', stepOf: 'Step {n} of 6', stepNames: ['Profile', 'I can teach', 'I want to learn', 'About me', 'Availability', 'Preview'],
    s1Title: 'Tell students who you are', s1Text: 'Your name and photo appear on your public profile. School and birth date stay private unless you choose to share your school.',
    displayName: 'Display name', username: 'Username', usernameHint: 'Lowercase letters, numbers and _ only. Used in your profile link.', avatar: 'Profile photo',
    upload: 'Upload photo', avatarHint: 'PNG, JPG or WebP, up to 2 MB.', school: 'School, university or learning center', level: 'Grade, year or level',
    showSchool: 'Show my school on my public profile', showSchoolMinor: 'Hidden for students under 18.', birthDate: 'Date of birth', birthHint: 'Private. Used only to apply our age policy (13+).',
    s2Title: 'What can you teach?', s2Text: 'Pick skills you know well and set your level honestly. You can change this any time.',
    s3Title: 'What do you want to learn?', s3Text: 'We use this to find mentors for you and to suggest two-way swaps.',
    searchSkills: 'Search skills', suggest: 'Suggest "{name}" as a new skill', suggestHint: 'Suggested skills are reviewed by an administrator. You can use yours right away.',
    levels: { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced', expert: 'Expert' }, yourLevel: 'Your level',
    s4Title: 'A short introduction', s4Text: 'Two or three sentences: your results, experience and how you like to teach.', bio: 'About me',
    bioPh: 'e.g. IELTS 7.5. I like practising speaking with real topics and give clear feedback.', languages: 'Languages you can teach in', languagesHint: 'Separate with commas, e.g. English, Uzbek, Russian',
    s5Title: 'When are you free to teach?', s5Text: 'Add weekly times. Learners can only book inside them, and never twice for the same time.',
    s6Title: 'Your public profile', s6Text: 'This is what other students see. Private details are never shown.',
    agree: 'I agree to the Terms, Privacy Policy and Community Guidelines.', finish: 'Enter the marketplace', laterHint: 'You can complete optional fields later in Settings.',
    tooYoung: 'BilimBank is for students aged {age} and over.', needName: 'Please add your name.', needBirth: 'Please add your date of birth.', needUsername: 'Choose a username of 3 to 24 characters.',
    usernameTaken: 'That username is taken.', welcome: 'Welcome to BilimBank. 10 credits were added to your wallet.'
  },
  skills: { levelLabel: 'Level', teachersN: '{n} mentors', teachers1: '1 mentor', learnersN: '{n} learners', teachThis: 'I can teach this', noMentors: 'No mentor has open times for this skill right now.', category: 'Category' },
  profile: {
    teaches: 'I can teach', wantsToLearn: 'I want to learn', rating: 'Rating', reviews: 'Reviews', noReviews: 'No reviews yet.', completed: 'Completed sessions',
    hoursTaught: 'Hours taught', hoursLearned: 'Hours learned', memberSince: 'Member since {date}', languages: 'Teaches in', online: 'Online on Google Meet',
    bookTitle: 'Book a session', chooseSkill: 'Skill', duration: 'Length', pickDay: 'Day', noSlots: 'No open times on this day. Try another day.',
    noSlotsAtAll: 'No open times in the next weeks.', cost: 'Cost', balanceAfter: 'Your balance after booking', note: 'Message for the mentor', notePh: 'What would you like to work on?',
    rulesTitle: 'Session rules', rules: 'Be on time, respectful and on topic. Keep chat inside BilimBank. A parent or guardian may join any session. Report anything that feels wrong.',
    agreeRules: 'I agree to the session rules', bookNow: 'Book for {c}', bookedTitle: 'Request sent', bookedText: '{name} will confirm or decline. Your credits are on hold until then.',
    openSession: 'Open session', signInToBook: 'Sign in to book', yourProfile: 'This is your public profile.', balance: 'Your balance', upcomingOwner: 'Your upcoming sessions (only you see this)',
    timesIn: 'Times shown in {tz}', notFound: 'This profile does not exist or is no longer available.', report: 'Report profile', block: 'Block', unblock: 'Unblock'
  },
  discover: {
    title: 'Explore skills', subtitle: 'Only mentors with real open times that match your filters are shown.', searchPh: 'Skill or name, e.g. English, Algebra, Python',
    category: 'Category', anyCategory: 'All categories', language: 'Teaching language', anyLanguage: 'Any language', level: 'Mentor level', anyLevel: 'Any level',
    minRating: 'Minimum rating', anyRating: 'Any rating', duration: 'Session length', when: 'When', next7: 'Next 7 days', next14: 'Next 14 days', next30: 'Next 30 days',
    onDate: 'On a date', timeOfDay: 'Time of day', anyTime: 'Any time', morning: 'Morning (06–12)', afternoon: 'Afternoon (12–17)', evening: 'Evening (17–23)',
    apply: 'Show available slots', reset: 'Clear filters', results: '{n} mentors with open slots', results1: '1 mentor with open slots', noResults: 'No open slots match these filters',
    noResultsText: 'Try a wider time range, another day or fewer filters.', bestTitle: 'Best matches for you', bestText: 'Ranked by two-way skill swaps first, then shared free time, language and ratings.',
    bestEmpty: 'Add skills you want to learn in your profile to see matches.', reasonBoth: 'You can teach {mine}, and {name} wants to learn it and can teach {theirs}.',
    reasonTeach: '{name} teaches {theirs}, which you want to learn.', overlapH: '{n} weekly hours of shared free time', sharedLang: 'Both speak {langs}', past: '{n} sessions together before',
    signInForMatches: 'Sign in to see two-way matches.', nextFree: 'Next free', levelIn: '{level} in {skill}', filters: 'Filters'
  },
  status: {
    pending: 'Pending confirmation', confirmed: 'Confirmed', upcoming: 'Upcoming', in_progress: 'In progress', awaiting: 'Awaiting completion', completed: 'Completed',
    cancelled: 'Cancelled', declined: 'Declined', expired: 'Expired', disputed: 'Disputed', no_show_learner: 'No-show (learner)', no_show_teacher: 'No-show (teacher)', void: 'Cancelled by admin'
  },
  sessions: {
    title: 'My sessions', tabs: { upcoming: 'Upcoming', pending: 'Pending requests', awaiting: 'Awaiting confirmation', completed: 'Completed', cancelled: 'Cancelled' },
    empty: { upcoming: 'No upcoming sessions. Book a mentor to get started.', pending: 'No requests waiting.', awaiting: 'Nothing to confirm right now.', completed: 'No completed sessions yet.', cancelled: 'Nothing cancelled.' },
    list: 'List', calendar: 'Week', youTeach: 'You teach {name}', youLearn: 'You learn from {name}', needsYou: 'Needs your action',
    confirm: 'Confirm', decline: 'Decline', cancel: 'Cancel session', reschedule: 'Reschedule', join: 'Join Google Meet', confirmDone: 'Confirm it happened',
    reportNoShow: 'Report a no-show', openDispute: 'Open a dispute', review: 'Leave a review', report: 'Report a problem', message: 'Message', details: 'Details',
    startsIn: 'Starts in {t}', started: 'Started', ended: 'Ended', countdownDays: '{d} d {h} h', countdownHours: '{h} h {m} min', countdownMin: '{m} min',
    prepTitle: 'Before the session', prep: ['Agree on the topic in messages.', 'Test your camera and microphone.', 'Have paper, a notebook or a shared document ready.', 'Join two minutes early.'],
    notes: 'Shared notes', notesPh: 'Plan, links or homework. Both of you can see these notes.', saveNotes: 'Save notes',
    meetTitle: 'Meeting', meetReady: 'Your Google Meet link is ready.', meetWaiting: 'The meeting link appears here once the teacher adds it.',
    meetCreate: 'Create Google Meet link', meetPaste: 'Or paste a Google Meet link', meetPastePh: 'https://meet.google.com/abc-defg-hij', meetSave: 'Save link',
    meetConnectHint: 'Connect Google Calendar in Account settings and BilimBank creates the Meet link and invite for you.', meetFailed: 'Google could not create the meeting: {e}. You can paste a link instead.',
    meetNotSetUp: 'Automatic Meet links are not set up on this site yet. Paste a Google Meet link instead.',
    cancelTitle: 'Cancel this session?', cancelLearner: 'Your held credits come back to you.', cancelTeacher: 'The learner gets their held credits back.',
    cancelDeadline: 'Confirmed sessions can be cancelled up to {h} hours before the start.', reasonPh: 'Reason (shared with the other person)',
    rescheduleTitle: 'Pick a new time', rescheduleText: 'Your current request is cancelled and a new one is sent to {name}.',
    doneTitle: 'Did the session take place?', doneText: 'When both of you confirm, the held credits move to the teacher. This cannot be undone.', waitingOther: 'You confirmed. Waiting for {name}.',
    noShowTitle: 'Report a no-show', noShowText: '{name} gets {h} hours to respond. If they agree, the policy is applied. If they disagree, an administrator reviews it. Nobody is penalised automatically.',
    noShowPh: 'What happened? e.g. I waited 15 minutes in the Meet link.', disputeTitle: 'Open a dispute', disputeText: 'Describe the problem. An administrator reviews the booking, confirmations and evidence before deciding.',
    disputeKinds: { quality: 'Session quality', other: 'Something else' }, respondTitle: '{name} reported that you did not attend', respondText: 'Tell us what happened. If you agree, the policy applies now. If you disagree, an administrator decides.',
    agree: 'I agree', disagree: 'I disagree', responsePh: 'Your side of the story', underReview: 'An administrator is reviewing this session.',
    reviewTitle: 'How was the session?', overall: 'Overall', preparation: 'Preparation', clarity: 'Clarity', helpfulness: 'Helpfulness', reviewPh: 'What went well? What could be better? (optional)',
    submitReview: 'Publish review', reviewed: 'You reviewed this session.', reportTitle: 'Report a problem', reportPh: 'Tell the administrators what happened.',
    reportReasons: { safety: 'Safety concern', harassment: 'Harassment', inappropriate: 'Inappropriate behaviour', spam: 'Spam', no_show: 'No-show', other: 'Other' },
    sendReport: 'Send report', reported: 'Report sent. Only administrators can see it.', held: '{c} on hold', when: 'When', skill: 'Skill', length: 'Length', cost: 'Credits',
    teacher: 'Teacher', learner: 'Learner', statusLabel: 'Status', yourTime: 'in your time zone ({tz})', requestNote: 'Learner note', respondBy: 'Answer by {date}',
    noWeek: 'No sessions this week.', thisWeek: 'This week', prevWeek: 'Previous week', nextWeek: 'Next week', notFound: 'Session not found.'
  },
  wallet: {
    title: 'Wallet', available: 'Available', held: 'On hold', earned: 'Earned by teaching', spent: 'Spent on learning', history: 'Transaction history',
    types: { starter_grant: 'Starter credits', hold: 'Credit hold', hold_release: 'Hold released', hold_capture: 'Paid for session', teaching_reward: 'Teaching reward', learner_refund: 'Refund', admin_adjustment: 'Adjustment by admin', no_show_penalty: 'No-show penalty' },
    date: 'Date', type: 'Type', amount: 'Amount', session: 'Session', balance: 'Balance after', empty: 'No transactions yet.', heldTitle: 'Credits on hold', noneHeld: 'No credits on hold.',
    explain: 'Credits are held when you book and only move to the teacher after both of you confirm. Every change is recorded here and cannot be edited.'
  },
  messages: {
    title: 'Messages', empty: 'No conversations yet. A conversation opens when you book a session or receive a request.', select: 'Choose a conversation.',
    ph: 'Write a message', send: 'Send', safety: 'Use messages to arrange sessions. Never share passwords. Contact details are blocked when a student under 18 is in the chat.',
    report: 'Report', block: 'Block', unblock: 'Unblock', blocked: 'You blocked this person. They cannot message you.', blockedByOther: 'You cannot message this person.',
    read: 'Read', back: 'Back'
  },
  notifications: {
    title: 'Notifications', empty: 'You are all caught up.', markAll: 'Mark all as read',
    kinds: {
      booking_request: 'New booking request', booking_confirmed: 'Your session was confirmed', booking_declined: 'Your request was declined', booking_cancelled: 'A session was cancelled',
      booking_expired: 'A request expired and your credits were returned', booking_rescheduled: 'A learner rescheduled a session', confirm_requested: 'Please confirm the session took place',
      credit_earned: 'You earned credits', credit_refunded: 'Credits returned to you', credit_adjusted: 'An administrator adjusted your credits', new_message: 'New message',
      no_show_reported: 'A no-show was reported for your session', dispute_review: 'Your report is being reviewed', dispute_resolved: 'A dispute was resolved', meet_ready: 'Your meeting link is ready'
    } as Record<string, string>
  },
  leaderboard: {
    title: 'Teacher leaderboard', text: 'Ranked by credits earned through completed sessions only. Starter, refunded and held credits are never counted.',
    rank: '#', teacher: 'Teacher', earned: 'Earned', sessions: 'Sessions', rating: 'Rating', empty: 'The leaderboard fills up as sessions are completed.',
    hide: 'You can hide yourself from the leaderboard in Settings → Profile.', disabled: 'The leaderboard is turned off.'
  },
  settings: {
    profileTitle: 'Profile', availabilityTitle: 'Availability', accountTitle: 'Account and privacy', privacy: 'Privacy', showSchool: 'Show my school on my public profile',
    showLeaderboard: 'Show me on the public leaderboard', weekly: 'Weekly times', weeklyText: 'Times are in your time zone ({tz}).', addRange: 'Add time', specific: 'One-off dates',
    specificText: 'Extra free times on a particular day.', exceptions: 'Holidays and unavailable dates', exceptionsText: 'No bookings are possible on these days.', from: 'From', to: 'To',
    date: 'Date', notePh: 'Note (optional)', durations: 'Session lengths you offer', notice: 'Minimum notice', noticeHours: '{n} hours', horizon: 'Booking horizon', horizonDays: '{n} days ahead',
    buffer: 'Break between sessions', bufferMin: '{n} minutes', timezone: 'Time zone', preview: 'Your next open times', previewEmpty: 'No open times yet. Add weekly times above.',
    emailPrefs: 'Email notifications', prefEssential: 'Booking, cancellation, completion and account emails are always sent.', prefMessages: 'Email me about new messages',
    prefReminders: 'Session reminders (24 hours and 1 hour before)', prefCalendar: "Let my teacher's Google Calendar invite my email address", calendar: 'Google Calendar and Meet',
    calendarText: 'Connect once and BilimBank creates the Google Calendar event and Meet link when you confirm a session you teach.', connect: 'Connect Google Calendar',
    connected: 'Connected as {email}', disconnect: 'Disconnect', calendarUnavailable: 'Not set up on this site yet. The administrator needs to add Google credentials.',
    language: 'Interface language', data: 'Your data', export: 'Download my data', deleteTitle: 'Delete account', deleteText: 'Your profile, skills and availability are removed and you are signed out. Ledger and session records are kept anonymously for accounting.',
    deleteConfirm: 'Type DELETE to confirm', deleteBtn: 'Delete my account', deleteBlocked: 'Finish or cancel your open sessions first.', avatarRemove: 'Remove photo'
  },
  help: {
    title: 'Help center', text: 'Answers, safety rules and policies in one place.', contactText: 'Questions or a safety concern? Write to us at {email}.', contactNone: 'Use the Report buttons on sessions and profiles to reach the administrators.',
    sections: { about: 'About BilimBank', how: 'How credits work', safety: 'Safety', guidelines: 'Community Guidelines', privacy: 'Privacy Policy', terms: 'Terms of Use', contact: 'Contact' }
  },
  admin: {
    title: 'Administration', only: 'Visible to administrators only. Every change is recorded in the audit log.',
    tabs: { overview: 'Overview', people: 'Participants', sessions: 'Sessions', queue: 'Review queue', skills: 'Skills', settings: 'Settings', audit: 'Audit log' },
    from: 'From', to: 'To', apply: 'Apply', exportCsv: 'Export CSV', users: 'Registered users', onboarded: 'Finished setup', active: 'Active (30 days)', newUsers: 'New in range',
    bookings: 'Bookings in range', confirmed: 'Confirmed', completed: 'Completed', cancelled: 'Cancelled', hours: 'Verified hours', avgRating: 'Average rating', completion: 'Completion rate',
    noShowRate: 'No-show rate', disputeRate: 'Dispute rate', issued: 'Credits issued', starter: 'Starter', rewards: 'Teaching rewards', adjustments: 'Adjustments', daily: 'Daily activity',
    signups: 'Sign-ups', booked: 'Booked', topTeach: 'Most offered skills', topLearn: 'Most wanted skills', openItems: 'Open items', disputes: 'Disputes', reports: 'Reports', flags: 'Pattern flags',
    emailFailed: 'Failed emails', integrations: 'Integrations', emailOk: 'Email sending', googleOk: 'Google Calendar and Meet', serviceOk: 'Server key', cronOk: 'Scheduled jobs',
    on: 'Connected', off: 'Not configured', searchPeople: 'Search by name or username', name: 'Name', status: 'Status', role: 'Role', joined: 'Joined', balance: 'Balance',
    suspend: 'Suspend', reinstate: 'Reinstate', makeAdmin: 'Make admin', makeStudent: 'Remove admin', adjust: 'Adjust credits', amount: 'Amount (+/-)', reason: 'Reason (required, recorded)',
    resolve: 'Resolve', outcome: 'Outcome', outcomes: { completed: 'Completed, pay teacher', no_show_learner: 'Learner no-show, pay teacher', no_show_teacher: 'Teacher no-show, refund learner and penalty', void: 'Cancel and refund, no penalty' },
    ledger: 'Ledger entries', statusFilter: 'Status', any: 'Any', open: 'Open', reviewing: 'Reviewing', closed: 'Closed', dismiss: 'Dismiss', actioned: 'Mark actioned',
    hideReview: 'Hide review', showReview: 'Show review', suggested: 'Suggested skills', approve: 'Approve', disable: 'Disable', mergeInto: 'Merge into…', addSkill: 'Add skill',
    nameEn: 'Name (English)', nameUz: 'Name (Uzbek)', settingsSaved: 'Settings saved.', confirmAction: 'Confirm this action', recentReviews: 'Recent reviews',
    s: { starter_credits: 'Starter credits', durations: 'Session lengths (minutes)', weekly_earning_cap: 'Weekly earning cap (credits)', pair_weekly_cap: 'Weekly cap per learner–teacher pair',
      reciprocal_flag_threshold: 'Flag pairs with this many sessions in 30 days', cancel_deadline_hours: 'Cancellation deadline (hours)', response_window_hours: 'Teacher response window (hours)',
      reminder_hours: 'Reminders (hours before)', noshow_penalty: 'Teacher no-show penalty (credits)', noshow_response_hours: 'Time to answer a no-show report (hours)', leaderboard_enabled: 'Public leaderboard',
      announcement: 'Announcement banner (empty to hide)' } as Record<string, string>
  },
  errors: {
    not_signed_in: 'Please sign in first.', account_suspended: 'Your account is suspended. Contact the administrators.', finish_onboarding: 'Finish setting up your profile first.',
    insufficient_credits: 'You do not have enough credits.', slot_taken: 'Someone just booked that time. Please pick another.', slot_unavailable: 'That time is no longer available. Please pick another.',
    you_are_busy: 'You already have a session at that time.', teacher_weekly_cap: 'This mentor reached their weekly teaching limit. Try next week.',
    pair_weekly_cap: 'You reached the weekly limit with this mentor. Try another mentor or next week.', cannot_book_yourself: 'You cannot book yourself.',
    skill_not_offered: 'This mentor does not teach that skill.', teacher_unavailable: 'This mentor is not available right now.', blocked: 'You cannot interact with this person.',
    already_answered: 'This request was already answered.', request_expired: 'This request expired.', cannot_cancel: 'This session can no longer be cancelled.',
    already_started: 'The session has already started.', past_cancel_deadline: 'It is too late to cancel. Report a no-show or open a dispute instead.', not_confirmable: 'This session cannot be confirmed now.',
    not_started: 'You can confirm after the session starts.', already_confirmed: 'You already confirmed.', too_early: 'You can report a no-show 10 minutes after the start.',
    not_reportable: 'This session cannot be reported now.', not_disputable: 'This session cannot be disputed now.', not_completed: 'You can review after the session is completed.',
    already_reviewed: 'You already reviewed this session.', invalid_meet_link: 'Paste a link like https://meet.google.com/abc-defg-hij', too_young: 'BilimBank is for students aged 13 and over.',
    terms_required: 'Please accept the terms.', birth_date_required: 'Please add a valid date of birth.', name_required: 'Please add your name.', contact_details_blocked: 'Phone numbers and emails cannot be shared in this chat.',
    rate_limited: 'You are doing that too fast. Please wait a moment.', admin_only: 'Administrators only.', reason_required: 'Please give a reason.', cannot_change_self: 'You cannot change your own role or status.',
    invalid_amount: 'Amount must be between -100 and 100.', not_found: 'Not found.', invalid_timezone: 'Choose a valid time zone.', duplicate: 'That already exists.', network: 'Connection problem. Please try again.'
  } as Record<string, string>
};
export default en;
export type Dict = typeof en;
