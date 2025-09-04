  1. Build Issues:
  # Always clean build when you get weird errors
  rm -rf .next node_modules
  rm -rf node_modules package-lock
  npm install
  npm run dev