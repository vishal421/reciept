/* Template4 – IndianOil Digital Receipt (Chennai / HDFC Bank style) */
class Template4 extends AbstractTemplate {
  constructor(containerElemId) {
    super(containerElemId);
    this.contentUri = 'templates/template-4/content.html';
    this.cssUri     = 'templates/template-4/style.css';
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
        { id: 'showLST', name: 'LST No.', refId: 'lstNoRow', value: 'true', checked: false },
        { id: 'showVAT', name: 'VAT No.', refId: 'vatNoRow', value: 'true', checked: false },
      ],
      pumpLogoList: [
        { id: 'pumpLogo', name: 'Indian Oil',       uri: 'assets/images/logos/pump-logo-indian-oil.png', default: true },
        { id: 'pumpLogo', name: 'HP Oil',           uri: 'assets/images/logos/pump-logo-hp.png' },
        { id: 'pumpLogo', name: 'Bharat Petroleum', uri: 'assets/images/logos/pump-logo-bharat-petroleum.png' },
      ],
      paperTextureList: [
        { id: 'texture', name: 'Texture 1', uri: 'assets/images/textures/texture-1.jpeg', default: true },
        { id: 'texture', name: 'Texture 2', uri: 'assets/images/textures/texture-2.jpeg' },
        { id: 'texture', name: 'Texture 3', uri: 'assets/images/textures/texture-3.jpeg' },
        { id: 'texture', name: 'Texture 4', uri: 'assets/images/textures/texture-4.jpg'  },
        { id: 'texture', name: 'Texture 6', uri: 'assets/images/textures/texture-6.jpeg' },
      ],
      fieldList: [
        { id: 'stationName',    name: 'Station Name',    defaultValue: 'SHYAMALA & COMPANY' },
        { id: 'address',        name: 'Address',         defaultValue: 'PH Road, Chennai' },
        { id: 'telNum',         name: 'Tel. No.',        defaultValue: '' },
        { id: 'receiptNo',      name: 'Receipt No.',     defaultValue: '001710' },
        { id: 'fccId',          name: 'FCC ID',          defaultValue: '000003598' },
        { id: 'fipNo',          name: 'FIP No.',         defaultValue: '26' },
        { id: 'nozzleNo',       name: 'Nozzle No.',      defaultValue: '01' },
        { id: 'product',        name: 'Product',         defaultValue: 'Petrol' },
        { id: 'ratePerLtr',     name: 'Rate/Ltr',        defaultValue: '101.50' },
        { id: 'amount',         name: 'Amount',          defaultValue: '500' },
        { id: 'volume',         name: 'Volume (Ltr.)',   defaultValue: '4.93 lt' },
        { id: 'vehType',        name: 'Veh Type',        defaultValue: 'Petrol' },
        { id: 'vehNo',          name: 'Veh No.',         defaultValue: '' },
        { id: 'customerName',   name: 'Customer Name',   defaultValue: '' },
        { id: 'date',           name: 'Date',            defaultValue: '01 Sep 2025' },
        { id: 'time',           name: 'Time',            defaultValue: '03:41' },
        { id: 'modeOfPayment',  name: 'Mode of Payment', defaultValue: 'Cash' },
        { id: 'lstNo',          name: 'LST No.',         defaultValue: '' },
        { id: 'vatNo',          name: 'VAT No.',         defaultValue: '' },
        { id: 'attendantId',    name: 'Attendant ID',    defaultValue: 'Not Available' },
      ],
    };
  }
}
