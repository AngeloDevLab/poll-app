import { Pipe, PipeTransform } from '@angular/core';

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const LOCALE = 'en-US';

/**
 * Returns midnight (local time) of the given date's day.
 * @param date - Any point in time on that day.
 * @returns The start of that day.
 */
function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/**
 * Counts calendar days from today until the deadline's day.
 * @param deadline - The future deadline.
 * @returns The number of days, 0 if it ends today.
 */
function daysUntil(deadline: Date): number {
  return Math.round((startOfDay(deadline).getTime() - startOfDay(new Date()).getTime()) / MS_PER_DAY);
}

/**
 * Formats a deadline for poll cards, e.g. "Ends in 3 Days", "Ends today" or "Ended Sep 12".
 */
@Pipe({ name: 'endsIn' })
export class EndsInPipe implements PipeTransform {
  /**
   * Formats the deadline relative to today.
   * @param deadline - The poll's deadline.
   * @returns The human-readable label.
   */
  transform(deadline: Date): string {
    if (deadline.getTime() < Date.now()) {
      return `Ended ${deadline.toLocaleDateString(LOCALE, { month: 'short', day: 'numeric' })}`;
    }
    const days = daysUntil(deadline);
    if (days === 0) {
      return 'Ends today';
    }
    return days === 1 ? 'Ends in 1 Day' : `Ends in ${days} Days`;
  }
}
