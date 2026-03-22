import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Store, Shield, ArrowRight, Recycle } from 'lucide-react';

const roles = [
  {
    id: 'customer',
    icon: ShoppingBag,
    title: 'Customer',
    description: 'Recycle your old clothes and earn cash',
    loginPath: '/customer/login',
    gradient: 'from-emerald-500 to-teal-600',
    bgGlow: 'bg-emerald-500/10',
  },
  {
    id: 'shop_owner',
    icon: Store,
    title: 'Shop Owner',
    description: 'Manage your recycling shop and orders',
    loginPath: '/shop/login',
    gradient: 'from-amber-500 to-orange-600',
    bgGlow: 'bg-amber-500/10',
  },
  {
    id: 'admin',
    icon: Shield,
    title: 'Admin',
    description: 'System administration and management',
    loginPath: '/admin/login',
    gradient: 'from-violet-500 to-purple-600',
    bgGlow: 'bg-violet-500/10',
  },
];

const AuthPortalPage = () => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12"
    >
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-10"
      >
        <div className="w-16 h-16 rounded-2xl eco-gradient flex items-center justify-center mx-auto mb-4 eco-shadow">
          <Recycle className="w-8 h-8 text-primary-foreground" />
        </div>
        <h1 className="text-3xl font-extrabold text-foreground mb-2">
          Eco Threads Cash
        </h1>
        <p className="text-muted-foreground max-w-sm mx-auto">
          Choose how you'd like to continue
        </p>
      </motion.div>

      <div className="w-full max-w-sm space-y-4">
        {roles.map((role, i) => (
          <motion.button
            key={role.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 + i * 0.1 }}
            onClick={() => navigate(role.loginPath)}
            className="w-full group relative overflow-hidden rounded-2xl border border-border bg-card p-5 text-left transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
          >
            <div className={`absolute inset-0 ${role.bgGlow} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
            <div className="relative flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${role.gradient} flex items-center justify-center shrink-0 shadow-lg`}>
                <role.icon className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground text-lg">
                  {role.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {role.description}
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0" />
            </div>
          </motion.button>
        ))}
      </div>

      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        onClick={() => navigate('/')}
        className="mt-8 text-sm text-muted-foreground hover:text-primary transition-colors"
      >
        ← Back to Home
      </motion.button>
    </motion.div>
  );
};

export default AuthPortalPage;
