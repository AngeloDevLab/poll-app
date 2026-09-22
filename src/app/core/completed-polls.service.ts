import { Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'poll-app:completed-polls';

function readFromStorage(): ReadonlySet<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function writeToStorage(ids: ReadonlySet<string>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
  } catch {
    // Storage unavailable (private browsing, quota, etc.) - completion still holds for this visit.
  }
}

// Tracks polls the visitor has already submitted, persisted across visits in this browser.
// Not vote-locking (see CLAUDE.md) - purely a UI gate against re-submitting the same survey.
@Injectable({ providedIn: 'root' })
export class CompletedPollsService {
  private readonly completedIds = signal<ReadonlySet<string>>(readFromStorage());

  isCompleted(pollId: string): boolean {
    return this.completedIds().has(pollId);
  }

  markCompleted(pollId: string): void {
    this.completedIds.update((ids) => {
      const next = new Set(ids);
      next.add(pollId);
      writeToStorage(next);
      return next;
    });
  }
}
