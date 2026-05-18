import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import GameScreen from './src/screens/GameScreen';

export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <GameScreen />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
