import QRCode from 'qrcode';

export const qrCodeService = {
  async generateDataURL(text: string) {
    try {
      return await QRCode.toDataURL(text, {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        margin: 1,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      });
    } catch (err) {
      console.error('❌ QR Code generation error:', err);
      throw err;
    }
  },

  async generateSVG(text: string) {
    try {
      return await QRCode.toString(text, {
        type: 'svg',
        margin: 1,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      });
    } catch (err) {
      console.error('❌ QR Code SVG generation error:', err);
      throw err;
    }
  }
};
