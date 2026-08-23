import { isClerkAPIResponseError, useSignIn } from '@clerk/clerk-expo';
import { Link } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet } from 'react-native';

import { OAuthButtons } from '@/components/auth/oauth-buttons';
import { FormButton, FormField } from '@/components/form';
import { ThemedText } from '@/components/primitives/themed-text';
import { ThemedView } from '@/components/primitives/themed-view';
import { Spacing } from '@/constants/theme';

export default function SignInScreen() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSignIn() {
    if (!isLoaded) return;

    setSubmitting(true);
    try {
      const result = await signIn.create({ identifier: email.trim(), password });
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
      }
    } catch (error) {
      Alert.alert(
        'Sign-in failed',
        isClerkAPIResponseError(error) ? error.errors[0]?.longMessage : 'Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ThemedView style={styles.root}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <ThemedText type="subtitle">Sign in</ThemedText>
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
        <FormButton label="Sign in" onPress={handleSignIn} loading={submitting} />
        <OAuthButtons />
        <Link href="/(auth)/sign-up" asChild>
          <Pressable>
            <ThemedText type="linkPrimary">Create an account</ThemedText>
          </Pressable>
        </Link>
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
