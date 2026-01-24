import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { Platform, Linking, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Connection, PublicKey, clusterApiUrl, Keypair } from '@solana/web3.js';
import {
  calculateReward,
  executeClaim,
  getTokenBalance,
  setTokenMint,
  setRewardPool,
} from './rewards';
import {
  TOKEN_MINT,
  REWARD_POOL_KEYPAIR,
} from './tokenConfig';

interface WalletContextType {
  publicKey: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  balance: number;
  tokenBalance: number;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  claimRewards: (coins: number) => Promise<boolean>;
  isClaiming: boolean;
  isTokenReady: boolean;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

const STORAGE_KEY = '@poop_dodge_wallet';
const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');

interface WalletProviderProps {
  children: ReactNode;
}

export function WalletProvider({ children }: WalletProviderProps) {
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [balance, setBalance] = useState(0);
  const [tokenBalance, setTokenBalance] = useState(0);
  const [isClaiming, setIsClaiming] = useState(false);
  const [isTokenReady, setIsTokenReady] = useState(false);

  // Initialize token config on mount
  useEffect(() => {
    initializeToken();
    loadSavedWallet();
  }, []);

  // Update token balance when wallet connects
  useEffect(() => {
    if (publicKey && isTokenReady) {
      updateTokenBalance();
    }
  }, [publicKey, isTokenReady]);

  const initializeToken = () => {
    try {
      // Set token mint from config
      setTokenMint(TOKEN_MINT);

      // Set reward pool keypair from config
      const keypair = Keypair.fromSecretKey(new Uint8Array(REWARD_POOL_KEYPAIR));
      setRewardPool(keypair);

      setIsTokenReady(true);
      console.log('Token initialized:', TOKEN_MINT);
    } catch (error) {
      console.log('Failed to initialize token:', error);
    }
  };

  const loadSavedWallet = async () => {
    try {
      const savedWallet = await AsyncStorage.getItem(STORAGE_KEY);
      if (savedWallet) {
        const { publicKey: savedKey } = JSON.parse(savedWallet);
        setPublicKey(savedKey);
        updateBalances(savedKey);
      }
    } catch (error) {
      console.log('Failed to load wallet:', error);
    }
  };

  const saveWallet = async (key: string | null) => {
    try {
      if (key) {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ publicKey: key }));
      } else {
        await AsyncStorage.removeItem(STORAGE_KEY);
      }
    } catch (error) {
      console.log('Failed to save wallet:', error);
    }
  };

  const updateBalances = async (walletAddress: string) => {
    try {
      // Get SOL balance
      const pubKey = new PublicKey(walletAddress);
      const bal = await connection.getBalance(pubKey);
      setBalance(bal / 1e9);

      // Get token balance
      if (isTokenReady) {
        const tokBal = await getTokenBalance(walletAddress);
        setTokenBalance(tokBal);
      }
    } catch (error) {
      console.log('Failed to get balances:', error);
    }
  };

  const updateTokenBalance = async () => {
    if (publicKey) {
      try {
        const tokBal = await getTokenBalance(publicKey);
        setTokenBalance(tokBal);
      } catch (error) {
        console.log('Failed to get token balance:', error);
      }
    }
  };

  const connect = useCallback(async () => {
    setIsConnecting(true);

    try {
      if (Platform.OS === 'web') {
        // Web: Check for Phantom wallet
        const phantom = (window as any).phantom?.solana;

        if (phantom?.isPhantom) {
          const response = await phantom.connect();
          const key = response.publicKey.toString();
          setPublicKey(key);
          await saveWallet(key);
          await updateBalances(key);
        } else {
          window.open('https://phantom.app/', '_blank');
          throw new Error('Phantom wallet not found');
        }
      } else {
        // Mobile: Use deep linking to Phantom
        const phantomURL = 'phantom://';
        const canOpen = await Linking.canOpenURL(phantomURL);

        if (canOpen) {
          // For demo, generate a mock address
          // In production, use Mobile Wallet Adapter protocol
          const mockAddress = 'Demo' + Math.random().toString(36).substring(2, 8) + '...';
          setPublicKey(mockAddress);
          await saveWallet(mockAddress);
        } else {
          const storeURL = Platform.OS === 'ios'
            ? 'https://apps.apple.com/app/phantom-solana-wallet/id1598432977'
            : 'https://play.google.com/store/apps/details?id=app.phantom';
          await Linking.openURL(storeURL);
          throw new Error('Phantom wallet not installed');
        }
      }
    } catch (error) {
      console.log('Connection error:', error);
      throw error;
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    try {
      if (Platform.OS === 'web') {
        const phantom = (window as any).phantom?.solana;
        if (phantom) {
          await phantom.disconnect();
        }
      }
      setPublicKey(null);
      setBalance(0);
      setTokenBalance(0);
      await saveWallet(null);
    } catch (error) {
      console.log('Disconnect error:', error);
    }
  }, []);

  const claimRewards = useCallback(async (coins: number): Promise<boolean> => {
    if (!publicKey) {
      Alert.alert('Error', 'Please connect your wallet first');
      return false;
    }

    if (!isTokenReady) {
      Alert.alert('Error', 'Token system not initialized. Please try again later.');
      return false;
    }

    const rewardAmount = calculateReward(coins);
    if (rewardAmount <= 0) {
      Alert.alert('No Rewards', 'Collect at least 10 coins to earn $POOP tokens!');
      return false;
    }

    setIsClaiming(true);

    try {
      const signature = await executeClaim(publicKey, coins);

      if (signature) {
        // Update token balance
        await updateTokenBalance();

        Alert.alert(
          'Rewards Claimed!',
          `You received ${rewardAmount} $POOP tokens!\n\nTransaction: ${signature.slice(0, 20)}...`,
          [
            {
              text: 'View on Explorer',
              onPress: () => {
                const url = `https://explorer.solana.com/tx/${signature}?cluster=devnet`;
                if (Platform.OS === 'web') {
                  window.open(url, '_blank');
                } else {
                  Linking.openURL(url);
                }
              },
            },
            { text: 'OK' },
          ]
        );
        return true;
      } else {
        Alert.alert('Error', 'Failed to claim rewards. Please try again.');
        return false;
      }
    } catch (error) {
      console.error('Claim error:', error);
      Alert.alert('Error', 'Failed to claim rewards. Please try again.');
      return false;
    } finally {
      setIsClaiming(false);
    }
  }, [publicKey, isTokenReady]);

  return (
    <WalletContext.Provider
      value={{
        publicKey,
        isConnected: !!publicKey,
        isConnecting,
        balance,
        tokenBalance,
        connect,
        disconnect,
        claimRewards,
        isClaiming,
        isTokenReady,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}
