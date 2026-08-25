.PHONY: dev install build preview test validate

# Start the development server
dev:
	npm run dev

# Install dependencies
install:
	npm install

# Production build (with corpus validation and TypeScript check)
build:
	npm run build

# Serve the production build locally
preview:
	npm run preview

# Run the tests
test:
	npm run test

# Validate the text corpus
validate:
	npm run validate:corpus
