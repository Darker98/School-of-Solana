use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct VaultPDA {
    pub seed: u64,
    pub locked_amount: u64,
    pub unlock_at: i64,
    pub bump: u8,
    pub vault_bump: u8
}