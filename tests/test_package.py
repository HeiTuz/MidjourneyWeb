import importlib.util
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def module(name):
    spec = importlib.util.spec_from_file_location(name, ROOT / 'scripts' / f'{name}.py')
    result = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(result)
    return result


install = module('install').install


class InstallerTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.source = self.root / 'source' / 'midjourney-web'
        self.source.mkdir(parents=True)
        (self.source / 'SKILL.md').write_text('skill', encoding='utf-8')
        self.dest = self.root / 'skills'

    def test_install_and_repeat_preserve_canonical_link(self):
        target = install(self.source, self.dest)
        self.assertTrue(target.is_symlink())
        self.assertEqual(target.resolve(), self.source.resolve())
        self.assertEqual(install(self.source, self.dest), target)
        (self.source / 'SKILL.md').write_text('updated', encoding='utf-8')
        self.assertEqual((target / 'SKILL.md').read_text(), 'updated')

    def test_existing_directory_is_preserved(self):
        target = self.dest / 'midjourney-web'
        target.mkdir(parents=True)
        (target / 'user.txt').write_text('keep')
        with self.assertRaises(FileExistsError):
            install(self.source, self.dest)
        self.assertEqual((target / 'user.txt').read_text(), 'keep')

    def test_other_and_broken_symlinks_are_preserved(self):
        self.dest.mkdir()
        target = self.dest / 'midjourney-web'
        for other in [self.root / 'source', self.root / 'missing']:
            target.symlink_to(other, target_is_directory=True)
            with self.assertRaises(FileExistsError):
                install(self.source, self.dest)
            self.assertEqual(target.readlink(), other)
            target.unlink()

    def test_invalid_source_creates_no_destination(self):
        (self.source / 'SKILL.md').unlink()
        with self.assertRaises(ValueError):
            install(self.source, self.dest)
        self.assertFalse(self.dest.exists())


class PackageTests(unittest.TestCase):
    def test_current_package(self):
        self.assertEqual(module('validate').validate(ROOT), [])


if __name__ == '__main__':
    unittest.main()
