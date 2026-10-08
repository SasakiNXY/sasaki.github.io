# 1. Créer le dossier
mkdir kino-der-toten && cd kino-der-toten

# 2. Copier TOUS les fichiers ci-dessus dans leur arborescence respective

# 3. Installer
npm install

# 4. Lancer
npm run dev
# → http://localhost:5173 s'ouvre automatiquement

# 5. Pousser sur GitHub
git init
git add .
git commit -m "init: kino der toten browser zombies"
git branch -M main
git remote add origin https://github.com/TON_USERNAME/kino-der-toten.git
git push -u origin main