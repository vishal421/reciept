/**
 * AbstractTemplate – base class for all receipt templates.
 * Fetches template HTML + CSS and injects them into a container element.
 */
class AbstractTemplate {
  constructor(containerElemId) {
    this.containerElemId = containerElemId;
    this.rendered = false;
    this.rootElem = null;
    this._cssLink = null;
  }

  async render() {
    const container = document.getElementById(this.containerElemId);
    if (!container) throw new Error('Container #' + this.containerElemId + ' not found');

    // Swap CSS
    if (this._cssLink) { this._cssLink.remove(); this._cssLink = null; }
    if (this.cssUri) {
      this._cssLink = document.createElement('link');
      this._cssLink.rel  = 'stylesheet';
      this._cssLink.href = this.cssUri;
      document.head.appendChild(this._cssLink);
      await new Promise(res => {
        this._cssLink.onload  = res;
        this._cssLink.onerror = res;
        setTimeout(res, 500);
      });
    }

    // Load template HTML
    const resp = await fetch(this.contentUri);
    if (!resp.ok) throw new Error('Failed to load template: ' + this.contentUri);
    container.innerHTML = await resp.text();

    // Force a style recalc/paint so the freshly-injected CSS is applied
    // before renderData runs (fixes logo mis-alignment on first load)
    container.getBoundingClientRect();
    await new Promise(res => setTimeout(res, 50));

    // jQuery-style helper bound to container
    this.rootElem = {
      find(selector) {
        const els = container.querySelectorAll(selector);
        return {
          text(val)       { els.forEach(el => el.textContent = val); },
          attr(attr, val) { els.forEach(el => el.setAttribute(attr, val)); },
          show()          { els.forEach(el => el.style.display = ''); },
          hide()          { els.forEach(el => el.style.display = 'none'); },
          css(prop, val)  { els.forEach(el => el.style[prop] = val); },
        };
      },
      /**
       * Set field text. Handles two HTML patterns:
       *   Pattern A: <span id="fieldId" class="data">  → the element itself is the target
       *   Pattern B: <div id="fieldId"><span class="data">  → a child .data is the target
       */
      setField(idSelector, val) {
        const el = container.querySelector(idSelector);
        if (!el) return;
        // Check if this element itself is .data
        if (el.classList.contains('data')) {
          el.textContent = val;
        } else {
          // Try to find a .data child
          const child = el.querySelector('.data');
          if (child) {
            child.textContent = val;
          } else {
            // Fallback: set the element's text directly
            el.textContent = val;
          }
        }
      },
    };

    this.rendered = true;
  }

  /**
   * Default renderData — handles the 95% case shared across all templates:
   * field values, pump logo, texture background, optional field visibility.
   * Individual templates can override this if they need custom behaviour,
   * but most don't — this eliminates 9 identical copies of the same method.
   */
  renderData(data) {
    if (!this.rendered) throw new Error('Call render() first');

    this.getConfig().fieldList.forEach(f => {
      const val = data[f.id] !== undefined ? data[f.id] : '';
      this.rootElem.setField('#' + f.id, val);
    });

    const logo = data['pumpLogo'];
    if (logo) this.rootElem.find('#pumpLogo').attr('src', logo);

    const tex = data['texture'];
    if (tex) this.rootElem.find('.template-container').css('backgroundImage', "url('" + tex + "')");

    const optList = this.getConfig().optionalFieldList || [];
    optList.forEach(f => {
      if (data[f.id]) this.rootElem.find('#' + f.refId).show();
      else            this.rootElem.find('#' + f.refId).hide();
    });
  }

  getConfig() { throw new Error('getConfig() must be implemented'); }
}
