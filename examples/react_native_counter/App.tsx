import { useReducer } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { canReset, counterReducer } from './counter';

export default function App() {
  const [count, dispatch] = useReducer(counterReducer, 0);
  const resetEnabled = canReset(count);
  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Text style={styles.eyebrow}>OPENMERCATOCLOUD.COM</Text>
        <Text accessibilityRole="header" style={styles.title}>Small taps.{'\n'}Real native UI.</Text>
        <Text style={styles.subtitle}>React Native × agent-device</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.caption}>YOUR COUNTER</Text>
        <Text testID="counter-value" accessibilityLabel={`Count: ${count}`} accessibilityLiveRegion="polite" style={styles.count}>{count}</Text>
        <Text style={styles.hint}>Every tap is a state we can verify.</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Increment" onPress={() => dispatch('increment')} style={({ pressed }) => [styles.increment, pressed && styles.pressed]}>
          <Text style={styles.incrementText}>+  Increment</Text>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Reset counter" accessibilityState={{ disabled: !resetEnabled }} disabled={!resetEnabled} onPress={() => dispatch('reset')} style={({ pressed }) => [styles.reset, !resetEnabled && styles.disabled, pressed && styles.pressed]}>
          <Text style={styles.resetText}>Reset counter</Text>
        </Pressable>
      </View>
      <View style={styles.footer}>
        <Text style={styles.badge}>ANDROID DEMO</Text>
        <Text style={styles.footerText}>Tap · Inspect · Capture</Text>
        <Text style={styles.note}>Native screenshots, saved as PR evidence.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flexGrow: 1, backgroundColor: '#101c2e', padding: 24, paddingTop: 56, paddingBottom: 40, gap: 28 },
  header: { gap: 12 },
  eyebrow: { color: '#9ee9ce', fontSize: 11, fontWeight: '700', letterSpacing: 1.5 },
  title: { color: '#f6f8fb', fontSize: 34, fontWeight: '700', lineHeight: 39 },
  subtitle: { color: '#b6c4d5', fontSize: 15 },
  card: { backgroundColor: '#f6f8fb', borderRadius: 24, padding: 24, alignItems: 'center', gap: 12 },
  caption: { color: '#536174', fontSize: 11, fontWeight: '700', letterSpacing: 2 },
  count: { color: '#101c2e', fontSize: 76, fontWeight: '700', fontVariant: ['tabular-nums'] },
  hint: { color: '#536174', fontSize: 13, textAlign: 'center', marginBottom: 12 },
  increment: { width: '100%', minHeight: 52, backgroundColor: '#17624d', borderRadius: 14, alignItems: 'center', justifyContent: 'center', padding: 12 },
  incrementText: { color: '#ffffff', fontWeight: '700', fontSize: 17 },
  reset: { width: '100%', minHeight: 48, borderWidth: 1, borderColor: '#9ca9b9', borderRadius: 14, alignItems: 'center', justifyContent: 'center', padding: 12 },
  resetText: { color: '#25384e', fontWeight: '600', fontSize: 15 },
  disabled: { opacity: 0.4 },
  pressed: { opacity: 0.75 },
  footer: { gap: 8, alignItems: 'center' },
  badge: { color: '#9ee9ce', fontSize: 10, fontWeight: '700', letterSpacing: 2 },
  footerText: { color: '#f6f8fb', fontSize: 16, fontWeight: '600' },
  note: { color: '#b6c4d5', fontSize: 12, textAlign: 'center' },
});
