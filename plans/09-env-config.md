## 9. Environment Configuration

### `.env.example`

```env
# Auth
FORKFLOW_USERNAME=admin
FORKFLOW_PASSWORD=changeme

# Encryption (generate: python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())")
FORKFLOW_ENCRYPTION_KEY=

# Database
FORKFLOW_DB_PATH=/data/forkflow.db

# Sandbox
FORKFLOW_SANDBOX_DIR=/data/sandbox

# Server
FORKFLOW_HOST=0.0.0.0
FORKFLOW_PORT=8000

# Rate limiting
FORKFLOW_MAX_CONCURRENT_PROVIDER_CALLS=5
```

### `docker-compose.yml`

```yaml
version: "3.8"
services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    volumes:
      - ./data:/data
    env_file: .env
    restart: unless-stopped

  frontend:
    build: ./frontend
    ports:
      - "3000:80"
    depends_on:
      - backend
    restart: unless-stopped
```

---
