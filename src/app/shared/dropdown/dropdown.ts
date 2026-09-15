import { Component, ElementRef, inject, input, model, signal } from '@angular/core';

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

  protected readonly isOpen = signal(false);

  protected toggle(): void {
    this.isOpen.update((open) => !open);
  }

  protected select(option: string): void {
    this.value.set(option);
    this.isOpen.set(false);
  }

  protected onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target as Node)) {
      this.isOpen.set(false);
    }
  }
}
