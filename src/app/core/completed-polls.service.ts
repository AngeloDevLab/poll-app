import { Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'poll-app:completed-polls';

// questionId -> option ids the visitor picked.
export type PollSelections = Record<string, string[]>;

// pollId -> the selections submitted for that poll.
type CompletedPolls = Record<string, PollSelections>;

function readFromStorage(): CompletedPolls {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {};
    }
    const parsed: unknown = JSON.parse(raw);
    // Older format stored only the poll ids (no selections) - keep them as completed.
    if (Array.isArray(parsed)) {
      return Object.fromEntries(parsed.map((id: string) => [id, {}]));
    }
    return parsed as CompletedPolls;
  } catch {
    return {};
  }
}

function writeToStorage(polls: CompletedPolls): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(polls));
  } catch {
    // Storage unavailable (private browsing, quota, etc.) - completion still holds for this visit.
  }
}

// Tracks polls the visitor has already submitted (and what they picked), persisted across
// visits in this browser. Not vote-locking (see CLAUDE.md) - purely a UI gate against
// re-submitting the same survey.
@Injectable({ providedIn: 'root' })
export class CompletedPollsService {
  private readonly completed = signal<CompletedPolls>(readFromStorage());

  isCompleted(pollId: string): boolean {
    return pollId in this.completed();
  }

  selectionsFor(pollId: string): PollSelections {
    return this.completed()[pollId] ?? {};
  }

  markCompleted(pollId: string, selections: PollSelections): void {
    this.completed.update((polls) => {
      const next = { ...polls, [pollId]: selections };
      writeToStorage(next);
      return next;
    });
  }
}
