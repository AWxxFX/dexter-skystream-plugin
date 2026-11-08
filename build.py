import os
import json
import zipfile

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SRC_DIR = os.path.join(BASE_DIR, "src")
DIST_DIR = os.path.join(BASE_DIR, "dist")

os.makedirs(DIST_DIR, exist_ok=True)

# Read plugin.json
with open(os.path.join(SRC_DIR, "plugin.json"), "r") as f:
    plugin_meta = json.load(f)

package_name = plugin_meta.get("packageName", "org.stream.dexter")
sky_filename = f"{package_name}.sky"
sky_filepath = os.path.join(DIST_DIR, sky_filename)

# Create zip file (.sky)
print(f"[*] Packaging {sky_filename}...")
with zipfile.ZipFile(sky_filepath, "w", zipfile.ZIP_DEFLATED) as zip_out:
    zip_out.write(os.path.join(SRC_DIR, "plugin.json"), "plugin.json")
    zip_out.write(os.path.join(SRC_DIR, "plugin.js"), "plugin.js")

file_size_kb = os.path.getsize(sky_filepath) / 1024
print(f"[+] Successfully created {sky_filepath} ({file_size_kb:.2f} KB)")

# Default repo URL or GitHub raw prefix placeholder
# Users can customize REPO_BASE_URL when deploying to GitHub or local server
repo_raw_url = os.environ.get("REPO_URL", "https://raw.githubusercontent.com/username/dexter-skystream-plugin/main")

plugins_json_data = [
    {
        "packageName": plugin_meta["packageName"],
        "name": plugin_meta["name"],
        "version": plugin_meta["version"],
        "baseUrl": plugin_meta["baseUrl"],
        "description": plugin_meta["description"],
        "authors": plugin_meta.get("authors", []),
        "languages": plugin_meta.get("languages", ["en"]),
        "categories": plugin_meta.get("categories", ["Movie", "TvSeries"]),
        "url": f"{repo_raw_url}/dist/{sky_filename}"
    }
]

with open(os.path.join(DIST_DIR, "plugins.json"), "w") as f:
    json.dump(plugins_json_data, f, indent=2)
print("[+] Generated dist/plugins.json")

repo_json_data = {
    "name": "Dexter Stream Repository",
    "packageName": "org.stream.dexter.repo",
    "description": "Dexter.pw 4K Stream Provider for SkyStream",
    "manifestVersion": 1,
    "pluginLists": [
        f"{repo_raw_url}/dist/plugins.json"
    ]
}

with open(os.path.join(BASE_DIR, "repo.json"), "w") as f:
    json.dump(repo_json_data, f, indent=2)
print("[+] Generated repo.json")
