#!/usr/bin/env python3
"""Собирает внутренние страницы: шапка, подвал и модальное окно берутся из index.html,
содержимое <main> — из src/pages/*.html.

В начале файла страницы задаются метаданные:
<!-- title: Заголовок вкладки -->
<!-- description: Описание для поисковиков -->
"""
import re
from pathlib import Path

ROOT = Path(__file__).parent
layout = (ROOT / "index.html").read_text(encoding="utf-8")
before, rest = layout.split("<main>", 1)
_, after = rest.split("</main>", 1)

for src in sorted((ROOT / "src" / "pages").glob("*.html")):
    text = src.read_text(encoding="utf-8")
    meta = dict(re.findall(r"<!--\s*(\w+):\s*(.*?)\s*-->", text))
    content = re.sub(r"<!--\s*\w+:.*?-->\n?", "", text).strip()

    head = re.sub(r"<title>.*?</title>", f"<title>{meta['title']}</title>", before)
    head = re.sub(r'(<meta name="description" content=")[^"]*', lambda m: m.group(1) + meta["description"], head)

    (ROOT / src.name).write_text(f"{head}<main>\n\n{content}\n\n</main>{after}", encoding="utf-8")
    print("built", src.name)
