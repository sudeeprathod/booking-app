#!/bin/bash

echo "Setting up Booking App..."

# Backend setup
echo "Setting up backend..."
cd backend
npm install
if [ ! -f .env ]; then
  cp .env.example .env
  echo "Created .env file. Please update it with your MongoDB URI."
fi

# Setup husky for backend
npx husky install || echo "Husky setup skipped (may need manual setup)"

cd ..

# Frontend setup
echo "Setting up frontend..."
cd frontend
npm install

# Setup husky for frontend
npx husky install || echo "Husky setup skipped (may need manual setup)"

cd ..

echo "Setup complete!"
echo ""
echo "To start development:"
echo "  Backend:  cd backend && npm run dev"
echo "  Frontend: cd frontend && npm run dev"
echo ""
echo "To run tests:"
echo "  Backend:  cd backend && npm test"
echo "  Frontend: cd frontend && npm test"
