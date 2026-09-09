import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  writeBatch,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import {
  Booking,
  ShopSettings,
  CustomerLoyalty,
  TransactionItem,
  Barber,
} from '../types';

// Helper to remove undefined values since Firestore rejects undefined fields
export function cleanForFirestore<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}

// -------------------------------------------------------------
// Bookings Sync
// -------------------------------------------------------------
export function subscribeToBookings(
  onData: (bookings: Booking[]) => void,
  onError?: (err: unknown) => void
): () => void {
  const collectionPath = 'bookings';
  try {
    const colRef = collection(db, collectionPath);
    return onSnapshot(
      colRef,
      (snapshot) => {
        if (!snapshot.empty) {
          const list: Booking[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as Booking;
            list.push({ ...data, id: docSnap.id });
          });
          // Sort by booking date and time slot descending
          list.sort((a, b) => (b.bookingDate + (b.bookingTimeSlot || '')).localeCompare(a.bookingDate + (a.bookingTimeSlot || '')));
          onData(list);
        } else {
          onData([]);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, collectionPath);
        if (onError) onError(error);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, collectionPath);
    if (onError) onError(error);
    return () => {};
  }
}

export async function saveBookingToFirestore(booking: Booking): Promise<void> {
  const path = `bookings/${booking.id}`;
  try {
    const docRef = doc(db, 'bookings', booking.id);
    await setDoc(docRef, cleanForFirestore(booking), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

export async function deleteBookingFromFirestore(bookingId: string): Promise<void> {
  const path = `bookings/${bookingId}`;
  try {
    const docRef = doc(db, 'bookings', bookingId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

export async function seedInitialBookings(initialBookings: Booking[]): Promise<void> {
  try {
    const colRef = collection(db, 'bookings');
    const existing = await getDocs(colRef);
    if (existing.empty && initialBookings.length > 0) {
      const batch = writeBatch(db);
      for (const b of initialBookings) {
        const docRef = doc(db, 'bookings', b.id);
        batch.set(docRef, cleanForFirestore(b));
      }
      await batch.commit();
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'bookings/seed');
  }
}

// -------------------------------------------------------------
// Shop Settings Sync
// -------------------------------------------------------------
export function subscribeToShopSettings(
  onData: (settings: ShopSettings) => void,
  onError?: (err: unknown) => void
): () => void {
  const path = 'settings/shop_settings';
  try {
    const docRef = doc(db, 'settings', 'shop_settings');
    return onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          onData(snapshot.data() as ShopSettings);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, path);
        if (onError) onError(error);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    if (onError) onError(error);
    return () => {};
  }
}

export async function saveShopSettingsToFirestore(settings: ShopSettings): Promise<void> {
  const path = 'settings/shop_settings';
  try {
    const docRef = doc(db, 'settings', 'shop_settings');
    await setDoc(docRef, cleanForFirestore(settings), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

// -------------------------------------------------------------
// Loyalty Points Sync (สะสมแต้ม)
// -------------------------------------------------------------
export function subscribeToLoyaltyRecords(
  onData: (records: Record<string, CustomerLoyalty>) => void,
  onError?: (err: unknown) => void
): () => void {
  const collectionPath = 'loyalty';
  try {
    const colRef = collection(db, collectionPath);
    return onSnapshot(
      colRef,
      (snapshot) => {
        if (!snapshot.empty) {
          const map: Record<string, CustomerLoyalty> = {};
          snapshot.forEach((docSnap) => {
            map[docSnap.id] = docSnap.data() as CustomerLoyalty;
          });
          onData(map);
        } else {
          onData({});
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, collectionPath);
        if (onError) onError(error);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, collectionPath);
    if (onError) onError(error);
    return () => {};
  }
}

export async function saveLoyaltyRecordToFirestore(
  phone: string,
  record: CustomerLoyalty
): Promise<void> {
  const safePhoneKey = phone.replace(/[^0-9]/g, '');
  const path = `loyalty/${safePhoneKey}`;
  try {
    const docRef = doc(db, 'loyalty', safePhoneKey);
    await setDoc(docRef, cleanForFirestore(record), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

export async function seedInitialLoyalty(
  initialRecords: Record<string, CustomerLoyalty>
): Promise<void> {
  try {
    const colRef = collection(db, 'loyalty');
    const existing = await getDocs(colRef);
    if (existing.empty && Object.keys(initialRecords).length > 0) {
      const batch = writeBatch(db);
      for (const [key, item] of Object.entries(initialRecords)) {
        const safeKey = key.replace(/[^0-9]/g, '') || key;
        const docRef = doc(db, 'loyalty', safeKey);
        batch.set(docRef, cleanForFirestore(item));
      }
      await batch.commit();
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'loyalty/seed');
  }
}

// -------------------------------------------------------------
// Transactions Sync (รายรับ - รายจ่าย)
// -------------------------------------------------------------
export function subscribeToTransactions(
  onData: (txs: TransactionItem[]) => void,
  onError?: (err: unknown) => void
): () => void {
  const collectionPath = 'transactions';
  try {
    const colRef = collection(db, collectionPath);
    return onSnapshot(
      colRef,
      (snapshot) => {
        if (!snapshot.empty) {
          const list: TransactionItem[] = [];
          snapshot.forEach((docSnap) => {
            list.push(docSnap.data() as TransactionItem);
          });
          list.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
          onData(list);
        } else {
          onData([]);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, collectionPath);
        if (onError) onError(error);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, collectionPath);
    if (onError) onError(error);
    return () => {};
  }
}

export async function saveTransactionToFirestore(tx: TransactionItem): Promise<void> {
  const path = `transactions/${tx.id}`;
  try {
    const docRef = doc(db, 'transactions', tx.id);
    await setDoc(docRef, cleanForFirestore(tx), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

export async function deleteTransactionFromFirestore(txId: string): Promise<void> {
  const path = `transactions/${txId}`;
  try {
    const docRef = doc(db, 'transactions', txId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

export async function seedInitialTransactions(
  initialTransactions: TransactionItem[]
): Promise<void> {
  try {
    const colRef = collection(db, 'transactions');
    const existing = await getDocs(colRef);
    if (existing.empty && initialTransactions.length > 0) {
      const batch = writeBatch(db);
      for (const tx of initialTransactions) {
        const docRef = doc(db, 'transactions', tx.id);
        batch.set(docRef, cleanForFirestore(tx));
      }
      await batch.commit();
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'transactions/seed');
  }
}

// -------------------------------------------------------------
// Barbers Sync (ช่างตัดผม)
// -------------------------------------------------------------
export function subscribeToBarbers(
  onData: (barbers: Barber[]) => void,
  onError?: (err: unknown) => void
): () => void {
  const collectionPath = 'barbers';
  try {
    const colRef = collection(db, collectionPath);
    return onSnapshot(
      colRef,
      (snapshot) => {
        if (!snapshot.empty) {
          const list: Barber[] = [];
          snapshot.forEach((docSnap) => {
            list.push(docSnap.data() as Barber);
          });
          onData(list);
        } else {
          onData([]);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, collectionPath);
        if (onError) onError(error);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, collectionPath);
    if (onError) onError(error);
    return () => {};
  }
}

export async function saveBarberToFirestore(barber: Barber): Promise<void> {
  const path = `barbers/${barber.id}`;
  try {
    const docRef = doc(db, 'barbers', barber.id);
    await setDoc(docRef, cleanForFirestore(barber), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

export async function seedInitialBarbers(initialBarbers: Barber[]): Promise<void> {
  try {
    const colRef = collection(db, 'barbers');
    const existing = await getDocs(colRef);
    if (existing.empty && initialBarbers.length > 0) {
      const batch = writeBatch(db);
      for (const b of initialBarbers) {
        const docRef = doc(db, 'barbers', b.id);
        batch.set(docRef, cleanForFirestore(b));
      }
      await batch.commit();
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'barbers/seed');
  }
}
