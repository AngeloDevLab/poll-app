import { Injectable, Signal, computed, signal } from '@angular/core';
import { Poll, PollCategory, PollOption, PollQuestion, PollResult } from './models/poll.model';
import { getVoterId } from './voter-id';

export interface QuestionWithOptions extends PollQuestion {
  options: PollOption[];
}

export interface PollWithQuestions extends Poll {
  questions: QuestionWithOptions[];
}

export interface NewQuestionInput {
  text: string;
  allowMultiple: boolean;
  optionTexts: string[];
}

export interface NewPollInput {
  title: string;
  description?: string;
  category: PollCategory;
  deadline?: Date;
  questions: NewQuestionInput[];
}

interface Vote {
  id: string;
  questionId: string;
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

const FAKE_QUESTIONS: PollQuestion[] = [
  { id: 'p1-q1', pollId: 'p1', text: 'Which programming language should we learn next?', allowMultiple: false, sortOrder: 0 },
  { id: 'p2-q1', pollId: 'p2', text: 'Best lunch option in the cafeteria', allowMultiple: false, sortOrder: 0 },
  { id: 'p3-q1', pollId: 'p3', text: 'Team event in October', allowMultiple: false, sortOrder: 0 },
  { id: 'p4-q1', pollId: 'p4', text: 'Should we introduce pair programming?', allowMultiple: false, sortOrder: 0 },
  { id: 'p5-q1', pollId: 'p5', text: 'Favorite editor theme', allowMultiple: false, sortOrder: 0 },
  { id: 'p6-q1', pollId: 'p6', text: 'How should we improve our office wellness program?', allowMultiple: true, sortOrder: 0 },
  { id: 'p7-q1', pollId: 'p7', text: 'Which game night should we host next?', allowMultiple: false, sortOrder: 0 },
];

const FAKE_OPTIONS: PollOption[] = [
  { id: 'p1-o1', questionId: 'p1-q1', text: 'TypeScript', sortOrder: 0 },
  { id: 'p1-o2', questionId: 'p1-q1', text: 'Python', sortOrder: 1 },
  { id: 'p1-o3', questionId: 'p1-q1', text: 'Rust', sortOrder: 2 },
  { id: 'p1-o4', questionId: 'p1-q1', text: 'Go', sortOrder: 3 },

  { id: 'p2-o1', questionId: 'p2-q1', text: 'Pasta', sortOrder: 0 },
  { id: 'p2-o2', questionId: 'p2-q1', text: 'Salad bar', sortOrder: 1 },
  { id: 'p2-o3', questionId: 'p2-q1', text: 'Wraps', sortOrder: 2 },
  { id: 'p2-o4', questionId: 'p2-q1', text: 'Soup', sortOrder: 3 },

  { id: 'p3-o1', questionId: 'p3-q1', text: 'Bowling', sortOrder: 0 },
  { id: 'p3-o2', questionId: 'p3-q1', text: 'Escape room', sortOrder: 1 },
  { id: 'p3-o3', questionId: 'p3-q1', text: 'Barbecue', sortOrder: 2 },
  { id: 'p3-o4', questionId: 'p3-q1', text: 'Climbing park', sortOrder: 3 },

  { id: 'p4-o1', questionId: 'p4-q1', text: 'Yes, always', sortOrder: 0 },
  { id: 'p4-o2', questionId: 'p4-q1', text: 'Only for complex tasks', sortOrder: 1 },
  { id: 'p4-o3', questionId: 'p4-q1', text: 'No', sortOrder: 2 },

  { id: 'p5-o1', questionId: 'p5-q1', text: 'Dark', sortOrder: 0 },
  { id: 'p5-o2', questionId: 'p5-q1', text: 'Light', sortOrder: 1 },
  { id: 'p5-o3', questionId: 'p5-q1', text: 'Solarized', sortOrder: 2 },
  { id: 'p5-o4', questionId: 'p5-q1', text: 'High Contrast', sortOrder: 3 },

  { id: 'p6-o1', questionId: 'p6-q1', text: 'More standing desks', sortOrder: 0 },
  { id: 'p6-o2', questionId: 'p6-q1', text: 'Yoga sessions', sortOrder: 1 },
  { id: 'p6-o3', questionId: 'p6-q1', text: 'Healthy snacks', sortOrder: 2 },
  { id: 'p6-o4', questionId: 'p6-q1', text: 'Mental health days', sortOrder: 3 },

  { id: 'p7-o1', questionId: 'p7-q1', text: 'Board games', sortOrder: 0 },
  { id: 'p7-o2', questionId: 'p7-q1', text: 'Trivia night', sortOrder: 1 },
  { id: 'p7-o3', questionId: 'p7-q1', text: 'Video games tournament', sortOrder: 2 },
  { id: 'p7-o4', questionId: 'p7-q1', text: 'Escape room', sortOrder: 3 },
];

@Injectable({ providedIn: 'root' })
export class PollsService {
  private readonly polls = signal<Poll[]>(FAKE_POLLS);
  private readonly questions = signal<PollQuestion[]>(FAKE_QUESTIONS);
  private readonly options = signal<PollOption[]>(FAKE_OPTIONS);
  private readonly votes = signal<Vote[]>([]);

  listPolls(): Signal<PollWithQuestions[]> {
    return computed(() => this.polls().map((poll) => this.attachQuestions(poll)));
  }

  getPoll(pollId: string): Signal<PollWithQuestions | undefined> {
    return computed(() => {
      const poll = this.polls().find((p) => p.id === pollId);
      return poll ? this.attachQuestions(poll) : undefined;
    });
  }

  getResults(questionId: string): Signal<PollResult[]> {
    return computed(() => {
      const questionVotes = this.votes().filter((v) => v.questionId === questionId);
      return this.optionsForQuestion(questionId).map((option) => ({
        pollOptionId: option.id,
        questionId,
        text: option.text,
        voteCount: questionVotes.filter((v) => v.pollOptionId === option.id).length,
      }));
    });
  }

  hasVoted(questionId: string): Signal<boolean> {
    const voterId = getVoterId();
    return computed(() => this.votes().some((v) => v.questionId === questionId && v.voterId === voterId));
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

    const newQuestions: PollQuestion[] = [];
    const newOptions: PollOption[] = [];
    input.questions.forEach((questionInput, questionIndex) => {
      const questionId = crypto.randomUUID();
      newQuestions.push({
        id: questionId,
        pollId,
        text: questionInput.text,
        allowMultiple: questionInput.allowMultiple,
        sortOrder: questionIndex,
      });
      questionInput.optionTexts.forEach((text, optionIndex) => {
        newOptions.push({
          id: crypto.randomUUID(),
          questionId,
          text,
          sortOrder: optionIndex,
        });
      });
    });

    this.polls.update((polls) => [...polls, poll]);
    this.questions.update((questions) => [...questions, ...newQuestions]);
    this.options.update((options) => [...options, ...newOptions]);
  }

  vote(questionId: string, pollOptionId: string): void {
    const voterId = getVoterId();
    const question = this.questions().find((q) => q.id === questionId);
    if (!question) {
      return;
    }
    const existingForQuestion = this.votes().filter((v) => v.questionId === questionId && v.voterId === voterId);
    if (!question.allowMultiple && existingForQuestion.length > 0) {
      return;
    }
    if (existingForQuestion.some((v) => v.pollOptionId === pollOptionId)) {
      return;
    }
    this.votes.update((votes) => [...votes, { id: crypto.randomUUID(), questionId, pollOptionId, voterId }]);
  }

  private optionsForQuestion(questionId: string): PollOption[] {
    return this.options()
      .filter((o) => o.questionId === questionId)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  private questionsForPoll(pollId: string): QuestionWithOptions[] {
    return this.questions()
      .filter((q) => q.pollId === pollId)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((question) => ({ ...question, options: this.optionsForQuestion(question.id) }));
  }

  private attachQuestions(poll: Poll): PollWithQuestions {
    return { ...poll, questions: this.questionsForPoll(poll.id) };
  }
}
