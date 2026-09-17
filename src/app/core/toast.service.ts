import { Injectable, signal } from '@angular/core';

const DISPLAY_MS = 3000;

@Injectable({ providedIn: 'root' })
export class ToastService {
  private timeoutId?: ReturnType<typeof setTimeout>;

  readonly message = signal<string | null>(null);

  show(message: string): void {
    clearTimeout(this.timeoutId);
    this.message.set(message);
    this.timeoutId = setTimeout(() => this.message.set(null), DISPLAY_MS);
  }
}
