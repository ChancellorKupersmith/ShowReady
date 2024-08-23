#!/bin/sh
pg_ctl -D ./.data/db -o "-k $(pwd)" start
