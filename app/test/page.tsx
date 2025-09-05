export default function TestPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Simple Test Page</h1>
      <p>If you can see this, Next.js is working fine.</p>
      <p>The issue is likely in the AuthContext or Firebase connection.</p>
      
      <div className="mt-8 space-y-4">
        <div className="p-4 bg-green-100 rounded">
          <strong>✅ Next.js:</strong> Working
        </div>
        <div className="p-4 bg-green-100 rounded">
          <strong>✅ Routing:</strong> Working
        </div>
        <div className="p-4 bg-green-100 rounded">
          <strong>✅ Tailwind CSS:</strong> Working
        </div>
      </div>

      <div className="mt-8">
        <a 
          href="/debug-bracket" 
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Test Debug Bracket (with Firebase)
        </a>
      </div>
    </div>
  );
}