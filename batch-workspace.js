/* Textmask Studio V10: IndexedDB image queue, shared recipes, one ZIP download. */
(function () {
  "use strict";
  if (!window.state || !window.renderTo || !window.setImage) return;

  var queue = [];
  var savedRecipes = [];
  var db = null;
  var queueSelected = null;
  var busy = false;
  var preparedZipUrl = null;
  var zipLinks = [document.getElementById("batchZipReadyLink"),document.getElementById("desktopZipReadyLink")];
  var desktopApply = document.getElementById("desktopApplyAll");
  function clearPreparedZip() {
    if (preparedZipUrl) URL.revokeObjectURL(preparedZipUrl);
    preparedZipUrl = null;
    zipLinks.forEach(function (link) {
      if (!link) return;
      link.hidden = true;
      link.removeAttribute("href");
    });
  }
  var persistenceError = false;
  var dbName = "textmask-workspace-v1";
  var recipeFallbackKey = "textmask-saved-recipes-v1";
  var photoInput = document.getElementById("batchInput");
  var statusEl = document.getElementById("batchInfo");
  var exportBtn = document.getElementById("batchDl");
  var uploadGrid = document.getElementById("batchUploadQueue");
  var queueEmpty = document.getElementById("batchQueueEmpty");
  var queueCount = document.getElementById("batchQueueCount");
  var batchApply = document.getElementById("batchApplyAll");
  var appliedStatus = document.getElementById("batchAppliedStatus");
  var queueNotice = document.getElementById("batchStorageNotice");
  var clearBtn = document.getElementById("batchClearQueue");
  var saveButtons = [document.getElementById("recipeSaveBtn"), document.getElementById("batchRecipeSave")];
  var saveInputs = [document.getElementById("recipeNameInput"), document.getElementById("batchRecipeName")];
  var loadButtons = [document.getElementById("recipeLoadBtn"), document.getElementById("batchRecipeUse")];
  var recipeSelects = [document.getElementById("recipeSavedSelect"), document.getElementById("batchRecipeSelect")];
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
    if (batchApply) batchApply.disabled = !total || busy;
    if (desktopApply) desktopApply.disabled = !total || busy;
    if (clearBtn) clearBtn.disabled = !total || busy;
    exportBtn.disabled = !total || busy || applied !== total;
    if (appliedStatus) {
      appliedStatus.textContent = !total ? "Danh sách đang trống"
        : applied === total ? "✓ Đã áp dụng cho " + total + " ảnh. Có thể xuất ZIP."
        : "Đã áp dụng " + applied + "/" + total + " ảnh · " + (total - applied) + " ảnh còn chờ.";
    }
    statusEl.textContent = total
      ? "Đã chọn " + total + " ảnh · " + applied + " đã áp dụng"
      : "Chưa chọn ảnh nào";
    storageWarning();
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
    clearPreparedZip();
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
    clearPreparedZip();
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
    clearPreparedZip();
    queue.forEach(function (item) { if (item.url) URL.revokeObjectURL(item.url); });
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
  async function applyAll() {
    if (!queue.length || busy) return;
    clearPreparedZip();
    var recipe;
    try { recipe=captureRecipe(); }
    catch (error) { notify(error.message); return; }
    busy=true;updateQueue();
    try {
      queue.forEach(function (item) { item.applied=Object.assign({},recipe); });
      await Promise.all(queue.map(persistPhoto));
      notify("Đã áp dụng cùng một công thức cho " + queue.length + " ảnh.");
    } catch (error) {
      notify("Không thể lưu công thức vào hàng chờ.");
    } finally { busy=false;updateQueue(); }
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
  var crcTable=(function () {
    var table=[];
    for (var i=0;i<256;i++) {
      var v=i;
      for (var j=0;j<8;j++) v=(v&1)?(0xedb88320^(v>>>1)):(v>>>1);
      table.push(v>>>0);
    }
    return table;
  })();
  function crc32(bytes) {
    var crc=0xffffffff;
    for(var i=0;i<bytes.length;i++) crc=(crc>>>8)^crcTable[(crc^bytes[i])&255];
    return (crc^0xffffffff)>>>0;
  }
  function zipHeader(length) {return new Uint8Array(length);}
  function fileDate() {
    var d=new Date();
    return {time:(d.getHours()<<11)|(d.getMinutes()<<5)|Math.floor(d.getSeconds()/2),
      date:((d.getFullYear()-1980)<<9)|((d.getMonth()+1)<<5)|d.getDate()};
  }
  function uniqueFilenames(items) {
    var used=Object.create(null);
    return items.map(function (item) {
      var name=safeName(item.name);
      var key=name.toLowerCase();
      used[key]=(used[key]||0)+1;
      return "textmask-"+name+(used[key]>1?"-"+used[key]:"")+".png";
    });
  }
  async function packZip(files) {
    var parts=[], central=[], offset=0;
    var enc=new TextEncoder();
    var date=fileDate();
    for(var i=0;i<files.length;i++) {
      var entry=files[i];
      var bytes=new Uint8Array(await entry.blob.arrayBuffer());
      var fileName=enc.encode(entry.name);
      if (bytes.length>0xffffffff || offset>0xffffffff) throw new Error("Bộ ảnh quá lớn để tạo ZIP trên điện thoại.");
      var check=crc32(bytes);
      var local=zipHeader(30+fileName.length),ld=new DataView(local.buffer);
      ld.setUint32(0,0x04034b50,true);ld.setUint16(4,20,true);ld.setUint16(6,0x0800,true);
      ld.setUint16(8,0,true);ld.setUint16(10,date.time,true);ld.setUint16(12,date.date,true);
      ld.setUint32(14,check,true);ld.setUint32(18,bytes.length,true);ld.setUint32(22,bytes.length,true);
      ld.setUint16(26,fileName.length,true);ld.setUint16(28,0,true);local.set(fileName,30);
      parts.push(local,entry.blob);
      var dir=zipHeader(46+fileName.length),dv=new DataView(dir.buffer);
      dv.setUint32(0,0x02014b50,true);dv.setUint16(4,20,true);dv.setUint16(6,20,true);
      dv.setUint16(8,0x0800,true);dv.setUint16(10,0,true);
      dv.setUint16(12,date.time,true);dv.setUint16(14,date.date,true);
      dv.setUint32(16,check,true);dv.setUint32(20,bytes.length,true);dv.setUint32(24,bytes.length,true);
      dv.setUint16(28,fileName.length,true);dv.setUint16(30,0,true);dv.setUint16(32,0,true);
      dv.setUint16(34,0,true);dv.setUint16(36,0,true);dv.setUint32(38,0,true);dv.setUint32(42,offset,true);
      dir.set(fileName,46);central.push(dir);
      offset+=local.length+bytes.length;
    }
    var directorySize=central.reduce(function (n,p) {return n+p.length;},0);
    if (offset+directorySize>0xffffffff || files.length>65535)
      throw new Error("Bộ ảnh quá lớn, hãy chia thành nhiều lượt.");
    var end=zipHeader(22),ev=new DataView(end.buffer);
    ev.setUint32(0,0x06054b50,true);ev.setUint16(4,0,true);ev.setUint16(6,0,true);
    ev.setUint16(8,files.length,true);ev.setUint16(10,files.length,true);
    ev.setUint32(12,directorySize,true);ev.setUint32(16,offset,true);ev.setUint16(20,0,true);
    return new Blob(parts.concat(central,[end]),{type:"application/zip"});
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
  async function downloadAll() {
    if (busy || !queue.length) return;
    if(queue.some(function(item){return !item.applied;})) {
      notify("Còn ảnh chưa áp dụng. Hãy bấm Áp dụng công thức cho tất cả trước.");return;
    }
    busy=true;updateQueue();
    var output=[];
    try {
      var names=uniqueFilenames(queue);
      for(var i=0;i<queue.length;i++) {
        if (appliedStatus) appliedStatus.textContent="Đang xuất PNG "+(i+1)+"/"+queue.length+"…";
        var blob=await renderPhoto(queue[i]);
        output.push({name:names[i],blob:blob});
        // Avoid excessive peak memory usage on Safari.
        var size=output.reduce(function(n,e){return n+e.blob.size;},0);
        if(size>350*1024*1024)throw new Error("Bộ ảnh vượt 350 MB. Hãy chia thành nhiều lượt trên iPhone.");
      }
      if (appliedStatus) appliedStatus.textContent="Đang đóng gói ZIP…";
      var zip=await packZip(output);
      clearPreparedZip();
      preparedZipUrl=URL.createObjectURL(zip);
      var name="textmask-bo-anh-"+new Date().toISOString().slice(0,10)+".zip";
      zipLinks.forEach(function (link) {
        if (!link) return;
        link.href=preparedZipUrl;
        link.download=name;
        link.hidden=false;
        link.textContent="↓ Tải ZIP vừa tạo ("+output.length+" ảnh)";
      });
      notify("ZIP đã sẵn sàng. Chạm “Tải ZIP vừa tạo” để lưu vào Tệp trên iPhone.");
    } catch(error) {
      notify("Xuất ảnh thất bại: "+(error&&error.message?error.message:"Hãy thử ít ảnh hơn."));
    } finally {busy=false;output=[];updateQueue();}
  }

  photoInput.addEventListener("change",function(event){
    var files=Array.prototype.slice.call(event.target.files||[]);
    event.target.value="";
    addPhotos(files);
  });
  exportBtn.addEventListener("click",downloadAll);
  batchApply.addEventListener("click",applyAll);
  if (desktopApply) desktopApply.addEventListener("click",applyAll);
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
  // Keep the batch summary current when the watermark editor changes.
  document.addEventListener("input",function(event){
    if(event.target&&event.target.closest("#editorPanel")) {
      var summary=document.getElementById("batchSettingsSummary");
      if(summary)summary.textContent="“"+(document.getElementById("textInput").value.trim()||"Watermark")+"” · "+
        document.getElementById("styleName").textContent+" · "+document.getElementById("gapVal").textContent;
    }
  });
  document.addEventListener("click",function(event){
    if(event.target&&event.target.closest("#styleGrid, #presetGrid, #fontChips, #effectChips")) {
      var summary=document.getElementById("batchSettingsSummary");
      if(summary)summary.textContent="“"+(document.getElementById("textInput").value.trim()||"Watermark")+"” · "+
        document.getElementById("styleName").textContent+" · "+document.getElementById("gapVal").textContent;
    }
  });
  window.addEventListener("pagehide",function(event){
    if (event.persisted) return;
    queue.forEach(function(item){if(item.url)URL.revokeObjectURL(item.url);});
    clearPreparedZip();
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