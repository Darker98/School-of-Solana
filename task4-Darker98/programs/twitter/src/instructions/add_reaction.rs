//-------------------------------------------------------------------------------
///
/// TASK: Implement the add reaction functionality for the Twitter program
/// 
/// Requirements:
/// - Initialize a new reaction account with proper PDA seeds
/// - Increment the appropriate counter (likes or dislikes) on the tweet
/// - Set reaction fields: type, author, parent tweet, and bump
/// - Handle both Like and Dislike reaction types
/// 
///-------------------------------------------------------------------------------

use anchor_lang::prelude::*;

use crate::errors::TwitterError;
use crate::states::*;

pub fn add_reaction(ctx: Context<AddReactionContext>, reaction: ReactionType) -> Result<()> {
    // TODO: Implement add reaction functionality
    let tweet = &mut ctx.accounts.tweet;
    match reaction {
        ReactionType::Like => {
            require!(tweet.likes < u64::MAX, TwitterError::MaxLikesReached);
            tweet.likes += 1;
        }
        ReactionType::Dislike => {
            require!(tweet.dislikes < u64::MAX, TwitterError::MaxDislikesReached);
            tweet.dislikes += 1;
        }
    }

    ctx.accounts.tweet_reaction.set_inner(Reaction { 
        reaction_author: ctx.accounts.reaction_author.key(), 
        parent_tweet: ctx.accounts.tweet.key(), 
        reaction, 
        bump: ctx.bumps.tweet_reaction 
    });

    Ok(())
}

#[derive(Accounts)]
pub struct AddReactionContext<'info> {
    // TODO: Add required account constraints
    #[account(mut)]
    pub reaction_author: Signer<'info>,

    #[account(
        init,
        payer = reaction_author,
        space = Reaction::INIT_SPACE + 8,
        seeds = [TWEET_REACTION_SEED.as_bytes(), reaction_author.key().as_ref(), tweet.key().as_ref()],
        bump
    )]
    pub tweet_reaction: Account<'info, Reaction>,

    #[account(mut)]
    pub tweet: Account<'info, Tweet>,

    pub system_program: Program<'info, System>,
}
