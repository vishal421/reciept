/* Template7 – IndianOil New Bombay Service Center (Navi Mumbai HDFC Bank style) */
class Template7 extends AbstractTemplate {
  constructor(containerElemId) {
    super(containerElemId);
    this.contentUri = 'templates/template-7/content.html';
    this.cssUri     = 'templates/template-7/style.css';
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
        { id: 'texture', name: 'Texture 2', uri: 'assets/images/textures/texture-2.jpeg', default: true },
        { id: 'texture', name: 'Texture 3', uri: 'assets/images/textures/texture-3.jpeg' },
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
        { id: 'stationName', name: 'Station Name',  defaultValue: 'NEW BOMBAY SER.CENTER.' },
        { id: 'address',     name: 'Address',       defaultValue: 'PLOT.10/11 SEC.20. K.K.NAVI MUM.400709.' },
        { id: 'telNum',      name: 'Tel. No.',      defaultValue: '022-27542622/0167.' },
        { id: 'gstNo',       name: 'GST No.',       defaultValue: '27AADFN6204A1ZU.' },
        { id: 'billNo',      name: 'Bill No.',      defaultValue: '133008-ORGNL' },
        { id: 'trnsId',      name: 'Trns. ID',      defaultValue: '' },
        { id: 'atndId',      name: 'Atnd. ID',      defaultValue: '' },
        { id: 'vehiNo',      name: 'Vehi. No.',     defaultValue: 'NotEntered' },
        { id: 'date',        name: 'Date',           defaultValue: '04/01/20' },
        { id: 'time',        name: 'Time',           defaultValue: '11:56:08' },
        { id: 'fpId',        name: 'FP. ID',         defaultValue: '3' },
        { id: 'nozlNo',      name: 'Nozl No.',       defaultValue: '3' },
        { id: 'fuel',        name: 'Fuel',           defaultValue: 'PETROL.' },
        { id: 'density',     name: 'Density',        defaultValue: '7447kg/m3' },
        { id: 'preset',      name: 'Preset',         defaultValue: 'Rs.200' },
        { id: 'rate',        name: 'Rate',           defaultValue: 'Rs.81.15' },
        { id: 'sale',        name: 'Sale',           defaultValue: 'Rs.200.00' },
        { id: 'volume',      name: 'Volume',         defaultValue: '2.46Lts.' },
        { id: 'vatNo',       name: 'VAT No.',        defaultValue: '27120299321.V.2006' },
        { id: 'cstNo',       name: 'CST No.',        defaultValue: '27120299321.C.2006' },
      ],
    };
  }
}
