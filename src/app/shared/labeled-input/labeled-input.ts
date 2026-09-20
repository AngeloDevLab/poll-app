import { Component, input, model, output } from '@angular/core';

@Component({
  selector: 'app-labeled-input',
  templateUrl: './labeled-input.html',
  styleUrl: './labeled-input.scss',
})
export class LabeledInput {
  readonly label = input.required<string>();
  readonly optional = input(false);
  readonly error = input<string | null>(null);
  readonly type = input<'text' | 'date'>('text');
  readonly multiline = input(false);
  readonly placeholder = input('');
  readonly value = model.required<string>();

  // Fires instead of clearing when the trash icon is clicked on an already-empty
  // field — lets a parent that generates repeatable fields (e.g. a question or
  // an answer option) remove the whole thing instead of just wiping the text.
  readonly removeRequested = output<void>();

  // Lets a parent reveal validation errors as soon as the user leaves a field,
  // instead of only on form submit.
  readonly blurred = output<void>();

  protected clear(): void {
    if (this.value()) {
      this.value.set('');
    } else {
      this.removeRequested.emit();
    }
  }

  protected onInput(event: Event): void {
    this.value.set((event.target as HTMLInputElement | HTMLTextAreaElement).value);
  }

  protected readonly today = LabeledInput.toIsoDate(new Date());

  private static toIsoDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
