import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PollWithQuestions } from '../../core/models/poll.model';
import { EndsInPipe } from '../pipes/ends-in.pipe';

const CATEGORY_SEPARATOR = '&';

/**
 * Card showing a poll's category, title and deadline. Clickable cards link to the
 * detail view (whole card is the click target, reachable via keyboard).
 */
@Component({
  selector: 'app-poll-card',
  imports: [EndsInPipe, RouterLink],
  templateUrl: './poll-card.html',
  styleUrl: './poll-card.scss',
})
export class PollCard {
  readonly poll = input.required<PollWithQuestions>();
  readonly clickable = input(true);
  readonly variant = input<'default' | 'ending-soon'>('default');

  // Ending-soon cards are compact, so only show the part of the category
  // before the "&" (e.g. "Health & Wellness" -> "Health").
  protected readonly displayCategory = computed(() => {
    const category = this.poll().category;
    return this.variant() === 'ending-soon' ? category.split(CATEGORY_SEPARATOR)[0].trim() : category;
  });
}
