import { Injectable, signal } from '@angular/core';

/**
 * Lets other pages ask Home to open the New Survey dialog after navigating there.
 * In-memory on purpose: a reload or back-navigation won't reopen it.
 */
@Injectable({ providedIn: 'root' })
export class NewSurveyRequestService {
  private readonly requested = signal(false);

  /**
   * Marks the dialog as requested; Home picks this up on its next render.
   */
  request(): void {
    this.requested.set(true);
  }

  /**
   * Reads and clears the pending request, so it's handled only once.
   * @returns `true` if a request was pending.
   */
  consume(): boolean {
    const wasRequested = this.requested();
    this.requested.set(false);
    return wasRequested;
  }
}
