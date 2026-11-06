Commit all staged changes and push to current branch.

Steps:
1. Run `git status --short` to show wht will be committed.
2. Run `git diff --staged` to review the staded changes.
3. Write a commit message in conventional commit format (e.g. `feat:`, `fix:`, `chore:`, `refactor:`, etc.) based on what is staged.
4. Run `git commit -m "<mesage>"` with that commit message.
5. Run `git push origin <current-branch>` using the current branch name. 