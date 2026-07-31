import { useNavigation } from 'expo-router';
import { RefObject, useEffect } from 'react';
import { TextInput } from 'react-native';

/**
 * Automatically focuses a TextInput after the screen transition animation completes.
 * @param inputRef A ref to the TextInput to focus.
 * @param shouldFocus If false, the auto-focus logic is skipped. Defaults to true.
 */
export function useAutoFocus(inputRef: RefObject<TextInput | null>, shouldFocus: boolean = true) {
  const navigation = useNavigation();

  useEffect(() => {
    if (!shouldFocus) return;

    // @ts-ignore: transitionEnd is a valid event for Stack navigators but not typed by default in useNavigation
    const unsubscribe = navigation.addListener('transitionEnd', () => {
      inputRef.current?.focus();
    });

    return unsubscribe;
  }, [navigation, shouldFocus, inputRef]);
}
