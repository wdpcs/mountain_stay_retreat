import { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import AboutSection from './components/AboutSection';
import RoomsSection from './components/RoomsSection';
import BookingWizard from './components/BookingWizard';
import GallerySection from './components/GallerySection';
import ContactSection from './components/ContactSection';
import Footer from './components/Footer';
import BookingModal from './components/BookingModal';
import BookingLookupModal from './components/BookingLookupModal';
import { getRoomAvailability, submitCounterBooking } from './lib/supabase';

const BASE = import.meta.env.BASE_URL || './';
const getAssetUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    return path;
  }
  const cleanPath = path.replace(/^\.?\//, '');
  return BASE.endsWith('/') ? `${BASE}${cleanPath}` : `${BASE}/${cleanPath}`;
};

const suites = [
  {
    id: 1,
    title: 'Executive Suite Room',
    image: getAssetUrl('Images/Rooms/225449353.jpg'),
    description:
      'Luxury suite room with king-size bed, balcony, high-speed Wi-Fi, air conditioning, and scenic hill views.',
    price: '₹2,500 / night',
  },
  {
    id: 2,
    title: 'Family Suite Room',
    image: getAssetUrl('Images/Rooms/1.jpg'),
    description:
      'Spacious suite ideal for families, featuring modern interiors, attached bath, and quiet surroundings.',
    price: '₹2,500 / night',
  },
];

const amenities = [
  'Free High-Speed Wi-Fi',
  '24x7 Reception Desk',
  'Air Conditioned Rooms',
  'Free Secure Parking',
  'Travel & Sightseeing Guidance',
  'Continuous Hot Water Facility',
];

const galleryImages = [
  getAssetUrl('Images/Rooms/225449353.jpg'),
  getAssetUrl('Images/Rooms/1.jpg'),
  getAssetUrl('Images/Rooms/2.jpg'),
  getAssetUrl('Images/Rooms/3.jpg'),
  getAssetUrl('Images/Rooms/4.jpg'),
  getAssetUrl('Images/Rooms/5.jpg'),
  getAssetUrl('Images/Rooms/6.jpeg'),
  getAssetUrl('Images/Rooms/7.jpeg'),
];

const fallbackImage = getAssetUrl('Images/Rooms/1.jpg');

export default function StayFacilityWebsite() {
  const [bookingStep, setBookingStep] = useState(1);
  const [availabilityChecked, setAvailabilityChecked] = useState(false);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    countryCode: '+91',
    phone: '',
    checkInDate: '',
    checkOutDate: '',
    suiteCount: 1,
    dormBedCount: 0,
    roomType: 'Suite Room (₹2,500/night)',
    roomCount: 1,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [bookingConfirmation, setBookingConfirmation] = useState(null);
  const [isLookupOpen, setIsLookupOpen] = useState(false);
  const [availability, setAvailability] = useState(() => {
    let initialPrices = { suitePrice: 2500, dormPrice: 450 };
    let initialFlexi = null;
    try {
      const savedP = localStorage.getItem('wdpcs_base_prices');
      if (savedP) initialPrices = JSON.parse(savedP);
      const savedF = localStorage.getItem('wdpcs_flexi_rates');
      if (savedF) initialFlexi = JSON.parse(savedF);
    } catch {
      // Ignore
    }
    return {
      totalSuites: 5,
      availableSuites: 5,
      maintenanceSuites: 0,
      totalDormBeds: 15,
      availableDormBeds: 15,
      maintenanceDormBeds: 0,
      roomPrices: initialPrices,
      basePrices: initialPrices,
      flexiPricing: initialFlexi,
    };
  });

  const suitePrice = availability.roomPrices?.suitePrice || 2500;
  const dormPrice = availability.roomPrices?.dormPrice || 450;

  const calculateNights = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return 1;
    const d1 = new Date(checkIn + 'T00:00:00');
    const d2 = new Date(checkOut + 'T00:00:00');
    const diff = Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 1;
  };

  const calculateStayTotal = (checkIn, checkOut, roomType, availData) => {
    const isDorm = (roomType || '').includes('Dormitory');
    const baseSuite = availData?.basePrices?.suitePrice || availData?.roomPrices?.suitePrice || 2500;
    const baseDorm = availData?.basePrices?.dormPrice || availData?.roomPrices?.dormPrice || 450;
    const defaultRate = isDorm ? baseDorm : baseSuite;

    if (!checkIn) return defaultRate;

    const inDate = new Date(checkIn + 'T00:00:00');
    const outDate = checkOut
      ? new Date(checkOut + 'T00:00:00')
      : new Date(inDate.getTime() + 86400000);

    const fp = availData?.flexiPricing;
    let total = 0;
    const current = new Date(inDate);

    while (current < outDate) {
      const dStr = current.toISOString().split('T')[0];
      let dayRate = isDorm ? baseDorm : baseSuite;

      if (fp) {
        // 1. Seasonal check
        const activeSeason = (fp.seasonalRules || []).find(
          (rule) => rule.enabled && dStr >= rule.startDate && dStr <= rule.endDate
        );
        if (activeSeason) {
          dayRate = isDorm ? Number(activeSeason.dormPrice) : Number(activeSeason.suitePrice);
        } else if (fp.weekendPricing?.enabled) {
          // 2. Weekend surcharge check
          const dow = current.getDay();
          const weekendDays = fp.weekendPricing.days || [5, 6, 0];
          if (weekendDays.includes(dow)) {
            dayRate = isDorm
              ? Number(fp.weekendPricing.dormPrice)
              : Number(fp.weekendPricing.suitePrice);
          }
        }
      }

      total += dayRate;
      current.setDate(current.getDate() + 1);
    }

    return total > 0 ? total : defaultRate;
  };

  const nights = calculateNights(formData.checkInDate, formData.checkOutDate);
  const suiteCount = Math.max(0, Number(formData.suiteCount) || 0);
  const dormBedCount = Math.max(0, Number(formData.dormBedCount) || 0);
  const totalUnits = suiteCount + dormBedCount;

  // Single unit stay totals for each category
  const singleSuiteTotal = calculateStayTotal(
    formData.checkInDate,
    formData.checkOutDate,
    'Suite Room',
    availability
  );
  const singleDormTotal = calculateStayTotal(
    formData.checkInDate,
    formData.checkOutDate,
    'Dormitory Bed',
    availability
  );

  const suiteSubtotal = singleSuiteTotal * suiteCount;
  const dormSubtotal = singleDormTotal * dormBedCount;
  const totalAmount = suiteSubtotal + dormSubtotal;
  const ratePerNight = Math.round(totalAmount / (nights * Math.max(1, totalUnits)));

  const formattedAccommodation = (() => {
    if (suiteCount > 0 && dormBedCount > 0) {
      return `${suiteCount} Suite ${suiteCount === 1 ? 'Room' : 'Rooms'} + ${dormBedCount} Dormitory ${dormBedCount === 1 ? 'Bed' : 'Beds'}`;
    }
    if (suiteCount > 0) {
      return `${suiteCount} Suite ${suiteCount === 1 ? 'Room' : 'Rooms'} (₹${suitePrice.toLocaleString('en-IN')}/night)`;
    }
    if (dormBedCount > 0) {
      return `${dormBedCount} Dormitory ${dormBedCount === 1 ? 'Bed' : 'Beds'} (₹${dormPrice.toLocaleString('en-IN')}/night)`;
    }
    return '1 Suite Room (₹2,500/night)';
  })();

  const roomAmounts = {
    'Suite Room (₹2,500/night)': suitePrice,
    'Dormitory Bed (₹450/night)': dormPrice,
    [`Suite Room (₹${suitePrice.toLocaleString('en-IN')}/night)`]: suitePrice,
    [`Dormitory Bed (₹${dormPrice.toLocaleString('en-IN')}/night)`]: dormPrice,
  };

  const fetchAvailability = useCallback(async (dateStr = '') => {
    try {
      const data = await getRoomAvailability(dateStr);
      if (data && typeof data === 'object') {
        setAvailability((prev) => ({ ...prev, ...data }));
        return data;
      }
    } catch (err) {
      console.warn('Availability fetch notification:', err);
    }
    return null;
  }, []);

  useEffect(() => {
    let isMounted = true;
    fetchAvailability(formData.checkInDate).then((data) => {
      if (isMounted && data) {
        setAvailability((prev) => ({ ...prev, ...data }));
      }
    });

    return () => {
      isMounted = false;
    };
  }, [formData.checkInDate, fetchAvailability]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      if (name === 'checkInDate' && value) {
        const inDate = new Date(value + 'T00:00:00');
        const defaultOutDate = new Date(inDate.getTime() + 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0];
        if (!next.checkOutDate || next.checkOutDate <= value) {
          next.checkOutDate = defaultOutDate;
        }
      }
      return next;
    });
    if (name === 'checkInDate' || name === 'checkOutDate' || name === 'roomType' || name === 'roomCount' || name === 'suiteCount' || name === 'dormBedCount') {
      setAvailabilityChecked(false);
    }
  };

  const handleSuiteCountChange = (val) => {
    const nextCount = Math.max(0, Math.min(availability.availableSuites, Number(val) || 0));
    setFormData((prev) => ({ ...prev, suiteCount: nextCount }));
    setAvailabilityChecked(false);
  };

  const handleDormCountChange = (val) => {
    const nextCount = Math.max(0, Math.min(availability.availableDormBeds, Number(val) || 0));
    setFormData((prev) => ({ ...prev, dormBedCount: nextCount }));
    setAvailabilityChecked(false);
  };

  const handleCheckAvailability = async (e) => {
    e.preventDefault();
    if (!formData.checkInDate) {
      alert('Please select a Check-in Date.');
      return;
    }
    if (!formData.checkOutDate) {
      alert('Please select a Check-out Date.');
      return;
    }
    if (formData.checkOutDate <= formData.checkInDate) {
      alert('Check-out date must be after Check-in date (at least 1 night stay).');
      return;
    }
    if (totalUnits < 1) {
      alert('Please select at least 1 Suite Room or 1 Dormitory Bed.');
      return;
    }

    setCheckingAvailability(true);
    await fetchAvailability(formData.checkInDate);
    setCheckingAvailability(false);
    setAvailabilityChecked(true);
  };

  const handleResetStep = () => {
    setBookingStep(1);
    setAvailabilityChecked(false);
  };

  const isSoldOut =
    (availability.availableSuites <= 0 && availability.availableDormBeds <= 0) ||
    (suiteCount > availability.availableSuites) ||
    (dormBedCount > availability.availableDormBeds);

  const selectedAvailableCount =
    suiteCount > 0 && dormBedCount > 0
      ? Math.min(availability.availableSuites, availability.availableDormBeds)
      : suiteCount > 0
      ? availability.availableSuites
      : availability.availableDormBeds;

  const validateGuestForm = () => {
    if (!formData.fullName || formData.fullName.trim().length < 2) {
      return 'Please enter your full name (minimum 2 characters).';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email || !emailRegex.test(formData.email.trim())) {
      return 'Please enter a valid email address (e.g. yourname@gmail.com).';
    }
    const rawDigits = (formData.phone || '').replace(/\D/g, '');
    if (!formData.phone || rawDigits.length < 7) {
      return 'Please enter a valid contact phone number with at least 7 digits.';
    }
    if (!formData.checkInDate) {
      return 'Please select a valid check-in date.';
    }
    if (!formData.checkOutDate) {
      return 'Please select a valid check-out date.';
    }
    if (formData.checkOutDate <= formData.checkInDate) {
      return 'Check-out date must be after check-in date (at least 1 night).';
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const bookingDate = new Date(formData.checkInDate + 'T00:00:00');
    if (bookingDate < today) {
      return 'Check-in date cannot be in the past.';
    }
    if (totalUnits < 1) {
      return 'Please select at least 1 Suite Room or 1 Dormitory Bed.';
    }
    if (suiteCount > availability.availableSuites) {
      return `Only ${availability.availableSuites} Executive Suite(s) available on the selected date. Please reduce suite count.`;
    }
    if (dormBedCount > availability.availableDormBeds) {
      return `Only ${availability.availableDormBeds} Dormitory Bed(s) available on the selected date. Please reduce bed count.`;
    }
    return null;
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    setBookingError('');

    const validationError = validateGuestForm();
    if (validationError) {
      setBookingError(validationError);
      alert(`⚠️ Validation Notice:\n${validationError}`);
      return;
    }

    setIsSubmitting(true);
    const fullPhone = formData.phone.startsWith('+')
      ? formData.phone
      : `${formData.countryCode || '+91'} ${formData.phone.trim()}`;

    try {
      const res = await submitCounterBooking({
        name: formData.fullName.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: fullPhone,
        date: formData.checkInDate,
        checkInDate: formData.checkInDate,
        checkOutDate: formData.checkOutDate,
        nights,
        suiteCount,
        dormBedCount,
        roomType: formattedAccommodation,
        roomCount: totalUnits,
        amount: totalAmount,
        ratePerNight,
      });

      if (res && res.success) {
        setBookingConfirmation({
          bookingId: res.bookingId,
          name: formData.fullName.trim(),
          email: formData.email.trim(),
          phone: fullPhone,
          date: formData.checkInDate,
          checkInDate: formData.checkInDate,
          checkOutDate: formData.checkOutDate,
          nights,
          suiteCount,
          dormBedCount,
          roomType: formattedAccommodation,
          roomCount: totalUnits,
          paymentMethod: 'Pay at Counter / Property',
          status: 'Pending at Check-in',
          amount: totalAmount,
          ratePerNight,
          syncedToCloud: res.syncedToCloud,
        });

        // Refresh live availability count
        fetchAvailability(formData.checkInDate);
      } else {
        throw new Error(res?.error || 'Unable to record reservation.');
      }
    } catch (err) {
      const msg = err.message || 'Booking reservation could not be completed. Please try again.';
      setBookingError(msg);
      alert(`⚠️ Reservation Notice:\n${msg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      <Navbar onOpenLookup={() => setIsLookupOpen(true)} />

      <Hero bgImage={getAssetUrl('Images/Rooms/7.jpeg')} />

      <AboutSection
        aboutImage={getAssetUrl('Images/Rooms/7.jpeg')}
        fallbackImage={fallbackImage}
        amenities={amenities}
      />

      <RoomsSection
        suites={suites}
        availability={availability}
        suitePrice={suitePrice}
        dormPrice={dormPrice}
        dormImage={getAssetUrl('Images/Dormitory/Dormitory1.JPG')}
        fallbackImage={fallbackImage}
      />

      <BookingWizard
        bookingStep={bookingStep}
        setBookingStep={setBookingStep}
        availabilityChecked={availabilityChecked}
        checkingAvailability={checkingAvailability}
        formData={formData}
        handleInputChange={handleInputChange}
        handleSuiteCountChange={handleSuiteCountChange}
        handleDormCountChange={handleDormCountChange}
        suiteCount={suiteCount}
        dormBedCount={dormBedCount}
        totalUnits={totalUnits}
        singleSuiteTotal={singleSuiteTotal}
        singleDormTotal={singleDormTotal}
        suiteSubtotal={suiteSubtotal}
        dormSubtotal={dormSubtotal}
        formattedAccommodation={formattedAccommodation}
        handleCheckAvailability={handleCheckAvailability}
        handleResetStep={handleResetStep}
        handleBookingSubmit={handleBookingSubmit}
        onOpenLookup={() => setIsLookupOpen(true)}
        availability={availability}
        suitePrice={suitePrice}
        dormPrice={dormPrice}
        roomAmounts={roomAmounts}
        nights={nights}
        ratePerNight={ratePerNight}
        totalAmount={totalAmount}
        isSoldOut={isSoldOut}
        selectedAvailableCount={selectedAvailableCount}
        bookingError={bookingError}
        isSubmitting={isSubmitting}
      />

      <GallerySection
        galleryImages={galleryImages}
        fallbackImage={fallbackImage}
      />

      <ContactSection />

      <Footer />

      <BookingModal
        bookingConfirmation={bookingConfirmation}
        onClose={() => {
          setBookingConfirmation(null);
          setBookingStep(1);
          setAvailabilityChecked(false);
          setFormData({
            fullName: '',
            email: '',
            countryCode: '+91',
            phone: '',
            checkInDate: '',
            checkOutDate: '',
            suiteCount: 1,
            dormBedCount: 0,
            roomType: 'Suite Room (₹2,500/night)',
            roomCount: 1,
          });
        }}
      />

      <BookingLookupModal
        isOpen={isLookupOpen}
        onClose={() => setIsLookupOpen(false)}
      />
    </div>
  );
}