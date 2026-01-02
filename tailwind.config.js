/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: [
        "./index.html",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./node_modules/primereact/**/*.{js,ts,jsx,tsx}",
        "./src/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/views/*.{js,ts,jsx,tsx,mdx}",
      ],
  important: false, 
  theme: {
    extend: {
      maxWidth: {
        '130': '130%',
      },
      colors: {
        lime: {
          9000: '#88d600', // Ajusta el nombre y la tonalidad según tus necesidades
        },
      },
      height: {
        900: "90%"
      },
      width: {
        900: "98%",
        106: "106px",
        318: "318px",
        500: "180px",
        600: "281px"
      },
      minWidth:{
        106: "106px",
        318: "318px",
      },  
      margin:{
        0: "3px"
      },
      screens: {
        xxs: '320px',
        xs: '360px', // Define el tamaño del breakpoint según tus necesidades
      },
    },
  },
  plugins: [
    require('tailwind-scrollbar'),
  ],
}
