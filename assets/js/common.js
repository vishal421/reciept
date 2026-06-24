/* ==========================================================
   common.js  —  Fuel Bill Generator
   Handles: template switching, form rendering, live preview,
   zoom slider, and PNG download via server.
   ========================================================== */
var templateIndex = 0;
var template      = null;

/* ----------------------------------------------------------
   Called once on page ready (from index.html inline script)
   ---------------------------------------------------------- */
async function onInit() {
  await onTemplateSelected();
}

/* ----------------------------------------------------------
   Switch active template and rebuild the whole form
   ---------------------------------------------------------- */
async function onTemplateSelected() {
  var checked = document.querySelector('input[name="template"]:checked');
  templateIndex = checked ? parseInt(checked.value, 10) : 0;
  template = templates[templateIndex];

  // Rebuild dynamic sections (texture, logo, optional, data)
  renderTemplateForm(template);

  // Fetch + inject template HTML/CSS into #template-container
  await template.render();

  // Push current form values into the freshly-rendered receipt.
  // IMPORTANT: this is what actually injects the #pumpLogo <img> into
  // #section-pump-logo (via tmpl.renderData -> template-specific code),
  // AFTER the pill tiles already exist from renderTemplateForm() above.
  generate(template);

  // CLS FIX (v3): lock section heights AFTER generate() has run, not
  // inside renderTemplateForm(). The old v2 fix called
  // preserveSectionHeight() on the logo body right after the pills were
  // appended, but BEFORE generate()->renderData() injected the #pumpLogo
  // <img> beneath them. That meant the lock only ever captured
  // "pills-only" height, so the jump to "pills + 70px image" on every
  // single render (including first paint) was never actually prevented —
  // which is exactly the 0.216 shift PageSpeed was attributing to this
  // element. Locking here, once everything for this render cycle has
  // been inserted, captures the true final height.
  lockAllSectionHeights();

  // Sync wrapper height to scaled content so the preview card doesn't overflow or collapse
  syncPreviewWrapperHeight();
}

/* ----------------------------------------------------------
   Lock min-height floors for all dynamic sections based on
   their CURRENT fully-rendered content (pills + any injected
   images/previews). Called once per render cycle, after both
   renderTemplateForm() and generate() have finished mutating
   the DOM — never mid-pipeline.
   ---------------------------------------------------------- */
function lockAllSectionHeights() {
  ['#section-paper-texture', '#section-pump-logo', '#section-optional-fields']
    .forEach(function(sel) {
      var section = document.querySelector(sel);
      if (!section || section.style.display === 'none') return;
      preserveSectionHeight(section.querySelector('.sec-card-body'));
    });
  var dataSection = document.getElementById('section-data');
  if (dataSection && dataSection.style.display !== 'none') {
    preserveSectionHeight(dataSection.querySelector('.sec-card-body .row'));
  }
}

/* ----------------------------------------------------------
   Sync the wrapper div height to the scaled template height.
   transform:scale doesn't affect layout flow, so without this
   the card would either collapse or have excessive white space.
   ---------------------------------------------------------- */
function syncPreviewWrapperHeight() {
  var container = document.getElementById('template-container');
  var wrapper   = container && container.parentElement;
  if (!container || !wrapper || !wrapper.classList.contains('preview-scale-wrapper')) return;

  // Get the computed scale from the CSS transform
  var style  = window.getComputedStyle(container);
  var matrix = new DOMMatrix(style.transform);
  var scaleY = matrix.m22 || 1;

  // Natural height × scale = visual height
  var naturalH = container.scrollHeight;
  wrapper.style.height = Math.round(naturalH * Math.abs(scaleY)) + 'px';
}

/* ----------------------------------------------------------
   CLS FIX (v2): Lock a card body's min-height BEFORE we clear
   its contents, not after we repopulate it.

   The original bug: renderTemplateForm() did
     body.innerHTML = ''          → collapses to the 52px CSS floor
     ...append new tiles...       → grows back past 52px
     lockSectionHeight(body)      → locks AFTER the regrow

   On a real browser (and on PSI desktop, which runs fast enough
   to actually paint between those two synchronous-looking steps
   once images/fonts resettle) that collapse-then-regrow is a
   visible, scored layout shift. Locking the height after the
   fact only protects the *next* render, not the one currently
   happening — and the very first render on page load has no
   prior lock to fall back on at all.

   Fix: capture the body's current rendered height and apply it
   as an inline min-height floor BEFORE innerHTML is touched.
   The box can still grow if new content is taller (we only ever
   raise the floor, never lower it), but it can never visibly
   collapse first.

   CLS FIX (v3) — see lockAllSectionHeights(): the per-section
   calls to this function INSIDE renderTemplateForm() (immediately
   after populating pills) have been removed for the texture,
   logo, and optional-fields sections. They were locking the
   height too early — before generate()->renderData() had a
   chance to inject section content (e.g. the #pumpLogo <img>)
   that belongs in the same card body. This function is still
   used for the "before clearing" half of the job (so a section
   never collapses to the bare CSS floor while we wipe its old
   content), and is now ALSO called once, centrally, after the
   full render cycle completes — that second call is what
   actually accounts for everything in the section, including
   content injected by generate().
   ---------------------------------------------------------- */
function preserveSectionHeight(body) {
  if (!body) return;
  var current = body.getBoundingClientRect().height;
  var existingMin = parseFloat(body.style.minHeight) || 0;
  if (current > existingMin) {
    body.style.minHeight = current + 'px';
  }
}

/* ----------------------------------------------------------
   Build the four dynamic panels from template config
   ---------------------------------------------------------- */
function renderTemplateForm(tmpl) {
  var cfg = tmpl.getConfig();

  /* ── Paper Texture (text-only pill buttons) ── */
  var texSection = document.getElementById('section-paper-texture');
  var texList    = cfg.paperTextureList || [];
  if (texList.length === 0) {
    texSection.style.display = 'none';
  } else {
    texSection.style.display = '';
    var texBody = texSection.querySelector('.sec-card-body');
    // CLS FIX: lock height to current rendered size BEFORE clearing,
    // so the box never collapses to the bare CSS floor mid-rebuild.
    preserveSectionHeight(texBody);
    texBody.innerHTML = '';
    texList.forEach(function(f, i) {
      var lbl = document.createElement('label');
      lbl.className = 'texture-pill';
      var isDefault = f.default || i === 0;
      lbl.innerHTML =
        '<input type="radio" name="' + f.id + '" value="' + f.uri + '" ' + (isDefault ? 'checked' : '') + ' />' +
        '<span>' + f.name + '</span>';
      lbl.querySelector('input').addEventListener('change', function() { generate(tmpl); });
      texBody.appendChild(lbl);
    });
    // NOTE (v3): the "lock after populate" call that used to sit here was
    // removed — see lockAllSectionHeights(), which now does this once,
    // centrally, after generate() has also run for this render cycle.
  }

  /* ── Pump Logo ── */
  var logoSection = document.getElementById('section-pump-logo');
  var logoList    = cfg.pumpLogoList || [];
  if (logoList.length === 0) {
    logoSection.style.display = 'none';
  } else {
    logoSection.style.display = '';
    var logoBody = logoSection.querySelector('.sec-card-body');
    // CLS FIX: lock BEFORE clearing — see preserveSectionHeight() comment above.
    preserveSectionHeight(logoBody);
    logoBody.innerHTML = '';
    logoList.forEach(function(f, i) {
      var lbl = document.createElement('label');
      lbl.className = 'logo-tile';
      var isDefault = f.default || i === 0;
      lbl.innerHTML =
        '<input type="radio" name="' + f.id + '" value="' + f.uri + '" ' + (isDefault ? 'checked' : '') + ' />' +
        '<span>' + f.name + '</span>';
      lbl.querySelector('input').addEventListener('change', function() { generate(tmpl); });
      logoBody.appendChild(lbl);
    });
    // NOTE (v3): removed the "lock after populate" call here too — at this
    // point in the pipeline the #pumpLogo <img> hasn't been injected yet
    // (that happens later, in generate()->renderData()), so locking now
    // would repeat the exact v2 bug: capturing "pills-only" height as the
    // floor and then letting the image addition blow past it, uncounted.
  }

  /* ── Optional Fields ── */
  var optSection = document.getElementById('section-optional-fields');
  var optList    = cfg.optionalFieldList || [];
  if (optList.length === 0) {
    optSection.style.display = 'none';
  } else {
    optSection.style.display = '';
    var optBody = optSection.querySelector('.sec-card-body');
    // CLS FIX: lock BEFORE clearing — see preserveSectionHeight() comment above.
    preserveSectionHeight(optBody);
    optBody.innerHTML = '';
    optList.forEach(function(f) {
      var lbl = document.createElement('label');
      lbl.className = 'opt-field-label';
      lbl.innerHTML =
        '<input type="checkbox" class="optional-fields" name="' + f.id + '" value="' + f.value + '" ' + (f.checked ? 'checked' : '') + ' />' +
        f.name;
      lbl.querySelector('input').addEventListener('change', function() { generate(tmpl); });
      optBody.appendChild(lbl);
    });
    // NOTE (v3): "lock after populate" call removed — see lockAllSectionHeights().
  }

  /* ── Data Fields ── */
  var dataSection = document.getElementById('section-data');
  var fieldList   = cfg.fieldList || [];
  if (fieldList.length === 0) {
    dataSection.style.display = 'none';
  } else {
    dataSection.style.display = '';
    var dataRow = dataSection.querySelector('.sec-card-body .row');
    // CLS FIX: same pattern applied here for consistency, in case future
    // templates vary field counts enough to change this row's height.
    preserveSectionHeight(dataRow);
    dataRow.innerHTML = '';
    fieldList.forEach(function(f) {
      var col = document.createElement('div');
      // Address gets full width; everything else half-width
      col.className = (f.id === 'address' || f.id === 'name') ? 'col-sm-12' : 'col-sm-6';
      var inputId = 'field-' + f.id;
      col.innerHTML =
        '<div class="data-field-group">' +
          '<label for="' + inputId + '">' + f.name + '</label>' +
          '<input type="text" id="' + inputId + '" class="text-input" name="' + f.id + '" value="' + (f.defaultValue || '') + '" aria-label="' + f.name + '" />' +
        '</div>';
      col.querySelector('input').addEventListener('input', function() { generate(tmpl); });
      dataRow.appendChild(col);
    });
    // NOTE (v3): "lock after populate" call removed — see lockAllSectionHeights().
  }
}

/* ----------------------------------------------------------
   Read every form control and push values into the receipt
   ---------------------------------------------------------- */
function generate(tmpl) {
  if (!tmpl) return;
  var data = {};

  // Texture
  var texRadio = document.querySelector('#section-paper-texture input[type="radio"]:checked');
  if (texRadio) data['texture'] = texRadio.value;

  // Logo
  var logoRadio = document.querySelector('#section-pump-logo input[type="radio"]:checked');
  if (logoRadio) data['pumpLogo'] = logoRadio.value;

  // Optional checkboxes
  document.querySelectorAll('#section-optional-fields input[type="checkbox"]').forEach(function(cb) {
    data[cb.name] = cb.checked ? cb.value : '';
  });

  // Text inputs
  document.querySelectorAll('#section-data input[type="text"]').forEach(function(inp) {
    data[inp.name] = inp.value;
  });

  tmpl.renderData(data);

  // CLS FIX (v3): re-lock section heights after EVERY generate() call too,
  // not just after the initial template-switch render. generate() fires on
  // every radio change / checkbox toggle / text input — including the logo
  // radio change, which swaps which #pumpLogo image src is shown and can
  // change this section's height again. Without this, only the very first
  // render was protected and subsequent in-place updates (e.g. picking a
  // different logo) could still shift layout.
  lockAllSectionHeights();
}

/* ----------------------------------------------------------
   PNG Download  — POST outerHTML to /api/download-receipt
   ---------------------------------------------------------- */
function downloadReceipt() {
  var btn       = document.getElementById('downloadButton');
  var container = document.getElementById('template-container');
  if (!container) return;

  var origLabel = btn.textContent;
  btn.disabled    = true;
  btn.textContent = '⏳ Generating…';

  // Temporarily remove transform so we capture true unscaled size
  var prevTransform = container.style.transform || '';
  container.style.transform = 'none';

  setTimeout(function() {
    var width  = container.offsetWidth;
    var height = container.offsetHeight;
    var html   = container.outerHTML;

    // Restore visual state
    container.style.transform = prevTransform;
    // FIX: re-sync wrapper height after restoring transform to prevent layout shift
    syncPreviewWrapperHeight();

    fetch('/api/download-receipt', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ html: html, width: width, height: height }),
    })
    .then(function(res) {
      if (!res.ok) return res.json().then(function(e) { throw new Error(e.error || 'Server error ' + res.status); });
      return res.blob();
    })
    .then(function(blob) {
      var url = URL.createObjectURL(blob);
      var a   = document.createElement('a');
      a.href     = url;
      a.download = 'fuel-receipt.png';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    })
    .catch(function(err) {
      console.error('Download failed:', err);
      alert('Download failed: ' + err.message);
    })
    .finally(function() {
      btn.disabled    = false;
      btn.textContent = origLabel;
    });
  }, 80);
}

/* ----------------------------------------------------------
   PDF Download  — POST outerHTML to /api/download-receipt-pdf
   Single-page, high-quality output is handled server-side via
   Puppeteer with deviceScaleFactor:2 and exact element sizing.
   ---------------------------------------------------------- */
function downloadReceiptPdf() {
  var btn       = document.getElementById('downloadPdfButton');
  var container = document.getElementById('template-container');
  if (!container) return;

  var origLabel = btn.textContent;
  btn.disabled    = true;
  btn.textContent = '⏳ Generating PDF…';

  // Temporarily remove CSS transform so we capture true unscaled dimensions.
  var prevTransform = container.style.transform || '';
  container.style.transform = 'none';

  setTimeout(function() {
    var width  = container.offsetWidth;
    var height = container.offsetHeight;
    var html   = container.outerHTML;

    // Restore transform immediately after measuring
    container.style.transform = prevTransform;
    // FIX: re-sync wrapper height after restoring transform to prevent layout shift
    syncPreviewWrapperHeight();

    fetch('/api/download-receipt-pdf', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ html: html, width: width, height: height }),
    })
    .then(function(res) {
      if (!res.ok) return res.json().then(function(e) { throw new Error(e.error || 'Server error ' + res.status); });
      return res.blob();
    })
    .then(function(blob) {
      var url = URL.createObjectURL(blob);
      var a   = document.createElement('a');
      a.href     = url;
      a.download = 'fuel-receipt.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    })
    .catch(function(err) {
      console.error('PDF download failed:', err);
      alert('PDF download failed: ' + err.message);
    })
    .finally(function() {
      btn.disabled    = false;
      btn.textContent = origLabel;
    });
  }, 80);
}
