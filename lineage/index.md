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

<!-- Sticky filter: no mb-8 here, and ensure it's not inside a parent with margin/padding -->
<div class="sticky z-20 bg-white bg-opacity-95 border-b border-gray-200 py-4" style="top: 76px">
  <input id="lineage-filter" type="text" placeholder="Filter by name..." class="border border-gray-300 rounded px-3 py-2 w-full text-xl" />
</div>
<!-- Add margin below sticky filter for spacing -->
<div class="mb-8"></div>
<div id="lineage-chart" class="my-8" style="overflow-x: auto;"></div>

<script>
function getQueryParam(name) {
  const url = new URL(window.location.href);
  return url.searchParams.get(name) || "";
}

function setQueryParam(name, value) {
  const url = new URL(window.location.href);
  if (value) {
    url.searchParams.set(name, value);
  } else {
    url.searchParams.delete(name);
  }
  history.pushState(null, '', url.toString());
}

fetch('/assets/data/lineage.json')
  .then(res => res.json())
  .then(data => {
    // Assign a stable numeric id to every node
    let _idCounter = 0;
    function assignIds(node) {
      node._id = _idCounter++;
      if (Array.isArray(node.students)) node.students.forEach(assignIds);
    }
    assignIds(data);

    // Track expand/collapse state per node id; default: expanded for gen <= 3
    const expandedState = new Map();

    function isExpanded(node, forceExpanded) {
      if (forceExpanded) return true;
      return expandedState.has(node._id) ? expandedState.get(node._id) : true;
    }

    function nodeMatches(node, filter) {
      if (!filter) return false;
      const f = filter.toLowerCase();
      return (
        (node["Chinese Name"] && node["Chinese Name"].toLowerCase().includes(f)) ||
        (node["Mandarin Name"] && node["Mandarin Name"].toLowerCase().includes(f)) ||
        (node["Cantonese Name"] && node["Cantonese Name"].toLowerCase().includes(f))
      );
    }

    function findPaths(node, filter, path = []) {
      let matches = [];
      const newPath = [...path, node];
      if (nodeMatches(node, filter)) matches.push(newPath);
      if (Array.isArray(node.students)) {
        for (const child of node.students) {
          matches = matches.concat(findPaths(child, filter, newPath));
        }
      }
      return matches;
    }

    function buildFilteredTree(node, filter) {
      if (!filter) return node;
      const paths = findPaths(node, filter);
      if (paths.length === 0) return null;
      const keepSet = new Set();
      for (const path of paths) for (const n of path) keepSet.add(n);
      function cloneAll(node) {
        return { ...node, students: Array.isArray(node.students) ? node.students.map(cloneAll) : [] };
      }
      function clone(node) {
        if (!keepSet.has(node)) return null;
        let students = Array.isArray(node.students) ? node.students.map(clone).filter(Boolean) : [];
        if (nodeMatches(node, filter)) students = Array.isArray(node.students) ? node.students.map(cloneAll) : [];
        return { ...node, students };
      }
      return clone(node);
    }

    function renderNode(node, level = 0, forceExpanded = false, highlight = "") {
      if (!node) return "";
      const id = node._id;
      const hasChildren = Array.isArray(node.students) && node.students.length > 0;
      const expanded = isExpanded(node, forceExpanded);
      const cn = node["Chinese Name"] || "";
      const mn = node["Mandarin Name"] || "";
      const ct = node["Cantonese Name"] || "";
      const gn = node["generation"] || "";
      const remarks = node["Remarks"] || "";
      const namePart = mn && ct ? `${mn} / ${ct}` : (mn || ct);
      const isHighlight = highlight && nodeMatches(node, highlight);
      const childrenId = `ch${id}`;
      const indent = level * 0.5;

      return `
        <div class="mb-4" style="margin-left: ${indent}rem;">
          <div class="border border-gray-300 rounded-lg px-4 py-2 shadow flex items-start ${isHighlight ? 'bg-yellow-100 border-yellow-400' : 'bg-white'}">
            <div class="flex flex-col min-w-0 flex-1">
              <span class="text-xl font-bold text-gray-800">${cn}</span>
              <span class="text-sm text-gray-700">Generation ${gn}${namePart ? `  ${namePart}` : ''}</span>
              ${remarks ? `<span class="text-xs text-gray-500">${remarks}</span>` : ''}
            </div>
            ${hasChildren ? `
              <button
                data-id="${id}"
                data-children="${childrenId}"
                aria-expanded="${expanded}"
                class="ml-2 flex-shrink-0 text-gray-400 hover:text-gray-700 w-8 h-8 flex items-center justify-center text-lg rounded hover:bg-gray-100 active:bg-gray-200"
              >${expanded ? '▾' : '▸'}</button>
            ` : ''}
          </div>
          ${hasChildren ? `
            <div id="${childrenId}" class="mt-2"${!expanded ? ' style="display:none"' : ''}>
              ${node.students.map(child => renderNode(child, level + 1, forceExpanded, highlight)).join('')}
            </div>
          ` : ''}
        </div>
      `;
    }

    // Toggle without re-rendering the whole tree
    document.getElementById('lineage-chart').addEventListener('click', e => {
      const btn = e.target.closest('[data-id]');
      if (!btn) return;
      const id = Number(btn.dataset.id);
      const childrenDiv = document.getElementById(btn.dataset.children);
      const nowExpanded = btn.getAttribute('aria-expanded') === 'true';
      expandedState.set(id, !nowExpanded);
      btn.setAttribute('aria-expanded', !nowExpanded);
      btn.textContent = !nowExpanded ? '▾' : '▸';
      if (childrenDiv) childrenDiv.style.display = !nowExpanded ? '' : 'none';
    });

    let currentFilter = getQueryParam('q');
    const filterInput = document.getElementById('lineage-filter');
    filterInput.value = currentFilter;

    function update() {
      const filter = currentFilter.trim();
      const forceExpanded = filter !== "";
      const filtered = buildFilteredTree(data, filter);
      document.getElementById('lineage-chart').innerHTML = filtered
        ? renderNode(filtered, 0, forceExpanded, filter)
        : '<div class="text-gray-500">No results found.</div>';
    }

    filterInput.addEventListener('input', e => {
      currentFilter = e.target.value;
      setQueryParam('q', currentFilter);
      update();
    });

    update();
  });
</script>