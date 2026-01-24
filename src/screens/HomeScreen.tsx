import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { COLORS } from '../utils/gameConfig';
import { useWallet } from '../solana/WalletContext';

interface HomeScreenProps {
  onStartGame: () => void;
  highScore: number;
  totalCoins: number;
}

export default function HomeScreen({ onStartGame, highScore, totalCoins }: HomeScreenProps) {
  const { publicKey, isConnected, isConnecting, balance, tokenBalance, connect, disconnect } = useWallet();

  const handleWalletPress = async () => {
    try {
      if (isConnected) {
        await disconnect();
      } else {
        await connect();
      }
    } catch (error) {
      console.log('Wallet action failed:', error);
    }
  };

  const shortenAddress = (address: string) => {
    if (address.length <= 10) return address;
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  return (
    <View style={styles.container}>
      {/* Wallet Connection */}
      <TouchableOpacity
        style={[styles.walletButton, isConnected && styles.walletConnected]}
        onPress={handleWalletPress}
        disabled={isConnecting}
      >
        {isConnecting ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : isConnected ? (
          <View style={styles.walletInfo}>
            <Text style={styles.walletAddress}>◎ {shortenAddress(publicKey!)}</Text>
            {balance > 0 && <Text style={styles.walletBalance}>{balance.toFixed(4)} SOL</Text>}
            {tokenBalance > 0 && <Text style={styles.walletBalance}>{tokenBalance.toFixed(0)} $POOP</Text>}
          </View>
        ) : (
          <Text style={styles.walletButtonText}>◎ Connect Wallet</Text>
        )}
      </TouchableOpacity>

      {/* Title */}
      <View style={styles.titleContainer}>
        <Text style={styles.emoji}>💩</Text>
        <Text style={styles.title}>Poop Dodge</Text>
        <Text style={styles.subtitle}>Don't get hit!</Text>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>High Score</Text>
          <Text style={styles.statValue}>{highScore}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Total Coins</Text>
          <Text style={styles.statValue}>🪙 {totalCoins}</Text>
        </View>
      </View>

      {/* Start Button */}
      <TouchableOpacity style={styles.startButton} onPress={onStartGame}>
        <Text style={styles.startButtonText}>Play</Text>
      </TouchableOpacity>

      {/* Instructions */}
      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionsTitle}>🎮 How to Play</Text>
        <Text style={styles.instructions}>• Touch & drag to move</Text>
        <Text style={styles.instructions}>• 💩 Dodge the poop!</Text>
        <Text style={styles.instructions}>• 🪙 Collect coins!</Text>
        <Text style={styles.instructions}>• Survive as long as you can!</Text>
      </View>

      {/* Reward Info */}
      {isConnected && (
        <View style={styles.rewardInfo}>
          <Text style={styles.rewardInfoText}>
            🎁 Earn $POOP tokens by playing!
          </Text>
        </View>
      )}

      {/* Solana Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Powered by Solana ◎</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  walletButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    minWidth: 140,
    alignItems: 'center',
  },
  walletConnected: {
    backgroundColor: 'rgba(39, 174, 96, 0.8)',
  },
  walletButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  walletInfo: {
    alignItems: 'center',
  },
  walletAddress: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  walletBalance: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    marginTop: 2,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  emoji: {
    fontSize: 80,
    marginBottom: 10,
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#4A2C2A',
    textShadowColor: 'rgba(255, 255, 255, 0.8)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 18,
    color: '#6B4423',
    marginTop: 5,
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: 30,
  },
  statBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 15,
    borderRadius: 15,
    marginHorizontal: 10,
    alignItems: 'center',
    minWidth: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  startButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 60,
    paddingVertical: 20,
    borderRadius: 30,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  startButtonText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  instructionsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    padding: 20,
    borderRadius: 15,
    width: '100%',
    maxWidth: 300,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  instructions: {
    fontSize: 14,
    color: '#555',
    marginVertical: 3,
  },
  rewardInfo: {
    marginTop: 15,
    backgroundColor: 'rgba(155, 89, 182, 0.3)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  rewardInfoText: {
    color: '#4A2C2A',
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    position: 'absolute',
    bottom: 40,
  },
  footerText: {
    fontSize: 14,
    color: '#6B4423',
    fontWeight: '600',
  },
});
