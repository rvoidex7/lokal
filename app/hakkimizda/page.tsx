import type { Metadata } from "next"
import AboutPageContent from "./about-content"

export const metadata: Metadata = {
  title: "Hakkımızda",
  description: "Lokal'in hikayesi, misyonu ve değerleri. Yerel toplulukları güçlendirmek için buradayız.",
}

export default function AboutPage() {
  return <AboutPageContent />
}
