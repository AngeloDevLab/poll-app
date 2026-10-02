import { DOCUMENT } from '@angular/common';
import { Component, ElementRef, computed, inject, output, signal, viewChild } from '@angular/core';
import { NewPollInput, NewQuestionInput, POLL_CATEGORIES, PollCategory } from '../../core/models/poll.model';
import { Dropdown } from '../../shared/dropdown/dropdown';
import { LabeledInput } from '../../shared/labeled-input/labeled-input';
import { optionLetter } from '../../shared/utils/option-letter';

// Every question starts with (and must keep) this many answer options.
const MIN_OPTIONS = 2;
const ERROR_SELECTOR = '.labeled-input__error, .field__error';

// Character limits per text field, so nobody can publish a novel as a title.
const MAX_LENGTH = {
  title: 100,
  description: 500,
  question: 200,
  option: 100,
} as const;

// A picked deadline counts until the very end of that day (local time).
const LAST_HOUR = 23;
const LAST_MINUTE = 59;
const LAST_SECOND = 59;
const LAST_MILLISECOND = 999;

interface QuestionDraft {
  text: string;
  allowMultiple: boolean;
  options: string[];
}

/**
 * Creates a blank question with the minimum number of empty options.
 * @returns A fresh question draft.
 */
function emptyQuestion(): QuestionDraft {
  return { text: '', allowMultiple: false, options: Array<string>(MIN_OPTIONS).fill('') };
}

/**
 * Checks whether a question has text and at least the minimum number of filled options.
 * @param question - The question draft to check.
 * @returns `true` if the question can be published.
 */
function isQuestionValid(question: QuestionDraft): boolean {
  const filledOptions = question.options.filter((option) => option.trim()).length;
  return !!question.text.trim() && filledOptions >= MIN_OPTIONS;
}

/**
 * Converts a `YYYY-MM-DD` date string to the last millisecond of that day in local time.
 * @param dateIso - Date as delivered by `<input type="date">`.
 * @returns The end of that day.
 */
function toEndOfDay(dateIso: string): Date {
  const [year, month, day] = dateIso.split('-').map(Number);
  const monthIndex = month - 1;
  return new Date(year, monthIndex, day, LAST_HOUR, LAST_MINUTE, LAST_SECOND, LAST_MILLISECOND);
}

/**
 * "New Survey" modal: collects title, category, optional description/deadline and
 * one or more questions, validates them and emits the result via `created`.
 */
@Component({
  selector: 'app-new-survey-dialog',
  imports: [Dropdown, LabeledInput],
  templateUrl: './new-survey-dialog.html',
  styleUrl: './new-survey-dialog.scss',
})
export class NewSurveyDialog {
  private readonly document = inject(DOCUMENT);
  private readonly hostElement = inject(ElementRef<HTMLElement>);

  readonly created = output<NewPollInput>();

  protected readonly dialogRef = viewChild.required<ElementRef<HTMLDialogElement>>('dialogRef');

  protected readonly categoryOptions: string[] = [...POLL_CATEGORIES];
  protected readonly maxLength = MAX_LENGTH;

  protected readonly title = signal('');
  protected readonly description = signal('');
  protected readonly deadline = signal('');
  protected readonly category = signal('');
  protected readonly questions = signal<QuestionDraft[]>([emptyQuestion()]);
  protected readonly submitted = signal(false);

  // Fields reveal their error as soon as they're blurred, not only on submit.
  private readonly touched = signal<Set<string>>(new Set());

  protected readonly titleError = computed(() => this.shouldShowError('title') && !this.title().trim());
  protected readonly categoryError = computed(() => this.shouldShowError('category') && !this.category());

  protected readonly formValid = computed(
    () => !!this.title().trim() && !!this.category() && this.questions().every(isQuestionValid),
  );

  /**
   * Opens the dialog as a modal and locks page scrolling behind it.
   */
  show(): void {
    this.dialogRef().nativeElement.showModal();
    this.document.body.style.overflow = 'hidden';
  }

  /**
   * Closes the dialog; cleanup happens in `onDialogClosed`.
   */
  protected close(): void {
    this.dialogRef().nativeElement.close();
  }

  /**
   * Closes the dialog when the backdrop (the `<dialog>` element itself) is clicked.
   * @param event - The click event.
   */
  protected onDialogClick(event: MouseEvent): void {
    if (event.target === this.dialogRef().nativeElement) {
      this.close();
    }
  }

  /**
   * Restores page scrolling and clears the form after the dialog closed (by any means).
   */
  protected onDialogClosed(): void {
    this.document.body.style.overflow = '';
    this.resetForm();
  }

  /**
   * Builds the label shown in front of an answer option.
   * @param index - Zero-based option index.
   * @returns The label, e.g. "A.".
   */
  protected optionLabel(index: number): string {
    return `${optionLetter(index)}.`;
  }

  /**
   * Marks a field as touched so its validation error may show.
   * @param key - The field key, e.g. `title` or `option-0-1`.
   */
  protected markTouched(key: string): void {
    this.touched.update((keys) => new Set(keys).add(key));
  }

  /**
   * Checks whether a question's text is missing and its error should be shown.
   * @param question - The question draft.
   * @param questionIndex - Its index in the form.
   * @returns `true` if the error is visible.
   */
  protected questionError(question: QuestionDraft, questionIndex: number): boolean {
    return this.shouldShowError(`question-${questionIndex}`) && !question.text.trim();
  }

  /**
   * Checks whether one of the required options is empty and its error should be shown.
   * Additional options beyond the minimum are optional.
   * @param question - The question draft.
   * @param questionIndex - Its index in the form.
   * @param optionIndex - The option's index within the question.
   * @returns `true` if the error is visible.
   */
  protected optionError(question: QuestionDraft, questionIndex: number, optionIndex: number): boolean {
    const isRequired = optionIndex < MIN_OPTIONS;
    const isEmpty = !question.options[optionIndex].trim();
    return this.shouldShowError(`option-${questionIndex}-${optionIndex}`) && isRequired && isEmpty;
  }

  /**
   * Sets the text of a question.
   * @param index - The question's index.
   * @param text - The new text.
   */
  protected updateQuestionText(index: number, text: string): void {
    this.updateQuestion(index, (question) => ({ ...question, text }));
  }

  /**
   * Toggles single/multiple choice for a question from its checkbox.
   * @param index - The question's index.
   * @param event - The checkbox change event.
   */
  protected onAllowMultipleChange(index: number, event: Event): void {
    const allowMultiple = (event.target as HTMLInputElement).checked;
    this.updateQuestion(index, (question) => ({ ...question, allowMultiple }));
  }

  /**
   * Sets the text of one answer option.
   * @param questionIndex - The question's index.
   * @param optionIndex - The option's index within the question.
   * @param text - The new text.
   */
  protected updateOption(questionIndex: number, optionIndex: number, text: string): void {
    this.updateQuestion(questionIndex, (question) => ({
      ...question,
      options: question.options.map((option, i) => (i === optionIndex ? text : option)),
    }));
  }

  /**
   * Appends an empty answer option to a question.
   * @param questionIndex - The question's index.
   */
  protected addOption(questionIndex: number): void {
    this.updateQuestion(questionIndex, (question) => ({ ...question, options: [...question.options, ''] }));
  }

  /**
   * Removes an answer option, unless the question is already at the minimum.
   * @param questionIndex - The question's index.
   * @param optionIndex - The option's index within the question.
   */
  protected removeOption(questionIndex: number, optionIndex: number): void {
    this.updateQuestion(questionIndex, (question) =>
      question.options.length > MIN_OPTIONS
        ? { ...question, options: question.options.filter((_, i) => i !== optionIndex) }
        : question,
    );
  }

  /**
   * Appends a blank question to the form.
   */
  protected addQuestion(): void {
    this.questions.update((questions) => [...questions, emptyQuestion()]);
  }

  /**
   * Removes a question, unless it's the only one left.
   * @param index - The question's index.
   */
  protected removeQuestion(index: number): void {
    if (this.questions().length > 1) {
      this.questions.update((questions) => questions.filter((_, i) => i !== index));
    }
  }

  /**
   * Validates the form; emits the new poll and closes on success, otherwise
   * reveals all errors and scrolls to the first one.
   * @param event - The form submit event.
   */
  protected onSubmit(event: Event): void {
    event.preventDefault();
    this.submitted.set(true);
    if (!this.formValid()) {
      this.scrollToFirstError();
      return;
    }
    this.created.emit(this.buildPollInput());
    this.close();
  }

  /**
   * Decides whether a field's error may be shown yet (touched, or form submitted).
   * @param key - The field key.
   * @returns `true` once the field was touched or the form submitted.
   */
  private shouldShowError(key: string): boolean {
    return this.touched().has(key) || this.submitted();
  }

  /**
   * Replaces one question with an updated copy.
   * @param index - The question's index.
   * @param change - Returns the updated question from the current one.
   */
  private updateQuestion(index: number, change: (question: QuestionDraft) => QuestionDraft): void {
    this.questions.update((questions) => questions.map((q, i) => (i === index ? change(q) : q)));
  }

  /**
   * Turns the form state into trimmed poll data, dropping empty optional values.
   * @returns The poll data to emit.
   */
  private buildPollInput(): NewPollInput {
    return {
      title: this.title().trim(),
      description: this.description().trim() || undefined,
      category: this.category() as PollCategory,
      deadline: this.deadline() ? toEndOfDay(this.deadline()) : undefined,
      questions: this.questions().map((question) => this.buildQuestionInput(question)),
    };
  }

  /**
   * Turns a question draft into trimmed question data, dropping empty options.
   * @param question - The question draft.
   * @returns The question data to emit.
   */
  private buildQuestionInput(question: QuestionDraft): NewQuestionInput {
    return {
      text: question.text.trim(),
      allowMultiple: question.allowMultiple,
      optionTexts: question.options.map((option) => option.trim()).filter((option) => option.length > 0),
    };
  }

  /**
   * Scrolls the first visible validation error into view.
   * Errors render on the next tick (they depend on the `submitted`/`touched`
   * signals just set), so this waits a frame before looking for them.
   */
  private scrollToFirstError(): void {
    setTimeout(() => {
      const firstError = this.hostElement.nativeElement.querySelector(ERROR_SELECTOR);
      firstError?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  /**
   * Clears all fields, questions and validation state.
   */
  private resetForm(): void {
    this.title.set('');
    this.description.set('');
    this.deadline.set('');
    this.category.set('');
    this.questions.set([emptyQuestion()]);
    this.submitted.set(false);
    this.touched.set(new Set());
  }
}
