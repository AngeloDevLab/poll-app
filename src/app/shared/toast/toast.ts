import { Component, inject } from '@angular/core';
import { ToastService } from '../../core/toast.service';

/**
 * Displays the current message of the `ToastService`, if any.
 */
@Component({
  selector: 'app-toast',
  templateUrl: './toast.html',
  styleUrl: './toast.scss',
})
export class Toast {
  protected readonly toastService = inject(ToastService);
}
