/* Template6 – IndianOil FCC Receipt (RR Nagar, Bangalore) */
class Template6 extends AbstractTemplate {
  constructor(containerElemId) {
    super(containerElemId);
    this.contentUri = 'templates/template-6/content.html';
    this.cssUri     = 'templates/template-6/style.css';
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
        { id: 'texture', name: 'Texture 1', uri: 'assets/images/textures/texture-1.jpeg', default: true },
        { id: 'texture', name: 'Texture 2', uri: 'assets/images/textures/texture-2.jpeg' },
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
        { id: 'stationName',  name: 'Station Name',  defaultValue: 'OM SAI PETRO' },
        { id: 'address',      name: 'Address',       defaultValue: 'R R NAGAR BANGALURU 98' },
        { id: 'telNum',       name: 'Tel. No.',      defaultValue: '08028602412' },
        { id: 'receiptNo',    name: 'Receipt No.',   defaultValue: 'H0262' },
        { id: 'fccId',        name: 'FCC ID',        defaultValue: '300049560' },
        { id: 'fipNo',        name: 'FIP No.',       defaultValue: '01' },
        { id: 'nozzleNo',     name: 'Nozzle No.',    defaultValue: '01' },
        { id: 'product',      name: 'Product',       defaultValue: 'Diesel' },
        { id: 'presetType',   name: 'Preset Type',   defaultValue: 'Amount' },
        { id: 'ratePerL',     name: 'Rate (Rs/L)',   defaultValue: '087.89' },
        { id: 'volumeL',      name: 'Volume (L)',    defaultValue: '00021.95' },
        { id: 'amount',       name: 'Amount (Rs)',   defaultValue: '01929.19' },
        { id: 'atot',         name: 'Atot',          defaultValue: '00018806848.34' },
        { id: 'vtot',         name: 'Vtot',          defaultValue: '0000213990.780' },
        { id: 'vehicleNo',    name: 'Vehicle No.',   defaultValue: '3055' },
        { id: 'mobileNo',     name: 'Mobile No.',    defaultValue: 'Not Entered' },
        { id: 'date',         name: 'Date',          defaultValue: '08/08/23' },
        { id: 'time',         name: 'Time',          defaultValue: '15:50' },
        { id: 'cstNo',        name: 'CST No.',       defaultValue: '' },
        { id: 'lstNo',        name: 'LST No.',       defaultValue: '' },
        { id: 'vatNo',        name: 'VAT No.',       defaultValue: '' },
        { id: 'attendantId',  name: 'Attendant ID',  defaultValue: 'Not Available' },
        { id: 'fccDate',      name: 'FCC Date',      defaultValue: 'Not Available' },
        { id: 'fccTime',      name: 'FCC Time',      defaultValue: 'Not Available' },
      ],
    };
  }
}
