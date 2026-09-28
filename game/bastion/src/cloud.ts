import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth';
import { doc, getDoc, getFirestore, setDoc } from 'firebase/firestore';

export type CloudAccount = {
  uid: string;
  name: string;
  email: string;
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
let syncTimer: ReturnType<typeof setTimeout> | null = null;
let lastSyncAt = 0;
let onState: ((state: CloudState) => void) | null = null;

function report(account: CloudAccount | null, error = ''): void {
  onState?.({ available, account, error });
}

export function observeCloud(callback: (state: CloudState) => void): void {
  onState = callback;
  if (!auth || !db) {
    report(null, 'Cloud sign-in is not configured yet.');
    return;
  }
  onAuthStateChanged(auth, async user => {
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
          createdAt: Date.now(), save: null,
        });
      } else if (existing.email !== (user.email ?? '') || existing.name !== (user.displayName ?? '')) {
        await setDoc(playerRef, { email: user.email ?? '', name: user.displayName ?? '' }, { merge: true });
      }
      if (currentUser?.uid !== user.uid) return;
      report({
        uid: user.uid, name: user.displayName ?? '', email: user.email ?? '',
        updatesOptIn: existing?.updatesOptIn === true, save: existing?.save ?? null,
      });
    } catch (error) {
      report(null, error instanceof Error ? error.message : 'Could not load your cloud save.');
    }
  });
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
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(() => { void flushCloudSave(); }, Math.max(1500, 15000 - (Date.now() - lastSyncAt)));
}

export async function flushCloudSave(): Promise<void> {
  if (!db || !currentUser || !pendingSave) return;
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = null;
  const save = pendingSave;
  pendingSave = null;
  try {
    await setDoc(doc(db, 'players', currentUser.uid), { save, saveUpdatedAt: Date.now() }, { merge: true });
    lastSyncAt = Date.now();
  } catch (error) {
    pendingSave = save;
    console.warn('Cloud save failed; local save is safe.', error);
  }
}

