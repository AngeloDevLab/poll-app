import { Poll, PollCategory, PollOption, PollQuestion } from './models/poll.model';

// Raw row shapes as Supabase returns them (snake_case), plus the mappers that
// turn them into the app's camelCase models.

export interface Vote {
  id: string;
  questionId: string;
  pollOptionId: string;
}

export interface PollRow {
  id: string;
  title: string;
  description: string | null;
  category: string;
  deadline: string | null;
  created_at: string;
}

export interface QuestionRow {
  id: string;
  poll_id: string;
  text: string;
  allow_multiple: boolean;
  sort_order: number;
}

export interface PollOptionRow {
  id: string;
  question_id: string;
  text: string;
  sort_order: number;
}

export interface VoteRow {
  id: string;
  poll_option_id: string;
  question_id: string;
}

/**
 * Maps a `polls` table row to the app's `Poll` model.
 * @param row - Raw row as returned by Supabase.
 * @returns The poll with parsed dates and optional fields as `undefined`.
 */
export function toPoll(row: PollRow): Poll {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? undefined,
    category: row.category as PollCategory,
    deadline: row.deadline ? new Date(row.deadline) : undefined,
    createdAt: new Date(row.created_at),
  };
}

/**
 * Maps a `questions` table row to the app's `PollQuestion` model.
 * @param row - Raw row as returned by Supabase.
 * @returns The question in camelCase form.
 */
export function toPollQuestion(row: QuestionRow): PollQuestion {
  return {
    id: row.id,
    pollId: row.poll_id,
    text: row.text,
    allowMultiple: row.allow_multiple,
    sortOrder: row.sort_order,
  };
}

/**
 * Maps a `poll_options` table row to the app's `PollOption` model.
 * @param row - Raw row as returned by Supabase.
 * @returns The option in camelCase form.
 */
export function toPollOption(row: PollOptionRow): PollOption {
  return { id: row.id, questionId: row.question_id, text: row.text, sortOrder: row.sort_order };
}

/**
 * Maps a `votes` table row to the internal `Vote` shape.
 * @param row - Raw row as returned by Supabase (initial load or Realtime payload).
 * @returns The vote in camelCase form.
 */
export function toVote(row: VoteRow): Vote {
  return { id: row.id, questionId: row.question_id, pollOptionId: row.poll_option_id };
}
