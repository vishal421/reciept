/* Template8 – IndianOil Xtra Premium Receipt (Guruprasad Services, Malad Mumbai) */
class Template8 extends AbstractTemplate {
  constructor(containerElemId) {
    super(containerElemId);
    this.contentUri = 'templates/template-8/content.html';
    this.cssUri     = 'templates/template-8/style.css';
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
  }

  getConfig() {
    return {
      optionalFieldList: [],
      pumpLogoList: [
        { id: 'pumpLogo', name: 'Indian Oil',       uri: 'assets/images/logos/pump-logo-indian-oil.png', default: true },
        { id: 'pumpLogo', name: 'HP Oil',           uri: 'assets/images/logos/pump-logo-hp.png' },
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
        { id: 'stationName', name: 'Station Name',  defaultValue: 'GURUPRASAD SERVICES' },
        { id: 'address',     name: 'Address',       defaultValue: 'S V ROAD MALAD W-MUMBAI 64' },
        { id: 'telNum',      name: 'Tel. No.',      defaultValue: '28805142' },
        { id: 'receiptNo',   name: 'Receipt No.',   defaultValue: 'J1670' },
        { id: 'localId',     name: 'Local ID',      defaultValue: '00024735' },
        { id: 'fipNo',       name: 'FIP No.',       defaultValue: '07' },
        { id: 'nozzleNo',    name: 'Nozzle No.',    defaultValue: '03' },
        { id: 'product',     name: 'Product',       defaultValue: 'Xtra Prem' },
        { id: 'density',     name: 'Density',       defaultValue: '114.0Kg/Cu.mtr' },
        { id: 'presetType',  name: 'Preset Type',   defaultValue: 'Amount' },
        { id: 'rate',        name: 'Rate',          defaultValue: '080.33' },
        { id: 'volume',      name: 'Volume',        defaultValue: '00024.90' },
        { id: 'total',       name: 'Total',         defaultValue: '02000.00' },
        { id: 'vehicleNo',   name: 'Vehicle No.',   defaultValue: 'Not Enterd' },
        { id: 'mobileNo',    name: 'Mobile No.',    defaultValue: 'Not Enterd' },
        { id: 'date',        name: 'Date',          defaultValue: '10/10/17' },
        { id: 'time',        name: 'Time',          defaultValue: '09:48' },
        { id: 'cstNo',       name: 'CST No.',       defaultValue: '' },
        { id: 'lstNo',       name: 'LST No.',       defaultValue: '' },
        { id: 'vatNo',       name: 'VAT No.',       defaultValue: '2710701590' },
      ],
    };
  }
}
