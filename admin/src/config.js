export const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || 'https://djbizcrfqqurtfwiivds.supabase.co';

export const SUPABASE_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_l3CBp7BV49BdGVfsOKQ2HA_3vXO3eP8';

export const SOCIETY_INFO = {
  name: 'Wayanad District Police Co-operative Society Ltd. No. W 208',
  property: 'Mountain Stay Retreat',
  location:
    'Kalpetta North Post, Opposite to Skyface Apartment, SP office Road, Wayanad, Kerala. 673122',
  contactPhone: '+91 70250 17611',
  managerPhone: '+91 83019 95940',
  receptionPhone: '+91 70250 17611',
  domains: {
    guest: 'https://rooms.wdpcs.in',
    admin: 'https://roomsadmin.wdpcs.in',
    api: 'https://api.wdpcs.in',
  },
};
