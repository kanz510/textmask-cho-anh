/* Mobile interaction layer. Original image/Canvas engine remains in index.html. */
(function () {
  "use strict";

  var panel = document.querySelector(".panel");
  var stage = document.getElementById("dropZone");
  var dock = document.getElementById("mobileDock");
  var scrim = document.getElementById("appScrim");
  var more = document.getElementById("mobileMoreBtn");
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
    export: { title: "Xuất ảnh", sub: "Lưu ảnh đúng độ phân giải gốc" },
    more: { title: "Thêm công cụ", sub: "Ảnh mẫu, xử lý hàng loạt và trợ giúp" }
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
  exportSection.className = "sheet-section";
  exportSection.hidden = true;
  exportSection.innerHTML =
    '<p class="sheet-note">Ảnh được xử lý trên thiết bị của bạn. Bản tải xuống sử dụng kích thước ảnh gốc, không phải kích thước bản xem trước.</p>' +
    '<div class="sheet-actions">' +
    '<button type="button" class="btn primary" data-proxy="dlPng">↓ Tải PNG</button>' +
    '<button type="button" class="btn" data-proxy="dlJpg">↓ Tải JPG</button>' +
    '<button type="button" class="btn wide" data-input="batchInput">⊞ Chọn nhiều ảnh</button>' +
    '<button type="button" class="btn wide" id="mobileBatchDownload" data-proxy="batchDl" disabled>↓ Tải tất cả ảnh (PNG)</button>' +
    '</div><span class="img-info" id="mobileBatchInfo">Chưa chọn ảnh hàng loạt</span>';
  panel.appendChild(exportSection);

  var moreSection = document.createElement("section");
  moreSection.id = "mobileMoreSection";
  moreSection.className = "sheet-section";
  moreSection.hidden = true;
  moreSection.innerHTML =
    '<div class="sheet-actions">' +
    '<button type="button" class="btn primary" data-input="fileInput">Chọn ảnh mới</button>' +
    '<button type="button" class="btn" data-proxy="demoBtn">Dùng ảnh mẫu</button>' +
    '<button type="button" class="btn wide" data-input="batchInput">Chọn nhiều ảnh</button>' +
    '<button type="button" class="btn wide" data-proxy="shortcutsBtn">⌨ Xem phím tắt</button>' +
    '</div><p class="sheet-note">Bạn cũng có thể kéo thả hoặc dán ảnh vào trang trên máy tính. Ảnh không được tải lên máy chủ.</p>';
  panel.appendChild(moreSection);

  var closeButton = document.getElementById("mobileSheetClose");
  var title = document.getElementById("mobileSheetTitle");
  var subtitle = document.getElementById("mobileSheetSubtitle");
  var tabButtons = Array.prototype.slice.call(dock.querySelectorAll("[data-mobile-tab]"));
  var mobileBatch = document.getElementById("mobileBatchDownload");
  var originalBatch = document.getElementById("batchDl");
  var originalBatchInfo = document.getElementById("batchInfo");

  // The canvas dimensions and renderer are unchanged; only the status label is rehomed.
  var imgInfo = document.getElementById("imgInfo");
  if (imgInfo) stage.appendChild(imgInfo);

  function syncBatch() {
    if (mobileBatch && originalBatch) mobileBatch.disabled = originalBatch.disabled;
    var copy = document.getElementById("mobileBatchInfo");
    if (copy && originalBatchInfo) {
      copy.textContent = originalBatchInfo.textContent || "Chưa chọn ảnh hàng loạt";
    }
  }
  if (originalBatch) {
    new MutationObserver(syncBatch).observe(originalBatch, { attributes: true, attributeFilter: ["disabled"] });
  }
  if (originalBatchInfo) {
    new MutationObserver(syncBatch).observe(originalBatchInfo, { childList: true, characterData: true, subtree: true });
  }
  syncBatch();

  function resetTabs() {
    tabButtons.forEach(function (button) {
      button.setAttribute("aria-expanded", button.dataset.mobileTab === activeGroup && document.body.classList.contains("sheet-open") ? "true" : "false");
    });
    more.setAttribute("aria-expanded", activeGroup === "more" && document.body.classList.contains("sheet-open") ? "true" : "false");
  }
  function renderSections(group) {
    allFields.forEach(function (field) { field.hidden = mq.matches && field.dataset.mobileGroup !== group; });
    exportSection.hidden = !mq.matches || group !== "export";
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
    resetTabs();
    closeButton.focus({ preventScroll: true });
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
  closeButton.addEventListener("click", closeSheet);
  scrim.addEventListener("click", closeSheet);
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && document.body.classList.contains("sheet-open")) {
      event.preventDefault(); closeSheet();
    }
  });

  // Proxy the existing, tested controls instead of duplicating export/upload logic.
  panel.addEventListener("click", function (event) {
    var proxy = event.target.closest("[data-proxy], [data-input]");
    if (!proxy || proxy.disabled || !mq.matches) return;
    var id = proxy.dataset.proxy || proxy.dataset.input;
    var original = document.getElementById(id);
    if (!original || original.disabled) return;
    if (id === "shortcutsBtn") closeSheet();
    if (id === "demoBtn") closeSheet();
    original.click();
  });

  document.addEventListener("focusin", function (event) {
    if (mq.matches && event.target === document.getElementById("textInput")) {
      document.body.classList.add("keyboard-open");
    }
  });
  document.addEventListener("focusout", function (event) {
    if (event.target === document.getElementById("textInput")) {
      document.body.classList.remove("keyboard-open");
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

  // Keep the editor fitted to the visible iPhone viewport when the keyboard opens.
  function syncVisibleHeight() {
    if (!window.visualViewport || !mq.matches) return;
    document.documentElement.style.setProperty("--app-height", window.visualViewport.height + "px");
  }
  syncVisibleHeight();
  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", syncVisibleHeight);
    window.visualViewport.addEventListener("scroll", syncVisibleHeight);
  }
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

  // Lightweight iOS/Android install support. Network-first SW avoids frozen releases.
  if ("serviceWorker" in navigator && /^https?:$/.test(location.protocol)) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("./sw.js").catch(function () {});
    });
  }
})();