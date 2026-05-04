/**
 * TechSarge Admin Panel Logic
 * -------------------------------------------------------
 * Auth gate, tab switching, video/os/product CRUD,
 * OS step management (modal), product image upload (base64).
 */

// ── Auth gate ──
if (typeof Auth === "undefined" || !Auth.isAuthenticated()) {
  window.location.href = "index.html";
}

// ── Helpers ──
function escHtml(s) {
  return String(s || "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}
function fmtNum(n) {
  if (!n) return "0";
  if (n >= 1000) return (n / 1000).toFixed(1) + "k";
  return String(n);
}
function val(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : "";
}
function clearField(id) {
  const el = document.getElementById(id);
  if (el) el.value = "";
}

// ── Tab switching ──
document.querySelectorAll(".ts-admin-tab").forEach((btn) => {
  btn.addEventListener("click", () => {
    const target = btn.getAttribute("data-target");
    document.querySelectorAll(".ts-admin-tab").forEach((b) => b.classList.remove("active"));
    document.querySelectorAll(".ts-admin-section").forEach((s) => {
      s.classList.toggle("active", s.id === target);
      s.classList.toggle("hidden", s.id !== target);
    });
    btn.classList.add("active");
  });
});

// ── Analytics tab ──
function renderAnalytics() {
  const videos = Storage.videos.list();
  const os = Storage.osLinks.list();
  const prods = Storage.products.list();
  const totalViews = videos.reduce((s, v) => s + (v.views || 0), 0);

  const el = (id) => document.getElementById(id);
  if (el("stat-videos")) el("stat-videos").textContent = videos.length;
  if (el("stat-views")) el("stat-views").textContent = fmtNum(totalViews);
  if (el("stat-os")) el("stat-os").textContent = os.length;
  if (el("stat-products")) el("stat-products").textContent = prods.length;

  const sorted = [...videos].sort((a, b) => (b.views || 0) - (a.views || 0));
  const tbody = el("analytics-table");
  if (!tbody) return;
  if (sorted.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="px-5 py-8 text-center text-zinc-500 text-xs">No videos found.</td></tr>';
    return;
  }
  tbody.innerHTML = sorted.map((v) => `
    <tr class="border-b border-white/4 hover:bg-white/2 transition-colors">
      <td class="px-5 py-3 text-zinc-200 font-medium max-w-xs truncate">${escHtml(v.title)}</td>
      <td class="px-5 py-3 text-cyan-400 font-mono font-bold">${fmtNum(v.views)}</td>
      <td class="px-5 py-3 text-zinc-400">${fmtNum(v.likes)}</td>
      <td class="px-5 py-3 text-zinc-400">${fmtNum((v.comments || []).length)}</td>
      <td class="px-5 py-3">
        <span class="text-[10px] font-bold px-2 py-0.5 rounded ${v.active ? "bg-cyan-400/15 text-cyan-400" : "bg-zinc-700/50 text-zinc-500"} uppercase tracking-widest">${v.active ? "Active" : "Hidden"}</span>
      </td>
    </tr>`).join("");
}

// ── Videos tab ──
function renderVideos() {
  const videos = Storage.videos.list();
  const tbody = document.getElementById("admin-videos-table");
  if (!tbody) return;
  if (videos.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="px-5 py-8 text-center text-zinc-500 text-xs">No videos.</td></tr>';
    return;
  }
  tbody.innerHTML = videos.map((v) => `
    <tr class="border-b border-white/4 hover:bg-white/2 transition-colors">
      <td class="px-5 py-3 text-zinc-200 font-medium max-w-xs">
        <div class="truncate max-w-[200px]">${escHtml(v.title)}</div>
        <div class="text-[10px] text-zinc-600 font-mono mt-0.5">${escHtml(v.id)}</div>
      </td>
      <td class="px-5 py-3 text-cyan-400 font-mono font-bold">${fmtNum(v.views)}</td>
      <td class="px-5 py-3 text-zinc-400">${fmtNum(v.likes)}</td>
      <td class="px-5 py-3">
        <span class="text-[10px] font-bold px-2 py-0.5 rounded ${v.active ? "bg-cyan-400/15 text-cyan-400" : "bg-zinc-700/50 text-zinc-500"} uppercase tracking-widest">${v.active ? "Active" : "Hidden"}</span>
      </td>
      <td class="px-5 py-3">
        <div class="flex gap-2">
          <button onclick="toggleVideo('${v.id}')" title="${v.active ? "Hide" : "Show"}" class="p-1.5 rounded text-zinc-500 hover:text-white hover:bg-white/8 transition-all">
            <span class="material-symbols-outlined" style="font-size:16px">${v.active ? "visibility_off" : "visibility"}</span>
          </button>
          <button onclick="deleteVideo('${v.id}')" title="Delete" class="p-1.5 rounded text-zinc-500 hover:text-red-400 hover:bg-red-400/8 transition-all">
            <span class="material-symbols-outlined" style="font-size:16px">delete</span>
          </button>
        </div>
      </td>
    </tr>`).join("");
}

function addVideo() {
  const title = val("vid-title");
  const url = val("vid-url");
  if (!title || !url) { tsToast("Title and URL are required.", "error"); return; }
  const tags = val("vid-tags").split(",").map((t) => t.trim()).filter(Boolean);
  Storage.videos.create({
    title,
    url,
    thumbnail: val("vid-thumb") || "",
    duration: val("vid-duration") || "",
    description: val("vid-desc") || "",
    tags,
    active: true,
    views: 0,
    likes: 0,
    comments: [],
    updatedAt: new Date().toISOString().slice(0, 10),
  });
  ["vid-title", "vid-url", "vid-thumb", "vid-duration", "vid-desc", "vid-tags"].forEach(clearField);
  tsToast("Video added!");
}

function toggleVideo(id) {
  Storage.videos.toggle(id, "active");
}

function deleteVideo(id) {
  if (!confirm("Permanently delete this video?")) return;
  Storage.videos.remove(id);
}

// ── OS tab ──
function renderOS() {
  const items = Storage.osLinks.list();
  const tbody = document.getElementById("admin-os-table");
  if (!tbody) return;
  if (items.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="px-5 py-8 text-center text-zinc-500 text-xs">No OS images.</td></tr>';
    return;
  }
  tbody.innerHTML = items.map((os) => `
    <tr class="border-b border-white/4 hover:bg-white/2 transition-colors">
      <td class="px-5 py-3 text-zinc-200 font-medium">
        <div>${escHtml(os.name)}</div>
        <div class="text-[10px] text-zinc-600 font-mono mt-0.5">${escHtml(os.id)}</div>
      </td>
      <td class="px-5 py-3">
        <span class="text-[10px] font-bold px-2 py-0.5 rounded ${os.labelType === "legacy" ? "bg-amber-400/15 text-amber-400" : "bg-cyan-400/15 text-cyan-400"} uppercase tracking-widest">${escHtml(os.label)}</span>
      </td>
      <td class="px-5 py-3 text-zinc-400">${(os.steps || []).length} step(s)</td>
      <td class="px-5 py-3">
        <span class="text-[10px] font-bold px-2 py-0.5 rounded ${os.active ? "bg-cyan-400/15 text-cyan-400" : "bg-zinc-700/50 text-zinc-500"} uppercase tracking-widest">${os.active ? "Active" : "Hidden"}</span>
      </td>
      <td class="px-5 py-3">
        <div class="flex gap-2 flex-wrap">
          <button onclick="openStepsModal('${os.id}')" class="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-cyan-400 border border-cyan-400/25 rounded-lg hover:bg-cyan-400/10 transition-all">
            <span class="material-symbols-outlined" style="font-size:14px">format_list_numbered</span>
            Add Steps
          </button>
          <button onclick="toggleOS('${os.id}')" title="${os.active ? "Hide" : "Show"}" class="p-1.5 rounded text-zinc-500 hover:text-white hover:bg-white/8 transition-all">
            <span class="material-symbols-outlined" style="font-size:16px">${os.active ? "visibility_off" : "visibility"}</span>
          </button>
          <button onclick="deleteOS('${os.id}')" title="Delete" class="p-1.5 rounded text-zinc-500 hover:text-red-400 hover:bg-red-400/8 transition-all">
            <span class="material-symbols-outlined" style="font-size:16px">delete</span>
          </button>
        </div>
      </td>
    </tr>`).join("");
}

async function addOS() {
  const name = val("os-name");
  const label = val("os-label");
  if (!name || !label) { tsToast("Name and label are required.", "error"); return; }

  let image = val("os-img-url");
  const imgFile = document.getElementById("os-img-file");
  if (imgFile && imgFile.files && imgFile.files[0]) {
    image = await readFileAsBase64(imgFile.files[0]);
  }

  Storage.osLinks.create({
    name,
    label: label.toUpperCase(),
    labelType: val("os-labeltype") || "stable",
    description: val("os-desc") || "",
    url: val("os-url") || "",
    compatibility: parseInt(val("os-compat") || "100", 10),
    compatibilityLabel: val("os-compatLabel") || "100% OPTIMIZED",
    guideVideo: val("os-video") || "",
    guideVideoType: "url",
    image: image || "",
    warningTitle: val("os-warn-title") || "",
    warningText: val("os-warn-text") || "",
    steps: [],
    active: true,
  });
  ["os-name", "os-label", "os-desc", "os-url", "os-compat", "os-compatLabel", "os-video", "os-img-url", "os-warn-title", "os-warn-text"].forEach(clearField);
  if (imgFile) imgFile.value = "";
  document.getElementById("os-img-preview-wrap").classList.add("hidden");
  tsToast("OS image added!");
}

// OS image preview
(function () {
  const fileInput = document.getElementById("os-img-file");
  const urlInput = document.getElementById("os-img-url");
  const previewWrap = document.getElementById("os-img-preview-wrap");
  const previewImg = document.getElementById("os-img-preview");

  function showPreview(src) {
    if (!src) { previewWrap.classList.add("hidden"); return; }
    previewImg.src = src;
    previewWrap.classList.remove("hidden");
  }

  if (fileInput) {
    fileInput.addEventListener("change", () => {
      const f = fileInput.files[0];
      if (f) {
        const reader = new FileReader();
        reader.onload = (e) => showPreview(e.target.result);
        reader.readAsDataURL(f);
      } else {
        showPreview("");
      }
    });
  }
  if (urlInput) {
    urlInput.addEventListener("input", () => showPreview(urlInput.value.trim()));
  }
})();

function toggleOS(id) { Storage.osLinks.toggle(id, "active"); }
function deleteOS(id) {
  if (!confirm("Permanently delete this OS image?")) return;
  Storage.osLinks.remove(id);
}

// ── Products tab ──
function renderProducts() {
  const items = Storage.products.list();
  const tbody = document.getElementById("admin-products-table");
  if (!tbody) return;
  if (items.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="px-5 py-8 text-center text-zinc-500 text-xs">No products.</td></tr>';
    return;
  }
  tbody.innerHTML = items.map((p) => `
    <tr class="border-b border-white/4 hover:bg-white/2 transition-colors">
      <td class="px-5 py-3">
        <div class="flex items-center gap-3">
          ${p.image ? `<img src="${escHtml(p.image)}" class="w-10 h-10 object-cover rounded-lg bg-zinc-900" />` : '<div class="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center"><span class="material-symbols-outlined text-zinc-600" style="font-size:16px">image</span></div>'}
          <div>
            <div class="text-zinc-200 font-medium">${escHtml(p.name)}</div>
            <div class="text-[10px] text-zinc-500">${escHtml(p.tier || "")}</div>
          </div>
        </div>
      </td>
      <td class="px-5 py-3 text-cyan-400 font-bold">${escHtml(p.price)}</td>
      <td class="px-5 py-3 text-zinc-400">${escHtml(p.commission || "—")}</td>
      <td class="px-5 py-3">
        ${p.certified ? '<span class="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-400/15 text-amber-400 uppercase tracking-widest">Yes</span>' : '<span class="text-zinc-600 text-sm">—</span>'}
      </td>
      <td class="px-5 py-3">
        <span class="text-[10px] font-bold px-2 py-0.5 rounded ${p.active ? "bg-cyan-400/15 text-cyan-400" : "bg-zinc-700/50 text-zinc-500"} uppercase tracking-widest">${p.active ? "Active" : "Hidden"}</span>
      </td>
      <td class="px-5 py-3">
        <div class="flex gap-2">
          <button onclick="toggleProduct('${p.id}')" title="${p.active ? "Hide" : "Show"}" class="p-1.5 rounded text-zinc-500 hover:text-white hover:bg-white/8 transition-all">
            <span class="material-symbols-outlined" style="font-size:16px">${p.active ? "visibility_off" : "visibility"}</span>
          </button>
          <button onclick="deleteProduct('${p.id}')" title="Delete" class="p-1.5 rounded text-zinc-500 hover:text-red-400 hover:bg-red-400/8 transition-all">
            <span class="material-symbols-outlined" style="font-size:16px">delete</span>
          </button>
        </div>
      </td>
    </tr>`).join("");
}

async function addProduct() {
  const name = val("prod-name");
  if (!name) { tsToast("Product name is required.", "error"); return; }

  let image = val("prod-img-url");

  const fileInput = document.getElementById("prod-img-file");
  if (fileInput && fileInput.files && fileInput.files[0]) {
    image = await readFileAsBase64(fileInput.files[0]);
  }

  Storage.products.create({
    name,
    tier: val("prod-tier") || "",
    price: val("prod-price") || "$0.00",
    description: val("prod-desc") || "",
    commission: val("prod-commission") || "",
    amazonUrl: val("prod-amazon") || "#",
    darazUrl: val("prod-daraz") || "#",
    image: image || "",
    certified: document.getElementById("prod-certified")?.checked || false,
    active: true,
  });

  ["prod-name", "prod-tier", "prod-price", "prod-desc", "prod-commission", "prod-amazon", "prod-daraz", "prod-img-url"].forEach(clearField);
  if (fileInput) fileInput.value = "";
  const cert = document.getElementById("prod-certified");
  if (cert) cert.checked = false;
  tsToast("Product added!");
}

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function toggleProduct(id) { Storage.products.toggle(id, "active"); }
function deleteProduct(id) {
  if (!confirm("Permanently delete this product?")) return;
  Storage.products.remove(id);
}

// ── OS Steps Modal ──
let activeStepsOsId = null;

function toggleStepMediaInput() {
  const type = document.getElementById("step-type")?.value || "text";
  const imgInputs = document.getElementById("step-img-inputs");
  const vidInputs = document.getElementById("step-video-inputs");
  if (imgInputs) imgInputs.classList.toggle("hidden", type !== "image");
  if (vidInputs) vidInputs.classList.toggle("hidden", type !== "video");
}

function openStepsModal(osId) {
  activeStepsOsId = osId;
  const os = Storage.osLinks.get(osId);
  if (!os) return;
  document.getElementById("ts-steps-modal-title").textContent = `Steps — ${os.name}`;
  ["step-title", "step-text", "step-media", "step-media-video", "step-warning"].forEach(clearField);
  const typeEl = document.getElementById("step-type");
  if (typeEl) { typeEl.value = "text"; toggleStepMediaInput(); }
  const imgFile = document.getElementById("step-img-file");
  if (imgFile) imgFile.value = "";
  const previewWrap = document.getElementById("step-img-preview-wrap");
  if (previewWrap) previewWrap.classList.add("hidden");
  renderStepsList(os.steps || []);
  // Reset to single tab, clear bulk textarea
  switchStepsTab('single');
  const bulkInput = document.getElementById('bulk-steps-input');
  if (bulkInput) bulkInput.value = '';
  const bulkPreview = document.getElementById('bulk-preview-wrap');
  if (bulkPreview) bulkPreview.classList.add('hidden');
  const bulkStatus = document.getElementById('bulk-status');
  if (bulkStatus) bulkStatus.textContent = '';
  document.getElementById("ts-steps-modal-backdrop").classList.add("show");
}

function renderStepsList(steps) {
  const list = document.getElementById("ts-steps-list");
  if (!list) return;
  if (steps.length === 0) {
    list.innerHTML = '<p class="text-zinc-500 text-sm py-3">No steps yet. Add your first step below.</p>';
    return;
  }
  list.innerHTML = steps.map((s, i) => {
    const hasImg = s.type === "image" && s.media;
    const hasVid = s.type === "video" && s.media;
    const hasWarn = s.warning;
    return `
    <div class="glass-panel p-4 rounded-xl border border-white/8 flex gap-3 items-start">
      <span class="ts-guide-step-num shrink-0">${i + 1}</span>
      <div class="flex-1 min-w-0">
        <p class="text-sm font-bold text-white">${escHtml(s.title || "")}</p>
        <p class="text-xs text-zinc-500 mt-0.5 line-clamp-2">${escHtml(s.text || "")}</p>
        ${hasImg ? `<div class="mt-2"><img src="${escHtml(s.media)}" alt="" class="w-full max-h-24 object-cover rounded-lg border border-white/8" /></div>` : ""}
        ${hasVid ? `<p class="text-[10px] text-indigo-400 mt-1.5 flex items-center gap-1"><span class="material-symbols-outlined" style="font-size:12px">videocam</span> Video attached</p>` : ""}
        ${hasWarn ? `<p class="text-[10px] text-amber-400 mt-1.5 flex items-center gap-1"><span class="material-symbols-outlined" style="font-size:12px">warning</span> ${escHtml(s.warning)}</p>` : ""}
      </div>
      <button onclick="adminDeleteStep('${s.id}')" title="Remove Step" class="p-1 rounded text-zinc-600 hover:text-red-400 hover:bg-red-400/8 transition-all shrink-0">
        <span class="material-symbols-outlined" style="font-size:16px">close</span>
      </button>
    </div>`;
  }).join("");
}

async function adminAddStep() {
  if (!activeStepsOsId) return;
  const title = document.getElementById("step-title")?.value.trim();
  const text = document.getElementById("step-text")?.value.trim();
  const type = document.getElementById("step-type")?.value || "text";
  const warning = document.getElementById("step-warning")?.value.trim() || "";
  if (!title) { tsToast("Step title is required.", "error"); return; }

  let media = "";
  if (type === "image") {
    const imgFile = document.getElementById("step-img-file");
    if (imgFile && imgFile.files && imgFile.files[0]) {
      media = await readFileAsBase64(imgFile.files[0]);
    } else {
      media = document.getElementById("step-media")?.value.trim() || "";
    }
  } else if (type === "video") {
    media = document.getElementById("step-media-video")?.value.trim() || "";
  }

  Storage.osLinks.addStep(activeStepsOsId, { title, text: text || "", type, media, warning });

  ["step-title", "step-text", "step-media", "step-media-video", "step-warning"].forEach(clearField);
  const imgFile = document.getElementById("step-img-file");
  if (imgFile) imgFile.value = "";
  const previewWrap = document.getElementById("step-img-preview-wrap");
  if (previewWrap) previewWrap.classList.add("hidden");
  const typeEl = document.getElementById("step-type");
  if (typeEl) { typeEl.value = "text"; toggleStepMediaInput(); }

  const os = Storage.osLinks.get(activeStepsOsId);
  if (os) renderStepsList(os.steps || []);
  tsToast("Step added!");
}

function adminDeleteStep(stepId) {
  if (!activeStepsOsId) return;
  Storage.osLinks.removeStep(activeStepsOsId, stepId);
  const os = Storage.osLinks.get(activeStepsOsId);
  if (os) renderStepsList(os.steps || []);
}

// ── Tab switcher (single / bulk) ──
function switchStepsTab(tab) {
  const isBulk = tab === 'bulk';
  document.getElementById('steps-panel-single').classList.toggle('hidden', isBulk);
  document.getElementById('steps-panel-bulk').classList.toggle('hidden', !isBulk);
  const tabBulk = document.getElementById('steps-tab-bulk');
  const tabSingle = document.getElementById('steps-tab-single');
  if (isBulk) {
    tabBulk.className = 'flex-1 py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-widest transition-all bg-cyan-400/10 border border-cyan-400/30 text-cyan-400';
    tabSingle.className = 'flex-1 py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-widest transition-all bg-white/3 border border-white/8 text-zinc-400 hover:text-white hover:border-white/15';
  } else {
    tabSingle.className = 'flex-1 py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-widest transition-all bg-cyan-400/10 border border-cyan-400/30 text-cyan-400';
    tabBulk.className = 'flex-1 py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-widest transition-all bg-white/3 border border-white/8 text-zinc-400 hover:text-white hover:border-white/15';
  }
}

// ── Bulk step parser ──
// Matches: "Step 1:", "Step 1.", "Step 1 -", "Step 1 –", or just "Step 1" at line start (case-insensitive)
function parseBulkSteps(raw) {
  const lines = raw.split('\n');
  const stepPattern = /^step\s+(\d+)\s*[:\.\-–—]?\s*(.*)/i;
  const parsed = [];
  let current = null;

  for (let line of lines) {
    const m = line.match(stepPattern);
    if (m) {
      if (current) parsed.push(current);
      const titleRest = m[2].trim();
      current = { num: parseInt(m[1], 10), title: titleRest, bodyLines: [] };
    } else if (current) {
      current.bodyLines.push(line);
    }
  }
  if (current) parsed.push(current);

  return parsed.map(s => ({
    title: s.title || `Step ${s.num}`,
    text: s.bodyLines.join('\n').trim(),
    type: 'text',
    media: '',
    warning: '',
  }));
}

function previewBulkSteps() {
  const raw = (document.getElementById('bulk-steps-input')?.value || '');
  const steps = parseBulkSteps(raw);
  const wrap = document.getElementById('bulk-preview-wrap');
  const list = document.getElementById('bulk-preview-list');
  const status = document.getElementById('bulk-status');
  const count = document.getElementById('bulk-preview-count');

  if (steps.length === 0) {
    if (wrap) wrap.classList.add('hidden');
    if (status) status.textContent = raw.trim() ? 'No steps detected — start lines with "Step 1:", "Step 2:", …' : '';
    return;
  }

  if (wrap) wrap.classList.remove('hidden');
  if (status) status.textContent = '';
  if (count) count.textContent = `${steps.length} step${steps.length !== 1 ? 's' : ''} found`;
  if (list) {
    list.innerHTML = steps.map((s, i) => `
      <div class="flex gap-3 items-start p-3 bg-white/2 border border-white/6 rounded-xl">
        <span class="flex-shrink-0 w-6 h-6 rounded-full bg-cyan-400/15 border border-cyan-400/25 text-cyan-400 text-[11px] font-bold flex items-center justify-center">${i + 1}</span>
        <div class="min-w-0 flex-1">
          <p class="text-sm font-bold text-white leading-snug">${escHtml(s.title)}</p>
          ${s.text ? `<p class="text-xs text-zinc-500 mt-0.5 line-clamp-2">${escHtml(s.text)}</p>` : '<p class="text-xs text-zinc-600 mt-0.5 italic">No description</p>'}
        </div>
      </div>`).join('');
  }
}

function importBulkSteps() {
  if (!activeStepsOsId) return;
  const raw = (document.getElementById('bulk-steps-input')?.value || '');
  const steps = parseBulkSteps(raw);
  if (steps.length === 0) { tsToast('No steps detected. Make sure you start each step with "Step N:"', 'error'); return; }
  steps.forEach(s => Storage.osLinks.addStep(activeStepsOsId, s));
  document.getElementById('bulk-steps-input').value = '';
  const wrap = document.getElementById('bulk-preview-wrap');
  if (wrap) wrap.classList.add('hidden');
  const status = document.getElementById('bulk-status');
  if (status) status.textContent = '';
  const os = Storage.osLinks.get(activeStepsOsId);
  if (os) renderStepsList(os.steps || []);
  tsToast(`${steps.length} step${steps.length !== 1 ? 's' : ''} imported!`);
  switchStepsTab('single');
}

// Step image file preview
(function () {
  const imgFile = document.getElementById("step-img-file");
  const urlInput = document.getElementById("step-media");
  const previewWrap = document.getElementById("step-img-preview-wrap");
  const previewImg = document.getElementById("step-img-preview");
  function showPrev(src) {
    if (!src || !previewImg || !previewWrap) return;
    previewImg.src = src;
    previewWrap.classList.remove("hidden");
  }
  if (imgFile) {
    imgFile.addEventListener("change", () => {
      const f = imgFile.files[0];
      if (f) {
        const r = new FileReader();
        r.onload = (e) => showPrev(e.target.result);
        r.readAsDataURL(f);
      } else if (previewWrap) previewWrap.classList.add("hidden");
    });
  }
  if (urlInput) {
    urlInput.addEventListener("input", () => showPrev(urlInput.value.trim()));
  }
})();

// ── Change Password ──
function handleChangePw() {
  const pw = val("admin-new-pw");
  const confirm = val("admin-confirm-pw");
  if (!pw) { tsToast("Enter a new password.", "error"); return; }
  if (pw.length < 6) { tsToast("Password must be at least 6 characters.", "error"); return; }
  if (pw !== confirm) { tsToast("Passwords do not match.", "error"); return; }
  Auth.changePassword(pw);
  clearField("admin-new-pw");
  clearField("admin-confirm-pw");
  tsToast("Password updated successfully!");
}

// ── Change Username / Email ──
function handleChangeUser() {
  const username = val("admin-new-user");
  const email = val("admin-new-email");
  if (!username) { tsToast("Username cannot be empty.", "error"); return; }
  Auth.changeUsername(username, email);
  clearField("admin-new-user");
  clearField("admin-new-email");
  tsToast("Login credentials updated!");
}

// ── Download Video from Platform URL ──
async function downloadAndAddVideo() {
  const url = val("dl-url");
  const title = val("dl-title");
  if (!url) { tsToast("Platform URL is required.", "error"); return; }
  if (!title) { tsToast("Title is required.", "error"); return; }

  const btn = document.getElementById("dl-btn");
  const statusEl = document.getElementById("dl-status");
  const statusText = document.getElementById("dl-status-text");

  btn.disabled = true;
  btn.classList.add("opacity-60");
  statusEl.classList.remove("hidden");
  statusText.textContent = "Downloading video — this may take a minute…";

  try {
    const res = await fetch("/api/videos/download", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
    const data = await res.json();

    if (!res.ok) {
      tsToast(data.error || "Download failed.", "error");
      return;
    }

    const tags = val("dl-tags").split(",").map(t => t.trim()).filter(Boolean);
    const desc = val("dl-desc");
    const thumb = val("dl-thumb");

    Storage.videos.create({
      title,
      url: data.streamUrl,
      thumbnail: thumb || "",
      duration: "",
      description: desc || `Imported from: ${url}`,
      tags,
      active: true,
      views: 0,
      likes: 0,
      comments: [],
      updatedAt: new Date().toISOString().slice(0, 10),
      sourceUrl: url,
      hostedLocally: true,
    });

    ["dl-url", "dl-title", "dl-thumb", "dl-desc", "dl-tags"].forEach(clearField);
    tsToast(`Video downloaded and added: ${data.filename}`);
  } catch (e) {
    tsToast("Network error — is the API server running?", "error");
  } finally {
    btn.disabled = false;
    btn.classList.remove("opacity-60");
    statusEl.classList.add("hidden");
  }
}

// ── Subscriptions to reactively re-render ──
Storage.subscribe("videos", () => { renderVideos(); renderAnalytics(); });
Storage.subscribe("osLinks", renderOS);
Storage.subscribe("products", renderProducts);

// ── Initial render ──
Storage.ready.then(() => {
  renderAnalytics();
  renderVideos();
  renderOS();
  renderProducts();
});
