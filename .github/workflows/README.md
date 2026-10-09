# GitHub Actions Workflows

This directory contains automated workflows for testing and deployment.

## Workflows

### test.yml
Runs on every push and pull request to main/develop branches.
- Installs dependencies across all workspaces
- Runs backend test suite against PostgreSQL
- Builds backend and frontend

### deploy.yml
Runs on every push to main branch.
- Connects to VPS via SSH
- Pulls latest code
- Restarts Docker containers

## Required Secrets

Configure these secrets in GitHub repository settings:

- **SSH_PRIVATE_KEY**: Private SSH key for VPS access
- **VPS_HOST**: VPS hostname or IP address
- **VPS_USER**: Username for VPS login

## Setup Instructions

1. Generate SSH key pair (if you don't have one):
   ```bash
   ssh-keygen -t rsa -b 4096 -f ~/.ssh/deploy_key
   ```

2. Add public key to VPS:
   ```bash
   ssh-copy-id -i ~/.ssh/deploy_key.pub user@vps_host
   ```

3. Add secrets to GitHub:
   - Go to Settings → Secrets and variables → Actions
   - Create new repository secret `SSH_PRIVATE_KEY` with private key content
   - Create new repository secret `VPS_HOST` with VPS IP/hostname
   - Create new repository secret `VPS_USER` with VPS username

4. Update deploy.yml with correct path on VPS
