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
    export: { title: "Xuất ảnh", sub: "Lưu ảnh đúng độ phân giải gốc" },
    batch: { title: "Sửa nhiều ảnh", sub: "Dùng một mẫu phủ cho toàn bộ ảnh" },
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
  exportSection.className = "sheet-section";
  exportSection.hidden = true;
  exportSection.innerHTML =
    '<p class="sheet-note">Ảnh được xử lý trên thiết bị và xuất ở kích thước gốc, không phải bản xem trước.</p>' +
    '<div class="sheet-actions">' +
    '<button type="button" class="btn primary wide photos-share" id="saveToPhotos" aria-describedby="saveToPhotosHint">▣ Lưu vào Ảnh</button>' +
    '<p class="sheet-note photos-share-hint" id="saveToPhotosHint">Trên iPhone, chọn “Lưu hình ảnh” trong bảng chia sẻ để lưu vào album.</p>' +
    '<button type="button" class="btn" data-proxy="dlPng">↓ Tải PNG</button>' +
    '<button type="button" class="btn" data-proxy="dlJpg">↓ Tải JPG</button>' +
    '<button type="button" class="btn wide" data-open-batch>▦ Sửa nhiều ảnh</button>' +
    '</div><span class="img-info" id="mobileBatchInfo">Chưa chọn ảnh hàng loạt</span>';
  panel.appendChild(exportSection);
  var batchSection = document.createElement("section");
  batchSection.className = "sheet-section batch-workflow";
  batchSection.id = "mobileBatchSection";
  batchSection.hidden = true;
  batchSection.innerHTML =
    '<p class="sheet-note">Sửa nhiều ảnh bằng cùng mẫu phủ chữ đang chọn.</p>' +
    '<div class="batch-step"><b>1</b><div><strong>Chọn nhiều ảnh</strong><small>Chọn cùng lúc từ Thư viện ảnh hoặc Files.</small></div></div>' +
    '<div class="batch-step"><b>2</b><div><strong>Chỉnh mẫu phủ</strong><small>Dùng các tab Chữ, Kiểu, Chỉnh để tạo mẫu chung.</small></div></div>' +
    '<div class="batch-step"><b>3</b><div><strong>Áp dụng &amp; tải tất cả</strong><small>Tải riêng từng ảnh PNG ở độ phân giải gốc.</small></div></div>' +
    '<button type="button" class="btn primary batch-pick" data-input="batchInput">＋ Chọn nhiều ảnh</button>' +
    '<p class="batch-status" id="batchSelectedStatus" role="status" aria-live="polite">Chưa chọn ảnh nào</p>' +
    '<div class="batch-settings"><strong>Mẫu phủ hiện tại</strong><p id="batchSettingsSummary"></p>' +
    '<small>Tất cả ảnh dùng cùng chữ, kiểu, màu, mật độ, hiệu ứng và logo.</small></div>' +
    '<button type="button" class="btn primary batch-apply" id="batchApplyDownload" data-proxy="batchDl" disabled>↓ Áp dụng &amp; tải tất cả PNG</button>' +
    '<p class="sheet-note">Mẫu phủ được áp dụng khi tải. Không gửi ảnh lên máy chủ.</p>';
  panel.appendChild(batchSection);

  /* Share the original-resolution PNG, not the reduced preview canvas.
     PNG conversion is synchronous so the native share call remains inside
     Safari's user-gesture handler (toBlob's async callback can lose activation). */
  var saveToPhotosButton = document.getElementById("saveToPhotos");
  function createSharePngFile() {
    var out = document.createElement("canvas");
    try {
      renderTo(out, state.imgW, state.imgH);
      var dataUrl = out.toDataURL("image/png");
      var prefix = "data:image/png;base64,";
      if (dataUrl.slice(0, prefix.length) !== prefix) {
        throw new Error("Không thể tạo file PNG");
      }
      var binary = atob(dataUrl.slice(prefix.length));
      var chunks = [];
      // Chunk conversion avoids an extra enormous typed-array allocation.
      for (var start = 0; start < binary.length; start += 32768) {
        var part = binary.slice(start, start + 32768);
        var bytes = new Uint8Array(part.length);
        for (var i = 0; i < part.length; i++) bytes[i] = part.charCodeAt(i);
        chunks.push(bytes);
      }
      var base = (state.imgName || "anh").replace(/[\\/:*?"<>|\x00-\x1f]/g, "-").slice(0, 70);
      return new File(chunks, "textmask-" + base + ".png", { type: "image/png" });
    } finally {
      out.width = 0;
      out.height = 0;
    }
  }

  function saveToPhotos() {
    if (saveToPhotosButton.disabled) return;
    if (!state.img) {
      toast("Hãy chọn ảnh trước khi lưu.");
      return;
    }
    if (typeof navigator.share !== "function" || typeof File !== "function") {
      toast("Trình duyệt chưa hỗ trợ chia sẻ ảnh. Hãy dùng Tải PNG.");
      return;
    }
    saveToPhotosButton.disabled = true;
    saveToPhotosButton.setAttribute("aria-busy", "true");

    var file;
    try {
      file = createSharePngFile();
      var shareData = { files: [file] };
      if (typeof navigator.canShare === "function" && !navigator.canShare(shareData)) {
        toast("Trình duyệt không hỗ trợ chia sẻ file ảnh. Hãy dùng Tải PNG.");
        saveToPhotosButton.disabled = false;
        saveToPhotosButton.removeAttribute("aria-busy");
        return;
      }
      // Do not await any operation before navigator.share: Safari needs a user gesture.
      var shareResult = navigator.share(shareData);
      toast("Trong bảng chia sẻ, chọn “Lưu hình ảnh” để lưu vào album.");
      Promise.resolve(shareResult).catch(function (error) {
        if (error && error.name === "AbortError") return; // User cancelled.
        if (error && error.name === "NotAllowedError") {
          toast("Safari không cho phép chia sẻ lúc này. Thử lại hoặc dùng Tải PNG.");
        } else {
          toast("Chia sẻ chưa thành công. Bạn có thể dùng Tải PNG.");
        }
      }).then(function () {
        saveToPhotosButton.disabled = false;
        saveToPhotosButton.removeAttribute("aria-busy");
      });
    } catch (error) {
      saveToPhotosButton.disabled = false;
      saveToPhotosButton.removeAttribute("aria-busy");
      if (error && error.name === "NotAllowedError") {
        toast("Safari không cho phép chia sẻ lúc này. Thử lại hoặc dùng Tải PNG.");
      } else {
        toast("Không tạo được file để chia sẻ. Hãy dùng Tải PNG.");
      }
    }
  }
  saveToPhotosButton.addEventListener("click", saveToPhotos);


  var moreSection = document.createElement("section");
  moreSection.id = "mobileMoreSection";
  moreSection.className = "sheet-section";
  moreSection.hidden = true;
  moreSection.innerHTML =
    '<div class="sheet-actions">' +
    '<button type="button" class="btn primary" data-input="fileInput">Chọn ảnh mới</button>' +
    '<button type="button" class="btn" data-proxy="demoBtn">Dùng ảnh mẫu</button>' +
    '<button type="button" class="btn wide" data-open-batch>▦ Sửa nhiều ảnh</button>' +
    '</div><p class="sheet-note">Bạn cũng có thể kéo thả hoặc dán ảnh vào trang trên máy tính. Ảnh không được tải lên máy chủ.</p>';
  panel.appendChild(moreSection);

  var closeButton = document.getElementById("mobileSheetClose");
  var title = document.getElementById("mobileSheetTitle");
  var subtitle = document.getElementById("mobileSheetSubtitle");
  var tabButtons = Array.prototype.slice.call(dock.querySelectorAll("[data-mobile-tab]"));
  var originalBatch = document.getElementById("batchDl");
  var originalBatchInfo = document.getElementById("batchInfo");
  var batchApply = document.getElementById("batchApplyDownload");
  var batchStatus = document.getElementById("batchSelectedStatus");
  var batchSummary = document.getElementById("batchSettingsSummary");

  // The canvas dimensions and renderer are unchanged; only the status label is rehomed.
  var imgInfo = document.getElementById("imgInfo");
  if (imgInfo) stage.appendChild(imgInfo);

  function syncBatch() {
    batchApply.disabled = originalBatch.disabled;
    var msg = originalBatchInfo.textContent || "Chưa chọn ảnh nào";
    batchStatus.textContent = msg;
    var match = msg.match(/Đã chọn\s+(\d+)\s+ảnh/);
    batchCount.hidden = !match;
    batchCount.textContent = match ? match[1] : "";
    var watermark = document.getElementById("textInput").value.trim() || "Watermark";
    batchSummary.textContent = "“" + watermark + "” · " +
      document.getElementById("styleName").textContent + " · " +
      document.getElementById("gapVal").textContent;
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
    if (group === "batch") syncBatch();
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