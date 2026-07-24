import { Minor, formatMinor } from '@/kernel/money';
import { StyleSheet, Text, View } from 'react-native';

interface AmountDisplayProps {
  amount: Minor;
}

const config = { symbol: '$', decimals: 2 };

export function AmountDisplay({ amount }: AmountDisplayProps) {
  const formatted = formatMinor(amount, config);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>AMOUNT</Text>
      <Text adjustsFontSizeToFit numberOfLines={1} style={styles.amount} testID="AmountDisplay">
        {formatted}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 154,
    paddingHorizontal: 24,
  },
  label: {
    color: '#8e8e93',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.1,
    marginBottom: 8,
  },
  amount: {
    color: '#ffffff',
    fontSize: 54,
    fontVariant: ['tabular-nums'],
    fontWeight: '700',
    letterSpacing: -2,
  },
});