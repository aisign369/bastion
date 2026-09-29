import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth';
import { doc, getDoc, getFirestore, runTransaction, setDoc } from 'firebase/firestore';

export type CloudAccount = {
  uid: string;
  name: string;
  email: string;
  username: string;
  usernameKey: string;
  bestWave: number;
  updatesOptIn: boolean;
  save: unknown;
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
let pendingSave: unknown = null;
let pendingSaveUid: string | null = null;
let syncTimer: ReturnType<typeof setTimeout> | null = null;
let lastSyncAt = 0;
let onState: ((state: CloudState) => void) | null = null;
let currentAccount: CloudAccount | null = null;

export const USERNAME_HINT = '3–16 characters: letters, numbers and _; start with a letter.';

function recordScore(value: unknown): number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 1000000 ? value : 0;
}

function report(account: CloudAccount | null, error = ''): void {
  if (!error) currentAccount = account;
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
      pendingSave = null;
      pendingSaveUid = null;
      if (syncTimer) clearTimeout(syncTimer);
      syncTimer = null;
    }
    currentUser = user;
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
        updatesOptIn: existing?.updatesOptIn === true, save: existing?.save ?? null,
      });
    } catch (error) {
      report(null, error instanceof Error ? error.message : 'Could not load your cloud save.');
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
  await flushCloudSave();
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
  pendingSave = save;
  pendingSaveUid = currentUser.uid;
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(() => { void flushCloudSave(); }, Math.max(1500, 15000 - (Date.now() - lastSyncAt)));
}

export async function flushCloudSave(): Promise<void> {
  if (!db || !currentUser || !pendingSave || pendingSaveUid !== currentUser.uid) return;
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = null;
  const save = pendingSave;
  const uid = currentUser.uid;
  pendingSave = null;
  pendingSaveUid = null;
  try {
    await setDoc(doc(db, 'players', uid), { save, saveUpdatedAt: Date.now() }, { merge: true });
    const score = recordScore((save as { bestWave?: unknown }).bestWave);
    if (score > (currentAccount?.uid === uid ? currentAccount.bestWave : 0)) {
      await runTransaction(db, async transaction => {
        const playerRef = doc(db, 'players', uid);
        const player = await transaction.get(playerRef);
        if (score > recordScore(player.data()?.bestWave)) transaction.set(playerRef, { bestWave: score, recordUpdatedAt: Date.now() }, { merge: true });
      });
      if (currentAccount?.uid === uid) currentAccount.bestWave = score;
    }
    lastSyncAt = Date.now();
  } catch (error) {
    if (currentUser?.uid === uid && !pendingSave) {
      pendingSave = save;
      pendingSaveUid = uid;
    }
    console.warn('Cloud save failed; local save is safe.', error);
  }
}

