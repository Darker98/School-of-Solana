#![allow(deprecated, unexpected_cfgs)]

use anchor_lang::prelude::*;

declare_id!("81eTCSx3zoUi8Q2ewTPJgfiJk32AR1mXnSTj6BJ5aKa");

mod instructions;
mod state;
mod errors;

use instructions::*;

#[program]
pub mod timelock {
    use super::*;

    pub fn lock_sol(ctx: Context<LockSol>, seed: u64, locked_amount: u64, unlock_at: i64) -> Result<()> {
        ctx.accounts.init_pda(seed, locked_amount, unlock_at, &ctx.bumps)?;
        ctx.accounts.transfer_sol()
    }

    pub fn withdraw_sol(ctx: Context<WithdrawSol>) -> Result<()> {
        ctx.accounts.transfer_sol_to_user()
    }
}
