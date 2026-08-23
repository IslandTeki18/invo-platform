import { useAuth } from '@clerk/clerk-expo';
import { useMutation, useQuery } from 'convex/react';
import { useEffect, useRef } from 'react';
import { Alert } from 'react-native';

import { api } from '@repo/backend/convex/_generated/api';

export function useBootstrapUser() {
  const { isSignedIn } = useAuth();
  const user = useQuery(api.users.currentUser, isSignedIn ? {} : 'skip');
  const bootstrap = useMutation(api.users.bootstrap);
  const attempted = useRef(false);

  useEffect(() => {
    if (!isSignedIn) {
      attempted.current = false;
      return;
    }

    if (user === null && !attempted.current) {
      attempted.current = true;
      bootstrap().catch((error) => Alert.alert('Sign-in failed', error.message));
    }
  }, [bootstrap, isSignedIn, user]);

  return { isReady: !isSignedIn || !!user };
}
