import subprocess
import sys


def tool_execute_code(code: str) -> str:
    """Run Python code in subprocess, 10s timeout, capture stdout."""
    try:
        result = subprocess.run(
            [sys.executable, "-c", code],
            capture_output=True,
            text=True,
            timeout=10,
        )
        output = result.stdout
        if result.returncode != 0 and result.stderr:
            output += f"\nError: {result.stderr}"
        return output or "(no output)"
    except subprocess.TimeoutExpired:
        return "Error: code execution timed out (10s)"
