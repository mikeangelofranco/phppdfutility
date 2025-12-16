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
            <nav class="nav">
                <a href="#features">Features</a>
                <a href="#workflow">Workflow</a>
                <a href="#early-access">Early Access</a>
            </nav>
            <div class="topbar-actions">
                <a class="ghost" href="mailto:<?= htmlspecialchars($contactEmail) ?>">Contact</a>
                <a class="primary" href="<?= htmlspecialchars($ctaPrimaryUrl) ?>"><?= htmlspecialchars($ctaPrimaryLabel) ?></a>
            </div>
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
                        <div class="cta-row">
                            <a class="btn primary" href="<?= htmlspecialchars($ctaPrimaryUrl) ?>"><?= htmlspecialchars($ctaPrimaryLabel) ?></a>
                            <a class="btn ghost" href="<?= htmlspecialchars($ctaSecondaryUrl) ?>"><?= htmlspecialchars($ctaSecondaryLabel) ?></a>
                        </div>
                        <div class="meta-row">
                            <span class="pill">No installs</span>
                            <span class="pill">Team-ready</span>
                            <span class="pill">API-friendly</span>
                        </div>
                    </div>
                    <div class="hero-panel">
                        <div class="panel-header">
                            <div class="panel-title">PDF Utility Console</div>
                            <div class="status">
                                <span class="dot"></span>
                                Live
                            </div>
                        </div>
                        <div class="panel-body">
                            <div class="stat">
                                <span class="label">Merge queue</span>
                                <span class="value">34 jobs</span>
                            </div>
                            <div class="stat">
                                <span class="label">Optimization</span>
                                <span class="value accent">2.3s avg</span>
                            </div>
                            <div class="stat-grid">
                                <div class="tile">
                                    <p class="tiny">Split</p>
                                    <h3>Dynamic ranges</h3>
                                    <p>Automate precise cuts with reusable presets.</p>
                                </div>
                                <div class="tile">
                                    <p class="tiny">Secure</p>
                                    <h3>Lock + sign</h3>
                                    <p>Apply passwords and signatures in one pass.</p>
                                </div>
                                <div class="tile">
                                    <p class="tiny">Optimize</p>
                                    <h3>Compress smart</h3>
                                    <p>Maintain clarity while shrinking heavy files.</p>
                                </div>
                            </div>
                            <div class="progress-card">
                                <div class="progress-head">
                                    <span>Batch pipeline</span>
                                    <span class="light">sync-12 • 95%</span>
                                </div>
                                <div class="progress-bar">
                                    <span style="width: 95%;"></span>
                                </div>
                                <p class="light">Queued outputs emailed automatically.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section class="features" id="features">
                <div class="section-head">
                    <div>
                        <p class="eyebrow">PDF building blocks</p>
                        <h2>Everything you need to ship clean PDFs.</h2>
                        <p class="muted"><?= htmlspecialchars($tagline) ?></p>
                    </div>
                    <div class="chip-row">
                        <span class="chip">Merge</span>
                        <span class="chip">Split</span>
                        <span class="chip">Watermark</span>
                        <span class="chip">Sign</span>
                        <span class="chip">Optimize</span>
                    </div>
                </div>
                <div class="feature-grid">
                    <article class="card">
                        <div class="card-icon">⚡</div>
                        <h3>One-click merge</h3>
                        <p>Drag in files, reorder instantly, and output pristine bundles with preserved metadata.</p>
                        <ul>
                            <li>Bulk-friendly queue</li>
                            <li>Metadata-aware merge</li>
                            <li>Version-safe outputs</li>
                        </ul>
                    </article>
                    <article class="card">
                        <div class="card-icon">🛡️</div>
                        <h3>Secure by default</h3>
                        <p>Lock PDFs with passwords, apply signatures, and watermark sensitive exports in one step.</p>
                        <ul>
                            <li>Audit-ready signing</li>
                            <li>Custom watermark presets</li>
                            <li>Password + permission control</li>
                        </ul>
                    </article>
                    <article class="card">
                        <div class="card-icon">🚀</div>
                        <h3>Optimize intelligently</h3>
                        <p>Shrink heavy documents with adaptive compression that keeps text and vector clarity intact.</p>
                        <ul>
                            <li>Smart compression</li>
                            <li>Lossless text handling</li>
                            <li>Image downscaling profiles</li>
                        </ul>
                    </article>
                    <article class="card">
                        <div class="card-icon">🔗</div>
                        <h3>Workflow ready</h3>
                        <p>Trigger actions via API or UI, schedule batches, and pipe results straight to storage.</p>
                        <ul>
                            <li>REST + webhooks</li>
                            <li>Storage destinations</li>
                            <li>Reusable automations</li>
                        </ul>
                    </article>
                </div>
            </section>

            <section class="workflow" id="workflow">
                <div class="workflow-head">
                    <p class="eyebrow">Workflow</p>
                    <h2>Build, secure, and ship PDFs in three steps.</h2>
                </div>
                <div class="workflow-grid">
                    <div class="step">
                        <span class="step-num">01</span>
                        <h3>Drop + define</h3>
                        <p>Upload files or pull from storage, then pick merge, split, or watermark profiles.</p>
                        <div class="tag">Drag-and-drop</div>
                    </div>
                    <div class="step">
                        <span class="step-num">02</span>
                        <h3>Secure + optimize</h3>
                        <p>Layer passwords, signatures, and compression without sacrificing quality.</p>
                        <div class="tag">Security-first</div>
                    </div>
                    <div class="step">
                        <span class="step-num">03</span>
                        <h3>Deliver anywhere</h3>
                        <p>Download instantly, email recipients, or push to cloud buckets automatically.</p>
                        <div class="tag">Multi-channel</div>
                    </div>
                </div>
            </section>

            <section class="cta" id="early-access">
                <div class="cta-inner">
                    <div>
                        <p class="eyebrow">Early access</p>
                        <h2>Be first to automate PDF workflows with Plughub.</h2>
                        <p class="muted">Plug into a modern utility built for teams that need PDF processing without the friction.</p>
                    </div>
                    <div class="cta-actions">
                        <a class="btn primary" href="mailto:<?= htmlspecialchars($contactEmail) ?>">Request access</a>
                        <a class="btn ghost" href="<?= htmlspecialchars($ctaSecondaryUrl) ?>">View capabilities</a>
                    </div>
                </div>
            </section>
        </main>

        <footer class="footer">
            <div class="footer-brand">
                <img src="assets/img/logo.svg" alt="<?= htmlspecialchars($appName) ?> logo">
                <div>
                    <p class="brand-name"><?= htmlspecialchars($appName) ?></p>
                    <p class="muted small">PDF utility with automation-first DNA.</p>
                </div>
            </div>
            <div class="footer-links">
                <a href="#features">Features</a>
                <a href="#workflow">Workflow</a>
                <a href="mailto:<?= htmlspecialchars($contactEmail) ?>">Contact</a>
            </div>
            <div class="footer-note">
                <span class="pill">Dark theme</span>
                <span class="pill">Fast setup</span>
            </div>
        </footer>
    </div>

    <script src="assets/js/app.js"></script>
</body>
</html>
