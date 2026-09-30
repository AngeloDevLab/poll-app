import { Component, computed, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { PollWithQuestions } from '../../core/models/poll.model';
import { EndsInPipe } from '../pipes/ends-in.pipe';

const CATEGORY_SEPARATOR = '&';

/**
 * Card showing a poll's category, title and deadline; navigates to the detail view on click.
 */
@Component({
  selector: 'app-poll-card',
  imports: [EndsInPipe],
  templateUrl: './poll-card.html',
  styleUrl: './poll-card.scss',
})
export class PollCard {
  private readonly router = inject(Router);

  readonly poll = input.required<PollWithQuestions>();
  readonly clickable = input(true);
  readonly variant = input<'default' | 'ending-soon'>('default');

  // Ending-soon cards are compact, so only show the part of the category
  // before the "&" (e.g. "Health & Wellness" -> "Health").
  protected readonly displayCategory = computed(() => {
    const category = this.poll().category;
    return this.variant() === 'ending-soon' ? category.split(CATEGORY_SEPARATOR)[0].trim() : category;
  });

  /**
   * Opens the poll's detail view, unless the card is not clickable (e.g. closed polls).
   */
  protected onClick(): void {
    if (this.clickable()) {
      this.router.navigate(['/polls', this.poll().id]);
    }
  }
}
