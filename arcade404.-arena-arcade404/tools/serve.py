#!/usr/bin/env python3
"""Servidor estático de desarrollo para ARCADE 404.

El juego funciona con file://, así que esto solo existe para poder
probarlo en un navegador real (y para la vista previa del sandbox).
Desactiva la caché para que los cambios se vean al recargar.

    python3 tools/serve.py [puerto]
"""

import http.server
import os
import socketserver
import sys


class Handler(http.server.SimpleHTTPRequestHandler):

    def end_headers(self):
        self.send_header("Cache-Control", "no-store, max-age=0")
        self.send_header("Pragma", "no-cache")
        super().end_headers()

    def log_message(self, *args):
        pass


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8082

    # Servir siempre la raíz del repositorio, no el cwd de quien llama.
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    os.chdir(root)

    socketserver.TCPServer.allow_reuse_address = True

    with socketserver.TCPServer(("0.0.0.0", port), Handler) as httpd:
        print(f"ARCADE 404 en http://0.0.0.0:{port} (raíz: {root})")
        httpd.serve_forever()


if __name__ == "__main__":
    main()
