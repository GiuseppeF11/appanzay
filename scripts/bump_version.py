#!/usr/bin/env python3
"""Aggiorna la versione di Appanzay in tutti i punti che servono.

Uso:  python3 scripts/bump_version.py [major|minor|patch]   (predefinito: minor)

Scrive version.json e js/version.js, rinomina la cache del service worker e
aggiunge ?v=<versione> ai file in index.html, così il browser non può usare
copie vecchie dopo un rilascio.
"""
import json, re, sys
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

root = Path(__file__).resolve().parent.parent
kind = sys.argv[1] if len(sys.argv) > 1 else 'minor'
vf = root / 'version.json'
cur = json.loads(vf.read_text())['version'] if vf.exists() else '1.0.0'
ma, mi, pa = (int(x) for x in cur.split('.'))
ma, mi, pa = {'major': (ma + 1, 0, 0), 'minor': (ma, mi + 1, 0), 'patch': (ma, mi, pa + 1)}[kind]
ver = f'{ma}.{mi}.{pa}'
date = datetime.now(ZoneInfo('Europe/Rome')).strftime('%Y-%m-%dT%H:%M')

vf.write_text(json.dumps({'version': ver, 'date': date}, indent=2) + '\n')
(root / 'js/version.js').write_text(
    '/* Generato da scripts/bump_version.py: non modificare a mano. */\n'
    f"window.APZ_VERSION = {{ version: '{ver}', date: '{date}' }};\n")
sw = root / 'sw.js'
sw.write_text(re.sub(r"const CACHE = '[^']*';", f"const CACHE = 'appanzay-{ver}';", sw.read_text()))
idx = root / 'index.html'
idx.write_text(re.sub(r'((?:css|js)/[\w.-]+\.(?:css|js))(?:\?v=[^"]*)?"', rf'\1?v={ver}"', idx.read_text()))
print(f'{cur} -> {ver} ({date})')
