#!/usr/bin/env python3
"""
Simple HTTP shim for the research simulator.

POST /simulate
  JSON body: { "fragment": {...}, "policies": {...} }

Returns 200 with JSON body from simulate_fragment.

This shim intentionally uses only the Python standard library so it can be
run with a single `python` invocation during development or production.
"""
import json
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import urlparse
import sys
import traceback

PORT = 8765

def simulate_fragment(fragment, policies=None):
    # Lightweight heuristic scoring that mirrors the JS fallback.
    if not isinstance(fragment, dict):
        return {
            'score': 0,
            'diagnostics': ['invalid-fragment'],
            'recommendations': ['ingest-more-evidence']
        }
    summary = fragment.get('summary') or fragment.get('excerpt') or ''
    quote = fragment.get('quote') or ''
    source = fragment.get('source') or fragment.get('source_id') or ''

    score = 50
    diagnostics = []
    recommendations = []

    try:
        if summary and len(summary.split()) > 40:
            score += 15
        if quote:
            score += 10
        if source:
            score += 5
        if '202' in str(source):
            score += 5
        if (
            policies
            and policies.get('prefer_recency')
            and '202' in str(source)
        ):
            score += 5
        if policies and policies.get('provenance_weight'):
            score += int(policies.get('provenance_weight') or 0)
    except Exception:
        diagnostics.append('scoring-error')

    score = max(0, min(100, score))

    if score < 40:
        diagnostics.append('low-confidence')
        recommendations.append('fetch-additional-fragment')
    if 'missing' in str(summary).lower():
        diagnostics.append('fragment-indicates-missing-data')

    return {
        'score': score,
        'diagnostics': diagnostics,
        'recommendations': recommendations,
        'fragment_id': fragment.get('id') or fragment.get('source_id') or None
    }

class ShimHandler(BaseHTTPRequestHandler):
    def _set_headers(self, status=200):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_OPTIONS(self):
        self._set_headers(204)

    def do_POST(self):
        parsed = urlparse(self.path)
        if parsed.path != '/simulate':
            self._set_headers(404)
            self.wfile.write(
                json.dumps({'error': 'not found'}).encode('utf-8')
            )
            return
        length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(length) if length > 0 else b''
        try:
            data = json.loads(body.decode('utf-8') or '{}')
        except Exception:
            self._set_headers(400)
            self.wfile.write(
                json.dumps({'error': 'invalid json'}).encode('utf-8')
            )
            return

        fragment = data.get('fragment')
        policies = data.get('policies')
        try:
            result = simulate_fragment(fragment or {}, policies or {})
            self._set_headers(200)
            self.wfile.write(json.dumps(result).encode('utf-8'))
        except Exception:
            self._set_headers(500)
            tb = traceback.format_exc()
            self.wfile.write(
                json.dumps({'error': 'server error', 'trace': tb}).encode('utf-8')
            )

def run(server_class=HTTPServer, handler_class=ShimHandler, port=PORT):
    server_address = ('', port)
    httpd = server_class(server_address, handler_class)
    print(f'Sim Shim listening on port {port}', file=sys.stderr)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print('Shutting down shim', file=sys.stderr)
        httpd.server_close()

if __name__ == '__main__':
    run()
