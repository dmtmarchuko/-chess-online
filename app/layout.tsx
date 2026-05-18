import '../public/scss/index.css'
import {Roboto} from 'next/font/google'


const roboto = Roboto({
  weight: ['400', '500'],
  subsets: ['latin'],
})


export const metadata = {
  title: "Chess App",
  description: "Chess App",
};

export default function RootLayout({ children } : {children: any}) {
  return (
    <html lang="en"> 
      <body className={roboto.className}>
          {children}
      </body>
    </html>
  );
}