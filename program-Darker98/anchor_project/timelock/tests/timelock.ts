import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Timelock } from "../target/types/timelock";
import { assert } from "chai";
import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import path from "path"
import os from "os"
import fs from "fs"
 
describe("Lock SOL tests", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.local();
  anchor.setProvider(anchor.AnchorProvider.env());

  // const walletPath = path.join(os.homedir(), ".config/solana/Turbin3.json");
  // const provider = new anchor.AnchorProvider(
  //   new anchor.web3.Connection("https://api.devnet.solana.com", "confirmed"),
  //   new anchor.Wallet(anchor.web3.Keypair.fromSecretKey(
  //     Uint8Array.from(JSON.parse(require("fs").readFileSync(walletPath, "utf-8")))
  //   )),
  //   {
  //     preflightCommitment: "confirmed",
  //   }
  // );

  anchor.setProvider(provider);

  const program = anchor.workspace.timelock as Program<Timelock>;

  let user1 = anchor.web3.Keypair.generate();
  let user2 = anchor.web3.Keypair.generate();

  const getVaultPda = (seed: number, wallet: PublicKey) => 
    PublicKey.findProgramAddressSync(
      [Buffer.from("pda"), new anchor.BN(seed).toArrayLike(Buffer, "le", 8), wallet.toBuffer()],
      program.programId
    )

  const getVault = (pda: PublicKey) => 
    PublicKey.findProgramAddressSync(
      [Buffer.from("vault"), pda.toBuffer()],
      program.programId
    )

  // Setup SOL funder 
  const funderKeyPath = path.join(os.homedir(), ".config/solana/Turbin3.json");
  const funderKeyString = fs.readFileSync(funderKeyPath, { encoding: "utf8" });
  const funderSecretKey = Uint8Array.from(JSON.parse(funderKeyString));
  const sender = Keypair.fromSecretKey(funderSecretKey);

  // Connect to devnet
  const connection = new Connection("https://api.devnet.solana.com", "confirmed");

  const sendSol = async (recipient: Keypair) => {
    const tx = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: sender.publicKey,
        toPubkey: recipient.publicKey,
        lamports: 1 * LAMPORTS_PER_SOL, // 1 SOL
      })
    );

    const signature = await connection.sendTransaction(tx, [sender]);

    // Wait for confirmation
    await connection.confirmTransaction(signature, "confirmed");
    console.log("Airdrop successful!");
  }

  before(async () => { 
    // Fund test wallets 
    for (let k of [user1, user2]) { 
      await provider.connection.confirmTransaction( 
        await provider.connection.requestAirdrop(k.publicKey, 2 * LAMPORTS_PER_SOL), 
        "confirmed" 
      ); 
    } 
  });

  // before(async () => {
  //   // Fund test wallets
  //   for (let k of [user1, user2]) {
  //     await sendSol(k)
  //   }
  // });

  it("User 1 locks SOL", async () => {
    // Define data
    const seed = 1;
    const locked_amount = 0.5 * LAMPORTS_PER_SOL;
    const unlock_at = new Date(Date.now() + 3 * 1000);
    const timestamp: number = Math.floor(unlock_at.getTime() / 1000);

    // Get PDAs
    const [vaultPda] = getVaultPda(seed, user1.publicKey);
    const [vault] = getVault(vaultPda);

    // Perform transaction
    let txSig = await program.methods
      .lockSol(new anchor.BN(seed), new anchor.BN(locked_amount), new anchor.BN(timestamp))
      .accounts({
        user: user1.publicKey,
        vaultPda,
        vault,
        systemProgram: SystemProgram.programId
      })
      .signers([user1])
      .rpc();
    
    // Ensure data on chain is correct
    const vaultPdaData = await program.account.vaultPda.fetch(vaultPda);
    const vaultInfo = await provider.connection.getAccountInfo(vault);
    assert.ok(vaultInfo !== null, "Vault account should exist");

    assert.strictEqual(vaultPdaData.seed.toString(), seed.toString(), "Seed doesn't match");
    assert.strictEqual(vaultPdaData.lockedAmount.toString(), locked_amount.toString(), "Locked amount doesn't match");
    assert.strictEqual(vaultPdaData.unlockAt.toString(), timestamp.toString(), "Unlock-at time doesn't match");
    assert.strictEqual(vaultInfo.lamports, locked_amount, "Vault balance should equal the locked amount");
  });

  it("User 2 locks SOL", async () => {
    // Define data
    const seed = 1;
    const locked_amount = 0.5 * LAMPORTS_PER_SOL;
    const unlock_at = new Date(Date.now() + 1000 * 1000);
    const timestamp: number = Math.floor(unlock_at.getTime() / 1000);

    // Get PDAs
    const [vaultPda] = getVaultPda(seed, user2.publicKey);
    const [vault] = getVault(vaultPda);

    // Perform transaction
    let txSig = await program.methods
      .lockSol(new anchor.BN(seed), new anchor.BN(locked_amount), new anchor.BN(timestamp))
      .accounts({
        user: user2.publicKey,
        vaultPda,
        vault,
        systemProgram: SystemProgram.programId
      })
      .signers([user2])
      .rpc();
    
    // Ensure data on chain is correct
    const vaultPdaData = await program.account.vaultPda.fetch(vaultPda);
    const vaultInfo = await provider.connection.getAccountInfo(vault);
    assert.ok(vaultInfo !== null, "Vault account should exist");

    assert.strictEqual(vaultPdaData.seed.toString(), seed.toString(), "Seed doesn't match");
    assert.strictEqual(vaultPdaData.lockedAmount.toString(), locked_amount.toString(), "Locked amount doesn't match");
    assert.strictEqual(vaultPdaData.unlockAt.toString(), timestamp.toString(), "Unlock-at time doesn't match");
    assert.strictEqual(vaultInfo.lamports, locked_amount, "Vault balance should equal the locked amount");
  });

  it("User 1 tries to lock insufficient SOL", async () => {
    // Define data
    const seed = 2;
    const locked_amount = 1000 * LAMPORTS_PER_SOL;
    const unlock_at = new Date(Date.now() + 5 * 1000);
    const timestamp: number = Math.floor(unlock_at.getTime() / 1000);

    // Get PDAs
    const [vaultPda] = getVaultPda(seed, user1.publicKey);
    const [vault] = getVault(vaultPda);

    // Perform transaction
    let flag = "This should fail";
    try {
      await program.methods
        .lockSol(new anchor.BN(seed), new anchor.BN(locked_amount), new anchor.BN(timestamp))
        .accounts({
          user: user1.publicKey,
          vaultPda,
          vault,
          systemProgram: SystemProgram.programId
        })
        .signers([user1])
        .rpc();
    } catch (error) {
      assert.isTrue(error.toString().includes("insufficient lamports"), error.toString());
      flag = "Failed";
    }
    assert.strictEqual(flag, "Failed", "Insufficient funds should fail");
  });

  it("User 1 tries to lock zero SOL", async () => {
    // Define data
    const seed = 2;
    const locked_amount = 0 * LAMPORTS_PER_SOL;
    const unlock_at = new Date(Date.now() + 5 * 1000);
    const timestamp: number = Math.floor(unlock_at.getTime() / 1000);

    // Get PDAs
    const [vaultPda] = getVaultPda(seed, user1.publicKey);
    const [vault] = getVault(vaultPda);

    // Perform transaction
    let flag = "This should fail";
    try {
      await program.methods
        .lockSol(new anchor.BN(seed), new anchor.BN(locked_amount), new anchor.BN(timestamp))
        .accounts({
          user: user1.publicKey,
          vaultPda,
          vault,
          systemProgram: SystemProgram.programId
        })
        .signers([user1])
        .rpc();
    } catch (error) {
      assert.isTrue(error.toString().includes("LockingZeroSolError"), error.toString());
      flag = "Failed";
    }
    assert.strictEqual(flag, "Failed", "Locking zero SOL should fail");
  });

  it("User 2 tries to withdraw when unlock time isn't passed", async () => {
    // Define data
    const seed = 1;

    // Get PDAs
    const [vaultPda] = getVaultPda(seed, user2.publicKey);
    const [vault] = getVault(vaultPda);

    // Perform transaction
    let flag = "This should fail";
    try {
      await program.methods
        .withdrawSol()
        .accounts({
          user: user2.publicKey,
          vaultPda,
          vault,
          systemProgram: SystemProgram.programId
        })
        .signers([user2])
        .rpc();
    } catch (error) {
      assert.isTrue(error.toString().includes("UnlockTimeNotReached"), error.toString());
      flag = "Failed";
    }
    assert.strictEqual(flag, "Failed", "Withdrawing before unlock time should fail");
  });

  it("User 2 tries to withdraw user 1's SOL", async () => {
    // Define data
    const seed = 1;

    // Get PDAs
    const [vaultPda] = getVaultPda(seed, user1.publicKey);
    const [vault] = getVault(vaultPda);

    // Perform transaction
    let flag = "This should fail";
    try {
      await program.methods
        .withdrawSol()
        .accounts({
          user: user2.publicKey,
          vaultPda,
          vault,
          systemProgram: SystemProgram.programId
        })
        .signers([user2])
        .rpc();
    } catch (error) {
      assert.isTrue(error.toString().includes("seeds constraint was violated"), error.toString());
      flag = "Failed";
    }
    assert.strictEqual(flag, "Failed", "Can't withdraw someone else's locked SOL");
  });

  it("User 1 withdraws SOL", async () => {
    // Define data
    const seed = 1;

    // Get PDAs
    const [vaultPda] = getVaultPda(seed, user1.publicKey);
    const [vault] = getVault(vaultPda);

    // Wait until after unlock time
    await new Promise((resolve) => setTimeout(resolve, 3000));  

    // Perform transaction
    let txSig = await program.methods
      .withdrawSol()
      .accounts({
        user: user1.publicKey,
        vaultPda,
        vault,
        systemProgram: SystemProgram.programId
      })
      .signers([user1])
      .rpc();
    
    // Ensure data on chain is correct
    let flag = "This should fail";
    try {
    const vaultPdaData = await program.account.vaultPda.fetch(vaultPda);
    } catch (error) {
      flag = "Failed";
    }
    assert.strictEqual(flag, "Failed", "Vault PDA should be closed");
    const vaultInfo = await provider.connection.getAccountInfo(vault);
    assert.ok(vaultInfo == null, "Vault account shouldn't exist");
  });
});
