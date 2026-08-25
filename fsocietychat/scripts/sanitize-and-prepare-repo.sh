set -euo pipefail


if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "Warning: not a git repository. You can still run this to sanitize files, but commit steps will be skipped."
fi


[ -f .env ] && cp -n .env .env.bak || true
[ -f backend/.env ] && cp -n backend/.env backend/.env.bak || true

cat > .env <<'EOF'
# Root environment placeholders — DO NOT COMMIT real secrets
MONGO_URI=your_mongodb_uri_here
EOF

mkdir -p backend
cat > backend/.env <<'EOF'
# Backend environment placeholders — DO NOT COMMIT real secrets
JWT_SECRET=your_jwt_secret_here
MONGODB_URI=your_mongodb_uri_here
CLIENT_ORIGIN=http://localhost:5173
PORT=4000
EOF

grep -qF ".env" .gitignore || echo ".env" >> .gitignore
grep -qF "backend/.env" .gitignore || echo "backend/.env" >> .gitignore
grep -qF "node_modules/" .gitignore || echo "node_modules/" >> .gitignore
grep -qF "**/node_modules/" .gitignore || echo "**/node_modules/" >> .gitignore

cat > .env.example <<'EOF'
# Example env (placeholders only)
MONGO_URI=your_mongodb_uri_here
JWT_SECRET=your_jwt_secret_here
PORT=4000
VITE_API_URL=http://localhost:4000
EOF

cat > backend/.env.example <<'EOF'
# Backend example env (placeholders)
JWT_SECRET=your_jwt_secret_here
MONGODB_URI=your_mongodb_uri_here
CLIENT_ORIGIN=http://localhost:5173
PORT=4000
EOF

if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  git ls-files --error-unmatch .env >/dev/null 2>&1 && git rm --cached .env || true
  git ls-files --error-unmatch backend/.env >/dev/null 2>&1 && git rm --cached backend/.env || true

  git add .gitignore .env.example backend/.env.example scripts/sanitize-and-prepare-repo.sh || true
  if git commit -m "chore: add env examples, sanitize envs, and update .gitignore"; then
    echo "Committed sanitized envs and examples." 
  else
    echo "Nothing to commit or commit failed (check 'git status')." 
  fi
else
  echo "Not a git repo — sanitizer completed but no commits made. Initialize a git repo and commit safe files when ready."
fi

echo "Sanitization complete. Backups: .env.bak, backend/.env.bak (if they existed)."

echo "NEXT: rotate any credentials that were exposed earlier (MongoDB user password, JWT secret)."
