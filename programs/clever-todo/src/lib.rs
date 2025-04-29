use anchor_lang::prelude::*;

pub mod constant;
pub mod error;
pub mod states;
use crate::{constant::*, error::*, states::*};

declare_id!("2og7BbvrvbPjVeuULsWXKggN6gHBSim82L3X4pciucQ7");

#[program]
pub mod clever_todo {
    use super::*;

    pub fn initialize_user(ctx: Context<InitializeUser>) -> Result<()> {
        msg!("Initializing user profile for authority: {}", ctx.accounts.authority.key());

        let user_profile = &mut ctx.accounts.user_profile;
        user_profile.authority = ctx.accounts.authority.key();
        user_profile.last_todo = 0;
        user_profile.todo_count = 0;

        msg!("User profile initialized with authority: {}, last_todo: {}, todo_count: {}", 
             ctx.accounts.authority.key(), user_profile.last_todo, user_profile.todo_count);

        Ok(())
    }

    pub fn add_todo(ctx: Context<AddTodo>, _content: String) -> Result<()> {
        msg!("Adding todo for authority: {}", ctx.accounts.authority.key());

        let todo_account = &mut ctx.accounts.todo_account;
        let user_profile = &mut ctx.accounts.user_profile;

        todo_account.authority = ctx.accounts.authority.key();
        todo_account.idx = user_profile.last_todo;
        todo_account.content = _content.clone();
        todo_account.marked = false;

        user_profile.last_todo = user_profile.last_todo.checked_add(1).unwrap();
        user_profile.todo_count = user_profile.todo_count.checked_add(1).unwrap();

        msg!("Todo added: idx: {}, content: {}, last_todo updated to: {}, todo_count updated to: {}",
             todo_account.idx, _content, user_profile.last_todo, user_profile.todo_count);

        Ok(())
    }

    pub fn mark_todo(ctx: Context<MarkTodo>, todo_idx: u8) -> Result<()> {
        msg!("Marking todo with idx: {} as complete by authority: {}", todo_idx, ctx.accounts.authority.key());

        let todo_account = &mut ctx.accounts.todo_account;
        require!(!todo_account.marked, TodoError::AlreadyMarked);

        todo_account.marked = true;
        msg!("Todo with idx: {} marked as complete.", todo_idx);

        Ok(())
    }

    pub fn remove_todo(ctx: Context<RemoveTodo>, todo_idx: u8) -> Result<()> {
        msg!("Removing todo with idx: {} by authority: {}", todo_idx, ctx.accounts.authority.key());

        let user_profile = &mut ctx.accounts.user_profile;
        user_profile.todo_count = user_profile.todo_count.checked_sub(1).unwrap();

        msg!("Todo with idx: {} removed. Updated todo_count: {}", todo_idx, user_profile.todo_count);

        Ok(())
    }
}

#[derive(Accounts)]
#[instruction()]
pub struct InitializeUser<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        seeds = [USER_TAG, authority.key().as_ref()],
        bump,
        payer = authority,
        space = 8 + std::mem::size_of::<UserProfile>(),
    )]
    pub user_profile: Box<Account<'info, UserProfile>>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction()]
pub struct AddTodo<'info> {
    #[account(
        mut,
        seeds = [USER_TAG, authority.key().as_ref()],
        bump,
        has_one = authority,
    )]
    pub user_profile: Box<Account<'info, UserProfile>>,

    #[account(
        init,
        seeds = [TODO_TAG, authority.key().as_ref(), &[user_profile.last_todo as u8].as_ref()],
        bump,
        payer = authority,
        space = std::mem::size_of::<TodoAccount>() + 8,
    )]
    pub todo_account: Box<Account<'info, TodoAccount>>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(todo_idx: u8)]
pub struct MarkTodo<'info> {
    #[account(
        mut,
        seeds = [USER_TAG, authority.key().as_ref()],
        bump,
        has_one = authority
    )]
    pub user_profile: Box<Account<'info, UserProfile>>,

    #[account(
        mut,
        seeds = [TODO_TAG, authority.key().as_ref(), &[todo_idx].as_ref()],
        bump, 
        has_one = authority,
    )]
    pub todo_account: Box<Account<'info, TodoAccount>>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(todo_idx: u8)]
pub struct RemoveTodo<'info> {
    #[account(
        mut,
        seeds = [USER_TAG, authority.key().as_ref()],
        bump,
        has_one = authority
    )]
    pub user_profile: Box<Account<'info, UserProfile>>,

    #[account(
        mut,
        close = authority, 
        seeds = [TODO_TAG, authority.key().as_ref(), &[todo_idx].as_ref()],
        bump, 
        has_one = authority,
    )]
    pub todo_account: Box<Account<'info, TodoAccount>>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}
