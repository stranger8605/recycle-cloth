import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Recycle, Leaf, IndianRupee, Users, ArrowRight,
  Banknote, TreePine, Truck, ShieldCheck, Zap, Heart,
  Sparkles, TrendingUp, Globe2, HandCoins
} from 'lucide-react';


const stats = [
  { icon: Recycle, value: '10K+', label: 'Clothes Recycled' },
  { icon: Users, value: '500+', label: 'Happy Users' },
  { icon: IndianRupee, value: '₹5L+', label: 'Earned by Users' },
];

const benefits = [
  {
    icon: Banknote,
    title: 'Earn Instant Cash',
    desc: 'Turn your old clothes into money. Earn up to ₹150 per piece based on quality and type.',
    gradient: 'from-emerald-500 to-teal-600',
    glow: 'group-hover:shadow-emerald-500/25',
  },
  {
    icon: TreePine,
    title: 'Save the Planet',
    desc: 'Every item recycled reduces landfill waste and carbon emissions. Make a real impact.',
    gradient: 'from-green-500 to-lime-600',
    glow: 'group-hover:shadow-green-500/25',
  },
  {
    icon: Truck,
    title: 'Free Doorstep Pickup',
    desc: 'No need to travel. Our verified shops come to you at your chosen date and time.',
    gradient: 'from-sky-500 to-cyan-600',
    glow: 'group-hover:shadow-sky-500/25',
  },
  {
    icon: ShieldCheck,
    title: 'Verified Shops Only',
    desc: 'All recycling shops are verified and rated. Your clothes are in safe, trusted hands.',
    gradient: 'from-violet-500 to-purple-600',
    glow: 'group-hover:shadow-violet-500/25',
  },
  {
    icon: Zap,
    title: 'Fast & Easy Process',
    desc: 'Complete the entire process in under 2 minutes. Simple steps, instant confirmation.',
    gradient: 'from-amber-500 to-orange-600',
    glow: 'group-hover:shadow-amber-500/25',
  },
  {
    icon: Heart,
    title: '100% Satisfaction',
    desc: 'Transparent pricing, no hidden charges. What you see is what you earn.',
    gradient: 'from-rose-500 to-pink-600',
    glow: 'group-hover:shadow-rose-500/25',
  },
];

const impactStats = [
  { icon: Globe2, value: '2.5 Tonnes', label: 'CO₂ Saved', color: 'text-emerald-500' },
  { icon: TrendingUp, value: '98%', label: 'Satisfaction Rate', color: 'text-sky-500' },
  { icon: HandCoins, value: '₹850', label: 'Avg. Earning/User', color: 'text-amber-500' },
  { icon: Sparkles, value: '24hrs', label: 'Avg. Pickup Time', color: 'text-violet-500' },
];

const HomePage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src="/images/hero-recycle.jpg" alt="Cloth recycling" className="w-full h-full object-cover" fetchPriority="high" sizes="100vw" />
          <div className="absolute inset-0 bg-gradient-to-b from-foreground/70 via-foreground/50 to-background" />
        </div>
        <div className="relative container max-w-lg mx-auto px-4 pt-16 pb-24 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 bg-primary/20 backdrop-blur-sm text-primary-foreground px-4 py-1.5 rounded-full text-sm font-medium mb-6">
              <Leaf className="w-4 h-4" />
              Eco-Friendly Initiative
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-primary-foreground leading-tight mb-4">
              Recycle Your Old Clothes
            </h1>
            <p className="text-xl text-primary-foreground/80 font-medium mb-2">
              Earn Cash & Help the Environment!
            </p>
            <p className="text-primary-foreground/60 mb-8 max-w-sm mx-auto">
              Give your old clothes a second life. We connect you with verified recycling shops near you.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-3 justify-center"
          >
            <button
              onClick={() => navigate('/auth')}
              className="px-8 py-3.5 rounded-xl font-bold text-primary-foreground eco-gradient eco-shadow-lg text-lg flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
            >
              Start Recycling Now
              <ArrowRight className="w-5 h-5" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="container max-w-lg mx-auto px-4 -mt-10 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-card rounded-2xl eco-shadow p-6 grid grid-cols-3 gap-4"
        >
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <stat.icon className="w-6 h-6 text-primary mx-auto mb-1" />
              <div className="text-xl font-bold text-foreground">{stat.value}</div>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Customer Benefits */}
      <section className="container max-w-2xl mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 bg-accent text-accent-foreground px-4 py-1.5 rounded-full text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            Customer Benefits
          </div>
          <h2 className="text-3xl font-extrabold text-foreground mb-3">
            Why Customers <span className="eco-text-gradient">Love Us</span>
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            We make recycling rewarding, easy, and impactful. Here's what you get when you choose Eco Threads.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {benefits.map((benefit, i) => (
            <motion.div
              key={benefit.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className={`group relative bg-card rounded-2xl p-5 border border-border hover:border-transparent transition-all duration-300 hover:shadow-xl ${benefit.glow} cursor-default overflow-hidden`}
            >
              {/* Subtle gradient overlay on hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${benefit.gradient} opacity-0 group-hover:opacity-[0.04] transition-opacity duration-300 rounded-2xl`} />

              <div className="relative flex gap-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${benefit.gradient} flex items-center justify-center shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <benefit.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-base mb-1 group-hover:text-primary transition-colors">
                    {benefit.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {benefit.desc}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Impact Stats */}
      <section className="container max-w-2xl mx-auto px-4 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="bg-gradient-to-br from-card via-card to-accent/30 rounded-2xl border border-border p-8"
        >
          <h3 className="text-lg font-bold text-foreground text-center mb-6">
            Our Impact in Numbers
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {impactStats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.1 + i * 0.1 }}
                className="text-center"
              >
                <stat.icon className={`w-7 h-7 mx-auto mb-2 ${stat.color}`} />
                <div className="text-xl font-extrabold text-foreground">{stat.value}</div>
                <div className="text-xs text-muted-foreground font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* How it works */}
      <section className="container max-w-lg mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-foreground text-center mb-8">
          How It Works
        </h2>
        <div className="space-y-4">
          {[
            { step: '1', title: 'Select Your Clothes', desc: 'Choose the types and quantities of clothes you want to recycle' },
            { step: '2', title: 'Pick a Shop', desc: 'Select from verified recycling shops in your district' },
            { step: '3', title: 'Schedule Pickup', desc: 'Set your preferred date and time for pickup' },
            { step: '4', title: 'Get Paid!', desc: 'Receive cash via your preferred payment method' },
          ].map((item, i) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="flex items-start gap-4 bg-card rounded-xl p-4 border border-border"
            >
              <div className="w-10 h-10 rounded-full eco-gradient flex items-center justify-center text-primary-foreground font-bold shrink-0">
                {item.step}
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container max-w-lg mx-auto px-4 pb-12">
        <div className="eco-gradient-hero rounded-2xl p-8 text-center">
          <Recycle className="w-12 h-12 text-primary-foreground/80 mx-auto mb-4 animate-spin-slow" />
          <h2 className="text-2xl font-bold text-primary-foreground mb-2">
            Ready to Make a Difference?
          </h2>
          <p className="text-primary-foreground/70 mb-6">
            Join thousands of users recycling their clothes responsibly.
          </p>
          <button
            onClick={() => navigate('/auth')}
            className="px-8 py-3 rounded-xl font-bold bg-card text-foreground hover:bg-accent transition-colors"
          >
            Get Started →
          </button>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
