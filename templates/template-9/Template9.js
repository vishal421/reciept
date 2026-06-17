class Template9 extends AbstractTemplate {
  constructor(containerElemId) {
    super(containerElemId);
    this.contentUri = 'templates/template-9/content.html';
    this.cssUri     = 'templates/template-9/style.css';
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
        { id: 'texture', name: 'Texture 1',  uri: 'assets/images/textures/texture-1.jpeg',  default: true },
        { id: 'texture', name: 'Texture 2',  uri: 'assets/images/textures/texture-2.jpeg' },
        { id: 'texture', name: 'Texture 3',  uri: 'assets/images/textures/texture-3.jpeg' },
        { id: 'texture', name: 'Texture 4',  uri: 'assets/images/textures/texture-4.jpg' },
        { id: 'texture', name: 'Texture 5',  uri: 'assets/images/textures/texture-5.jpg' },
        { id: 'texture', name: 'Texture 6',  uri: 'assets/images/textures/texture-6.jpeg' },
        { id: 'texture', name: 'Texture 7',  uri: 'assets/images/textures/texture-7.jpg' },
        { id: 'texture', name: 'Texture 8',  uri: 'assets/images/textures/texture-8.jpg' },
        { id: 'texture', name: 'Texture 9',  uri: 'assets/images/textures/texture-9.jpg' },
        { id: 'texture', name: 'Texture 10', uri: 'assets/images/textures/texture-10.jpg' },
        { id: 'texture', name: 'Texture 11', uri: 'assets/images/textures/texture-11.jpg' },
        { id: 'texture', name: 'Texture 12', uri: 'assets/images/textures/texture-12.jpg' },
        { id: 'texture', name: 'Texture 13', uri: 'assets/images/textures/texture-13.jpg' },
        { id: 'texture', name: 'Texture 14', uri: 'assets/images/textures/texture-14.jpg' },
        { id: 'texture', name: 'Texture 15', uri: 'assets/images/textures/texture-15.png' },
      ],
      fieldList: [
        { id: 'stationName',  name: 'Station Name',   defaultValue: 'OM SAI FILLING STATION' },
        { id: 'stationId',    name: 'Station ID',     defaultValue: '289174' },
        { id: 'address',      name: 'Address',        defaultValue: 'GAUR CITY 2, GREATER NOIDA WEST' },
        { id: 'mobNo',        name: 'Mobile No',      defaultValue: '9990175942' },
        { id: 'billNo',       name: 'Bill No',        defaultValue: 'Jun-122813-ORGNE' },
        { id: 'trnsId',       name: 'Transaction ID', defaultValue: '00000000000007480' },
        { id: 'atndId',       name: 'Attendant ID',   defaultValue: '' },
        { id: 'receiptType',  name: 'Receipt Type',   defaultValue: 'Physical Receipt' },
        { id: 'vehNo',        name: 'Vehicle No',     defaultValue: 'NotEntered' },
        { id: 'custMob',      name: 'Customer Mobile',defaultValue: 'NotEntered' },
        { id: 'date',         name: 'Date',           defaultValue: '03/06/2026' },
        { id: 'time',         name: 'Time',           defaultValue: '19:24:53' },
        { id: 'fpId',         name: 'FP ID',          defaultValue: '1' },
        { id: 'nozzleNo',     name: 'Nozzle No',      defaultValue: '2' },
        { id: 'fuel',         name: 'Fuel Type',      defaultValue: 'DIESEL' },
        { id: 'preset',       name: 'Preset',         defaultValue: '99L' },
        { id: 'rate',         name: 'Rate',           defaultValue: 'Rs.95.37' },
        { id: 'sale',         name: 'Sale Amount',    defaultValue: 'Rs.4300.23' },
        { id: 'volume',       name: 'Volume',         defaultValue: '45.09L' },
        { id: 'gvrNo',        name: 'GVR No',         defaultValue: 'GVR 1187' },
      ],
    };
  }
}
