"""Static server for the card preview: the repository plus /_test/ from a second folder."""
import http.server, os, sys, functools

repo, extra, port = sys.argv[1], sys.argv[2], int(sys.argv[3])

class Handler(http.server.SimpleHTTPRequestHandler):
    def translate_path(self, path):
        clean = path.split("?", 1)[0].split("#", 1)[0]
        if clean.startswith("/_test/"):
            return os.path.join(extra, os.path.basename(clean))
        return super().translate_path(path)
    def log_message(self, *args):
        pass

http.server.ThreadingHTTPServer(("127.0.0.1", port), functools.partial(Handler, directory=repo)).serve_forever()
