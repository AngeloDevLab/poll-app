import { Component, afterNextRender, computed, inject, signal, viewChild } from '@angular/core';
import { Router } from '@angular/router';
import { NewPollInput, PollWithQuestions } from '../../core/models/poll.model';
import { NewSurveyRequestService } from '../../core/new-survey-request.service';
import { PollsService } from '../../core/polls.service';
import { Dropdown } from '../../shared/dropdown/dropdown';
import { PollCard } from '../../shared/poll-card/poll-card';
import { isPollClosed } from '../../shared/utils/is-poll-closed';
import { NewSurveyDialog } from '../new-survey-dialog/new-survey-dialog';
import { SurveyPublishedDialog } from '../survey-published-dialog/survey-published-dialog';
import { HeroIllustration } from './hero-illustration/hero-illustration';

type Tab = 'running' | 'closed';

type PollWithDeadline = PollWithQuestions & { deadline: Date };

const ALL_CATEGORIES = 'All surveys';
const ENDING_SOON_LIMIT = 3;

/**
 * Type guard for polls that have a deadline set.
 * @param poll - The poll to check.
 * @returns `true` if `poll.deadline` is defined.
 */
function hasDeadline(poll: PollWithQuestions): poll is PollWithDeadline {
  return !!poll.deadline;
}

/**
 * Lists all categories that occur in the given polls, with "All surveys" first.
 * @param polls - The polls to collect categories from.
 * @returns The unique category options for the filter dropdown.
 */
function categoriesOf(polls: PollWithQuestions[]): string[] {
  return [ALL_CATEGORIES, ...new Set(polls.map((poll) => poll.category))];
}

/**
 * Homescreen: hero, "ending soon" section and the running/closed poll lists with
 * a per-tab category filter. Also hosts the New Survey and "published" dialogs.
 */
@Component({
  selector: 'app-home',
  imports: [PollCard, Dropdown, NewSurveyDialog, SurveyPublishedDialog, HeroIllustration],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  private readonly pollsService = inject(PollsService);
  private readonly router = inject(Router);
  private readonly newSurveyRequest = inject(NewSurveyRequestService);

  protected readonly polls = this.pollsService.listPolls();
  protected readonly activeTab = signal<Tab>('running');
  protected readonly runningCategory = signal(ALL_CATEGORIES);
  protected readonly closedCategory = signal(ALL_CATEGORIES);

  protected readonly runningPolls = computed(() => this.polls().filter((poll) => !isPollClosed(poll)));
  protected readonly closedPolls = computed(() => this.polls().filter((poll) => isPollClosed(poll)));

  protected readonly endingSoon = computed(() =>
    this.runningPolls()
      .filter(hasDeadline)
      .sort((a, b) => a.deadline.getTime() - b.deadline.getTime())
      .slice(0, ENDING_SOON_LIMIT),
  );

  private readonly activeTabPolls = computed(() =>
    this.activeTab() === 'running' ? this.runningPolls() : this.closedPolls(),
  );

  protected readonly activeCategoryOptions = computed(() => categoriesOf(this.activeTabPolls()));

  protected readonly activeCategoryValue = computed(() =>
    this.activeTab() === 'running' ? this.runningCategory() : this.closedCategory(),
  );

  protected readonly hasActiveCategoryFilter = computed(() => this.activeCategoryValue() !== ALL_CATEGORIES);

  protected readonly visiblePolls = computed(() => {
    const category = this.activeCategoryValue();
    const polls = this.activeTabPolls();
    return category === ALL_CATEGORIES ? polls : polls.filter((poll) => poll.category === category);
  });

  protected readonly newSurveyDialog = viewChild.required(NewSurveyDialog);
  protected readonly publishedDialog = viewChild.required(SurveyPublishedDialog);

  private pendingPublishedPollId?: string;

  /**
   * Opens the New Survey dialog after the first render if another page asked for it
   * (e.g. "Create survey" on the detail view).
   */
  constructor() {
    afterNextRender(() => {
      if (this.newSurveyRequest.consume()) {
        this.openNewSurveyDialog();
      }
    });
  }

  /**
   * Switches between the running and closed poll lists.
   * @param tab - The tab to show.
   */
  protected setTab(tab: Tab): void {
    this.activeTab.set(tab);
  }

  /**
   * Sets the category filter of the currently active tab (each tab keeps its own).
   * @param category - The chosen category, or "All surveys".
   */
  protected setCategory(category: string): void {
    const categorySignal = this.activeTab() === 'running' ? this.runningCategory : this.closedCategory;
    categorySignal.set(category);
  }

  /**
   * Opens the New Survey dialog.
   */
  protected openNewSurveyDialog(): void {
    this.newSurveyDialog().show();
  }

  /**
   * Saves the new poll and, on success, shows the "published" confirmation.
   * Failures are already reported via toast by the service.
   * @param input - The data from the New Survey dialog.
   */
  protected async onPollCreated(input: NewPollInput): Promise<void> {
    const id = await this.pollsService.createPoll(input).catch(() => undefined);
    if (!id) {
      return;
    }
    this.pendingPublishedPollId = id;
    this.publishedDialog().show();
  }

  /**
   * Navigates to the freshly published poll once its confirmation dialog closes.
   */
  protected onPublishedDialogClosed(): void {
    const id = this.pendingPublishedPollId;
    this.pendingPublishedPollId = undefined;
    if (id) {
      this.router.navigate(['/polls', id]);
    }
  }
}
