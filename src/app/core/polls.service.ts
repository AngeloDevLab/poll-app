import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { PostgrestError } from '@supabase/supabase-js';
import {
  NewPollInput,
  NewQuestionInput,
  Poll,
  PollOption,
  PollQuestion,
  PollResult,
  PollWithQuestions,
  QuestionWithOptions,
} from './models/poll.model';
import { supabase } from './supabase-client';
import {
  PollOptionRow,
  PollRow,
  QuestionRow,
  Vote,
  VoteRow,
  toPoll,
  toPollOption,
  toPollQuestion,
  toVote,
} from './supabase-rows';
import { ToastService } from './toast.service';

const CREATE_FAILED_MESSAGE = 'Could not create the survey. Please try again.';
const LOAD_FAILED_MESSAGE = 'Could not load surveys.';
const VOTE_FAILED_MESSAGE = 'Vote failed, please try again.';
const VOTES_CHANNEL = 'votes-changes';

/**
 * Loads polls, questions, options and votes from Supabase, keeps them in signals
 * and keeps the votes live via Supabase Realtime.
 */
@Injectable({ providedIn: 'root' })
export class PollsService {
  private readonly toastService = inject(ToastService);

  private readonly polls = signal<Poll[]>([]);
  private readonly questions = signal<PollQuestion[]>([]);
  private readonly options = signal<PollOption[]>([]);
  private readonly votes = signal<Vote[]>([]);

  /**
   * Starts the initial data load and the Realtime vote subscription.
   */
  constructor() {
    this.loadAll();
    this.subscribeToVotes();
  }

  /**
   * Lists all polls with their questions and options attached.
   * @returns A signal that updates whenever polls, questions or options change.
   */
  listPolls(): Signal<PollWithQuestions[]> {
    return computed(() => this.polls().map((poll) => this.attachQuestions(poll)));
  }

  /**
   * Looks up a single poll with its questions and options attached.
   * @param pollId - ID of the poll.
   * @returns A signal holding the poll, or `undefined` while not loaded / not found.
   */
  getPoll(pollId: string): Signal<PollWithQuestions | undefined> {
    return computed(() => {
      const poll = this.polls().find((p) => p.id === pollId);
      return poll ? this.attachQuestions(poll) : undefined;
    });
  }

  /**
   * Computes the live vote count per option of a question.
   * @param questionId - ID of the question.
   * @returns A signal with one result per option, in option sort order.
   */
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

  /**
   * Inserts a new poll with all its questions and options, then adds it to local state.
   * Shows a toast and rethrows if any insert fails.
   * @param input - The validated form data from the New Survey dialog.
   * @returns The ID of the created poll.
   */
  async createPoll(input: NewPollInput): Promise<string> {
    const pollRow = await this.insertPoll(input);
    const newQuestions: QuestionWithOptions[] = [];
    for (const [index, questionInput] of input.questions.entries()) {
      newQuestions.push(await this.insertQuestionWithOptions(pollRow.id, questionInput, index));
    }
    this.addCreatedPoll(toPoll(pollRow), newQuestions);
    return pollRow.id;
  }

  /**
   * Records a vote optimistically and persists it; rolls back and shows a toast on failure.
   * @param questionId - ID of the question voted on.
   * @param pollOptionId - ID of the chosen option.
   */
  vote(questionId: string, pollOptionId: string): void {
    const id = crypto.randomUUID();
    this.addVote({ id, questionId, pollOptionId });
    supabase
      .from('votes')
      .insert({ id, question_id: questionId, poll_option_id: pollOptionId })
      .then(({ error }) => {
        if (error) {
          this.removeVote(id);
          this.toastService.show(VOTE_FAILED_MESSAGE);
        }
      });
  }

  /**
   * Inserts the poll row itself.
   * @param input - The new poll's data.
   * @returns The inserted row.
   */
  private async insertPoll(input: NewPollInput): Promise<PollRow> {
    const { data, error } = await supabase
      .from('polls')
      .insert({
        title: input.title,
        description: input.description ?? null,
        category: input.category,
        deadline: input.deadline ? input.deadline.toISOString() : null,
      })
      .select()
      .single<PollRow>();
    return this.requireInserted(data, error);
  }

  /**
   * Inserts one question and its options.
   * @param pollId - ID of the poll the question belongs to.
   * @param questionInput - The question's text, mode and option texts.
   * @param sortOrder - Position of the question within the poll.
   * @returns The created question with its options.
   */
  private async insertQuestionWithOptions(
    pollId: string,
    questionInput: NewQuestionInput,
    sortOrder: number,
  ): Promise<QuestionWithOptions> {
    const questionRow = await this.insertQuestion(pollId, questionInput, sortOrder);
    const options = await this.insertOptions(questionRow.id, questionInput.optionTexts);
    return { ...toPollQuestion(questionRow), options };
  }

  /**
   * Inserts a single question row.
   * @param pollId - ID of the poll the question belongs to.
   * @param questionInput - The question's text and mode.
   * @param sortOrder - Position of the question within the poll.
   * @returns The inserted row.
   */
  private async insertQuestion(
    pollId: string,
    questionInput: NewQuestionInput,
    sortOrder: number,
  ): Promise<QuestionRow> {
    const { data, error } = await supabase
      .from('questions')
      .insert({
        poll_id: pollId,
        text: questionInput.text,
        allow_multiple: questionInput.allowMultiple,
        sort_order: sortOrder,
      })
      .select()
      .single<QuestionRow>();
    return this.requireInserted(data, error);
  }

  /**
   * Inserts all options of a question in one request, keeping their input order.
   * @param questionId - ID of the question the options belong to.
   * @param optionTexts - The option texts in display order.
   * @returns The created options.
   */
  private async insertOptions(questionId: string, optionTexts: string[]): Promise<PollOption[]> {
    const { data, error } = await supabase
      .from('poll_options')
      .insert(optionTexts.map((text, index) => ({ question_id: questionId, text, sort_order: index })))
      .select()
      .overrideTypes<PollOptionRow[], { merge: false }>();
    return this.requireInserted(data, error).map(toPollOption);
  }

  /**
   * Unwraps an insert response, showing a toast and throwing if it failed.
   * @param data - The returned data, `null` on failure.
   * @param error - The returned error, if any.
   * @returns The data, guaranteed non-null.
   */
  private requireInserted<T>(data: T | null, error: PostgrestError | null): T {
    if (error || !data) {
      this.toastService.show(CREATE_FAILED_MESSAGE);
      throw error ?? new Error('Insert returned no data');
    }
    return data;
  }

  /**
   * Adds a freshly created poll and its questions/options to local state.
   * @param poll - The created poll.
   * @param questions - Its created questions, each with options.
   */
  private addCreatedPoll(poll: Poll, questions: QuestionWithOptions[]): void {
    this.polls.update((polls) => [...polls, poll]);
    this.questions.update((qs) => [...qs, ...questions.map(({ options: _options, ...q }) => q)]);
    this.options.update((os) => [...os, ...questions.flatMap((q) => q.options)]);
  }

  /**
   * Fetches all four tables in parallel and fills the signals; toasts on failure.
   */
  private async loadAll(): Promise<void> {
    const [polls, questions, options, votes] = await Promise.all([
      supabase.from('polls').select().overrideTypes<PollRow[], { merge: false }>(),
      supabase.from('questions').select().overrideTypes<QuestionRow[], { merge: false }>(),
      supabase.from('poll_options').select().overrideTypes<PollOptionRow[], { merge: false }>(),
      supabase.from('votes').select().overrideTypes<VoteRow[], { merge: false }>(),
    ]);
    if (polls.error || questions.error || options.error || votes.error) {
      this.reportLoadFailure([polls, questions, options, votes]);
      return;
    }
    this.applyLoadedData(polls.data, questions.data, options.data, votes.data);
  }

  /**
   * Replaces the local state with freshly loaded rows.
   * @param polls - All poll rows.
   * @param questions - All question rows.
   * @param options - All option rows.
   * @param votes - All vote rows.
   */
  private applyLoadedData(
    polls: PollRow[],
    questions: QuestionRow[],
    options: PollOptionRow[],
    votes: VoteRow[],
  ): void {
    this.polls.set(polls.map(toPoll));
    this.questions.set(questions.map(toPollQuestion));
    this.options.set(options.map(toPollOption));
    this.votes.set(votes.map(toVote));
  }

  /**
   * Logs the load errors and shows a toast.
   * @param responses - The responses of polls, questions, options and votes, in that order.
   */
  private reportLoadFailure(responses: { error: PostgrestError | null }[]): void {
    console.error(
      'Failed to load polls from Supabase',
      responses.map((response) => response.error),
    );
    this.toastService.show(LOAD_FAILED_MESSAGE);
  }

  /**
   * Listens for vote inserts via Supabase Realtime so results update live.
   */
  private subscribeToVotes(): void {
    supabase
      .channel(VOTES_CHANNEL)
      .on<VoteRow>('postgres_changes', { event: 'INSERT', schema: 'public', table: 'votes' }, ({ new: row }) =>
        this.addVote(toVote(row)),
      )
      .subscribe();
  }

  /**
   * Adds a vote to local state unless it's already there (own optimistic votes
   * come back through Realtime too).
   * @param vote - The vote to add.
   */
  private addVote(vote: Vote): void {
    this.votes.update((votes) => (votes.some((v) => v.id === vote.id) ? votes : [...votes, vote]));
  }

  /**
   * Removes a vote from local state, used to roll back a failed optimistic vote.
   * @param voteId - ID of the vote to remove.
   */
  private removeVote(voteId: string): void {
    this.votes.update((votes) => votes.filter((v) => v.id !== voteId));
  }

  /**
   * Returns a question's options in display order.
   * @param questionId - ID of the question.
   * @returns The options sorted by `sortOrder`.
   */
  private optionsForQuestion(questionId: string): PollOption[] {
    return this.options()
      .filter((o) => o.questionId === questionId)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  /**
   * Returns a poll's questions in display order, each with its options.
   * @param pollId - ID of the poll.
   * @returns The questions sorted by `sortOrder`.
   */
  private questionsForPoll(pollId: string): QuestionWithOptions[] {
    return this.questions()
      .filter((q) => q.pollId === pollId)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((question) => ({ ...question, options: this.optionsForQuestion(question.id) }));
  }

  /**
   * Combines a poll with its questions and options.
   * @param poll - The bare poll.
   * @returns The poll with `questions` attached.
   */
  private attachQuestions(poll: Poll): PollWithQuestions {
    return { ...poll, questions: this.questionsForPoll(poll.id) };
  }
}
