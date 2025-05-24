import Image from 'next/image';
import { NavBar } from './components/NavBar';

export default function Home() {
return (
    <div className="mx-auto max-w-7xl px-2 sm:px-4 lg:px-8">
      <NavBar />
    </div>
  );
}
