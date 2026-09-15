import { Injectable, Signal, computed, signal } from '@angular/core';
import { Poll, PollCategory, PollOption, PollResult } from './models/poll.model';
import { getVoterId } from './voter-id';

export interface PollWithOptions extends Poll {
  options: PollOption[];
}

export interface NewPollInput {
  title: string;
  description?: string;
  category: PollCategory;
  deadline?: Date;
  optionTexts: string[];
}

interface Vote {
  id: string;
  pollId: string;
  pollOptionId: string;
  voterId: string;
}

const FAKE_POLLS: Poll[] = [
  {
    id: 'p1',
    title: 'Which programming language should we learn next?',
    description: "We'd like to get your preference for the next course block.",
    category: 'Education & Learning',
    deadline: new Date('2026-10-01T18:00:00'),
    createdAt: new Date('2026-09-01T09:00:00'),
  },
  {
    id: 'p2',
    title: 'Best lunch option in the cafeteria',
    category: 'Lifestyle & Preferences',
    createdAt: new Date('2026-09-05T09:00:00'),
  },
  {
    id: 'p3',
    title: 'Team event in October',
    description: "We're looking for a format for our team afternoon.",
    category: 'Team Activities',
    deadline: new Date('2026-09-20T18:00:00'),
    createdAt: new Date('2026-09-08T09:00:00'),
  },
  {
    id: 'p4',
    title: 'Should we introduce pair programming?',
    category: 'Technology & Innovation',
    deadline: new Date('2026-09-17T18:00:00'),
    createdAt: new Date('2026-09-10T09:00:00'),
  },
  {
    id: 'p5',
    title: 'Favorite editor theme',
    category: 'Technology & Innovation',
    deadline: new Date('2026-08-01T18:00:00'),
    createdAt: new Date('2026-07-20T09:00:00'),
  },
  {
    id: 'p6',
    title: 'How should we improve our office wellness program?',
    description: 'Let us know what would help you feel better at work.',
    category: 'Health & Wellness',
    deadline: new Date('2026-09-25T18:00:00'),
    createdAt: new Date('2026-09-12T09:00:00'),
  },
  {
    id: 'p7',
    title: 'Which game night should we host next?',
    category: 'Gaming & Entertainment',
    deadline: new Date('2026-09-29T18:00:00'),
    createdAt: new Date('2026-09-13T09:00:00'),
  },
];

const FAKE_OPTIONS: PollOption[] = [
  { id: 'p1-o1', pollId: 'p1', text: 'TypeScript', sortOrder: 0 },
  { id: 'p1-o2', pollId: 'p1', text: 'Python', sortOrder: 1 },
  { id: 'p1-o3', pollId: 'p1', text: 'Rust', sortOrder: 2 },
  { id: 'p1-o4', pollId: 'p1', text: 'Go', sortOrder: 3 },

  { id: 'p2-o1', pollId: 'p2', text: 'Pasta', sortOrder: 0 },
  { id: 'p2-o2', pollId: 'p2', text: 'Salad bar', sortOrder: 1 },
  { id: 'p2-o3', pollId: 'p2', text: 'Wraps', sortOrder: 2 },
  { id: 'p2-o4', pollId: 'p2', text: 'Soup', sortOrder: 3 },

  { id: 'p3-o1', pollId: 'p3', text: 'Bowling', sortOrder: 0 },
  { id: 'p3-o2', pollId: 'p3', text: 'Escape room', sortOrder: 1 },
  { id: 'p3-o3', pollId: 'p3', text: 'Barbecue', sortOrder: 2 },
  { id: 'p3-o4', pollId: 'p3', text: 'Climbing park', sortOrder: 3 },

  { id: 'p4-o1', pollId: 'p4', text: 'Yes, always', sortOrder: 0 },
  { id: 'p4-o2', pollId: 'p4', text: 'Only for complex tasks', sortOrder: 1 },
  { id: 'p4-o3', pollId: 'p4', text: 'No', sortOrder: 2 },

  { id: 'p5-o1', pollId: 'p5', text: 'Dark', sortOrder: 0 },
  { id: 'p5-o2', pollId: 'p5', text: 'Light', sortOrder: 1 },
  { id: 'p5-o3', pollId: 'p5', text: 'Solarized', sortOrder: 2 },
  { id: 'p5-o4', pollId: 'p5', text: 'High Contrast', sortOrder: 3 },

  { id: 'p6-o1', pollId: 'p6', text: 'More standing desks', sortOrder: 0 },
  { id: 'p6-o2', pollId: 'p6', text: 'Yoga sessions', sortOrder: 1 },
  { id: 'p6-o3', pollId: 'p6', text: 'Healthy snacks', sortOrder: 2 },
  { id: 'p6-o4', pollId: 'p6', text: 'Mental health days', sortOrder: 3 },

  { id: 'p7-o1', pollId: 'p7', text: 'Board games', sortOrder: 0 },
  { id: 'p7-o2', pollId: 'p7', text: 'Trivia night', sortOrder: 1 },
  { id: 'p7-o3', pollId: 'p7', text: 'Video games tournament', sortOrder: 2 },
  { id: 'p7-o4', pollId: 'p7', text: 'Escape room', sortOrder: 3 },
];

@Injectable({ providedIn: 'root' })
export class PollsService {
  private readonly polls = signal<Poll[]>(FAKE_POLLS);
  private readonly options = signal<PollOption[]>(FAKE_OPTIONS);
  private readonly votes = signal<Vote[]>([]);

  listPolls(): Signal<PollWithOptions[]> {
    return computed(() => this.polls().map((poll) => this.attachOptions(poll)));
  }

  getPoll(pollId: string): Signal<PollWithOptions | undefined> {
    return computed(() => {
      const poll = this.polls().find((p) => p.id === pollId);
      return poll ? this.attachOptions(poll) : undefined;
    });
  }

  getResults(pollId: string): Signal<PollResult[]> {
    return computed(() => {
      const pollVotes = this.votes().filter((v) => v.pollId === pollId);
      return this.optionsForPoll(pollId).map((option) => ({
        pollOptionId: option.id,
        pollId,
        text: option.text,
        voteCount: pollVotes.filter((v) => v.pollOptionId === option.id).length,
      }));
    });
  }

  hasVoted(pollId: string): Signal<boolean> {
    const voterId = getVoterId();
    return computed(() => this.votes().some((v) => v.pollId === pollId && v.voterId === voterId));
  }

  createPoll(input: NewPollInput): void {
    const pollId = crypto.randomUUID();
    const poll: Poll = {
      id: pollId,
      title: input.title,
      description: input.description,
      category: input.category,
      deadline: input.deadline,
      createdAt: new Date(),
    };
    const newOptions: PollOption[] = input.optionTexts.map((text, index) => ({
      id: crypto.randomUUID(),
      pollId,
      text,
      sortOrder: index,
    }));

    this.polls.update((polls) => [...polls, poll]);
    this.options.update((options) => [...options, ...newOptions]);
  }

  vote(pollId: string, pollOptionId: string): void {
    const voterId = getVoterId();
    const alreadyVoted = this.votes().some((v) => v.pollId === pollId && v.voterId === voterId);
    if (alreadyVoted) {
      return;
    }
    this.votes.update((votes) => [...votes, { id: crypto.randomUUID(), pollId, pollOptionId, voterId }]);
  }

  private optionsForPoll(pollId: string): PollOption[] {
    return this.options()
      .filter((o) => o.pollId === pollId)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  private attachOptions(poll: Poll): PollWithOptions {
    return { ...poll, options: this.optionsForPoll(poll.id) };
  }
}
