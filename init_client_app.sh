#!/bin/sh

START_DIR=$(pwd)

catch_err() {
  echo "ERR: $1"
  cd "$START_DIR" && exit 1
}

if [ ! -d "./client" ]; then
  # init react client side env
  pnpm create vite client --template react
  cd client || catch_err "Failed to cd into client directory"
  pnpm install || catch_err "Failed to install client dependencies"
  pnpm run build || catch_err "Failed to build client dist package"
fi

cd "$START_DIR" && exit 0