Commit all staged changes and push to current branch.

Steps:
1. Run `git status --short` to show what will be committed.
2. Run `git diff --staged` to review the staged changes.
3. Write a commit message in conventional commit format (e.g. `feat:`, `fix:`, `chore:`, `refactor:`, etc.) based on what is staged.
4. Run `git commit -m "<message>"` with that commit message.
5. Run `git push origin <current-branch>` using the current branch name. 