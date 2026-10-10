export type FeedbackKind = 'bug' | 'balance' | 'idea';
export interface FeedbackPayload { id: string; kind: FeedbackKind; message: string; rating: number; createdAt: number; version: string; map: string; wave: number; username: string; diagnostics?: { width: number; height: number; quality: string; fps: number; touch: boolean } }
export function validateFeedback(value: FeedbackPayload): FeedbackPayload {
  const message = value.message.trim();
  if (message.length < 10 || message.length > 1500) throw new Error('Write 10–1500 characters.');
  if (!['bug', 'balance', 'idea'].includes(value.kind)) throw new Error('Choose a feedback category.');
  if (!Number.isInteger(value.rating) || value.rating < 1 || value.rating > 5) throw new Error('Choose a rating from 1 to 5.');
  if (!/^[A-Za-z0-9_-]{10,80}$/.test(value.id)) throw new Error('Invalid feedback ID.');
  return { ...value, message };
}
export const feedbackDraftKey = (owner: string) => 'bastion_feedback_draft:' + owner;
