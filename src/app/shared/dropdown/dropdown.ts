import { Component, ElementRef, inject, input, model, output, signal } from '@angular/core';

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

  protected toggle(): void {
    this.setOpen(!this.isOpen());
  }

  protected select(option: string): void {
    this.value.set(option);
    this.setOpen(false);
  }

  protected onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target as Node)) {
      this.setOpen(false);
    }
  }

  private setOpen(open: boolean): void {
    if (this.isOpen() && !open) {
      this.closed.emit();
    }
    this.isOpen.set(open);
  }
}
