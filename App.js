import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet, Platform } from 'react-native';
import GameScreen from './src/screens/GameScreen';

console.log('[App] loaded, platform =', Platform.OS);

export default function App() {
  console.log('[App] rendering');
  return (
    <GestureHandlerRootView style={styles.root}>
      <GameScreen />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
