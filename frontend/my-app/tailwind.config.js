/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/**/*.{html,js,jsx,ts,tsx}', // Cấu hình đường dẫn của các file cần quét
  ],
  theme: {
    extend: {
      colors: {
        orange: '#FF6636', // Thêm màu cam với mã màu FF6636
        green:'#62D98B',
        gray:'#F2F2F2',
        dark_blue:'#1D3B54'
      },
    },
  },
  plugins: [],
}
