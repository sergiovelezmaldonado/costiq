"""Extrae las 100 actividades del catálogo «día a día» de la Sesión 1 (respaldo
verificado más reciente) a JSON: área, número, nombre, qué produce y cada cuánto."""
import re, json
from pathlib import Path
BASE = Path(r'C:/Users/sergi.DESKTOP-R7NSS56/OneDrive/Documentos/Sergio Vélez Claude Ecosistema/02-proyectos/docencia/Panamerican Business School/programas/Especialización en IA para líderes/publicaciones/2026-10-18-modulo-02-v7-linea-base-simple')
src = (BASE / 's1-verificado-v17.txt').read_text(encoding='utf-8')
start = src.index('Actividades del día a día por área')
# el catálogo termina donde empieza el siguiente toggle de nivel 1 (tab=1) tras el inicio
lines = src[start:].split('\n')
out, area = [], None
cur = None
for l in lines[1:]:
    s = l.lstrip('\t'); tab = len(l) - len(s)
    if tab == 1 and s.startswith('<summary>'):
        break                                     # salió del catálogo
    m = re.match(r'<summary>\*\*(\d+)\. (.+?)\*\*</summary>', s)
    if tab == 2 and m:
        area = m.group(2); continue
    m = re.match(r'<summary>\*\*(\d+)\.(\d+) (.+?)\*\*</summary>', s)
    if tab == 3 and m:
        cur = {'area': area, 'n': f'{m.group(1)}.{m.group(2)}', 'name': m.group(3).strip()}
        out.append(cur); continue
    if cur and tab == 4:
        for key, field in (('Qué produce.', 'produce'), ('Cada cuánto.', 'freq')):
            if s.startswith(f'**{key}**'):
                cur[field] = s[len(key) + 4:].strip()
json.dump(out, open(Path(__file__).with_name('catalogo_dia_s1.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
from collections import Counter
print(len(out), 'actividades ·', dict(Counter(a['area'] for a in out)))
print('frecuencias:', Counter(a.get('freq', '?') for a in out).most_common())
