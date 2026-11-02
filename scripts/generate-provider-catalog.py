#!/usr/bin/env python3
"""
Generate complete provider catalog from api-endpoints.json
Filters to active providers only (exclude maintenance)
"""
import json
from pathlib import Path

def main():
    # Read source
    api_endpoints_path = Path(__file__).parent.parent / "api-endpoints.json"
    with open(api_endpoints_path, "r") as f:
        data = json.load(f)

    # Filter active providers only (exclude dramabox - maintenance)
    active_providers = [
        p for p in data["providers"]
        if p["status"] == "active"
    ]

    # Build catalog structure
    catalog = {
        "generatedAt": data["generatedAt"],
        "host": data["host"],
        "authHeader": data["authHeader"],
        "providers": active_providers
    }

    # Write to catalog.json
    catalog_path = Path(__file__).parent.parent / "src" / "lib" / "providers" / "catalog.json"
    with open(catalog_path, "w") as f:
        json.dump(catalog, f, indent=2)

    print(f"Generated catalog with {len(active_providers)} active providers")
    print(f"Excluded: {[p['slug'] for p in data['providers'] if p['status'] != 'active']}")

    # Generate provider summary
    vip_counts = {}
    for p in active_providers:
        vip = p["vip"]
        vip_counts[vip] = vip_counts.get(vip, 0) + 1

    print("\nProvider distribution by VIP:")
    for vip in sorted(vip_counts.keys()):
        print(f"  {vip}: {vip_counts[vip]} providers")

    # List all provider slugs
    print(f"\nAll active provider slugs ({len(active_providers)}):")
    for p in sorted(active_providers, key=lambda x: x["slug"]):
        print(f"  - {p['slug']} ({p['provider']}) - {p['endpointCount']} endpoints")

if __name__ == "__main__":
    main()
