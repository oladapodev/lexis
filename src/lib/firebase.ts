import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

import { toast } from 'sonner';

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
  code: string;
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
  }
}

export interface HandleFirestoreErrorOptions {
  throwError?: boolean;
  suppressPermissionToast?: boolean;
}

function getFirestoreErrorCode(error: unknown): string {
  if (error && typeof error === "object") {
    const maybeCode = (error as { code?: unknown }).code;
    if (typeof maybeCode === "string") {
      return maybeCode.toLowerCase();
    }
  }
  return "";
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null,
  options: HandleFirestoreErrorOptions = {},
) {
  const err = error instanceof Error ? error.message : String(error);
  const code = getFirestoreErrorCode(error);
  const isPermissionDenied =
    code === "permission-denied" ||
    err.toLowerCase().includes("permission-denied");
  const errInfo: FirestoreErrorInfo = {
    error: err,
    code,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));

  // Determine user friendly message
  let message = "An error occurred with our database.";
  if (isPermissionDenied) {
    message = "You don't have permission to perform this action.";
  } else if (err.includes("not-found")) {
    message = "The requested item could not be found.";
  }

  const isPresencePermissionDenied =
    isPermissionDenied &&
    operationType === OperationType.LIST &&
    typeof path === "string" &&
    path.includes("/presences");

  if (!isPresencePermissionDenied || !options.suppressPermissionToast) {
    toast.error(message);
  }

  if (options.throwError || (!isPermissionDenied && code)) {
    throw new Error(JSON.stringify(errInfo));
  }
}

async function testConnection() {
  try {
    await getDocFromServer(doc(db, '_connection_test_', 'check'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('offline')) {
      console.error("Please check your Firebase configuration or internet connection.");
    }
  }
}

testConnection();
