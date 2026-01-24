import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  PanResponder,
} from 'react-native';
import { GAME_CONFIG, COLORS } from '../utils/gameConfig';
import { checkCollision, isOutOfScreen, GameObject } from '../utils/collision';

interface FallingObject extends GameObject {
  id: number;
  type: 'poop' | 'coin';
}

interface GameScreenProps {
  onGameOver: (score: number, coins: number) => void;
  onBack: () => void;
}

export default function GameScreen({ onGameOver, onBack }: GameScreenProps) {
  // Game state
  const [playerX, setPlayerX] = useState(
    GAME_CONFIG.SCREEN_WIDTH / 2 - GAME_CONFIG.PLAYER_WIDTH / 2
  );
  const [fallingObjects, setFallingObjects] = useState<FallingObject[]>([]);
  const [score, setScore] = useState(0);
  const [coins, setCoins] = useState(0);
  const [lives, setLives] = useState(GAME_CONFIG.INITIAL_LIVES);
  const [gameSpeed, setGameSpeed] = useState(GAME_CONFIG.POOP_INITIAL_SPEED);
  const [isPlaying, setIsPlaying] = useState(true);

  // Refs for game loop
  const gameLoopRef = useRef<number | null>(null);
  const objectIdRef = useRef(0);
  const lastPoopSpawnRef = useRef(Date.now());
  const lastCoinSpawnRef = useRef(Date.now());
  const gameStartTimeRef = useRef(Date.now());

  // Player object
  const player: GameObject = {
    x: playerX,
    y: GAME_CONFIG.SCREEN_HEIGHT - GAME_CONFIG.PLAYER_HEIGHT - 50,
    width: GAME_CONFIG.PLAYER_WIDTH,
    height: GAME_CONFIG.PLAYER_HEIGHT,
  };

  // Touch to move player
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        const newX = Math.max(
          0,
          Math.min(
            gestureState.moveX - GAME_CONFIG.PLAYER_WIDTH / 2,
            GAME_CONFIG.SCREEN_WIDTH - GAME_CONFIG.PLAYER_WIDTH
          )
        );
        setPlayerX(newX);
      },
    })
  ).current;

  // Spawn new object
  const spawnObject = useCallback((type: 'poop' | 'coin') => {
    const width = type === 'poop' ? GAME_CONFIG.POOP_WIDTH : GAME_CONFIG.COIN_WIDTH;
    const newObject: FallingObject = {
      id: objectIdRef.current++,
      type,
      x: Math.random() * (GAME_CONFIG.SCREEN_WIDTH - width),
      y: -50,
      width,
      height: type === 'poop' ? GAME_CONFIG.POOP_HEIGHT : GAME_CONFIG.COIN_HEIGHT,
    };
    setFallingObjects((prev) => [...prev, newObject]);
  }, []);

  // Game loop
  useEffect(() => {
    if (!isPlaying) return;

    const gameLoop = () => {
      const now = Date.now();
      const elapsedSeconds = (now - gameStartTimeRef.current) / 1000;

      // Increase speed over time
      const currentSpeed =
        GAME_CONFIG.POOP_INITIAL_SPEED +
        Math.floor(elapsedSeconds / 10) * GAME_CONFIG.POOP_SPEED_INCREMENT;
      setGameSpeed(currentSpeed);

      // Add survival score
      setScore((prev) => prev + GAME_CONFIG.SURVIVAL_POINTS_PER_SECOND / 60);

      // Spawn poop
      if (now - lastPoopSpawnRef.current > GAME_CONFIG.POOP_SPAWN_INTERVAL) {
        spawnObject('poop');
        lastPoopSpawnRef.current = now;
      }

      // Spawn coin
      if (now - lastCoinSpawnRef.current > GAME_CONFIG.COIN_SPAWN_INTERVAL) {
        spawnObject('coin');
        lastCoinSpawnRef.current = now;
      }

      // Move objects and check collisions
      setFallingObjects((prev) => {
        const updated: FallingObject[] = [];
        let livesLost = 0;
        let coinsCollected = 0;

        for (const obj of prev) {
          const speed = obj.type === 'poop' ? currentSpeed : GAME_CONFIG.COIN_SPEED;
          const newObj = { ...obj, y: obj.y + speed };

          // Collision check
          if (checkCollision(newObj, player)) {
            if (obj.type === 'poop') {
              livesLost++;
            } else {
              coinsCollected++;
            }
            continue; // Remove collided object
          }

          // Remove objects that went off screen
          if (!isOutOfScreen(newObj, GAME_CONFIG.SCREEN_HEIGHT)) {
            updated.push(newObj);
          }
        }

        // Update state (processed in next tick)
        if (livesLost > 0) {
          setLives((prev) => Math.max(0, prev - livesLost));
        }
        if (coinsCollected > 0) {
          setCoins((prev) => prev + coinsCollected);
          setScore((prev) => prev + coinsCollected * GAME_CONFIG.COIN_POINTS);
        }

        return updated;
      });

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [isPlaying, player, spawnObject]);

  // Game over when lives reach 0
  useEffect(() => {
    if (lives <= 0 && isPlaying) {
      setIsPlaying(false);
      onGameOver(Math.floor(score), coins);
    }
  }, [lives, isPlaying, score, coins, onGameOver]);

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      {/* Background */}
      <View style={styles.background} />

      {/* Score Board */}
      <View style={styles.scoreBoard}>
        <Text style={styles.scoreText}>Score: {Math.floor(score)}</Text>
        <Text style={styles.scoreText}>Coins: {coins}</Text>
        <Text style={styles.scoreText}>
          Lives: {'❤️'.repeat(lives)}{'🖤'.repeat(GAME_CONFIG.INITIAL_LIVES - lives)}
        </Text>
      </View>

      {/* Back Button */}
      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Text style={styles.backButtonText}>✕</Text>
      </TouchableOpacity>

      {/* Player */}
      <View
        style={[
          styles.player,
          {
            left: playerX,
            top: player.y,
          },
        ]}
      >
        <Text style={styles.playerEmoji}>🏃</Text>
      </View>

      {/* Falling Objects */}
      {fallingObjects.map((obj) => (
        <View
          key={obj.id}
          style={[
            styles.fallingObject,
            {
              left: obj.x,
              top: obj.y,
              width: obj.width,
              height: obj.height,
            },
          ]}
        >
          <Text style={styles.objectEmoji}>
            {obj.type === 'poop' ? '💩' : '🪙'}
          </Text>
        </View>
      ))}

      {/* Ground */}
      <View style={styles.ground} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.background,
  },
  scoreBoard: {
    position: 'absolute',
    top: 50,
    left: 20,
    backgroundColor: COLORS.scoreBoard,
    padding: 15,
    borderRadius: 10,
    zIndex: 100,
  },
  scoreText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: 'bold',
    marginVertical: 2,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 40,
    height: 40,
    backgroundColor: 'rgba(255, 0, 0, 0.7)',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  backButtonText: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: 'bold',
  },
  player: {
    position: 'absolute',
    width: GAME_CONFIG.PLAYER_WIDTH,
    height: GAME_CONFIG.PLAYER_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerEmoji: {
    fontSize: 40,
  },
  fallingObject: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  objectEmoji: {
    fontSize: 35,
  },
  ground: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 30,
    backgroundColor: COLORS.ground,
  },
});
