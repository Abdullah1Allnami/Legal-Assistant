import json
import os

path = os.path.join(os.path.dirname(__file__), 'workflow.ipynb')
if not os.path.exists(path):
    print(f"Error: Could not find {path}")
    exit(1)

with open(path, 'r', encoding='utf-8') as f:
    nb = json.load(f)

changed = False
for cell in nb['cells']:
    if cell['cell_type'] == 'code':
        for i, line in enumerate(cell['source']):
            if 'pip install' in line and 'transformers' in line and not 'transformers<' in line:
                cell['source'][i] = line.replace('transformers', "'transformers<4.49'")
                changed = True

if changed:
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(nb, f, indent=1, ensure_ascii=False)
    print("Successfully patched workflow.ipynb. 'transformers' has been pinned to '<4.49'.")
else:
    print("workflow.ipynb was already up-to-date or 'pip install' cell was not found.")
