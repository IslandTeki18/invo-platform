import { isClerkAPIResponseError, useSignUp } from '@clerk/clerk-expo';
import { Link } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet } from 'react-native';

import { OAuthButtons } from '@/components/auth/oauth-buttons';
import { FormButton, FormField } from '@/components/form';
import { ThemedText } from '@/components/primitives/themed-text';
import { ThemedView } from '@/components/primitives/themed-view';
import { Spacing } from '@/constants/theme';

export default function SignUpScreen() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSignUp() {
    if (!isLoaded) return;

    setSubmitting(true);
    try {
      await signUp.create({ emailAddress: email.trim(), password });
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setVerifying(true);
    } catch (error) {
      showError(error);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVerification() {
    if (!isLoaded) return;

    setSubmitting(true);
    try {
      const result = await signUp.attemptEmailAddressVerification({ code });
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
      }
    } catch (error) {
      showError(error);
    } finally {
      setSubmitting(false);
    }
  }

  function showError(error: unknown) {
    Alert.alert(
      'Sign-up failed',
      isClerkAPIResponseError(error) ? error.errors[0]?.longMessage : 'Please try again.',
    );
  }

  return (
    <ThemedView style={styles.root}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <ThemedText type="subtitle">{verifying ? 'Check your email' : 'Create account'}</ThemedText>
        {verifying ? (
          <>
            <FormField label="Verification code" value={code} onChangeText={setCode} />
            <FormButton label="Verify email" onPress={handleVerification} loading={submitting} />
          </>
        ) : (
          <>
            <FormField
              label="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
            />
            <FormField
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
            <FormButton label="Create account" onPress={handleSignUp} loading={submitting} />
            <OAuthButtons />
            <Link href="/(auth)/sign-in" asChild>
              <Pressable>
                <ThemedText type="linkPrimary">Already have an account?</ThemedText>
              </Pressable>
            </Link>
          </>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
    gap: Spacing.three,
  },
});
