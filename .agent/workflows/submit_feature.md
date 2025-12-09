---
description: Submit a new feature or fix via Pull Request
---

1. Create a new branch: `git checkout -b feat/your-feature-name`
2. Make your changes and commit them: `git commit -m "feat: description of changes"`
3. Push the branch to origin: `git push origin feat/your-feature-name`
4. Create a Pull Request using the link provided in the push output or via the GitHub CLI: `gh pr create --title "feat: description" --body "Detailed description"` (if `gh` is available) or manually on the web.
5. Wait for review/approval if required.
6. **DO NOT** merge to `main` locally unless explicitly instructed.
