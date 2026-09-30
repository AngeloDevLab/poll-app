import { Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'poll-app:completed-polls';

// questionId -> option ids the visitor picked.
export type PollSelections = Record<string, string[]>;

// pollId -> the selections submitted for that poll.
type CompletedPolls = Record<string, PollSelections>;

/**
 * Reads the completed polls from localStorage, also accepting the older
 * format that stored only the poll IDs (read as completed without picks).
 * @returns The stored completed polls, or an empty object if none / unreadable.
 */
function readFromStorage(): CompletedPolls {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {};
    }
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return Object.fromEntries(parsed.map((id: string) => [id, {}]));
    }
    return parsed as CompletedPolls;
  } catch {
    return {};
  }
}

/**
 * Writes the completed polls to localStorage, silently ignoring storage errors.
 * @param polls - All completed polls to persist.
 */
function writeToStorage(polls: CompletedPolls): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(polls));
  } catch {
    // Storage unavailable (private browsing, quota, etc.) - completion still holds for this visit.
  }
}

/**
 * Tracks polls the visitor has already submitted (and what they picked), persisted across
 * visits in this browser. Not vote-locking (see CLAUDE.md) - purely a UI gate against
 * re-submitting the same survey.
 */
@Injectable({ providedIn: 'root' })
export class CompletedPollsService {
  private readonly completed = signal<CompletedPolls>(readFromStorage());

  /**
   * Checks whether this browser already submitted the poll.
   * @param pollId - ID of the poll.
   * @returns `true` if the poll was completed here.
   */
  isCompleted(pollId: string): boolean {
    return pollId in this.completed();
  }

  /**
   * Returns the picks this browser submitted for a poll.
   * @param pollId - ID of the poll.
   * @returns The picks per question, empty if none are stored.
   */
  selectionsFor(pollId: string): PollSelections {
    return this.completed()[pollId] ?? {};
  }

  /**
   * Remembers a poll as completed together with the submitted picks.
   * @param pollId - ID of the poll.
   * @param selections - The picks per question.
   */
  markCompleted(pollId: string, selections: PollSelections): void {
    this.completed.update((polls) => {
      const next = { ...polls, [pollId]: selections };
      writeToStorage(next);
      return next;
    });
  }
}
