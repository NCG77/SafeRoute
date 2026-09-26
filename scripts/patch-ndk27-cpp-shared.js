/**
 * NDK 27 does not reliably link libc++_shared even when ANDROID_STL=c++_shared.
 * Walk all Android CMakeLists that build SHARED libs and inject c++_shared.
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..", "node_modules");
const skipDir = new Set(["build", ".cxx", "ReactCommon", "ReactAndroid"]);

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    if (skipDir.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, out);
    } else if (
      entry.isFile() &&
      (entry.name === "CMakeLists.txt" || entry.name.endsWith(".cmake")) &&
      full.includes(`${path.sep}android${path.sep}`)
    ) {
      out.push(full);
    }
  }
  return out;
}

function injectCppShared(content) {
  if (!/\bSHARED\b/.test(content)) return null;
  if (content.includes("c++_shared")) return null;

  let changed = false;
  const next = content.replace(
    /target_link_libraries\(\s*([^\s)/]+)\s*(?:\r?\n[ \t]*(PRIVATE|PUBLIC|INTERFACE)[ \t]*)?\r?\n([ \t]*)/g,
    (match, target, visibility, indent) => {
      changed = true;
      const ind = indent || "  ";
      if (visibility) {
        return `target_link_libraries(\n${ind}${target}\n${ind}${visibility}\n${ind}c++_shared\n${ind}`;
      }
      return `target_link_libraries(\n${ind}${target}\n${ind}c++_shared\n${ind}`;
    }
  );

  return changed ? next : null;
}

const files = walk(root);
let patched = 0;

for (const file of files) {
  const before = fs.readFileSync(file, "utf8");
  const after = injectCppShared(before);
  if (!after) continue;
  fs.writeFileSync(file, after);
  patched += 1;
  console.log(`[patch-ndk27] ${path.relative(path.join(__dirname, ".."), file)}`);
}

console.log(`[patch-ndk27] patched ${patched} file(s)`);
