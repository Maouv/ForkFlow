import pytest

from app.engine.router import evaluate_edges, EdgeForEval


def _edges(*specs):
    """Build edge list from (target, type, value) tuples."""
    return [EdgeForEval(target_node_id=t, condition_type=ct, condition_value=v)
            for t, ct, v in specs]


def test_none_condition_routes():
    edges = _edges((2, "none", None))
    assert evaluate_edges(edges, "anything") == 2


def test_contains_match():
    edges = _edges((2, "contains", "APPROVED"))
    assert evaluate_edges(edges, "Status: APPROVED") == 2


def test_contains_no_match():
    edges = _edges((2, "contains", "APPROVED"))
    assert evaluate_edges(edges, "Status: PENDING") is None


def test_not_contains_match():
    edges = _edges((2, "not_contains", "ERROR"))
    assert evaluate_edges(edges, "all good") == 2


def test_not_contains_no_match():
    edges = _edges((2, "not_contains", "ERROR"))
    assert evaluate_edges(edges, "ERROR: something broke") is None


def test_json_path_eq_string():
    edges = _edges((2, "json_path", 'verdict == "APPROVED"'))
    assert evaluate_edges(edges, '{"verdict": "APPROVED"}') == 2


def test_json_path_eq_string_no_match():
    edges = _edges((2, "json_path", 'verdict == "APPROVED"'))
    assert evaluate_edges(edges, '{"verdict": "PENDING"}') is None


def test_json_path_gt_match():
    edges = _edges((2, "json_path", "score > 7"))
    assert evaluate_edges(edges, '{"score": 8}') == 2


def test_json_path_gt_no_match():
    edges = _edges((2, "json_path", "score > 7"))
    assert evaluate_edges(edges, '{"score": 5}') is None


def test_json_path_gte():
    edges = _edges((2, "json_path", "score >= 7"))
    assert evaluate_edges(edges, '{"score": 7}') == 2


def test_json_path_lt():
    edges = _edges((2, "json_path", "score < 5"))
    assert evaluate_edges(edges, '{"score": 3}') == 2


def test_json_path_neq():
    edges = _edges((2, "json_path", 'status != "FAILED"'))
    assert evaluate_edges(edges, '{"status": "OK"}') == 2


def test_json_path_contains():
    edges = _edges((2, "json_path", 'message contains "urgent"'))
    assert evaluate_edges(edges, '{"message": "this is urgent stuff"}') == 2


def test_json_path_field_missing():
    edges = _edges((2, "json_path", "score > 7"))
    assert evaluate_edges(edges, '{"other": 10}') is None


def test_json_path_invalid_json():
    edges = _edges((2, "json_path", "score > 7"))
    assert evaluate_edges(edges, "not json at all") is None


def test_multiple_edges_first_match_wins():
    edges = _edges(
        (2, "contains", "APPROVED"),
        (3, "contains", "PENDING"),
    )
    assert evaluate_edges(edges, "APPROVED") == 2


def test_multiple_edges_second_matches():
    edges = _edges(
        (2, "contains", "APPROVED"),
        (3, "contains", "PENDING"),
    )
    assert evaluate_edges(edges, "PENDING") == 3


def test_no_matching_edges():
    edges = _edges(
        (2, "contains", "APPROVED"),
        (3, "contains", "PENDING"),
    )
    assert evaluate_edges(edges, "REJECTED") is None


def test_empty_edges():
    assert evaluate_edges([], "anything") is None
