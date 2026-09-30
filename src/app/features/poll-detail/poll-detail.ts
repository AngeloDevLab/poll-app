import { DatePipe, NgTemplateOutlet } from '@angular/common';
import { Component, computed, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CompletedPollsService } from '../../core/completed-polls.service';
import { NewSurveyRequestService } from '../../core/new-survey-request.service';
import { PollResult, PollWithQuestions, QuestionWithOptions } from '../../core/models/poll.model';
import { PollsService } from '../../core/polls.service';
import { isPollClosed } from '../../shared/utils/is-poll-closed';
import { optionLetter } from '../../shared/utils/option-letter';

const PERCENT = 100;

/**
 * Computes the next picks for a question after clicking an option: toggles it in
 * multi-select mode, or selects/deselects it as the only pick in single-choice mode.
 * @param current - The currently picked option IDs.
 * @param optionId - The clicked option.
 * @param allowMultiple - Whether the question allows several picks.
 * @returns The new list of picked option IDs.
 */
function nextSelection(current: string[], optionId: string, allowMultiple: boolean): string[] {
  const isPicked = current.includes(optionId);
  if (allowMultiple) {
    return isPicked ? current.filter((id) => id !== optionId) : [...current, optionId];
  }
  return isPicked ? [] : [optionId];
}

/**
 * Detail view of a single poll: lets the visitor pick answers per question,
 * submit them once, and shows the live results next to it.
 */
@Component({
  selector: 'app-poll-detail',
  imports: [DatePipe, NgTemplateOutlet, RouterLink],
  templateUrl: './poll-detail.html',
  styleUrl: './poll-detail.scss',
})
export class PollDetail {
  private readonly pollsService = inject(PollsService);
  private readonly completedPolls = inject(CompletedPollsService);
  private readonly router = inject(Router);
  private readonly newSurveyRequest = inject(NewSurveyRequestService);

  readonly id = input.required<string>();

  protected readonly poll = computed(() => this.pollsService.getPoll(this.id())());

  protected readonly isClosed = computed(() => {
    const poll = this.poll();
    return !!poll && isPollClosed(poll);
  });

  // Local, not-yet-submitted picks: questionId -> selected option ids.
  private readonly selections = signal<Map<string, string[]>>(new Map());

  protected readonly resultsExpanded = signal(true);

  // Persisted per-browser via CompletedPollsService, not DB-backed vote-locking.
  protected readonly hasCompleted = computed(() => this.completedPolls.isCompleted(this.id()));

  protected readonly canComplete = computed(() => {
    const poll = this.poll();
    const selections = this.selections();
    return !!poll && poll.questions.every((q) => (selections.get(q.id)?.length ?? 0) > 0);
  });

  protected readonly questionResults = computed(() => {
    const poll = this.poll();
    if (!poll) {
      return new Map<string, PollResult[]>();
    }
    return new Map(poll.questions.map((q) => [q.id, this.pollsService.getResults(q.id)()]));
  });

  /**
   * Returns the display letter for an option.
   * @param index - Zero-based option index.
   * @returns The letter, e.g. "A".
   */
  protected optionLetter(index: number): string {
    return optionLetter(index);
  }

  /**
   * Checks whether an option is picked. After submitting, the stored picks are shown
   * (also after a reload) instead of the local ones.
   * @param question - The question the option belongs to.
   * @param optionId - ID of the option.
   * @returns `true` if the option is picked.
   */
  protected isSelected(question: QuestionWithOptions, optionId: string): boolean {
    const picked = this.hasCompleted()
      ? this.completedPolls.selectionsFor(this.id())[question.id]
      : this.selections().get(question.id);
    return (picked ?? []).includes(optionId);
  }

  /**
   * Picks or unpicks an option, as long as the poll is still open and not yet submitted.
   * @param question - The question the option belongs to.
   * @param optionId - ID of the clicked option.
   */
  protected toggleOption(question: QuestionWithOptions, optionId: string): void {
    if (this.isClosed() || this.hasCompleted()) {
      return;
    }
    this.selections.update((map) => {
      const current = map.get(question.id) ?? [];
      return new Map(map).set(question.id, nextSelection(current, optionId, question.allowMultiple));
    });
  }

  /**
   * Submits all picks as votes, remembers the poll as completed and opens the results.
   * @param event - The form submit event.
   */
  protected complete(event: Event): void {
    event.preventDefault();
    const poll = this.poll();
    if (!poll || !this.canComplete()) {
      return;
    }
    this.submitVotes(poll);
    this.completedPolls.markCompleted(poll.id, Object.fromEntries(this.selections()));
    this.resultsExpanded.set(true);
  }

  /**
   * Expands or collapses the results panel.
   */
  protected toggleResults(): void {
    this.resultsExpanded.update((expanded) => !expanded);
  }

  /**
   * Sums up all votes of a question.
   * @param questionId - ID of the question.
   * @returns The total number of votes.
   */
  protected totalVotes(questionId: string): number {
    return (this.questionResults().get(questionId) ?? []).reduce((sum, r) => sum + r.voteCount, 0);
  }

  /**
   * Calculates an option's share of its question's votes.
   * @param result - The option's result.
   * @param questionId - ID of the question.
   * @returns The rounded percentage (0 if there are no votes yet).
   */
  protected percentage(result: PollResult, questionId: string): number {
    const total = this.totalVotes(questionId);
    return total === 0 ? 0 : Math.round((result.voteCount / total) * PERCENT);
  }

  /**
   * Leaves the detail view and returns to the homescreen.
   */
  protected close(): void {
    this.router.navigate(['/']);
  }

  /**
   * Returns to the homescreen and asks it to open the New Survey dialog.
   */
  protected createSurvey(): void {
    this.newSurveyRequest.request();
    this.router.navigate(['/']);
  }

  /**
   * Sends one vote per picked option of every question.
   * @param poll - The poll being submitted.
   */
  private submitVotes(poll: PollWithQuestions): void {
    for (const question of poll.questions) {
      for (const optionId of this.selections().get(question.id) ?? []) {
        this.pollsService.vote(question.id, optionId);
      }
    }
  }
}
