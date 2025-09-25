"use client"

import { motion } from "motion/react"
import { Calendar, Users, MapPin, Heart, Coffee, Palette, Briefcase, Cake, Music, Book } from "lucide-react"
import { ActivityRequestForm } from "@/components/activity-request-form"

const features = [
  {
    icon: Calendar,
    title: "Etkinlik Takvimi",
    description: "Yaklaşan tüm etkinlikleri takip edin ve katılmak istediğinizi işaretleyin.",
  },
  {
    icon: Users,
    title: "Topluluk",
    description: "Benzer ilgi alanlarına sahip insanlarla tanışın ve arkadaşlık kurun.",
  },
  {
    icon: MapPin,
    title: "Yerel Aktiviteler",
    description: "Çevrenizdeki kahve, atölye, oyun ve diğer aktiviteleri keşfedin.",
  },
  {
    icon: Heart,
    title: "Anlamlı Bağlantılar",
    description: "Gerçek hayatta anlamlı ilişkiler kurun ve deneyimler paylaşın.",
  },
]

const activityExamples = [
  {
    icon: Coffee,
    title: "Kahve Sohbetleri",
    description: "Rahat bir ortamda tanışın",
    color: "bg-amber-100 text-amber-600",
  },
  {
    icon: Palette,
    title: "Sanat Atölyeleri",
    description: "Yaratıcılığınızı keşfedin",
    color: "bg-purple-100 text-purple-600",
  },
  {
    icon: Briefcase,
    title: "İş Toplantıları",
    description: "Profesyonel buluşmalar",
    color: "bg-blue-100 text-blue-600",
  },
  {
    icon: Cake,
    title: "Doğum Günleri",
    description: "Özel kutlamalar",
    color: "bg-pink-100 text-pink-600",
  },
  {
    icon: Music,
    title: "Müzik Etkinlikleri",
    description: "Canlı performanslar",
    color: "bg-green-100 text-green-600",
  },
  {
    icon: Book,
    title: "Kitap Kulüpleri",
    description: "Edebiyat sohbetleri",
    color: "bg-indigo-100 text-indigo-600",
  },
]

export function FeatureSection() {
  return (
    <section className="py-24 bg-gradient-to-b from-white to-gray-50">
      <div className="container mx-auto px-4">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl font-medium md:text-4xl lg:text-5xl mb-6">Neden Lokal?</h2>
          <p className="max-w-xl text-muted-foreground mx-auto">
            Yerel topluluklar oluşturmak ve anlamlı bağlantılar kurmak için tasarlandık.
            <br className="hidden md:block" />
            Birlikte daha güzel deneyimler yaşayın.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-24">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              className="text-center p-6 rounded-2xl bg-white shadow-lg hover:shadow-xl transition-shadow duration-300"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <div className="w-16 h-16 bg-[#0015ff]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <feature.icon className="w-8 h-8 text-[#0015ff]" />
              </div>
              <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </motion.div>
          ))}
        </div>

        {/* Activity Request CTA Section */}
        <motion.div
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0015ff]/5 to-[#0015ff]/10 p-12 md:p-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          viewport={{ once: true }}
        >
          {/* Background decorative elements */}
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-[#0015ff]/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-[#0015ff]/5 rounded-full blur-3xl" />
          
          <div className="relative z-10">
            <motion.div
              className="text-center mb-12"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <h3 className="text-3xl md:text-4xl font-bold mb-6">
                Kendi aktivitenizi organize etmek ister misiniz?
              </h3>
              <p className="text-lg md:text-xl text-gray-700 max-w-3xl mx-auto">
                İster bireysel ister kurumsal olsun, hayalinizdeki etkinliği Lokal'de gerçekleştirin.
                Modern ve samimi atmosferimizde unutulmaz anlar yaratın.
              </p>
            </motion.div>

            {/* Activity Examples Grid */}
            <motion.div
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-12"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              viewport={{ once: true }}
            >
              {activityExamples.map((activity, index) => (
                <motion.div
                  key={activity.title}
                  className="text-center"
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                  viewport={{ once: true }}
                  whileHover={{ scale: 1.1 }}
                >
                  <div className={`w-16 h-16 ${activity.color} rounded-2xl flex items-center justify-center mx-auto mb-2 shadow-md`}>
                    <activity.icon className="w-8 h-8" />
                  </div>
                  <h4 className="text-sm font-medium">{activity.title}</h4>
                  <p className="text-xs text-gray-600">{activity.description}</p>
                </motion.div>
              ))}
            </motion.div>

            {/* CTA Button */}
            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              viewport={{ once: true }}
            >
              <ActivityRequestForm />
              <p className="text-sm text-gray-600 mt-4">
                Hemen başvurun, size özel çözümler sunalım!
              </p>
            </motion.div>
          </div>
        </motion.div>

        {/* FAQ-like benefits */}
        <motion.div
          className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <div className="text-center">
            <div className="text-3xl font-bold text-[#0015ff] mb-2">%100</div>
            <h4 className="font-semibold mb-1">Esnek Planlama</h4>
            <p className="text-sm text-gray-600">İhtiyaçlarınıza göre özelleştirilebilir alan düzenlemesi</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-[#0015ff] mb-2">7/24</div>
            <h4 className="font-semibold mb-1">Destek</h4>
            <p className="text-sm text-gray-600">Etkinlik öncesi ve sırasında profesyonel destek</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-[#0015ff] mb-2">50+</div>
            <h4 className="font-semibold mb-1">Kapasite</h4>
            <p className="text-sm text-gray-600">Küçük ve büyük gruplar için uygun alan</p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}