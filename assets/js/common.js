/* ==========================================================
   common.js  —  Fuel Bill Generator
   Handles: template switching, form rendering, live preview,
   zoom slider, and PNG download via server.

   COMPANION HTML FIX (add to <head>, alongside the existing
   texture/logo preloads): the DEFAULT template's style.css and
   content.html are currently fetched cold, only after JS calls
   template.render() on page load — that's up to ~550ms
   (500ms CSS-load wait + 50ms settle delay in
   AbstractTemplate.render()) during which #template-container's
   final height is unknown. Preloading these two for template
   index 0 lets the browser start fetching them immediately,
   shrinking that unstable window:

     <link rel="preload" href="templates/template-1/style.css" as="style" />
     <link rel="preload" href="templates/template-1/content.html" as="fetch" crossorigin />

   This doesn't replace the JS fix below — it reduces how long
   the unknown-height window lasts, which is what lockPreviewWrapperHeight()
   /syncPreviewWrapperHeight() are bridging.
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

  // CLS FIX (v4 — the real fix): lock the PREVIEW WRAPPER's height to its
  // current rendered size BEFORE template.render() wipes and replaces
  // #template-container's innerHTML. render() does an async CSS <link>
  // load (up to 500ms) + an async fetch() of content.html + a fixed 50ms
  // settle delay — during all of that, the container's natural height is
  // unknown/unstable, and whatever finally lands can be taller or shorter
  // than the 480px CSS guess on .preview-scale-wrapper. Because the preview
  // column is sticky and sits beside the left control panel, PSI attributes
  // the resulting shift to whichever element occupies that screen region —
  // which on desktop reports as #section-pump-logo / the trust-badge block,
  // even though neither of those boxes actually changed size themselves.
  // Locking the wrapper height pre-emptively (and only ever raising it,
  // never lowering it) prevents the collapse-then-grow entirely.
  lockPreviewWrapperHeight();

  // Rebuild dynamic sections (texture, logo, optional, data)
  renderTemplateForm(template);

  // Fetch + inject template HTML/CSS into #template-container
  await template.render();

  // Push current form values into the freshly-rendered receipt
  generate(template);

  // Sync wrapper height to scaled content so the preview card doesn't overflow or collapse
  syncPreviewWrapperHeight();
}

/* ----------------------------------------------------------
   CLS FIX (v4): capture the preview wrapper's current on-screen
   height and apply it as an inline min-height BEFORE
   template.render() touches #template-container's contents.
   Mirrors preserveSectionHeight()'s "lock before clear" pattern,
   but targets the actual unstable element (the receipt preview),
   not the left-column control sections.
   ---------------------------------------------------------- */
function lockPreviewWrapperHeight() {
  var container = document.getElementById('template-container');
  var wrapper   = container && container.parentElement;
  if (!wrapper || !wrapper.classList.contains('preview-scale-wrapper')) return;

  var current     = wrapper.getBoundingClientRect().height;
  var existingMin  = parseFloat(wrapper.style.minHeight) || 0;
  if (current > existingMin) {
    wrapper.style.minHeight = current + 'px';
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
  var targetH  = Math.round(naturalH * Math.abs(scaleY));

  // CLS FIX (v4): only ever grow the locked floor set by
  // lockPreviewWrapperHeight(), never shrink below it here — otherwise
  // this call (which runs AFTER render+generate, i.e. after the content
  // that matters has already painted once) could itself cause a second,
  // smaller shift by snapping the wrapper down to a tighter fit.
  var existingMin = parseFloat(wrapper.style.minHeight) || 0;
  wrapper.style.height   = Math.max(targetH, existingMin) + 'px';
  wrapper.style.minHeight = Math.max(targetH, existingMin) + 'px';
}

/* ----------------------------------------------------------
   CLS FIX (v2): Lock a card body's min-height BEFORE we clear
   its contents, not after we repopulate it.
   (Left-column sections — texture/logo/optional/data pills.
   NOTE: investigation confirmed these were never the actual
   source of the reported 0.216 shift. #pumpLogo is rendered
   INSIDE #template-container — the receipt preview — via
   AbstractTemplate.renderData(), not inside this left-column
   #section-pump-logo card at all. That card's own pill content
   is fully synchronous and stable. Kept here because it's still
   correct defensive practice for these sections, but the v4 fix
   above (lockPreviewWrapperHeight) is what actually addresses
   the measured CLS.)
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
    preserveSectionHeight(texBody);
  }

  /* ── Pump Logo ── */
  var logoSection = document.getElementById('section-pump-logo');
  var logoList    = cfg.pumpLogoList || [];
  if (logoList.length === 0) {
    logoSection.style.display = 'none';
  } else {
    logoSection.style.display = '';
    var logoBody = logoSection.querySelector('.sec-card-body');
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
    preserveSectionHeight(logoBody);
  }

  /* ── Optional Fields ── */
  var optSection = document.getElementById('section-optional-fields');
  var optList    = cfg.optionalFieldList || [];
  if (optList.length === 0) {
    optSection.style.display = 'none';
  } else {
    optSection.style.display = '';
    var optBody = optSection.querySelector('.sec-card-body');
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
    preserveSectionHeight(optBody);
  }

  /* ── Data Fields ── */
  var dataSection = document.getElementById('section-data');
  var fieldList   = cfg.fieldList || [];
  if (fieldList.length === 0) {
    dataSection.style.display = 'none';
  } else {
    dataSection.style.display = '';
    var dataRow = dataSection.querySelector('.sec-card-body .row');
    preserveSectionHeight(dataRow);
    dataRow.innerHTML = '';
    fieldList.forEach(function(f) {
      var col = document.createElement('div');
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
    preserveSectionHeight(dataRow);
  }
}

/* ----------------------------------------------------------
   Read every form control and push values into the receipt
   ---------------------------------------------------------- */
function generate(tmpl) {
  if (!tmpl) return;
  var data = {};

  var texRadio = document.querySelector('#section-paper-texture input[type="radio"]:checked');
  if (texRadio) data['texture'] = texRadio.value;

  var logoRadio = document.querySelector('#section-pump-logo input[type="radio"]:checked');
  if (logoRadio) data['pumpLogo'] = logoRadio.value;

  document.querySelectorAll('#section-optional-fields input[type="checkbox"]').forEach(function(cb) {
    data[cb.name] = cb.checked ? cb.value : '';
  });

  document.querySelectorAll('#section-data input[type="text"]').forEach(function(inp) {
    data[inp.name] = inp.value;
  });

  tmpl.renderData(data);

  // CLS FIX (v4): re-sync after every in-place update too (e.g. switching
  // logo/texture without switching templates) — renderData() can change
  // #pumpLogo's src or the background texture, either of which can alter
  // #template-container's natural height without going through render().
  syncPreviewWrapperHeight();
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

  var prevTransform = container.style.transform || '';
  container.style.transform = 'none';

  setTimeout(function() {
    var width  = container.offsetWidth;
    var height = container.offsetHeight;
    var html   = container.outerHTML;

    container.style.transform = prevTransform;
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
   ---------------------------------------------------------- */
function downloadReceiptPdf() {
  var btn       = document.getElementById('downloadPdfButton');
  var container = document.getElementById('template-container');
  if (!container) return;

  var origLabel = btn.textContent;
  btn.disabled    = true;
  btn.textContent = '⏳ Generating PDF…';

  var prevTransform = container.style.transform || '';
  container.style.transform = 'none';

  setTimeout(function() {
    var width  = container.offsetWidth;
    var height = container.offsetHeight;
    var html   = container.outerHTML;

    container.style.transform = prevTransform;
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
