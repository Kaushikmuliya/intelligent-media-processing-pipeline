(function () {
  "use strict";

  // =====================================================
  // CONFIG
  // =====================================================
  const API_BASE = "https://intelligent-media-processing-api.onrender.com";
  const POLL_INTERVAL_MS = 2000;

  // =====================================================
  // STATE
  // =====================================================
  let selectedFile = null;
  let pollTimerId = null;
  let currentProcessingId = null;

  // =====================================================
  // DOM REFERENCES
  // =====================================================
  const dropzone = document.getElementById("dropzone");
  const fileInput = document.getElementById("fileInput");
  const fileInfo = document.getElementById("fileInfo");
  const fileNameEl = document.getElementById("fileName");
  const chooseAnotherBtn = document.getElementById("chooseAnotherBtn");
  const previewWrap = document.getElementById("previewWrap");
  const previewImg = document.getElementById("previewImg");
  const uploadBtn = document.getElementById("uploadBtn");

  const processingSection = document.getElementById("processingSection");
  const processingIdText = document.getElementById("processingIdText");
  const copyIdBtn = document.getElementById("copyIdBtn");
  const statusBadgeWrap = document.getElementById("statusBadgeWrap");

  const resultsSection = document.getElementById("resultsSection");
  const metadataBody = document.getElementById("metadataBody");
  const blurBody = document.getElementById("blurBody");
  const brightnessBody = document.getElementById("brightnessBody");
  const ocrBody = document.getElementById("ocrBody");
  const plateBody = document.getElementById("plateBody");

  const toastContainer = document.getElementById("toast-container");

  // =====================================================
  // TOAST NOTIFICATIONS
  // =====================================================
  function showToast(message, type) {
    type = type || "info";
    const toast = document.createElement("div");
    toast.className = "toast " + type;
    toast.textContent = message;
    toastContainer.appendChild(toast);

    setTimeout(function () {
      toast.classList.add("fade-out");
      setTimeout(function () {
        toast.remove();
      }, 300);
    }, 3500);
  }

  // =====================================================
  // FILE SELECTION HANDLING
  // =====================================================
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

    const reader = new FileReader();
    reader.onload = function (e) {
      previewImg.src = e.target.result;
      previewWrap.classList.remove("hidden");
    };
    reader.readAsDataURL(file);
  }

  // Click on dropzone opens the hidden file input
  dropzone.addEventListener("click", function () {
    fileInput.click();
  });

  // fileInput is outside the dropzone so its change event won't bubble into dropzone
  fileInput.addEventListener("change", function (e) {
    handleFileSelect(e.target.files[0]);
  });

  ["dragenter", "dragover"].forEach(function (evt) {
    dropzone.addEventListener(evt, function (e) {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.add("dragover");
    });
  });

  ["dragleave", "drop"].forEach(function (evt) {
    dropzone.addEventListener(evt, function (e) {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.remove("dragover");
    });
  });

  dropzone.addEventListener("drop", function (e) {
    const file = e.dataTransfer.files[0];
    handleFileSelect(file);
  });

  chooseAnotherBtn.addEventListener("click", function (e) {
    e.stopPropagation();
    fileInput.value = "";
    selectedFile = null;
    fileInfo.classList.add("hidden");
    previewWrap.classList.add("hidden");
    uploadBtn.disabled = true;
  });

  // =====================================================
  // API: UPLOAD IMAGE
  // =====================================================
  async function uploadImage() {
    if (!selectedFile) return;

    uploadBtn.disabled = true;
    uploadBtn.textContent = "Uploading...";

    try {
      const formData = new FormData();
      formData.append("image", selectedFile);

      const response = await fetch(API_BASE + "/api/v1/media/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed with status " + response.status);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Upload failed");
      }

      showToast(data.message || "Image uploaded successfully", "success");
      currentProcessingId = data.data.processingId;

      resetResultsUI();
      processingSection.classList.remove("hidden");
      resultsSection.classList.add("hidden");
      processingIdText.textContent = currentProcessingId;
      updateStatus("pending");

      startPolling(currentProcessingId);
    } catch (err) {
      if (err instanceof TypeError) {
        showToast("Network error. Please check your connection.", "error");
      } else {
        showToast(err.message || "Upload failed", "error");
      }
    } finally {
      uploadBtn.disabled = false;
      uploadBtn.textContent = "Upload & Analyze";
    }
  }

  // =====================================================
  // API: POLL STATUS
  // =====================================================
  function startPolling(processingId) {
    stopPolling();

    pollTimerId = setInterval(function () {
      pollStatus(processingId);
    }, POLL_INTERVAL_MS);

    // Run immediately as well
    pollStatus(processingId);
  }

  function stopPolling() {
    if (pollTimerId) {
      clearInterval(pollTimerId);
      pollTimerId = null;
    }
  }

  async function pollStatus(processingId) {
    try {
      const response = await fetch(API_BASE + "api/v1/media/" + processingId);

      if (!response.ok) {
        throw new Error("Status check failed with status " + response.status);
      }

      const payload = await response.json();

      if (!payload.success) {
        throw new Error("Status check returned unsuccessful response");
      }

      const data = payload.data;
      updateStatus(data.status);

      if (data.status === "completed") {
        stopPolling();
        renderResults(data);
        showToast("Processing completed", "success");
      } else if (data.status === "failed") {
        stopPolling();
        showToast(
          "Processing failed: " + (data.failure || "unknown error"),
          "error",
        );
      }
    } catch (err) {
      stopPolling();
      showToast("Network error while polling status.", "error");
    }
  }

  // =====================================================
  // STATUS BADGE
  // =====================================================
  function updateStatus(status) {
    let badgeClass = "badge-pending";
    let label = "Pending";
    let showSpinner = false;

    switch (status) {
      case "pending":
        badgeClass = "badge-pending";
        label = "Pending";
        showSpinner = true;
        break;
      case "processing":
        badgeClass = "badge-processing";
        label = "Processing";
        showSpinner = true;
        break;
      case "completed":
        badgeClass = "badge-completed";
        label = "Completed";
        break;
      case "failed":
        badgeClass = "badge-failed";
        label = "Failed";
        break;
    }

    statusBadgeWrap.innerHTML = "";

    const badge = document.createElement("span");
    badge.className = "badge " + badgeClass;

    if (showSpinner) {
      const spinner = document.createElement("span");
      spinner.className = "spinner";
      badge.appendChild(spinner);
    }

    const text = document.createElement("span");
    text.textContent = label;
    badge.appendChild(text);

    if (showSpinner) {
      badge.classList.add("pulse");
    }

    statusBadgeWrap.appendChild(badge);
  }

  // =====================================================
  // RENDER FUNCTIONS
  // =====================================================
  function renderResults(data) {
    resultsSection.classList.remove("hidden");
    const analysis = data.analysis || {};
    renderMetadata(analysis.metadata);
    renderBlur(analysis.blur);
    renderBrightness(analysis.brightness);
    renderOCR(analysis.ocr);
    renderPlate(analysis.plateValidation);
  }

  function kvRow(key, value) {
    return (
      '<div class="kv"><span class="k">' +
      escapeHtml(key) +
      '</span><span class="v">' +
      escapeHtml(String(value)) +
      "</span></div>"
    );
  }

  function renderMetadata(metadata) {
    if (!metadata) {
      metadataBody.innerHTML =
        '<p style="color:var(--text-muted);font-size:13px;">No metadata available.</p>';
      return;
    }
    let html = "";
    html += kvRow("Width", metadata.width + " px");
    html += kvRow("Height", metadata.height + " px");
    html += kvRow("Format", metadata.format);
    html += kvRow("Channels", metadata.channels);
    html += kvRow("Density", metadata.density + " dpi");
    metadataBody.innerHTML = html;
  }

  function renderBlur(blur) {
    if (!blur) {
      blurBody.innerHTML =
        '<p style="color:var(--text-muted);font-size:13px;">No blur data available.</p>';
      return;
    }
    const badgeClass = blur.isBlurry ? "badge-failed" : "badge-completed";
    const badgeLabel = blur.isBlurry ? "Blurry" : "Sharp";

    let html = "";
    html += kvRow("Score", blur.score);
    html +=
      '<div style="margin-top:10px;"><span class="badge ' +
      badgeClass +
      '">' +
      badgeLabel +
      "</span></div>";
    blurBody.innerHTML = html;
  }

  function renderBrightness(brightness) {
    if (!brightness) {
      brightnessBody.innerHTML =
        '<p style="color:var(--text-muted);font-size:13px;">No brightness data available.</p>';
      return;
    }
    let html = "";
    html += kvRow("Average", brightness.average);
    html += kvRow("Quality", brightness.quality);
    brightnessBody.innerHTML = html;
  }

  function renderOCR(ocr) {
    if (!ocr) {
      ocrBody.innerHTML =
        '<p style="color:var(--text-muted);font-size:13px;">No OCR data available.</p>';
      return;
    }

    const safeText = escapeHtml(ocr.text || "");
    let html = "";
    html += '<div class="ocr-box" id="ocrTextBox">' + safeText + "</div>";
    html +=
      '<div class="ocr-footer"><span>Confidence: ' +
      ocr.confidence +
      '%</span><button class="btn btn-secondary btn-sm" id="copyOcrBtn">Copy text</button></div>';

    ocrBody.innerHTML = html;

    const copyOcrBtn = document.getElementById("copyOcrBtn");
    if (copyOcrBtn) {
      copyOcrBtn.addEventListener("click", function () {
        copyToClipboard(ocr.text || "", "OCR text copied to clipboard");
      });
    }
  }

  function renderPlate(plateValidation) {
    if (!plateValidation) {
      plateBody.innerHTML =
        '<p style="color:var(--text-muted);font-size:13px;">No plate data available.</p>';
      return;
    }

    let html = "";
    html += kvRow("Detected plate", plateValidation.detectedPlate || "N/A");

    const validClass = plateValidation.isValid ? "valid" : "invalid";
    const validLabel = plateValidation.isValid ? "Valid" : "Invalid";

    html +=
      '<div class="big-badge ' + validClass + '">' + validLabel + "</div>";
    plateBody.innerHTML = html;
  }

  function resetResultsUI() {
    metadataBody.innerHTML = "";
    blurBody.innerHTML = "";
    brightnessBody.innerHTML = "";
    ocrBody.innerHTML = "";
    plateBody.innerHTML = "";
  }

  // =====================================================
  // UTILITIES
  // =====================================================
  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  async function copyToClipboard(text, successMessage) {
    try {
      await navigator.clipboard.writeText(text);
      showToast(successMessage, "success");
    } catch (err) {
      showToast("Failed to copy to clipboard", "error");
    }
  }

  // =====================================================
  // EVENT BINDINGS
  // =====================================================
  uploadBtn.addEventListener("click", uploadImage);

  copyIdBtn.addEventListener("click", function () {
    if (currentProcessingId) {
      copyToClipboard(currentProcessingId, "Processing ID copied to clipboard");
    }
  });
})();
