"""Create a verified public source + production-build ZIP (stdlib only).
Run from the project root after npm run build. Output defaults to the parent folder.
"""
from pathlib import Path
import json
import re
import zipfile
import subprocess
import argparse

root = Path(__file__).resolve().parents[1]
# Fail closed: a previously hand-patched or unbuilt dist cannot be packaged as verified.
subprocess.run(["node", str(root / "scripts" / "verify-dist.mjs")], cwd=root, check=True)
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("output", nargs="?")
args = parser.parse_args()
output = Path(args.output).resolve() if args.output else root.parent / f"JadeHarbor_v{json.loads((root / 'package.json').read_text())['version']}_Release.zip"
roots = {"src", "public", "assets", "tests", "docs", "scripts", "dist"}
files = {"README.md", "LICENSE", "THIRD_PARTY_NOTICES.md", "package.json", "package-lock.json", "index.html", "tsconfig.json", "vite.config.ts", "vitest.config.ts", ".gitignore"}
required = ["dist/index.html", "dist/release-integrity.json", "src/main.ts", "src/world/city/panda.ts", "src/persistence/saves.ts", "package-lock.json", "README.md", "LICENSE", "THIRD_PARTY_NOTICES.md", "docs/project-history.md", "docs/quality-assurance.md", "docs/performance.md", "docs/assets/geographic-plan.svg", "docs/assets/district-plan.svg", "docs/licenses/THREE-MIT.txt", "scripts/check-documentation.mjs"]
for name in required:
    assert (root / name).is_file(), f"Missing release input: {name}"
for asset in re.findall(r'(?:src|href)="([^"]+)"', (root / "dist/index.html").read_text()):
    if not asset.startswith(("http", "data:", "#")):
        assert (root / "dist" / asset.removeprefix("./").lstrip("/")).is_file(), f"Missing built asset: {asset}"
assert list((root / "dist/assets").glob("generation.worker-*.js")), "Missing built generation worker"
output.parent.mkdir(parents=True, exist_ok=True)
with zipfile.ZipFile(output, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
    for path in sorted(root.rglob("*")):
        relative = path.relative_to(root)
        if not path.is_file() or path.is_symlink() or path == output:
            continue
        if any(p in {"node_modules", ".git", ".openai", "test-results", "__pycache__"} for p in relative.parts):
            continue
        if relative.parts[:2] == ("docs", "proof"):
            continue
        if relative.parts[0] not in roots and relative.as_posix() not in files:
            continue
        archive.write(path, relative.as_posix())
with zipfile.ZipFile(output) as archive:
    assert archive.testzip() is None
    names = archive.namelist()
    for name in required:
        assert name in names
    package = json.loads(archive.read("package.json"))
    lock = json.loads(archive.read("package-lock.json"))
    assert package["version"] == "2.0.1"
    assert package["version"] == lock["version"] == lock["packages"][""]["version"]
    assert len(names) == len(set(names)), "Duplicate archive paths"
    assert all(not name.startswith("/") and "\\" not in name and ".." not in Path(name).parts for name in names), "Unsafe archive path"
    forbidden_parts = {"node_modules", ".git", ".openai", "test-results", "__pycache__", ".pytest_cache", ".cache", ".turbo", ".parcel-cache", "coverage", "playwright-report", "blob-report", "artifacts", "reports"}
    assert not any(forbidden_parts.intersection(Path(name).parts) for name in names), "Archive contains development output"
    assert not any(Path(name).suffix.lower() in {".log", ".tmp", ".trace", ".pyc", ".zip", ".7z", ".rar", ".har", ".prof", ".heapprofile", ".cpuprofile", ".tsbuildinfo"} for name in names), "Archive contains transient files"
    assert not any(name.startswith("docs/proof/") for name in names)
print(json.dumps({"archive": str(output), "files": len(names), "bytes": output.stat().st_size, "source_and_dist": True, "proof_included": False}, indent=2))
