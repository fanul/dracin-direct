#!/usr/bin/env python3
"""Generate provider capability matrix from api-endpoints.json.

Usage:
  python generate_capabilities.py api-endpoints.json > provider_capabilities.csv
"""
import json, re, csv, sys

def infer_caps(endpoints, status):
    paths = [e.get("path","") for e in endpoints]
    methods = [e.get("method","GET").upper() for e in endpoints]
    def has(pattern):
        return any(re.search(pattern, p) for p in paths)
    caps = {
        "supports_home": has(r"/(home|homepage|foryou|for-you|feed)"),
        "supports_feed_tabs": has(r"/feed/:") or has(r"/tabs") or has(r"/tab"),
        "supports_search": has(r"/search"),
        "supports_categories": has(r"/(categories|genres|tags|languages|tabs)"),
        "supports_series_detail": has(r"/(drama|dramas|series|book)/:"),
        "supports_episode_list": has(r"/(episodes|chapters)"),
        "supports_playback": has(r"/(play|stream|video)"),
        "supports_subtitle": has(r"/subtitle"),
        "supports_unlock": any(m=="POST" for m in methods) and has(r"/unlock"),
        "playback_type": "unknown",
        "enabled_by_catalog": (status or "active").lower() == "active",
    }
    if has(r"/video"):
        caps["playback_type"] = "video"
    if has(r"/stream"):
        caps["playback_type"] = "stream"
    if has(r"/play"):
        caps["playback_type"] = "play"
    return caps

def main(path):
    with open(path, "r", encoding="utf-8") as f:
        catalog = json.load(f)
    providers = catalog.get("providers", [])
    fieldnames = [
        "provider_slug","provider_name","vip","status","endpoint_count",
        "supports_home","supports_feed_tabs","supports_search","supports_categories",
        "supports_series_detail","supports_episode_list","supports_playback",
        "supports_subtitle","supports_unlock","playback_type","enabled_by_catalog"
    ]
    w = csv.DictWriter(sys.stdout, fieldnames=fieldnames)
    w.writeheader()
    for p in providers:
        slug = p.get("slug") or p.get("provider") or ""
        name = p.get("name") or p.get("provider") or slug
        vip = p.get("vip")
        status = p.get("status","active")
        endpoints = p.get("endpoints", [])
        caps = infer_caps(endpoints, status)
        w.writerow({
            "provider_slug": slug,
            "provider_name": name,
            "vip": vip,
            "status": status,
            "endpoint_count": len(endpoints),
            **caps
        })

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Expected: generate_capabilities.py api-endpoints.json", file=sys.stderr)
        sys.exit(2)
    main(sys.argv[1])
