import { Component, input, model } from '@angular/core';

@Component({
  selector: 'app-labeled-input',
  templateUrl: './labeled-input.html',
  styleUrl: './labeled-input.scss',
})
export class LabeledInput {
  readonly label = input.required<string>();
  readonly optional = input(false);
  readonly type = input<'text' | 'date'>('text');
  readonly multiline = input(false);
  readonly placeholder = input('');
  readonly value = model.required<string>();

  protected clear(): void {
    this.value.set('');
  }

  protected onInput(event: Event): void {
    this.value.set((event.target as HTMLInputElement | HTMLTextAreaElement).value);
  }
}
