"use strict";
/**
 * Safety-weighted routing.
 *
 * The road network is a directed graph. A node is an intersection (or a
 * sampled point on a candidate path). An edge is a road segment.
 *
 * Google Directions remains the source of candidate geometry in the current
 * app. generateRoutes runs A*, bidirectional A*, and Yen's algorithm on
 * whatever graph it is given, including a graph built only from those
 * candidates and a graph loaded from road_segments.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.V_MAX_KMH = exports.SAFETY_LAMBDA = exports.MODE_WEIGHTS = void 0;
exports.haversineM = haversineM;
exports.edgeCost = edgeCost;
exports.heuristic = heuristic;
exports.aStar = aStar;
exports.bidirectionalAStar = bidirectionalAStar;
exports.yenKShortest = yenKShortest;
exports.generateRoutes = generateRoutes;
exports.graphFromCandidates = graphFromCandidates;
exports.routeIndexFromPath = routeIndexFromPath;
exports.planCandidateRoutes = planCandidateRoutes;
exports.MODE_WEIGHTS = {
    safest: { distance: 0.15, safety: 0.75, time: 0.1 },
    balanced: { distance: 0.25, safety: 0.4, time: 0.35 },
    fastest: { distance: 0.15, safety: 0.1, time: 0.75 },
};
/** Scales the per-kilometre risk term so an unsafe kilometre costs more than a safe one. */
exports.SAFETY_LAMBDA = 3;
/** Upper speed used by the admissible heuristic. */
exports.V_MAX_KMH = 80;
function haversineM(a, b) {
    const R = 6371000;
    const toRad = (deg) => (deg * Math.PI) / 180;
    const dLat = toRad(b.latitude - a.latitude);
    const dLng = toRad(b.longitude - a.longitude);
    const lat1 = toRad(a.latitude);
    const lat2 = toRad(b.latitude);
    const h = Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}
/**
 * c(e) = wD * distancePenalty + wS * safetyPenalty + wT * etaMinutes
 * distancePenalty = kilometres
 * safetyPenalty = risk * kilometres * λ
 * risk = (100 - safetyScore) / 100
 */
function edgeCost(edge, mode) {
    const w = exports.MODE_WEIGHTS[mode];
    const km = edge.lengthM / 1000;
    const risk = (100 - clampScore(edge.safetyScore)) / 100;
    const distancePenalty = km;
    const safetyPenalty = risk * km * exports.SAFETY_LAMBDA;
    const speed = Math.max(edge.speedKmh, 1);
    const etaMinutes = (km / speed) * 60;
    return (w.distance * distancePenalty +
        w.safety * safetyPenalty +
        w.time * etaMinutes);
}
function clampScore(score) {
    return Math.min(100, Math.max(0, score));
}
/**
 * Admissible and consistent for non-negative safety penalties:
 * ignore safety (it only adds cost) and assume V_MAX for time.
 */
function heuristic(from, goal, mode) {
    const w = exports.MODE_WEIGHTS[mode];
    const km = haversineM(from, goal) / 1000;
    return w.distance * km + w.time * (km / exports.V_MAX_KMH) * 60;
}
function adjacency(graph) {
    const adj = new Map();
    for (const edge of graph.edges) {
        const list = adj.get(edge.from) ?? [];
        list.push(edge);
        adj.set(edge.from, list);
    }
    return adj;
}
/**
 * A* on the safety-weighted cost. Optimal when the heuristic is admissible,
 * which it is because every omitted term is >= 0 and time uses V_MAX.
 */
function aStar(graph, startId, goalId, mode, opts = {}) {
    const goal = graph.nodes[goalId];
    const start = graph.nodes[startId];
    if (!goal || !start)
        return null;
    const adj = adjacency(graph);
    const blockedEdges = opts.blockedEdgeIds ?? new Set();
    const blockedNodes = opts.blockedNodeIds ?? new Set();
    const gScore = new Map([[startId, 0]]);
    const parent = new Map();
    const open = [
        { id: startId, f: heuristic(start, goal, mode) },
    ];
    const closed = new Set();
    while (open.length > 0) {
        open.sort((a, b) => a.f - b.f);
        const current = open.shift();
        if (closed.has(current.id))
            continue;
        if (current.id === goalId) {
            return reconstruct(graph, parent, startId, goalId, gScore.get(goalId) ?? 0);
        }
        closed.add(current.id);
        for (const edge of adj.get(current.id) ?? []) {
            if (blockedEdges.has(edge.id))
                continue;
            if (blockedNodes.has(edge.to) && edge.to !== goalId)
                continue;
            const tentative = (gScore.get(current.id) ?? Infinity) + edgeCost(edge, mode);
            if (tentative >= (gScore.get(edge.to) ?? Infinity))
                continue;
            gScore.set(edge.to, tentative);
            parent.set(edge.to, { node: current.id, edge: edge.id });
            const node = graph.nodes[edge.to];
            open.push({
                id: edge.to,
                f: tentative + heuristic(node, goal, mode),
            });
        }
    }
    return null;
}
/**
 * Bidirectional A* using a consistent potential (Pohl):
 *   πf(n) = (h(n, goal) - h(n, start)) / 2
 *   πb(n) = -πf(n)
 * Reduced costs stay non-negative. Search stops when the best forward
 * and backward labels cannot improve the meeting path.
 */
function bidirectionalAStar(graph, startId, goalId, mode) {
    const start = graph.nodes[startId];
    const goal = graph.nodes[goalId];
    if (!start || !goal)
        return null;
    const forwardAdj = adjacency(graph);
    const backwardAdj = new Map();
    for (const edge of graph.edges) {
        const reversed = {
            ...edge,
            id: edge.id,
            from: edge.to,
            to: edge.from,
        };
        const list = backwardAdj.get(reversed.from) ?? [];
        list.push(reversed);
        backwardAdj.set(reversed.from, list);
    }
    const potential = (nodeId) => {
        const node = graph.nodes[nodeId];
        return (heuristic(node, goal, mode) - heuristic(node, start, mode)) / 2;
    };
    const gF = new Map([[startId, 0]]);
    const gB = new Map([[goalId, 0]]);
    const parentF = new Map();
    const parentB = new Map();
    const openF = [{ id: startId, f: 0 }];
    const openB = [{ id: goalId, f: 0 }];
    const closedF = new Set();
    const closedB = new Set();
    let best = Infinity;
    let meet = null;
    const reduced = (edge, direction) => {
        const raw = edgeCost(edge, mode);
        const piFrom = potential(edge.from);
        const piTo = potential(edge.to);
        return direction === "f" ? raw + piTo - piFrom : raw + piFrom - piTo;
    };
    const expand = (open, closed, gScore, otherG, parent, adj, direction) => {
        open.sort((a, b) => a.f - b.f);
        const current = open.shift();
        if (!current || closed.has(current.id))
            return;
        closed.add(current.id);
        if (otherG.has(current.id)) {
            const total = (gScore.get(current.id) ?? Infinity) + (otherG.get(current.id) ?? Infinity);
            if (total < best) {
                best = total;
                meet = current.id;
            }
        }
        for (const edge of adj.get(current.id) ?? []) {
            const step = reduced(edge, direction);
            const tentative = (gScore.get(current.id) ?? Infinity) + step;
            if (tentative >= (gScore.get(edge.to) ?? Infinity))
                continue;
            gScore.set(edge.to, tentative);
            parent.set(edge.to, { node: current.id, edge: edge.id });
            open.push({ id: edge.to, f: tentative });
        }
    };
    let guard = 0;
    while (openF.length > 0 && openB.length > 0 && guard < graph.edges.length * 4) {
        guard += 1;
        const topF = Math.min(...openF.map((item) => item.f));
        const topB = Math.min(...openB.map((item) => item.f));
        if (meet && topF + topB >= best)
            break;
        if (topF <= topB)
            expand(openF, closedF, gF, gB, parentF, forwardAdj, "f");
        else
            expand(openB, closedB, gB, gF, parentB, backwardAdj, "b");
    }
    if (!meet)
        return aStar(graph, startId, goalId, mode);
    return stitchBidirectional(graph, startId, goalId, meet, parentF, parentB, mode);
}
function walkParents(fromId, toId, parent) {
    const nodes = [fromId];
    let cursor = fromId;
    const guard = parent.size + 2;
    let steps = 0;
    while (cursor !== toId) {
        const step = parent.get(cursor);
        if (!step || steps > guard)
            return null;
        nodes.push(step.node);
        cursor = step.node;
        steps += 1;
    }
    return nodes;
}
function stitchBidirectional(graph, startId, goalId, meet, parentF, parentB, mode) {
    const backToStart = walkParents(meet, startId, parentF);
    const onToGoal = walkParents(meet, goalId, parentB);
    if (!backToStart || !onToGoal)
        return aStar(graph, startId, goalId, mode);
    const forward = [...backToStart].reverse();
    const nodeIds = [...forward, ...onToGoal.slice(1)];
    const edgeIds = [];
    for (let index = 0; index < nodeIds.length - 1; index += 1) {
        const edge = graph.edges.find((item) => item.from === nodeIds[index] && item.to === nodeIds[index + 1]);
        if (!edge)
            return aStar(graph, startId, goalId, mode);
        edgeIds.push(edge.id);
    }
    const cost = edgeIds.reduce((sum, id) => {
        const edge = graph.edges.find((item) => item.id === id);
        return sum + (edge ? edgeCost(edge, mode) : 0);
    }, 0);
    return summarize(graph, nodeIds, edgeIds, cost);
}
/**
 * Yen's K loopless shortest paths. The shortest-path subroutine is A*.
 */
function yenKShortest(graph, startId, goalId, k, mode) {
    const first = aStar(graph, startId, goalId, mode);
    if (!first)
        return [];
    const accepted = [first];
    const candidates = [];
    for (let ki = 1; ki < k; ki += 1) {
        const previous = accepted[ki - 1];
        for (let i = 0; i < previous.nodeIds.length - 1; i += 1) {
            const spurNode = previous.nodeIds[i];
            const root = previous.nodeIds.slice(0, i + 1);
            const blockedEdges = new Set();
            const blockedNodes = new Set(root.slice(0, -1));
            for (const path of accepted) {
                const sharesRoot = root.every((nodeId, index) => path.nodeIds[index] === nodeId);
                if (!sharesRoot)
                    continue;
                const edgeId = path.edgeIds[i];
                if (edgeId)
                    blockedEdges.add(edgeId);
            }
            const spur = aStar(graph, spurNode, goalId, mode, {
                blockedEdgeIds: blockedEdges,
                blockedNodeIds: blockedNodes,
            });
            if (!spur)
                continue;
            const nodeIds = [...root.slice(0, -1), ...spur.nodeIds];
            const rootEdgeIds = [];
            for (let r = 0; r < i; r += 1)
                rootEdgeIds.push(previous.edgeIds[r]);
            const edgeIds = [...rootEdgeIds, ...spur.edgeIds];
            const signature = nodeIds.join(">");
            const seen = accepted.some((path) => path.nodeIds.join(">") === signature) ||
                candidates.some((path) => path.nodeIds.join(">") === signature);
            if (seen)
                continue;
            const cost = edgeIds.reduce((sum, id) => {
                const edge = graph.edges.find((item) => item.id === id);
                return sum + (edge ? edgeCost(edge, mode) : 0);
            }, 0);
            candidates.push(summarize(graph, nodeIds, edgeIds, cost));
        }
        if (candidates.length === 0)
            break;
        candidates.sort((a, b) => a.cost - b.cost);
        const next = candidates.shift();
        if (next)
            accepted.push(next);
    }
    return accepted;
}
function generateRoutes(graph, startId, goalId) {
    const safest = aStar(graph, startId, goalId, "safest");
    const fastest = bidirectionalAStar(graph, startId, goalId, "fastest");
    const balancedPaths = yenKShortest(graph, startId, goalId, 3, "balanced");
    const safestKey = safest?.nodeIds.join(">") ?? "";
    const fastestKey = fastest?.nodeIds.join(">") ?? "";
    const balanced = balancedPaths.find((path) => {
        const key = path.nodeIds.join(">");
        return key !== safestKey && key !== fastestKey;
    }) ??
        balancedPaths[0] ??
        aStar(graph, startId, goalId, "balanced");
    return { safest, balanced, fastest };
}
function reconstruct(graph, parent, startId, goalId, cost) {
    const nodeIds = [goalId];
    const edgeIds = [];
    let cursor = goalId;
    while (cursor !== startId) {
        const step = parent.get(cursor);
        if (!step)
            break;
        edgeIds.push(step.edge);
        nodeIds.push(step.node);
        cursor = step.node;
    }
    nodeIds.reverse();
    edgeIds.reverse();
    return summarize(graph, nodeIds, edgeIds, cost);
}
function summarize(graph, nodeIds, edgeIds, cost) {
    let distanceM = 0;
    let etaMinutes = 0;
    let safetyMass = 0;
    let lightMass = 0;
    let lightWeight = 0;
    let crowdMass = 0;
    let crowdWeight = 0;
    for (const id of edgeIds) {
        const edge = graph.edges.find((item) => item.id === id);
        if (!edge)
            continue;
        distanceM += edge.lengthM;
        const speed = Math.max(edge.speedKmh, 1);
        etaMinutes += (edge.lengthM / 1000 / speed) * 60;
        safetyMass += edge.safetyScore * edge.lengthM;
        if (edge.lighting != null && edge.lengthM > 0) {
            lightMass += edge.lighting * edge.lengthM;
            lightWeight += edge.lengthM;
        }
        if (edge.crowd != null && edge.lengthM > 0) {
            crowdMass += edge.crowd * edge.lengthM;
            crowdWeight += edge.lengthM;
        }
    }
    return {
        nodeIds,
        edgeIds,
        cost,
        distanceM,
        etaMinutes,
        safetyScore: distanceM > 0 ? safetyMass / distanceM : 0,
        lighting: lightWeight > 0 ? lightMass / lightWeight : null,
        crowd: crowdWeight > 0 ? crowdMass / crowdWeight : null,
    };
}
const SOURCE_ID = "__source__";
const SINK_ID = "__sink__";
/**
 * Builds one graph from Directions alternatives. A zero-length link joins
 * every candidate to a shared source and sink so A* selects among them.
 * Lengths are scaled to the Directions distance and speed is chosen so the
 * path ETA matches the Directions duration.
 */
function graphFromCandidates(routes, safetyAt) {
    const nodes = {};
    const edges = [];
    const first = routes[0]?.coordinates[0];
    const lastRoute = routes[0];
    const last = lastRoute?.coordinates[lastRoute.coordinates.length - 1];
    if (!first || !last)
        return { nodes, edges };
    nodes[SOURCE_ID] = { id: SOURCE_ID, ...first };
    nodes[SINK_ID] = { id: SINK_ID, ...last };
    routes.forEach((route, routeIndex) => {
        const sampled = sampleCoordinates(route.coordinates);
        if (sampled.length < 2)
            return;
        const rawLengths = sampled.slice(1).map((point, index) => Math.max(1, haversineM(sampled[index], point)));
        const rawSum = rawLengths.reduce((sum, length) => sum + length, 0);
        const targetM = Math.max(route.distanceKm * 1000, 1);
        const scale = targetM / rawSum;
        const speedKmh = targetM / 1000 / Math.max(route.durationMin / 60, 1 / 60);
        sampled.forEach((point, index) => {
            const id = `r${routeIndex}p${index}`;
            nodes[id] = { id, ...point };
        });
        edges.push({
            id: `link-in-${routeIndex}`,
            from: SOURCE_ID,
            to: `r${routeIndex}p0`,
            lengthM: 0,
            speedKmh: 50,
            safetyScore: 100,
            lighting: null,
            crowd: null,
        });
        for (let index = 0; index < sampled.length - 1; index += 1) {
            const from = sampled[index];
            const to = sampled[index + 1];
            const mid = {
                latitude: (from.latitude + to.latitude) / 2,
                longitude: (from.longitude + to.longitude) / 2,
            };
            const safety = safetyAt(mid);
            edges.push({
                id: `r${routeIndex}e${index}`,
                from: `r${routeIndex}p${index}`,
                to: `r${routeIndex}p${index + 1}`,
                lengthM: rawLengths[index] * scale,
                speedKmh,
                safetyScore: safety.score,
                lighting: safety.lighting,
                crowd: safety.crowd,
            });
        }
        edges.push({
            id: `link-out-${routeIndex}`,
            from: `r${routeIndex}p${sampled.length - 1}`,
            to: SINK_ID,
            lengthM: 0,
            speedKmh: 50,
            safetyScore: 100,
            lighting: null,
            crowd: null,
        });
    });
    return { nodes, edges };
}
function sampleCoordinates(coordinates) {
    if (coordinates.length <= 2)
        return coordinates.slice();
    const sampled = [];
    for (let index = 0; index < coordinates.length; index += 5) {
        sampled.push(coordinates[index]);
    }
    const last = coordinates[coordinates.length - 1];
    const tail = sampled[sampled.length - 1];
    if (tail.latitude !== last.latitude || tail.longitude !== last.longitude) {
        sampled.push(last);
    }
    return sampled;
}
function routeIndexFromPath(path) {
    if (!path)
        return null;
    const match = path.nodeIds.map((id) => /^r(\d+)p/.exec(id)).find((item) => item);
    return match ? Number(match[1]) : null;
}
const TITLES = {
    safest: "Safest Route",
    balanced: "Balanced Route",
    fastest: "Fastest Route",
};
/**
 * Runs the three searches and returns one card per distinct candidate.
 */
function planCandidateRoutes(routes, safetyAt) {
    if (routes.length === 0)
        return [];
    const graph = graphFromCandidates(routes, safetyAt);
    const generated = generateRoutes(graph, SOURCE_ID, SINK_ID);
    const chosen = [];
    ["safest", "fastest", "balanced"].forEach((mode) => {
        const path = generated[mode];
        if (!path)
            return;
        chosen.push({ mode, path });
    });
    const used = new Set();
    const planned = [];
    for (const item of chosen) {
        const index = routeIndexFromPath(item.path);
        if (index == null || used.has(index) || !routes[index])
            continue;
        used.add(index);
        const source = routes[index];
        planned.push({
            ...source,
            mode: item.mode,
            title: TITLES[item.mode],
            safetyScore: item.path.safetyScore,
            etaMinutes: source.durationMin,
            lighting: item.path.lighting,
            crowd: item.path.crowd,
            cost: item.path.cost,
        });
    }
    return planned;
}
