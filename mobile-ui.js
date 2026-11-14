/* Mobile interaction layer. Original image/Canvas engine remains in index.html. */
(function () {
  "use strict";

  var panel = document.querySelector(".panel");
  var stage = document.getElementById("dropZone");
  var dock = document.getElementById("mobileDock");
  var scrim = document.getElementById("appScrim");
  var more = document.getElementById("mobileMoreBtn");
  var batchEntry = document.getElementById("mobileBatchEntry");
  var batchCount = document.getElementById("mobileBatchCount");
  var input = document.getElementById("fileInput");
  if (!panel || !stage || !dock || !scrim || !input) return;

  var mq = window.matchMedia("(max-width: 900px)");
  var activeGroup = "";
  var opener = null;
  var allFields = Array.prototype.slice.call(panel.querySelectorAll(".field"));
  var groupById = {
    textInput: "text",
    fontChips: "text",
    styleGrid: "style",
    presetGrid: "style",
    effectChips: "style",
    sizeRange: "adjust",
    opacityRange: "adjust",
    gapRange: "adjust",
    angleRange: "adjust",
    swatches: "adjust",
    logoToggle: "adjust",
    bracketToggle: "adjust"
  };
  var sections = {
    text: { title: "Chữ & phông", sub: "Nhập nội dung và chọn kiểu chữ" },
    style: { title: "Kiểu phủ", sub: "Bố cục, mẫu và hiệu ứng" },
    adjust: { title: "Tinh chỉnh", sub: "Cỡ chữ, độ mờ, màu sắc và logo" },
    export: { title: "Lưu vào Ảnh", sub: "Ảnh gốc, chỉnh tay hoặc dùng công thức đều lưu được" },
    batch: { title: "Ảnh đã tải lên", sub: "Danh sách chờ · Áp dụng chung · Công thức đã lưu" },
    more: { title: "Thêm công cụ", sub: "Ảnh mẫu và chỉnh hàng loạt" }
  };

  allFields.forEach(function (field) {
    var key = Object.keys(groupById).find(function (id) {
      return field.querySelector("#" + id);
    });
    field.dataset.mobileGroup = key ? groupById[key] : "adjust";
  });

  var heading = document.createElement("div");
  heading.className = "sheet-heading";
  heading.innerHTML =
    '<div><strong id="mobileSheetTitle">Chỉnh sửa</strong><small id="mobileSheetSubtitle">Chỉnh trực tiếp trên ảnh</small></div>' +
    '<button type="button" class="sheet-close" id="mobileSheetClose" aria-label="Đóng bảng điều khiển">' +
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="2" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg></button>';
  panel.insertBefore(heading, panel.firstChild);

  var exportSection = document.createElement("section");
  exportSection.id = "mobileExportSection";
  exportSection.className = "sheet-section edited-exports";
  exportSection.hidden = true;
  exportSection.innerHTML =
    '<p class="sheet-note">Tất cả ảnh tải lên đều ở đây, kể cả ảnh chưa chỉnh, chỉnh tay và áp dụng công thức. Chọn ảnh để <strong>Lưu vào Ảnh</strong>.</p>' +
    '<div id="exportSelectedPanel" class="export-selected-panel" hidden>' +
      '<strong id="exportSelectedName">Ảnh đã chọn</strong>' +
      '<button type="button" id="exportSelectedShare" class="btn primary export-share" disabled>▣ Lưu vào Ảnh</button>' +
      '<p id="exportPrepStatus" role="status" aria-live="polite">Đang chuẩn bị ảnh…</p>' +
      '<small>Trong bảng chia sẻ iPhone, chọn “Lưu hình ảnh” để lưu vào ứng dụng Ảnh.</small>' +
    '</div>' +
    '<div class="export-edited-heading"><strong>Ảnh đã tải lên <span id="exportEditedCount">0 ảnh</span></strong></div>' +
    '<div class="edited-photos-grid" id="exportEditedGrid" role="group" aria-label="Chọn ảnh để lưu vào album"></div>' +
    '<p id="exportEditedEmpty" class="batch-empty">Chưa có ảnh tải lên. Bấm Nhiều ảnh để thêm ảnh, hoặc chọn ảnh từ tab Ảnh.</p>' +
    '<button type="button" class="btn" data-open-batch>▦ Quản lý ảnh đã tải lên</button>';
  panel.appendChild(exportSection);
  var batchSection = document.createElement("section");
  batchSection.className = "sheet-section batch-workflow";
  batchSection.id = "mobileBatchSection";
  batchSection.hidden = true;
  batchSection.innerHTML =
    '<div class="batch-library-top">' +
      '<strong>Đã tải lên <span id="batchQueueCount">0 ảnh</span></strong>' +
      '<div class="batch-top-actions"><button type="button" class="btn batch-quick-apply" id="batchApplyChooser" disabled>✓ Áp dụng chung</button>' +
        '<button class="btn batch-small" type="button" id="batchClearQueue">Xoá tất cả</button></div>' +
    '</div>' +
    '<button type="button" class="btn primary batch-pick" data-input="batchInput">＋ Tải thêm nhiều ảnh</button>' +
    '<div id="batchUploadQueue" class="batch-upload-queue" aria-label="Danh sách ảnh đã tải lên"></div>' +
    '<p class="batch-empty" id="batchQueueEmpty">Chưa có ảnh nào. Hãy tải ảnh lên để bắt đầu.</p>' +
    '<p class="batch-status" id="batchSelectedStatus" aria-live="polite">Chưa chọn ảnh nào</p>' +
    '<p id="batchAppliedStatus" class="batch-applied-status" role="status" aria-live="polite">Chưa áp dụng công thức</p>' +
    '<p class="sheet-note batch-storage-note" id="batchStorageNotice">Ảnh nằm chờ trong bộ nhớ của thiết bị, không gửi lên máy chủ.</p>' +
    '<div id="batchRecipePicker" class="recipe-picker-overlay" hidden>' +
      '<div class="recipe-picker-card" role="dialog" aria-modal="true" aria-labelledby="recipePickerTitle">' +
        '<div class="recipe-picker-heading"><strong id="recipePickerTitle">Áp dụng công thức chung</strong>' +
          '<button type="button" id="recipePickerClose" aria-label="Đóng" class="recipe-picker-x">×</button></div>' +
        '<p>Chọn một công thức đã lưu để áp dụng cho toàn bộ ảnh trong danh sách chờ.</p>' +
        '<div id="batchRecipeChoices" class="recipe-picker-options" role="group" aria-label="Công thức đã lưu"></div>' +
        '<p id="recipePickerEmpty" class="recipe-picker-empty" hidden>Chưa có công thức nào. Vào Chỉnh → Kho công thức để lưu công thức trước.</p>' +
        '<button type="button" class="btn primary recipe-picker-confirm" id="batchConfirmApply" disabled>Áp dụng cho tất cả ảnh</button>' +
      '</div>' +
    '</div>';
  panel.appendChild(batchSection);

  var moreSection = document.createElement("section");
  moreSection.id = "mobileMoreSection";
  moreSection.className = "sheet-section";
  moreSection.hidden = true;
  moreSection.innerHTML =
    '<div class="sheet-actions">' +
    '<button type="button" class="btn primary" data-input="fileInput">Chọn ảnh mới</button>' +
    '<button type="button" class="btn" data-proxy="demoBtn">Dùng ảnh mẫu</button>' +
    '<button type="button" class="btn wide" data-open-batch>▦ Ảnh đã tải lên · Sửa nhiều ảnh</button>' +
    '<button type="button" class="btn wide" id="appRefreshBtn">↻ Cập nhật ứng dụng</button>' +
    '</div><p class="sheet-note" id="appVersionInfo">Textmask Studio V13.8 · Chạm để xem số đo dock</p>' +
    '<p class="sheet-note">Bạn cũng có thể kéo thả hoặc dán ảnh vào trang trên máy tính. Ảnh không được tải lên máy chủ.</p>';
  panel.appendChild(moreSection);

  var closeButton = document.getElementById("mobileSheetClose");
  var title = document.getElementById("mobileSheetTitle");
  var subtitle = document.getElementById("mobileSheetSubtitle");
  var tabButtons = Array.prototype.slice.call(dock.querySelectorAll("[data-mobile-tab]"));
  // Status and completed-image previews are managed by batch-workspace.js.
  var imgInfo = document.getElementById("imgInfo");
  if (imgInfo) stage.appendChild(imgInfo);
  function syncBatch() {
    // Kept as a stable hook when returning to the uploaded-photos sheet.
  }
  function resetTabs() {
    tabButtons.forEach(function (button) {
      button.setAttribute("aria-expanded", button.dataset.mobileTab === activeGroup && document.body.classList.contains("sheet-open") ? "true" : "false");
    });
    more.setAttribute("aria-expanded", activeGroup === "more" && document.body.classList.contains("sheet-open") ? "true" : "false");
    batchEntry.setAttribute("aria-expanded", activeGroup === "batch" && document.body.classList.contains("sheet-open") ? "true" : "false");
  }
  function renderSections(group) {
    allFields.forEach(function (field) { field.hidden = mq.matches && field.dataset.mobileGroup !== group; });
    exportSection.hidden = !mq.matches || group !== "export";
    batchSection.hidden = !mq.matches || group !== "batch";
    moreSection.hidden = !mq.matches || group !== "more";
  }
  function openSheet(group, trigger) {
    if (!mq.matches || !sections[group]) return;
    if (activeGroup === group && document.body.classList.contains("sheet-open")) {
      closeSheet(); return;
    }
    opener = trigger || document.activeElement;
    activeGroup = group;
    title.textContent = sections[group].title;
    subtitle.textContent = sections[group].sub;
    renderSections(group);
    panel.inert = false;
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-modal", "true");
    panel.removeAttribute("aria-hidden");
    document.body.classList.add("sheet-open");
    panel.scrollTop = 0;
    if (group === "batch") { syncBatch(); window.dispatchEvent(new Event("textmask:batch-open")); }
    resetTabs();
    closeButton.focus({ preventScroll: true });
    if (group === "export") window.dispatchEvent(new Event("textmask:export-open"));
  }
  function closeSheet() {
    if (!mq.matches) return;
    var returnFocus = opener;
    document.body.classList.remove("sheet-open", "keyboard-open");
    activeGroup = "";
    resetTabs();
    if (panel.contains(document.activeElement)) {
      if (returnFocus && returnFocus.isConnected && returnFocus.focus) returnFocus.focus({ preventScroll: true });
      else if (more) more.focus({ preventScroll: true });
    }
    panel.inert = true;
    panel.setAttribute("aria-hidden", "true");
    panel.removeAttribute("aria-modal");
  }

  tabButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      var group = button.dataset.mobileTab;
      if (group === "photo") {
        closeSheet();
        // Keep this synchronous with the user gesture for iOS's native photo picker.
        input.click();
      } else openSheet(group, button);
    });
  });
  more.addEventListener("click", function () { openSheet("more", more); });
  batchEntry.addEventListener("click", function () { openSheet("batch", batchEntry); });
  closeButton.addEventListener("click", closeSheet);
  scrim.addEventListener("click", closeSheet);
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && document.body.classList.contains("sheet-open")) {
      event.preventDefault(); closeSheet();
    }
  });

  // Proxy the existing, tested controls instead of duplicating export/upload logic.
  panel.addEventListener("click", function (event) {
    if (event.target.closest("[data-open-batch]")) { openSheet("batch", batchEntry); return; }
    var proxy = event.target.closest("[data-proxy], [data-input]");
    if (!proxy || proxy.disabled || !mq.matches) return;
    var id = proxy.dataset.proxy || proxy.dataset.input;
    var original = document.getElementById(id);
    if (!original || original.disabled) return;
    if (id === "demoBtn") closeSheet();
    original.click();
  });

  document.addEventListener("focusin", function (event) {
    if (mq.matches && event.target.matches && event.target.matches("#textInput, #recipeNameInput")) {
      document.body.classList.add("keyboard-open");
      syncVisibleHeight();
    }
  });
  document.addEventListener("focusout", function (event) {
    if (event.target.matches && event.target.matches("#textInput, #recipeNameInput")) {
      document.body.classList.remove("keyboard-open");
      syncVisibleHeight();
    }
  });

  // On desktop the full, original editor remains visible and keyboard-accessible.
  function adaptLayout() {
    document.body.classList.remove("sheet-open", "keyboard-open");
    activeGroup = "";
    resetTabs();
    if (mq.matches) {
      renderSections("");
      panel.inert = true;
      panel.setAttribute("aria-hidden", "true");
      panel.removeAttribute("role");
      panel.removeAttribute("aria-modal");
    } else {
      allFields.forEach(function (field) { field.hidden = false; });
      exportSection.hidden = true;
      batchSection.hidden = true;
      moreSection.hidden = true;
      panel.inert = false;
      panel.removeAttribute("aria-hidden");
      panel.removeAttribute("role");
      panel.removeAttribute("aria-modal");
    }
  }
  if (mq.addEventListener) mq.addEventListener("change", adaptLayout);
  else if (mq.addListener) mq.addListener(adaptLayout);
  adaptLayout();

  // On-device measurements: innerHeight=874 and dock.bottom=874, but the
  // documentElement.clientHeight is only 812. The dock is already correctly
  // anchored: fix the short HTML/app root instead of shifting the fixed dock.
  var dockDebug = document.createElement("div");
  dockDebug.id = "pwaDockDebug";
  dockDebug.setAttribute("aria-label", "Thông số chẩn đoán vị trí thanh công cụ");
  document.body.appendChild(dockDebug);
  var dockDebugFrame = 0;
  function renderDockDebug() {
    dockDebugFrame = 0;
    if (!mq.matches) return;
    var vv = window.visualViewport;
    var rect = dock.getBoundingClientRect();
    var root = document.documentElement;
    dockDebug.textContent = [
      "window.innerHeight: " + window.innerHeight,
      "screen.height: " + screen.height,
      "visualViewport.height: " + (vv ? vv.height.toFixed(1) : "N/A"),
      "document.documentElement.clientHeight: " + root.clientHeight,
      "mobileDock.getBoundingClientRect().bottom: " + rect.bottom.toFixed(1),
      "HTML root CSS H: " + getComputedStyle(root).height,
      "Applied gap: " + getComputedStyle(root).getPropertyValue("--pwa-viewport-gap").trim(),
      "innerHeight − clientHeight: " + (window.innerHeight - root.clientHeight).toFixed(1),
      "screen-bottom − dock-bottom: " + (screen.height - rect.bottom).toFixed(1)
    ].join("\n");
  }
  function queueDockDebug() {
    if (!dockDebugFrame) dockDebugFrame = requestAnimationFrame(renderDockDebug);
  }
  function syncVisibleHeight() {
    var root = document.documentElement;
    if (!mq.matches) {
      root.style.removeProperty("--app-height");
      root.style.removeProperty("--pwa-viewport-gap");
      root.classList.remove("pwa-viewport-fix");
      dockDebug.hidden = true;
      return;
    }
    var vv = window.visualViewport;
    var active = document.activeElement;
    var editing = !!(active && /^(INPUT|TEXTAREA)$/.test(active.tagName) &&
      !/^(range|color|file|checkbox|radio|button)$/i.test(active.type || ""));
    var viewportH = window.innerHeight || root.clientHeight;
    var keyboardUp = !!(editing && vv && viewportH - vv.height > 120);
    var standalone = window.matchMedia("(display-mode: standalone)").matches ||
      navigator.standalone === true;
    var portrait = window.matchMedia("(orientation: portrait)").matches;
    var fix = standalone && portrait && !keyboardUp;
    if (keyboardUp) {
      root.style.setProperty("--app-height", Math.round(vv.height) + "px");
      root.style.setProperty("--pwa-viewport-gap", "0px");
    } else if (fix) {
      // iOS PWA alternates between 812px and 874px viewport measurements.
      // Use the physical portrait screen height and compensate only when
      // fixed positioning is anchored to the shorter layout viewport.
      var physicalH = screen.height;
      var gap = physicalH - viewportH;
      var valid = physicalH > 0 && gap >= 0 && gap <= 140;
      root.style.setProperty("--app-height", Math.round(valid ? physicalH : viewportH) + "px");
      root.style.setProperty("--pwa-viewport-gap", Math.round(valid ? gap : 0) + "px");
    } else {
      root.style.removeProperty("--app-height");
      root.style.removeProperty("--pwa-viewport-gap");
    }
    root.classList.toggle("pwa-viewport-fix", standalone && portrait);
    dockDebug.hidden = !(standalone && portrait);
    queueDockDebug();
  }
  syncVisibleHeight();
  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", syncVisibleHeight);
    window.visualViewport.addEventListener("scroll", syncVisibleHeight);
  }
  window.addEventListener("resize", syncVisibleHeight);
  window.addEventListener("orientationchange", syncVisibleHeight);

  // Drag the small grab-handle down to dismiss the glass sheet.
  var dragStartY = null;
  var dragDistance = 0;
  heading.addEventListener("touchstart", function (event) {
    if (!mq.matches || !document.body.classList.contains("sheet-open") ||
        event.touches.length !== 1 || event.target.closest("button")) return;
    var bounds = heading.getBoundingClientRect();
    var y = event.touches[0].clientY;
    if (y - bounds.top > 22) return;
    dragStartY = y;
    dragDistance = 0;
    panel.style.transition = "none";
  }, { passive: true });
  heading.addEventListener("touchmove", function (event) {
    if (dragStartY === null || event.touches.length !== 1) return;
    dragDistance = Math.max(0, event.touches[0].clientY - dragStartY);
    if (dragDistance > 0) {
      event.preventDefault();
      panel.style.transform = "translateY(" + Math.min(dragDistance, 260) + "px)";
    }
  }, { passive: false });
  function finishSheetDrag() {
    if (dragStartY === null) return;
    var shouldClose = dragDistance > 92;
    dragStartY = null;
    dragDistance = 0;
    panel.style.transition = "";
    panel.style.transform = "";
    if (shouldClose) closeSheet();
  }
  heading.addEventListener("touchend", finishSheetDrag, { passive: true });
  heading.addEventListener("touchcancel", finishSheetDrag, { passive: true });

  // Always check for the latest worker rather than trusting Safari's HTTP
  // cache of sw.js. Never automatically reload while somebody is editing.
  if ("serviceWorker" in navigator && /^https?:$/.test(location.protocol)) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("./sw.js", {updateViaCache:"none"})
        .then(function (reg) { return reg.update(); })
        .catch(function () {});
    });
  }
  // On-device layout probe: available by tapping the version label in ⋯.
  // Does not mutate styling, IndexedDB or photos, and stays out of the editor.
  var versionInfo = document.getElementById("appVersionInfo");
  if (versionInfo) {
    var versionLabel = "Textmask Studio V13.8 · Chạm để xem số đo dock";
    versionInfo.setAttribute("role", "button");
    versionInfo.setAttribute("tabindex", "0");
    versionInfo.setAttribute("aria-label", "Xem hoặc ẩn số đo bố cục iPhone");
    versionInfo.addEventListener("click", function () {
      if (versionInfo.dataset.metricsVisible === "1") {
        versionInfo.dataset.metricsVisible = "0";
        versionInfo.textContent = versionLabel;
        return;
      }
      var styles = getComputedStyle(document.documentElement);
      var dockRect = dock.getBoundingClientRect();
      var vv = window.visualViewport;
      var layout = document.querySelector(".layout");
      var layoutRect = layout && layout.getBoundingClientRect();
      var round = function (number) {
        return typeof number === "number" ? Math.round(number * 10) / 10 : "—";
      };
      var metricLines = [
        "V13.8 · Thông số PWA (chạm để ẩn)",
        "Standalone: " + (window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true),
        "Screen H: " + screen.height + " · Inner H: " + window.innerHeight,
        "Visual H: " + (vv ? round(vv.height) : "—") +
          " · Offset: " + (vv ? round(vv.offsetTop) : "—"),
        "Safe bottom CSS: " + styles.getPropertyValue("--mobile-safe-bottom").trim(),
        "Dock CSS H: " + getComputedStyle(dock).height +
          " · Rect H: " + round(dockRect.height),
        "Dock bottom: " + round(dockRect.bottom) +
          " · Gap(vh): " + round(window.innerHeight - dockRect.bottom),
        "Layout bottom: " + (layoutRect ? round(layoutRect.bottom) : "—")
      ];
      versionInfo.dataset.metricsVisible = "1";
      versionInfo.style.whiteSpace = "pre-line";
      versionInfo.textContent = metricLines.join("\n");
    });
    versionInfo.addEventListener("keydown", function (event) {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        versionInfo.click();
      }
    });
  }
  var refreshButton = document.getElementById("appRefreshBtn");
  if (refreshButton) refreshButton.addEventListener("click", async function () {
    refreshButton.disabled = true;
    refreshButton.textContent = "Đang kiểm tra bản mới…";
    try {
      // A unique navigation URL bypasses both older service-worker cache
      // entries and the browser's URL-based HTML cache.
      var probe = new URL("./index.html", location.href);
      probe.searchParams.set("_fresh", Date.now().toString(36));
      var response = await fetch(probe.toString(), {cache:"no-store"});
      if (!response.ok) throw new Error("Không kết nối được máy chủ");
      var source = await response.text();
      if (source.indexOf("mobile-ui.css?v=20261114-8") === -1)
        throw new Error("Bản mới chưa có trên máy chủ");
      if ("serviceWorker" in navigator) {
        var reg = await navigator.serviceWorker.getRegistration();
        if (reg) {
          try { await reg.update(); } catch (error) {}
        }
      }
      if ("caches" in window) {
        var names = await caches.keys();
        await Promise.all(names.filter(function (name) {
          return name.startsWith("textmask-studio-") && name !== "textmask-studio-v13-8-20261114";
        }).map(function (name) { return caches.delete(name); }));
      }
      var next = new URL("./index.html", location.href);
      next.searchParams.set("v", "13.8");
      next.searchParams.set("fresh", Date.now().toString(36));
      location.replace(next.toString());
    } catch (error) {
      refreshButton.disabled = false;
      refreshButton.textContent = "↻ Thử cập nhật lại";
      var info = document.getElementById("appVersionInfo");
      if (info) info.textContent = "Không thể cập nhật: " + (error.message || "Kiểm tra kết nối mạng");
    }
  });
})();