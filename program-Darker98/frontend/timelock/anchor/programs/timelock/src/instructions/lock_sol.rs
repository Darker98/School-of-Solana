use anchor_lang::{prelude::*, system_program::{transfer, Transfer}};

use crate::{errors::TimeLockError, state::VaultPDA};


#[derive(Accounts)]
#[instruction(seed: u64)]
pub struct LockSol<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        init,
        payer = user,
        space = VaultPDA::INIT_SPACE + 8,
        seeds = [b"pda", seed.to_le_bytes().as_ref(), user.key().as_ref()],
        bump
    )]
    pub vault_pda: Account<'info, VaultPDA>,

    #[account(
        mut,
        seeds = [b"vault", vault_pda.key().as_ref()],
        bump
    )]
    pub vault: SystemAccount<'info>,

    pub system_program: Program<'info, System>
}

impl<'info> LockSol<'info> {
    pub fn init_pda(&mut self, seed: u64, locked_amount: u64, unlock_at: i64, bumps: &LockSolBumps) -> Result<()> {
        require!(locked_amount > 0, TimeLockError::LockingZeroSolError);

        let now = Clock::get()?.unix_timestamp;
        require!(now < unlock_at, TimeLockError::UnlockTimestampInPast);

        self.vault_pda.set_inner(VaultPDA { 
            seed, 
            locked_amount,
            unlock_at, 
            bump: bumps.vault_pda, 
            vault_bump: bumps.vault
        });

        Ok(())
    }

    pub fn transfer_sol(&mut self) -> Result<()> {
        let cpi_accounts = Transfer {
            from: self.user.to_account_info(),
            to: self.vault.to_account_info()
        };

        let cpi_program = self.system_program.to_account_info();

        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

        transfer(cpi_ctx, self.vault_pda.locked_amount)
    }
}