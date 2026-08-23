import { isClerkAPIResponseError, useSSO } from '@clerk/clerk-expo';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { Alert, Platform, StyleSheet, View } from 'react-native';

import { FormButton } from '@/components/form';
import { Spacing } from '@/constants/theme';

WebBrowser.maybeCompleteAuthSession();

export function OAuthButtons() {
  const { startSSOFlow } = useSSO();
  const [loading, setLoading] = useState<'oauth_google' | 'oauth_apple' | null>(null);

  async function start(strategy: 'oauth_google' | 'oauth_apple') {
    setLoading(strategy);
    try {
      const { createdSessionId, setActive } = await startSSOFlow({
        strategy,
        redirectUrl: AuthSession.makeRedirectUri(),
      });
      if (createdSessionId) await setActive?.({ session: createdSessionId });
    } catch (error) {
      Alert.alert(
        'Sign-in failed',
        isClerkAPIResponseError(error) ? error.errors[0]?.longMessage : 'Please try again.',
      );
    } finally {
      setLoading(null);
    }
  }

  return (
    <View style={styles.container}>
      <FormButton
        label="Continue with Google"
        variant="secondary"
        onPress={() => start('oauth_google')}
        loading={loading === 'oauth_google'}
        disabled={loading !== null}
      />
      {Platform.OS === 'ios' ? (
        <FormButton
          label="Continue with Apple"
          variant="secondary"
          onPress={() => start('oauth_apple')}
          loading={loading === 'oauth_apple'}
          disabled={loading !== null}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({ container: { gap: Spacing.two } });
