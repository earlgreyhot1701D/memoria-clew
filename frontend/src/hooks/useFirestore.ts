import { useState, useCallback, useEffect } from 'react';
import { db } from '../firebase.config';
import {
    collection,
    getDocs,
    addDoc,
    onSnapshot,
} from 'firebase/firestore';

export function useFirestore(collectionName: string) {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetch = useCallback(async () => {
        try {
            setLoading(true);
            const snapshot = await getDocs(collection(db, collectionName));
            const items = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
            setData(items);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [collectionName]);

    const add = useCallback(
        async (item: any) => {
            try {
                const docRef = await addDoc(collection(db, collectionName), item);
                return docRef.id;
            } catch (err: any) {
                setError(err.message);
            }
        },
        [collectionName]
    );

    const subscribe = useCallback(
        (callback: (items: any[]) => void) => {
            return onSnapshot(collection(db, collectionName), (snapshot) => {
                const items = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
                callback(items);
            });
        },
        [collectionName]
    );

    useEffect(() => {
        setLoading(true);
        const unsubscribe = onSnapshot(
            collection(db, collectionName),
            (snapshot) => {
                const items = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
                setData(items);
                setLoading(false);
            },
            (err) => {
                console.error(err);
                setError(err.message);
                setLoading(false);
            }
        );
        return () => unsubscribe();
    }, [collectionName]);

    return { data, loading, error, fetch, add, subscribe };
}
