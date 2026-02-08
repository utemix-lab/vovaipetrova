# Checkpoints

This repository uses lightweight checkpoints to keep UI/scene changes safe and reversible.

## Workflow

- **Before risky edits**: create a checkpoint tag + branch.
- **After validation**: update this file with the checkpoint name and brief notes.
- **Rollback**: `git checkout <checkpoint-branch>` or `git checkout tags/<checkpoint-tag>`.

## First checkpoint

- **Tag**: `checkpoint-20260208-1`
- **Branch**: `checkpoint/20260208-1`
- **Notes**: Restored UI scene with Story dots + narrative mini-screen; route highlight disabled.
