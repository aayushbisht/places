'use client';

import SearchBar from './components/SearchBar';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a0a]">
      <div className="text-center p-8 max-w-md w-full mx-4">
        <h1 className="text-3xl font-light mb-12 text-white">Where do you want to go?</h1>
        <SearchBar />
      </div>
    </main>
  );
}
