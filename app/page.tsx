export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center">
      <div className="text-center p-8 max-w-md w-full mx-4">
        <h1 className="text-3xl font-light mb-12">Where do you want to go?</h1>
        <div className="relative">
          <input
            type="text"
            placeholder="Enter city name..."
            className="w-full px-4 py-3 border border-gray-300 focus:border-gray-500 focus:outline-none text-lg"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
            🔍
          </div>
        </div>
      </div>
    </main>
  );
}
