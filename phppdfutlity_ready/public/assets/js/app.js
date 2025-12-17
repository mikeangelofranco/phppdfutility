const orbs = document.querySelectorAll('.orb');
const liftables = document.querySelectorAll('.card, .tile, .step, .stat');
const navLinks = document.querySelectorAll('.nav a');
const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('file-input');
const fileList = document.getElementById('file-list');
const browseBtn = document.querySelector('.browse-btn');
const toast = document.getElementById('toast');

const modal = document.getElementById('feature-modal');
const modalTitle = document.getElementById('modal-title');
const modalSummary = document.getElementById('modal-summary');
const modalFiles = document.getElementById('modal-files');
const modalInstructions = document.getElementById('modal-instructions');
const pageGrid = document.getElementById('page-grid');
const mergeApply = document.getElementById('merge-apply');
const modalLoading = document.getElementById('modal-loading');
const lockControls = document.getElementById('lock-controls');
const lockPassword = document.getElementById('lock-password');
const lockApply = document.getElementById('lock-apply');
const lockError = document.getElementById('lock-error');
const unlockControls = document.getElementById('unlock-controls');
const unlockPassword = document.getElementById('unlock-password');
const unlockApply = document.getElementById('unlock-apply');
const unlockError = document.getElementById('unlock-error');
const splitApply = document.getElementById('split-apply');
const convertApply = document.getElementById('convert-apply');
const convertImageApply = document.getElementById('convert-image-apply');
const redactApply = document.getElementById('redact-apply');
const redactControls = document.getElementById('redact-controls');
const redactSearch = document.getElementById('redact-search');
const redactList = document.getElementById('redact-list');
const redactError = document.getElementById('redact-error');
const apiAccess = document.getElementById('api-access');
const serviceReminder = document.getElementById('service-reminder');
const featureAlert = document.getElementById('feature-alert');
const modalClose = document.getElementById('modal-close');
const modalBackdrop = document.getElementById('modal-backdrop');
const featureCards = document.querySelectorAll('.feature-grid .card');

const pdfDocCache = new Map();
const invalidPdfMap = new Map();
let uploadedFiles = [];
let pageOrder = [];
let toastTimer;
let validationRun = 0;
let activePdfEntries = [];
let dragEnabled = true;
let redactTextItems = [];
const redactSelections = new Set();

const isPdf = (file) =>
    file && (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf'));
const isImage = (file) =>
    file && file.type?.startsWith('image/') && !file.name.toLowerCase().endsWith('.pdf');
const hasPdf = () =>
    uploadedFiles.some((file, idx) => isPdf(file) && !invalidPdfMap.has(idx));

// Ambient motion
document.addEventListener('mousemove', (event) => {
    const { innerWidth, innerHeight } = window;
    const x = (event.clientX / innerWidth - 0.5) * 2;
    const y = (event.clientY / innerHeight - 0.5) * 2;

    orbs.forEach((orb, index) => {
        const intensity = (index + 1) * 6;
        orb.style.transform = `translate(${x * intensity}px, ${y * intensity}px)`;
    });
});

liftables.forEach((item) => {
    item.addEventListener('mousemove', (event) => {
        const rect = item.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const xPercent = (x / rect.width - 0.5) * 8;
        const yPercent = (y / rect.height - 0.5) * 8;
        item.style.transform = `translateY(-3px) rotateX(${yPercent}deg) rotateY(${xPercent}deg)`;
        item.style.transition = 'transform 0.12s ease';
    });

    item.addEventListener('mouseleave', () => {
        item.style.transform = '';
        item.style.transition = 'transform 0.25s ease';
    });
});

// Nav active state
const setActiveNav = () => {
    const fromTop = window.scrollY + 120;

    navLinks.forEach((link) => {
        const target = link.getAttribute('href');
        if (!target) return;
        const section = document.querySelector(target);
        if (!section) return;

        const offsetTop = section.offsetTop;
        const offsetBottom = offsetTop + section.offsetHeight;

        if (fromTop >= offsetTop && fromTop < offsetBottom) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
};

window.addEventListener('scroll', setActiveNav);
setActiveNav();

// Helpers
const showToast = (message, type = 'error') => {
    if (!toast) return;
    toast.classList.remove('success', 'error', 'info');
    if (type === 'success') {
        toast.classList.add('success');
    } else if (type === 'info') {
        toast.classList.add('info');
    } else {
        toast.classList.add('error');
    }
    toast.textContent = message;
    toast.classList.add('active');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
        toast.classList.remove('active');
    }, 2500);
};

const setFeatureAlert = (message) => {
    if (!featureAlert) return;
    if (message) {
        featureAlert.textContent = message;
        featureAlert.classList.add('active');
    } else {
        featureAlert.textContent = '';
        featureAlert.classList.remove('active');
    }
};

const setUnlockError = (message) => {
    if (!unlockError) return;
    if (message) {
        unlockError.textContent = message;
        unlockError.classList.add('active');
    } else {
        unlockError.textContent = '';
        unlockError.classList.remove('active');
    }
};

const setLockError = (message) => {
    if (!lockError) return;
    if (message) {
        lockError.textContent = message;
        lockError.classList.add('active');
    } else {
        lockError.textContent = '';
        lockError.classList.remove('active');
    }
};

const setRedactError = (message) => {
    if (!redactError) return;
    if (message) {
        redactError.textContent = message;
        redactError.classList.add('active');
    } else {
        redactError.textContent = '';
        redactError.classList.remove('active');
    }
};

const setLoadingMessage = (message) => {
    if (!modalLoading) return;
    const textNode = modalLoading.querySelector('p');
    if (textNode) textNode.textContent = message || 'Preparing preview...';
};

const parseFilenameFromDisposition = (header) => {
    if (!header) return null;
    const match = header.match(/filename=\"?([^\";]+)\"?/i);
    return match ? match[1] : null;
};

const ensurePdfWorker = () => {
    if (!window.pdfjsLib) return;
    const { pdfjsLib } = window;
    if (pdfjsLib.GlobalWorkerOptions) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'assets/js/lib/pdf.worker.min.js';
    }
};

const renderFiles = () => {
    if (!fileList) return;

    if (!uploadedFiles || uploadedFiles.length === 0) {
        fileList.innerHTML = '<p class="muted small">No files yet. Drop a PDF or image to preview.</p>';
        if (serviceReminder) {
            serviceReminder.classList.remove('active');
        }
        return;
    }

    const items = uploadedFiles.map((file, idx) => {
        const size = (file.size / 1024 / 1024).toFixed(1);
        const invalidReason = invalidPdfMap.get(idx);
        const note = invalidReason ? ` • ${invalidReason}` : '';
        return `<span class="file-pill">${file.name} - ${size}MB${note}</span>`;
    });

    fileList.innerHTML = items.join('');
    if (serviceReminder) {
        // Retrigger animation by toggling the class.
        serviceReminder.classList.remove('active');
        // Force reflow to restart animation on subsequent uploads.
        void serviceReminder.offsetWidth; // eslint-disable-line no-unused-expressions
        serviceReminder.classList.add('active');
    }
};

const validateUploadedPdfs = async () => {
    validationRun += 1;
    const runId = validationRun;
    invalidPdfMap.clear();
    ensurePdfWorker();

    const pdfs = uploadedFiles
        .map((file, idx) => ({ file, idx }))
        .filter(({ file }) => isPdf(file));

    for (const { file, idx } of pdfs) {
        try {
            const data = await file.arrayBuffer();
            await window.pdfjsLib.getDocument({ data, password: '' }).promise;
        } catch (error) {
            if (runId !== validationRun) return;
            let reason = 'corrupt or password-protected PDF';
            if (error?.name === 'PasswordException') reason = 'password-protected PDF';
            invalidPdfMap.set(idx, reason);
        }
    }

    if (runId === validationRun) {
        renderFiles();
    }
};

const setFiles = (files) => {
    uploadedFiles = Array.from(files || []);
    pdfDocCache.clear();
    pageOrder = [];
    setFeatureAlert('');
    renderFiles();
    if (window.pdfjsLib) {
        validateUploadedPdfs();
    }
};

// Drag/drop upload
const clearDropzoneState = () => {
    if (dropzone) dropzone.classList.remove('active');
};

if (dropzone && fileInput) {
    dropzone.addEventListener('dragover', (event) => {
        event.preventDefault();
        dropzone.classList.add('active');
    });

    ['dragleave', 'dragend'].forEach((type) => {
        dropzone.addEventListener(type, clearDropzoneState);
    });

    dropzone.addEventListener('drop', (event) => {
        event.preventDefault();
        clearDropzoneState();
        const files = event.dataTransfer?.files;
        if (files && files.length > 0) {
            setFiles(files);
        }
    });
}

if (fileInput) {
    fileInput.addEventListener('change', (event) => {
        setFiles(event.target.files);
    });
}

if (browseBtn && fileInput) {
    browseBtn.addEventListener('click', (event) => {
        event.preventDefault();
        fileInput.click();
    });
}

const closeModal = () => {
    if (!modal) return;
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
};

const renderPageGrid = () => {
    if (!pageGrid) return;
    pageGrid.innerHTML = '';

    pageOrder.forEach((page, displayIndex) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'page-thumb';
        wrapper.setAttribute('draggable', String(dragEnabled));
        wrapper.dataset.orderIndex = String(displayIndex);
        const label = page.fileName ? `${page.fileName} • p${page.pageNumber}` : `Page ${page.pageNumber}`;
        wrapper.innerHTML = `<span class="page-badge">${label}</span><img src="${page.thumb}" alt="Page ${page.pageNumber}">`;

        if (dragEnabled) {
            wrapper.addEventListener('dragstart', (event) => {
                event.dataTransfer?.setData('text/plain', displayIndex.toString());
            });

            wrapper.addEventListener('dragover', (event) => {
                event.preventDefault();
                wrapper.classList.add('drag-over');
            });

            ['dragleave', 'dragend', 'drop'].forEach((type) => {
                wrapper.addEventListener(type, () => {
                    wrapper.classList.remove('drag-over');
                });
            });

            wrapper.addEventListener('drop', (event) => {
                event.preventDefault();
                const fromIndex = Number(event.dataTransfer?.getData('text/plain'));
                const toIndex = Number(wrapper.dataset.orderIndex);
                if (Number.isNaN(fromIndex) || Number.isNaN(toIndex) || fromIndex === toIndex) return;
                const [moved] = pageOrder.splice(fromIndex, 1);
                pageOrder.splice(toIndex, 0, moved);
                renderPageGrid();
            });
        }

        pageGrid.appendChild(wrapper);
    });
};

const loadPdfThumbnails = async (entries) => {
    if (!window.pdfjsLib) throw new Error('PDF.js is unavailable.');
    ensurePdfWorker();

    const pdfEntries = Array.from(entries || [])
        .map((item, idx) => {
            if (item && typeof item === 'object' && 'file' in item && 'idx' in item) {
                return { file: item.file, idx: item.idx };
            }
            return { file: item, idx };
        })
        .filter(({ file, idx }) => isPdf(file) && !invalidPdfMap.has(idx));

    if (pdfEntries.length === 0) throw new Error('No PDF files provided.');

    const thumbs = [];

    for (const { file, idx } of pdfEntries) {
        const data = await file.arrayBuffer();
        const pdf = await window.pdfjsLib.getDocument({ data }).promise;

        for (let i = 1; i <= pdf.numPages; i += 1) {
            const page = await pdf.getPage(i);
            const viewport = page.getViewport({ scale: 0.32 });
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            if (!context) continue;
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            await page.render({ canvasContext: context, viewport }).promise;
            thumbs.push({
                pageNumber: i,
                thumb: canvas.toDataURL('image/png'),
                fileName: file.name || 'PDF',
                fileId: idx,
            });
        }
    }

    pageOrder = thumbs;
    renderPageGrid();
};

const resetModalExtras = () => {
    if (modalInstructions) modalInstructions.textContent = '';
    if (pageGrid) pageGrid.innerHTML = '';
    if (mergeApply) mergeApply.style.display = 'none';
    if (splitApply) splitApply.style.display = 'none';
    if (convertApply) {
        convertApply.style.display = 'none';
        convertApply.disabled = false;
        convertApply.textContent = 'Convert to Image';
    }
    if (convertImageApply) {
        convertImageApply.style.display = 'none';
        convertImageApply.disabled = false;
        convertImageApply.textContent = 'Convert to PDF';
    }
    if (redactApply) {
        redactApply.style.display = 'none';
        redactApply.disabled = false;
        redactApply.textContent = 'Redact Text';
    }
    if (redactControls) redactControls.classList.remove('active');
    if (redactSearch) redactSearch.value = '';
    if (redactList) redactList.innerHTML = '';
    redactSelections.clear();
    redactTextItems = [];
    setRedactError('');
    setUnlockError('');
    setLockError('');
    if (apiAccess) {
        apiAccess.innerHTML = '';
        apiAccess.classList.remove('active');
    }
    if (lockControls) lockControls.classList.remove('active');
    if (lockApply) lockApply.disabled = false;
    if (lockPassword) lockPassword.value = '';
    if (unlockControls) unlockControls.classList.remove('active');
    if (unlockApply) {
        unlockApply.disabled = false;
        unlockApply.textContent = 'Unlock PDF';
    }
    setUnlockError('');
    if (unlockPassword) unlockPassword.value = '';
    if (splitApply) {
        splitApply.disabled = false;
        splitApply.textContent = 'Split PDF';
    }
    pageOrder = [];
    dragEnabled = true;
    if (modalLoading) modalLoading.classList.remove('active');
};

const openModal = async (title, summary, pdfEntries) => {
    if (!modal) return;

    resetModalExtras();
    activePdfEntries = pdfEntries || [];

    modalTitle.textContent = title || 'Feature';
    modalSummary.textContent = summary || '';

    if (modalFiles) {
        if (!pdfEntries || pdfEntries.length === 0) {
            modalFiles.innerHTML = '<p class="muted small">No PDF detected.</p>';
        } else {
            modalFiles.innerHTML = pdfEntries
                .map(({ file }) => `<span class="file-pill">${file.name}</span>`)
                .join('');
        }
    }

    const normalizedTitle = (title || '').toLowerCase();
    const isMerge = normalizedTitle.includes('merge');
    const isLock = normalizedTitle.includes('lock') && !normalizedTitle.includes('unlock');
    const isUnlock = normalizedTitle.includes('unlock');
    const isSplit = normalizedTitle.includes('split');
    const isConvertToImage = normalizedTitle.includes('pdf to image');
    const isConvertImageToPdf = normalizedTitle.includes('image to pdf');
    const isRedact = normalizedTitle.includes('redact');
    const isApiAccess = normalizedTitle.includes('api access');

    if (isMerge && pdfEntries && pdfEntries.length > 0) {
        dragEnabled = true;
        try {
            if (modalInstructions) {
                modalInstructions.textContent = 'Drag pages to reorder before merging.';
            }
            if (mergeApply) mergeApply.style.display = 'inline-flex';
            if (pageGrid) {
                pageGrid.innerHTML = '<p class="muted small">Loading pages...</p>';
            }
            if (modalLoading) modalLoading.classList.add('active');
            await loadPdfThumbnails(pdfEntries);
        } catch (error) {
            if (pageGrid) {
                pageGrid.innerHTML = '<p class="muted small">Unable to preview PDF pages right now.</p>';
            }
            showToast('Unable to preview PDF pages right now.');
        } finally {
            if (modalLoading) modalLoading.classList.remove('active');
        }
        if (splitApply) splitApply.style.display = 'none';
    } else if (isLock && pdfEntries && pdfEntries.length > 0) {
        if (modalInstructions) {
            modalInstructions.textContent = 'Enter a password to lock your PDF on the server.';
        }
        if (lockControls) lockControls.classList.add('active');
        if (lockApply) lockApply.disabled = false;
        if (mergeApply) mergeApply.style.display = 'none';
        if (splitApply) splitApply.style.display = 'none';
    } else if (isUnlock && pdfEntries && pdfEntries.length > 0) {
        if (modalInstructions) {
            modalInstructions.textContent = 'Provide the password to unlock and download a clean PDF.';
        }
        if (unlockControls) unlockControls.classList.add('active');
        if (unlockApply) unlockApply.disabled = false;
        if (mergeApply) mergeApply.style.display = 'none';
        if (splitApply) splitApply.style.display = 'none';
        if (lockControls) lockControls.classList.remove('active');
        if (convertApply) convertApply.style.display = 'none';
    } else if (isSplit && pdfEntries && pdfEntries.length > 0) {
        dragEnabled = false;
        try {
            if (modalInstructions) {
                modalInstructions.textContent = 'Preview pages, then split into individual PDFs.';
            }
            if (pageGrid) {
                pageGrid.innerHTML = '<p class="muted small">Loading pages...</p>';
            }
            if (modalLoading) modalLoading.classList.add('active');
            await loadPdfThumbnails([pdfEntries[0]]);
        } catch (error) {
            if (pageGrid) {
                pageGrid.innerHTML = '<p class="muted small">Unable to preview PDF pages right now.</p>';
            }
            showToast('Unable to preview PDF pages right now.');
        } finally {
            if (modalLoading) modalLoading.classList.remove('active');
        }
        if (lockControls) lockControls.classList.remove('active');
        if (mergeApply) mergeApply.style.display = 'none';
        if (splitApply) splitApply.style.display = 'inline-flex';
        if (convertApply) convertApply.style.display = 'none';
    } else if (isConvertToImage && pdfEntries && pdfEntries.length > 0) {
        dragEnabled = false;
        if (modalInstructions) {
            modalInstructions.textContent = 'Convert every page of your PDF into high-quality PNG images.';
        }
        if (pageGrid) pageGrid.innerHTML = '';
        if (mergeApply) mergeApply.style.display = 'none';
        if (splitApply) splitApply.style.display = 'none';
        if (lockControls) lockControls.classList.remove('active');
        if (unlockControls) unlockControls.classList.remove('active');
        if (convertApply) convertApply.style.display = 'inline-flex';
        if (convertImageApply) convertImageApply.style.display = 'none';
    } else if (isConvertImageToPdf && pdfEntries && pdfEntries.length > 0) {
        dragEnabled = false;
        if (modalInstructions) {
            modalInstructions.textContent = 'Convert your images into a single PDF.';
        }
        if (pageGrid) pageGrid.innerHTML = '';
        if (mergeApply) mergeApply.style.display = 'none';
        if (splitApply) splitApply.style.display = 'none';
        if (lockControls) lockControls.classList.remove('active');
        if (unlockControls) unlockControls.classList.remove('active');
        if (convertApply) convertApply.style.display = 'none';
        if (convertImageApply) convertImageApply.style.display = 'inline-flex';
        if (redactApply) redactApply.style.display = 'none';
        if (redactControls) redactControls.classList.remove('active');
    } else if (isRedact && pdfEntries && pdfEntries.length > 0) {
        dragEnabled = false;
        if (modalInstructions) {
            modalInstructions.textContent = 'Select the text to redact, then export a new PDF.';
        }
        if (pageGrid) pageGrid.innerHTML = '';
        if (mergeApply) mergeApply.style.display = 'none';
        if (splitApply) splitApply.style.display = 'none';
        if (convertApply) convertApply.style.display = 'none';
        if (convertImageApply) convertImageApply.style.display = 'none';
        if (lockControls) lockControls.classList.remove('active');
        if (unlockControls) unlockControls.classList.remove('active');
        if (redactControls) redactControls.classList.add('active');
        if (redactApply) redactApply.style.display = 'inline-flex';
        try {
            if (modalLoading) {
                setLoadingMessage('Scanning text for redaction...');
                modalLoading.classList.add('active');
            }
            const items = await loadRedactText(pdfEntries[0]);
            redactTextItems = items;
            renderRedactList();
        } catch (error) {
            const message = 'Unable to load text for redaction.';
            setRedactError(message);
            showToast(message);
        } finally {
            if (modalLoading) {
                setLoadingMessage('Preparing preview...');
                modalLoading.classList.remove('active');
            }
        }
    } else if (isApiAccess) {
        dragEnabled = false;
        if (modalInstructions) {
            modalInstructions.textContent = 'Single POST endpoint for all PDF operations.';
        }
        if (apiAccess) {
            apiAccess.classList.add('active');
            apiAccess.innerHTML = `
                <h4>Endpoint</h4>
                <code>POST /pdfservice</code>
                <h4>Headers</h4>
                <code>Content-Type: application/json</code>
                <h4>Payload</h4>
                <pre>{
  "operation": "lock", // lock | unlock | merge | split | redact | convert to pdf | convert to image
  "password": "secret",        // required for lock/unlock
  "files": ["<base64-encoded file bytes>"], // single file for most ops, array for merge/convert to pdf
  "text": ["Term A", "Term B"],            // for redact
  "order": [0,1,2]                         // optional ordering for merge
}</pre>
                <h4>Examples</h4>
                <ul>
                    <li><strong>Lock</strong>: {"operation":"lock","password":"1234","files":["base64pdf"]}</li>
                    <li><strong>Unlock</strong>: {"operation":"unlock","password":"1234","files":["base64pdf"]}</li>
                    <li><strong>Merge</strong>: {"operation":"merge","files":["base64pdf1","base64pdf2"]}</li>
                    <li><strong>Split</strong>: {"operation":"split","files":["base64pdf"]}</li>
                    <li><strong>Redact</strong>: {"operation":"redact","text":["SSN","Mike"],"files":["base64pdf"]}</li>
                    <li><strong>Convert to image</strong>: {"operation":"convert to image","files":["base64pdf"]}</li>
                    <li><strong>Convert to pdf</strong>: {"operation":"convert to pdf","files":["base64img1","base64img2"]}</li>
                </ul>
                <p class="muted small">Responses return the processed file bytes (PDF or ZIP) with appropriate content-type.</p>
            `;
        }
        if (mergeApply) mergeApply.style.display = 'none';
        if (splitApply) splitApply.style.display = 'none';
        if (convertApply) convertApply.style.display = 'none';
        if (convertImageApply) convertImageApply.style.display = 'none';
        if (redactApply) redactApply.style.display = 'none';
        if (redactControls) redactControls.classList.remove('active');
        if (lockControls) lockControls.classList.remove('active');
        if (unlockControls) unlockControls.classList.remove('active');
    } else {
        resetModalExtras();
    }

    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
};

const mergePages = async () => {
    if (!window.PDFLib) {
        showToast('Merge engine unavailable.');
        return;
    }

    if (!pageOrder || pageOrder.length === 0) {
        showToast('No pages to merge.');
        return;
    }

    try {
        mergeApply.disabled = true;
        mergeApply.textContent = 'Merging...';

        const { PDFDocument } = window.PDFLib;
        const output = await PDFDocument.create();

        const getPdfDoc = async (fileId) => {
            if (pdfDocCache.has(fileId)) return pdfDocCache.get(fileId);
            const file = uploadedFiles[fileId];
            if (!file) throw new Error('Source file missing.');
            if (invalidPdfMap.has(fileId)) throw new Error('PDF is locked or corrupt.');
            const buffer = await file.arrayBuffer();
            const doc = await PDFDocument.load(buffer);
            pdfDocCache.set(fileId, doc);
            return doc;
        };

        for (const pageMeta of pageOrder) {
            const srcDoc = await getPdfDoc(pageMeta.fileId);
            const [copied] = await output.copyPages(srcDoc, [pageMeta.pageNumber - 1]);
            output.addPage(copied);
        }

        const pdfBytes = await output.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'plughub-merged.pdf';
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1500);
        showToast('Merged PDF downloaded.', 'success');
    } catch (error) {
        showToast('Unable to merge pages right now.');
    } finally {
        mergeApply.disabled = false;
        mergeApply.textContent = 'Apply merge order';
    }
};

if (mergeApply) {
    mergeApply.addEventListener('click', mergePages);
}

const lockPdf = async () => {
    const password = lockPassword?.value?.trim() || '';
    if (!password) {
        setLockError('Please enter a password to lock the PDF.');
        showToast('Please enter a password to lock the PDF.');
        return;
    }

    if (!activePdfEntries || activePdfEntries.length === 0) {
        setLockError('No PDF to lock.');
        showToast('No PDF to lock.');
        return;
    }

    if (activePdfEntries.length > 1) {
        setLockError('Lock one PDF at a time.');
        showToast('Lock one PDF at a time.');
        return;
    }

    const validEntries = activePdfEntries.filter(
        ({ idx, file }) => isPdf(file) && !invalidPdfMap.has(idx)
    );

    if (validEntries.length === 0) {
        showToast('Selected PDF is locked or corrupt.');
        return;
    }

    try {
        setLockError('');
        lockApply.disabled = true;
        lockApply.textContent = 'Locking...';

        const { file } = validEntries[0];
        const formData = new FormData();
        formData.append('password', password);
        formData.append('file', file, file.name);

        const response = await fetch('lock.php', {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            let errorMessage = 'Unable to lock this PDF on the server.';
            try {
                const data = await response.json();
                if (data?.error) errorMessage = data.error;
            } catch (parseError) {
                // Ignore parse errors and use the default message.
            }
            throw new Error(errorMessage);
        }

        const contentType = response.headers.get('content-type') || '';
        if (!contentType.includes('application/pdf')) {
            throw new Error('Server did not return a PDF.');
        }

        const blob = await response.blob();
        const disposition = response.headers.get('content-disposition');
        const filename =
            parseFilenameFromDisposition(disposition) ||
            `${file.name.replace(/\\.pdf$/i, '') || 'plughub'}-locked.pdf`;

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1500);
        showToast('Locked PDF downloaded.', 'success');
    } catch (error) {
        const message = error?.message || 'Unable to lock this PDF on the server.';
        setLockError(message);
        showToast(message);
    } finally {
        lockApply.disabled = false;
        lockApply.textContent = 'Lock PDF';
    }
};

const unlockPdf = async () => {
    const password = unlockPassword?.value?.trim() || '';
    if (!password) {
        setUnlockError('Please enter the password to unlock the PDF.');
        showToast('Please enter the password to unlock the PDF.');
        return;
    }

    if (!activePdfEntries || activePdfEntries.length === 0) {
        setUnlockError('No PDF to unlock.');
        showToast('No PDF to unlock.');
        return;
    }

    if (activePdfEntries.length > 1) {
        const message = 'Unlock one PDF at a time.';
        setUnlockError(message);
        showToast(message);
        return;
    }

    const validEntries = activePdfEntries.filter(({ idx, file }) => {
        if (!isPdf(file)) return false;
        const invalidReason = invalidPdfMap.get(idx);
        if (!invalidReason) return true;
        return invalidReason.toLowerCase().includes('password');
    });

    if (validEntries.length === 0) {
        const message = 'Selected PDF is corrupt or unsupported for unlocking.';
        setUnlockError(message);
        showToast(message);
        return;
    }

    try {
        setUnlockError('');
        unlockApply.disabled = true;
        unlockApply.textContent = 'Unlocking...';

        const { file } = validEntries[0];
        const formData = new FormData();
        formData.append('password', password);
        formData.append('file', file, file.name);

        const response = await fetch('unlock.php', {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            let errorMessage = 'Unable to unlock this PDF on the server.';
            try {
                const data = await response.json();
                if (data?.error) errorMessage = data.error;
            } catch (parseError) {
                // Ignore parse errors and keep default message.
            }
            throw new Error(errorMessage);
        }

        const contentType = response.headers.get('content-type') || '';
        if (!contentType.includes('application/pdf')) {
            throw new Error('Server did not return a PDF.');
        }

        const blob = await response.blob();
        const disposition = response.headers.get('content-disposition');
        const filename =
            parseFilenameFromDisposition(disposition) ||
            `${file.name.replace(/\\.pdf$/i, '') || 'plughub'}-unlocked.pdf`;

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1500);
        setUnlockError('');
        showToast('Unlocked PDF downloaded.', 'success');
    } catch (error) {
        const message = error?.message || 'Unable to unlock this PDF on the server.';
        setUnlockError(message);
        showToast(message);
    } finally {
        unlockApply.disabled = false;
        unlockApply.textContent = 'Unlock PDF';
    }
};

const ensureJsZip = () =>
    new Promise((resolve, reject) => {
        if (window.JSZip) {
            resolve(window.JSZip);
            return;
        }
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js';
        script.async = true;
        script.onload = () => {
            if (window.JSZip) {
                resolve(window.JSZip);
            } else {
                reject(new Error('JSZip failed to load.'));
            }
        };
        script.onerror = () => reject(new Error('Unable to load zip helper.'));
        document.head.appendChild(script);
    });

const renderPdfToImages = async (file) => {
    if (!window.pdfjsLib) throw new Error('PDF renderer unavailable.');
    ensurePdfWorker();
    const data = await file.arrayBuffer();
    const pdf = await window.pdfjsLib.getDocument({ data }).promise;
    const images = [];

    for (let i = 1; i <= pdf.numPages; i += 1) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2 }); // higher res for export
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) continue;
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvasContext: context, viewport }).promise;
        const dataUrl = canvas.toDataURL('image/png');
        images.push({ name: `page-${i}.png`, dataUrl });
    }

    return images;
};

const loadRedactText = async (entry) => {
    if (!window.pdfjsLib) throw new Error('PDF renderer unavailable.');
    ensurePdfWorker();
    const { file } = entry;
    const data = await file.arrayBuffer();
    const pdf = await window.pdfjsLib.getDocument({ data }).promise;
    const items = [];

    for (let i = 1; i <= pdf.numPages; i += 1) {
        const page = await pdf.getPage(i);
        // use dontFlip to keep y-axis upward like pdf-lib
        const viewport = page.getViewport({ scale: 1, rotation: page.rotate, dontFlip: true });
        const content = await page.getTextContent();
        content.items.forEach((item) => {
            const text = (item.str || '').trim();
            if (!text) return;
            const width = item.width || 0;
            const height = item.height || Math.abs(item.transform?.[3] || 0) || 10;
            const x = item.transform?.[4] || 0;
            const y = item.transform?.[5] || 0;
            const rect = viewport.convertToViewportRectangle([x, y, x + width, y + height]);
            const [rx1, ry1, rx2, ry2] = rect;
            const vx = Math.min(rx1, rx2);
            const vy = Math.min(ry1, ry2);
            const vwidth = Math.abs(rx1 - rx2);
            const vheight = Math.abs(ry1 - ry2);
            items.push({
                text,
                pageNumber: i,
                x: vx,
                y: vy,
                width: vwidth,
                height: vheight,
                fontSize: Math.abs(item.transform?.[0] || item.transform?.[3] || 10),
            });
        });
    }

    return items;
};

const renderRedactList = (filter = '') => {
    if (!redactList) return;
    const term = filter.trim().toLowerCase();
    const values = Array.from(
        redactTextItems.reduce((set, item) => set.add(item.text), new Set())
    );
    const filtered = term
        ? values.filter((text) => text.toLowerCase().includes(term))
        : values;

    if (filtered.length === 0) {
        redactList.innerHTML = '<p class="redact-empty">No text available.</p>';
        return;
    }

    redactList.innerHTML = filtered
        .slice(0, 300) // avoid overwhelming UI
        .map(
            (text, idx) => `
                <label class="redact-item" for="redact-item-${idx}">
                    <input type="checkbox" id="redact-item-${idx}" data-text="${encodeURIComponent(
                        text
                    )}" ${redactSelections.has(text) ? 'checked' : ''}>
                    <span>${text
                        .replace(/&/g, '&amp;')
                        .replace(/</g, '&lt;')
                        .replace(/>/g, '&gt;')}</span>
                </label>
            `
        )
        .join('');

    redactList.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
        checkbox.addEventListener('change', (event) => {
            const raw = event.target.dataset.text || '';
            const value = raw ? decodeURIComponent(raw) : '';
            if (!value) return;
            if (event.target.checked) {
                redactSelections.add(value);
            } else {
                redactSelections.delete(value);
            }
        });
    });
};

const convertPdfToImages = async () => {
    if (!activePdfEntries || activePdfEntries.length === 0) {
        showToast('No PDF to convert.');
        return;
    }

    const validEntries = activePdfEntries.filter(
        ({ idx, file }) => isPdf(file) && !invalidPdfMap.has(idx)
    );

    if (validEntries.length === 0) {
        showToast('Selected PDF is locked or corrupt.');
        return;
    }

    try {
        if (convertApply) {
            convertApply.disabled = true;
            convertApply.textContent = 'Converting...';
        }
        if (modalLoading) {
            setLoadingMessage('Converting pages to images...');
            modalLoading.classList.add('active');
        }

        const { file, idx } = validEntries[0];
        const images = await renderPdfToImages(file);
        if (!images.length) throw new Error('No pages rendered.');

        const JSZip = await ensureJsZip();
        const zip = new JSZip();
        images.forEach((img) => {
            const base64 = img.dataUrl.split(',')[1];
            zip.file(img.name, base64, { base64: true });
        });
        const blob = await zip.generateAsync({ type: 'blob' });

        const baseName = (file.name || `pdf-${idx}`).replace(/\\.pdf$/i, '') || 'plughub';
        const zipName = `${baseName}-images.zip`;
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = zipName;
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1500);
        showToast('Image ZIP downloaded.', 'success');
    } catch (error) {
        showToast(error?.message || 'Unable to convert this PDF right now.');
    } finally {
        if (convertApply) {
            convertApply.disabled = false;
            convertApply.textContent = 'Convert to Image';
        }
        if (modalLoading) {
            setLoadingMessage('Preparing preview...');
            modalLoading.classList.remove('active');
        }
    }
};

const convertImagesToPdf = async () => {
    if (!activePdfEntries || activePdfEntries.length === 0) {
        showToast('No images to convert.');
        return;
    }

    const imageEntries = activePdfEntries.filter(({ file }) => isImage(file));
    if (imageEntries.length === 0) {
        showToast('No valid images to convert.');
        return;
    }

    if (!window.PDFLib) {
        showToast('PDF engine unavailable.');
        return;
    }

    try {
        if (convertImageApply) {
            convertImageApply.disabled = true;
            convertImageApply.textContent = 'Converting...';
        }
        if (modalLoading) {
            setLoadingMessage('Converting images to PDF...');
            modalLoading.classList.add('active');
        }

        const { PDFDocument } = window.PDFLib;
        const doc = await PDFDocument.create();

        for (const { file } of imageEntries) {
            const buffer = await file.arrayBuffer();
            const ext = (file.name || '').toLowerCase();
            let embedded;
            if (file.type === 'image/png' || ext.endsWith('.png')) {
                embedded = await doc.embedPng(buffer);
            } else {
                embedded = await doc.embedJpg(buffer);
            }
            const { width, height } = embedded;
            const page = doc.addPage([width, height]);
            page.drawImage(embedded, {
                x: 0,
                y: 0,
                width,
                height,
            });
        }

        const pdfBytes = await doc.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const baseName = imageEntries[0]?.file?.name?.split('.')[0] || 'images';
        const filename = `${baseName}-converted.pdf`;

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1500);
        showToast('Converted PDF downloaded.', 'success');
    } catch (error) {
        showToast(error?.message || 'Unable to convert images right now.');
    } finally {
        if (convertImageApply) {
            convertImageApply.disabled = false;
            convertImageApply.textContent = 'Convert to PDF';
        }
        if (modalLoading) {
            setLoadingMessage('Preparing preview...');
            modalLoading.classList.remove('active');
        }
    }
};

const redactPdf = async () => {
    if (!activePdfEntries || activePdfEntries.length === 0) {
        showToast('No PDF to redact.');
        return;
    }

    if (redactSelections.size === 0) {
        const message = 'Select at least one text entry to redact.';
        setRedactError(message);
        showToast(message);
        return;
    }

    const validEntries = activePdfEntries.filter(
        ({ idx, file }) => isPdf(file) && !invalidPdfMap.has(idx)
    );

    if (validEntries.length === 0) {
        showToast('Selected PDF is locked or corrupt.');
        return;
    }

    if (!window.PDFLib) {
        showToast('PDF engine unavailable.');
        return;
    }

    try {
        if (redactApply) {
            redactApply.disabled = true;
            redactApply.textContent = 'Redacting...';
        }
        if (modalLoading) {
            setLoadingMessage('Applying redactions...');
            modalLoading.classList.add('active');
        }

        const { file, idx } = validEntries[0];
        const data = await file.arrayBuffer();
        const { PDFDocument, StandardFonts, rgb } = window.PDFLib;
        const doc = await PDFDocument.load(data);
        const font = await doc.embedFont(StandardFonts.HelveticaBold);

        const targets = redactTextItems.filter((item) => redactSelections.has(item.text));
        if (!targets.length) throw new Error('No matching text found to redact.');

        const margin = 1.5;
        targets.forEach((item) => {
            const page = doc.getPage(item.pageNumber - 1);
            const width = item.width + margin * 2;
            const height = item.height + margin * 2;
            const x = item.x - margin;
            const y = item.y - margin;
            page.drawRectangle({
                x,
                y,
                width,
                height,
                color: rgb(0, 0, 0),
            });
            page.drawText('[REDACTED]', {
                x: x + 2,
                y: y + height / 2 - 4,
                size: Math.min(12, (item.fontSize || item.height) + 2),
                color: rgb(1, 1, 1),
                font,
            });
        });

        const output = await doc.save();
        const blob = new Blob([output], { type: 'application/pdf' });
        const baseName = (file.name || `pdf-${idx}`).replace(/\.pdf$/i, '') || 'plughub';
        const filename = `${baseName}-redacted.pdf`;
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1500);
        setRedactError('');
        showToast('Redacted PDF downloaded.', 'success');
    } catch (error) {
        const message = error?.message || 'Unable to redact this PDF right now.';
        setRedactError(message);
        showToast(message);
    } finally {
        if (redactApply) {
            redactApply.disabled = false;
            redactApply.textContent = 'Redact Text';
        }
        if (modalLoading) {
            setLoadingMessage('Preparing preview...');
            modalLoading.classList.remove('active');
        }
    }
};

const splitPdf = async () => {
    if (!activePdfEntries || activePdfEntries.length === 0) {
        showToast('No PDF to split.');
        return;
    }

    const validEntries = activePdfEntries.filter(
        ({ idx, file }) => isPdf(file) && !invalidPdfMap.has(idx)
    );

    if (validEntries.length === 0) {
        showToast('Selected PDF is locked or corrupt.');
        return;
    }

    try {
        splitApply.disabled = true;
        splitApply.textContent = 'Splitting...';

        const { file } = validEntries[0];
        const formData = new FormData();
        formData.append('file', file, file.name);

        const response = await fetch('split.php', {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            let errorMessage = 'Unable to split this PDF on the server.';
            try {
                const data = await response.json();
                if (data?.error) errorMessage = data.error;
            } catch (parseError) {
                // ignore
            }
            throw new Error(errorMessage);
        }

        const contentType = response.headers.get('content-type') || '';
        if (!contentType.includes('zip')) {
            throw new Error('Server did not return a ZIP file.');
        }

        const blob = await response.blob();
        const disposition = response.headers.get('content-disposition');
        const filename =
            parseFilenameFromDisposition(disposition) ||
            `${file.name.replace(/\\.pdf$/i, '') || 'plughub'}-split.zip`;

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1500);
        showToast('Split ZIP downloaded.', 'success');
    } catch (error) {
        showToast(error?.message || 'Unable to split this PDF on the server.');
    } finally {
        splitApply.disabled = false;
        splitApply.textContent = 'Split PDF';
    }
};

if (lockApply) {
    lockApply.addEventListener('click', lockPdf);
}

if (unlockApply) {
    unlockApply.addEventListener('click', unlockPdf);
}

if (convertApply) {
    convertApply.addEventListener('click', convertPdfToImages);
}

if (convertImageApply) {
    convertImageApply.addEventListener('click', convertImagesToPdf);
}

if (redactApply) {
    redactApply.addEventListener('click', redactPdf);
}

if (redactSearch) {
    redactSearch.addEventListener('input', (event) => {
        renderRedactList(event.target.value || '');
    });
}

if (splitApply) {
    splitApply.addEventListener('click', splitPdf);
}

if (modalClose) modalClose.addEventListener('click', closeModal);
if (modalBackdrop) modalBackdrop.addEventListener('click', closeModal);
window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        closeModal();
    }
});

featureCards.forEach((card) => {
    card.setAttribute('tabindex', '0');

    const activate = async () => {
        setFeatureAlert('');
        const title = card.querySelector('h3')?.textContent?.trim() || 'Feature';
        const summary = card.querySelector('p')?.textContent?.trim() || '';
        const normalizedTitle = title.toLowerCase();
        const isUnlockCard = normalizedTitle.includes('unlock');
        const isConvertPdfToImageCard = normalizedTitle.includes('pdf to image');
        const isConvertImageToPdfCard = normalizedTitle.includes('image to pdf');
        const isRedactCard = normalizedTitle.includes('redact');
        const isApiCard = normalizedTitle.includes('api access');

        if (isApiCard) {
            await openModal(title, summary, []);
            return;
        }

        const entries = uploadedFiles.map((file, idx) => ({ file, idx }));

        const filteredEntries = entries.filter(({ file, idx }) => {
            if (isConvertImageToPdfCard) {
                return isImage(file);
            }
            if (isRedactCard) {
                return isPdf(file) && !invalidPdfMap.has(idx);
            }
            if (!isPdf(file)) return false;
            if (isUnlockCard) return true;
            return !invalidPdfMap.has(idx);
        });

        if (filteredEntries.length === 0) {
            const invalidNames = Array.from(invalidPdfMap.entries())
                .map(([idx, reason]) => `${uploadedFiles[idx]?.name || 'PDF'} (${reason})`)
                .join('; ');
            const message = isUnlockCard
                ? 'Upload a locked PDF to unlock.'
                : isConvertImageToPdfCard
                    ? 'Please upload at least one image to convert.'
                    : isConvertPdfToImageCard
                        ? 'A PDF should be first uploaded.'
                        : isRedactCard
                            ? 'Upload a PDF to redact.'
                : invalidNames
                    ? `Cannot open: ${invalidNames}`
                    : 'A PDF should be first uploaded.';
            setFeatureAlert(message);
            showToast(message);
            return;
        }

        if (!isUnlockCard) {
            const lockedEntries = Array.from(invalidPdfMap.entries()).filter(([, reason]) =>
                (reason || '').toLowerCase().includes('password')
            );
            if (lockedEntries.length > 0) {
                const lockedNames = lockedEntries
                    .map(([idx, reason]) => `${uploadedFiles[idx]?.name || 'PDF'} (${reason})`)
                    .join('; ');
                const warning = `Locked PDFs detected: ${lockedNames}. Use Unlock PDFs to remove the password.`;
                setFeatureAlert(warning);
                showToast(warning);
            }
        }

        await openModal(title, summary, filteredEntries);
    };

    card.addEventListener('click', () => {
        activate();
    });
    card.addEventListener('keypress', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            activate();
        }
    });
});

setFiles(fileInput?.files);
