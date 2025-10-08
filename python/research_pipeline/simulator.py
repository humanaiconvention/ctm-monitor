"""Lightweight research fragment simulator used by the explorer/research loop.

This module provides a tiny, deterministic scoring function that consumes a
research fragment dict (expected keys: 'summary', 'quote', 'source') and
returns a score and diagnostic hints. It's intended for local testing and
feedback loops; real evaluation should replace this with proper ML/heuristic
scorers.
"""
from typing import Dict, Any, Optional


def simulate_fragment(
    fragment: Dict[str, Any], policies: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """Simulate evaluating a research fragment.

    Args:
        fragment: dict with keys like 'summary', 'quote', 'source'.
        policies: optional dict to bias scoring (prefer recency, provenance).

    Returns:
        dict with keys: score (0-100), diagnostics (list),
        recommendations (list)
    """
    if not fragment or not isinstance(fragment, dict):
        return {
            "score": 0,
            "diagnostics": ["invalid-fragment"],
            "recommendations": ["ingest-more-evidence"],
        }

    summary = fragment.get('summary') or fragment.get('excerpt') or ''
    quote = fragment.get('quote') or ''
    source = fragment.get('source') or fragment.get('source_id') or ''

    score = 50
    diagnostics = []
    recommendations = []

    # simple heuristics
    if summary and len(summary.split()) > 40:
        score += 15
    if quote:
        score += 10
    if source:
        score += 5
    if '202' in str(source):
        # crude recency bias for sources containing year-like tokens
        score += 5

    # policies can adjust scoring
    if policies:
        if policies.get('prefer_recency') and '202' in str(source):
            score += 5
        if policies.get('provenance_weight', 0) > 0 and source:
            score += int(policies.get('provenance_weight'))

    # clamp
    if score > 100:
        score = 100
    if score < 0:
        score = 0

    if score < 40:
        diagnostics.append('low-confidence')
        recommendations.append('fetch-additional-fragment')
    if 'missing' in summary.lower():
        diagnostics.append('fragment-indicates-missing-data')

    return {
        'score': score,
        'diagnostics': diagnostics,
        'recommendations': recommendations,
        'fragment_id': fragment.get('id') or fragment.get('source_id') or None,
    }


__all__ = ['simulate_fragment']
