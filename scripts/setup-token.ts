/**
 * $POOP Token Setup Script
 *
 * This script:
 * 1. Creates a reward pool keypair
 * 2. Requests devnet SOL airdrop
 * 3. Creates the $POOP token mint
 * 4. Mints initial supply to the reward pool
 *
 * Run with: npx ts-node scripts/setup-token.ts
 */

import {
  Connection,
  Keypair,
  clusterApiUrl,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
} from '@solana/spl-token';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// ESM compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TOKEN_DECIMALS = 9;
const INITIAL_SUPPLY = 1_000_000; // 1 million $POOP tokens

async function main() {
  console.log('🚀 Setting up $POOP Token on Solana Devnet\n');

  // Connect to devnet
  const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
  console.log('✅ Connected to Solana Devnet');

  // Create reward pool keypair
  const rewardPoolKeypair = Keypair.generate();
  console.log(`✅ Reward Pool Address: ${rewardPoolKeypair.publicKey.toBase58()}`);

  // Save keypair to file (for demo purposes - in production use secure storage)
  const keypairPath = path.join(__dirname, '..', 'reward-pool-keypair.json');
  fs.writeFileSync(
    keypairPath,
    JSON.stringify(Array.from(rewardPoolKeypair.secretKey))
  );
  console.log(`✅ Keypair saved to: ${keypairPath}`);

  // Request airdrop
  console.log('\n⏳ Requesting SOL airdrop...');
  try {
    const airdropSignature = await connection.requestAirdrop(
      rewardPoolKeypair.publicKey,
      2 * LAMPORTS_PER_SOL // 2 SOL
    );
    await connection.confirmTransaction(airdropSignature, 'confirmed');
    console.log('✅ Airdrop successful: 2 SOL');
  } catch (error) {
    console.log('⚠️ Airdrop failed (may have reached limit). Continuing...');
  }

  // Check balance
  const balance = await connection.getBalance(rewardPoolKeypair.publicKey);
  console.log(`💰 Reward Pool Balance: ${balance / LAMPORTS_PER_SOL} SOL`);

  if (balance < 0.1 * LAMPORTS_PER_SOL) {
    console.log('\n❌ Insufficient SOL balance. Please fund the reward pool:');
    console.log(`   Address: ${rewardPoolKeypair.publicKey.toBase58()}`);
    console.log('   You can use: https://faucet.solana.com/');
    return;
  }

  // Create $POOP token mint
  console.log('\n⏳ Creating $POOP token mint...');
  const mintKeypair = Keypair.generate();

  const mint = await createMint(
    connection,
    rewardPoolKeypair, // payer
    rewardPoolKeypair.publicKey, // mint authority
    rewardPoolKeypair.publicKey, // freeze authority
    TOKEN_DECIMALS,
    mintKeypair // keypair for the mint
  );

  console.log(`✅ $POOP Token Mint: ${mint.toBase58()}`);

  // Save mint address
  const configPath = path.join(__dirname, '..', 'token-config.json');
  fs.writeFileSync(
    configPath,
    JSON.stringify(
      {
        mint: mint.toBase58(),
        rewardPool: rewardPoolKeypair.publicKey.toBase58(),
        decimals: TOKEN_DECIMALS,
        network: 'devnet',
      },
      null,
      2
    )
  );
  console.log(`✅ Token config saved to: ${configPath}`);

  // Create token account for reward pool
  console.log('\n⏳ Creating reward pool token account...');
  const rewardPoolTokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    rewardPoolKeypair,
    mint,
    rewardPoolKeypair.publicKey
  );
  console.log(`✅ Reward Pool Token Account: ${rewardPoolTokenAccount.address.toBase58()}`);

  // Mint initial supply
  console.log(`\n⏳ Minting ${INITIAL_SUPPLY.toLocaleString()} $POOP tokens...`);
  const mintAmount = BigInt(INITIAL_SUPPLY) * BigInt(10 ** TOKEN_DECIMALS);

  await mintTo(
    connection,
    rewardPoolKeypair,
    mint,
    rewardPoolTokenAccount.address,
    rewardPoolKeypair, // mint authority
    mintAmount
  );
  console.log(`✅ Minted ${INITIAL_SUPPLY.toLocaleString()} $POOP to reward pool`);

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('🎉 $POOP TOKEN SETUP COMPLETE!');
  console.log('='.repeat(50));
  console.log(`\n📋 Token Details:`);
  console.log(`   Name: $POOP`);
  console.log(`   Mint: ${mint.toBase58()}`);
  console.log(`   Decimals: ${TOKEN_DECIMALS}`);
  console.log(`   Network: Devnet`);
  console.log(`\n💰 Reward Pool:`);
  console.log(`   Address: ${rewardPoolKeypair.publicKey.toBase58()}`);
  console.log(`   Token Account: ${rewardPoolTokenAccount.address.toBase58()}`);
  console.log(`   Balance: ${INITIAL_SUPPLY.toLocaleString()} $POOP`);
  console.log('\n✨ Ready to distribute rewards!');
}

main().catch(console.error);
