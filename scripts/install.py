"""Link the canonical skill without replacing an existing installation."""
import argparse
import os
from pathlib import Path


def install(source: Path, skills_dir: Path) -> Path:
    source = source.resolve(strict=True)
    if not (source / 'SKILL.md').is_file():
        raise ValueError('Source has no SKILL.md')
    skills_dir = skills_dir.expanduser().absolute()
    destination = skills_dir / source.name
    if destination.is_symlink() and destination.resolve() == source:
        return destination
    if destination.exists() or destination.is_symlink():
        raise FileExistsError(f'Refusing to replace existing installation: {destination}')
    skills_dir.mkdir(parents=True, exist_ok=True)
    destination.symlink_to(source, target_is_directory=True)
    return destination


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    default_home = Path(os.environ.get('CODEX_HOME') or Path.home() / '.codex')
    parser.add_argument('--skills-dir', type=Path, default=default_home / 'skills')
    args = parser.parse_args()
    source = Path(__file__).resolve().parents[1] / 'skills' / 'midjourney-web'
    try:
        destination = install(source, args.skills_dir)
    except (OSError, ValueError) as error:
        parser.exit(1, f'{error}\n')
    print(f'Installed: {destination} -> {source}')


if __name__ == '__main__':
    main()
