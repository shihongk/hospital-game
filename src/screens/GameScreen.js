import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  PanResponder,
  Dimensions,
  TouchableOpacity,
  Modal,
  Platform,
} from 'react-native';
import { SvgXml } from 'react-native-svg';
import { Audio } from 'expo-av';
const { PAIRS } = require('../data/pairs');
import { shuffle } from '../utils/shuffle';

// ─── Layout math ─────────────────────────────────────────────
const { width: SW, height: SH } = Dimensions.get('window');
const SAFE_TOP  = Platform.OS === 'ios' ? 44 : 24;
const HEADER_H  = 48;
const BODY_PAD  = 8;
const PANEL_PAD = 8;
const TITLE_H   = 28;
const ROWS      = 6;
const GAP       = 5;

const AVAIL_H =
  SH - SAFE_TOP - HEADER_H - BODY_PAD * 2 - PANEL_PAD * 2 - TITLE_H - GAP * (ROWS - 1) - GAP;
const ZONE_H   = Math.floor(AVAIL_H / ROWS);
const TRAY_CARD = ZONE_H;
const TRAY_COLS = 3;
const TRAY_W    = TRAY_COLS * (TRAY_CARD + GAP) - GAP + PANEL_PAD * 2;
const SVG_SZ    = Math.round(ZONE_H * 0.58);
const LABEL_SZ  = Math.max(8, Math.round(ZONE_H * 0.13));

// ─── Data ────────────────────────────────────────────────────
function buildTrayItems() {
  const items = [];
  PAIRS.forEach((p) => {
    items.push({ id: `tool-${p.id}`, pairId: p.id, type: 'tool', label: p.tool.label, svg: p.tool.svg });
    items.push({ id: `job-${p.id}`,  pairId: p.id, type: 'job',  label: p.job.label,  svg: p.job.svg  });
  });
  return shuffle(items);
}

// ─── DropZone ────────────────────────────────────────────────
function DropZone({ panel, row, onMeasured, state, onTap, isValidTarget }) {
  const ref = useRef(null);
  const doMeasure = () =>
    ref.current?.measure((fx, fy, w, h, px, py) =>
      onMeasured(panel, row, { x: px, y: py, width: w, height: h })
    );

  let bg = '#f0fffe', border = '#80cbc4', bs = 'dashed';
  if (isValidTarget)              { bg = '#fffde7'; border = '#fbc02d'; bs = 'solid'; }
  if (state?.state === 'correct') { bg = '#e8f5e9'; border = '#43a047'; bs = 'solid'; }
  if (state?.state === 'wrong')   { bg = '#ffebee'; border = '#e53935'; bs = 'solid'; }

  return (
    <View ref={ref} onLayout={doMeasure}
      onClick={() => onTap?.(panel, row)}
      style={[styles.dropZone, { backgroundColor: bg, borderColor: border, borderStyle: bs }]}>
      {state?.card && (
        <View style={styles.placedCard}>
          <SvgXml xml={state.card.svg} width={SVG_SZ} height={SVG_SZ} />
          <Text style={styles.cardLabel} numberOfLines={2}>{state.card.label}</Text>
        </View>
      )}
    </View>
  );
}

// ─── Celebration ─────────────────────────────────────────────
const CONFETTI_COLORS = [
  '#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3',
  '#54a0ff', '#5f27cd', '#00d2d3', '#ff9f43', '#1dd1a1', '#ee5a24',
];

function Celebration({ visible }) {
  const itemsRef = useRef(null);
  if (!itemsRef.current) {
    itemsRef.current = {
      balloons: Array.from({ length: 14 }, () => ({
        x: Math.random() * (SW - 60),
        anim: new Animated.Value(0),
        drift: (Math.random() - 0.5) * 90,
        delay: Math.random() * 1400,
        size: 36 + Math.random() * 22,
      })),
      confetti: Array.from({ length: 70 }, () => ({
        x: Math.random() * SW,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        anim: new Animated.Value(0),
        delay: Math.random() * 2200,
        rotation: Math.random() * 360,
        w: 6 + Math.random() * 10,
        h: 4 + Math.random() * 6,
      })),
    };
  }
  const { balloons, confetti } = itemsRef.current;

  useEffect(() => {
    if (!visible) return;
    balloons.forEach(b => {
      b.anim.setValue(0);
      Animated.timing(b.anim, {
        toValue: 1,
        duration: 3500 + Math.random() * 2500,
        delay: b.delay,
        useNativeDriver: true,
      }).start();
    });
    confetti.forEach(c => {
      c.anim.setValue(0);
      Animated.timing(c.anim, {
        toValue: 1,
        duration: 3000 + Math.random() * 2500,
        delay: c.delay,
        useNativeDriver: true,
      }).start();
    });
  }, [visible]);

  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {balloons.map((b, i) => (
        <Animated.Text
          key={`b${i}`}
          style={{
            position: 'absolute',
            left: b.x,
            fontSize: b.size,
            transform: [
              { translateY: b.anim.interpolate({ inputRange: [0, 1], outputRange: [SH + 80, -180] }) },
              { translateX: b.anim.interpolate({ inputRange: [0, 0.25, 0.5, 0.75, 1], outputRange: [0, b.drift, 0, -b.drift, 0] }) },
            ],
          }}
        >
          🎈
        </Animated.Text>
      ))}
      {confetti.map((c, i) => (
        <Animated.View
          key={`c${i}`}
          style={{
            position: 'absolute',
            left: c.x,
            top: 0,
            width: c.w,
            height: c.h,
            backgroundColor: c.color,
            borderRadius: 2,
            transform: [
              { translateY: c.anim.interpolate({ inputRange: [0, 1], outputRange: [-30, SH + 30] }) },
              { rotate: c.anim.interpolate({ inputRange: [0, 1], outputRange: [`${c.rotation}deg`, `${c.rotation + 540}deg`] }) },
            ],
          }}
        />
      ))}
    </View>
  );
}

// ─── GameScreen ──────────────────────────────────────────────
export default function GameScreen() {
  const [trayItems, setTrayItems] = useState(buildTrayItems);
  const [zones, setZones] = useState(() => {
    const z = { left: {}, right: {} };
    for (let i = 0; i < 12; i++) { z.left[i] = null; z.right[i] = null; }
    return z;
  });
  const [score, setScore]       = useState(0);
  const [showWin, setShowWin]   = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);

  const soundRef = useRef(null);

  useEffect(() => {
    console.log('[GameScreen] mounted');
    let sound;
    Audio.setAudioModeAsync({ playsInSilentModeIOS: true })
      .then(() => {
        console.log('[Audio] setAudioModeAsync OK');
        return Audio.Sound.createAsync(
          require('../../assets/0518.MP3'),
          { isLooping: true, volume: 0.5 }
        );
      })
      .then(({ sound: s }) => {
        console.log('[Audio] sound created OK');
        sound = s;
        soundRef.current = s;
        return s.playAsync();
      })
      .then(() => console.log('[Audio] playAsync OK'))
      .catch((e) => console.error('[Audio] error:', e));
    return () => { sound?.unloadAsync(); };
  }, []);

  // Tray scroll control — disabled while dragging so touch goes to drag handler
  const [trayScrollEnabled, setTrayScrollEnabled] = useState(true);

  // Floating ghost state
  const [ghost, setGhost] = useState(null);
  const ghostPan = useRef(new Animated.ValueXY()).current;
  const dragItem = useRef(null);

  const zoneLayouts = useRef({});
  const handleZoneMeasured = useCallback((panel, row, layout) => {
    zoneLayouts.current[`${panel}-${row}`] = layout;
  }, []);

  const findZone = useCallback((cx, cy) => {
    for (const key of Object.keys(zoneLayouts.current)) {
      const { x, y, width, height } = zoneLayouts.current[key];
      if (cx >= x && cx <= x + width && cy >= y && cy <= y + height) {
        const [panel, row] = key.split('-');
        return { panel, row: parseInt(row) };
      }
    }
    return null;
  }, []);

  // Called by each tray card when the user starts dragging
  const startDrag = useCallback((item, screenX, screenY) => {
    dragItem.current = item;
    ghostPan.setValue({ x: screenX - TRAY_CARD / 2, y: screenY - TRAY_CARD / 2 });
    setGhost(item);
    setTrayScrollEnabled(false); // lock scroll while dragging
  }, [ghostPan]);

  const moveDrag = useCallback((screenX, screenY) => {
    ghostPan.setValue({ x: screenX - TRAY_CARD / 2, y: screenY - TRAY_CARD / 2 });
  }, [ghostPan]);

  const endDrag = useCallback((screenX, screenY) => {
    const item = dragItem.current;
    dragItem.current = null;
    setGhost(null);
    setTrayScrollEnabled(true); // re-enable scroll after drop
    if (!item) return;

    const target = findZone(screenX, screenY);
    if (!target) return;
    const { panel, row } = target;
    if (panel === 'left'  && item.type !== 'tool') return;
    if (panel === 'right' && item.type !== 'job')  return;
    if (zones[panel][row]?.state === 'correct')    return;

    setZones((prev) => {
      const next = { left: { ...prev.left }, right: { ...prev.right } };
      if (next[panel][row]) setTrayItems((t) => [...t, next[panel][row].card]);
      next[panel][row] = { card: item, pairId: item.pairId, state: 'placed' };
      setTrayItems((t) => t.filter((c) => c.id !== item.id));

      const L = panel === 'left'  ? next.left[row]  : prev.left[row];
      const R = panel === 'right' ? next.right[row] : prev.right[row];
      if (L && R) {
        if (L.pairId === R.pairId) {
          next.left[row]  = { ...L, state: 'correct' };
          next.right[row] = { ...R, state: 'correct' };
          setScore((s) => {
            const n = s + 1;
            if (n === 12) setTimeout(() => setShowWin(true), 400);
            return n;
          });
        } else {
          next.left[row]  = { ...L, state: 'wrong' };
          next.right[row] = { ...R, state: 'wrong' };
          setTimeout(() => {
            setZones((z) => {
              const n = { left: { ...z.left }, right: { ...z.right } };
              const lC = n.left[row]?.card; const rC = n.right[row]?.card;
              n.left[row] = null; n.right[row] = null;
              if (lC) setTrayItems((t) => [...t, lC]);
              if (rC) setTrayItems((t) => [...t, rC]);
              return n;
            });
          }, 600);
        }
      }
      return next;
    });
  }, [zones, findZone]);

  const onTapCard = useCallback((item) => {
    setSelectedCard(prev => prev?.id === item.id ? null : item);
  }, []);

  const onTapZone = useCallback((panel, row) => {
    if (!selectedCard) return;
    const item = selectedCard;
    if (panel === 'left'  && item.type !== 'tool') return;
    if (panel === 'right' && item.type !== 'job')  return;
    if (zones[panel][row]?.state === 'correct')    return;

    setSelectedCard(null);
    setZones((prev) => {
      const next = { left: { ...prev.left }, right: { ...prev.right } };
      if (next[panel][row]) setTrayItems((t) => [...t, next[panel][row].card]);
      next[panel][row] = { card: item, pairId: item.pairId, state: 'placed' };
      setTrayItems((t) => t.filter((c) => c.id !== item.id));

      const L = panel === 'left'  ? next.left[row]  : prev.left[row];
      const R = panel === 'right' ? next.right[row] : prev.right[row];
      if (L && R) {
        if (L.pairId === R.pairId) {
          next.left[row]  = { ...L, state: 'correct' };
          next.right[row] = { ...R, state: 'correct' };
          setScore((s) => {
            const n = s + 1;
            if (n === 12) setTimeout(() => setShowWin(true), 400);
            return n;
          });
        } else {
          next.left[row]  = { ...L, state: 'wrong' };
          next.right[row] = { ...R, state: 'wrong' };
          setTimeout(() => {
            setZones((z) => {
              const n = { left: { ...z.left }, right: { ...z.right } };
              const lC = n.left[row]?.card; const rC = n.right[row]?.card;
              n.left[row] = null; n.right[row] = null;
              if (lC) setTrayItems((t) => [...t, lC]);
              if (rC) setTrayItems((t) => [...t, rC]);
              return n;
            });
          }, 600);
        }
      }
      return next;
    });
  }, [selectedCard, zones]);

  const handleReset = () => {
    setTrayItems(buildTrayItems());
    const z = { left: {}, right: {} };
    for (let i = 0; i < 12; i++) { z.left[i] = null; z.right[i] = null; }
    setZones(z); setScore(0); setShowWin(false); setGhost(null);
    setTrayScrollEnabled(true); setSelectedCard(null);
    soundRef.current?.replayAsync();
  };

  const getZoneState = (panel, row) => zones[panel][row] || null;

  return (
    <View style={styles.root}>

      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.title}>🏥 Hospital Match</Text>
        <Text style={styles.subtitle}>Match each tool to its job in the same row</Text>
        <View style={styles.scoreRow}>
          <Text style={styles.scoreText}>✅ {score} / 12</Text>
          <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
            <Text style={styles.resetBtnText}>🔄</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* BODY */}
      <View style={styles.body}>

        {/* TRAY — ScrollView for scrolling, disabled during drag */}
        <View style={styles.traySidebar}>
          <Text style={styles.sectionTitle}>🎒 Tray</Text>
          <ScrollView
            scrollEnabled={trayScrollEnabled}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.trayGrid}
          >
            {trayItems.map((item) => (
              <TrayCard
                key={item.id}
                item={item}
                onStartDrag={startDrag}
                onMoveDrag={moveDrag}
                onEndDrag={endDrag}
                onTap={onTapCard}
                isDragging={ghost?.id === item.id}
                isSelected={selectedCard?.id === item.id}
              />
            ))}
          </ScrollView>
        </View>

        {/* TOOLS PANEL */}
        <View style={styles.panel}>
          <Text style={styles.sectionTitle}>🔧 Tools</Text>
          <View style={styles.grid}>
            {Array.from({ length: 12 }, (_, i) => (
              <DropZone key={`left-${i}`} panel="left" row={i}
                onMeasured={handleZoneMeasured} state={getZoneState('left', i)}
                onTap={onTapZone}
                isValidTarget={selectedCard?.type === 'tool' && getZoneState('left', i)?.state !== 'correct'} />
            ))}
          </View>
        </View>

        {/* JOBS PANEL */}
        <View style={styles.panel}>
          <Text style={styles.sectionTitle}>👩‍⚕️ Jobs</Text>
          <View style={styles.grid}>
            {Array.from({ length: 12 }, (_, i) => (
              <DropZone key={`right-${i}`} panel="right" row={i}
                onMeasured={handleZoneMeasured} state={getZoneState('right', i)}
                onTap={onTapZone}
                isValidTarget={selectedCard?.type === 'job' && getZoneState('right', i)?.state !== 'correct'} />
            ))}
          </View>
        </View>

      </View>

      {/* FLOATING GHOST — rendered at root level so it floats over everything */}
      {ghost && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.ghost,
            { transform: ghostPan.getTranslateTransform() },
          ]}
        >
          <SvgXml xml={ghost.svg} width={SVG_SZ} height={SVG_SZ} />
          <Text style={styles.cardLabel} numberOfLines={2}>{ghost.label}</Text>
        </Animated.View>
      )}

      {/* WIN MODAL */}
      <Modal visible={showWin} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={{ fontSize: 60, marginBottom: 12 }}>🏆</Text>
            <Text style={styles.modalTitle}>Congratulations!</Text>
            <Text style={styles.modalSub}>You matched all 12 pairs!</Text>
            <TouchableOpacity style={styles.playAgainBtn} onPress={handleReset}>
              <Text style={styles.playAgainText}>Play Again</Text>
            </TouchableOpacity>
          </View>
          <Celebration visible={showWin} />
        </View>
      </Modal>
    </View>
  );
}

// ─── TrayCard ─────────────────────────────────────────────────
// Scroll vs drag: if finger moves more than DRAG_THRESHOLD px from
// touch-start, we lock scroll and start dragging. Small movements
// (or vertical swipes) are passed through to the ScrollView.
const DRAG_THRESHOLD = 6;

function TrayCard({ item, onStartDrag, onMoveDrag, onEndDrag, onTap, isDragging, isSelected }) {
  const touchStart = useRef(null);   // { x, y }
  const dragging   = useRef(false);

  const onTouchStart = (e) => {
    const { pageX, pageY } = e.nativeEvent;
    touchStart.current = { x: pageX, y: pageY };
    dragging.current = false;
  };

  const onTouchMove = (e) => {
    const { pageX, pageY } = e.nativeEvent;
    if (!touchStart.current) return;

    if (!dragging.current) {
      const dx = Math.abs(pageX - touchStart.current.x);
      const dy = Math.abs(pageY - touchStart.current.y);
      // Only start drag if moved enough; prefer horizontal moves as drag intent
      if (dx > DRAG_THRESHOLD || dy > DRAG_THRESHOLD) {
        dragging.current = true;
        onStartDrag(item, pageX, pageY);
      }
    } else {
      onMoveDrag(pageX, pageY);
    }
  };

  const onTouchEnd = (e) => {
    const { pageX, pageY } = e.nativeEvent;
    if (dragging.current) {
      e.preventDefault(); // suppress synthetic click after drag
      onEndDrag(pageX, pageY);
    }
    dragging.current = false;
    touchStart.current = null;
  };

  const onTouchCancel = () => {
    if (dragging.current) onEndDrag(-1, -1); // drop nowhere
    dragging.current = false;
    touchStart.current = null;
  };

  const onClick = () => { onTap?.(item); };

  return (
    <View
      style={[styles.traySlot, isDragging && styles.traySlotDragging, isSelected && styles.traySlotSelected]}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchCancel}
      onClick={onClick}
    >
      {!isDragging && (
        <>
          <SvgXml xml={item.svg} width={SVG_SZ} height={SVG_SZ} />
          <Text style={styles.cardLabel} numberOfLines={2}>{item.label}</Text>
        </>
      )}
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#e0f7fa',
    paddingTop: SAFE_TOP,
  },
  header: {
    height: HEADER_H,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    backgroundColor: 'white',
    borderBottomWidth: 2,
    borderBottomColor: '#b2dfdb',
    gap: 8,
  },
  title:    { fontSize: 15, fontWeight: '800', color: '#00695c', flexShrink: 0 },
  subtitle: { flex: 1, fontSize: 11, color: '#666', textAlign: 'center' },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 0 },
  scoreText: {
    fontSize: 13, fontWeight: '700', color: '#00796b',
    backgroundColor: '#e0f7fa', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 14,
  },
  resetBtn: { backgroundColor: '#ef5350', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 14 },
  resetBtnText: { color: 'white', fontWeight: '700', fontSize: 14 },

  body: {
    flex: 1,
    flexDirection: 'row',
    padding: BODY_PAD,
    gap: BODY_PAD,
  },

  traySidebar: {
    width: TRAY_W,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: PANEL_PAD,
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 5, elevation: 3,
  },
  trayGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GAP,
  },
  traySlot: {
    width: TRAY_CARD,
    height: TRAY_CARD,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#80cbc4',
    borderRadius: 8,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 3,
    shadowColor: '#000', shadowOpacity: 0.10, shadowRadius: 3, elevation: 2,
  },
  traySlotDragging: {
    backgroundColor: '#f0fffe',
    borderColor: '#ccc',
    shadowOpacity: 0,
    elevation: 0,
  },
  traySlotSelected: {
    backgroundColor: '#fffde7',
    borderColor: '#fbc02d',
    borderStyle: 'solid',
    borderWidth: 2.5,
  },

  panel: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: PANEL_PAD,
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 5, elevation: 3,
  },
  sectionTitle: {
    height: TITLE_H,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '700',
    color: '#00695c',
    paddingBottom: 4,
    borderBottomWidth: 2,
    borderBottomColor: '#b2dfdb',
    textAlignVertical: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GAP,
    paddingTop: GAP,
  },
  dropZone: {
    width: '47.8%',
    height: ZONE_H,
    borderWidth: 2,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placedCard: { alignItems: 'center', justifyContent: 'center' },

  // Shared card content styles (used in tray, placed, and ghost)
  card: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 3,
  },
  cardLabel: {
    fontSize: LABEL_SZ, fontWeight: '700', color: '#333',
    textAlign: 'center', lineHeight: LABEL_SZ + 2, marginTop: 1,
  },

  // Floating ghost — absolute, above everything
  ghost: {
    position: 'absolute',
    width: TRAY_CARD,
    height: TRAY_CARD,
    backgroundColor: 'white',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#00897b',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
    shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 10, elevation: 20,
    zIndex: 999,
  },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' },
  modalBox: {
    backgroundColor: 'white', borderRadius: 24, padding: 40, alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 20, elevation: 10, minWidth: 280,
  },
  modalTitle: { fontSize: 26, fontWeight: '800', color: '#00695c', marginBottom: 8 },
  modalSub:   { fontSize: 16, color: '#555', marginBottom: 24 },
  playAgainBtn: { backgroundColor: '#00897b', paddingHorizontal: 32, paddingVertical: 12, borderRadius: 30 },
  playAgainText: { color: 'white', fontSize: 16, fontWeight: '800' },
});
