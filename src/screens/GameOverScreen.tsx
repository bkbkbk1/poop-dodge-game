import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { COLORS } from '../utils/gameConfig';
import { useWallet } from '../solana/WalletContext';

interface GameOverScreenProps {
  score: number;
  coins: number;
  highScore: number;
  isNewHighScore: boolean;
  onRestart: () => void;
  onHome: () => void;
}

export default function GameOverScreen({
  score,
  coins,
  highScore,
  isNewHighScore,
  onRestart,
  onHome,
}: GameOverScreenProps) {
  const {
    publicKey,
    isConnected,
    isConnecting,
    tokenBalance,
    connect,
    claimRewards,
    isClaiming,
    isTokenReady,
  } = useWallet();

  const [hasClaimed, setHasClaimed] = useState(false);

  const handleConnect = async () => {
    try {
      await connect();
    } catch (error) {
      console.log('Connection failed:', error);
    }
  };

  const handleClaim = async () => {
    const success = await claimRewards(coins);
    if (success) {
      setHasClaimed(true);
    }
  };

  const shortenAddress = (address: string) => {
    if (address.length <= 10) return address;
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  // Calculate token reward (1 $POOP per 10 coins)
  const tokenReward = Math.floor(coins / 10);

  return (
    <View style={styles.container}>
      {/* Game Over Title */}
      <View style={styles.titleContainer}>
        <Text style={styles.emoji}>💀</Text>
        <Text style={styles.title}>Game Over</Text>
        {isNewHighScore && (
          <Text style={styles.newHighScore}>🎉 New High Score! 🎉</Text>
        )}
      </View>

      {/* Results */}
      <View style={styles.resultsContainer}>
        <View style={styles.resultRow}>
          <Text style={styles.resultLabel}>Score</Text>
          <Text style={styles.resultValue}>{score}</Text>
        </View>
        <View style={styles.resultRow}>
          <Text style={styles.resultLabel}>Coins Collected</Text>
          <Text style={styles.resultValue}>🪙 {coins}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.resultRow}>
          <Text style={styles.resultLabel}>High Score</Text>
          <Text style={[styles.resultValue, styles.highScoreValue]}>{highScore}</Text>
        </View>
      </View>

      {/* Reward Section */}
      <View style={styles.rewardContainer}>
        <Text style={styles.rewardTitle}>🎁 Rewards</Text>

        {isConnected ? (
          <>
            <View style={styles.rewardRow}>
              <Text style={styles.rewardLabel}>Wallet</Text>
              <Text style={styles.rewardValue}>◎ {shortenAddress(publicKey!)}</Text>
            </View>

            {tokenBalance > 0 && (
              <View style={styles.rewardRow}>
                <Text style={styles.rewardLabel}>$POOP Balance</Text>
                <Text style={styles.rewardValue}>{tokenBalance.toFixed(2)}</Text>
              </View>
            )}

            <View style={styles.rewardRow}>
              <Text style={styles.rewardLabel}>$POOP Earned</Text>
              <Text style={styles.tokenReward}>+{tokenReward} $POOP</Text>
            </View>

            {tokenReward > 0 && !hasClaimed ? (
              <TouchableOpacity
                style={[styles.claimButton, isClaiming && styles.claimButtonDisabled]}
                onPress={handleClaim}
                disabled={isClaiming || !isTokenReady}
              >
                {isClaiming ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.claimButtonText}>
                    {isTokenReady ? 'Claim Rewards' : 'Token Not Ready'}
                  </Text>
                )}
              </TouchableOpacity>
            ) : hasClaimed ? (
              <View style={styles.claimedBadge}>
                <Text style={styles.claimedText}>✓ Claimed!</Text>
              </View>
            ) : (
              <Text style={styles.noRewardText}>
                Collect 10+ coins to earn $POOP
              </Text>
            )}

            {!isTokenReady && (
              <Text style={styles.rewardNote}>
                * Run setup-token script to enable rewards
              </Text>
            )}
          </>
        ) : (
          <>
            <Text style={styles.rewardText}>
              Connect your wallet to claim {tokenReward} $POOP tokens!
            </Text>
            <TouchableOpacity
              style={styles.connectButton}
              onPress={handleConnect}
              disabled={isConnecting}
            >
              {isConnecting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.connectButtonText}>◎ Connect Wallet</Text>
              )}
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Buttons */}
      <View style={styles.buttonsContainer}>
        <TouchableOpacity style={styles.restartButton} onPress={onRestart}>
          <Text style={styles.buttonText}>Play Again</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.homeButton} onPress={onHome}>
          <Text style={styles.buttonText}>Home</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2C3E50',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  emoji: {
    fontSize: 60,
    marginBottom: 10,
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#E74C3C',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  newHighScore: {
    fontSize: 20,
    color: '#F1C40F',
    marginTop: 10,
    fontWeight: 'bold',
  },
  resultsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 25,
    borderRadius: 20,
    width: '100%',
    maxWidth: 300,
    marginBottom: 20,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 8,
  },
  resultLabel: {
    fontSize: 18,
    color: '#BDC3C7',
  },
  resultValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  highScoreValue: {
    color: '#F1C40F',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginVertical: 10,
  },
  rewardContainer: {
    backgroundColor: 'rgba(155, 89, 182, 0.3)',
    padding: 20,
    borderRadius: 15,
    width: '100%',
    maxWidth: 300,
    marginBottom: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(155, 89, 182, 0.5)',
  },
  rewardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 15,
  },
  rewardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginVertical: 5,
  },
  rewardLabel: {
    fontSize: 14,
    color: '#BDC3C7',
  },
  rewardValue: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  tokenReward: {
    fontSize: 18,
    color: '#2ECC71',
    fontWeight: 'bold',
  },
  rewardText: {
    fontSize: 14,
    color: '#BDC3C7',
    textAlign: 'center',
    marginBottom: 15,
  },
  noRewardText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 10,
  },
  rewardNote: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 10,
    textAlign: 'center',
  },
  connectButton: {
    backgroundColor: 'rgba(155, 89, 182, 0.8)',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 20,
    minWidth: 160,
    alignItems: 'center',
  },
  connectButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  claimButton: {
    backgroundColor: '#27AE60',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 20,
    marginTop: 15,
    minWidth: 160,
    alignItems: 'center',
  },
  claimButtonDisabled: {
    backgroundColor: 'rgba(39, 174, 96, 0.5)',
  },
  claimButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  claimedBadge: {
    backgroundColor: 'rgba(39, 174, 96, 0.3)',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 20,
    marginTop: 15,
    borderWidth: 1,
    borderColor: '#27AE60',
  },
  claimedText: {
    color: '#27AE60',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: 15,
  },
  restartButton: {
    backgroundColor: '#27AE60',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  homeButton: {
    backgroundColor: '#3498DB',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
