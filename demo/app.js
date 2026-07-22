(function () {
  "use strict";

  // ================================================================
  // CONFIG
  // ================================================================
  var API_BASE        = "https://intelligent-media-processing-api.onrender.com";
  var POLL_INTERVAL   = 2000;
  var LS_KEY          = "impp_history";   // localStorage key
  var THUMB_MAX_PX    = 200;              // max dimension when storing thumbnail
  var HISTORY_LIMIT   = 50;              // max entries kept in localStorage

  // ================================================================
  // STATE
  // ================================================================
  var selectedFile        = null;
  var pollTimerId         = null;
  var currentProcessingId = null;
  var activeHistoryId     = null;   // which tile is currently "active"
  var pollErrorCount      = 0;      // consecutive poll errors before giving up
  var POLL_MAX_ERRORS     = 3;

  // ================================================================
  // DOM REFERENCES
  // ================================================================
  var dropzone          = document.getElementById("dropzone");
  var fileInput         = document.getElementById("fileInput");
  var fileInfo          = document.getElementById("fileInfo");
  var fileNameEl        = document.getElementById("fileName");
  var chooseAnotherBtn  = document.getElementById("chooseAnotherBtn");
  var previewWrap       = document.getElementById("previewWrap");
  var previewImg        = document.getElementById("previewImg");
  var uploadBtn         = document.getElementById("uploadBtn");

  var processingSection = document.getElementById("processingSection");
  var processingIdText  = document.getElementById("processingIdText");
  var copyIdBtn         = document.getElementById("copyIdBtn");
  var statusBadgeWrap   = document.getElementById("statusBadgeWrap");

  var resultsSection    = document.getElementById("resultsSection");
  var metadataBody      = document.getElementById("metadataBody");
  var blurBody          = document.getElementById("blurBody");
  var brightnessBody    = document.getElementById("brightnessBody");
  var ocrBody           = document.getElementById("ocrBody");
  var plateBody         = document.getElementById("plateBody");

  var toastContainer    = document.getElementById("toast-container");

  var queueGrid         = document.getElementById("queueGrid");
  var queueEmpty        = document.getElementById("queueEmpty");
  var queueCount        = document.getElementById("queueCount");
  var clearBtn          = document.getElementById("queueClearBtn");

  // ================================================================
  // LOCAL STORAGE HELPERS
  // ================================================================
  function loadHistory() {
    try {
      var raw = localStorage.getItem(LS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function saveHistory(history) {
    try {
      // Keep newest HISTORY_LIMIT entries to avoid quota errors
      var trimmed = history.slice(-HISTORY_LIMIT);
      localStorage.setItem(LS_KEY, JSON.stringify(trimmed));
    } catch (e) {
      // localStorage quota exceeded — remove oldest entry and retry once
      try {
        var shorter = history.slice(-Math.floor(HISTORY_LIMIT / 2));
        localStorage.setItem(LS_KEY, JSON.stringify(shorter));
      } catch (e2) { /* silent */ }
    }
  }

  function upsertEntry(patch) {
    var history = loadHistory();
    var idx = history.findIndex(function (h) { return h.id === patch.id; });
    if (idx === -1) {
      history.push(patch);
    } else {
      history[idx] = Object.assign({}, history[idx], patch);
    }
    saveHistory(history);
  }

  function getEntry(id) {
    return loadHistory().find(function (h) { return h.id === id; }) || null;
  }

  // ================================================================
  // THUMBNAIL GENERATOR
  // ================================================================
  function makeThumbnail(dataUrl, callback) {
    var img = new Image();
    img.onload = function () {
      var w = img.width;
      var h = img.height;
      var scale = Math.min(1, THUMB_MAX_PX / Math.max(w, h));
      var canvas = document.createElement("canvas");
      canvas.width  = Math.round(w * scale);
      canvas.height = Math.round(h * scale);
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      callback(canvas.toDataURL("image/jpeg", 0.72));
    };
    img.onerror = function () { callback(dataUrl); }; // fallback: use original
    img.src = dataUrl;
  }

  // ================================================================
  // TOAST
  // ================================================================
  function showToast(message, type) {
    type = type || "info";
    var toast = document.createElement("div");
    toast.className = "toast " + type;
    toast.textContent = message;
    toastContainer.appendChild(toast);
    setTimeout(function () {
      toast.classList.add("fade-out");
      setTimeout(function () { toast.remove(); }, 300);
    }, 3500);
  }

  // ================================================================
  // FILE SELECTION
  // ================================================================
  function handleFileSelect(file) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast("Please select a valid image file.", "error");
      return;
    }
    selectedFile = file;
    fileNameEl.textContent = file.name;
    fileInfo.classList.remove("hidden");
    uploadBtn.disabled = false;

    var reader = new FileReader();
    reader.onload = function (e) {
      previewImg.src = e.target.result;
      previewWrap.classList.remove("hidden");
    };
    reader.readAsDataURL(file);
  }

  dropzone.addEventListener("click", function () { fileInput.click(); });

  fileInput.addEventListener("change", function (e) {
    handleFileSelect(e.target.files[0]);
  });

  ["dragenter", "dragover"].forEach(function (evt) {
    dropzone.addEventListener(evt, function (e) {
      e.preventDefault(); e.stopPropagation();
      dropzone.classList.add("dragover");
    });
  });
  ["dragleave", "drop"].forEach(function (evt) {
    dropzone.addEventListener(evt, function (e) {
      e.preventDefault(); e.stopPropagation();
      dropzone.classList.remove("dragover");
    });
  });
  dropzone.addEventListener("drop", function (e) {
    handleFileSelect(e.dataTransfer.files[0]);
  });

  chooseAnotherBtn.addEventListener("click", function (e) {
    e.stopPropagation();
    fileInput.value = "";
    selectedFile = null;
    fileInfo.classList.add("hidden");
    previewWrap.classList.add("hidden");
    uploadBtn.disabled = true;
  });

  // ================================================================
  // API — UPLOAD
  // ================================================================
  async function uploadImage() {
    if (!selectedFile) return;

    // Snapshot the preview data-URL NOW (before async gap)
    var fullDataUrl = previewImg.src;
    var fileName    = selectedFile.name;

    // Create a history entry immediately so the tile appears right away
    var histId = "impp-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6);
    activeHistoryId = histId;

    makeThumbnail(fullDataUrl, function (thumb) {
      upsertEntry({ id: histId, processingId: null, name: fileName, thumb: thumb, status: "pending", ts: Date.now(), analysis: null });
      renderQueue();
    });

    uploadBtn.disabled = true;
    uploadBtn.innerHTML = "&#8679; Uploading&hellip;";

    try {
      var formData = new FormData();
      formData.append("image", selectedFile);

      var response = await fetch(API_BASE + "/api/v1/media/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Upload failed with status " + response.status);

      var data = await response.json();
      if (!data.success) throw new Error(data.message || "Upload failed");

      showToast(data.message || "Image uploaded successfully", "success");
      currentProcessingId = data.data.processingId;

      // Persist the processingId into the history entry
      upsertEntry({ id: histId, processingId: currentProcessingId, status: "processing" });
      renderQueue();

      resetResultsUI();
      processingSection.classList.remove("hidden");
      resultsSection.classList.add("hidden");
      processingIdText.textContent = currentProcessingId;
      updateStatus("pending");

      startPolling(currentProcessingId, histId);
    } catch (err) {
      upsertEntry({ id: histId, status: "failed" });
      renderQueue();
      showToast(err instanceof TypeError ? "Network error. Check your connection." : (err.message || "Upload failed"), "error");
    } finally {
      uploadBtn.disabled = false;
      uploadBtn.innerHTML = "&#8679; Upload &amp; Analyze";
      // Clear selected file so button stays disabled until a new file is picked
      selectedFile = null;
      fileInput.value = "";
      fileInfo.classList.add("hidden");
      previewWrap.classList.add("hidden");
      uploadBtn.disabled = true;
    }
  }

  // ================================================================
  // API — POLL
  // ================================================================
  function startPolling(processingId, histId) {
    stopPolling();
    pollErrorCount = 0;
    pollTimerId = setInterval(function () { pollStatus(processingId, histId); }, POLL_INTERVAL);
    pollStatus(processingId, histId);
  }

  function stopPolling() {
    if (pollTimerId) { clearInterval(pollTimerId); pollTimerId = null; }
  }

  async function pollStatus(processingId, histId) {
    try {
      var response = await fetch(API_BASE + "/api/v1/media/" + processingId);
      if (!response.ok) throw new Error("Status check failed: " + response.status);

      var payload = await response.json();
      if (!payload.success) throw new Error("Unsuccessful status response");

      var data = payload.data;
      pollErrorCount = 0;   // reset on any successful response
      updateStatus(data.status);

      if (data.status === "completed") {
        stopPolling();

        // Save full analysis to localStorage
        upsertEntry({ id: histId, status: "completed", analysis: data.analysis || null });
        renderQueue();

        renderResults(data);
        showToast("Processing completed", "success");

      } else if (data.status === "failed") {
        stopPolling();
        upsertEntry({ id: histId, status: "failed" });
        renderQueue();
        showToast("Processing failed: " + (data.failure ? data.failure.reason || data.failure : "unknown error"), "error");

      } else if (data.status === "processing") {
        upsertEntry({ id: histId, status: "processing" });
        renderQueue();
      }
    } catch (err) {
      pollErrorCount += 1;
      if (pollErrorCount >= POLL_MAX_ERRORS) {
        stopPolling();
        upsertEntry({ id: histId, status: "failed" });
        renderQueue();
        showToast("Lost connection while polling. Try refreshing.", "error");
      }
      // else: silently retry on next interval tick
    }
  }

  // ================================================================
  // STATUS BADGE
  // ================================================================
  function updateStatus(status) {
    var map = {
      pending:    { cls: "badge-pending",    label: "Pending",    spin: true },
      processing: { cls: "badge-processing", label: "Processing", spin: true },
      completed:  { cls: "badge-completed",  label: "Completed",  spin: false },
      failed:     { cls: "badge-failed",     label: "Failed",     spin: false },
    };
    var cfg = map[status] || map.pending;

    statusBadgeWrap.innerHTML = "";
    var badge = document.createElement("span");
    badge.className = "badge " + cfg.cls + (cfg.spin ? " pulse" : "");

    if (cfg.spin) {
      var spinner = document.createElement("span");
      spinner.className = "spinner";
      badge.appendChild(spinner);
    }
    var txt = document.createElement("span");
    txt.textContent = cfg.label;
    badge.appendChild(txt);
    statusBadgeWrap.appendChild(badge);
  }

  // ================================================================
  // RENDER — RESULTS
  // Called both by live polling AND by clicking a history tile
  // ================================================================
  function renderResults(data) {
    resultsSection.classList.remove("hidden");
    var analysis = data.analysis || {};
    renderMetadata(analysis.metadata);
    renderBlur(analysis.blur);
    renderBrightness(analysis.brightness);
    renderOCR(analysis.ocr);
    renderPlate(analysis.plateValidation);
  }

  function kvRow(key, value) {
    return (
      '<div class="kv"><span class="k">' + escapeHtml(key) +
      '</span><span class="v">' + escapeHtml(String(value)) + "</span></div>"
    );
  }

  function renderMetadata(metadata) {
    if (!metadata) { metadataBody.innerHTML = '<p style="color:var(--muted);font-size:13px;">No metadata available.</p>'; return; }
    metadataBody.innerHTML =
      kvRow("Width",    metadata.width    + " px") +
      kvRow("Height",   metadata.height   + " px") +
      kvRow("Format",   metadata.format)           +
      kvRow("Channels", metadata.channels)         +
      kvRow("Density",  metadata.density  + " dpi");
  }

  function renderBlur(blur) {
    if (!blur) { blurBody.innerHTML = '<p style="color:var(--muted);font-size:13px;">No blur data available.</p>'; return; }
    blurBody.innerHTML =
      kvRow("Score", blur.score) +
      '<div style="margin-top:10px;"><span class="badge ' +
      (blur.isBlurry ? "badge-failed" : "badge-completed") + '">' +
      (blur.isBlurry ? "Blurry" : "Sharp") + "</span></div>";
  }

  function renderBrightness(brightness) {
    if (!brightness) { brightnessBody.innerHTML = '<p style="color:var(--muted);font-size:13px;">No brightness data available.</p>'; return; }
    brightnessBody.innerHTML = kvRow("Average", brightness.average) + kvRow("Quality", brightness.quality);
  }

  function renderOCR(ocr) {
    if (!ocr) { ocrBody.innerHTML = '<p style="color:var(--muted);font-size:13px;">No OCR data available.</p>'; return; }
    ocrBody.innerHTML =
      '<div class="ocr-box">' + escapeHtml(ocr.text || "") + "</div>" +
      '<div class="ocr-footer"><span>Confidence: ' + ocr.confidence +
      '%</span><button class="btn btn-ghost btn-sm" id="copyOcrBtn">Copy text</button></div>';
    var btn = document.getElementById("copyOcrBtn");
    if (btn) btn.addEventListener("click", function () { copyToClipboard(ocr.text || "", "OCR text copied"); });
  }

  function renderPlate(plateValidation) {
    if (!plateValidation) { plateBody.innerHTML = '<p style="color:var(--muted);font-size:13px;">No plate data available.</p>'; return; }
    plateBody.innerHTML =
      kvRow("Detected plate", plateValidation.detectedPlate || "N/A") +
      '<div class="big-badge ' + (plateValidation.isValid ? "valid" : "invalid") + '">' +
      (plateValidation.isValid ? "Valid" : "Invalid") + "</div>";
  }

  function resetResultsUI() {
    metadataBody.innerHTML = "";
    blurBody.innerHTML     = "";
    brightnessBody.innerHTML = "";
    ocrBody.innerHTML      = "";
    plateBody.innerHTML    = "";
  }

  // ================================================================
  // RENDER — SESSION QUEUE (reads from localStorage every time)
  // ================================================================
  function sealGlyph(status) {
    return status === "completed" ? "&#10003;" :
           status === "failed"    ? "&#10005;" :
           status === "processing"? "&#8987;"  : "&#8226;";
  }

  function fmtTime(ts) {
    return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  function renderQueue() {
    var history = loadHistory();
    var n = history.length;

    queueCount.textContent = n === 0
      ? "No history yet"
      : n + (n === 1 ? " upload" : " uploads") + " in history";

    if (!n) {
      queueEmpty.classList.remove("hidden");
      queueGrid.classList.add("hidden");
      return;
    }

    queueEmpty.classList.add("hidden");
    queueGrid.classList.remove("hidden");

    queueGrid.innerHTML = history
      .slice()
      .reverse()
      .map(function (item) {
        var isActive = item.id === activeHistoryId;
        var hasResult = item.status === "completed" && item.analysis;
        return (
          '<div class="q-plate' + (isActive ? " active" : "") +
          (hasResult ? " has-result" : "") + '" ' +
          'data-id="' + escapeAttr(item.id) + '" ' +
          'title="' + escapeAttr(item.name) + ' — ' + item.status + (hasResult ? " (click to view)" : "") + '" ' +
          'role="button" tabindex="0" aria-label="' + escapeAttr(item.name) + ', ' + item.status + '">' +
            '<div class="q-thumb">' +
              '<img src="' + item.thumb + '" alt="' + escapeAttr(item.name) + '" loading="lazy" />' +
              '<span class="q-seal ' + item.status + '" aria-hidden="true">' + sealGlyph(item.status) + '</span>' +
            '</div>' +
            '<div class="q-name">' + escapeHtml(truncate(item.name, 16)) + '</div>' +
            '<div class="q-time">' + fmtTime(item.ts) + '</div>' +
          '</div>'
        );
      })
      .join("");
  }

  function truncate(str, max) {
    var s = str == null ? "" : String(str);
    return s.length > max ? s.slice(0, max - 1) + "\u2026" : s;
  }

  function escapeAttr(str) {
    return String(str == null ? "" : str).replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  // ================================================================
  // QUEUE INTERACTIONS
  // ================================================================
  queueGrid.addEventListener("click", function (e) {
    var plate = e.target.closest(".q-plate");
    if (!plate) return;
    var id = plate.dataset.id;
    var entry = getEntry(id);
    if (!entry) return;

    activeHistoryId = id;
    renderQueue();

    if (entry.status === "completed" && entry.analysis) {
      // Load saved results — no API call needed
      stopPolling();
      processingSection.classList.remove("hidden");
      processingIdText.textContent = entry.processingId || entry.id;
      updateStatus("completed");
      resetResultsUI();
      renderResults({ analysis: entry.analysis });
      resultsSection.scrollIntoView({ behavior: "smooth", block: "start" });
      showToast("Loaded saved results for " + entry.name, "info");

    } else if (entry.status === "failed") {
      processingSection.classList.remove("hidden");
      processingIdText.textContent = entry.processingId || entry.id;
      updateStatus("failed");
      resultsSection.classList.add("hidden");
      processingSection.scrollIntoView({ behavior: "smooth", block: "start" });

    } else {
      // pending/processing — scroll to the live status
      var target = resultsSection.classList.contains("hidden") ? processingSection : resultsSection;
      if (target && !target.classList.contains("hidden")) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  });

  queueGrid.addEventListener("keydown", function (e) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      var plate = e.target.closest(".q-plate");
      if (plate) plate.click();
    }
  });

  clearBtn.addEventListener("click", function () {
    if (!confirm("Clear all upload history? This cannot be undone.")) return;
    localStorage.removeItem(LS_KEY);
    activeHistoryId = null;
    renderQueue();
    processingSection.classList.add("hidden");
    resultsSection.classList.add("hidden");
    showToast("History cleared", "info");
  });

  // ================================================================
  // UTILITIES
  // ================================================================
  function escapeHtml(str) {
    var div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  async function copyToClipboard(text, msg) {
    try {
      await navigator.clipboard.writeText(text);
      showToast(msg, "success");
    } catch (e) {
      showToast("Failed to copy to clipboard", "error");
    }
  }

  // ================================================================
  // EVENT BINDINGS
  // ================================================================
  uploadBtn.addEventListener("click", uploadImage);

  copyIdBtn.addEventListener("click", function () {
    if (currentProcessingId) copyToClipboard(currentProcessingId, "Processing ID copied");
  });

  // ================================================================
  // INIT — render queue from localStorage on page load
  // ================================================================
  renderQueue();

})();
