import sys

with open('js/modules/links.js', 'r', encoding='utf-8') as f:
    content = f.read()

replacements = [
    ('â\u20acâ\u20ac', '\u2014'),
    ('\u00c3\u00a2\u20ac\u201c', '\u2014'),
    ('Ã\u0161teis', '\u00dateis'),
    ('â€"', '\u2014'),
    ('clicÃ¡veis', 'clic\u00e1veis'),
    ('SessÃ£o', 'Sess\u00e3o'),
    ('FaÃ§a', 'Fa\u00e7a'),
    ('Ã©', '\u00e9'),
    ('obrigatÃ³ria', 'obrigat\u00f3ria'),
    ('nÃ£o', 'n\u00e3o'),
    ('URL bÃ¡sica', 'URL b\u00e1sica'),
    ('invÃ¡lida', 'inv\u00e1lida'),
    ('tÃ­tulo', 't\u00edtulo'),
    ('visÃ­veis', 'vis\u00edveis'),
]

for bad, good in replacements:
    content = content.replace(bad, good)

with open('js/modules/links.js', 'w', encoding='utf-8') as f:
    f.write(content)

remaining = content.count('\u00c3')
print('Done. Remaining Ã count: ' + str(remaining))
if remaining > 0:
    for i, line in enumerate(content.split('\n'), 1):
        if '\u00c3' in line:
            print(f'  Line {i}: {line[:100]}')
