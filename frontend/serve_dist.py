from __future__ import annotations

import http.client
import mimetypes
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parent / "dist"
LOG_FILE = Path(__file__).resolve().parent / "serve-dist-python.log"
API_HOST = "localhost"
API_PORT = 8080


def log(message: str):
    with LOG_FILE.open("a", encoding="utf-8") as file:
        file.write(message + "\n")


class Handler(BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def do_GET(self):
        self.handle_request()

    def do_POST(self):
        self.handle_request()

    def do_PUT(self):
        self.handle_request()

    def do_DELETE(self):
        self.handle_request()

    def do_OPTIONS(self):
        self.handle_request()

    def handle_request(self):
        if self.path.startswith("/api/"):
            self.proxy_api()
        else:
            self.serve_static()

    def proxy_api(self):
        body = self.rfile.read(int(self.headers.get("Content-Length", "0") or "0"))
        conn = http.client.HTTPConnection(API_HOST, API_PORT, timeout=30)
        headers = {key: value for key, value in self.headers.items() if key.lower() not in {"host", "content-length"}}
        try:
            conn.request(self.command, self.path, body=body, headers=headers)
            res = conn.getresponse()
            payload = res.read()
            self.send_response(res.status, res.reason)
            for key, value in res.getheaders():
                if key.lower() not in {"transfer-encoding", "connection"}:
                    self.send_header(key, value)
            self.send_header("Content-Length", str(len(payload)))
            self.end_headers()
            self.wfile.write(payload)
        finally:
            conn.close()

    def serve_static(self):
        if not ROOT.exists():
            self.send_error(500, "dist directory not found")
            return

        parsed = urlsplit(self.path)
        relative = parsed.path.lstrip("/") or "index.html"
        target = (ROOT / relative).resolve()
        if ROOT not in target.parents and target != ROOT:
            self.send_error(403)
            return
        if not target.exists() or target.is_dir():
            target = ROOT / "index.html"

        payload = target.read_bytes()
        content_type = mimetypes.guess_type(str(target))[0] or "application/octet-stream"
        if target.suffix in {".html", ".js", ".css"}:
            content_type += "; charset=utf-8"

        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def log_message(self, fmt, *args):
        log("%s - %s" % (self.address_string(), fmt % args))


if __name__ == "__main__":
    try:
        LOG_FILE.write_text("", encoding="utf-8")
        server = ThreadingHTTPServer(("0.0.0.0", 5173), Handler)
        log("GIS frontend server listening at http://localhost:5173")
        server.serve_forever()
    except Exception as exc:
        log("FATAL: %r" % exc)
        raise
