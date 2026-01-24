import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WalletProvider } from './src/solana/WalletContext';
import HomeScreen from './src/screens/HomeScreen';
import GameScreen from './src/screens/GameScreen';
import GameOverScreen from './src/screens/GameOverScreen';

type Screen = 'home' | 'game' | 'gameover';

const STORAGE_KEYS = {
  HIGH_SCORE: '@poop_dodge_high_score',
  TOTAL_COINS: '@poop_dodge_total_coins',
};

function AppContent() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [highScore, setHighScore] = useState(0);
  const [totalCoins, setTotalCoins] = useState(0);
  const [lastScore, setLastScore] = useState(0);
  const [lastCoins, setLastCoins] = useState(0);
  const [isNewHighScore, setIsNewHighScore] = useState(false);

  // Load saved data
  useEffect(() => {
    loadSavedData();
  }, []);

  const loadSavedData = async () => {
    try {
      const savedHighScore = await AsyncStorage.getItem(STORAGE_KEYS.HIGH_SCORE);
      const savedTotalCoins = await AsyncStorage.getItem(STORAGE_KEYS.TOTAL_COINS);

      if (savedHighScore) setHighScore(parseInt(savedHighScore, 10));
      if (savedTotalCoins) setTotalCoins(parseInt(savedTotalCoins, 10));
    } catch (error) {
      console.log('Failed to load data:', error);
    }
  };

  const saveData = async (newHighScore: number, newTotalCoins: number) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.HIGH_SCORE, newHighScore.toString());
      await AsyncStorage.setItem(STORAGE_KEYS.TOTAL_COINS, newTotalCoins.toString());
    } catch (error) {
      console.log('Failed to save data:', error);
    }
  };

  // Start game
  const handleStartGame = () => {
    setCurrentScreen('game');
  };

  // Game over
  const handleGameOver = (score: number, coins: number) => {
    setLastScore(score);
    setLastCoins(coins);

    // Check for new high score
    const newIsHighScore = score > highScore;
    setIsNewHighScore(newIsHighScore);

    // Update data
    const newHighScore = newIsHighScore ? score : highScore;
    const newTotalCoins = totalCoins + coins;

    setHighScore(newHighScore);
    setTotalCoins(newTotalCoins);
    saveData(newHighScore, newTotalCoins);

    setCurrentScreen('gameover');
  };

  // Restart
  const handleRestart = () => {
    setCurrentScreen('game');
  };

  // Go home
  const handleGoHome = () => {
    setCurrentScreen('home');
  };

  // Back from game
  const handleBackFromGame = () => {
    setCurrentScreen('home');
  };

  return (
    <>
      <StatusBar style="light" />
      {currentScreen === 'home' && (
        <HomeScreen
          onStartGame={handleStartGame}
          highScore={highScore}
          totalCoins={totalCoins}
        />
      )}
      {currentScreen === 'game' && (
        <GameScreen
          onGameOver={handleGameOver}
          onBack={handleBackFromGame}
        />
      )}
      {currentScreen === 'gameover' && (
        <GameOverScreen
          score={lastScore}
          coins={lastCoins}
          highScore={highScore}
          isNewHighScore={isNewHighScore}
          onRestart={handleRestart}
          onHome={handleGoHome}
        />
      )}
    </>
  );
}

export default function App() {
  return (
    <WalletProvider>
      <AppContent />
    </WalletProvider>
  );
}
