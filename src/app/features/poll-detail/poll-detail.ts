import { DatePipe, NgTemplateOutlet } from '@angular/common';
import { Component, computed, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CompletedPollsService } from '../../core/completed-polls.service';
import { NewSurveyRequestService } from '../../core/new-survey-request.service';
import { PollResult } from '../../core/models/poll.model';
import { PollsService, QuestionWithOptions } from '../../core/polls.service';

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
    const deadline = this.poll()?.deadline;
    return !!deadline && deadline.getTime() < Date.now();
  });

  // Local, not-yet-submitted picks: questionId -> selected option ids.
  private readonly selections = signal<Map<string, string[]>>(new Map());

  protected readonly resultsExpanded = signal(true);

  // Persisted per-browser via CompletedPollsService, not DB-backed vote-locking.
  protected readonly hasCompleted = computed(() => this.completedPolls.isCompleted(this.id()));

  protected readonly canComplete = computed(() => {
    const poll = this.poll();
    if (!poll) {
      return false;
    }
    const selections = this.selections();
    return poll.questions.every((q) => (selections.get(q.id)?.length ?? 0) > 0);
  });

  protected readonly questionResults = computed(() => {
    const poll = this.poll();
    if (!poll) {
      return new Map<string, PollResult[]>();
    }
    return new Map(poll.questions.map((q) => [q.id, this.pollsService.getResults(q.id)()]));
  });

  protected optionLetter(index: number): string {
    return String.fromCharCode(65 + index);
  }

  protected isSelected(question: QuestionWithOptions, optionId: string): boolean {
    return (this.selections().get(question.id) ?? []).includes(optionId);
  }

  protected toggleOption(question: QuestionWithOptions, optionId: string): void {
    if (this.isClosed() || this.hasCompleted()) {
      return;
    }
    this.selections.update((map) => {
      const next = new Map(map);
      const current = next.get(question.id) ?? [];
      if (question.allowMultiple) {
        next.set(
          question.id,
          current.includes(optionId) ? current.filter((id) => id !== optionId) : [...current, optionId],
        );
      } else {
        next.set(question.id, current.includes(optionId) ? [] : [optionId]);
      }
      return next;
    });
  }

  protected complete(event: Event): void {
    event.preventDefault();
    const poll = this.poll();
    if (!poll || !this.canComplete()) {
      return;
    }
    for (const question of poll.questions) {
      for (const optionId of this.selections().get(question.id) ?? []) {
        this.pollsService.vote(question.id, optionId);
      }
    }
    this.completedPolls.markCompleted(poll.id);
    this.resultsExpanded.set(true);
  }

  protected toggleResults(): void {
    this.resultsExpanded.update((expanded) => !expanded);
  }

  protected totalVotes(questionId: string): number {
    return (this.questionResults().get(questionId) ?? []).reduce((sum, r) => sum + r.voteCount, 0);
  }

  protected percentage(result: PollResult, questionId: string): number {
    const total = this.totalVotes(questionId);
    return total === 0 ? 0 : Math.round((result.voteCount / total) * 100);
  }

  protected close(): void {
    this.router.navigate(['/']);
  }

  protected createSurvey(): void {
    this.newSurveyRequest.request();
    this.router.navigate(['/']);
  }
}
