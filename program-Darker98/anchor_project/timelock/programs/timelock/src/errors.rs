use anchor_lang::error_code;


#[error_code]
pub enum TimeLockError {
    #[msg("Unlock timestamp cannot be in the past")]
    UnlockTimestampInPast,

    #[msg("Unlock time not reached yet")]
    UnlockTimeNotReached,

    #[msg("Disparity in locked amount and amount held in vault")]
    SolAmountNotMatching,

    #[msg("Cannot lock zero SOL")]
    LockingZeroSolError
}