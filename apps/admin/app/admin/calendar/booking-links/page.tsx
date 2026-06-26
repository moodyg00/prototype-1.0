import { redirect } from 'next/navigation';

// Booking links now live on the consolidated Calendar page.
export default function Page() {
  redirect('/admin/calendar#booking-links');
}
