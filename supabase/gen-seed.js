const polls = [
  {
    title: 'Team event in October',
    category: 'Team Activities',
    deadline: '2026-09-24T18:00:00Z',
    questions: [
      { text: 'What type of event should we do?', multi: false, options: [['Bowling', 5], ['Escape room', 2], ['Barbecue', 4], ['Climbing park', 3]] },
      { text: 'Which day works best?', multi: false, options: [['Monday', 1], ['Wednesday', 4], ['Friday', 2]] },
      { text: 'Preferred budget range per person?', multi: false, options: [['Under 20 EUR', 3], ['20-50 EUR', 5], ['50-100 EUR', 2], ['100 EUR+', 1]] },
    ],
  },
  {
    title: 'Annual team retreat destination',
    category: 'Team Activities',
    deadline: '2026-12-01T18:00:00Z',
    questions: [
      { text: 'Which destination sounds best?', multi: false, options: [['Mountains', 4], ['Beach', 6], ['City', 2], ['Countryside', 3]] },
      { text: 'How many days should the retreat last?', multi: false, options: [['2 days', 3], ['3 days', 5], ['4+ days', 1]] },
    ],
  },
  {
    title: 'How should we improve our office wellness program?',
    description: 'Let us know what would help you feel better at work.',
    category: 'Health & Wellness',
    deadline: null,
    questions: [
      { text: 'Which wellness perks should we add?', multi: true, options: [['More standing desks', 3], ['Yoga sessions', 3], ['Healthy snacks', 4], ['Mental health days', 5]] },
      { text: 'Preferred format for feedback sessions?', multi: false, options: [['Anonymous surveys', 4], ['Team town halls', 2], ['1:1 check-ins', 3]] },
      { text: 'Best time for a group workout session?', multi: false, options: [['Before work', 2], ['Lunch break', 5], ['After work', 3]] },
      { text: 'Would you use a standing desk if provided?', multi: false, options: [['Yes', 6], ['No', 1], ['Maybe', 3]] },
      { text: 'Which snack station location works best?', multi: false, options: [['Kitchen', 5], ['Lobby', 1], ['Break room', 4]] },
    ],
  },
  {
    title: 'Annual health checkup scheduling',
    category: 'Health & Wellness',
    deadline: '2026-07-10T18:00:00Z',
    questions: [
      { text: 'Preferred checkup month?', multi: false, options: [['March', 3], ['July', 4], ['November', 2]] },
      { text: 'Should checkups happen during work hours?', multi: false, options: [['Yes', 6], ['No', 1], ["Doesn't matter", 3]] },
    ],
  },
  {
    title: 'Which game night should we host next?',
    category: 'Gaming & Entertainment',
    deadline: '2026-08-15T18:00:00Z',
    questions: [
      { text: 'Which game night should we host next?', multi: false, options: [['Board games', 3], ['Trivia night', 5], ['Video games tournament', 2], ['Escape room', 1]] },
      { text: 'Preferred day of week?', multi: false, options: [['Friday', 6], ['Saturday', 4]] },
    ],
  },
  {
    title: 'Best multiplayer game for the office tournament',
    category: 'Gaming & Entertainment',
    deadline: '2026-09-23T18:00:00Z',
    questions: [
      { text: 'Which game genre?', multi: false, options: [['FPS', 4], ['Party games', 6], ['Strategy', 2], ['Sports', 3]] },
      { text: 'Which platform?', multi: false, options: [['PC', 5], ['Console', 4], ['Mobile', 1]] },
      { text: 'How many rounds should the tournament have?', multi: false, options: [['Single elimination', 3], ['Best of 3', 5], ['Round robin', 2]] },
      { text: 'Preferred day?', multi: false, options: [['Weekday evening', 3], ['Weekend', 7]] },
    ],
  },
  {
    title: 'Which programming language should we learn next?',
    description: "We'd like to get your preference for the next course block.",
    category: 'Education & Learning',
    deadline: '2026-10-15T18:00:00Z',
    questions: [
      { text: 'Which programming language should we learn next?', multi: false, options: [['TypeScript', 5], ['Python', 3], ['Rust', 2], ['Go', 1]] },
      { text: 'How many hours per week can you dedicate to learning it?', multi: false, options: [['1-2 hours', 0], ['3-5 hours', 4], ['6-10 hours', 1], ['10+ hours', 2]] },
    ],
  },
  {
    title: 'Preferred learning format',
    category: 'Education & Learning',
    deadline: null,
    questions: [
      { text: 'Which learning format do you prefer?', multi: false, options: [['Video courses', 5], ['Live workshops', 4], ['Reading/docs', 2], ['Pair learning', 3]] },
      { text: 'Best time slot for learning sessions?', multi: false, options: [['Morning', 4], ['Afternoon', 2], ['Evening', 3]] },
    ],
  },
  {
    title: 'Best lunch option in the cafeteria',
    category: 'Lifestyle & Preferences',
    deadline: '2026-09-25T18:00:00Z',
    questions: [
      { text: 'Best lunch option in the cafeteria', multi: false, options: [['Pasta', 3], ['Salad bar', 2], ['Wraps', 1], ['Soup', 4]] },
      { text: 'How often do you eat at the cafeteria?', multi: false, options: [['Daily', 5], ['A few times a week', 4], ['Rarely', 1]] },
    ],
  },
  {
    title: 'Preferred remote work days',
    category: 'Lifestyle & Preferences',
    deadline: '2026-10-05T18:00:00Z',
    questions: [
      { text: 'Which days would you prefer to work remotely?', multi: true, options: [['Monday', 2], ['Tuesday', 3], ['Wednesday', 4], ['Thursday', 1], ['Friday', 6]] },
      { text: "What's the biggest benefit of remote work for you?", multi: false, options: [['No commute', 5], ['Better focus', 3], ['Flexibility', 4], ['Family time', 2]] },
    ],
  },
  {
    title: 'Should we introduce pair programming?',
    category: 'Technology & Innovation',
    deadline: null,
    questions: [
      { text: 'Should we introduce pair programming?', multi: false, options: [['Yes, always', 6], ['Only for complex tasks', 3], ['No', 1]] },
      { text: 'Preferred pairing style?', multi: false, options: [['Driver/navigator', 5], ['Mob programming', 2], ['Ad-hoc', 3]] },
      { text: 'How often should we pair?', multi: false, options: [['Daily', 2], ['A few times a week', 5], ['Occasionally', 3]] },
    ],
  },
  {
    title: 'Which IDE do you use daily?',
    category: 'Technology & Innovation',
    deadline: '2026-07-01T18:00:00Z',
    questions: [
      { text: 'Which IDE do you use daily?', multi: false, options: [['VS Code', 7], ['JetBrains', 4], ['Neovim', 2], ['Other', 1]] },
      { text: 'Which OS do you develop on?', multi: false, options: [['Windows', 5], ['macOS', 4], ['Linux', 3]] },
    ],
  },
];

function uuid(block, n) {
  return `${block}-0000-0000-0000-${String(n).padStart(12, '0')}`;
}

let pollN = 0, questionN = 0, optionN = 0;
const lines = [];
lines.push('-- Test data for manual UI testing. Run once in the Supabase SQL editor');
lines.push('-- after schema.sql. Generated by `node supabase/gen-seed.js > supabase/seed.sql`');
lines.push('-- - edit the `polls` array there and regenerate instead of hand-editing');
lines.push('-- this file, the ids need to stay in sync.');
lines.push('-- Safe to re-run after a `delete from polls;` (cascades to');
lines.push('-- questions/poll_options/votes).');
lines.push('');

const voteRows = [];

for (const poll of polls) {
  pollN++;
  const pollId = uuid('10000000', pollN);
  const cols = ['id', 'title', 'category', 'deadline'];
  const vals = [`'${pollId}'`, `'${poll.title.replace(/'/g, "''")}'`, `'${poll.category}'`, poll.deadline ? `'${poll.deadline}'` : 'null'];
  if (poll.description) {
    cols.splice(2, 0, 'description');
    vals.splice(2, 0, `'${poll.description.replace(/'/g, "''")}'`);
  }
  lines.push(`-- Poll ${pollN}: ${poll.category}, ${poll.deadline ? (new Date(poll.deadline) < new Date('2026-09-19') ? 'CLOSED' : 'running') : 'running, no deadline'}`);
  lines.push(`insert into polls (${cols.join(', ')}) values`);
  lines.push(`  (${vals.join(', ')});`);

  const questionIds = [];
  poll.questions.forEach(() => {
    questionN++;
    questionIds.push(uuid('20000000', questionN));
  });
  lines.push('insert into questions (id, poll_id, text, allow_multiple, sort_order) values');
  lines.push(
    poll.questions
      .map((q, i) => `  ('${questionIds[i]}', '${pollId}', '${q.text.replace(/'/g, "''")}', ${q.multi}, ${i})`)
      .join(',\n') + ';',
  );

  const optionRows = [];
  poll.questions.forEach((q, qi) => {
    q.options.forEach(([text, count], oi) => {
      optionN++;
      const optionId = uuid('30000000', optionN);
      optionRows.push(`  ('${optionId}', '${questionIds[qi]}', '${text.replace(/'/g, "''")}', ${oi})`);
      if (count > 0) {
        voteRows.push([optionId, questionIds[qi], count]);
      }
    });
  });
  lines.push('insert into poll_options (id, question_id, text, sort_order) values');
  lines.push(optionRows.join(',\n') + ';');
  lines.push('');
}

lines.push('-- Seed votes: N duplicate rows per option (no voter identity to worry');
lines.push('-- about). A few options are deliberately left with 0 votes above, to');
lines.push('-- also cover the empty-results case in the UI.');
lines.push('insert into votes (poll_option_id, question_id)');
lines.push('select v.option_id::uuid, v.question_id::uuid');
lines.push('from (values');
lines.push(voteRows.map(([o, q, c]) => `  ('${o}', '${q}', ${c})`).join(',\n'));
lines.push(') as v(option_id, question_id, vote_count)');
lines.push('cross join lateral generate_series(1, v.vote_count);');

console.log(lines.join('\n'));
console.error(`\n-- stats: ${pollN} polls, ${questionN} questions, ${optionN} options, ${voteRows.length} option-vote-groups`);
