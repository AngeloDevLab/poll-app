import { Poll } from '../../core/models/poll.model';

/**
 * Checks whether a poll's deadline has passed. Polls without a deadline never close.
 * @param poll - The poll to check.
 * @returns `true` if the deadline lies in the past.
 */
export function isPollClosed(poll: Poll): boolean {
  return !!poll.deadline && poll.deadline.getTime() < Date.now();
}
