import { DOCUMENT } from '@angular/common';
import { Component, ElementRef, computed, inject, output, signal, viewChild } from '@angular/core';
import { POLL_CATEGORIES, PollCategory } from '../../core/models/poll.model';
import { NewPollInput, NewQuestionInput } from '../../core/polls.service';
import { Dropdown } from '../../shared/dropdown/dropdown';
import { LabeledInput } from '../../shared/labeled-input/labeled-input';

interface QuestionDraft {
  text: string;
  allowMultiple: boolean;
  options: string[];
}

function emptyQuestion(): QuestionDraft {
  return { text: '', allowMultiple: false, options: ['', ''] };
}

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

  protected readonly title = signal('');
  protected readonly description = signal('');
  protected readonly deadline = signal('');
  protected readonly category = signal('');
  protected readonly questions = signal<QuestionDraft[]>([emptyQuestion()]);
  protected readonly submitted = signal(false);

  protected readonly todayIso = new Date().toISOString().slice(0, 10);

  // Fields reveal their error as soon as they're blurred, not only on submit.
  private readonly touched = signal<Set<string>>(new Set());

  protected readonly titleError = computed(
    () => (this.touched().has('title') || this.submitted()) && !this.title().trim(),
  );
  protected readonly categoryError = computed(
    () => (this.touched().has('category') || this.submitted()) && !this.category(),
  );

  protected readonly formValid = computed(() => {
    if (!this.title().trim() || !this.category()) {
      return false;
    }
    return this.questions().every((q) => q.text.trim() && q.options.filter((o) => o.trim()).length >= 2);
  });

  show(): void {
    this.dialogRef().nativeElement.showModal();
    this.document.body.style.overflow = 'hidden';
  }

  protected close(): void {
    this.dialogRef().nativeElement.close();
  }

  protected onDialogClick(event: MouseEvent): void {
    if (event.target === this.dialogRef().nativeElement) {
      this.close();
    }
  }

  protected onDialogClosed(): void {
    this.document.body.style.overflow = '';
    this.resetForm();
  }

  protected optionLabel(index: number): string {
    return `${String.fromCharCode(65 + index)}.`;
  }

  protected markTouched(key: string): void {
    this.touched.update((keys) => new Set(keys).add(key));
  }

  protected questionError(question: QuestionDraft, questionIndex: number): boolean {
    return (
      (this.touched().has(`question-${questionIndex}`) || this.submitted()) && !question.text.trim()
    );
  }

  protected optionError(question: QuestionDraft, questionIndex: number, optionIndex: number): boolean {
    return (
      (this.touched().has(`option-${questionIndex}-${optionIndex}`) || this.submitted()) &&
      optionIndex < 2 &&
      !question.options[optionIndex].trim()
    );
  }

  protected updateQuestionText(index: number, text: string): void {
    this.questions.update((qs) => qs.map((q, i) => (i === index ? { ...q, text } : q)));
  }

  protected onAllowMultipleChange(index: number, event: Event): void {
    const allowMultiple = (event.target as HTMLInputElement).checked;
    this.questions.update((qs) => qs.map((q, i) => (i === index ? { ...q, allowMultiple } : q)));
  }

  protected updateOption(questionIndex: number, optionIndex: number, text: string): void {
    this.questions.update((qs) =>
      qs.map((q, i) =>
        i === questionIndex ? { ...q, options: q.options.map((o, j) => (j === optionIndex ? text : o)) } : q,
      ),
    );
  }

  protected addOption(questionIndex: number): void {
    this.questions.update((qs) =>
      qs.map((q, i) => (i === questionIndex ? { ...q, options: [...q.options, ''] } : q)),
    );
  }

  // The first two options are the default and can't be removed this way.
  protected removeOption(questionIndex: number, optionIndex: number): void {
    this.questions.update((qs) =>
      qs.map((q, i) =>
        i === questionIndex && q.options.length > 2
          ? { ...q, options: q.options.filter((_, oi) => oi !== optionIndex) }
          : q,
      ),
    );
  }

  protected addQuestion(): void {
    this.questions.update((qs) => [...qs, emptyQuestion()]);
  }

  // The first question is the default and can't be removed this way.
  protected removeQuestion(index: number): void {
    if (this.questions().length > 1) {
      this.questions.update((qs) => qs.filter((_, i) => i !== index));
    }
  }

  protected onSubmit(event: Event): void {
    event.preventDefault();
    this.submitted.set(true);
    if (!this.formValid()) {
      this.scrollToFirstError();
      return;
    }

    const questions: NewQuestionInput[] = this.questions().map((q) => ({
      text: q.text.trim(),
      allowMultiple: q.allowMultiple,
      optionTexts: q.options.map((o) => o.trim()).filter((o) => o.length > 0),
    }));

    this.created.emit({
      title: this.title().trim(),
      description: this.description().trim() || undefined,
      category: this.category() as PollCategory,
      deadline: this.deadline() ? this.toEndOfDay(this.deadline()) : undefined,
      questions,
    });
    this.close();
  }

  // Errors render on the next tick (they depend on the `submitted`/`touched`
  // signals just set above), so wait a frame before looking for the first one.
  private scrollToFirstError(): void {
    setTimeout(() => {
      const firstError = this.hostElement.nativeElement.querySelector('.labeled-input__error, .field__error');
      firstError?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  private toEndOfDay(dateIso: string): Date {
    const [year, month, day] = dateIso.split('-').map(Number);
    return new Date(year, month - 1, day, 23, 59, 59, 999);
  }

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
