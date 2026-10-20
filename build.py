#!/usr/bin/env python3
"""Собирает внутренние страницы из src/pages и src/pages-en."""
import re
from pathlib import Path

ROOT = Path(__file__).parent
SITE = "https://kibosh13.github.io/lex-georgia-site"


def inject_seo(head: str, title: str, desc: str, ru_path: str, en_path: str, locale: str) -> str:
    ru = f"{SITE}/{ru_path}"
    en = f"{SITE}/en/{en_path}"
    canon = en if locale.startswith("en") else ru
    head = re.sub(r"<title>.*?</title>", f"<title>{title}</title>", head)
    head = re.sub(r'(<meta name="description" content=")[^"]*', lambda m: m.group(1) + desc, head)
    head = re.sub(r'(<link rel="canonical" href=")[^"]*', lambda m: m.group(1) + canon, head)
    head = re.sub(r'(<link rel="alternate" hreflang="ru" href=")[^"]*', lambda m: m.group(1) + ru, head)
    head = re.sub(r'(<link rel="alternate" hreflang="en" href=")[^"]*', lambda m: m.group(1) + en, head)
    head = re.sub(r'(<link rel="alternate" hreflang="x-default" href=")[^"]*', lambda m: m.group(1) + ru, head)
    head = re.sub(r'(<meta property="og:title" content=")[^"]*', lambda m: m.group(1) + title, head)
    head = re.sub(r'(<meta property="og:description" content=")[^"]*', lambda m: m.group(1) + desc, head)
    head = re.sub(r'(<meta property="og:url" content=")[^"]*', lambda m: m.group(1) + canon, head)
    return head


def build(layout_file: Path, src_dir: Path, dest_dir: Path, locale: str) -> None:
    layout = layout_file.read_text(encoding="utf-8")
    before, rest = layout.split("<main>", 1)
    _, after = rest.split("</main>", 1)
    dest_dir.mkdir(parents=True, exist_ok=True)

    for src in sorted(src_dir.glob("*.html")):
        text = src.read_text(encoding="utf-8")
        meta = dict(re.findall(r"<!--\s*(\w+):\s*(.*?)\s*-->", text))
        content = re.sub(r"<!--\s*\w+:.*?-->\n?", "", text).strip()
        name = src.name
        head = inject_seo(before, meta["title"], meta["description"], name, name, locale)
        if locale.startswith("ru"):
            head = head.replace('href="en/index.html"', f'href="en/{name}"')
        else:
            head = head.replace('href="../index.html"', f'href="../{name}"')
        (dest_dir / name).write_text(f"{head}<main>\n\n{content}\n\n</main>{after}", encoding="utf-8")
        print("built", dest_dir.name + "/" + name if dest_dir != ROOT else name)


build(ROOT / "index.html", ROOT / "src" / "pages", ROOT, "ru")
build(ROOT / "en" / "index.html", ROOT / "src" / "pages-en", ROOT / "en", "en")
