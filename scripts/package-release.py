"""Create a verified source + production-build ZIP (stdlib only).
Run from the project root after npm run build. The curated archive omits docs/proof
without changing the working tree or Git tracking. Output defaults to the parent folder.
"""
from pathlib import Path
import json
import re
import sys
import zipfile
import subprocess

root = Path(__file__).resolve().parents[1]
# Fail closed: a previously hand-patched or unbuilt dist cannot be packaged as verified.
subprocess.run(["node", str(root / "scripts" / "verify-dist.mjs")], cwd=root, check=True)
args = sys.argv[1:]
if len(args) > 1:
    raise SystemExit("Usage: python scripts/package-release.py [output.zip]")
output = Path(args[0]).resolve() if args else root.parent / f"JadeHarbor_v{json.loads((root / 'package.json').read_text())['version']}_Source_and_Dist.zip"
roots = {"src", "public", "assets", "tests", "docs", "scripts", "dist"}
files = {"README.md", "LICENSE", "THIRD_PARTY_NOTICES.md", "package.json", "package-lock.json", "index.html", "tsconfig.json", "vite.config.ts", "vitest.config.ts", ".gitignore"}
required = ["dist/index.html", "dist/release-integrity.json", "src/main.ts", "src/world/city/panda.ts", "src/persistence/saves.ts", "package-lock.json", "README.md", "docs/project-history.md", "docs/quality-assurance.md", "docs/performance.md", "docs/save-schema.md", "scripts/check-documentation.mjs"]
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
        if relative.parts[:2] == ("docs", "proof"):
            continue
        if any(part in {"node_modules", ".git", ".openai", "test-results", "__pycache__", ".pytest_cache", ".cache", ".turbo", ".parcel-cache", "coverage", "playwright-report", "blob-report", "artifacts", "reports"} for part in relative.parts):
            continue
        if path.name in {".DS_Store", "Thumbs.db", "desktop.ini"} or path.suffix.lower() in {".log", ".tmp", ".trace", ".pyc", ".zip", ".7z", ".rar", ".har", ".prof", ".heapprofile", ".cpuprofile", ".tsbuildinfo"}:
            continue
        if relative.parts[0] not in roots and relative.as_posix() not in files:
            continue
        archive.write(path, "JadeHarbor/" + relative.as_posix())
with zipfile.ZipFile(output) as archive:
    assert archive.testzip() is None
    names = archive.namelist()
    assert len(names) == len(set(names)), "Duplicate archive paths"
    assert all(name.startswith("JadeHarbor/") and "\\" not in name and ".." not in Path(name).parts for name in names), "Unsafe archive path"
    for info in archive.infolist():
        mode = (info.external_attr >> 16) & 0o170000
        assert mode != 0o120000, f"Symlink not allowed in release archive: {info.filename}"
    for name in required:
        assert "JadeHarbor/" + name in names
    package = json.loads(archive.read("JadeHarbor/package.json"))
    lock = json.loads(archive.read("JadeHarbor/package-lock.json"))
    assert package["version"] == "2.0.0", "Unexpected release version"
    assert package["version"] == lock["version"] == lock["packages"][""]["version"], "Package/lock version mismatch"
    for forbidden in ("node_modules/", ".git/", ".openai/", "test-results/", ".pytest_cache/", "/coverage/", "/playwright-report/", "/blob-report/"):
        assert not any(forbidden in name for name in names)
    assert not any(name.startswith("JadeHarbor/docs/proof/") for name in names)
    assert not any(part in {"node_modules", ".git", ".openai", "test-results", "__pycache__", ".pytest_cache", ".cache", ".turbo", ".parcel-cache", "coverage", "playwright-report", "blob-report", "artifacts", "reports"} for name in names for part in Path(name).parts)
    assert not any(Path(name).suffix.lower() in {".log", ".tmp", ".trace", ".pyc", ".zip", ".7z", ".rar", ".har", ".prof", ".heapprofile", ".cpuprofile", ".tsbuildinfo"} for name in names)
print(json.dumps({"archive": str(output), "files": len(names), "bytes": output.stat().st_size, "source_and_dist": True, "proof_included": False}, indent=2))
