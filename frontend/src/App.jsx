import './App.css'

function App() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <header className="max-w-4xl mx-auto mb-10">
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
          Community Collaboration <span className="text-blue-600">& Resource Platform</span>
        </h1>
        <p className="mt-2 text-lg text-slate-600">
          Welcome! Share resources and collaborate with your team.
        </p>
      </header>

      <main className="max-w-4xl mx-auto grid gap-6 md:grid-cols-2">
        {/* Placeholder for Resource Card */}
        <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
          <h2 className="text-xl font-bold text-slate-800">Resource Library</h2>
          <p className="text-slate-500 mt-2">Access shared documents and tools.</p>
          <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">
            View Resources
          </button>
        </div>

        {/* Placeholder for Collaboration Hub */}
        <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
          <h2 className="text-xl font-bold text-slate-800">Collaboration Hub</h2>
          <p className="text-slate-500 mt-2">Connect with other community members.</p>
          <button className="mt-4 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50">
            Open Chat
          </button>
        </div>
      </main>
    </div>
  )
}

export default App