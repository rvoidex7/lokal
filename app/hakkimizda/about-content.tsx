"use client"

import { motion } from "motion/react"
import { Heart, Users, MapPin, Star, Target, Sparkles, Coffee, Calendar } from "lucide-react"
import { PageHero } from "@/components/page-hero"

export default function AboutPageContent() {
  const values = [
    {
      icon: Heart,
      title: "Topluluk",
      description: "Gerçek bağlantılar kurmak ve anlamlı ilişkiler geliştirmek için buradayız.",
    },
    {
      icon: Users,
      title: "Birliktelik",
      description: "Farklı geçmişlerden insanları bir araya getirip güzel anılar oluşturuyoruz.",
    },
    {
      icon: MapPin,
      title: "Yerellik",
      description: "Bulunduğunuz şehirdeki gizli köşeleri ve aktiviteleri keşfetmenize yardımcı oluyoruz.",
    },
    {
      icon: Star,
      title: "Kalite",
      description: "Her etkinliğin özenle planlanması ve katılımcıların memnuniyeti önceliğimiz.",
    },
  ]

  return (
    <div className="min-h-screen">
      {/* Modern Page Hero */}
      <PageHero
        title={
          <>
            <span className="text-[#0015ff]">Lokal</span> Hakkında
          </>
        }
        subtitle="Yerel toplulukları güçlendirmek ve insanları bir araya getirmek için kurulmuş bir platformuz. Amacımız, şehrinizde anlamlı bağlantılar kurmanıza ve unutulmaz deneyimler yaşamanıza yardımcı olmak."
        breadcrumbs={[
          { label: "Ana Sayfa", href: "/" },
          { label: "Hakkımızda" },
        ]}
      />

      <div className="container mx-auto px-4 py-16">
        {/* Story Section with Modern Card Design */}
        <motion.div
          className="mb-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <div className="relative bg-gradient-to-br from-white via-gray-50 to-white rounded-3xl p-8 md:p-12 shadow-xl border border-gray-100 overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#0015ff]/5 to-transparent rounded-full -translate-y-32 translate-x-32" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-[#0015ff]/5 to-transparent rounded-full translate-y-24 -translate-x-24" />
            
            <div className="relative z-10">
              <motion.div
                className="flex items-center gap-3 mb-6"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
              >
                <div className="w-12 h-12 bg-[#0015ff]/10 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-[#0015ff]" />
                </div>
                <h2 className="text-3xl md:text-4xl font-bold">Hikayemiz</h2>
              </motion.div>
              
              <div className="prose prose-lg max-w-none text-gray-600 space-y-6">
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  viewport={{ once: true }}
                >
                  Lokal, modern hayatın hızında kaybolmuş olan gerçek insan bağlantılarını yeniden canlandırma vizyonuyla
                  doğdu. Dijital dünyada geçirdiğimiz zamanın artmasıyla birlikte, yüz yüze etkileşimlerimiz azaldı ve
                  topluluk hissi zayıfladı.
                </motion.p>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  viewport={{ once: true }}
                >
                  Biz, teknolojinin gücünü kullanarak insanları fiziksel dünyada bir araya getirmeyi hedefliyoruz. Kahve
                  içmekten atölye çalışmalarına, oyun gecelerinden kültürel etkinliklere kadar geniş bir yelpazede
                  aktiviteler düzenleyerek, şehrinizde yeni arkadaşlıklar kurmanıza olanak sağlıyoruz.
                </motion.p>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  viewport={{ once: true }}
                >
                  Her etkinlik, katılımcıların güvenliği ve memnuniyeti gözetilerek özenle planlanır. Amacımız sadece
                  aktivite düzenlemek değil, kalıcı dostluklar ve güçlü topluluklar oluşturmaktır.
                </motion.p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Values Section with Simple Cards */}
        <motion.div
          className="mb-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Değerlerimiz</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Topluluğumuzu güçlü kılan ve bizi bir araya getiren temel değerler
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -5 }}
              >
                <div className="w-14 h-14 bg-gradient-to-br from-[#0015ff]/10 to-[#0015ff]/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <value.icon className="w-7 h-7 text-[#0015ff]" />
                </div>
                <h3 className="text-xl font-bold mb-3">{value.title}</h3>
                <p className="text-gray-600">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Features Section */}
        <motion.div
          className="mb-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Neler Sunuyoruz?</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Lokal'de sizi bekleyen deneyimler ve fırsatlar
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <motion.div
              className="group relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              whileHover={{ y: -5 }}
            >
              <div className="w-14 h-14 bg-gradient-to-br from-[#0015ff]/10 to-[#0015ff]/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Coffee className="w-7 h-7 text-[#0015ff]" />
              </div>
              <h3 className="text-xl font-bold mb-2">Sosyal Buluşmalar</h3>
              <p className="text-gray-600">
                Kahve sohbetlerinden piknik etkinliklerine kadar çeşitli sosyal aktiviteler
              </p>
            </motion.div>

            <motion.div
              className="group relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
              whileHover={{ y: -5 }}
            >
              <div className="w-14 h-14 bg-gradient-to-br from-[#0015ff]/10 to-[#0015ff]/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Target className="w-7 h-7 text-[#0015ff]" />
              </div>
              <h3 className="text-xl font-bold mb-2">Atölye Çalışmaları</h3>
              <p className="text-gray-600">
                Yeni beceriler öğrenin ve yaratıcılığınızı keşfedin
              </p>
            </motion.div>

            <motion.div
              className="group relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
              whileHover={{ y: -5 }}
            >
              <div className="w-14 h-14 bg-gradient-to-br from-[#0015ff]/10 to-[#0015ff]/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Calendar className="w-7 h-7 text-[#0015ff]" />
              </div>
              <h3 className="text-xl font-bold mb-2">Düzenli Etkinlikler</h3>
              <p className="text-gray-600">
                Her hafta yeni aktiviteler ve sürekli güncellenen etkinlik takvimi
              </p>
            </motion.div>
          </div>
        </motion.div>

        {/* Mission Section with Glassmorphism */}
        <motion.div
          className="relative rounded-3xl overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          {/* Background with gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#0015ff] via-[#0015ff] to-[#002aff]" />
          
          {/* Glass overlay */}
          <div className="absolute inset-0 bg-white/5 backdrop-blur-sm" />
          
          {/* Animated shapes */}
          <motion.div
            className="absolute top-10 right-10 w-32 h-32 bg-white/10 rounded-full"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute bottom-10 left-10 w-24 h-24 bg-white/10 rounded-full"
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.5, 0.3, 0.5],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          
          {/* Content */}
          <div className="relative z-10 text-center text-white p-12 md:p-16">
            <motion.div
              className="flex justify-center mb-6"
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              transition={{ duration: 0.5, type: "spring" }}
              viewport={{ once: true }}
            >
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <Target className="w-8 h-8" />
              </div>
            </motion.div>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Misyonumuz</h2>
            <p className="text-xl leading-relaxed max-w-4xl mx-auto text-white/90">
              Her şehirde, her mahallede güçlü topluluklar oluşturmak ve insanların gerçek hayatta anlamlı bağlantılar
              kurmasına olanak sağlamak. Teknolojinin gücünü, insani değerleri güçlendirmek için kullanarak, daha
              bağlantılı ve mutlu bir toplum inşa etmek.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}