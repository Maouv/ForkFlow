import os
import tempfile

# Set test DB path before any app imports
_tmp = tempfile.mkdtemp()
os.environ["FORKFLOW_DB_PATH"] = f"{_tmp}/forkflow_test.db"
os.environ["FORKFLOW_SANDBOX_DIR"] = f"{_tmp}/sandbox"
os.makedirs(os.environ["FORKFLOW_SANDBOX_DIR"], exist_ok=True)
