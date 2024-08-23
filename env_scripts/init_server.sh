#!/bin/sh

START_DIR=$(pwd)

catch_err() {
  echo "ERR: $1"
  cd "$START_DIR" && exit 1
}

if [ ! -d "./server" ]; then
  # init backend server side env
  mkdir server
  cd server
  pnpm init
#   pnpm install || catch_err "Failed to install client dependencies"
#   pnpm run build || catch_err "Failed to build client dist package"
fi

# pg_ctl -D .data/db -l logfile -o "--unix_socket_directories='$PWD'" start

cd "$START_DIR" && exit 0