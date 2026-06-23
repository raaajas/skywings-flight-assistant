# Publishing to GitHub

Follow these steps once on your machine.

## 1. Add Git & GitHub CLI to PATH

Both are installed but may not be on PATH until you restart PowerShell.

```powershell
$env:Path = "C:\Program Files\Git\bin;C:\Program Files\GitHub CLI;$env:Path"

git --version
gh --version
```

## 2. Log in to GitHub

```powershell
gh auth login
```

Choose: **GitHub.com** → **HTTPS** → **Login with a web browser**.

## 3. Set your git identity (one time)

```powershell
git config --global user.name "Your Name"
git config --global user.email "your-email@example.com"
```

Use the same email as your GitHub account.

## 4. Commit and push

```powershell
cd C:\Users\Admin\Projects\flight-assistant
$env:Path = "C:\Program Files\Git\bin;C:\Program Files\GitHub CLI;$env:Path"

git add .
git status
```

Confirm **no** `apps/web/.env` or `functions/.secret.local` in the list.

```powershell
git commit -m "feat: SkyWings AI flight assistant capstone project"
gh repo create skywings-flight-assistant --public --source=. --remote=origin --push
```

### Manual alternative (no gh)

1. Create repo at https://github.com/new (name: `skywings-flight-assistant`, no README)
2. Run:

```powershell
git remote add origin https://github.com/YOUR_USERNAME/skywings-flight-assistant.git
git branch -M main
git push -u origin main
```

## 5. After push

- Description: *AI flight assistant with Firebase, Gemini, and React*
- Topics: `firebase`, `gemini`, `react`, `typescript`, `ai-agent`, `capstone`

## Secrets reminder

Never commit `apps/web/.env`, `functions/.secret.local`, or API keys. They are in `.gitignore`.
