import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth';
import { doc, getDoc, getFirestore, runTransaction, setDoc } from 'firebase/firestore';
import { isMapId, type MapId } from './maps';
import { mergeCareer, normalizeCareer, type Career } from './progression';
import { validateFeedback, type FeedbackPayload } from './feedback';
import { mergeCloudSaves, recordScore, saveTime } from './cloud-merge';

export type CloudAccount = {
  uid: string;
  name: string;
  email: string;
  username: string;
  usernameKey: string;
  bestWave: number;
  mapSaves: Partial<Record<MapId, unknown>>;
  mapRecords: Partial<Record<MapId, number>>;
  updatesOptIn: boolean;
  save: unknown;
  career: Career;
};

type CloudState = { available: boolean; account: CloudAccount | null; error: string };

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const available = Object.values(config).every(value => typeof value === 'string' && value.length > 0);
const app = available ? initializeApp(config) : null;
const auth = app ? getAuth(app) : null;
const db = app ? getFirestore(app) : null;
let currentUser: User | null = null;
const pendingSaves = new Map<MapId, unknown>();
let pendingSaveUid: string | null = null;
let syncTimer: ReturnType<typeof setTimeout> | null = null;
let lastSyncAt = 0;
let onState: ((state: CloudState) => void) | null = null;
let currentAccount: CloudAccount | null = null;
let pendingCareer: { uid: string; career: Career } | null = null;
const peekCareer = (): { uid: string; career: Career } | null => pendingCareer;
let careerTimer: ReturnType<typeof setTimeout> | null = null;
let saveRetry: ReturnType<typeof setTimeout> | null = null;
let retryDelay = 30000;
let savesInFlight = false, careerInFlight = false;

function errorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : 'Could not connect to cloud save.';
  return /offline|network|unavailable|reach.*backend/i.test(message)
    ? 'Cloud connection unavailable. Your progress is saved on this device; reconnect to sync.' : message;
}

export const USERNAME_HINT = '3–16 characters: letters, numbers and _; start with a letter.';

function report(account: CloudAccount | null, error = ''): void {
  if (account || !error) currentAccount = account;
  if (account) try { localStorage.setItem('bastion_identity:' + account.uid, JSON.stringify({ username: account.username, usernameKey: account.usernameKey })); } catch { /* Optional offline identity cache. */ }
  onState?.({ available, account, error });
}

export function observeCloud(callback: (state: CloudState) => void): void {
  onState = callback;
  if (!auth || !db) {
    report(null, 'Cloud sign-in is not configured yet.');
    return;
  }
  onAuthStateChanged(auth, async user => {
    if (pendingSaveUid && pendingSaveUid !== user?.uid) {
      pendingSaves.clear();
      pendingSaveUid = null;
      if (syncTimer) clearTimeout(syncTimer);
      syncTimer = null;
    }
    currentUser = user;
    if (pendingCareer?.uid !== user?.uid) pendingCareer = null;
    if (!user) {
      report(null);
      return;
    }
    try {
      const playerRef = doc(db, 'players', user.uid);
      const snapshot = await getDoc(playerRef);
      const existing = snapshot.exists() ? snapshot.data() : null;
      if (!existing) {
        await setDoc(playerRef, {
          email: user.email ?? '', name: user.displayName ?? '', updatesOptIn: false,
          createdAt: Date.now(), save: null, bestWave: 0,
        });
      } else if (existing.email !== (user.email ?? '') || existing.name !== (user.displayName ?? '')) {
        await setDoc(playerRef, { email: user.email ?? '', name: user.displayName ?? '' }, { merge: true });
      }
      if (currentUser?.uid !== user.uid) return;
      report({
        uid: user.uid, name: user.displayName ?? '', email: user.email ?? '',
        username: typeof existing?.username === 'string' ? existing.username : '',
        usernameKey: typeof existing?.usernameKey === 'string' ? existing.usernameKey : '',
        bestWave: Math.max(recordScore(existing?.bestWave), recordScore(existing?.save?.bestWave)),
        mapSaves: existing?.mapSaves ?? {}, mapRecords: existing?.mapRecords ?? {},
        updatesOptIn: existing?.updatesOptIn === true, save: existing?.save ?? null,
        career: normalizeCareer(existing?.career),
      });
    } catch (error) {
      if (currentUser?.uid !== user.uid) return;
      let identity: { username?: string; usernameKey?: string } = {};
      try { identity = JSON.parse(localStorage.getItem('bastion_identity:' + user.uid) || '{}'); } catch { /* No cached ID. */ }
      report(currentAccount?.uid === user.uid ? currentAccount : {
        uid: user.uid, name: user.displayName || '', email: user.email || '', username: identity.username || '', usernameKey: identity.usernameKey || '',
        bestWave: 0, mapSaves: {}, mapRecords: {}, updatesOptIn: false, save: null, career: normalizeCareer(null),
      }, errorMessage(error));
    }
  });
}

export async function setPlayerUsername(input: string): Promise<CloudAccount> {
  if (!db || !currentUser || !currentAccount) throw new Error('Sign in before choosing a player ID.');
  const username = input.trim();
  if (!/^[A-Za-z][A-Za-z0-9_]{2,15}$/.test(username)) throw new Error(USERNAME_HINT);
  const usernameKey = username.toLowerCase();
  const uid = currentUser.uid;
  const playerRef = doc(db, 'players', uid);
  const usernameRef = doc(db, 'usernames', usernameKey);
  const bestWave = await runTransaction(db, async transaction => {
    const player = await transaction.get(playerRef);
    const reservation = await transaction.get(usernameRef);
    const previousKey = typeof player.data()?.usernameKey === 'string' ? player.data()!.usernameKey as string : '';
    const previousRef = previousKey && previousKey !== usernameKey ? doc(db, 'usernames', previousKey) : null;
    const previousReservation = previousRef ? await transaction.get(previousRef) : null;
    if (reservation.exists() && reservation.data().uid !== uid) throw new Error('This player ID is already taken.');
    const bestWave = Math.max(recordScore(player.data()?.bestWave), recordScore(player.data()?.save?.bestWave));
    transaction.set(playerRef, { username, usernameKey, bestWave }, { merge: true });
    if (!reservation.exists()) transaction.set(usernameRef, { uid, username, createdAt: Date.now() });
    else if (reservation.data().username !== username) transaction.update(usernameRef, { username });
    if (previousRef && previousReservation?.exists() && previousReservation.data().uid === uid) transaction.delete(previousRef);
    return bestWave;
  });
  if (currentUser?.uid !== uid) throw new Error('Account changed while saving your player ID.');
  const account = { ...currentAccount, username, usernameKey, bestWave };
  report(account);
  return account;
}

export async function logInWithGoogle(): Promise<void> {
  if (!auth) throw new Error('Google sign-in is not configured yet.');
  await signInWithPopup(auth, new GoogleAuthProvider());
}

export async function logOutOfGoogle(): Promise<void> {
  if (!auth) return;
  await Promise.race([Promise.allSettled([flushCloudSave(), flushCareer()]), new Promise(resolve => setTimeout(resolve, 2000))]);
  await signOut(auth);
}

export async function setUpdateEmails(enabled: boolean): Promise<void> {
  if (!db || !currentUser) throw new Error('Sign in before changing email preferences.');
  await setDoc(doc(db, 'players', currentUser.uid), {
    updatesOptIn: enabled, consentChangedAt: Date.now(),
  }, { merge: true });
}

export function queueCloudSave(save: unknown): void {
  if (!currentUser || !db) return;
  const mapId=(save as { mapId?: unknown })?.mapId ?? 'orchid';
  if (!isMapId(mapId)) return;
  pendingSaves.set(mapId, save);
  pendingSaveUid = currentUser.uid;
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(() => { void flushCloudSave(); }, Math.max(1500, 15000 - (Date.now() - lastSyncAt)));
}

export async function flushCloudSave(): Promise<void> {
  if (!db || !currentUser || savesInFlight || !pendingSaves.size || pendingSaveUid !== currentUser.uid) return;
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = null;
  const saves = new Map(pendingSaves);
  const uid = currentUser.uid;
  pendingSaves.clear();
  pendingSaveUid = null;
  savesInFlight = true;
  try {
    const records=await runTransaction(db, async transaction => {
      const playerRef=doc(db!, 'players',uid), player=await transaction.get(playerRef);
      const merged = mergeCloudSaves(player.data() || {}, saves);
      transaction.set(playerRef,{...merged,saveUpdatedAt:Date.now(),recordUpdatedAt:Date.now()},{merge:true});
      return merged;
    });
    if(currentAccount?.uid===uid){
      Object.assign(currentAccount,records);
    }
    lastSyncAt = Date.now();
    retryDelay = 30000;
  } catch (error) {
    if (currentUser?.uid === uid) {
      for(const [mapId,save] of saves)if(!pendingSaves.has(mapId)||saveTime(save)>saveTime(pendingSaves.get(mapId)))pendingSaves.set(mapId,save);
      pendingSaveUid = uid;
    }
    console.warn('Cloud save failed; local save is safe.', error);
    if (!saveRetry && currentUser?.uid === uid) saveRetry = setTimeout(() => {
      saveRetry = null; void flushCloudSave();
    }, retryDelay);
    retryDelay = Math.min(120000, retryDelay * 2);
  } finally {
    savesInFlight = false;
    if (pendingSaves.size && !syncTimer && !saveRetry) syncTimer = setTimeout(() => { syncTimer = null; void flushCloudSave(); }, 15000);
  }
}

export function queueCareer(career: Career): void {
  if (!db || !currentUser) return;
  pendingCareer = { uid: currentUser.uid, career: mergeCareer(pendingCareer?.uid === currentUser.uid ? pendingCareer.career : null, career) };
  if (!careerTimer) careerTimer = setTimeout(() => { careerTimer = null; void flushCareer(); }, 15000);
}
export async function flushCareer(): Promise<void> {
  if (!db || !currentUser || careerInFlight || !pendingCareer || pendingCareer.uid !== currentUser.uid) return;
  if (careerTimer) clearTimeout(careerTimer); careerTimer = null;
  const pending = pendingCareer; pendingCareer = null;
  careerInFlight = true;
  try {
    const merged = await runTransaction(db, async tx => {
      const ref = doc(db!, 'players', pending.uid), player = await tx.get(ref);
      const career = mergeCareer(player.data()?.career, pending.career);
      tx.set(ref, { career }, { merge: true }); return career;
    });
    if (currentAccount?.uid === pending.uid) currentAccount.career = merged;
  } catch (error) {
    if (currentUser?.uid === pending.uid) pendingCareer = { uid: pending.uid, career: mergeCareer(pending.career, peekCareer()?.career) };
    console.warn('Career sync paused; local achievements are safe.', error);
  } finally {
    careerInFlight = false;
    if (pendingCareer && !careerTimer) careerTimer = setTimeout(() => { careerTimer = null; void flushCareer(); }, 30000);
  }
}
/** Store feedback in the player's private document covered by the existing owner-only rules.
 * The project owner reads it in Firebase Console → Firestore → players → uid → feedback.
 * Reusing the draft ID makes retrying an interrupted submission safe. */
export async function submitFeedback(input: FeedbackPayload): Promise<void> {
  if (!db || !currentUser) throw new Error('Sign in with Google to send feedback. Your draft stays on this device.');
  const uid = currentUser.uid, payload = validateFeedback(input);
  try {
    await runTransaction(db, async tx => {
      const ref = doc(db!, 'players', uid), snapshot = await tx.get(ref);
      const feedback = snapshot.data()?.feedback ?? {};
      if (feedback[payload.id]) return;
      if (Object.keys(feedback).length >= 50) throw new Error('Your feedback inbox is full. Please contact the game owner.');
      tx.set(ref, { feedback: { [payload.id]: payload } }, { merge: true });
    });
  } catch (error) { throw new Error(errorMessage(error)); }
}
window.addEventListener('online', () => { void flushCloudSave(); void flushCareer(); });
document.addEventListener('visibilitychange', () => { void flushCloudSave(); void flushCareer(); });
window.addEventListener('pagehide', () => { void flushCloudSave(); void flushCareer(); });

