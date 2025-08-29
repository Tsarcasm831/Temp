#!/usr/bin/env python3
import os
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler


class Handler(SimpleHTTPRequestHandler):
    # Extend the built-in map so HTML/CSS and others keep correct types,
    # while ensuring ESM-related extensions are served as JavaScript.
    extensions_map = {
        **SimpleHTTPRequestHandler.extensions_map,
        ".js": "text/javascript; charset=utf-8",
        ".mjs": "text/javascript; charset=utf-8",
        ".jsx": "text/javascript; charset=utf-8",
        ".json": "application/json; charset=utf-8",
        ".wasm": "application/wasm",
    }

    # Add dev-friendly headers to avoid caching issues that can preserve
    # wrong Content-Type metadata across restarts (causing 304 + stale type).
    def end_headers(self) -> None:  # type: ignore[override]
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()


def main(host: str = "127.0.0.1", port: int = 8000):
    # Serve from the directory containing this script
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    httpd = ThreadingHTTPServer((host, port), Handler)
    sa = httpd.socket.getsockname()
    print(f"Serving HTTP on {sa[0]} port {sa[1]} (http://{host}:{port}/) ...")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        httpd.server_close()


if __name__ == "__main__":
    main()
