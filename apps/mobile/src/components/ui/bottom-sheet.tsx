import { type ReactNode } from 'react';
import {
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Spacing } from '@/constants/theme';
import { ThemedText } from '@/components/primitives/themed-text';
import { ThemedView } from '@/components/primitives/themed-view';

export type BottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
};

const WINDOW_HEIGHT = Dimensions.get('window').height;

export function BottomSheet({ visible, onClose, title, children }: BottomSheetProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      transparent
      animationType="slide"
      visible={visible}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable onPress={() => undefined}>
          <ThemedView
            style={[
              styles.panel,
              {
                maxHeight: WINDOW_HEIGHT * 0.8,
                paddingBottom: insets.bottom + Spacing.three,
              },
            ]}
          >
            <View style={styles.handleContainer}>
              <View style={styles.handle} />
            </View>

            {title !== undefined && (
              <ThemedText
                type="subtitle"
                style={styles.title}
              >
                {title}
              </ThemedText>
            )}

            {children}
          </ThemedView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  panel: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
  },
  handleContainer: {
    alignItems: 'center',
    paddingTop: Spacing.two,
    paddingBottom: Spacing.one,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(128,128,128,0.4)',
  },
  title: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.three,
  },
});
