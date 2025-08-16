---
layout: default
title: 蔡李佛源流表 Choy Lee Fut Lineage Chart 
lang: en
canonical: /lineage/
meta:
  description: Explore the complete Choy Lee Fut Kung Fu lineage chart (蔡李佛源流表), tracing generations of masters and students. Discover the history, key figures, and connections in this traditional Chinese martial art, as practiced and taught worldwide.
  keywords: Choy Lee Fut, Choy Li Fut, Choy Lay Fut, 蔡李佛, 源流表, 世系表, Kung Fu lineage, martial arts lineage, Chinese martial arts, kung fu history, kung fu masters, kung fu generations, Chan Heung, 陳享, Jeung Yim, 張炎, 張鴻勝, 陳官伯, 崔廣源, 李冠雄, Hong Sheng, Lee Koon Hung, 潘城, Poon Shing, Wong Tat Mou, 王達謀, 杜深, traditional kung fu, kung fu family tree, kung fu Sydney, kung fu Australia, kung fu teachers, kung fu students, kung fu genealogy, martial arts heritage, kung fu chart, kung fu ancestors, kung fu successors
  og: 
    image: /assets/images/blogs/choy-lee-fut-style-01.png
---

<h1 class="p-10 text-4xl font-bold mb-4">Choy Lee Fut Lineage Chart 蔡李佛源流表</h1>

<section class="text-center text-sm italic border border-gray-300 p-2 mb-8 mx-auto">
    此源流表取材自網絡及AI。如有任何錯誤敬希 <a href="/#contact">聯絡我們</a> 指正。
    轉載請註明以上及 sydneykungfu.au 出處。
    This lineage chart was soruced from the Internet and AI. <a href="/#contact">Contact us</a> for any issues
    Please credit sydneykungfu.au when sharing content.
</section>

<div class="mb-8">
  <input id="lineage-filter" type="text" placeholder="Filter by name..." class="border border-gray-300 rounded px-3 py-2 w-full text-xl" />
</div>
<div id="lineage-chart" class="my-8"></div>

<script>
fetch('/assets/data/lineage.json')
  .then(res => res.json())
  .then(data => {
    // Helper: check if node matches filter
    function nodeMatches(node, filter) {
      if (!filter) return false;
      const f = filter.toLowerCase();
      return (
        (node["Chinese Name"] && node["Chinese Name"].toLowerCase().includes(f)) ||
        (node["Mandarin Name"] && node["Mandarin Name"].toLowerCase().includes(f)) ||
        (node["Cantonese Name"] && node["Cantonese Name"].toLowerCase().includes(f))
      );
    }

    // Recursively search for matches, return {show, node, children}
    function filterTree(node, filter) {
      let matched = nodeMatches(node, filter);
      let children = [];
      if (Array.isArray(node.students)) {
        children = node.students.map(child => filterTree(child, filter)).filter(c => c.show);
      }
      // If any child matched, or this node matched, we show this node
      if (matched || children.length > 0) {
        return { show: true, node, children, matched };
      }
      return { show: false };
    }

    // Find all paths to matches, then reconstruct tree with ancestors and descendants
    function findPaths(node, filter, path = []) {
      let matches = [];
      let isMatch = nodeMatches(node, filter);
      let newPath = [...path, node];
      if (isMatch) matches.push(newPath);
      if (Array.isArray(node.students)) {
        for (const child of node.students) {
          matches = matches.concat(findPaths(child, filter, newPath));
        }
      }
      return matches;
    }

    // Build a minimal tree containing all ancestors and descendants of matches
    function buildFilteredTree(node, filter) {
      if (!filter) return node;
      const paths = findPaths(node, filter);
      if (paths.length === 0) return null;
      // Mark all nodes in all paths as "keep"
      const keepSet = new Set();
      for (const path of paths) {
        for (const n of path) keepSet.add(n);
      }
      // Recursively clone only kept nodes and their full subtrees if they are a match
      function clone(node) {
        if (!keepSet.has(node)) return null;
        let students = [];
        if (Array.isArray(node.students)) {
          students = node.students.map(clone).filter(Boolean);
        }
        // If this node is a match, include all its descendants
        if (nodeMatches(node, filter)) {
          students = node.students ? node.students.map(cloneAll).filter(Boolean) : [];
        }
        return { ...node, students };
      }
      // Clone all descendants
      function cloneAll(node) {
        let students = [];
        if (Array.isArray(node.students)) {
          students = node.students.map(cloneAll).filter(Boolean);
        }
        return { ...node, students };
      }
      return clone(node);
    }

    function renderNode(node, level = 0, highlight = "") {
      if (!node) return "";
      const gn = node["generation"] || "";
      const cn = node["Chinese Name"] || "";
      const mn = node["Mandarin Name"] || "";
      const ct = node["Cantonese Name"] || "";
      const remarks = node["Remarks"] || "";
      const indent = level * 1.5;
      // Highlight if matches filter
      const isHighlight = highlight && nodeMatches(node, highlight);
      return `
        <div class="mb-4" style="margin-left: ${indent}rem;">
          <div class="bg-white border border-gray-300 rounded-lg px-4 py-2 shadow flex flex-col ${isHighlight ? 'bg-yellow-100 border-yellow-400' : ''}">
            <span class="text-xl font-bold text-gray-800">${cn}</span>
            <span class="text-sm text-gray-700">Generation ${gn} ${mn}${mn && ct ? " / " : ""}${ct}</span>
            ${remarks ? `<span class="text-xs text-gray-500">${remarks}</span>` : ""}
          </div>
          ${Array.isArray(node.students) && node.students.length > 0 ? `
            <div class="mt-2">
              ${node.students.map(child => renderNode(child, level + 1, highlight)).join('')}
            </div>
          ` : ""}
        </div>
      `;
    }

    let currentFilter = "";
    function update() {
      const filter = currentFilter.trim();
      const filtered = buildFilteredTree(data, filter);
      document.getElementById('lineage-chart').innerHTML = filtered
        ? renderNode(filtered, 0, filter)
        : '<div class="text-gray-500">No results found.</div>';
    }

    document.getElementById('lineage-filter').addEventListener('input', e => {
      currentFilter = e.target.value;
      update();
    });

    // Initial render
    update();
  });
</script>