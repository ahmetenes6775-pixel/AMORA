import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  User,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  getDocFromServer,
  getFirestore,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { EndingKind } from './data/gameData';
import { mergeEndings, normalizeEndings } from './utils/endingStorage';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
void testConnection();

export async function signInWithGoogle(): Promise<User | null> {
  const provider = new GoogleAuthProvider();
  const res = await signInWithPopup(auth, provider);
  return res.user;
}

export async function signOutUser(): Promise<void> {
  await signOut(auth);
}

export async function loadAndMergeCloudEndings(
  uid: string,
  localEndings: EndingKind[],
  playerName: string
): Promise<EndingKind[]> {
  const path = `userProgress/${uid}`;
  const ref = doc(db, 'userProgress', uid);
  let cloudEndings: EndingKind[] = [];
  let hasDoc = false;

  try {
    const snap = await getDoc(ref);
    if (snap.exists()) {
      hasDoc = true;
      const data = snap.data() as { unlockedEndings?: unknown };
      cloudEndings = normalizeEndings(data.unlockedEndings);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }

  const merged = mergeEndings(localEndings, cloudEndings);
  const safeName = (playerName.trim() || 'AMORA').slice(0, 24);

  if (!hasDoc || merged.length > cloudEndings.length) {
    try {
      await setDoc(ref, {
        uid,
        playerName: safeName,
        unlockedEndings: merged,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, hasDoc ? OperationType.UPDATE : OperationType.CREATE, path);
    }
  }

  return merged;
}

export async function saveCloudEndings(
  uid: string,
  endings: EndingKind[],
  playerName: string
): Promise<void> {
  const path = `userProgress/${uid}`;
  const ref = doc(db, 'userProgress', uid);
  const normalized = normalizeEndings(endings);
  const safeName = (playerName.trim() || 'AMORA').slice(0, 24);
  try {
    await setDoc(ref, {
      uid,
      playerName: safeName,
      unlockedEndings: normalized,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}
