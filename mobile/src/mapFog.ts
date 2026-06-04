import type { Region } from 'react-native-maps';
import type { LatLng } from 'react-native-maps';
import type { UnlockedArea } from './types';
import { distanceMeters } from './geo';

import type { MapTheme } from './mapTheme';

/** Dark tint over unrevealed map; explored holes show roads/labels underneath. */
export const FOG_FILL_COLOR = 'rgba(5, 8, 20, 0.72)';

export const FOG_FILL_COLOR_LIGHT = 'rgba(230, 235, 245, 0.78)';

export function getFogFillColor(theme: MapTheme): string {
  return theme === 'light' ? FOG_FILL_COLOR_LIGHT : FOG_FILL_COLOR;
}

/** Cap disconnected explored islands rendered as separate holes. */
export const MAX_FOG_HOLES = 48;

/** Merge nearby circles into one mask (covers unlock spacing + GPS jitter). */
const CLUSTER_BRIDGE_METERS = 18;

/** Smooth circle holes for single isolated reveals. */
const CIRCLE_HOLE_SEGMENTS = 28;

/** Samples per circle when building a cluster hull. */
const CLUSTER_CIRCLE_SEGMENTS = 20;

export type FogBounds = {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
};

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function paddingForRegion(region: Region): number {
  const zoom = Math.max(region.latitudeDelta, region.longitudeDelta);
  if (zoom > 0.12) return 0.45;
  if (zoom > 0.05) return 0.28;
  if (zoom > 0.02) return 0.2;
  return 0.14;
}

export function boundsFromRegion(region: Region, padding?: number): FogBounds {
  const pad = padding ?? paddingForRegion(region);
  const latHalf = region.latitudeDelta * (0.5 + pad);
  const lngHalf = region.longitudeDelta * (0.5 + pad);
  return {
    minLat: region.latitude - latHalf,
    maxLat: region.latitude + latHalf,
    minLng: region.longitude - lngHalf,
    maxLng: region.longitude + lngHalf,
  };
}

/** Viewport-sized outer ring (clockwise); fog polygon moves with the map when panning. */
export function regionOuterRing(region: Region): LatLng[] {
  const b = boundsFromRegion(region);
  return [
    { latitude: b.maxLat, longitude: b.minLng },
    { latitude: b.maxLat, longitude: b.maxLng },
    { latitude: b.minLat, longitude: b.maxLng },
    { latitude: b.minLat, longitude: b.minLng },
  ];
}

export function circleIntersectsBounds(
  center: { latitude: number; longitude: number },
  radiusMeters: number,
  bounds: FogBounds
): boolean {
  const lat = clamp(center.latitude, bounds.minLat, bounds.maxLat);
  const lng = clamp(center.longitude, bounds.minLng, bounds.maxLng);
  return distanceMeters(center, { latitude: lat, longitude: lng }) <= radiusMeters;
}

type RevealCircle = {
  lat: number;
  lng: number;
  radius: number;
};

function revealCoord(circle: RevealCircle) {
  return { latitude: circle.lat, longitude: circle.lng };
}

function sampleCircleBoundary(circle: RevealCircle, segments: number): LatLng[] {
  const coords: LatLng[] = [];
  const latRad = (circle.lat * Math.PI) / 180;
  const metersPerDegreeLat = 111320;
  const metersPerDegreeLng = 111320 * Math.cos(latRad);

  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * 2 * Math.PI;
    const dx = circle.radius * Math.cos(angle);
    const dy = circle.radius * Math.sin(angle);
    coords.push({
      latitude: circle.lat + dy / metersPerDegreeLat,
      longitude: circle.lng + dx / metersPerDegreeLng,
    });
  }
  return coords;
}

/** Approximate a circle as a counter-clockwise polygon (required for MapView holes). */
export function circleToPolygonHole(
  lat: number,
  lng: number,
  radiusMeters: number,
  segments = CIRCLE_HOLE_SEGMENTS
): LatLng[] {
  const points = sampleCircleBoundary({ lat, lng, radius: radiusMeters }, segments);
  return points.reverse();
}

function cross(o: LatLng, a: LatLng, b: LatLng): number {
  return (
    (a.longitude - o.longitude) * (b.latitude - o.latitude) -
    (a.latitude - o.latitude) * (b.longitude - o.longitude)
  );
}

/** Local convex hull: one hole polygon for a cluster of overlapping reveal circles. */
function convexHull(points: LatLng[]): LatLng[] {
  if (points.length <= 2) return points;

  const sorted = [...points].sort((a, b) =>
    a.longitude === b.longitude ? a.latitude - b.latitude : a.longitude - b.longitude
  );

  const lower: LatLng[] = [];
  for (const p of sorted) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) {
      lower.pop();
    }
    lower.push(p);
  }

  const upper: LatLng[] = [];
  for (let i = sorted.length - 1; i >= 0; i--) {
    const p = sorted[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) {
      upper.pop();
    }
    upper.push(p);
  }

  upper.pop();
  lower.pop();
  const hull = [...lower, ...upper];
  if (hull.length < 3) return hull;

  // Match winding of circleToPolygonHole (CCW hole) for consistent MapView rendering.
  const ref = circleToPolygonHole(0, 0, 1, 8);
  const refArea = signedAreaLngLat(ref);
  const hullArea = signedAreaLngLat(hull);
  if (Math.sign(refArea) !== Math.sign(hullArea)) hull.reverse();
  return hull;
}

function signedAreaLngLat(points: LatLng[]): number {
  let sum = 0;
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    sum += points[i].longitude * points[j].latitude - points[j].longitude * points[i].latitude;
  }
  return sum;
}

/** Drop saved unlocks fully covered by a larger one (avoids duplicate hole layers). */
export function dedupeRevealCircles(circles: RevealCircle[]): RevealCircle[] {
  return circles.filter((circle, idx) =>
    !circles.some((other, j) => {
      if (idx === j) return false;
      if (other.radius <= circle.radius) return false;
      const d = distanceMeters(revealCoord(circle), revealCoord(other));
      return d + circle.radius <= other.radius + 3;
    })
  );
}

function shouldClusterCircles(a: RevealCircle, b: RevealCircle): boolean {
  const d = distanceMeters(revealCoord(a), revealCoord(b));
  return d <= a.radius + b.radius + CLUSTER_BRIDGE_METERS;
}

/** Group nearby/overlapping reveals into one explored region (union-find). */
export function clusterRevealCircles(circles: RevealCircle[]): RevealCircle[][] {
  if (circles.length === 0) return [];

  const parent = circles.map((_, i) => i);

  const find = (i: number): number => {
    let root = i;
    while (parent[root] !== root) root = parent[root];
    let node = i;
    while (parent[node] !== node) {
      const next = parent[node];
      parent[node] = root;
      node = next;
    }
    return root;
  };

  const union = (i: number, j: number) => {
    const ri = find(i);
    const rj = find(j);
    if (ri !== rj) parent[ri] = rj;
  };

  for (let i = 0; i < circles.length; i++) {
    for (let j = i + 1; j < circles.length; j++) {
      if (shouldClusterCircles(circles[i], circles[j])) union(i, j);
    }
  }

  const groups = new Map<number, RevealCircle[]>();
  for (let i = 0; i < circles.length; i++) {
    const root = find(i);
    const group = groups.get(root) ?? [];
    group.push(circles[i]);
    groups.set(root, group);
  }

  return [...groups.values()];
}

/** One fog hole per explored cluster: union of circles, not stacked bubbles. */
export function clusterToRevealHole(cluster: RevealCircle[]): LatLng[] {
  if (cluster.length === 1) {
    const c = cluster[0];
    return circleToPolygonHole(c.lat, c.lng, c.radius);
  }

  const samples: LatLng[] = [];
  for (const circle of cluster) {
    samples.push(...sampleCircleBoundary(circle, CLUSTER_CIRCLE_SEGMENTS));
  }

  const hull = convexHull(samples);
  if (hull.length >= 3) return hull;

  const c = cluster[0];
  return circleToPolygonHole(c.lat, c.lng, c.radius);
}

export function roundCoordForFog(
  lat: number,
  lng: number,
  precisionMeters = 3
): { latitude: number; longitude: number } {
  const latStep = precisionMeters / 111320;
  const lngStep = precisionMeters / (111320 * Math.cos((lat * Math.PI) / 180));
  return {
    latitude: Math.round(lat / latStep) * latStep,
    longitude: Math.round(lng / lngStep) * lngStep,
  };
}

export type FogPolygon = {
  coordinates: LatLng[];
  holes: LatLng[][];
};

function collectRevealCircles(
  region: Region,
  unlockedAreas: UnlockedArea[],
  liveCenter: { latitude: number; longitude: number },
  liveRadiusMeters: number
): RevealCircle[] {
  const bounds = boundsFromRegion(region);
  let circles: RevealCircle[] = [
    { lat: liveCenter.latitude, lng: liveCenter.longitude, radius: liveRadiusMeters },
  ];

  for (const area of unlockedAreas) {
    const center = { latitude: area.centerLatitude, longitude: area.centerLongitude };
    const radius = area.radiusMeters > 0 ? area.radiusMeters : liveRadiusMeters;
    if (!circleIntersectsBounds(center, radius, bounds)) continue;
    circles.push({ lat: center.latitude, lng: center.longitude, radius });
  }

  return dedupeRevealCircles(circles);
}

export function buildFogPolygon(
  region: Region,
  unlockedAreas: UnlockedArea[],
  liveCenter: { latitude: number; longitude: number },
  liveRadiusMeters: number
): FogPolygon {
  const viewCenter = { latitude: region.latitude, longitude: region.longitude };
  const circles = collectRevealCircles(region, unlockedAreas, liveCenter, liveRadiusMeters);
  const clusters = clusterRevealCircles(circles);

  type HoleCandidate = { dist: number; hole: LatLng[] };
  const candidates: HoleCandidate[] = clusters.map((cluster) => {
    const anchor = cluster.reduce(
      (best, c) => (c.radius > best.radius ? c : best),
      cluster[0]
    );
    return {
      dist: distanceMeters(viewCenter, revealCoord(anchor)),
      hole: clusterToRevealHole(cluster),
    };
  });

  candidates.sort((a, b) => a.dist - b.dist);
  const holes = candidates.slice(0, MAX_FOG_HOLES).map((c) => c.hole);

  return {
    coordinates: regionOuterRing(region),
    holes,
  };
}

/** @deprecated Use clusterRevealCircles; kept for tests if any */
export function mergeOverlappingRevealCircles(circles: RevealCircle[]): RevealCircle[] {
  return clusterRevealCircles(circles).map((cluster) => {
    if (cluster.length === 1) return cluster[0];
    const samples = cluster.flatMap((c) => sampleCircleBoundary(c, 12));
    const hull = convexHull(samples);
    if (hull.length < 3) return cluster[0];
    const lat = hull.reduce((s, p) => s + p.latitude, 0) / hull.length;
    const lng = hull.reduce((s, p) => s + p.longitude, 0) / hull.length;
    let radius = 0;
    for (const p of hull) {
      radius = Math.max(radius, distanceMeters({ latitude: lat, longitude: lng }, p));
    }
    return { lat, lng, radius };
  });
}
