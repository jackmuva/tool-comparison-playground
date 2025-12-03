#!/bin/sh

# Set Session Name
SESSION="tool-comparison-playground"
SESSIONEXISTS=$(tmux list-sessions | grep $SESSION)

if [ "$SESSIONEXISTS" = "" ]
then
    tmux new-session -d -s $SESSION

    tmux rename-window -t 0 'nvim-win'
    tmux send-keys -t 'nvim' 'nvim' C-m

    tmux new-window -t $SESSION:1 -n 'next-server'
    tmux send-keys -t 'next-server' 'npm run dev' C-m
fi

# Attach Session, on the Main window
tmux attach-session -t $SESSION:0
