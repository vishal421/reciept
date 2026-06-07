/* Template5 – HP HPCL Fuel Receipt (Bengaluru / Sompura style) */
class Template5 extends AbstractTemplate {
  constructor(containerElemId) {
    super(containerElemId);
    this.contentUri = 'templates/template-5/content.html';
    this.cssUri     = 'templates/template-5/style.css';
  }

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

    this.getConfig().optionalFieldList.forEach(f => {
      if (data[f.id]) this.rootElem.find('#' + f.refId).show();
      else            this.rootElem.find('#' + f.refId).hide();
    });
  }

  getConfig() {
    return {
      optionalFieldList: [
        { id: 'showGST', name: 'GST No.', refId: 'gstNo', value: 'true', checked: false },
      ],
      pumpLogoList: [
        { id: 'pumpLogo', name: 'HP Oil',           uri: 'assets/images/logos/pump-logo-hp.png', default: true },
        { id: 'pumpLogo', name: 'Indian Oil',       uri: 'assets/images/logos/pump-logo-indian-oil.png' },
        { id: 'pumpLogo', name: 'Bharat Petroleum', uri: 'assets/images/logos/pump-logo-bharat-bw.png' },
      ],
      paperTextureList: [
        { id: 'texture', name: 'Texture 1', uri: 'assets/images/textures/texture-1.jpeg' },
        { id: 'texture', name: 'Texture 2', uri: 'assets/images/textures/texture-2.jpeg' },
        { id: 'texture', name: 'Texture 3', uri: 'assets/images/textures/texture-3.jpeg', default: true },
        { id: 'texture', name: 'Texture 4', uri: 'assets/images/textures/texture-4.jpg' },
        { id: 'texture', name: 'Texture 5', uri: 'assets/images/textures/texture-5.jpg' },
        { id: 'texture', name: 'Texture 6', uri: 'assets/images/textures/texture-6.jpeg' },
        { id: 'texture', name: 'Texture 7', uri: 'assets/images/textures/texture-7.jpg' },
        { id: 'texture', name: 'Texture 8', uri: 'assets/images/textures/texture-8.jpg' },
        { id: 'texture', name: 'Texture 9', uri: 'assets/images/textures/texture-9.jpg' },
        { id: 'texture', name: 'Texture 10', uri: 'assets/images/textures/texture-10.jpg' },
        { id: 'texture', name: 'Texture 11', uri: 'assets/images/textures/texture-11.jpg' },
        { id: 'texture', name: 'Texture 12', uri: 'assets/images/textures/texture-12.jpg' },
        { id: 'texture', name: 'Texture 13', uri: 'assets/images/textures/texture-13.jpg' },
        { id: 'texture', name: 'Texture 14', uri: 'assets/images/textures/texture-14.jpg' },
        { id: 'texture', name: 'Texture 15', uri: 'assets/images/textures/texture-15.png' },
      ],
      fieldList: [
        { id: 'stationName', name: 'Station Name',  defaultValue: 'SOMPURA SERVICE STATION' },
        { id: 'address',     name: 'Address',       defaultValue: '#55, SOMPURA GATE, SARJAPURA RODE BENGALURU 562125' },
        { id: 'billNo',      name: 'Bill No.',      defaultValue: '25388-ORGNL' },
        { id: 'trnsId',      name: 'Trns. ID',      defaultValue: '' },
        { id: 'atndId',      name: 'Atnd. ID',      defaultValue: '' },
        { id: 'vehiNo',      name: 'Vehi. No.',     defaultValue: 'NotEntered' },
        { id: 'date',        name: 'Date',           defaultValue: '04/01/2019' },
        { id: 'time',        name: 'Time',           defaultValue: '22:23:54' },
        { id: 'fpId',        name: 'FP. ID',         defaultValue: '1' },
        { id: 'nozlNo',      name: 'Nozl No.',       defaultValue: '1' },
        { id: 'fuel',        name: 'Fuel',           defaultValue: '' },
        { id: 'density',     name: 'Density',        defaultValue: '835.7kg/m3' },
        { id: 'preset',      name: 'Preset',         defaultValue: 'NON PRESET' },
        { id: 'rate',        name: 'Rate',           defaultValue: 'Rs.62.83' },
        { id: 'sale',        name: 'Sale',           defaultValue: 'Rs.2351.72' },
        { id: 'volume',      name: 'Volume',         defaultValue: '37.43Lts.' },
      ],
    };
  }
}
