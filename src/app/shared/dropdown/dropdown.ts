import { Component, ElementRef, inject, input, model, output, signal } from '@angular/core';

/**
 * Custom select: a toggle button with a list of options; closes on pick or outside click.
 */
@Component({
  selector: 'app-dropdown',
  templateUrl: './dropdown.html',
  styleUrl: './dropdown.scss',
  host: {
    '(document:click)': 'onDocumentClick($event)',
  },
})
export class Dropdown {
  private readonly elementRef: ElementRef<HTMLElement> = inject(ElementRef);

  readonly label = input('Sort by categories');
  readonly options = input.required<string[]>();
  readonly value = model.required<string>();

  // Fires whenever the dropdown goes from open to closed, whether by picking
  // an option, toggling it shut, or clicking outside - lets a parent treat it
  // like a field blur for validation.
  readonly closed = output<void>();

  protected readonly isOpen = signal(false);

  /**
   * Opens the list if it's closed, closes it if it's open.
   */
  protected toggle(): void {
    this.setOpen(!this.isOpen());
  }

  /**
   * Picks an option and closes the list.
   * @param option - The chosen option.
   */
  protected select(option: string): void {
    this.value.set(option);
    this.setOpen(false);
  }

  /**
   * Closes the list when a click lands outside the dropdown.
   * @param event - Any click on the document.
   */
  protected onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target as Node)) {
      this.setOpen(false);
    }
  }

  /**
   * Opens or closes the list and emits `closed` on every open → closed transition.
   * @param open - The desired state.
   */
  private setOpen(open: boolean): void {
    if (this.isOpen() && !open) {
      this.closed.emit();
    }
    this.isOpen.set(open);
  }
}
