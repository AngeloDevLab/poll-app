import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'endsIn' })
export class EndsInPipe implements PipeTransform {
  transform(deadline: Date): string {
    const now = new Date();
    if (deadline.getTime() < now.getTime()) {
      return `Ended ${deadline.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    }

    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfDeadlineDay = new Date(deadline.getFullYear(), deadline.getMonth(), deadline.getDate());
    const days = Math.round((startOfDeadlineDay.getTime() - startOfToday.getTime()) / (24 * 60 * 60 * 1000));

    if (days === 0) {
      return 'Ends today';
    }
    if (days === 1) {
      return 'Ends in 1 Day';
    }
    return `Ends in ${days} Days`;
  }
}
