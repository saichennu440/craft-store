import React from 'react'
import { motion } from 'framer-motion'
import { Heart, Users, Award, Leaf, Palette, Globe } from 'lucide-react'

export const AboutPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-craft-50 via-background to-craft-100 py-20">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23D2691E' fill-opacity='0.4'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl sm:text-6xl font-display font-bold text-gray-900 mb-6"
          >
            About <span className="text-primary-600">Clay 2 Crafts</span>
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-gray-600 mb-8"
          >
            Connecting artisans with craft lovers worldwide, one handmade piece at a time.
          </motion.p>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-display font-bold text-gray-900 mb-6">Our Story</h2>
            <div className="prose prose-lg mx-auto text-gray-600">
              <p>
                Founded in 2023, Clay 2 Crafts began as a passion project to bridge the gap between 
                talented artisans and people who appreciate authentic, handmade crafts. We believe 
                that every handcrafted item tells a story – of tradition, skill, creativity, and love.
              </p>
              <p>
                Our platform celebrates the art of making things by hand, supporting local artisans 
                and preserving traditional crafting techniques while making them accessible to a 
                global audience.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 bg-craft-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-display font-bold text-gray-900 mb-4">Our Values</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              These core values guide everything we do at Clay 2 Crafts
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Heart,
                title: 'Passion for Crafts',
                description: 'We celebrate the artistry and dedication that goes into every handmade piece.'
              },
              {
                icon: Users,
                title: 'Community First',
                description: 'Building a supportive community of artisans and craft enthusiasts worldwide.'
              },
              {
                icon: Award,
                title: 'Quality Excellence',
                description: 'Every product meets our high standards for craftsmanship and authenticity.'
              },
              {
                icon: Leaf,
                title: 'Sustainability',
                description: 'Promoting eco-friendly practices and sustainable crafting methods.'
              },
              {
                icon: Palette,
                title: 'Creative Expression',
                description: 'Encouraging artistic innovation while honoring traditional techniques.'
              },
              {
                icon: Globe,
                title: 'Global Reach',
                description: 'Connecting local artisans with customers around the world.'
              }
            ].map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white p-6 rounded-lg shadow-sm text-center"
              >
                <div className="w-16 h-16 mx-auto mb-4 bg-primary-100 rounded-full flex items-center justify-center">
                  <value.icon className="text-primary-600" size={32} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {value.title}
                </h3>
                <p className="text-gray-600">
                  {value.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2 className="text-3xl font-display font-bold text-gray-900 mb-6">Our Mission</h2>
            <div className="bg-craft-50 p-8 rounded-lg">
              <p className="text-lg text-gray-700 leading-relaxed">
                "To create a thriving marketplace where artisans can showcase their talents, 
                preserve traditional crafts, and build sustainable livelihoods while bringing 
                unique, handmade treasures to people who value authenticity and craftsmanship."
              </p>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}