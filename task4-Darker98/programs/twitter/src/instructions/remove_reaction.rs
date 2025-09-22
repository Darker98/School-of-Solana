//-------------------------------------------------------------------------------
///
/// TASK: Implement the remove reaction functionality for the Twitter program
/// 
/// Requirements:
/// - Verify that the tweet reaction exists and belongs to the reaction author
/// - Decrement the appropriate counter (likes or dislikes) on the tweet
/// - Close the tweet reaction account and return rent to reaction author
/// 
///-------------------------------------------------------------------------------

use anchor_lang::prelude::*;

use crate::errors::TwitterError;
use crate::states::*;

pub fn remove_reaction(ctx: Context<RemoveReactionContext>) -> Result<()> {
    // TODO: Implement remove reaction functionality
    require_keys_eq!(ctx.accounts.tweet_reaction.reaction_author, ctx.accounts.reaction_author.key());

    match ctx.accounts.tweet_reaction.reaction {
        ReactionType::Like => {
            require!(ctx.accounts.tweet.likes > 0, TwitterError::MinLikesReached);
            ctx.accounts.tweet.likes -= 1;
        }
        ReactionType::Dislike => {
            require!(ctx.accounts.tweet.dislikes > 0, TwitterError::MinDislikesReached);
            ctx.accounts.tweet.dislikes -= 1;
        }
    }

    Ok(())
}

#[derive(Accounts)]
pub struct RemoveReactionContext<'info> {
    // TODO: Add required account constraints
    #[account(mut)]
    pub reaction_author: Signer<'info>,

    #[account(
        mut,
        close = reaction_author,
        seeds = [TWEET_REACTION_SEED.as_bytes(), reaction_author.key().as_ref(), tweet.key().as_ref()],
        bump = tweet_reaction.bump
    )]
    pub tweet_reaction: Account<'info, Reaction>,

    #[account(mut)]
    pub tweet: Account<'info, Tweet>,
}
