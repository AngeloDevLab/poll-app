import { Component, computed, inject, signal, viewChild } from '@angular/core';
import { NewPollInput, PollWithQuestions, PollsService } from '../../core/polls.service';
import { Dropdown } from '../../shared/dropdown/dropdown';
import { PollCard } from '../../shared/poll-card/poll-card';
import { NewSurveyDialog } from '../new-survey-dialog/new-survey-dialog';

type Tab = 'running' | 'closed';

const ALL_CATEGORIES = 'All surveys';
const ENDING_SOON_LIMIT = 3;

@Component({
  selector: 'app-home',
  imports: [PollCard, Dropdown, NewSurveyDialog],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  private readonly pollsService = inject(PollsService);

  protected readonly polls = this.pollsService.listPolls();
  protected readonly activeTab = signal<Tab>('running');
  protected readonly runningCategory = signal(ALL_CATEGORIES);
  protected readonly closedCategory = signal(ALL_CATEGORIES);

  protected readonly runningPolls = computed(() => this.polls().filter((p) => !this.isClosed(p)));
  protected readonly closedPolls = computed(() => this.polls().filter((p) => this.isClosed(p)));

  protected readonly endingSoon = computed(() =>
    this.runningPolls()
      .filter((p) => p.deadline)
      .sort((a, b) => a.deadline!.getTime() - b.deadline!.getTime())
      .slice(0, ENDING_SOON_LIMIT),
  );

  protected readonly activeCategoryOptions = computed(() =>
    this.categoriesOf(this.activeTab() === 'running' ? this.runningPolls() : this.closedPolls()),
  );

  protected readonly activeCategoryValue = computed(() =>
    this.activeTab() === 'running' ? this.runningCategory() : this.closedCategory(),
  );

  protected readonly hasActiveCategoryFilter = computed(() => this.activeCategoryValue() !== ALL_CATEGORIES);

  protected readonly newSurveyDialog = viewChild.required(NewSurveyDialog);

  protected readonly visiblePolls = computed(() => {
    const polls = this.activeTab() === 'running' ? this.runningPolls() : this.closedPolls();
    const category = this.activeCategoryValue();
    return category === ALL_CATEGORIES ? polls : polls.filter((p) => p.category === category);
  });

  protected setTab(tab: Tab): void {
    this.activeTab.set(tab);
  }

  protected setCategory(category: string): void {
    if (this.activeTab() === 'running') {
      this.runningCategory.set(category);
    } else {
      this.closedCategory.set(category);
    }
  }

  protected openNewSurveyDialog(): void {
    this.newSurveyDialog().show();
  }

  protected onPollCreated(input: NewPollInput): void {
    this.pollsService.createPoll(input);
  }

  private isClosed(poll: PollWithQuestions): boolean {
    return !!poll.deadline && poll.deadline.getTime() < Date.now();
  }

  private categoriesOf(polls: PollWithQuestions[]): string[] {
    return [ALL_CATEGORIES, ...new Set(polls.map((p) => p.category))];
  }
}
