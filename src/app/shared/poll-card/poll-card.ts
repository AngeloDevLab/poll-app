import { Component, computed, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { PollWithQuestions } from '../../core/polls.service';
import { EndsInPipe } from '../pipes/ends-in.pipe';

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
    return this.variant() === 'ending-soon' ? category.split('&')[0].trim() : category;
  });

  protected onClick(): void {
    if (this.clickable()) {
      this.router.navigate(['/polls', this.poll().id]);
    }
  }
}
