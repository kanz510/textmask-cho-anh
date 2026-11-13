/* Textmask Studio V11: saved-recipe batch apply and per-photo export. */
(function () {
  "use strict";
  if (!window.state || !window.renderTo || !window.setImage) return;

  var queue = [];
  var savedRecipes = [];
  var db = null;
  var queueSelected = null;
  var busy = false;
  var exportSelectedId = null;
  var exportBlob = null;
  var exportTicket = 0;
  var galleryTicket = 0;
  var pickerSelectedRecipe = "";
  var chooserTrigger = null;
  function resetExportBlob() {
    exportTicket++;
    exportBlob = null;
    var share = document.getElementById("exportSelectedShare");
    if (share) {
      share.disabled = true;
      share.textContent = "▣ Lưu vào Ảnh";
    }
  }
  function clearPhotoThumb(item) {
    item.thumbRevision = (item.thumbRevision || 0) + 1;
    if (item.editedThumbUrl) URL.revokeObjectURL(item.editedThumbUrl);
    item.editedThumbUrl = null;
    item.thumbPromise = null;
  }
  var persistenceError = false;
  var dbName = "textmask-workspace-v1";
  var recipeFallbackKey = "textmask-saved-recipes-v1";
  var photoInput = document.getElementById("batchInput");
  var statusEl = document.getElementById("batchInfo");
  var uploadGrid = document.getElementById("batchUploadQueue");
  var queueEmpty = document.getElementById("batchQueueEmpty");
  var queueCount = document.getElementById("batchQueueCount");
  var quickApply = document.getElementById("batchApplyChooser");
  var picker = document.getElementById("batchRecipePicker");
  var pickerChoices = document.getElementById("batchRecipeChoices");
  var pickerEmpty = document.getElementById("recipePickerEmpty");
  var pickerConfirm = document.getElementById("batchConfirmApply");
  var pickerClose = document.getElementById("recipePickerClose");
  var exportGrid = document.getElementById("exportEditedGrid");
  var exportEmpty = document.getElementById("exportEditedEmpty");
  var exportCount = document.getElementById("exportEditedCount");
  var exportPanel = document.getElementById("exportSelectedPanel");
  var exportName = document.getElementById("exportSelectedName");
  var exportPrep = document.getElementById("exportPrepStatus");
  var exportShare = document.getElementById("exportSelectedShare");
  var batchBadge = document.getElementById("mobileBatchCount");
  var appliedStatus = document.getElementById("batchAppliedStatus");
  var queueNotice = document.getElementById("batchStorageNotice");
  var clearBtn = document.getElementById("batchClearQueue");
  var saveButtons = [document.getElementById("recipeSaveBtn")];
  var saveInputs = [document.getElementById("recipeNameInput")];
  var loadButtons = [document.getElementById("recipeLoadBtn")];
  var recipeSelects = [document.getElementById("recipeSavedSelect")];
  var deleteBtn = document.getElementById("recipeDeleteBtn");
  var recipeStatus = document.getElementById("recipeStatus");
  var logoDecodeCache = Object.create(null);
  var uidCounter = 0;
  var fields = ["text","style","font","sizePct","opacity","gap","angle","color","color2","effect","brackets","caps","logo","logoW","logoH","logoOn"];

  function notify(message) {
    if (window.toast) window.toast(message);
    else if (recipeStatus) recipeStatus.textContent = message;
  }
  function safeName(name) {
    return String(name || "anh").replace(/\.[^.]+$/,"")
      .replace(/[\\/:*?"<>|\x00-\x1f]/g,"-").trim().slice(0,72) || "anh";
  }
  function promiseStore(store, method, value) {
    if (!db) return Promise.resolve(null);
    return new Promise(function (resolve, reject) {
      try {
        var transaction = db.transaction(store, method === "getAll" ? "readonly" : "readwrite");
        var obj = transaction.objectStore(store);
        var request = method === "getAll" ? obj.getAll()
          : method === "clear" ? obj.clear() : obj[method](value);
        var result;
        request.onsuccess = function () { result = request.result; };
        transaction.oncomplete = function () { resolve(result); };
        transaction.onerror = function () { reject(transaction.error || new Error("Không lưu được dữ liệu")); };
        transaction.onabort = function () { reject(transaction.error || new Error("Đã huỷ lưu dữ liệu")); };
      } catch (error) { reject(error); }
    });
  }
  function openStore() {
    if (!window.indexedDB) return Promise.resolve(null);
    return new Promise(function (resolve) {
      try {
        var request = indexedDB.open(dbName, 1);
        request.onupgradeneeded = function () {
          var database = request.result;
          if (!database.objectStoreNames.contains("photos")) database.createObjectStore("photos", { keyPath: "id" });
          if (!database.objectStoreNames.contains("recipes")) database.createObjectStore("recipes", { keyPath: "name" });
        };
        request.onsuccess = function () {
          var database = request.result;
          database.onversionchange = function () { database.close(); };
          resolve(database);
        };
        request.onerror = function () { resolve(null); };
        request.onblocked = function () { resolve(null); };
      } catch (error) { resolve(null); }
    });
  }
  function storageWarning() {
    if (!queueNotice) return;
    queueNotice.textContent = db && !persistenceError
      ? "Danh sách chờ được lưu trên iPhone này. Safari có thể xoá nếu bạn dọn dữ liệu trang hoặc thiếu dung lượng."
      : "Không thể lưu bền vững trên thiết bị này. Ảnh chỉ được giữ đến khi tải lại hoặc đóng trang.";
  }
  function persistPhoto(item) {
    if (!db) return Promise.resolve();
    return promiseStore("photos","put",{
      id:item.id, name:item.name, file:item.file,
      date:item.date, applied:item.applied
    }).catch(function () { persistenceError = true; storageWarning(); });
  }
  function dropPhoto(item) {
    if (item.url) URL.revokeObjectURL(item.url);
    clearPhotoThumb(item);
    if (!db) return Promise.resolve();
    return promiseStore("photos","delete",item.id).catch(function () {
      persistenceError = true; storageWarning();
    });
  }
  function makePhoto(record) {
    return {
      id:record.id,
      name:record.name || "anh",
      file:record.file,
      date:record.date || Date.now(),
      applied:record.applied || null,
      url:URL.createObjectURL(record.file)
    };
  }
  function updateQueue() {
    if (uploadGrid) {
      uploadGrid.textContent = "";
      queue.forEach(function (item) {
        var card = document.createElement("div");
        card.className = "queue-photo" + (item.id === queueSelected ? " is-selected" : "");
        var select = document.createElement("button");
        select.type = "button";
        select.className = "queue-photo-open";
        select.dataset.queueOpen = item.id;
        select.setAttribute("aria-label","Xem trước ảnh " + item.name);
        var image = document.createElement("img");
        image.loading = "lazy";
        image.alt = "";
        image.src = item.url;
        select.appendChild(image);
        var detail = document.createElement("span");
        detail.className = "queue-photo-detail";
        var name = document.createElement("strong");
        name.textContent = item.name;
        var mark = document.createElement("small");
        mark.className = item.applied ? "queue-done" : "queue-pending";
        mark.textContent = item.applied ? "✓ Đã áp dụng" : "○ Chờ áp dụng";
        detail.appendChild(name);
        detail.appendChild(mark);
        select.appendChild(detail);
        var remove = document.createElement("button");
        remove.type = "button";
        remove.className = "queue-photo-remove";
        remove.dataset.queueRemove = item.id;
        remove.setAttribute("aria-label","Xoá ảnh " + item.name);
        remove.textContent = "×";
        card.appendChild(select);
        card.appendChild(remove);
        uploadGrid.appendChild(card);
      });
    }
    var total = queue.length;
    var applied = queue.filter(function (item) { return !!item.applied; }).length;
    window.state.batch = queue;
    queueCount.textContent = total + " ảnh";
    if (queueEmpty) queueEmpty.hidden = total > 0;
    if (quickApply) quickApply.disabled = !total || busy;
    if (batchBadge) {
      batchBadge.hidden = !total;
      batchBadge.textContent = String(total);
    }
    if (clearBtn) clearBtn.disabled = !total || busy;
    if (appliedStatus) {
      appliedStatus.textContent = !total ? "Danh sách đang trống"
        : applied === total ? "✓ Đã áp dụng cho " + total + " ảnh. Xem và tải riêng trong tab Xuất."
        : "Đã áp dụng " + applied + "/" + total + " ảnh · " + (total - applied) + " ảnh còn chờ.";
    }
    statusEl.textContent = total
      ? "Đã chọn " + total + " ảnh · " + applied + " đã áp dụng"
      : "Chưa chọn ảnh nào";
    storageWarning();
    renderEditedGallery();
  }
  function findPhoto(id) {
    return queue.find(function (p) { return p.id === id; });
  }
  function loadPicture(blob) {
    return new Promise(function (resolve,reject) {
      var url = URL.createObjectURL(blob);
      var img = new Image();
      img.onload = function () { URL.revokeObjectURL(url); resolve(img); };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error("Không đọc được ảnh")); };
      img.src = url;
    });
  }
  async function previewPhoto(id) {
    var item = findPhoto(id);
    if (!item) return;
    queueSelected = id;
    updateQueue();
    try {
      var image = await loadPicture(item.file);
      if (queueSelected !== id || !findPhoto(id)) return;
      window.setImage(image,image.naturalWidth,image.naturalHeight,safeName(item.name),false);
      notify("Đang xem trước: " + item.name + ". Công thức hiện tại chưa tự áp dụng cho cả danh sách.");
    } catch (error) { notify(error.message); }
  }
  async function addPhotos(fileList) {
    if (busy) return;
    resetExportBlob();
    var files = Array.prototype.slice.call(fileList || []).filter(function (file) { return /^image\//.test(file.type); });
    if (!files.length) { notify("Hãy chọn ít nhất một ảnh."); return; }
    var first = queue.length === 0;
    var added = [];
    files.forEach(function (file) {
      var record = {
        id:"p" + Date.now().toString(36) + "-" + (++uidCounter).toString(36) + "-" + Math.random().toString(36).slice(2,7),
        name:file.name || "anh", file:file, date:Date.now(), applied:null
      };
      var photo = makePhoto(record);
      queue.push(photo);
      added.push(photo);
    });
    updateQueue();
    await Promise.all(added.map(persistPhoto));
    if (first && added.length) previewPhoto(added[0].id);
    notify("Đã đưa " + added.length + " ảnh vào mục Đã tải lên.");
  }
  async function removePhoto(id) {
    if (busy) return;
    var item = findPhoto(id);
    if (!item) return;
    resetExportBlob();
    queue = queue.filter(function (p) { return p.id !== id; });
    if (queueSelected === id) queueSelected = null;
    await dropPhoto(item);
    updateQueue();
    if (!queueSelected && queue.length) previewPhoto(queue[0].id);
    else if (!queue.length) {
      var demo = window.makeDemoImage();
      window.setImage(demo,demo.width,demo.height,"anh-mau",true);
    }
  }
  async function clearQueue() {
    if (!queue.length || busy) return;
    if (!window.confirm("Xoá toàn bộ ảnh đang chờ khỏi thiết bị? Công thức đã lưu vẫn được giữ.")) return;
    resetExportBlob();
    queue.forEach(function (item) { if (item.url) URL.revokeObjectURL(item.url); clearPhotoThumb(item); });
    queue=[];
    queueSelected=null;
    if (db) {
      try { await promiseStore("photos","clear"); }
      catch (error) { persistenceError=true; }
    }
    var demo = window.makeDemoImage();
    window.setImage(demo,demo.width,demo.height,"anh-mau",true);
    updateQueue();
  }
  function captureRecipe() {
    var s=window.state;
    var recipe={
      text:s.text,style:s.style,font:s.font.id,sizePct:s.sizePct,
      opacity:s.opacity,gap:s.gap,angle:s.angle,color:s.color,
      color2:s.color2,effect:s.effect,brackets:s.brackets,
      caps:s.caps,logoOn:!!s.logoOn && !!s.logo,logoData:""
    };
    if (recipe.logoOn) {
      var img=s.logo;
      var width=s.logoW || img.naturalWidth || img.width;
      var height=s.logoH || img.naturalHeight || img.height;
      if (!width || !height) throw new Error("Logo chưa sẵn sàng. Hãy chọn lại logo.");
      var ratio=Math.min(1,768/Math.max(width,height));
      var canvas=document.createElement("canvas");
      canvas.width=Math.max(1,Math.round(width*ratio));
      canvas.height=Math.max(1,Math.round(height*ratio));
      canvas.getContext("2d").drawImage(img,0,0,canvas.width,canvas.height);
      recipe.logoData=canvas.toDataURL("image/png");
      canvas.width=0;canvas.height=0;
    }
    return recipe;
  }
  async function getLogo(recipe) {
    if (!recipe.logoOn || !recipe.logoData) return null;
    if (!logoDecodeCache[recipe.logoData]) {
      logoDecodeCache[recipe.logoData] = new Promise(function (resolve,reject) {
        var img = new Image();
        img.onload=function () { resolve(img); };
        img.onerror=function () { reject(new Error("Không đọc được logo của công thức")); };
        img.src=recipe.logoData;
      });
    }
    return logoDecodeCache[recipe.logoData];
  }
  function snapshotState() {
    var copy={};
    fields.forEach(function (key) { copy[key]=window.state[key]; });
    return copy;
  }
  function applyState(recipe, logoImage) {
    var s=window.state;
    s.text=String(recipe.text || "");
    s.style=recipe.style || "grid";
    s.font=window.fontById(recipe.font);
    s.sizePct=Number(recipe.sizePct) || 3.1;
    s.opacity=Number(recipe.opacity) || 55;
    s.gap=Number(recipe.gap) || 4.2;
    s.angle=Number(recipe.angle) || 0;
    s.color=recipe.color || "#ffffff";
    s.color2=recipe.color2 || "#ffd94d";
    s.effect=recipe.effect || "none";
    s.brackets=!!recipe.brackets;
    s.caps=!!recipe.caps;
    s.logo=logoImage;
    s.logoW=logoImage ? (logoImage.naturalWidth || logoImage.width) : 0;
    s.logoH=logoImage ? (logoImage.naturalHeight || logoImage.height) : 0;
    s.logoOn=!!recipe.logoOn && !!logoImage;
  }
  function syncEditor() {
    var s=window.state;
    document.getElementById("textInput").value=s.text;
    function range(id,val,label) {
      document.getElementById(id).value=val;
      document.getElementById(label).textContent=id === "sizeRange"
        ? Number(val).toFixed(1).replace(".",",") + "% chiều ngang ảnh"
        : id === "opacityRange" ? Math.round(val) + "%"
        : Math.round(val) + "°";
    }
    range("sizeRange",s.sizePct,"sizeVal");
    range("opacityRange",s.opacity,"opacityVal");
    range("angleRange",s.angle,"angleVal");
    var levels=[4.2,3.5,2.8,2.1,1.4];
    var nearest=0;
    levels.forEach(function (v,i) {
      if (Math.abs(v-s.gap)<Math.abs(levels[nearest]-s.gap)) nearest=i;
    });
    document.getElementById("gapRange").value=nearest+1;
    document.getElementById("gapVal").textContent=["Rất thưa","Thưa","Hơi thưa","Vừa","Dày"][nearest];
    document.getElementById("colorCustom").value=s.color;
    document.getElementById("color2Custom").value=s.color2;
    document.getElementById("logoToggle").setAttribute("aria-pressed",s.logoOn?"true":"false");
    document.getElementById("logoInfo").textContent=s.logo
      ? "Logo đã lưu trong công thức" : "Chưa chọn logo";
    window.syncStyleUI();window.syncFontUI();window.syncEffectUI();
    window.syncColorUI();window.syncToggleUI();
    window.render();window.refreshThumbs();window.refreshPresetSamples();
    if (document.fonts && document.fonts.load) {
      document.fonts.load(s.font.weight + " 16px " + s.font.stack).then(function () {
        window.render();window.refreshThumbs();
      }).catch(function () {});
    }
    updateQueue();
  }
  async function useRecipe(recipe) {
    if (!recipe) return;
    var image=await getLogo(recipe);
    applyState(recipe,image);
    syncEditor();
  }
  function renderRecipePicker() {
    if (!picker || picker.hidden) return;
    pickerChoices.textContent = "";
    savedRecipes.forEach(function (item) {
      var button = document.createElement("button");
      button.type = "button";
      button.className = "recipe-picker-option" + (pickerSelectedRecipe === item.name ? " selected" : "");
      button.dataset.recipePick = item.name;
      button.setAttribute("aria-pressed",pickerSelectedRecipe === item.name ? "true" : "false");
      var label = document.createElement("strong");
      label.textContent = item.name;
      var detail = document.createElement("small");
      var config = item.config || {};
      detail.textContent = "“" + (config.text || "Watermark") + "” · " + (config.style || "grid");
      button.appendChild(label);button.appendChild(detail);
      pickerChoices.appendChild(button);
    });
    pickerEmpty.hidden = savedRecipes.length > 0;
    pickerConfirm.disabled = busy || !pickerSelectedRecipe || !findRecipe(pickerSelectedRecipe);
  }
  function openRecipePicker() {
    if (busy || !queue.length) return;
    chooserTrigger = document.activeElement;
    pickerSelectedRecipe = "";
    picker.hidden = false;
    renderRecipePicker();
    pickerClose.focus({preventScroll:true});
  }
  function closeRecipePicker() {
    picker.hidden = true;
    pickerSelectedRecipe = "";
    if (chooserTrigger && chooserTrigger.isConnected) chooserTrigger.focus({preventScroll:true});
  }
  async function applySavedRecipeToAll(name) {
    if (!queue.length || busy) return;
    var saved = findRecipe(name);
    if (!saved || !saved.config) { notify("Hãy chọn một công thức đã lưu."); return; }
    busy=true;updateQueue();
    pickerConfirm.disabled = true;
    resetExportBlob();
    try {
      // The selected recipe is fixed onto every queued image. Later slider changes
      // cannot silently alter a completed photo.
      await useRecipe(saved.config);
      queue.forEach(function (item) {
        clearPhotoThumb(item);
        item.applied = JSON.parse(JSON.stringify(saved.config));
      });
      await Promise.all(queue.map(persistPhoto));
      notify("Đã áp dụng công thức “" + saved.name + "” cho " + queue.length + " ảnh.");
      closeRecipePicker();
    } catch (error) {
      notify("Áp dụng không thành công: " + (error.message || "Hãy thử lại."));
    } finally { busy=false; updateQueue(); }
  }
  function readFallbackRecipes() {
    try {
      var value=JSON.parse(localStorage.getItem(recipeFallbackKey) || "[]");
      return Array.isArray(value)?value:[];
    } catch (error) { return []; }
  }
  function fallbackSaveRecipes() {
    try { localStorage.setItem(recipeFallbackKey,JSON.stringify(savedRecipes));return true; }
    catch (error) { return false; }
  }
  function updateSavedLists(selected) {
    savedRecipes.sort(function (a,b) { return b.savedAt-a.savedAt; });
    recipeSelects.forEach(function (select) {
      if (!select) return;
      var prev=selected || select.value;
      select.textContent="";
      var start=document.createElement("option");
      start.value="";start.textContent="Chọn công thức đã lưu";select.appendChild(start);
      savedRecipes.forEach(function (item) {
        var option=document.createElement("option");
        option.value=item.name;option.textContent=item.name;
        select.appendChild(option);
      });
      select.value=savedRecipes.some(function (item) { return item.name===prev; })?prev:"";
    });
    var empty=!savedRecipes.length;
    loadButtons.forEach(function (btn) { if (btn) btn.disabled=empty; });
    if (deleteBtn) deleteBtn.disabled=empty;
    renderRecipePicker();
  }
  function findRecipe(name) {
    return savedRecipes.find(function (r) { return r.name===name; });
  }
  async function saveCurrentRecipe(name) {
    name=String(name||"").trim().slice(0,50);
    if (!name) { notify("Hãy nhập tên công thức trước khi lưu.");return; }
    if (findRecipe(name) && !window.confirm("Công thức này đã tồn tại. Ghi đè thiết lập cũ?"))return;
    var config;
    try { config=captureRecipe(); }
    catch (error) { notify(error.message);return; }
    var record={name:name,savedAt:Date.now(),config:config};
    if (db) {
      try { await promiseStore("recipes","put",record); }
      catch (error) { notify("Không lưu được công thức. Kiểm tra dung lượng trình duyệt.");return; }
    } else {
      savedRecipes=savedRecipes.filter(function (r) { return r.name!==name; });
      savedRecipes.push(record);
      if (!fallbackSaveRecipes()) { notify("Không còn dung lượng để lưu công thức.");return; }
    }
    savedRecipes=savedRecipes.filter(function (r) { return r.name!==name; });
    savedRecipes.push(record);
    updateSavedLists(name);
    if (recipeStatus) recipeStatus.textContent="Đã lưu công thức “"+name+"” trên thiết bị.";
    notify("Đã lưu công thức “"+name+"”.");
  }
  async function loadSavedRecipe(name) {
    var item=findRecipe(name);
    if (!item) { notify("Hãy chọn công thức đã lưu.");return; }
    try {
      await useRecipe(item.config);
      saveInputs.forEach(function (el) { if (el) el.value=item.name; });
      updateSavedLists(item.name);
      if (recipeStatus) recipeStatus.textContent="Đang dùng công thức “"+name+"”.";
      notify("Đã áp dụng công thức “"+name+"” vào trình chỉnh ảnh.");
    } catch (error) { notify("Không mở được công thức này: "+error.message); }
  }
  async function removeSavedRecipe(name) {
    if (!name || !findRecipe(name)) { notify("Hãy chọn công thức muốn xoá.");return; }
    if (!window.confirm("Xoá công thức “"+name+"” khỏi thiết bị?"))return;
    if (db) {
      try { await promiseStore("recipes","delete",name); }
      catch (error) { notify("Không thể xoá công thức lúc này.");return; }
    }
    savedRecipes=savedRecipes.filter(function (r) { return r.name!==name; });
    if (!db) fallbackSaveRecipes();
    updateSavedLists("");
    if (recipeStatus) recipeStatus.textContent="Đã xoá công thức “"+name+"”.";
  }
  async function renderPhoto(item) {
    var image=await loadPicture(item.file);
    var recipe=item.applied;
    var logo=await getLogo(recipe);
    if(document.fonts&&document.fonts.load) {
      try {
        var font=window.fontById(recipe.font);
        await document.fonts.load(font.weight+" 16px "+font.stack);
      } catch(error) {}
    }
    var previous=snapshotState();
    var canvas=document.createElement("canvas");
    try {
      applyState(recipe,logo);
      window.renderTo(canvas,image.naturalWidth,image.naturalHeight,image);
    } finally {Object.assign(window.state,previous);}
    return new Promise(function(resolve,reject) {
      canvas.toBlob(function(blob) {
        canvas.width=0;canvas.height=0;
        if(blob)resolve(blob);
        else reject(new Error("Không tạo được PNG của "+item.name));
      },"image/png");
    });
  }

  function completedPhotos() {
    return queue.filter(function (item) { return !!item.applied; });
  }
  async function createEditedThumbnail(item) {
    if (!item.applied) return null;
    if (item.editedThumbUrl) return item.editedThumbUrl;
    if (item.thumbPromise) return item.thumbPromise;
    var recipe=item.applied;
    var revision=item.thumbRevision || 0;
    item.thumbPromise=(async function() {
      var image=await loadPicture(item.file);
      var logo=await getLogo(recipe);
      var font=window.fontById(recipe.font);
      if(document.fonts&&document.fonts.load) {
        try {await document.fonts.load(font.weight+" 16px "+font.stack);}catch(error){}
      }
      if(item.applied!==recipe || item.thumbRevision!==revision) return null;
      var ratio=Math.min(1,340/Math.max(image.naturalWidth,image.naturalHeight));
      var canvas=document.createElement("canvas"),before=snapshotState();
      try {
        applyState(recipe,logo);
        window.renderTo(canvas,Math.max(1,Math.round(image.naturalWidth*ratio)),
          Math.max(1,Math.round(image.naturalHeight*ratio)),image);
      } finally {Object.assign(window.state,before);}
      var blob=await new Promise(function(resolve){canvas.toBlob(resolve,"image/png");});
      canvas.width=0;canvas.height=0;
      if(!blob || item.applied!==recipe || item.thumbRevision!==revision) return null;
      item.editedThumbUrl=URL.createObjectURL(blob);
      return item.editedThumbUrl;
    })().catch(function(){return null;}).then(function(value) {
      item.thumbPromise=null;
      return value;
    });
    return item.thumbPromise;
  }
  function renderEditedGallery() {
    if(!exportGrid) return;
    var edited=completedPhotos();
    exportCount.textContent=edited.length+" ảnh";
    exportEmpty.hidden=edited.length>0;
    if(!edited.length) {
      exportSelectedId=null;
      resetExportBlob();
      exportPanel.hidden=true;
    } else {
      if(!edited.some(function(item){return item.id===exportSelectedId;})) {
        exportSelectedId=edited[0].id;
        resetExportBlob();
      }
      exportPanel.hidden=false;
      exportName.textContent=findPhoto(exportSelectedId).name;
    }
    exportGrid.textContent="";
    var tasks=[];
    edited.forEach(function(item) {
      var card=document.createElement("button");
      card.type="button";
      card.className="edited-photo-card"+(item.id===exportSelectedId?" is-selected":"");
      card.dataset.exportPick=item.id;
      card.setAttribute("aria-pressed",item.id===exportSelectedId?"true":"false");
      card.setAttribute("aria-label","Chọn ảnh đã sửa: "+item.name);
      var img=document.createElement("img");
      img.alt="";img.loading="lazy";img.src=item.editedThumbUrl||item.url;
      var name=document.createElement("strong");name.textContent=item.name;
      var mark=document.createElement("span");mark.className="edited-photo-marker";mark.textContent="✓ Đã áp dụng";
      card.appendChild(img);card.appendChild(name);card.appendChild(mark);
      exportGrid.appendChild(card);
      if(!item.editedThumbUrl) tasks.push({item:item,img:img});
    });
    if(busy) return;
    var run=++galleryTicket;
    (async function(){
      for(var i=0;i<tasks.length;i++) {
        if(run!==galleryTicket)return;
        var task=tasks[i],url=await createEditedThumbnail(task.item);
        if(run===galleryTicket && url && task.img.isConnected && task.item.applied)
          task.img.src=url;
      }
    })();
  }
  async function prepareSelectedImage() {
    var item=findPhoto(exportSelectedId);
    if(!item || !item.applied || busy) return;
    if(exportBlob) return;
    resetExportBlob();
    var ticket=exportTicket, id=item.id;
    exportName.textContent=item.name;
    exportPrep.textContent="Đang chuẩn bị ảnh ở độ phân giải gốc…";
    exportShare.textContent="Đang chuẩn bị ảnh…";
    try {
      var blob=await renderPhoto(item);
      if(ticket!==exportTicket || id!==exportSelectedId || !findPhoto(id)) return;
      exportBlob=blob;
      var supported=typeof navigator.share==="function" && typeof File==="function";
      exportShare.disabled=!supported;
      exportShare.textContent="▣ Lưu vào Ảnh";
      exportPrep.textContent=supported
        ? "✓ Ảnh sẵn sàng. Bấm Lưu vào Ảnh rồi chọn “Lưu hình ảnh”."
        : "Trình duyệt này không hỗ trợ chia sẻ ảnh vào album. Hãy mở trên Safari iPhone.";
    } catch(error) {
      if(ticket!==exportTicket) return;
      exportShare.textContent="▣ Lưu vào Ảnh";
      exportPrep.textContent="Không thể tạo ảnh: "+(error.message||"Hãy thử lại.");
    }
  }
  function chooseEditedPhoto(id) {
    var item=findPhoto(id);
    if(!item || !item.applied)return;
    if(exportSelectedId!==id){exportSelectedId=id;resetExportBlob();}
    renderEditedGallery();
    prepareSelectedImage();
  }
  function shareSelectedImage() {
    if(!exportBlob || exportShare.disabled)return;
    try {
      // iOS needs the share call during this real tap, not after an await.
      var item=findPhoto(exportSelectedId);
      var file=new File([exportBlob],"textmask-"+safeName(item.name)+".png",{type:"image/png"});
      var data={files:[file]};
      if(navigator.canShare && !navigator.canShare(data)) {
        notify("Safari không hỗ trợ chia sẻ ảnh này vào album.");
        return;
      }
      Promise.resolve(navigator.share(data)).catch(function(error){
        if(error && error.name!=="AbortError")
          notify("Không thể mở bảng chia sẻ. Hãy thử lại trên Safari.");
      });
    }catch(error){notify("Không thể mở bảng chia sẻ. Hãy thử lại trên Safari.");}
  }


  photoInput.addEventListener("change",function(event){
    var files=Array.prototype.slice.call(event.target.files||[]);
    event.target.value="";
    addPhotos(files);
  });

  quickApply.addEventListener("click",openRecipePicker);
  pickerClose.addEventListener("click",closeRecipePicker);
  picker.addEventListener("click",function(event){
    if(event.target===picker){closeRecipePicker();return;}
    var option=event.target.closest("[data-recipe-pick]");
    if(option){pickerSelectedRecipe=option.dataset.recipePick;renderRecipePicker();}
  });
  pickerConfirm.addEventListener("click",function(){
    if(pickerSelectedRecipe && !pickerConfirm.disabled)applySavedRecipeToAll(pickerSelectedRecipe);
  });
  document.addEventListener("keydown",function(event){
    if(!picker.hidden && event.key==="Escape") {
      event.preventDefault();event.stopImmediatePropagation();closeRecipePicker();
    }
  },true);
  exportGrid.addEventListener("click",function(event){
    var target=event.target.closest("[data-export-pick]");
    if(target)chooseEditedPhoto(target.dataset.exportPick);
  });
  exportShare.addEventListener("click",shareSelectedImage);
  window.addEventListener("textmask:export-open",function(){
    renderEditedGallery();
    if(exportSelectedId)prepareSelectedImage();
  });

  clearBtn.addEventListener("click",clearQueue);
  if(uploadGrid)uploadGrid.addEventListener("click",function(event){
    var remove=event.target.closest("[data-queue-remove]");
    if(remove){removePhoto(remove.dataset.queueRemove);return;}
    var open=event.target.closest("[data-queue-open]");
    if(open)previewPhoto(open.dataset.queueOpen);
  });
  saveButtons.forEach(function(button,i){
    if(!button)return;
    button.addEventListener("click",function(){saveCurrentRecipe(saveInputs[i].value);});
  });
  loadButtons.forEach(function(button,i){
    if(!button)return;
    button.addEventListener("click",function(){loadSavedRecipe(recipeSelects[i].value);});
  });
  deleteBtn.addEventListener("click",function(){removeSavedRecipe(recipeSelects[0].value);});
  recipeSelects.forEach(function(select,i){
    if(!select)return;
    select.addEventListener("change",function(){
      recipeSelects.forEach(function(other){if(other!==select)other.value=select.value;});
      if(select.value&&saveInputs[i])saveInputs[i].value=select.value;
    });
  });
  window.addEventListener("pagehide",function(event){
    if (event.persisted) return;
    queue.forEach(function(item){if(item.url)URL.revokeObjectURL(item.url);clearPhotoThumb(item);});
    resetExportBlob();
  });

  async function initialize() {
    db=await openStore();
    storageWarning();
    if(db) {
      try {
        var items=await promiseStore("photos","getAll");
        (items||[]).sort(function(a,b){return a.date-b.date;}).forEach(function(item){
          if(item&&item.file)queue.push(makePhoto(item));
        });
      } catch(error){persistenceError=true;}
      try {savedRecipes=await promiseStore("recipes","getAll")||[];}
      catch(error){savedRecipes=[];}
    } else savedRecipes=readFallbackRecipes();
    updateQueue();updateSavedLists("");
    if(queue.length && !queueSelected) previewPhoto(queue[0].id);
  }
  updateQueue();updateSavedLists("");
  initialize().catch(function(){persistenceError=true;storageWarning();});
})();