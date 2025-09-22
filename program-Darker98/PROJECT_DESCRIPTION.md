# Project Description

**Deployed Frontend URL:** timelock-rose.vercel.app

**Solana Program ID:** 81eTCSx3zoUi8Q2ewTPJgfiJk32AR1mXnSTj6BJ5aKa

## Project Overview

### Description
A decentralized vault application built on Solana. Users can lock specified amounts of SOL for a specified amount of time. This can be useful for a variety of use cases, particularly in budgeting where users can preserve some of their SOL in case they go on a spending spree.

### Key Features
- **Lock SOL**: Users can lock specified amount of SOL until an unlock time.
- **Withdraw locked SOL**: Users can withdraw the SOL they locked after its unlock time has passed.
  
### How to Use the dApp
1. **Connect wallet** - Connect your Solana wallet
2. **Create a vault** - Click "Create vault" to initialize another vault where you can lock SOL
3. **Wait until unlock time** - Wait until the unlock time passes for that vault
4. **Withdraw SOL** - Click "Withdraw" to retreive your SOL back

## Program Architecture
TimeLock uses a simple architecture with two account types and two core instructions. The program leverages PDAs to uniquely create vaults to store users locked SOLs. 

### PDA Usage
The program uses PDAs to create unique vaults for every time a user wants to lock their SOL.

**PDAs Used:**
- **Vault PDA**: Derived from seeds `["pda", u64_random_seed, user_wallet_pubkey]` - stores metadata and bumps for each unique vault
- **Vault**: Derived from seeds `["vault", vault_pda_pubkey]` - system account which stores the actual locked SOL

### Program Instructions
**Instructions Implemented:**
- **lock_sol**: Creates a new vault PDA and vault which can hold the user's SOL until unlock time
- **withdraw_sol**: Returns SOL back to the user if unlock time is passed

### Account Structure
```rust
#[account]
pub struct VaultPDA {
    pub seed: u64, // Unique identifier for each vault
    pub locked_amount: u64, // The SOL amount to lock
    pub unlock_at: i64, // The unlock time of the locked SOL
    pub bump: u8, // The VaultPDA bump
    pub vault_bump: u8 // The vault system account bump
}
```

## Testing

### Test Coverage
Comprehensive test suite covering all instructions with both successful operations and error conditions to ensure program security and reliability.

**Happy Path Tests:**
- **Lock SOL**: Successfully locks SOL in a unique vault with correct metadata
- **Withdraw SOL**: Successfully withdraws SOL after unlock time and closes vault PDA account

**Unhappy Path Tests:**
- **Insufficient Funds**: Fails when trying to lock more SOL than you have in wallet
- **Non-existent Funds**: Fails when trying to lock zero or negative SOL
- **Unlock Time Not Passed**: Fails when trying to withdraw SOL before vault unlock time
- **Withdraw Unauthorized**: Fails when non-owner tries to withdraw someone else's locked SOL

### Running Tests
Please navigate to the tests in the anchor_project directory.

```bash
yarn install
anchor test
```

### Additional Notes for Evaluators
This is my first time ever working on any frontend myself. I have experience with dApp backend development though. So I tried to keep the backend as simple as possible while also satisfying the task criteria. Learnt a lot about frontend development in the process.
