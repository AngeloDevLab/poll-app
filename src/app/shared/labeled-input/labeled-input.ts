import { Component, input, model, output } from '@angular/core';

const DATE_PART_LENGTH = 2;

/**
 * Formats a date as `YYYY-MM-DD` in local time (unlike `toISOString()`, which uses UTC).
 * @param date - The date to format.
 * @returns The date string, as `<input type="date">` expects it.
 */
function toLocalIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(DATE_PART_LENGTH, '0');
  const day = String(date.getDate()).padStart(DATE_PART_LENGTH, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Text, date or multiline input with label, optional/error hint and a clear/remove button.
 */
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

  // Earliest selectable date for date inputs.
  protected readonly today = toLocalIsoDate(new Date());

  /**
   * Clears the field, or asks the parent to remove it if it's already empty.
   */
  protected clear(): void {
    if (this.value()) {
      this.value.set('');
    } else {
      this.removeRequested.emit();
    }
  }

  /**
   * Syncs the typed value into the `value` model.
   * @param event - The native input event.
   */
  protected onInput(event: Event): void {
    this.value.set((event.target as HTMLInputElement | HTMLTextAreaElement).value);
  }
}
