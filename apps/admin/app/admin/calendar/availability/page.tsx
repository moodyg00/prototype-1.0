import { redirect } from 'next/navigation';

// Availability now lives on the consolidated Calendar page.
export default function Page() {
  redirect('/admin/calendar#availability');
}
