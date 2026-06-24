from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    forkflow_username: str = "admin"
    forkflow_password: str = "changeme"
    forkflow_encryption_key: str = ""
    forkflow_db_path: str = "/data/forkflow.db"
    forkflow_sandbox_dir: str = "/data/sandbox"
    forkflow_host: str = "0.0.0.0"
    forkflow_port: int = 8000
    forkflow_max_concurrent_provider_calls: int = 5

    model_config = {"env_file": ".env"}


settings = Settings()
