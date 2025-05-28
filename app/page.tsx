import Image from 'next/image';
import { NavBar } from './components/NavBar';
import { auth } from './lib/auth';
import { redirect } from 'next/navigation';

export default async function Home() {
  const session = await auth();
  
  if (session?.user) {
    return redirect('/dashboard');
  }
  
  return (
    <div className="mx-auto max-w-7xl px-2 sm:px-4 lg:px-8">
      <NavBar />
    </div>
  );
}
