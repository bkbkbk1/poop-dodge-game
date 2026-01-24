import {
  Connection,
  PublicKey,
  Transaction,
  Keypair,
  clusterApiUrl,
} from '@solana/web3.js';
import {
  getOrCreateAssociatedTokenAccount,
  createMint,
  mintTo,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from '@solana/spl-token';

// Devnet connection
export const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');

// Token configuration
export const TOKEN_DECIMALS = 9;
export const TOKENS_PER_10_COINS = 1; // 10 coins = 1 $POOP token

// Store token mint address (will be set after token creation)
let tokenMintAddress: PublicKey | null = null;

// Reward pool keypair (in production, this should be secure)
// For demo, we generate a new one each time - in real app, load from secure storage
let rewardPoolKeypair: Keypair | null = null;

export const setTokenMint = (mintAddress: string) => {
  tokenMintAddress = new PublicKey(mintAddress);
};

export const getTokenMint = () => tokenMintAddress;

export const setRewardPool = (keypair: Keypair) => {
  rewardPoolKeypair = keypair;
};

export const getRewardPool = () => rewardPoolKeypair;

// Calculate reward amount
export const calculateReward = (coins: number): number => {
  return Math.floor(coins / 10) * TOKENS_PER_10_COINS;
};

// Calculate reward in lamports (with decimals)
export const calculateRewardLamports = (coins: number): bigint => {
  const tokens = calculateReward(coins);
  return BigInt(tokens) * BigInt(10 ** TOKEN_DECIMALS);
};

// Check if user has token account
export const hasTokenAccount = async (
  walletAddress: string
): Promise<boolean> => {
  if (!tokenMintAddress) return false;

  try {
    const wallet = new PublicKey(walletAddress);
    const tokenAccount = await getAssociatedTokenAddress(
      tokenMintAddress,
      wallet
    );
    const accountInfo = await connection.getAccountInfo(tokenAccount);
    return accountInfo !== null;
  } catch {
    return false;
  }
};

// Get user's $POOP balance
export const getTokenBalance = async (
  walletAddress: string
): Promise<number> => {
  if (!tokenMintAddress) return 0;

  try {
    const wallet = new PublicKey(walletAddress);
    const tokenAccount = await getAssociatedTokenAddress(
      tokenMintAddress,
      wallet
    );
    const balance = await connection.getTokenAccountBalance(tokenAccount);
    return Number(balance.value.uiAmount) || 0;
  } catch {
    return 0;
  }
};

// Create claim transaction
export const createClaimTransaction = async (
  userWalletAddress: string,
  coins: number
): Promise<Transaction | null> => {
  if (!tokenMintAddress || !rewardPoolKeypair) {
    console.log('Token mint or reward pool not initialized');
    return null;
  }

  const rewardAmount = calculateRewardLamports(coins);
  if (rewardAmount === BigInt(0)) {
    console.log('No rewards to claim');
    return null;
  }

  try {
    const userWallet = new PublicKey(userWalletAddress);
    const rewardPoolPublicKey = rewardPoolKeypair.publicKey;

    // Get or create user's token account
    const userTokenAccount = await getAssociatedTokenAddress(
      tokenMintAddress,
      userWallet
    );

    // Get reward pool's token account
    const rewardPoolTokenAccount = await getAssociatedTokenAddress(
      tokenMintAddress,
      rewardPoolPublicKey
    );

    const transaction = new Transaction();

    // Check if user token account exists
    const userTokenAccountInfo = await connection.getAccountInfo(userTokenAccount);

    if (!userTokenAccountInfo) {
      // Create associated token account for user
      transaction.add(
        createAssociatedTokenAccountInstruction(
          rewardPoolPublicKey, // payer
          userTokenAccount, // associated token account
          userWallet, // owner
          tokenMintAddress // mint
        )
      );
    }

    // Add transfer instruction
    transaction.add(
      createTransferInstruction(
        rewardPoolTokenAccount, // from
        userTokenAccount, // to
        rewardPoolPublicKey, // owner of from account
        rewardAmount // amount
      )
    );

    // Get recent blockhash
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = rewardPoolPublicKey;

    return transaction;
  } catch (error) {
    console.error('Error creating claim transaction:', error);
    return null;
  }
};

// Execute claim (sign and send transaction)
export const executeClaim = async (
  userWalletAddress: string,
  coins: number
): Promise<string | null> => {
  if (!rewardPoolKeypair) {
    console.log('Reward pool not initialized');
    return null;
  }

  try {
    const transaction = await createClaimTransaction(userWalletAddress, coins);
    if (!transaction) return null;

    // Sign with reward pool keypair
    transaction.sign(rewardPoolKeypair);

    // Send transaction
    const signature = await connection.sendRawTransaction(
      transaction.serialize()
    );

    // Wait for confirmation
    await connection.confirmTransaction(signature, 'confirmed');

    return signature;
  } catch (error) {
    console.error('Error executing claim:', error);
    return null;
  }
};
