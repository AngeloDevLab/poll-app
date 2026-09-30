import { Component, ElementRef, output, viewChild } from '@angular/core';

/**
 * Confirmation modal shown after a survey was published; emits `closed` when dismissed.
 */
@Component({
  selector: 'app-survey-published-dialog',
  templateUrl: './survey-published-dialog.html',
  styleUrl: './survey-published-dialog.scss',
})
export class SurveyPublishedDialog {
  readonly closed = output<void>();

  protected readonly dialogRef = viewChild.required<ElementRef<HTMLDialogElement>>('dialogRef');

  /**
   * Opens the dialog as a modal.
   */
  show(): void {
    this.dialogRef().nativeElement.showModal();
  }

  /**
   * Closes the dialog; `onDialogClosed` then notifies the parent.
   */
  protected close(): void {
    this.dialogRef().nativeElement.close();
  }

  /**
   * Notifies the parent after the dialog closed (button, Escape or backdrop).
   */
  protected onDialogClosed(): void {
    this.closed.emit();
  }
}
