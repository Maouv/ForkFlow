from app.engine.memory import assemble, ContextEntry


def test_full_history_3_entries():
    context = [
        ContextEntry(sender="user", output="What is 2+2?"),
        ContextEntry(sender="planner", output="Let me calculate that."),
        ContextEntry(sender="calculator", output="4"),
    ]
    msgs = assemble("full_history", "You are helpful", context, "Next question")
    assert msgs[0] == {"role": "system", "content": "You are helpful"}
    assert "Previous context:" in msgs[1]["content"]
    assert "{user}: What is 2+2?" in msgs[1]["content"]
    assert "{planner}: Let me calculate that." in msgs[1]["content"]
    assert "{calculator}: 4" in msgs[1]["content"]
    assert msgs[2] == {"role": "user", "content": "Next question"}


def test_previous_only_3_entries():
    context = [
        ContextEntry(sender="user", output="first"),
        ContextEntry(sender="planner", output="second"),
        ContextEntry(sender="reviewer", output="third"),
    ]
    msgs = assemble("previous_only", "You are helpful", context, "go")
    assert msgs[0] == {"role": "system", "content": "You are helpful"}
    # Only last entry
    assert msgs[1] == {"role": "user", "content": "{reviewer}: third"}
    assert msgs[2] == {"role": "user", "content": "go"}
    assert len(msgs) == 3


def test_full_history_empty_context():
    msgs = assemble("full_history", "You are helpful", [], "first message")
    assert len(msgs) == 2
    assert msgs[0] == {"role": "system", "content": "You are helpful"}
    assert msgs[1] == {"role": "user", "content": "first message"}


def test_previous_only_empty_context():
    msgs = assemble("previous_only", "You are helpful", [], "first message")
    assert len(msgs) == 2
    assert msgs[1] == {"role": "user", "content": "first message"}


def test_full_history_truncation():
    """Context > 8000 chars → truncated to most recent entries."""
    # Create entries that exceed 8000 chars total
    big_output = "x" * 3000
    context = [
        ContextEntry(sender="old", output=big_output),  # ~3010 chars
        ContextEntry(sender="mid", output=big_output),  # ~3010 chars
        ContextEntry(sender="new", output=big_output),  # ~3010 chars
    ]
    # Total ~9030 chars > 8000
    msgs = assemble("full_history", "sys", context, "input")
    context_msg = msgs[1]["content"]
    # Should contain "new" entry (most recent)
    assert "{new}:" in context_msg
    # Should NOT contain "old" entry (oldest, truncated)
    assert "{old}:" not in context_msg
    # Total context portion should be under 8000
    assert len(context_msg) < 8000 + 200  # allow for "Previous context:\n" prefix


def test_truncation_keeps_most_recent():
    """When truncating, keep the latest entries."""
    context = [
        ContextEntry(sender="a", output="aaa"),
        ContextEntry(sender="b", output="bbb"),
        ContextEntry(sender="c", output="ccc"),
    ]
    msgs = assemble("full_history", "sys", context, "input")
    # Small context → no truncation, all present
    assert "{a}:" in msgs[1]["content"]
    assert "{b}:" in msgs[1]["content"]
    assert "{c}:" in msgs[1]["content"]


def test_user_sender_format():
    context = [ContextEntry(sender="user", output="hello")]
    msgs = assemble("full_history", "sys", context, "next")
    assert "{user}: hello" in msgs[1]["content"]
