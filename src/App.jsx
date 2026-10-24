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
    roomType: 'Suite Room (₹2,500/night)',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [bookingConfirmation, setBookingConfirmation] = useState(null);
  const [availability, setAvailability] = useState({
    totalSuites: 5,
    availableSuites: 5,
    maintenanceSuites: 0,
    totalDormBeds: 15,
    availableDormBeds: 15,
    maintenanceDormBeds: 0,
    roomPrices: {
      suitePrice: 2500,
      dormPrice: 450,
    },
  });

  const suitePrice = availability.roomPrices?.suitePrice || 2500;
  const dormPrice = availability.roomPrices?.dormPrice || 450;

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
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === 'checkInDate' || name === 'roomType') {
      setAvailabilityChecked(false);
    }
  };

  const handleCheckAvailability = async (e) => {
    e.preventDefault();
    if (!formData.checkInDate) {
      alert('Please select a Check-in Date to check room availability.');
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

  const selectedAvailableCount = formData.roomType.includes('Suite')
    ? availability.availableSuites
    : availability.availableDormBeds;

  const isSoldOut = selectedAvailableCount <= 0;

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
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const bookingDate = new Date(formData.checkInDate + 'T00:00:00');
    if (bookingDate < today) {
      return 'Check-in date cannot be in the past.';
    }
    if (isSoldOut) {
      return 'Sorry, this accommodation is fully booked or under maintenance on the selected date.';
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
    const amount =
      roomAmounts[formData.roomType] ||
      (formData.roomType.includes('Dormitory') ? dormPrice : suitePrice);
    const fullPhone = formData.phone.startsWith('+')
      ? formData.phone
      : `${formData.countryCode || '+91'} ${formData.phone.trim()}`;

    try {
      const res = await submitCounterBooking({
        name: formData.fullName.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: fullPhone,
        date: formData.checkInDate,
        roomType: formData.roomType,
        amount,
      });

      if (res && res.success) {
        setBookingConfirmation({
          bookingId: res.bookingId,
          name: formData.fullName.trim(),
          email: formData.email.trim(),
          phone: fullPhone,
          date: formData.checkInDate,
          roomType: formData.roomType,
          paymentMethod: 'Pay at Counter / Property',
          status: 'Pending at Check-in',
          amount,
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
      <Navbar />

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
        handleCheckAvailability={handleCheckAvailability}
        handleResetStep={handleResetStep}
        handleBookingSubmit={handleBookingSubmit}
        availability={availability}
        suitePrice={suitePrice}
        dormPrice={dormPrice}
        roomAmounts={roomAmounts}
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
            roomType: 'Suite Room (₹2,500/night)',
          });
        }}
      />
    </div>
  );
}