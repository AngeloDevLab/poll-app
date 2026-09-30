import { Injectable, signal } from '@angular/core';

const DISPLAY_MS = 3000;

/**
 * Holds the one toast message shown app-wide and hides it again after a few seconds.
 */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private timeoutId?: ReturnType<typeof setTimeout>;

  readonly message = signal<string | null>(null);

  /**
   * Shows a message, replacing any current one and restarting the hide timer.
   * @param message - The text to show.
   */
  show(message: string): void {
    clearTimeout(this.timeoutId);
    this.message.set(message);
    this.timeoutId = setTimeout(() => this.message.set(null), DISPLAY_MS);
  }
}
