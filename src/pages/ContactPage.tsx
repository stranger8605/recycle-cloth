import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRecycle } from '@/context/RecycleContext';
import StepLayout from '@/components/StepLayout';
import { MapPin, Phone, Calendar, Clock } from 'lucide-react';

const ContactPage = () => {
  const navigate = useNavigate();
  const { state, update } = useRecycle();
  const [address, setAddress] = useState(state.address);
  const [contactPhone, setContactPhone] = useState(state.contactPhone || '');
  const [pickupDate, setPickupDate] = useState(state.pickupDate);
  const [pickupTime, setPickupTime] = useState(state.pickupTime);

  const handleNext = () => {
    update({ address, contactPhone, pickupDate, pickupTime });
    navigate('/quantity');
  };

  const isValid = address && address.trim().length > 0 && /^[0-9]{10}$/.test(contactPhone) && pickupDate && pickupTime;

  return (
    <StepLayout
      step={5}
      totalSteps={8}
      title="Contact Details"
      subtitle="Where should we pick up?"
      onNext={handleNext}
      onBack={() => navigate('/shops')}
      nextDisabled={!isValid}
    >
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" /> Full Address
          </label>
          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value.slice(0, 500))}
            placeholder="Door No, Street, Area, City"
            rows={3}
            maxLength={500}
            className="w-full px-4 py-3 rounded-xl border border-input bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 flex items-center gap-2">
            <Phone className="w-4 h-4 text-primary" /> Phone Number
          </label>
          <input
            type="tel"
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value.replace(/\D/g, ''))}
            placeholder="Your phone number"
            maxLength={10}
            className="w-full px-4 py-3 rounded-xl border border-input bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" /> Pickup Date
            </label>
            <input
              type="date"
              value={pickupDate}
              onChange={(e) => setPickupDate(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-input bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" /> Pickup Time
            </label>
            <select
              value={pickupTime}
              onChange={(e) => setPickupTime(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-input bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Select time</option>
              <option value="9am-12pm">9 AM - 12 PM</option>
              <option value="12pm-3pm">12 PM - 3 PM</option>
              <option value="3pm-6pm">3 PM - 6 PM</option>
              <option value="6pm-9pm">6 PM - 9 PM</option>
            </select>
          </div>
        </div>

        {/* Map placeholder */}
        <div className="bg-muted rounded-xl h-40 flex items-center justify-center border border-border">
          <div className="text-center text-muted-foreground">
            <MapPin className="w-8 h-8 mx-auto mb-2" />
            <p className="text-sm">Map preview</p>
          </div>
        </div>
      </div>
    </StepLayout>
  );
};

export default ContactPage;
