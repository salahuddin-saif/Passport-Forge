// script.js – updated for multiple photos with individual copy counts
(function() {
    // ---- DOM refs ----
    const skeletonWrapper = document.getElementById('skeletonWrapper');
    const app = document.getElementById('app');
    const fileInput = document.getElementById('fileInput');
    const dropzone = document.getElementById('dropzone');
    const uploadPreview = document.getElementById('uploadPreview');
    const photoList = document.getElementById('photoList');
    const imgWidthInput = document.getElementById('imgWidth');
    const imgHeightInput = document.getElementById('imgHeight');
    const presetSelect = document.getElementById('presetSelect');
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
    let photos = []; // array of { id, src, name, copies, originalImage }
    let previewItems = [];
    let darkMode = false;
    let lastGeneratedCanvas = null;
    let nextPhotoId = 0;

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

    // Build a flat list of images based on photos and their copies
    function buildImageQueue() {
        const queue = [];
        photos.forEach(photo => {
            for (let i = 0; i < photo.copies; i++) {
                queue.push(photo);
            }
        });
        return queue;
    }

    function generatePreview() {
        const queue = buildImageQueue();
        if (queue.length === 0) {
            clearPreviewImages();
            return;
        }
        const w = parseFloat(imgWidthInput.value) || 170.8;
        const h = parseFloat(imgHeightInput.value) || 208;
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
            rows = Math.min(Math.ceil(queue.length / cols), rowsFit);
        } else {
            cols = Math.floor((printable.w + spacing) / (itemW + spacing));
            rows = Math.floor((printable.h + spacing) / (itemH + spacing));
        }

        const maxCols = Math.floor((printable.w + spacing) / (itemW + spacing));
        const maxRows = Math.floor((printable.h + spacing) / (itemH + spacing));
        cols = Math.min(cols, maxCols);
        rows = Math.min(rows, maxRows);

        const maxFit = cols * rows;
        const totalToShow = Math.min(queue.length, maxFit, 60);

        clearPreviewImages();

        for (let i = 0; i < totalToShow; i++) {
            const photo = queue[i];
            const img = document.createElement('img');
            img.src = photo.src;
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
        const queue = buildImageQueue();
        if (queue.length === 0) return null;

        const w = parseFloat(imgWidthInput.value) || 170.8;
        const h = parseFloat(imgHeightInput.value) || 208;
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
            rows = Math.min(Math.ceil(queue.length / cols), rowsFit);
        } else {
            cols = Math.floor((printable.w + spacing) / (itemW + spacing));
            rows = Math.floor((printable.h + spacing) / (itemH + spacing));
        }

        const maxCols = Math.floor((printable.w + spacing) / (itemW + spacing));
        const maxRows = Math.floor((printable.h + spacing) / (itemH + spacing));
        cols = Math.min(cols, maxCols);
        rows = Math.min(rows, maxRows);
        const total = Math.min(queue.length, cols * rows, 60);

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

        // We need to draw each image from the queue. Since images may not all be loaded yet,
        // we use the originalImage stored on each photo.
        // To keep it simple and synchronous, we'll use the preloaded originalImage.
        let count = 0;
        for (let r = 0; r < rows && count < total; r++) {
            for (let c = 0; c < cols && count < total; c++) {
                const photo = queue[count];
                const img = photo.originalImage;
                if (!img) { count++; continue; }

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

    // ---- photo list management ----
    function renderPhotoList() {
        photoList.innerHTML = '';
        if (photos.length === 0) return;

        photos.forEach((photo) => {
            const item = document.createElement('div');
            item.className = 'photo-item';
            item.dataset.id = photo.id;

            const img = document.createElement('img');
            img.src = photo.src;
            img.alt = photo.name;

            const info = document.createElement('div');
            info.className = 'photo-info';

            const name = document.createElement('div');
            name.className = 'photo-name';
            name.textContent = photo.name;
            name.title = photo.name;

            const copyRow = document.createElement('div');
            copyRow.className = 'photo-copy-row';

            const copyLabel = document.createElement('label');
            copyLabel.innerHTML = '<i class="fas fa-copy"></i> Copies';

            const copyInput = document.createElement('input');
            copyInput.type = 'number';
            copyInput.min = '1';
            copyInput.max = '60';
            copyInput.value = photo.copies;
            copyInput.addEventListener('input', function() {
                let val = parseInt(this.value, 10);
                if (isNaN(val) || val < 1) val = 1;
                if (val > 60) val = 60;
                photo.copies = val;
                this.value = val;
                // Auto regenerate preview on copy change
                generatePreview();
            });

            copyRow.appendChild(copyLabel);
            copyRow.appendChild(copyInput);
            info.appendChild(name);
            info.appendChild(copyRow);

            const removeBtn = document.createElement('button');
            removeBtn.className = 'remove-photo';
            removeBtn.innerHTML = '<i class="fas fa-times"></i>';
            removeBtn.title = 'Remove photo';
            removeBtn.addEventListener('click', function() {
                photos = photos.filter(p => p.id !== photo.id);
                renderPhotoList();
                generatePreview();
                if (photos.length === 0) {
                    clearPreviewImages();
                }
            });

            item.appendChild(img);
            item.appendChild(info);
            item.appendChild(removeBtn);
            photoList.appendChild(item);
        });
    }

    function loadImageFiles(files) {
        if (!files || files.length === 0) return;

        Array.from(files).forEach(file => {
            if (!file.type.startsWith('image/')) return;
            const reader = new FileReader();
            reader.onload = (e) => {
                const dataUrl = e.target.result;
                const photo = {
                    id: nextPhotoId++,
                    src: dataUrl,
                    name: file.name,
                    copies: 1, // default copies per photo
                    originalImage: null
                };

                // Preload image for high quality canvas
                const img = new Image();
                img.onload = function() {
                    photo.originalImage = img;
                };
                img.src = dataUrl;

                photos.push(photo);
                renderPhotoList();
                generatePreview();
            };
            reader.readAsDataURL(file);
        });
    }

    // ---- events ----
    dropzone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
        if (fileInput.files.length) {
            loadImageFiles(fileInput.files);
            // reset input so same files can be re-selected if needed
            fileInput.value = '';
        }
    });
    dropzone.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.style.borderColor = 'var(--btn-primary-bg)'; });
    dropzone.addEventListener('dragleave', () => { dropzone.style.borderColor = 'var(--border-zone)'; });
    dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.style.borderColor = 'var(--border-zone)';
        if (e.dataTransfer.files.length) {
            loadImageFiles(e.dataTransfer.files);
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
        if (photos.length > 0) {
            generatePreview(); 
        } else {
            alert('Upload at least one image first.');
        }
    });
    
    // Preview button - shows modal with high quality preview
    previewBtn.addEventListener('click', () => { 
        if (photos.length === 0) {
            alert('Upload at least one image first.');
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
        if (photos.length === 0) { alert('Upload at least one image first.'); return; }
        
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
