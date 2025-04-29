use anchor_lang::prelude::*;

#[error_code]
pub enum TodoError {
    #[msg("You are not authorized to perform this action.")]
    Unauthorized,
    #[msg("Not allowed.")]
    NotAllowed,
    #[msg("Math operation overflow.")]
    MathOverflow,
    #[msg("Todo is already marked.")]
    AlreadyMarked,
}
