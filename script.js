// script.js
(function() {
    // ---- DOM refs ----
    const skeletonWrapper = document.getElementById('skeletonWrapper');
    const app = document.getElementById('app');
    const fileInput = document.getElementById('fileInput');
    const dropzone = document.getElementById('dropzone');
    const uploadPreview = document.getElementById('uploadPreview');
    const imgWidthInput = document.getElementById('imgWidth');
    const imgHeightInput = document.getElementById('imgHeight');
    const presetSelect = document.getElementById('presetSelect');
    const copyCountInput = document.getElementById('copyCount');
    const borderSizeInput = document.getElementById('borderSize');
    const spacingInput = document.getElementById('spacing');
    const columnsInput = document.getElementById('columnsCount');
    const paperSelect = document.getElementById('paperSelect');
    const marginTop = document.getElementById('marginTop');
    const marginBottom = document.getElementById('marginBottom');
    const marginLeft = document.getElementById('marginLeft');
    const marginRight = document.getElementById('marginRight');
    const applyBtn = document.getElementById('applyBtn');
    const previewBtn = document.getElementById('previewBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const a4Preview = document.getElementById('a4Preview');
    const imageCountBadge = document.getElementById('imageCountBadge');
    const clearPreviewBtn = document.getElementById('clearPreviewBtn');
    const darkToggle = document.getElementById('darkToggle');
    const darkLabel = document.getElementById('darkLabel');
    
    // Modal elements
    const modal = document.getElementById('previewModal');
    const modalImage = document.getElementById('modalPreviewImage');
    const closeModal = document.getElementById('closeModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const downloadFromModal = document.getElementById('downloadFromModal');

    // ---- state ----
    let currentImageSrc = null;
    let previewItems = [];
    let darkMode = false;
    let originalImage = null;
    let lastGeneratedCanvas = null;

    // ---- skeleton: show for 1.2s then reveal app ----
    window.addEventListener('load', function() {
        setTimeout(() => {
            skeletonWrapper.classList.add('hidden');
            app.classList.add('visible');
        }, 1200);
    });

    // ---- dark mode ----
    darkToggle.addEventListener('click', () => {
        darkMode = !darkMode;
        document.body.classList.toggle('dark-mode', darkMode);
        darkLabel.innerText = darkMode ? 'Light' : 'Dark';
        darkToggle.innerHTML = darkMode ? '<i class="fas fa-sun"></i> <span id="darkLabel">Light</span>' : '<i class="fas fa-moon"></i> <span id="darkLabel">Dark</span>';
    });

    // ---- Modal controls ----
    function openModal(imageDataUrl) {
        modalImage.src = imageDataUrl;
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeModalFn() {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }

    closeModal.addEventListener('click', closeModalFn);
    closeModalBtn.addEventListener('click', closeModalFn);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModalFn();
    });

    // ---- helpers ----
    function clearPreviewImages() {
        previewItems.forEach(el => el.remove());
        previewItems = [];
        imageCountBadge.innerText = '0 images';
    }

    function getPaperSize() {
        const val = paperSelect.value.split(',');
        return { w: parseInt(val[0]), h: parseInt(val[1]) };
    }

    function getMargins() {
        return {
            top: parseFloat(marginTop.value) || 0,
            bottom: parseFloat(marginBottom.value) || 0,
            left: parseFloat(marginLeft.value) || 0,
            right: parseFloat(marginRight.value) || 0
        };
    }

    function getPrintableArea() {
        const paper = getPaperSize();
        const margins = getMargins();
        return {
            w: paper.w - margins.left - margins.right,
            h: paper.h - margins.top - margins.bottom,
            offsetX: margins.left,
            offsetY: margins.top
        };
    }

    function generatePreview() {
        if (!currentImageSrc) {
            clearPreviewImages();
            return;
        }
        const w = parseFloat(imgWidthInput.value) || 170.8;
        const h = parseFloat(imgHeightInput.value) || 208;
        const copies = parseInt(copyCountInput.value, 10) || 8;
        const border = parseFloat(borderSizeInput.value) || 0;
        const spacing = parseFloat(spacingInput.value) || 4;
        const columns = parseInt(columnsInput.value, 10) || 0;
        const printable = getPrintableArea();

        const itemW = w + border*2;
        const itemH = h + border*2;

        let cols, rows;
        if (columns > 0) {
            cols = columns;
            const rowsFit = Math.floor((printable.h + spacing) / (itemH + spacing));
            rows = Math.min(Math.ceil(copies / cols), rowsFit);
        } else {
            cols = Math.floor((printable.w + spacing) / (itemW + spacing));
            rows = Math.floor((printable.h + spacing) / (itemH + spacing));
        }

        const maxCols = Math.floor((printable.w + spacing) / (itemW + spacing));
        const maxRows = Math.floor((printable.h + spacing) / (itemH + spacing));
        cols = Math.min(cols, maxCols);
        rows = Math.min(rows, maxRows);

        const maxFit = cols * rows;
        const totalToShow = Math.min(copies, maxFit, 60);

        clearPreviewImages();

        for (let i = 0; i < totalToShow; i++) {
            const img = document.createElement('img');
            img.src = currentImageSrc;
            img.className = 'preview-img';
            img.style.width = w + 'px';
            img.style.height = h + 'px';
            img.style.border = `${border}px solid var(--preview-border)`;
            img.style.borderRadius = '6px';
            img.style.margin = `${spacing/2}px`;
            img.style.objectFit = 'cover';
            img.style.background = 'var(--preview-bg)';
            img.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
            img.style.imageRendering = 'auto';
            a4Preview.appendChild(img);
            previewItems.push(img);
        }
        imageCountBadge.innerText = totalToShow + ' images';
    }

    function generateHighQualityCanvas() {
        const w = parseFloat(imgWidthInput.value) || 170.8;
        const h = parseFloat(imgHeightInput.value) || 208;
        const copies = parseInt(copyCountInput.value, 10) || 8;
        const border = parseFloat(borderSizeInput.value) || 0;
        const spacing = parseFloat(spacingInput.value) || 4;
        const columns = parseInt(columnsInput.value, 10) || 0;
        const paper = getPaperSize();
        const margins = getMargins();
        const printable = getPrintableArea();

        const itemW = w + border*2;
        const itemH = h + border*2;

        let cols, rows;
        if (columns > 0) {
            cols = columns;
            const rowsFit = Math.floor((printable.h + spacing) / (itemH + spacing));
            rows = Math.min(Math.ceil(copies / cols), rowsFit);
        } else {
            cols = Math.floor((printable.w + spacing) / (itemW + spacing));
            rows = Math.floor((printable.h + spacing) / (itemH + spacing));
        }

        const maxCols = Math.floor((printable.w + spacing) / (itemW + spacing));
        const maxRows = Math.floor((printable.h + spacing) / (itemH + spacing));
        cols = Math.min(cols, maxCols);
        rows = Math.min(rows, maxRows);
        const total = Math.min(copies, cols * rows, 60);

        if (total === 0) return null;

        // Create canvas at high resolution (3x for quality)
        const scale = 3;
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(paper.w * scale);
        canvas.height = Math.round(paper.h * scale);
        const ctx = canvas.getContext('2d');
        
        // White background for entire page
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Scale all measurements
        const sW = w * scale;
        const sH = h * scale;
        const sBorder = border * scale;
        const sSpacing = spacing * scale;
        const sItemW = itemW * scale;
        const sItemH = itemH * scale;
        const offsetX = margins.left * scale;
        const offsetY = margins.top * scale;
        
        function drawImages(img) {
            let count = 0;
            for (let r = 0; r < rows && count < total; r++) {
                for (let c = 0; c < cols && count < total; c++) {
                    const x = offsetX + c * (sItemW + sSpacing) + sSpacing/2;
                    const y = offsetY + r * (sItemH + sSpacing) + sSpacing/2;
                    
                    // Draw border
                    if (sBorder > 0) {
                        ctx.fillStyle = '#1f4a6e';
                        ctx.fillRect(x, y, sItemW, sItemH);
                    }
                    
                    // Draw image with high quality
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';
                    ctx.drawImage(img, x + sBorder, y + sBorder, sW, sH);
                    count++;
                }
            }
            return canvas;
        }
        
        if (originalImage) {
            return drawImages(originalImage);
        } else {
            const tempImg = new Image();
            tempImg.crossOrigin = 'anonymous';
            tempImg.onload = function() {
                return drawImages(this);
            };
            tempImg.src = currentImageSrc;
            return drawImages(tempImg);
        }
    }

    function loadImageFile(file) {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            const dataUrl = e.target.result;
            currentImageSrc = dataUrl;
            uploadPreview.src = dataUrl;
            uploadPreview.style.display = 'block';
            
            const img = new Image();
            img.onload = function() {
                originalImage = img;
                generatePreview();
            };
            img.src = dataUrl;
        };
        reader.readAsDataURL(file);
    }

    // ---- events ----
    dropzone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
        if (fileInput.files.length) loadImageFile(fileInput.files[0]);
    });
    dropzone.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.style.borderColor = 'var(--btn-primary-bg)'; });
    dropzone.addEventListener('dragleave', () => { dropzone.style.borderColor = 'var(--border-zone)'; });
    dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.style.borderColor = 'var(--border-zone)';
        if (e.dataTransfer.files.length) {
            loadImageFile(e.dataTransfer.files[0]);
            fileInput.files = e.dataTransfer.files;
        }
    });

    presetSelect.addEventListener('change', function() {
        const val = this.value.split(',');
        if (val.length === 2) {
            imgWidthInput.value = val[0];
            imgHeightInput.value = val[1];
        }
    });

    // Apply button
    applyBtn.addEventListener('click', () => { 
        if (currentImageSrc) {
            generatePreview(); 
        } else {
            alert('Upload an image first.');
        }
    });
    
    // Preview button - shows modal with high quality preview
    previewBtn.addEventListener('click', () => { 
        if (!currentImageSrc) {
            alert('Upload an image first.');
            return;
        }
        
        const canvas = generateHighQualityCanvas();
        if (canvas) {
            const dataUrl = canvas.toDataURL('image/png');
            openModal(dataUrl);
            lastGeneratedCanvas = canvas;
        } else {
            alert('No images fit on this paper. Adjust settings.');
        }
    });

    clearPreviewBtn.addEventListener('click', () => {
        clearPreviewImages();
    });

    // Download from modal
    downloadFromModal.addEventListener('click', () => {
        if (lastGeneratedCanvas) {
            const link = document.createElement('a');
            link.download = 'passport_sheet.png';
            link.href = lastGeneratedCanvas.toDataURL('image/png');
            link.click();
        }
    });

    // Main download button
    downloadBtn.addEventListener('click', function() {
        if (!currentImageSrc) { alert('Upload an image first.'); return; }
        
        const canvas = generateHighQualityCanvas();
        if (canvas) {
            const link = document.createElement('a');
            link.download = 'passport_sheet.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
            lastGeneratedCanvas = canvas;
        } else {
            alert('No images fit on this paper. Adjust settings.');
        }
    });

    // Init
    presetSelect.dispatchEvent(new Event('change'));
})();
