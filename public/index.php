<?php
require_once __DIR__ . '/../config/env.php';

loadEnv(__DIR__ . '/..');

$appName = env('APP_NAME', 'Plughub PDF Utility');
$tagline = env('APP_TAGLINE', 'Lightning-fast PDF toolkit to merge, split, secure, and automate.');
$summary = env('APP_SUMMARY', 'Transform PDFs effortlessly with Plughub\'s automation-ready tools built for teams.');
$primary = env('PRIMARY_COLOR', '#ff2f45');
$accent = env('ACCENT_COLOR', '#f6c343');
$gradientFrom = env('GRADIENT_FROM', '#0b0e17');
$gradientTo = env('GRADIENT_TO', '#11172a');
$ctaPrimaryLabel = env('CTA_PRIMARY_LABEL', 'Launch Utility');
$ctaPrimaryUrl = env('CTA_PRIMARY_URL', '#early-access');
$ctaSecondaryLabel = env('CTA_SECONDARY_LABEL', 'See What\'s Inside');
$ctaSecondaryUrl = env('CTA_SECONDARY_URL', '#features');
$contactEmail = env('CONTACT_EMAIL', 'hello@plughub.dev');
$heroBadge = env('HERO_BADGE', 'Built for documents at scale');

$requestPath = parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH);
if ($requestPath === '/pdfservice' || $requestPath === '/pdfservice/') {
    require __DIR__ . '/pdfservice.php';
    exit;
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= htmlspecialchars($appName) ?></title>
    <meta name="description" content="<?= htmlspecialchars($summary) ?>">
    <link rel="icon" type="image/svg+xml" href="assets/img/logo.svg">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="assets/css/style.css">
    <style>
        :root {
            --color-primary: <?= htmlspecialchars($primary) ?>;
            --color-accent: <?= htmlspecialchars($accent) ?>;
            --gradient-from: <?= htmlspecialchars($gradientFrom) ?>;
            --gradient-to: <?= htmlspecialchars($gradientTo) ?>;
        }
    </style>
</head>
<body>
    <div class="page">
        <header class="topbar">
            <div class="brand">
                <div class="brand-mark">
                    <img src="assets/img/logo.svg" alt="<?= htmlspecialchars($appName) ?> logo">
                </div>
            <div class="brand-text">
                <span class="brand-name"><?= htmlspecialchars($appName) ?></span>
                <span class="brand-tag">PDF + Automation</span>
            </div>
        </div>
        <nav class="nav"></nav>
        <div class="topbar-actions"></div>
    </header>

        <main>
            <section class="hero" id="home">
                <div class="hero-backdrop">
                    <span class="orb orb-1"></span>
                    <span class="orb orb-2"></span>
                    <span class="orb orb-3"></span>
                </div>
                <div class="hero-grid">
                    <div class="hero-copy">
                        <span class="eyebrow"><?= htmlspecialchars($heroBadge) ?></span>
                        <h1>Plug into powerful PDF automation.</h1>
                        <p class="lead"><?= htmlspecialchars($summary) ?></p>
                        <div class="meta-row">
                            <span class="pill">No installs</span>
                            <span class="pill">Team-ready</span>
                            <span class="pill">API-friendly</span>
                        </div>
                    </div>
                    <div class="hero-upload">
                        <div class="upload-card">
                            <div class="upload-head">
                                <p class="eyebrow">Try it</p>
                                <h3>Drop a PDF or image</h3>
                                <p class="muted">Drag and drop to simulate how Plughub ingests and prepares your files.</p>
                            </div>
                            <div class="dropzone" id="dropzone">
                                <input type="file" id="file-input" accept=".pdf,image/*" multiple>
                                <div class="drop-icon">⇪</div>
                                <p class="drop-title">Drag files here</p>
                                <p class="light small">PDF or images • up to 50MB</p>
                                <button type="button" class="ghost browse-btn">Browse</button>
                            </div>
                            <div class="file-list" id="file-list">
                                <p class="muted small">No files yet. Drop a PDF or image to preview.</p>
                            </div>
                            <div class="service-reminder" id="service-reminder" aria-live="polite">
                                Select a PDF service below.
                            </div>
                            <div class="toast" id="toast" role="status" aria-live="polite"></div>
                        </div>
                    </div>
                </div>
            </section>

            <section class="features" id="features">
                <div class="section-head">
                    <div>
                        <p class="eyebrow">PDF building blocks</p>
                    </div>
                </div>
                <div class="feature-alert" id="feature-alert" role="alert" aria-live="polite"></div>
                <div class="feature-grid">
                    <article class="card">
                        <div class="card-icon">⚡</div>
                        <h3>One-click merge</h3>
                        <p>Drag in files, reorder instantly, and output pristine bundles with preserved metadata.</p>
                    </article>
                    <article class="card">
                        <div class="card-icon">🛡️</div>
                        <h3>Lock PDF</h3>
                        <p>Protect documents with a password before sharing or storing them anywhere.</p>
                    </article>
                    <article class="card">
                        <div class="card-icon">✂️</div>
                        <h3>Split PDFs</h3>
                        <p>Slice documents by page ranges, bookmarks, or size limits while keeping structure intact.</p>
                    </article>
                    <article class="card">
                        <div class="card-icon">🔗</div>
                        <h3>Unlock PDFs</h3>
                        <p>Remove passwords and permissions from PDFs you own so teams can edit and reuse content.</p>
                    </article>
                    <article class="card">
                        <div class="card-icon">🖼️</div>
                        <h3>Convert PDF to Image</h3>
                        <p>Render PDFs into crisp PNG or JPG outputs optimized for sharing, previews, or archives.</p>
                    </article>
                    <article class="card">
                        <div class="card-icon">🧩</div>
                        <h3>Convert Image to PDF</h3>
                        <p>Package images into polished PDFs with auto-scaling, ordering, and consistent margins.</p>
                    </article>
                    <article class="card">
                        <div class="card-icon">✒️</div>
                        <h3>Redact Text</h3>
                        <p>Remove sensitive words, phrases, or regions permanently with audit-friendly redactions.</p>
                    </article>
                    <article class="card">
                        <div class="card-icon">🛰️</div>
                        <h3>API Access</h3>
                        <p>Automate every PDF action through a clean REST API with webhooks and team-level keys.</p>
                    </article>
                </div>
            </section>
        </main>

        <div class="modal" id="feature-modal" aria-hidden="true" role="dialog" aria-modal="true">
            <div class="modal-backdrop" id="modal-backdrop"></div>
            <div class="modal-dialog">
                <button class="modal-close" id="modal-close" aria-label="Close modal">×</button>
                <p class="eyebrow">Action preview</p>
                <h3 id="modal-title">Feature</h3>
                <p class="muted" id="modal-summary">Modal summary placeholder.</p>
                <div class="modal-files" id="modal-files"></div>
                <div id="modal-instructions" class="muted small"></div>
                <div class="api-access" id="api-access"></div>
                <div class="modal-loading" id="modal-loading" aria-live="polite">
                    <div class="spinner"></div>
                    <p class="muted small">Preparing preview...</p>
                </div>
                <div class="lock-controls" id="lock-controls">
                    <label class="muted small" for="lock-password">Set a password to lock this PDF</label>
                    <input
                        type="password"
                        id="lock-password"
                        name="lock-passphrase"
                        placeholder="Enter password"
                        autocomplete="off"
                        data-lpignore="true"
                        data-1p-ignore="true"
                        data-form-type="other"
                        spellcheck="false"
                        autocapitalize="off"
                        inputmode="text"
                    >
                    <button type="button" class="primary lock-btn" id="lock-apply">Lock PDF</button>
                </div>
                <div class="unlock-controls" id="unlock-controls">
                    <label class="muted small" for="unlock-password">Enter the password to unlock this PDF</label>
                    <input
                        type="password"
                        id="unlock-password"
                        name="unlock-passphrase"
                        placeholder="Enter password"
                        autocomplete="off"
                        data-lpignore="true"
                        data-1p-ignore="true"
                        data-form-type="other"
                        spellcheck="false"
                        autocapitalize="off"
                        inputmode="text"
                    >
                    <div class="form-error" id="unlock-error" role="alert" aria-live="assertive"></div>
                    <button type="button" class="primary unlock-btn" id="unlock-apply">Unlock PDF</button>
                </div>
                <div class="redact-controls" id="redact-controls">
                    <div class="redact-head">
                        <label class="muted small" for="redact-search">Select text to redact</label>
                        <input
                            type="search"
                            id="redact-search"
                            class="redact-search"
                            placeholder="Search text..."
                            autocomplete="off"
                            spellcheck="false"
                        >
                    </div>
                    <div class="redact-list" id="redact-list"></div>
                    <div class="form-error" id="redact-error" role="alert" aria-live="assertive"></div>
                </div>
                <div class="page-grid" id="page-grid"></div>
                <button type="button" class="primary merge-btn" id="merge-apply">Apply merge order</button>
                <button type="button" class="primary split-btn" id="split-apply">Split PDF</button>
                <button type="button" class="primary convert-btn" id="convert-apply">Convert to Image</button>
                <button type="button" class="primary convert-image-btn" id="convert-image-apply">Convert to PDF</button>
                <button type="button" class="primary redact-btn" id="redact-apply">Redact Text</button>
            </div>
        </div>

        <footer class="footer">
            <div class="footer-brand">
                <img src="assets/img/logo.svg" alt="<?= htmlspecialchars($appName) ?> logo">
                <div>
                    <p class="brand-name"><?= htmlspecialchars($appName) ?></p>
                    <p class="muted small">PDF utility with automation-first DNA.</p>
                </div>
            </div>
            <div class="footer-links"></div>
            <div class="footer-note"></div>
        </footer>
    </div>

    <script src="assets/js/lib/pdf.min.js"></script>
    <script src="assets/js/lib/pdf-lib.min.js"></script>
    <script src="assets/js/app.js"></script>
</body>
</html>
