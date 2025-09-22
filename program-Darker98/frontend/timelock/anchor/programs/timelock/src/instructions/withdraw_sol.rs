use anchor_lang::{prelude::*, system_program::{transfer, Transfer}};

use crate::{errors::TimeLockError, state::VaultPDA};

#[derive(Accounts)]
pub struct WithdrawSol<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        close = user,
        seeds = [b"pda", vault_pda.seed.to_le_bytes().as_ref(), user.key().as_ref()],
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

impl<'info> WithdrawSol<'info> {
    pub fn transfer_sol_to_user(&mut self) -> Result<()> {
        let now = Clock::get()?.unix_timestamp;
        require!(now >= self.vault_pda.unlock_at, TimeLockError::UnlockTimeNotReached);
        require!(self.vault.lamports() == self.vault_pda.locked_amount, TimeLockError::SolAmountNotMatching);

        let cpi_accounts = Transfer {
            from: self.vault.to_account_info(),
            to: self.user.to_account_info()
        };

        let cpi_program = self.system_program.to_account_info();

        let seeds = &[b"vault", self.vault_pda.to_account_info().key.as_ref(), &[self.vault_pda.vault_bump]];
        let signer_seeds = &[&seeds[..]];

        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);

        transfer(cpi_ctx, self.vault.lamports())
    }
}