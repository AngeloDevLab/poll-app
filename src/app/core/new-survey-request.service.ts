import { Injectable, signal } from '@angular/core';

// Lets other pages ask Home to open the New Survey dialog after navigating
// there. In-memory on purpose: a reload or back-navigation won't reopen it.
@Injectable({ providedIn: 'root' })
export class NewSurveyRequestService {
  private readonly requested = signal(false);

  request(): void {
    this.requested.set(true);
  }

  // Returns whether a request was pending and clears it.
  consume(): boolean {
    const wasRequested = this.requested();
    this.requested.set(false);
    return wasRequested;
  }
}
