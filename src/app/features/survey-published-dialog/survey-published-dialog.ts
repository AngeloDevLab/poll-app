import { Component, ElementRef, output, viewChild } from '@angular/core';

@Component({
  selector: 'app-survey-published-dialog',
  templateUrl: './survey-published-dialog.html',
  styleUrl: './survey-published-dialog.scss',
})
export class SurveyPublishedDialog {
  readonly closed = output<void>();

  protected readonly dialogRef = viewChild.required<ElementRef<HTMLDialogElement>>('dialogRef');

  show(): void {
    this.dialogRef().nativeElement.showModal();
  }

  protected close(): void {
    this.dialogRef().nativeElement.close();
  }

  protected onDialogClosed(): void {
    this.closed.emit();
  }
}
