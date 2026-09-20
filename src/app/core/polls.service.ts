import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { Poll, PollCategory, PollOption, PollQuestion, PollResult } from './models/poll.model';
import { supabase } from './supabase-client';
import { ToastService } from './toast.service';

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
}

interface PollRow {
  id: string;
  title: string;
  description: string | null;
  category: string;
  deadline: string | null;
  created_at: string;
}

interface QuestionRow {
  id: string;
  poll_id: string;
  text: string;
  allow_multiple: boolean;
  sort_order: number;
}

interface PollOptionRow {
  id: string;
  question_id: string;
  text: string;
  sort_order: number;
}

interface VoteRow {
  id: string;
  poll_option_id: string;
  question_id: string;
}

function toPoll(row: PollRow): Poll {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? undefined,
    category: row.category as PollCategory,
    deadline: row.deadline ? new Date(row.deadline) : undefined,
    createdAt: new Date(row.created_at),
  };
}

function toPollQuestion(row: QuestionRow): PollQuestion {
  return {
    id: row.id,
    pollId: row.poll_id,
    text: row.text,
    allowMultiple: row.allow_multiple,
    sortOrder: row.sort_order,
  };
}

function toPollOption(row: PollOptionRow): PollOption {
  return { id: row.id, questionId: row.question_id, text: row.text, sortOrder: row.sort_order };
}

function toVote(row: VoteRow): Vote {
  return { id: row.id, questionId: row.question_id, pollOptionId: row.poll_option_id };
}

@Injectable({ providedIn: 'root' })
export class PollsService {
  private readonly toastService = inject(ToastService);

  private readonly polls = signal<Poll[]>([]);
  private readonly questions = signal<PollQuestion[]>([]);
  private readonly options = signal<PollOption[]>([]);
  private readonly votes = signal<Vote[]>([]);

  constructor() {
    this.loadAll();
    this.subscribeToVotes();
  }

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

  async createPoll(input: NewPollInput): Promise<string> {
    const { data: pollRow, error: pollError } = await supabase
      .from('polls')
      .insert({
        title: input.title,
        description: input.description ?? null,
        category: input.category,
        deadline: input.deadline ? input.deadline.toISOString() : null,
      })
      .select()
      .single();
    if (pollError || !pollRow) {
      this.toastService.show('Could not create the survey. Please try again.');
      throw pollError;
    }

    const newQuestions: QuestionWithOptions[] = [];
    for (const [index, questionInput] of input.questions.entries()) {
      const { data: questionRow, error: questionError } = await supabase
        .from('questions')
        .insert({
          poll_id: pollRow.id,
          text: questionInput.text,
          allow_multiple: questionInput.allowMultiple,
          sort_order: index,
        })
        .select()
        .single();
      if (questionError || !questionRow) {
        this.toastService.show('Could not create the survey. Please try again.');
        throw questionError;
      }

      const { data: optionRows, error: optionsError } = await supabase
        .from('poll_options')
        .insert(
          questionInput.optionTexts.map((text, optionIndex) => ({
            question_id: questionRow.id,
            text,
            sort_order: optionIndex,
          })),
        )
        .select();
      if (optionsError || !optionRows) {
        this.toastService.show('Could not create the survey. Please try again.');
        throw optionsError;
      }

      newQuestions.push({ ...toPollQuestion(questionRow), options: optionRows.map(toPollOption) });
    }

    this.polls.update((polls) => [...polls, toPoll(pollRow)]);
    this.questions.update((qs) => [...qs, ...newQuestions.map(({ options: _options, ...q }) => q)]);
    this.options.update((os) => [...os, ...newQuestions.flatMap((q) => q.options)]);

    return pollRow.id;
  }

  vote(questionId: string, pollOptionId: string): void {
    const id = crypto.randomUUID();
    this.votes.update((votes) => [...votes, { id, questionId, pollOptionId }]);

    supabase
      .from('votes')
      .insert({ id, question_id: questionId, poll_option_id: pollOptionId })
      .then(({ error }) => {
        if (error) {
          this.votes.update((votes) => votes.filter((v) => v.id !== id));
          this.toastService.show('Vote failed, please try again.');
        }
      });
  }

  private async loadAll(): Promise<void> {
    const [pollsRes, questionsRes, optionsRes, votesRes] = await Promise.all([
      supabase.from('polls').select().returns<PollRow[]>(),
      supabase.from('questions').select().returns<QuestionRow[]>(),
      supabase.from('poll_options').select().returns<PollOptionRow[]>(),
      supabase.from('votes').select().returns<VoteRow[]>(),
    ]);

    if (pollsRes.error || questionsRes.error || optionsRes.error || votesRes.error) {
      console.error('Failed to load polls from Supabase', {
        pollsError: pollsRes.error,
        questionsError: questionsRes.error,
        optionsError: optionsRes.error,
        votesError: votesRes.error,
      });
      this.toastService.show('Could not load surveys.');
      return;
    }

    this.polls.set(pollsRes.data.map(toPoll));
    this.questions.set(questionsRes.data.map(toPollQuestion));
    this.options.set(optionsRes.data.map(toPollOption));
    this.votes.set(votesRes.data.map(toVote));
  }

  private subscribeToVotes(): void {
    supabase
      .channel('votes-changes')
      .on<VoteRow>('postgres_changes', { event: 'INSERT', schema: 'public', table: 'votes' }, ({ new: row }) => {
        const vote = toVote(row);
        this.votes.update((votes) => (votes.some((v) => v.id === vote.id) ? votes : [...votes, vote]));
      })
      .subscribe();
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
