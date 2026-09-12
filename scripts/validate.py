"""Dependency-free package checks; not an execution or security audit."""
import re
import sys
from pathlib import Path


def validate(root: Path) -> list[str]:
    errors = []
    skill = root / 'skills' / 'midjourney-web'
    entry = skill / 'SKILL.md'
    if not entry.is_file():
        return ['Missing SKILL.md']
    content = entry.read_text(encoding='utf-8')
    if not re.match(r'\A---\nname: midjourney-web\ndescription: [^\n]+\n---\n', content):
        errors.append('Invalid required skill frontmatter')
    required = ['README.md', 'LICENSE', 'RELEASING.md', 'AGENTS.md',
                'skills/midjourney-web/agents/openai.yaml']
    for relative in required:
        if not (root / relative).is_file():
            errors.append(f'Missing {relative}')
    # These are regression checks for accidental workstation data in distribution,
    # not a replacement for reviewing the complete staged diff before release.
    forbidden = [r'/Users/[^/\s]+/', r'[A-Z]:\\Users\\',
                 r'https?://(?:www\.)?midjourney\.com/jobs/[a-f0-9-]{36}',
                 r'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----',
                 r'gh[pousr]_[A-Za-z0-9]{20,}']
    for path in root.rglob('*'):
        if any(part in {'.git', '__pycache__'} for part in path.relative_to(root).parts):
            continue
        if path.suffix.lower() in {'.png', '.jpg', '.jpeg', '.mp4', '.db', '.jsonl'}:
            errors.append(f'Unexpected private/media artifact: {path.relative_to(root)}')
        if path.suffix not in {'.md', '.yaml', '.yml'}:
            continue
        text = path.read_text(encoding='utf-8')
        if '[TODO:' in text:
            errors.append(f'Unfinished scaffold: {path.relative_to(root)}')
        for pattern in forbidden:
            if re.search(pattern, text):
                errors.append(f'Possible private material: {path.relative_to(root)}')
        for target in re.findall(r'\]\(([^)]+)\)', text):
            if '://' in target or target.startswith('#'):
                continue
            target = target.split('#', 1)[0]
            resolved = (path.parent / target).resolve()
            if not resolved.is_relative_to(root.resolve()) or not resolved.exists():
                errors.append(f'Broken/outside link: {path.relative_to(root)} -> {target}')
    return errors


if __name__ == '__main__':
    problems = validate(Path(__file__).resolve().parents[1])
    print('\n'.join(problems) if problems else 'Package validation passed')
    sys.exit(bool(problems))
