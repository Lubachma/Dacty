.PHONY: dev install build preview test validate

# Lance le serveur de développement
dev:
	npm run dev

# Installe les dépendances
install:
	npm install

# Build de production (avec validation du corpus et vérif TypeScript)
build:
	npm run build

# Sert le build de production en local
preview:
	npm run preview

# Lance les tests
test:
	npm run test

# Valide le corpus de textes
validate:
	npm run validate:corpus
