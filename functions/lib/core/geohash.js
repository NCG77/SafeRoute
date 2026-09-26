"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.encodeGeohash = encodeGeohash;
exports.geohashPrefix = geohashPrefix;
exports.geohashPrecisionForZoom = geohashPrecisionForZoom;
const BASE32 = "0123456789bcdefghjkmnpqrstuvwxyz";
/**
 * Encodes latitude/longitude to a geohash.
 * Precision 7 is about 150 m × 150 m and is the crowd-density cell size.
 */
function encodeGeohash(latitude, longitude, precision = 7) {
    let minLat = -90;
    let maxLat = 90;
    let minLng = -180;
    let maxLng = 180;
    let hash = "";
    let bit = 0;
    let value = 0;
    let even = true;
    while (hash.length < precision) {
        if (even) {
            const mid = (minLng + maxLng) / 2;
            if (longitude >= mid) {
                value = (value << 1) + 1;
                minLng = mid;
            }
            else {
                value = (value << 1) + 0;
                maxLng = mid;
            }
        }
        else {
            const mid = (minLat + maxLat) / 2;
            if (latitude >= mid) {
                value = (value << 1) + 1;
                minLat = mid;
            }
            else {
                value = (value << 1) + 0;
                maxLat = mid;
            }
        }
        even = !even;
        bit += 1;
        if (bit === 5) {
            hash += BASE32[value];
            bit = 0;
            value = 0;
        }
    }
    return hash;
}
/** Prefix used for viewport queries. Shorter precision = larger cell. */
function geohashPrefix(hash, precision) {
    return hash.slice(0, Math.max(1, Math.min(precision, hash.length)));
}
/**
 * Map zoom (latitudeDelta, degrees) to the geohash length queried.
 * City view aggregates. Street view uses the storage precision.
 */
function geohashPrecisionForZoom(latitudeDelta) {
    if (latitudeDelta > 0.5)
        return 5;
    if (latitudeDelta > 0.15)
        return 6;
    if (latitudeDelta > 0.04)
        return 7;
    return 8;
}
