const VOTER_ID_KEY = 'voter_id';

export function getVoterId(): string {
  let voterId = localStorage.getItem(VOTER_ID_KEY);
  if (!voterId) {
    voterId = crypto.randomUUID();
    localStorage.setItem(VOTER_ID_KEY, voterId);
  }
  return voterId;
}
