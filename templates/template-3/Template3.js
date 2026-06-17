/* Template3 – IndianOil Cash Receipt (Amritsar dot-matrix style) */
class Template3 extends AbstractTemplate {
  constructor(containerElemId) {
    super(containerElemId);
    this.contentUri = 'templates/template-3/content.html';
    this.cssUri     = 'templates/template-3/style.css';
  }


  getConfig() {
    return {
      optionalFieldList: [
        { id: 'showGST', name: 'GST No.',  refId: 'gstNo', value: 'true', checked: false },
        { id: 'showTIN', name: 'TIN No.',  refId: 'tinNo', value: 'true', checked: false },
      ],
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
        { id: 'stationName', name: 'Station Name',  defaultValue: 'INDIAN OIL PLAZA' },
        { id: 'address',     name: 'Address',       defaultValue: '1 A COURT ROAD, DISTT AMRITSAR' },
        { id: 'telNum',      name: 'Tel. No',       defaultValue: '9501210216' },
        { id: 'rcptId',      name: 'RCPT ID',       defaultValue: '1064541250518' },
        { id: 'date',        name: 'Date',          defaultValue: '25/05/2018' },
        { id: 'time',        name: 'Time',          defaultValue: '06:45:41' },
        { id: 'trxId',       name: 'TRX. ID',       defaultValue: '13762' },
        { id: 'mopName',     name: 'MOP Name',      defaultValue: 'CASH' },
        { id: 'pumpNo',      name: 'Pump',          defaultValue: '5' },
        { id: 'nozzleNo',    name: 'Nozzle',        defaultValue: '2' },
        { id: 'product',     name: 'Product',       defaultValue: 'MS' },
        { id: 'quantity',    name: 'Quantity',      defaultValue: '5.980' },
        { id: 'unitRate',    name: 'Unit Rate',     defaultValue: '83.62' },
        { id: 'sale',        name: 'Sale',          defaultValue: '500.00' },
        { id: 'totalSale',   name: 'Total Sale',    defaultValue: '500.00' },
        { id: 'vehicleNo',   name: 'Vehicle No',    defaultValue: '' },
        { id: 'mobileNo',    name: 'Mobile No',     defaultValue: '' },
        { id: 'vehicleType', name: 'Vehicle Type',  defaultValue: '' },
      ],
    };
  }
}
