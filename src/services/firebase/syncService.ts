import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from './firebaseConfig';
import { VerifiedSubscriptionState, SubscriptionProductId } from '../billing/billingTypes';

export const FirebaseSyncService = {
  /**
   * Syncs verified subscription state to the user's secure Firestore record
   */
  async syncSubscription(subscription: VerifiedSubscriptionState): Promise<void> {
    const user = auth.currentUser;
    if (!user) return;

    const path = `users/${user.uid}/subscription/current`;
    try {
      await setDoc(doc(db, 'users', user.uid, 'subscription', 'current'), {
        userId: user.uid,
        productId: subscription.productId,
        orderId: subscription.orderId,
        purchaseToken: subscription.purchaseToken,
        status: subscription.status,
        isVerified: subscription.isVerified,
        expiryTime: subscription.expiryTime,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  /**
   * Fetches the user's remote subscription record if present
   */
  async fetchRemoteSubscription(): Promise<VerifiedSubscriptionState | null> {
    const user = auth.currentUser;
    if (!user) return null;

    const path = `users/${user.uid}/subscription/current`;
    try {
      const snap = await getDoc(doc(db, 'users', user.uid, 'subscription', 'current'));
      if (snap.exists()) {
        const data = snap.data();
        return {
          productId: (data.productId as SubscriptionProductId) || null,
          orderId: data.orderId || null,
          purchaseToken: data.purchaseToken || null,
          purchaseTime: data.expiryTime ? data.expiryTime - 30 * 24 * 60 * 60 * 1000 : Date.now(),
          expiryTime: data.expiryTime || Date.now(),
          isAutoRenewing: data.status === 'ACTIVE',
          status: data.status,
          isVerified: Boolean(data.isVerified),
          lastVerifiedAt: Date.now(),
          signature: null,
        };
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
    }
  },
};
